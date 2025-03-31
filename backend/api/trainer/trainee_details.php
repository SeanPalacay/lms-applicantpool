<?php
// trainee_details.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Turn off error display for production
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check authorization and get traineeId
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

// Decode token
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid token format']);
  exit;
}

list($trainerId, $timestamp) = explode(':', $decodedToken);

// Validate token
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

// Get trainee ID from request
$traineeId = isset($_GET['traineeId']) ? (int)$_GET['traineeId'] : 0;
if ($traineeId <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid trainee ID']);
  exit;
}

try {
  // Get trainee basic info
  $query = "
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.department,
      u.created_at AS registration_date
    FROM users u
    WHERE u.id = :traineeId AND u.role = 'trainee'
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
  $stmt->execute();
  $traineeData = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$traineeData) {
    http_response_code(404);
    echo json_encode(['error' => 'Trainee not found']);
    exit;
  }

  // Get enrolled programs
  $query = "
    SELECT 
      pe.id,
      pe.program_id,
      p.title,
      p.description,
      p.type,
      pe.enrollment_date,
      pe.completion_status,
      pe.completion_percentage
    FROM program_enrollments pe
    JOIN programs p ON pe.program_id = p.id
    WHERE pe.user_id = :traineeId
    ORDER BY pe.enrollment_date DESC
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
  $stmt->execute();
  $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $traineeData['programs'] = $programs;
  
  // Get milestones
  $query = "
    SELECT 
      m.id,
      m.program_id,
      p.title AS program_title,
      m.title,
      m.description,
      m.due_date,
      mp.status,
      mp.completion_date
    FROM milestone_progress mp
    JOIN milestones m ON mp.milestone_id = m.id
    JOIN programs p ON m.program_id = p.id
    WHERE mp.user_id = :traineeId
    ORDER BY m.due_date DESC
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
  $stmt->execute();
  $milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $traineeData['milestones'] = $milestones;
  
  // Get quiz attempts
  $query = "
    SELECT 
      qa.id,
      qa.quiz_id,
      q.title,
      q.description,
      p.id AS program_id,
      p.title AS program_title,
      qa.score,
      q.passing_score,
      qa.feedback,
      qa.time_taken,
      qa.attempt_date
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN programs p ON q.program_id = p.id
    WHERE qa.user_id = :traineeId
    ORDER BY qa.attempt_date DESC
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
  $stmt->execute();
  $quizAttempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $traineeData['quiz_attempts'] = $quizAttempts;

  // Get practical exam attempts
  $query = "
    SELECT 
      pea.id,
      pea.exam_id,
      pe.title AS exam_title,
      pe.description,
      p.id AS program_id,
      p.title AS program_title,
      pea.score,
      pe.max_score,
      pea.feedback,
      pea.submission_text,
      pea.submitted_at,
      pea.graded_at,
      pea.graded_by,
      u.full_name AS graded_by_name
    FROM 
      practical_exam_attempts pea
    JOIN 
      practical_exams pe ON pea.exam_id = pe.id
    JOIN 
      programs p ON pe.program_id = p.id
    LEFT JOIN 
      users u ON pea.graded_by = u.id
    WHERE 
      pea.user_id = :traineeId
    ORDER BY 
      pea.submitted_at DESC
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
  $stmt->execute();
  $practicalExamAttempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $traineeData['practical_exam_attempts'] = $practicalExamAttempts;
  
  // Get performance incidents
  $query = "
    SELECT 
      pi.id,
      pi.incident_type,
      pi.description,
      pi.incident_date,
      pi.reported_by,
      u.full_name AS reported_by_name
    FROM performance_incidents pi
    LEFT JOIN users u ON pi.reported_by = u.id
    WHERE pi.user_id = :traineeId
    ORDER BY pi.incident_date DESC
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
  $stmt->execute();
  $performanceIncidents = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $traineeData['performance_incidents'] = $performanceIncidents;
  
  // Get notifications
  $query = "
    SELECT 
      id,
      type,
      title,
      message,
      created_at,
      read_at
    FROM notifications
    WHERE user_id = :traineeId
    ORDER BY created_at DESC
    LIMIT 10
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
  $stmt->execute();
  $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $traineeData['notifications'] = $notifications;
  
  // Get certificates (if any)
  $query = "
    SELECT 
      r.id,
      r.description AS title,
      p.title AS program_title,
      r.created_at AS issue_date,
      r.file_path
    FROM records r
    LEFT JOIN programs p ON r.description LIKE CONCAT('%', p.title, '%')
    WHERE r.user_id = :traineeId AND r.category = 'certificates'
    ORDER BY r.created_at DESC
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
  $stmt->execute();
  $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $traineeData['certificates'] = $certificates;
  
  // Calculate overall progress and average quiz score
  $totalProgress = 0;
  $programCount = count($programs);
  
  if ($programCount > 0) {
    foreach ($programs as $program) {
      $totalProgress += $program['completion_percentage'];
    }
    $traineeData['overall_progress'] = round($totalProgress / $programCount, 2);
  } else {
    $traineeData['overall_progress'] = 0;
  }
  
  $totalScore = 0;
  $quizCount = count($quizAttempts);
  
  if ($quizCount > 0) {
    foreach ($quizAttempts as $attempt) {
      $totalScore += $attempt['score'];
    }
    $traineeData['average_quiz_score'] = round($totalScore / $quizCount, 2);
  } else {
    $traineeData['average_quiz_score'] = 0;
  }

  // Return results
  http_response_code(200);
  echo json_encode($traineeData);

} catch (Exception $e) {
  error_log('Error in trainee_details.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while loading trainee details: ' . $e->getMessage()]);
}
exit;
?>