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
$logFile = __DIR__ . '/trainee_practical_exam_attempts_log.txt';
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
$query = "SELECT role FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $traineeId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] !== 'trainee') {
  http_response_code(403);
  echo json_encode(['error' => 'Permission denied']);
  exit;
}

// Handle GET requests for trainees
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

try {
  // Check if specific attempt ID was requested
  if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $attemptId = $_GET['id'];
    
    // Updated query to not reference columns that don't exist
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
        pe.max_score,
        p.title as program_title
      FROM 
        practical_exam_attempts pea
      JOIN
        practical_exams pe ON pea.exam_id = pe.id
      JOIN
        programs p ON pe.program_id = p.id
      WHERE 
        pea.id = :attemptId AND pea.user_id = :traineeId
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
    $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
    $stmt->execute();
    
    $attempt = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$attempt) {
      http_response_code(404);
      echo json_encode(['error' => 'Practical exam attempt not found or does not belong to you']);
      exit;
    }
    
    http_response_code(200);
    echo json_encode($attempt);
    exit;
  }
  
  // Initialize params and filter
  $params = [':traineeId' => $traineeId];
  $examFilter = "";
  
  // Filter by exam ID if provided
  if (isset($_GET['examId']) && is_numeric($_GET['examId'])) {
    $examFilter = "AND pea.exam_id = :examId";
    $params[':examId'] = $_GET['examId'];
    
    // Log the filter being applied for debugging
    file_put_contents($logFile, "Filtering by examId: " . $_GET['examId'] . "\n", FILE_APPEND);
  }
  
  // Query to get all practical exam attempts for this trainee
  $query = "
    SELECT 
      pea.id, 
      pea.exam_id, 
      pea.submitted_at, 
      pea.score, 
      pea.graded_at,
      pe.title as exam_title
    FROM 
      practical_exam_attempts pea
    JOIN
      practical_exams pe ON pea.exam_id = pe.id
    WHERE 
      pea.user_id = :traineeId
      $examFilter
    ORDER BY pea.submitted_at DESC
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->execute($params);
  $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // Log the number of attempts found
  file_put_contents($logFile, "Found " . count($attempts) . " attempts\n", FILE_APPEND);
  
  http_response_code(200);
  echo json_encode($attempts);

} catch (PDOException $e) {
  error_log("Database error in trainee/practical_exam_attempts.php: " . $e->getMessage());
  file_put_contents($logFile, "PDO Error: " . $e->getMessage() . "\n", FILE_APPEND);
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
  error_log("Error in trainee/practical_exam_attempts.php: " . $e->getMessage());
  file_put_contents($logFile, "General Error: " . $e->getMessage() . "\n", FILE_APPEND);
  http_response_code(500);
  echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

// End output buffering and flush
ob_end_flush();