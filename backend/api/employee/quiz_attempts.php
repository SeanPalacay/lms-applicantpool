<?php
// lms-forbes/backend/api/employee/quiz_attempts.php
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

// Decode token
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

try {
    // Verify user role
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

    // Fetch quiz attempts with quiz and program details
    $query = "
        SELECT 
            qa.id, 
            qa.quiz_id,
            q.title AS quiz_title, 
            p.title AS program_title,
            q.passing_score,
            qa.score, 
            qa.time_taken,
            qa.attempt_date, 
            qa.feedback
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        LEFT JOIN programs p ON q.program_id = p.id
        WHERE qa.user_id = :userId
        ORDER BY qa.attempt_date DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $quizAttempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($quizAttempts);

} catch (PDOException $e) {
    error_log("Database error in employee_quiz_attempts.php: " . $e->getMessage() . " | User ID: $userId");
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
    error_log("General error in employee_quiz_attempts.php: " . $e->getMessage() . " | User ID: $userId");
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while fetching quiz attempts']);
}
?>