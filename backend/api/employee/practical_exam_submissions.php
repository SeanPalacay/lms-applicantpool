<?php
// Disable error display to prevent HTML output in JSON responses
ini_set('display_errors', 0);
error_reporting(E_ERROR);

// Start output buffering to prevent "headers already sent" issues
ob_start();

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Set content type early
header('Content-Type: application/json');

// For debugging (comment this out in production)
$logFile = __DIR__ . '/trainee_submissions_log.txt';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Request received\n", FILE_APPEND);

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

list($traineeId, $timestamp) = explode(':', $decodedToken);

// Basic token validation
if (!$traineeId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
  exit;
}

// Verify trainee role
$query = "SELECT role, full_name FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $traineeId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] !== 'trainee') {
  http_response_code(403);
  echo json_encode(['error' => 'Permission denied']);
  exit;
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

try {
  switch ($method) {
    case 'GET':
      // Check if a specific submission ID is requested
      if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $attemptId = $_GET['id'];
        
        // Get a specific submission by ID and verify it belongs to the current trainee
        $query = "
          SELECT 
            pea.id,
            pea.exam_id,
            pea.submission_text,
            pea.submitted_at,
            pea.score,
            pea.feedback,
            pea.graded_at,
            pe.title as exam_title,
            p.title as program_title,
            pe.max_score
          FROM 
            practical_exam_attempts pea
          JOIN
            practical_exams pe ON pea.exam_id = pe.id
          JOIN
            programs p ON pe.program_id = p.id
          WHERE 
            pea.id = :attemptId AND 
            pea.user_id = :traineeId
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
        $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
        $stmt->execute();
        
        $attempt = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$attempt) {
          http_response_code(404);
          echo json_encode(['error' => 'Submission not found or you do not have permission to access it']);
          exit;
        }
        
        http_response_code(200);
        echo json_encode($attempt);
        exit;
      }
      
      // Check if filtering by exam ID
      if (isset($_GET['exam_id']) && is_numeric($_GET['exam_id'])) {
        $examId = $_GET['exam_id'];
        
        // Get all submissions for a specific exam by this trainee
        $query = "
          SELECT 
            pea.id,
            pea.exam_id,
            pea.submission_text,
            pea.submitted_at,
            pea.score,
            pea.feedback,
            pea.graded_at,
            pe.title as exam_title,
            p.title as program_title,
            pe.max_score
          FROM 
            practical_exam_attempts pea
          JOIN
            practical_exams pe ON pea.exam_id = pe.id
          JOIN
            programs p ON pe.program_id = p.id
          WHERE 
            pea.exam_id = :examId AND 
            pea.user_id = :traineeId
          ORDER BY 
            pea.submitted_at DESC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':examId', $examId, PDO::PARAM_INT);
        $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
        $stmt->execute();
        
        $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        http_response_code(200);
        echo json_encode($attempts);
        exit;
      }
      
      // Get all submissions by this trainee
      $query = "
        SELECT 
          pea.id,
          pea.exam_id,
          pea.submission_text,
          pea.submitted_at,
          pea.score,
          pea.feedback,
          pea.graded_at,
          pe.title as exam_title,
          p.title as program_title,
          pe.max_score
        FROM 
          practical_exam_attempts pea
        JOIN
          practical_exams pe ON pea.exam_id = pe.id
        JOIN
          programs p ON pe.program_id = p.id
        WHERE 
          pea.user_id = :traineeId
        ORDER BY 
          pea.submitted_at DESC
      ";
      
      $stmt = $pdo->prepare($query);
      $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
      $stmt->execute();
      
      $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
      http_response_code(200);
      echo json_encode($attempts);
      break;

    case 'POST':
      // Submit a new practical exam attempt
      $input = json_decode(file_get_contents('php://input'), true);
      
      // Log input data
      file_put_contents($logFile, "Input data: " . json_encode($input) . "\n", FILE_APPEND);
      
      // Validate required fields
      if (!isset($input['exam_id']) || !isset($input['submission_text']) || empty(trim($input['submission_text']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Exam ID and submission text are required']);
        exit;
      }
      
      $examId = $input['exam_id'];
      $submissionText = $input['submission_text'];
      
      // Verify the trainee is enrolled in the program for this exam
      $verifyQuery = "
        SELECT pe.id
        FROM practical_exams pe
        JOIN programs p ON pe.program_id = p.id
        JOIN program_enrollments pen ON p.id = pen.program_id AND pen.user_id = :traineeId
        WHERE pe.id = :examId
      ";
      
      $verifyStmt = $pdo->prepare($verifyQuery);
      $verifyStmt->bindParam(':examId', $examId, PDO::PARAM_INT);
      $verifyStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
      $verifyStmt->execute();
      
      if ($verifyStmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'You are not enrolled in the program for this exam']);
        exit;
      }
      
      // Check if the trainee has already submitted an attempt for this exam
      $checkQuery = "
        SELECT id FROM practical_exam_attempts
        WHERE exam_id = :examId AND user_id = :traineeId
      ";
      
      $checkStmt = $pdo->prepare($checkQuery);
      $checkStmt->bindParam(':examId', $examId, PDO::PARAM_INT);
      $checkStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
      $checkStmt->execute();
      
      if ($checkStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'You have already submitted an attempt for this exam']);
        exit;
      }
      
      // Insert the new submission
      $insertQuery = "
        INSERT INTO practical_exam_attempts (
          exam_id, 
          user_id, 
          submission_text, 
          submitted_at
        ) VALUES (
          :exam_id, 
          :user_id, 
          :submission_text, 
          NOW()
        )
      ";
      
      $insertStmt = $pdo->prepare($insertQuery);
      $insertStmt->bindParam(':exam_id', $examId, PDO::PARAM_INT);
      $insertStmt->bindParam(':user_id', $traineeId, PDO::PARAM_INT);
      $insertStmt->bindParam(':submission_text', $submissionText);
      $insertStmt->execute();
      
      $attemptId = $pdo->lastInsertId();
      
      // Create notifications for trainers
      $notificationQuery = "
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          created_at
        )
        SELECT 
          u.id, 
          'info', 
          'New Practical Exam Submission', 
          CONCAT(:trainee_name, ' has submitted a practical exam for \"', pe.title, '\"'),
          NOW()
        FROM 
          users u
        CROSS JOIN
          practical_exams pe
        WHERE 
          u.role = 'trainer' AND
          pe.id = :exam_id
      ";
      
      $traineeName = $user['full_name'];
      $notifStmt = $pdo->prepare($notificationQuery);
      $notifStmt->bindParam(':trainee_name', $traineeName);
      $notifStmt->bindParam(':exam_id', $examId, PDO::PARAM_INT);
      $notifStmt->execute();
      
      // Fetch the new attempt with exam details
      $fetchQuery = "
        SELECT 
          pea.id,
          pea.exam_id,
          pea.submission_text,
          pea.submitted_at,
          pe.title as exam_title,
          p.title as program_title,
          pe.max_score
        FROM 
          practical_exam_attempts pea
        JOIN
          practical_exams pe ON pea.exam_id = pe.id
        JOIN
          programs p ON pe.program_id = p.id
        WHERE 
          pea.id = :attemptId
      ";
      
      $fetchStmt = $pdo->prepare($fetchQuery);
      $fetchStmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
      $fetchStmt->execute();
      
      $attempt = $fetchStmt->fetch(PDO::FETCH_ASSOC);
      
      http_response_code(201);
      echo json_encode(['message' => 'Submission successful', 'attempt' => $attempt]);
      break;

    default:
      http_response_code(405);
      echo json_encode(['error' => 'Method not allowed']);
      break;
  }
} catch (PDOException $e) {
  error_log("Database error in trainee/practical_exam_submissions.php: " . $e->getMessage());
  file_put_contents($logFile, "PDO Error: " . $e->getMessage() . "\n", FILE_APPEND);
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
  error_log("Error in trainee/practical_exam_submissions.php: " . $e->getMessage());
  file_put_contents($logFile, "General Error: " . $e->getMessage() . "\n", FILE_APPEND);
  http_response_code(500);
  echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

// End output buffering and flush
ob_end_flush();
?>