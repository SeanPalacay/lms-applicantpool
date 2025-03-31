<?php

// Add these lines at the very top
ini_set('display_errors', 0);
error_reporting(E_ERROR);
ob_start(); // Start output buffering to catch any unexpected output

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Set content type early
header('Content-Type: application/json');

// Check authorization header
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

// Decode token (base64-encoded "userId:timestamp")
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid token format']);
  exit;
}

list($trainerId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24 hours)
if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
  exit;
}

// Verify trainer role
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

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

try {
  switch ($method) {
    case 'GET':
      // Get attempts for a specific exam (with optional ungraded_only filter)
      if (!isset($_GET['exam_id']) || !is_numeric($_GET['exam_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Exam ID is required']);
        exit;
      }

      $examId = $_GET['exam_id'];

      // Verify the trainer has access to this exam
      $verifyQuery = "
        SELECT pe.id 
        FROM practical_exams pe
        JOIN programs p ON pe.program_id = p.id
        WHERE pe.id = :examId 
          AND p.created_by = :trainerId
      ";
      $verifyStmt = $pdo->prepare($verifyQuery);
      $verifyStmt->bindParam(':examId', $examId, PDO::PARAM_INT);
      $verifyStmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
      $verifyStmt->execute();

      if ($verifyStmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to access this practical exam']);
        exit;
      }

      // Build query based on filters
      $filterCondition = "";
      $params = [':exam_id' => $examId];

      // Filter for ungraded only
      if (isset($_GET['ungraded_only']) && $_GET['ungraded_only'] === '1') {
        $filterCondition .= " AND pea.graded_at IS NULL";
      }

      // Filter by trainee
      if (isset($_GET['trainee_id']) && is_numeric($_GET['trainee_id'])) {
        $filterCondition .= " AND pea.user_id = :trainee_id";
        $params[':trainee_id'] = $_GET['trainee_id'];
      }

      $query = "
      SELECT 
        pea.id, 
        pea.user_id, 
        pea.exam_id, 
        pea.score, 
        pea.feedback, 
        pea.submitted_at, 
        pea.graded_at,
        pea.submission_text,  -- <--- Include the submission text
        u.full_name as trainee_name,
        pe.title as exam_title,
        pe.description as exam_description, -- optionally rename for clarity
        pe.max_score,
        p.title as program_title
      FROM 
        practical_exam_attempts pea
      JOIN
        users u ON pea.user_id = u.id
      JOIN
        practical_exams pe ON pea.exam_id = pe.id
      JOIN
        programs p ON pe.program_id = p.id
      WHERE 
        pea.exam_id = :exam_id
        $filterCondition
      ORDER BY 
        pea.submitted_at DESC
    ";
    

      $stmt = $pdo->prepare($query);
      $stmt->execute($params);
      $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

      http_response_code(200);
      echo json_encode($attempts);
      break;

    case 'POST':
      // Submit grade for a practical exam attempt
      $input = file_get_contents('php://input');
      $data = json_decode($input, true);

      if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit;
      }

      // Validate required fields
      if (!isset($data['attempt_id']) || !isset($data['score'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Attempt ID and score are required']);
        exit;
      }

      // Verify the trainer has access to grade this attempt
      $verifyQuery = "
        SELECT 
          pea.id, 
          pe.max_score,
          pe.program_id
        FROM practical_exam_attempts pea
        JOIN practical_exams pe ON pea.exam_id = pe.id
        JOIN programs p ON pe.program_id = p.id
        WHERE pea.id = :attempt_id
          AND p.created_by = :trainerId
      ";
      $verifyStmt = $pdo->prepare($verifyQuery);
      $verifyStmt->bindParam(':attempt_id', $data['attempt_id'], PDO::PARAM_INT);
      $verifyStmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
      $verifyStmt->execute();

      $attempt = $verifyStmt->fetch(PDO::FETCH_ASSOC);
      if (!$attempt) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to grade this attempt']);
        exit;
      }

      // Validate score
      if ($data['score'] < 0 || $data['score'] > $attempt['max_score']) {
        http_response_code(400);
        echo json_encode(['error' => "Score must be between 0 and {$attempt['max_score']}"]);
        exit;
      }

      // Update the attempt with grade information
      $updateQuery = "
        UPDATE practical_exam_attempts
        SET 
          score = :score,
          feedback = :feedback,
          graded_by = :graded_by,
          graded_at = NOW()
        WHERE id = :attempt_id
      ";
      $updateStmt = $pdo->prepare($updateQuery);
      $updateStmt->bindParam(':score', $data['score']);
      $feedback = isset($data['feedback']) ? $data['feedback'] : null;
      $updateStmt->bindParam(':feedback', $feedback);
      $updateStmt->bindParam(':graded_by', $trainerId, PDO::PARAM_INT);
      $updateStmt->bindParam(':attempt_id', $data['attempt_id'], PDO::PARAM_INT);
      $updateStmt->execute();

      // Fetch the updated attempt
      $fetchQuery = "
        SELECT 
          pea.id, 
          pea.user_id, 
          pea.exam_id, 
          pea.score, 
          pea.feedback, 
          pea.submitted_at, 
          pea.graded_at,
          pea.graded_by,
          u.full_name AS trainee_name,
          pe.title AS exam_title
        FROM practical_exam_attempts pea
        JOIN users u ON pea.user_id = u.id
        JOIN practical_exams pe ON pea.exam_id = pe.id
        WHERE pea.id = :attempt_id
      ";
      $fetchStmt = $pdo->prepare($fetchQuery);
      $fetchStmt->bindParam(':attempt_id', $data['attempt_id'], PDO::PARAM_INT);
      $fetchStmt->execute();
      $updatedAttempt = $fetchStmt->fetch(PDO::FETCH_ASSOC);

      // Update program_enrollments if it exists
      updateProgramCompletionPercentage($pdo, $updatedAttempt['user_id'], $attempt['program_id']);

      http_response_code(200);
      echo json_encode($updatedAttempt);
      break;

    default:
      http_response_code(405);
      echo json_encode(['error' => 'Method not allowed']);
      break;
  }
} catch (PDOException $e) {
  error_log("Database error in practical_exam_grades.php: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
  error_log("Error in practical_exam_grades.php: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

ob_end_flush();

/**
 * Update a trainee's program completion percentage based on quizzes and practical exams.
 *
 * @param PDO    $pdo
 * @param int    $userId
 * @param int    $programId
 * @return bool
 */
function updateProgramCompletionPercentage($pdo, $userId, $programId) {
  try {
    // Check if the user is even enrolled in this program
    $enrollCheck = "
      SELECT id 
      FROM program_enrollments
      WHERE user_id = :userId
        AND program_id = :programId
      LIMIT 1
    ";
    $enrollCheckStmt = $pdo->prepare($enrollCheck);
    $enrollCheckStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $enrollCheckStmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $enrollCheckStmt->execute();

    // If no enrollment, skip
    if ($enrollCheckStmt->rowCount() === 0) {
      return false;
    }

    // Gather all quizzes and practical exams for this program
    $assessmentsQuery = "
      SELECT 
        'quiz' as type, 
        id, 
        NULL as max_score
      FROM quizzes
      WHERE program_id = :programId
      UNION
      SELECT 
        'practical' as type, 
        id, 
        max_score
      FROM practical_exams
      WHERE program_id = :programId
    ";
    $assessmentsStmt = $pdo->prepare($assessmentsQuery);
    $assessmentsStmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $assessmentsStmt->execute();
    $assessments = $assessmentsStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalAssessments = count($assessments);
    if ($totalAssessments === 0) {
      return false; // No assessments to calculate
    }

    $completedCount   = 0;
    $totalScore       = 0;
    $maxPossibleScore = 0;

    foreach ($assessments as $item) {
      if ($item['type'] === 'quiz') {
        // Highest quiz score for this user/quiz
        $quizQuery = "
          SELECT MAX(score) AS max_score
          FROM quiz_attempts
          WHERE quiz_id = :quizId
            AND user_id = :userId
        ";
        $quizStmt = $pdo->prepare($quizQuery);
        $quizStmt->bindParam(':quizId', $item['id'], PDO::PARAM_INT);
        $quizStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $quizStmt->execute();
        $quizScoreRow = $quizStmt->fetch(PDO::FETCH_ASSOC);

        if ($quizScoreRow && $quizScoreRow['max_score'] !== null) {
          $completedCount++;
          $totalScore       += $quizScoreRow['max_score'];
          // Quizzes default to 100 max
          $maxPossibleScore += 100; 
        }
      } else {
        // Practical exam score
        $pracQuery = "
          SELECT score
          FROM practical_exam_attempts
          WHERE exam_id = :examId
            AND user_id = :userId
            AND graded_at IS NOT NULL
          ORDER BY score DESC
          LIMIT 1
        ";
        $pracStmt = $pdo->prepare($pracQuery);
        $pracStmt->bindParam(':examId', $item['id'], PDO::PARAM_INT);
        $pracStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $pracStmt->execute();

        $pracScoreRow = $pracStmt->fetch(PDO::FETCH_ASSOC);
        if ($pracScoreRow && $pracScoreRow['score'] !== null) {
          $completedCount++;
          $totalScore       += $pracScoreRow['score'];
          $maxPossibleScore += $item['max_score'] ?: 100;
        }
      }
    }

    // Calculate completion and average
    $completionPercentage = ($completedCount / $totalAssessments) * 100;
    $averageScore         = ($maxPossibleScore > 0) 
                              ? ($totalScore / $maxPossibleScore) * 100 
                              : 0;

    // If all required items are completed
    $completionStatus = ($completedCount === $totalAssessments && $totalAssessments > 0)
                          ? 'completed'
                          : 'in_progress';

    // Update program_enrollments
    $updateEnroll = "
      UPDATE program_enrollments
      SET
        completion_percentage = :completion_percentage,
        completion_status = :completion_status
      WHERE user_id = :userId 
        AND program_id = :programId
    ";
    $updateStmt = $pdo->prepare($updateEnroll);
    $updateStmt->bindParam(':completion_percentage', $completionPercentage);
    $updateStmt->bindParam(':completion_status', $completionStatus);
    $updateStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $updateStmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $updateStmt->execute();

    return true;
  } catch (Exception $e) {
    error_log("Error updating program completion: " . $e->getMessage());
    return false;
  }
}
