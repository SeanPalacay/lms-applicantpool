<?php
// lms-forbes/backend/api/trainee/milestone_progress.php
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
    $query = "SELECT mp.id, m.title, m.description, p.title AS program_title, m.due_date, mp.status, mp.completion_date
              FROM milestone_progress mp
              JOIN milestones m ON mp.milestone_id = m.id
              JOIN programs p ON m.program_id = p.id
              WHERE mp.user_id = :userId
              ORDER BY m.due_date ASC";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($milestones);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>