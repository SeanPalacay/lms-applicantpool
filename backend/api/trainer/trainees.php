<?php
// lms-forbes/backend/api/trainer/trainees.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

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

// Basic token validation (24-hour expiration)
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

// Check if program ID is provided for filtering
$programId = isset($_GET['programId']) ? $_GET['programId'] : null;

// Fetch trainees based on program ID or all trainees if no program specified
if ($programId) {
  // Simplified query just for trainees in a specific program
  $query = "
    SELECT DISTINCT 
      u.id, 
      u.full_name,
      u.email,
      u.status,
      pe.enrollment_date
    FROM 
      users u
    JOIN 
      program_enrollments pe ON u.id = pe.user_id
    WHERE 
      u.role = 'trainee'
      AND pe.program_id = :programId
    ORDER BY 
      u.full_name
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
  $stmt->execute();
  $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);
} else {
  // Get all trainees with basic info
  $query = "
    SELECT 
      u.id, 
      u.full_name,
      u.email,
      u.status,
      (SELECT MIN(pe.enrollment_date) FROM program_enrollments pe WHERE pe.user_id = u.id) AS enrollment_date
    FROM 
      users u
    WHERE 
      u.role = 'trainee'
    ORDER BY 
      u.full_name
  ";
  $stmt = $pdo->prepare($query);
  $stmt->execute();
  $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // For each trainee, get their program enrollments
  foreach ($trainees as &$trainee) {
    $query = "
      SELECT 
        p.id,
        p.title,
        pe.enrollment_date,
        pe.completion_status,
        pe.completion_percentage
      FROM 
        program_enrollments pe
      JOIN 
        programs p ON pe.program_id = p.id
      WHERE 
        pe.user_id = :userId
      ORDER BY
        pe.enrollment_date DESC
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $trainee['id'], PDO::PARAM_INT);
    $stmt->execute();
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $trainee['programs'] = $programs;
    
    // Add phone field (if exists in your database, modify accordingly)
    $trainee['phone'] = null; // Set to actual field if exists in your schema
  }
}

http_response_code(200);
echo json_encode($trainees);
exit;
?>