<?php
// lms-forbes/backend/api/trainer/record_details.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// For debugging - uncomment these lines to see specific errors
// ini_set('display_errors', 1);
// error_reporting(E_ALL);

// For production
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check if record ID is provided
if (!isset($_GET['recordId'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Record ID is required']);
  exit;
}

$recordId = intval($_GET['recordId']);

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

list($userId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24-hour expiration)
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
  exit;
}

// Verify user role
$query = "SELECT role FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $userId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || ($user['role'] !== 'trainer' && $user['role'] !== 'administrator')) {
  http_response_code(403);
  echo json_encode(['error' => 'Permission denied']);
  exit;
}

try {
  // Get record details
  $query = "
    SELECT 
      r.id,
      r.user_id,
      r.record_type,
      r.category,
      r.file_path,
      r.description,
      r.created_at,
      u.full_name AS uploaded_by
    FROM 
      records r
    LEFT JOIN
      users u ON r.user_id = u.id
    WHERE 
      r.id = :id
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':id', $recordId, PDO::PARAM_INT);
  $stmt->execute();
  $record = $stmt->fetch(PDO::FETCH_ASSOC);
  
  if (!$record) {
    http_response_code(404);
    echo json_encode(['error' => 'Record not found']);
    exit;
  }
  
  // Get file details if a file exists
  if (!empty($record['file_path'])) {
    $filePath = $_SERVER['DOCUMENT_ROOT'] . $record['file_path'];
    
    if (file_exists($filePath)) {
      $record['file_size'] = filesize($filePath);
      
      // Skip mime_content_type if function not available
      if (function_exists('mime_content_type')) {
        $record['file_type'] = mime_content_type($filePath);
      } else {
        // Fallback to a simple extension-based type detection
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
          'pdf' => 'application/pdf',
          'doc' => 'application/msword',
          'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls' => 'application/vnd.ms-excel',
          'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'jpg' => 'image/jpeg',
          'jpeg' => 'image/jpeg',
          'png' => 'image/png',
          'gif' => 'image/gif',
          'txt' => 'text/plain'
        ];
        
        $record['file_type'] = isset($mimeTypes[$extension]) ? $mimeTypes[$extension] : 'application/octet-stream';
      }
    }
  }
  
  // Add empty training_details by default to avoid undefined property
  $record['training_details'] = [];
  
  // Get training details if this is a training record
  if ($record['record_type'] === 'training') {
    // Get related training information from other tables
    $trainingDetails = [];
    
    // First, check if related tables exist before querying them
    $checkTableQuery = "
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'quiz_attempts'
    ";
    $stmt = $pdo->query($checkTableQuery);
    $hasQuizAttemptsTable = $stmt->fetchColumn() > 0;
    
    $checkTableQuery = "
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'program_enrollments'
    ";
    $stmt = $pdo->query($checkTableQuery);
    $hasProgramEnrollmentsTable = $stmt->fetchColumn() > 0;
    
    // Only query quiz_attempts if the table exists
    if ($hasQuizAttemptsTable) {
      $query = "
        SELECT 
          q.title AS quiz_name,
          qa.score,
          qa.attempt_date AS completion_date
        FROM 
          quiz_attempts qa
        JOIN
          quizzes q ON qa.quiz_id = q.id
        WHERE 
          qa.user_id = :userId
        LIMIT 1
      ";
      
      $stmt = $pdo->prepare($query);
      $stmt->bindParam(':userId', $record['user_id'], PDO::PARAM_INT);
      $stmt->execute();
      $quizDetails = $stmt->fetch(PDO::FETCH_ASSOC);
      
      if ($quizDetails) {
        $trainingDetails = $quizDetails;
      }
    }
    
    // Only query program_enrollments if the table exists
    if ($hasProgramEnrollmentsTable) {
      $query = "
        SELECT 
          p.title AS program_name,
          pe.enrollment_date AS completion_date
        FROM 
          program_enrollments pe
        JOIN
          programs p ON pe.program_id = p.id
        WHERE 
          pe.user_id = :userId
        LIMIT 1
      ";
      
      $stmt = $pdo->prepare($query);
      $stmt->bindParam(':userId', $record['user_id'], PDO::PARAM_INT);
      $stmt->execute();
      $programDetails = $stmt->fetch(PDO::FETCH_ASSOC);
      
      if ($programDetails) {
        $trainingDetails = array_merge($trainingDetails, $programDetails);
      }
    }
    
    $record['training_details'] = $trainingDetails;
  }
  
  http_response_code(200);
  echo json_encode($record);

} catch (PDOException $e) {
  error_log('Error in record_details.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
  error_log('Error in record_details.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while fetching record details']);
}
?>