<?php
// lms-forbes/backend/api/trainer/delete_quiz.php
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

// Get quizId from URL parameter
if (!isset($_GET['quizId']) || empty($_GET['quizId'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Quiz ID is required']);
  exit;
}

$quizId = $_GET['quizId'];

// Verify trainer owns the quiz
$query = "SELECT id FROM quizzes WHERE id = :quizId AND created_by = :trainerId";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
$stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
$stmt->execute();
if (!$stmt->fetch()) {
  http_response_code(403);
  echo json_encode(['error' => 'Quiz not found or not owned by trainer']);
  exit;
}

// Begin transaction for safe deletion
$pdo->beginTransaction();

try {
  // Delete from dependent tables first
  
  // 1. Delete quiz attempt answers
  $query = "DELETE qaa FROM quiz_attempt_answers qaa 
            JOIN quiz_attempts qa ON qaa.attempt_id = qa.id 
            WHERE qa.quiz_id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
  $stmt->execute();
  
  // 2. Delete quiz attempts
  $query = "DELETE FROM quiz_attempts WHERE quiz_id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
  $stmt->execute();
  
  // 3. Delete quiz question matching pairs
  $query = "DELETE qmp FROM quiz_question_matching_pairs qmp 
            JOIN quiz_questions qq ON qmp.question_id = qq.id 
            WHERE qq.quiz_id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
  $stmt->execute();
  
  // 4. Delete quiz question answer options
  $query = "DELETE qao FROM quiz_question_answer_options qao 
            JOIN quiz_questions qq ON qao.question_id = qq.id 
            WHERE qq.quiz_id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
  $stmt->execute();
  
  // 5. Delete quiz question weights
  $query = "DELETE FROM quiz_question_weights WHERE quiz_id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
  $stmt->execute();
  
  // 6. Delete quiz feedback templates
  $query = "DELETE FROM quiz_feedback_templates WHERE quiz_id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
  $stmt->execute();
  
  // 7. Delete quiz questions
  $query = "DELETE FROM quiz_questions WHERE quiz_id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
  $stmt->execute();
  
  // 8. Finally, delete the quiz itself
  $query = "DELETE FROM quizzes WHERE id = :quizId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
  $stmt->execute();
  
  $pdo->commit();
  http_response_code(200);
  echo json_encode(['message' => 'Quiz deleted successfully']);
} catch (Exception $e) {
  $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['error' => 'Failed to delete quiz: ' . $e->getMessage()]);
}
exit;
?>