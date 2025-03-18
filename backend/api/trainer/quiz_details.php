<?php
// lms-forbes/backend/api/trainer/quiz_details.php
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

// Fetch quiz details
$query = "
  SELECT 
    q.id,
    q.title,
    q.description,
    q.program_id,
    p.title AS program_title,
    q.time_limit,
    q.passing_score,
    q.status,
    q.created_at,
    q.created_by,
    u.full_name AS created_by_name
  FROM 
    quizzes q
  JOIN 
    programs p ON q.program_id = p.id
  JOIN 
    users u ON q.created_by = u.id
  WHERE 
    q.id = :quizId AND p.created_by = :trainerId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
$stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
$stmt->execute();
$quiz = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$quiz) {
  http_response_code(404);
  echo json_encode(['error' => 'Quiz not found']);
  exit;
}

// Fetch questions with question type
$query = "
  SELECT 
    id,
    question_type,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer
  FROM 
    quiz_questions
  WHERE 
    quiz_id = :quizId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
$stmt->execute();
$questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Process each question to include additional data based on question type
foreach ($questions as &$question) {
  // For multiple-answer questions, get the correct answers
  if ($question['question_type'] === 'multiple_answer') {
    $query = "
      SELECT option_key 
      FROM quiz_question_answer_options 
      WHERE question_id = :questionId AND is_correct = 1
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':questionId', $question['id'], PDO::PARAM_INT);
    $stmt->execute();
    $question['correct_answers'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
  }
  
  // For matching questions, get the pairs
  if ($question['question_type'] === 'matching') {
    $query = "
      SELECT left_item, right_item, pair_key 
      FROM quiz_question_matching_pairs 
      WHERE question_id = :questionId
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':questionId', $question['id'], PDO::PARAM_INT);
    $stmt->execute();
    $question['matching_pairs'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
  }
}
unset($question); // Break the reference

$quiz['questions'] = $questions;

// Calculate performance statistics
$query = "
  SELECT 
    COUNT(*) AS total_attempts,
    AVG(score) AS average_score,
    MAX(score) AS highest_score,
    MIN(score) AS lowest_score,
    (SUM(CASE WHEN score >= :passing_score THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS pass_rate
  FROM 
    quiz_attempts
  WHERE 
    quiz_id = :quizId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
$stmt->bindParam(':passing_score', $quiz['passing_score'], PDO::PARAM_STR);
$stmt->execute();
$stats = $stmt->fetch(PDO::FETCH_ASSOC);

$quiz['stats'] = [
  'total_attempts' => (int)($stats['total_attempts'] ?? 0),
  'pass_rate' => number_format($stats['pass_rate'] ?? 0, 2),
  'average_score' => $stats['average_score'] ? number_format($stats['average_score'], 2) : 'N/A',
  'highest_score' => $stats['highest_score'] ? number_format($stats['highest_score'], 2) : 'N/A',
  'lowest_score' => $stats['lowest_score'] ? number_format($stats['lowest_score'], 2) : 'N/A'
];

http_response_code(200);
echo json_encode($quiz);
exit;
?>