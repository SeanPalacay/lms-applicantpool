<?php
// lms-forbes/backend/api/trainee/quiz_attempts.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$headers = getallheaders();
if (!preg_match('/Bearer\s(\S+)/', $headers['Authorization'] ?? '', $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$token = $matches[1];
$decoded = base64_decode($token);
if ($decoded === false || strpos($decoded, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}

list($userId, $timestamp) = explode(':', $decoded);
if (time() - $timestamp > 24 * 60 * 60) {
    http_response_code(401);
    echo json_encode(['error' => 'Token expired']);
    exit;
}

try {
    $query = "SELECT qa.id, qa.quiz_id, q.title AS quiz_title, p.title AS program_title, qa.score, q.passing_score, qa.attempt_date
              FROM quiz_attempts qa
              JOIN quizzes q ON qa.quiz_id = q.id
              JOIN programs p ON q.program_id = p.id
              WHERE qa.user_id = :userId
              ORDER BY qa.attempt_date DESC";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($attempts);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>