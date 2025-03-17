<?php
// lms-forbes/backend/api/trainer/update_quiz.php
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
if (!$data || !isset($data['title']) || !isset($data['program_id'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid input']);
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

$pdo->beginTransaction();

try {
  $query = "
    UPDATE quizzes 
    SET 
      title = :title,
      description = :description,
      program_id = :program_id,
      time_limit = :time_limit,
      passing_score = :passing_score,
      status = :status
    WHERE id = :quizId
  ";
  $stmt = $pdo->prepare($query);
  $stmt->execute([
    ':title' => $data['title'],
    ':description' => $data['description'] ?? null,
    ':program_id' => $data['program_id'],
    ':time_limit' => $data['time_limit'],
    ':passing_score' => $data['passing_score'],
    ':status' => $data['status'] ?? 'draft',
    ':quizId' => $quizId
  ]);

  $query = "DELETE FROM quiz_questions WHERE quiz_id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
  $stmt->execute();

  if (!empty($data['questions'])) {
    foreach ($data['questions'] as $question) {
      $query = "
        INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
        VALUES (:quiz_id, :question_text, :option_a, :option_b, :option_c, :option_d, :correct_answer)
      ";
      $stmt = $pdo->prepare($query);
      $stmt->execute([
        ':quiz_id' => $quizId,
        ':question_text' => $question['question_text'],
        ':option_a' => $question['option_a'],
        ':option_b' => $question['option_b'],
        ':option_c' => $question['option_c'] ?? null,
        ':option_d' => $question['option_d'] ?? null,
        ':correct_answer' => $question['correct_answer']
      ]);
    }
  }

  $pdo->commit();
  http_response_code(200);
  echo json_encode(['message' => 'Quiz updated successfully']);
} catch (Exception $e) {
  $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['error' => 'Failed to update quiz: ' . $e->getMessage()]);
}
exit;
?>