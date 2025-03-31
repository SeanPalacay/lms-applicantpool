<?php
// lms-forbes/backend/api/trainee/update_milestone.php
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$milestoneId = $input['milestone_id'] ?? null;
$status = $input['status'] ?? null;

if (!$milestoneId || !$status || !in_array($status, ['not_started', 'in_progress', 'completed'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid milestone ID or status']);
    exit;
}

try {
    $query = "UPDATE milestone_progress 
              SET status = :status, completion_date = :completion_date 
              WHERE id = :milestoneId AND user_id = :userId";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':status', $status);
    $completionDate = $status === 'completed' ? date('Y-m-d H:i:s') : null;
    $stmt->bindParam(':completion_date', $completionDate);
    $stmt->bindParam(':milestoneId', $milestoneId, PDO::PARAM_INT);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Milestone not found or not assigned to you']);
        exit;
    }

    http_response_code(200);
    echo json_encode(['message' => 'Milestone updated successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>