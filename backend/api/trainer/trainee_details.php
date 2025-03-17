<?php
// lms-forbes/backend/api/trainer/trainee_details.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check if trainee ID is provided
if (!isset($_GET['traineeId'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Trainee ID is required']);
  exit;
}

$traineeId = $_GET['traineeId'];

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

// Fetch trainee basic info
$query = "
  SELECT 
    u.id, 
    u.full_name,
    u.email,
    u.status,
    u.department,
    u.created_at AS registration_date,
    u.last_login
  FROM 
    users u
  WHERE 
    u.id = :traineeId
    AND u.role = 'trainee'
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
$stmt->execute();
$trainee = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$trainee) {
  http_response_code(404);
  echo json_encode(['error' => 'Trainee not found']);
  exit;
}

// Fetch trainee program enrollments
$query = "
  SELECT 
    p.id,
    p.title,
    p.description,
    p.type,
    pe.enrollment_date,
    pe.completion_status,
    pe.completion_percentage
  FROM 
    program_enrollments pe
  JOIN 
    programs p ON pe.program_id = p.id
  WHERE 
    pe.user_id = :traineeId
  ORDER BY 
    pe.enrollment_date DESC
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
$stmt->execute();
$programs = $stmt->fetchAll(PDO::FETCH_ASSOC);

$trainee['programs'] = $programs;

// Fetch milestone progress
$query = "
  SELECT 
    m.id,
    m.title,
    m.description,
    m.due_date,
    p.id AS program_id,
    p.title AS program_title,
    mp.status,
    mp.completion_date
  FROM 
    milestone_progress mp
  JOIN 
    milestones m ON mp.milestone_id = m.id
  JOIN 
    programs p ON m.program_id = p.id
  WHERE 
    mp.user_id = :traineeId
  ORDER BY 
    m.due_date DESC
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
$stmt->execute();
$milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);

$trainee['milestones'] = $milestones;

// Fetch quiz attempts
$query = "
  SELECT 
    q.id,
    q.title,
    q.program_id,
    p.title AS program_title,
    qa.score,
    qa.time_taken,
    qa.attempt_date,
    qa.feedback
  FROM 
    quiz_attempts qa
  JOIN 
    quizzes q ON qa.quiz_id = q.id
  JOIN 
    programs p ON q.program_id = p.id
  WHERE 
    qa.user_id = :traineeId
  ORDER BY 
    qa.attempt_date DESC
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
$stmt->execute();
$quizAttempts = $stmt->fetchAll(PDO::FETCH_ASSOC);

$trainee['quiz_attempts'] = $quizAttempts;

// Fetch performance incidents
$query = "
  SELECT 
    pi.id,
    pi.incident_type,
    pi.description,
    pi.incident_date,
    u.full_name AS reported_by_name
  FROM 
    performance_incidents pi
  LEFT JOIN 
    users u ON pi.reported_by = u.id
  WHERE 
    pi.user_id = :traineeId
  ORDER BY 
    pi.incident_date DESC
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
$stmt->execute();
$incidents = $stmt->fetchAll(PDO::FETCH_ASSOC);

$trainee['performance_incidents'] = $incidents;

// Calculate overall progress
$totalPrograms = count($programs);
$totalProgress = 0;

if ($totalPrograms > 0) {
  foreach ($programs as $program) {
    if ($program['completion_status'] === 'completed') {
      $totalProgress += 100;
    } elseif ($program['completion_status'] === 'in_progress') {
      $totalProgress += $program['completion_percentage'];
    }
  }
  
  $trainee['overall_progress'] = round($totalProgress / $totalPrograms);
} else {
  $trainee['overall_progress'] = 0;
}

// Count completed milestones
$completedMilestones = 0;
$totalMilestones = count($milestones);

foreach ($milestones as $milestone) {
  if ($milestone['status'] === 'completed') {
    $completedMilestones++;
  }
}

$trainee['milestones_completed'] = $completedMilestones;
$trainee['milestones_total'] = $totalMilestones;

// Calculate average quiz score
$totalScore = 0;
$quizCount = count($quizAttempts);

foreach ($quizAttempts as $attempt) {
  $totalScore += $attempt['score'];
}

$trainee['average_quiz_score'] = $quizCount > 0 ? round($totalScore / $quizCount, 2) : 0;

http_response_code(200);
echo json_encode($trainee);
exit;
?>