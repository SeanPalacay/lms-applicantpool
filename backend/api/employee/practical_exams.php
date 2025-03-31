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
$logFile = __DIR__ . '/employee_practical_exams_log.txt';
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

list($employeeId, $timestamp) = explode(':', $decodedToken);

// Basic token validation
if (!$employeeId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
  exit;
}

// Verify employee role
$query = "SELECT role FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $employeeId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] !== 'employee') {
  http_response_code(403);
  echo json_encode(['error' => 'Permission denied']);
  exit;
}

// Handle GET requests for employees
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

try {
  // Check if specific exam ID was requested
  if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $examId = $_GET['id'];
    
    // Query to get a specific practical exam for an employee
    // Only show exams for programs the employee is enrolled in
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
      JOIN
        program_enrollments pen ON p.id = pen.program_id AND pen.user_id = :employeeId
      WHERE 
        pe.id = :examId
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':examId', $examId, PDO::PARAM_INT);
    $stmt->bindParam(':employeeId', $employeeId, PDO::PARAM_INT);
    $stmt->execute();
    
    $exam = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$exam) {
      http_response_code(404);
      echo json_encode(['error' => 'Practical exam not found or you are not enrolled in the program']);
      exit;
    }
    
    http_response_code(200);
    echo json_encode($exam);
    exit;
  }
  
  // Get program filter
  $programFilter = "";
  $params = [':employeeId' => $employeeId];
  
  if (isset($_GET['programId']) && is_numeric($_GET['programId'])) {
    $programFilter = "AND pe.program_id = :programId";
    $params[':programId'] = $_GET['programId'];
  }
  
  // Query to get all practical exams for an employee's enrolled programs
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
    JOIN
      program_enrollments pen ON p.id = pen.program_id AND pen.user_id = :employeeId
    WHERE 
      1=1
      $programFilter
    ORDER BY pe.created_at DESC
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->execute($params);
  $exams = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  http_response_code(200);
  echo json_encode($exams);

} catch (PDOException $e) {
  error_log("Database error in employee/practical_exams.php: " . $e->getMessage());
  file_put_contents($logFile, "PDO Error: " . $e->getMessage() . "\n", FILE_APPEND);
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
  error_log("Error in employee/practical_exams.php: " . $e->getMessage());
  file_put_contents($logFile, "General Error: " . $e->getMessage() . "\n", FILE_APPEND);
  http_response_code(500);
  echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

// End output buffering and flush
ob_end_flush();
?>