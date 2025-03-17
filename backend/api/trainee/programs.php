<?php
// lms-forbes/backend/api/trainee/programs.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR | E_WARNING);

header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Extract and validate token
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required', 'detail' => 'Missing or malformed Authorization header']);
    exit;
}

$token = $matches[1];
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}

list($userId, $timestamp) = explode(':', $decodedToken);
if (!is_numeric($userId) || !is_numeric($timestamp) || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

try {
    // Verify user exists and is a trainee
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

    if ($user['role'] !== 'trainee') { // Restrict to trainees only
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied', 'detail' => 'This endpoint is for trainees only']);
        exit;
    }

    // Get trainee's programs
    $query = "
        SELECT p.id, p.title, p.description, p.type, 
               pe.enrollment_date, pe.completion_status, 
               COALESCE(pe.completion_percentage, 0) AS completion_percentage
        FROM programs p
        JOIN program_enrollments pe ON p.id = pe.program_id
        WHERE pe.user_id = :userId
        ORDER BY pe.enrollment_date DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Log success for debugging
    error_log("Programs fetched successfully for user $userId: " . count($programs) . " programs");

    http_response_code(200);
    echo json_encode($programs);
} catch (PDOException $e) {
    error_log("Database error in trainee_programs.php for user $userId: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred', 'detail' => 'Please contact support']);
} catch (Exception $e) {
    error_log("Unexpected error in trainee_programs.php for user $userId: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred', 'detail' => 'Please try again later']);
}
?>