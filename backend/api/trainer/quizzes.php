<?php
// lms-forbes/backend/api/trainer/quizzes.php

ini_set('display_errors', 0);
error_reporting(E_ERROR);

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
  $token = $matches[1];
}

if (empty($token)) {
  http_response_code(401);
  echo json_encode(['error' => 'Authentication required']);
  exit;
}

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

$method = $_SERVER['REQUEST_METHOD'];

try {
  switch ($method) {
    case 'GET':
      $programId = isset($_GET['program_id']) ? (int)$_GET['program_id'] : null;
      
      $query = "
        SELECT 
          q.id, q.title, q.description, q.program_id, q.time_limit, 
          q.passing_score, q.status, q.auto_grade, q.grade_on_submission, 
          q.show_correct_answers, q.show_grade_immediately, q.grade_weighting,
          COUNT(DISTINCT ques.id) as question_count,
          COUNT(DISTINCT qa.id) as attempt_count,
          AVG(qr.score) as average_score,
          (SUM(CASE WHEN qr.score >= q.passing_score THEN 1 ELSE 0 END) / NULLIF(COUNT(qr.id), 0) * 100) as pass_rate
        FROM quizzes q
        LEFT JOIN questions ques ON q.id = ques.quiz_id
        LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
        LEFT JOIN quiz_results qr ON q.id = qr.quiz_id
        WHERE q.created_by = :trainer_id";
      
      $params = [':trainer_id' => $trainerId];
      
      if ($programId) {
        $query .= " AND q.program_id = :program_id";
        $params[':program_id'] = $programId;
      }
      
      $query .= " GROUP BY q.id";
      
      $stmt = $pdo->prepare($query);
      foreach ($params as $param => $value) {
        $stmt->bindValue($param, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
      }
      $stmt->execute();
      
      $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
      
      http_response_code(200);
      echo json_encode($quizzes);
      break;

    case 'POST':
      $input = file_get_contents('php://input');
      $data = json_decode($input, true);
      
      if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit;
      }
      
      if (!isset($data['title']) || empty(trim($data['title']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Quiz title is required']);
        exit;
      }
      
      if (!isset($data['program_id']) || !is_numeric($data['program_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid program ID is required']);
        exit;
      }
      
      $verifyQuery = "SELECT id FROM programs WHERE id = :program_id AND created_by = :trainer_id";
      $stmt = $pdo->prepare($verifyQuery);
      $stmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
      $stmt->bindParam(':trainer_id', $trainerId, PDO::PARAM_INT);
      $stmt->execute();
      
      if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to create a quiz for this program']);
        exit;
      }
      
      $pdo->beginTransaction();
      
      try {
        $insertQuizQuery = "
          INSERT INTO quizzes (
            title, description, program_id, time_limit, passing_score, 
            status, auto_grade, grade_on_submission, show_correct_answers, 
            show_grade_immediately, grade_weighting, created_by, created_at
          ) VALUES (
            :title, :description, :program_id, :time_limit, :passing_score, 
            :status, :auto_grade, :grade_on_submission, :show_correct_answers, 
            :show_grade_immediately, :grade_weighting, :created_by, NOW()
          )";
        
        $stmt = $pdo->prepare($insertQuizQuery);
        $stmt->bindParam(':title', $data['title']);
        $description = isset($data['description']) ? $data['description'] : '';
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
        $time_limit = isset($data['time_limit']) ? (int)$data['time_limit'] : 30;
        $stmt->bindParam(':time_limit', $time_limit, PDO::PARAM_INT);
        $passing_score = isset($data['passing_score']) ? (float)$data['passing_score'] : 70;
        $stmt->bindParam(':passing_score', $passing_score);
        $status = isset($data['status']) ? $data['status'] : 'draft';
        $stmt->bindParam(':status', $status);
        $auto_grade = isset($data['auto_grade']) ? (bool)$data['auto_grade'] : true;
        $stmt->bindParam(':auto_grade', $auto_grade, PDO::PARAM_BOOL);
        $grade_on_submission = isset($data['grade_on_submission']) ? (bool)$data['grade_on_submission'] : true;
        $stmt->bindParam(':grade_on_submission', $grade_on_submission, PDO::PARAM_BOOL);
        $show_correct_answers = isset($data['show_correct_answers']) ? (bool)$data['show_correct_answers'] : false;
        $stmt->bindParam(':show_correct_answers', $show_correct_answers, PDO::PARAM_BOOL);
        $show_grade_immediately = isset($data['show_grade_immediately']) ? (bool)$data['show_grade_immediately'] : true;
        $stmt->bindParam(':show_grade_immediately', $show_grade_immediately, PDO::PARAM_BOOL);
        $grade_weighting = isset($data['grade_weighting']) ? $data['grade_weighting'] : 'equal';
        $stmt->bindParam(':grade_weighting', $grade_weighting);
        $stmt->bindParam(':created_by', $trainerId, PDO::PARAM_INT);
        $stmt->execute();
        
        $quizId = $pdo->lastInsertId();
        
        $questionIds = [];
        if (isset($data['questions']) && is_array($data['questions'])) {
          $insertQuestionQuery = "
            INSERT INTO questions (
              quiz_id, question_text, question_type, option_a, option_b, 
              option_c, option_d, correct_answer
            ) VALUES (
              :quiz_id, :question_text, :question_type, :option_a, :option_b, 
              :option_c, :option_d, :correct_answer
            )";
          
          $insertOptionQuery = "
            INSERT INTO quiz_question_answer_options (
              question_id, option_text, option_key, is_correct
            ) VALUES (
              :question_id, :option_text, :option_key, :is_correct
            )";
          
          $stmt = $pdo->prepare($insertQuestionQuery);
          $optionStmt = $pdo->prepare($insertOptionQuery);
          
          foreach ($data['questions'] as $question) {
            $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
            $stmt->bindParam(':question_text', $question['question_text']);
            $stmt->bindParam(':question_type', $question['question_type']);
            
            $option_a = isset($question['option_a']) ? $question['option_a'] : '';
            $stmt->bindParam(':option_a', $option_a);
            $option_b = isset($question['option_b']) ? $question['option_b'] : '';
            $stmt->bindParam(':option_b', $option_b);
            $option_c = isset($question['option_c']) ? $question['option_c'] : '';
            $stmt->bindParam(':option_c', $option_c);
            $option_d = isset($question['option_d']) ? $question['option_d'] : '';
            $stmt->bindParam(':option_d', $option_d);
            
            $correct_answer = isset($question['correct_answer']) ? $question['correct_answer'] : null;
            $stmt->bindParam(':correct_answer', $correct_answer);
            
            $stmt->execute();
            $questionId = $pdo->lastInsertId();
            $questionIds[] = $questionId;
            
            if ($question['question_type'] === 'multiple_answer' && $correct_answer) {
              $correctOptions = explode(',', $correct_answer);
              $options = [
                ['text' => $option_a, 'key' => 'a', 'is_correct' => in_array('a', $correctOptions)],
                ['text' => $option_b, 'key' => 'b', 'is_correct' => in_array('b', $correctOptions)],
                ['text' => $option_c, 'key' => 'c', 'is_correct' => in_array('c', $correctOptions)],
                ['text' => $option_d, 'key' => 'd', 'is_correct' => in_array('d', $correctOptions)]
              ];
              
              foreach ($options as $option) {
                if ($option['text']) {
                  $optionStmt->bindParam(':question_id', $questionId, PDO::PARAM_INT);
                  $optionStmt->bindParam(':option_text', $option['text']);
                  $optionStmt->bindParam(':option_key', $option['key']);
                  $is_correct = $option['is_correct'] ? 1 : 0;
                  $optionStmt->bindParam(':is_correct', $is_correct, PDO::PARAM_INT);
                  $optionStmt->execute();
                }
              }
            }
          }
        }
        
        if (isset($data['question_weights']) && is_array($data['question_weights'])) {
          $insertWeightQuery = "
            INSERT INTO quiz_question_weights (quiz_id, question_id, weight)
            VALUES (:quiz_id, :question_id, :weight)";
          
          $stmt = $pdo->prepare($insertWeightQuery);
          
          foreach ($data['question_weights'] as $index => $weightData) {
            if (!isset($questionIds[$index])) {
              throw new Exception('Invalid question index for weight assignment');
            }
            $questionId = $questionIds[$index];
            $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
            $stmt->bindParam(':question_id', $questionId, PDO::PARAM_INT);
            $weight = (float)$weightData['weight'];
            $stmt->bindParam(':weight', $weight);
            $stmt->execute();
          }
        }
        
        if (isset($data['feedback_templates']) && is_array($data['feedback_templates'])) {
          $insertFeedbackQuery = "
            INSERT INTO quiz_feedback_templates (quiz_id, score_min, score_max, template)
            VALUES (:quiz_id, :score_min, :score_max, :template)";
          
          $stmt = $pdo->prepare($insertFeedbackQuery);
          
          foreach ($data['feedback_templates'] as $template) {
            $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
            $stmt->bindParam(':score_min', $template['score_min'], PDO::PARAM_STR);
            $stmt->bindParam(':score_max', $template['score_max'], PDO::PARAM_STR);
            $stmt->bindParam(':template', $template['template']);
            $stmt->execute();
          }
        }
        
        $pdo->commit();
        
        http_response_code(201);
        echo json_encode(['quizId' => $quizId, 'message' => 'Quiz created successfully']);
      } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Database error in quiz creation: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create quiz: ' . $e->getMessage()]);
        exit;
      }
      break;

    case 'PUT':
      if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Quiz ID is required']);
        exit;
      }
      
      $quizId = $_GET['id'];
      
      $verifyQuery = "
        SELECT q.id FROM quizzes q
        JOIN programs p ON q.program_id = p.id
        WHERE q.id = :quiz_id AND p.created_by = :trainer_id";
      $stmt = $pdo->prepare($verifyQuery);
      $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
      $stmt->bindParam(':trainer_id', $trainerId, PDO::PARAM_INT);
      $stmt->execute();
      
      if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to configure this quiz']);
        exit;
      }
      
      $input = file_get_contents('php://input');
      $data = json_decode($input, true);
      
      if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit;
      }
      
      $pdo->beginTransaction();
      
      try {
        if (isset($data['question_weights']) && is_array($data['question_weights'])) {
          $deleteWeightsQuery = "DELETE FROM quiz_question_weights WHERE quiz_id = :quiz_id";
          $stmt = $pdo->prepare($deleteWeightsQuery);
          $stmt->bindParam(':quiz_id', $quiz_id, PDO::PARAM_INT);
          $stmt->execute();
          
          $insertWeightQuery = "
            INSERT INTO quiz_question_weights (quiz_id, question_id, weight)
            VALUES (:quiz_id, :question_id, :weight)";
          
          $stmt = $pdo->prepare($insertWeightQuery);
          
          // Fetch question IDs for the quiz
          $questionQuery = "SELECT id FROM questions WHERE quiz_id = :quiz_id ORDER BY id";
          $qStmt = $pdo->prepare($questionQuery);
          $qStmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
          $qStmt->execute();
          $questionIds = $qStmt->fetchAll(PDO::FETCH_COLUMN);
          
          foreach ($data['question_weights'] as $index => $weightData) {
            if (!isset($questionIds[$index])) {
              throw new Exception('Invalid question index for weight assignment');
            }
            $questionId = $questionIds[$index];
            $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
            $stmt->bindParam(':question_id', $questionId, PDO::PARAM_INT);
            $weight = (float)$weightData['weight'];
            $stmt->bindParam(':weight', $weight);
            $stmt->execute();
          }
        }
        
        if (isset($data['feedback_templates']) && is_array($data['feedback_templates'])) {
          $deleteFeedbackQuery = "DELETE FROM quiz_feedback_templates WHERE quiz_id = :quiz_id";
          $stmt = $pdo->prepare($deleteFeedbackQuery);
          $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
          $stmt->execute();
          
          $insertFeedbackQuery = "
            INSERT INTO quiz_feedback_templates (quiz_id, score_min, score_max, template)
            VALUES (:quiz_id, :score_min, :score_max, :template)";
          
          $stmt = $pdo->prepare($insertFeedbackQuery);
          
          foreach ($data['feedback_templates'] as $template) {
            $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
            $stmt->bindParam(':score_min', $template['score_min'], PDO::PARAM_STR);
            $stmt->bindParam(':score_max', $template['score_max'], PDO::PARAM_STR);
            $stmt->bindParam(':template', $template['template']);
            $stmt->execute();
          }
        }
        
        $updateQuizQuery = "
          UPDATE quizzes
          SET passing_score = :passing_score,
              auto_feedback = :auto_feedback
          WHERE id = :quiz_id";
        
        $stmt = $pdo->prepare($updateQuizQuery);
        $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
        $passing_score = isset($data['passing_score']) ? (float)$data['passing_score'] : 70;
        $stmt->bindParam(':passing_score', $passing_score);
        $auto_feedback = isset($data['auto_feedback']) ? (bool)$data['auto_feedback'] : false;
        $stmt->bindParam(':auto_feedback', $auto_feedback, PDO::PARAM_BOOL);
        $stmt->execute();
        
        $pdo->commit();
        
        http_response_code(200);
        echo json_encode(['message' => 'Grading settings updated successfully']);
      } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Database error in grading configuration: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to configure grading settings: ' . $e->getMessage()]);
        exit;
      }
      break;

    case 'DELETE':
      if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Quiz ID is required']);
        exit;
      }
      
      $quizId = $_GET['id'];
      
      $verifyQuery = "
        SELECT q.id FROM quizzes q
        JOIN programs p ON q.program_id = p.id
        WHERE q.id = :quiz_id AND p.created_by = :trainer_id";
      $stmt = $pdo->prepare($verifyQuery);
      $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
      $stmt->bindParam(':trainer_id', $trainerId, PDO::PARAM_INT);
      $stmt->execute();
      
      if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to delete this quiz']);
        exit;
      }
      
      $pdo->beginTransaction();
      
      try {
        $deleteQuery = "DELETE FROM quizzes WHERE id = :quiz_id";
        $stmt = $pdo->prepare($deleteQuery);
        $stmt->bindParam(':quiz_id', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        
        $pdo->commit();
        
        http_response_code(200);
        echo json_encode(['message' => 'Quiz deleted successfully']);
      } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Database error in quiz deletion: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete quiz: ' . $e->getMessage()]);
        exit;
      }
      break;
      
    default:
      http_response_code(405);
      echo json_encode(['error' => 'Method not allowed']);
      break;
  }
} catch (PDOException $e) {
  error_log("Database error in trainer/quizzes.php: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
  error_log("Error in trainer/quizzes.php: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>