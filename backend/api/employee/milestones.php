<?php
// lms-forbes/backend/api/employee/milestones.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Decode token (base64-encoded "userId:timestamp")
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}

list($userId, $timestamp) = explode(':', $decodedToken);

// Validate token components and expiration (24 hours)
if (!ctype_digit($userId) || !ctype_digit($timestamp) || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

// Verify user role
try {
    $query = "SELECT id, role FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Allow only employee role for this endpoint
    if ($user['role'] !== 'employee') {
        http_response_code(403);
        echo json_encode([
            'error' => 'Permission denied',
            'detail' => 'This endpoint is for employees only'
        ]);
        exit;
    }

    // Fetch all milestones for the user across all programs
    $query = "
        SELECT 
            m.id, 
            m.title, 
            p.title as program_title,
            m.description, 
            m.due_date,
            mp.status, 
            mp.completion_date
        FROM milestones m
        JOIN programs p ON m.program_id = p.id
        LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = :userId
        JOIN program_enrollments pe ON p.id = pe.program_id AND pe.user_id = :userId
        ORDER BY mp.status = 'completed' ASC, m.due_date ASC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format dates and ensure consistent structure
    foreach ($milestones as &$milestone) {
        // Format due date
        if (!empty($milestone['due_date'])) {
            $milestone['date'] = $milestone['due_date'];
        }
        
        // Default status if null
        $milestone['status'] = $milestone['status'] ?: 'not_started';
    }

    http_response_code(200);
    echo json_encode($milestones);

} catch (PDOException $e) {
    error_log("Database error in employee_milestones.php: " . $e->getMessage() . " | User ID: $userId");
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
    error_log("General error in employee_milestones.php: " . $e->getMessage() . " | User ID: $userId");
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while fetching milestones']);
}
?>