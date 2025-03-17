<?php
// lms-forbes/backend/api/trainer/milestones.php
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

// First, get all milestones
$query = "
  SELECT 
    m.id,
    m.program_id,
    m.title,
    m.description,
    m.due_date,
    p.title AS program_title
  FROM 
    milestones m
  LEFT JOIN 
    programs p ON m.program_id = p.id
  WHERE 
    m.created_by = :trainerId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
$stmt->execute();
$milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Prepare response data
$result = [];

foreach ($milestones as $milestone) {
  // Get trainees enrolled in this milestone's program
  $query = "
    SELECT 
      u.id,
      u.full_name,
      mp.status,
      mp.completion_date
    FROM 
      users u
    JOIN 
      program_enrollments pe ON u.id = pe.user_id
    LEFT JOIN 
      milestone_progress mp ON u.id = mp.user_id AND mp.milestone_id = :milestoneId
    WHERE 
      pe.program_id = :programId
      AND u.role = 'trainee'
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':milestoneId', $milestone['id'], PDO::PARAM_INT);
  $stmt->bindParam(':programId', $milestone['program_id'], PDO::PARAM_INT);
  $stmt->execute();
  $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // Format trainees data
  $formattedTrainees = [];
  foreach ($trainees as $trainee) {
    $formattedTrainees[] = [
      'id' => $trainee['id'],
      'full_name' => $trainee['full_name'],
      'progress' => [
        'status' => $trainee['status'] ?: 'not_started',
        'completion_date' => $trainee['completion_date']
      ]
    ];
  }
  
  // Build response object
  $result[] = [
    'id' => $milestone['id'],
    'program_id' => $milestone['program_id'],
    'title' => $milestone['title'],
    'description' => $milestone['description'],
    'due_date' => $milestone['due_date'],
    'program' => [
      'id' => $milestone['program_id'],
      'title' => $milestone['program_title'] ?: 'Unknown Program'
    ],
    'trainees' => $formattedTrainees
  ];
}

http_response_code(200);
echo json_encode($result);
exit;
?>