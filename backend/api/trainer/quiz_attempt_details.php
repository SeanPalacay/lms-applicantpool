<?php
// lms-forbes/backend/api/trainer/quiz_attempt_details.php
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
$attemptId = isset($_GET['attemptId']) ? (int)$_GET['attemptId'] : 0;
if ($quizId <= 0 || $attemptId <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid quiz ID or attempt ID']);
  exit;
}

// Fetch attempt details
$query = "
  SELECT 
    qa.id,
    qa.user_id AS trainee_id,
    u.full_name AS trainee_name,
    q.title AS quiz_title,
    qa.score,
    qa.time_taken,
    qa.attempt_date,
    q.passing_score
  FROM 
    quiz_attempts qa
  JOIN 
    quizzes q ON qa.quiz_id = q.id
  JOIN 
    programs p ON q.program_id = p.id
  JOIN 
    users u ON qa.user_id = u.id
  WHERE 
    qa.id = :attemptId 
    AND qa.quiz_id = :quizId 
    AND p.created_by = :trainerId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
$stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
$stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
$stmt->execute();
$attempt = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$attempt) {
  http_response_code(404);
  echo json_encode(['error' => 'Attempt not found or not authorized']);
  exit;
}

// Fetch answers
$query = "
  SELECT 
    qq.question_text,
    qaa.selected_answer,
    qq.correct_answer,
    (qaa.selected_answer = qq.correct_answer) AS is_correct
  FROM 
    quiz_attempt_answers qaa
  JOIN 
    quiz_questions qq ON qaa.question_id = qq.id
  WHERE 
    qaa.attempt_id = :attemptId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
$stmt->execute();
$answers = $stmt->fetchAll(PDO::FETCH_ASSOC);

$attempt['answers'] = $answers;

http_response_code(200);
echo json_encode($attempt);
exit;
?>