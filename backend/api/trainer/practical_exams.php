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
$logFile = __DIR__ . '/practical_exams_log.txt';
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

list($trainerId, $timestamp) = explode(':', $decodedToken);

// Basic token validation
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
      // Check if specific exam ID was requested
      if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $examId = $_GET['id'];
        
        // Modified query to not use program_trainers table
        $query = "
          SELECT 
            pe.id, 
            pe.program_id, 
            pe.title, 
            pe.description, 
            pe.max_score, 
            pe.created_at,
            p.title as program_title
          FROM 
            practical_exams pe
          JOIN
            programs p ON pe.program_id = p.id
          WHERE 
            pe.id = :examId AND 
            p.created_by = :trainerId
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':examId', $examId, PDO::PARAM_INT);
        $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
        $stmt->execute();
        
        $exam = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$exam) {
          http_response_code(404);
          echo json_encode(['error' => 'Practical exam not found or you do not have permission to access it']);
          exit;
        }
        
        // Get attempt statistics
        $statsQuery = "
          SELECT 
            COUNT(*) as total_attempts,
            AVG(score) as average_score,
            MIN(score) as min_score,
            MAX(score) as max_score
          FROM 
            practical_exam_attempts
          WHERE 
            exam_id = :examId
        ";
        
        $statsStmt = $pdo->prepare($statsQuery);
        $statsStmt->bindParam(':examId', $examId, PDO::PARAM_INT);
        $statsStmt->execute();
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
        
        $exam['stats'] = $stats;
        
        http_response_code(200);
        echo json_encode($exam);
        exit;
      }
      
      // Get program filter
      $programFilter = "";
      $params = [':trainerId' => $trainerId];
      
      if (isset($_GET['programId']) && is_numeric($_GET['programId'])) {
        $programFilter = "AND pe.program_id = :programId";
        $params[':programId'] = $_GET['programId'];
      }
      
      // Modified query to not use program_trainers table
      $query = "
        SELECT 
          pe.id, 
          pe.program_id, 
          pe.title, 
          pe.description, 
          pe.max_score, 
          pe.created_at,
          p.title as program_title,
          (SELECT COUNT(*) FROM practical_exam_attempts pea WHERE pea.exam_id = pe.id) as attempt_count,
          (SELECT AVG(score) FROM practical_exam_attempts pea WHERE pea.exam_id = pe.id) as average_score
        FROM 
          practical_exams pe
        JOIN
          programs p ON pe.program_id = p.id
        WHERE 
          p.created_by = :trainerId
          $programFilter
        ORDER BY pe.created_at DESC
      ";
      
      $stmt = $pdo->prepare($query);
      $stmt->execute($params);
      $exams = $stmt->fetchAll(PDO::FETCH_ASSOC);
      
      http_response_code(200);
      echo json_encode($exams);
      break;

    case 'POST':
      // Create new practical exam
      $input = file_get_contents('php://input');
      
      // Log input data
      file_put_contents($logFile, "Input data: " . $input . "\n", FILE_APPEND);
      
      $data = json_decode($input, true);
      
      if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit;
      }
      
      // Validate required fields
      if (!isset($data['program_id']) || !isset($data['title']) || empty(trim($data['title']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Program ID and title are required']);
        exit;
      }
      
      // Verify the trainer has access to this program
      $verifyQuery = "
        SELECT 1 FROM programs 
        WHERE id = :programId AND created_by = :trainerId
      ";
      
      $verifyStmt = $pdo->prepare($verifyQuery);
      $verifyStmt->bindParam(':programId', $data['program_id'], PDO::PARAM_INT);
      $verifyStmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
      $verifyStmt->execute();
      
      if ($verifyStmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to create practical exams for this program']);
        exit;
      }
      
      // Fix: Create variables for all values before binding them
      $programId = $data['program_id'];
      $title = $data['title'];
      $description = isset($data['description']) ? $data['description'] : '';
      $maxScore = isset($data['max_score']) ? $data['max_score'] : 100;
      
      // Insert new practical exam
      $insertQuery = "
        INSERT INTO practical_exams (
          program_id, 
          title, 
          description, 
          max_score, 
          created_by
        ) VALUES (
          :program_id, 
          :title, 
          :description, 
          :max_score, 
          :created_by
        )
      ";
      
      $insertStmt = $pdo->prepare($insertQuery);
      $insertStmt->bindParam(':program_id', $programId, PDO::PARAM_INT);
      $insertStmt->bindParam(':title', $title);
      $insertStmt->bindParam(':description', $description);
      $insertStmt->bindParam(':max_score', $maxScore);
      $insertStmt->bindParam(':created_by', $trainerId, PDO::PARAM_INT);
      $insertStmt->execute();
      
      $examId = $pdo->lastInsertId();
      
      // Fetch the newly created exam
      $fetchQuery = "
        SELECT id, program_id, title, description, max_score, created_at
        FROM practical_exams
        WHERE id = :id
      ";
      
      $fetchStmt = $pdo->prepare($fetchQuery);
      $fetchStmt->bindParam(':id', $examId, PDO::PARAM_INT);
      $fetchStmt->execute();
      
      $exam = $fetchStmt->fetch(PDO::FETCH_ASSOC);
      
      http_response_code(201);
      echo json_encode($exam);
      break;

    case 'PUT':
      // Update existing practical exam - this case follows similar logic as POST
      if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Exam ID is required']);
        exit;
      }
      
      $examId = $_GET['id'];
      
      // Verify the trainer has access to this exam
      $verifyQuery = "
        SELECT pe.id, pe.program_id FROM practical_exams pe
        JOIN programs p ON pe.program_id = p.id
        WHERE pe.id = :examId AND p.created_by = :trainerId
      ";
      
      $verifyStmt = $pdo->prepare($verifyQuery);
      $verifyStmt->bindParam(':examId', $examId, PDO::PARAM_INT);
      $verifyStmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
      $verifyStmt->execute();
      
      $exam = $verifyStmt->fetch(PDO::FETCH_ASSOC);
      if (!$exam) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to update this practical exam']);
        exit;
      }
      
      // Get JSON input
      $input = file_get_contents('php://input');
      $data = json_decode($input, true);
      
      if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit;
      }
      
      // Validate title if provided
      if (isset($data['title']) && empty(trim($data['title']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Exam title cannot be empty']);
        exit;
      }
      
      // Build update query
      $updateFields = [];
      $params = [':id' => $examId];
      
      if (isset($data['title'])) {
        $updateFields[] = "title = :title";
        $params[':title'] = $data['title'];
      }
      
      if (isset($data['description'])) {
        $updateFields[] = "description = :description";
        $params[':description'] = $data['description'];
      }
      
      if (isset($data['max_score'])) {
        $updateFields[] = "max_score = :max_score";
        $params[':max_score'] = $data['max_score'];
      }
      
      if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
      }
      
      // Execute update query
      $updateQuery = "UPDATE practical_exams SET " . implode(", ", $updateFields) . " WHERE id = :id";
      $updateStmt = $pdo->prepare($updateQuery);
      $updateStmt->execute($params);
      
      // Fetch updated exam
      $fetchQuery = "
        SELECT id, program_id, title, description, max_score, created_at
        FROM practical_exams
        WHERE id = :id
      ";
      
      $fetchStmt = $pdo->prepare($fetchQuery);
      $fetchStmt->bindParam(':id', $examId, PDO::PARAM_INT);
      $fetchStmt->execute();
      
      $updatedExam = $fetchStmt->fetch(PDO::FETCH_ASSOC);
      
      http_response_code(200);
      echo json_encode($updatedExam);
      break;

    case 'DELETE':
      // Delete practical exam
      if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Exam ID is required']);
        exit;
      }
      
      $examId = $_GET['id'];
      
      // Verify the trainer has access to delete this exam
      $verifyQuery = "
        SELECT pe.id FROM practical_exams pe
        JOIN programs p ON pe.program_id = p.id
        WHERE pe.id = :examId AND p.created_by = :trainerId
      ";
      
      $verifyStmt = $pdo->prepare($verifyQuery);
      $verifyStmt->bindParam(':examId', $examId, PDO::PARAM_INT);
      $verifyStmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
      $verifyStmt->execute();
      
      if ($verifyStmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to delete this practical exam']);
        exit;
      }
      
      // Delete the exam
      $deleteQuery = "DELETE FROM practical_exams WHERE id = :id";
      $deleteStmt = $pdo->prepare($deleteQuery);
      $deleteStmt->bindParam(':id', $examId, PDO::PARAM_INT);
      $deleteStmt->execute();
      
      http_response_code(200);
      echo json_encode(['success' => true, 'message' => 'Practical exam deleted successfully']);
      break;

    default:
      http_response_code(405);
      echo json_encode(['error' => 'Method not allowed']);
      break;
  }
} catch (PDOException $e) {
  error_log("Database error in practical_exams.php: " . $e->getMessage());
  file_put_contents($logFile, "PDO Error: " . $e->getMessage() . "\n", FILE_APPEND);
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
  error_log("Error in practical_exams.php: " . $e->getMessage());
  file_put_contents($logFile, "General Error: " . $e->getMessage() . "\n", FILE_APPEND);
  http_response_code(500);
  echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

// End output buffering and flush
ob_end_flush();
?>