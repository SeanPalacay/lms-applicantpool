<?php
// lms-forbes/backend/api/trainer/update_quiz_status.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
  http_response_code(401);
  echo json_encode(['error' => 'Authentication required']);
  exit;
}

$token = $matches[1];
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid token format']);
  exit;
}

list($trainerId, $timestamp) = explode(':', $decodedToken);
if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
  exit;
}

$query = "SELECT role FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $trainerId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] !== 'trainer') {
  http_response_code(403);
  echo json_encode(['error' => 'Permission denied']);
  exit;
}

$quizId = isset($_GET['quizId']) ? (int)$_GET['quizId'] : 0;
if ($quizId <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid quiz ID']);
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['status']) || !in_array($data['status'], ['draft', 'active'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid status value']);
  exit;
}

$query = "
  SELECT q.id 
  FROM quizzes q 
  JOIN programs p ON q.program_id = p.id 
  WHERE q.id = :quizId AND p.created_by = :trainerId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
$stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
$stmt->execute();
if (!$stmt->fetch()) {
  http_response_code(403);
  echo json_encode(['error' => 'Quiz not found or not owned by trainer']);
  exit;
}

try {
  $query = "UPDATE quizzes SET status = :status WHERE id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->execute([
    ':status' => $data['status'],
    ':quizId' => $quizId
  ]);

  http_response_code(200);
  echo json_encode(['message' => 'Quiz status updated successfully']);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Failed to update quiz status: ' . $e->getMessage()]);
}
exit;
?>