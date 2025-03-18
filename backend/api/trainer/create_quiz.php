<?php
// lms-forbes/backend/api/trainer/create_quiz.php
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

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['title']) || !isset($data['program_id'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid input']);
  exit;
}

// Verify trainer owns the program
$query = "SELECT id FROM programs WHERE id = :program_id AND created_by = :trainerId";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
$stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
$stmt->execute();
if (!$stmt->fetch()) {
  http_response_code(403);
  echo json_encode(['error' => 'Program not found or not owned by trainer']);
  exit;
}

$pdo->beginTransaction();

try {
  // Insert quiz
  $query = "
    INSERT INTO quizzes (title, description, program_id, time_limit, passing_score, status, created_by)
    VALUES (:title, :description, :program_id, :time_limit, :passing_score, :status, :created_by)
  ";
  $stmt = $pdo->prepare($query);
  $stmt->execute([
    ':title' => $data['title'],
    ':description' => $data['description'] ?? null,
    ':program_id' => $data['program_id'],
    ':time_limit' => $data['time_limit'],
    ':passing_score' => $data['passing_score'],
    ':status' => $data['status'] ?? 'draft',
    ':created_by' => $trainerId
  ]);
  $quizId = $pdo->lastInsertId();

  // Insert questions
  foreach ($data['questions'] as $question) {
    $questionType = $question['question_type'] ?? 'multiple_choice';
    
    // Common query preparation
    $query = "
      INSERT INTO quiz_questions (quiz_id, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer)
      VALUES (:quiz_id, :question_type, :question_text, :option_a, :option_b, :option_c, :option_d, :correct_answer)
    ";
    $stmt = $pdo->prepare($query);
    
    // Initialize variables
    $options = [
      ':quiz_id' => $quizId,
      ':question_type' => $questionType,
      ':question_text' => $question['question_text']
    ];
    
    // Process based on question type
    switch ($questionType) {
      case 'multiple_choice':
        $options[':option_a'] = $question['option_a'];
        $options[':option_b'] = $question['option_b'];
        $options[':option_c'] = $question['option_c'] ?? null;
        $options[':option_d'] = $question['option_d'] ?? null;
        $options[':correct_answer'] = $question['correct_answer'];
        break;
      
        case 'multiple_answer':
          $options[':option_a'] = $question['option_a'];
          $options[':option_b'] = $question['option_b'];
          $options[':option_c'] = $question['option_c'] ?? null;
          $options[':option_d'] = $question['option_d'] ?? null;
          
          // Better handling of correct_answers
          $correctAnswers = [];
          if (isset($question['correct_answers']) && is_array($question['correct_answers'])) {
            $correctAnswers = $question['correct_answers'];
          }
          $options[':correct_answer'] = implode(',', $correctAnswers);
          
          // Log the correct answers for debugging
          error_log("Multiple answer question correct answers: " . json_encode($correctAnswers));
          break;
      
      case 'true_false':
        $options[':option_a'] = 'True';
        $options[':option_b'] = 'False';
        $options[':option_c'] = null;
        $options[':option_d'] = null;
        $options[':correct_answer'] = $question['is_true'] ? 'a' : 'b';
        break;
      
      case 'identification':
        $options[':option_a'] = null;
        $options[':option_b'] = null;
        $options[':option_c'] = null;
        $options[':option_d'] = null;
        $options[':correct_answer'] = $question['answer_text'];
        break;
      
      case 'matching':
        $options[':option_a'] = null;
        $options[':option_b'] = null;
        $options[':option_c'] = null;
        $options[':option_d'] = null;
        $options[':correct_answer'] = null;
        break;
      
      case 'essay':
        $options[':option_a'] = null;
        $options[':option_b'] = null;
        $options[':option_c'] = null;
        $options[':option_d'] = null;
        $options[':correct_answer'] = $question['answer_text'] ?? null; // Model answer for reference
        break;
    }
    
    $stmt->execute($options);
    $questionId = $pdo->lastInsertId();
    
    // Additional processing for special question types
    if ($questionType === 'matching' && isset($question['matching_pairs'])) {
      $insertPairQuery = "
        INSERT INTO quiz_question_matching_pairs (question_id, left_item, right_item, pair_key)
        VALUES (:question_id, :left_item, :right_item, :pair_key)
      ";
      $pairStmt = $pdo->prepare($insertPairQuery);
      
      foreach ($question['matching_pairs'] as $pair) {
        $pairStmt->execute([
          ':question_id' => $questionId,
          ':left_item' => $pair['left'],
          ':right_item' => $pair['right'],
          ':pair_key' => $pair['key']
        ]);
      }
    }
    
if ($questionType === 'multiple_answer') {
  error_log("Creating multiple-answer question ID: $questionId");
  
  // Check if correct_answers exists and is valid
  if (!isset($question['correct_answers']) || !is_array($question['correct_answers'])) {
    error_log("Warning: correct_answers missing or not an array for question $questionId");
    $question['correct_answers'] = []; // Default to empty array
  }
  
  // Log all option processing
  error_log("Processing options for question $questionId: " . json_encode($question));
  
  $insertOptionQuery = "
    INSERT INTO quiz_question_answer_options (question_id, option_text, option_key, is_correct)
    VALUES (:question_id, :option_text, :option_key, :is_correct)
  ";
  $optionStmt = $pdo->prepare($insertOptionQuery);
  
  foreach (['a', 'b', 'c', 'd'] as $key) {
    $optionField = "option_$key";
    if (isset($question[$optionField]) && !empty($question[$optionField])) {
      $isCorrect = in_array($key, $question['correct_answers']) ? 1 : 0;
      
      error_log("Option $key for question $questionId: text={$question[$optionField]}, isCorrect=$isCorrect");
      
      try {
        $optionStmt->execute([
          ':question_id' => $questionId,
          ':option_text' => $question[$optionField],
          ':option_key' => $key,
          ':is_correct' => $isCorrect
        ]);
      } catch (Exception $e) {
        error_log("Error inserting option $key for question $questionId: " . $e->getMessage());
        throw $e;
      }
    }
  }
}
  }

  $pdo->commit();
  http_response_code(201);
  echo json_encode(['quizId' => $quizId, 'message' => 'Quiz created successfully']);
} catch (Exception $e) {
  $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['error' => 'Failed to create quiz: ' . $e->getMessage()]);
}
exit;
?>