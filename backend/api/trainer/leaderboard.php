<?php
// lms-forbes/backend/api/trainer/leaderboard.php
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

// Get filter parameters
$programId = isset($_GET['programId']) ? $_GET['programId'] : null;
$timeframe = isset($_GET['timeframe']) ? $_GET['timeframe'] : 'all';

// Build timeframe condition
$timeframeCondition = '';
$timeframeParams = [];

if ($timeframe !== 'all') {
$cutoffDate = date('Y-m-d H:i:s');

if ($timeframe === 'week') {
  $cutoffDate = date('Y-m-d H:i:s', strtotime('-7 days'));
} else if ($timeframe === 'month') {
  $cutoffDate = date('Y-m-d H:i:s', strtotime('-30 days'));
} else if ($timeframe === 'quarter') {
  $cutoffDate = date('Y-m-d H:i:s', strtotime('-90 days'));
}

$timeframeCondition = ' AND (qa.attempt_date >= :cutoff_date OR pea.submitted_at >= :cutoff_date)';
$timeframeParams[':cutoff_date'] = $cutoffDate;
}

try {
// Get all trainees with basic info
$query = "
  SELECT 
    u.id, 
    u.full_name,
    u.email,
    u.phone,
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
  // Get program enrollments
  $programQuery = "
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
  ";
  
  // Add program filter if specified
  if ($programId) {
    $programQuery .= " AND p.id = :programId";
  }
  
  $programQuery .= " ORDER BY pe.enrollment_date DESC";
  
  $stmt = $pdo->prepare($programQuery);
  $stmt->bindParam(':userId', $trainee['id'], PDO::PARAM_INT);
  
  if ($programId) {
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
  }
  
  $stmt->execute();
  $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  $trainee['programs'] = $programs;
  
  // Calculate program completion rate
  $totalPrograms = count($programs);
  $completedPrograms = 0;
  $inProgressTotal = 0;
  $inProgressCount = 0;
  
  foreach ($programs as $program) {
    if ($program['completion_status'] === 'completed') {
      $completedPrograms++;
    } else if ($program['completion_status'] === 'in_progress' && $program['completion_percentage'] > 0) {
      $inProgressTotal += $program['completion_percentage'];
      $inProgressCount++;
    }
  }
  
  if ($totalPrograms > 0) {
    $completedPercentage = ($completedPrograms / $totalPrograms) * 100;
    $inProgressContribution = $inProgressCount > 0 
      ? ($inProgressCount / $totalPrograms) * ($inProgressTotal / $inProgressCount) 
      : 0;
    
    $trainee['completion_rate'] = round($completedPercentage + $inProgressContribution);
  } else {
    $trainee['completion_rate'] = 0;
  }
  
  // Get quiz attempts
  $quizQuery = "
    SELECT 
      q.id AS quiz_id,
      q.title AS quiz_title,
      qa.id AS attempt_id,
      qa.score,
      qa.attempt_date
    FROM 
      quiz_attempts qa
    JOIN 
      quizzes q ON qa.quiz_id = q.id
    WHERE 
      qa.user_id = :userId
  ";
  
  if ($programId) {
    $quizQuery .= " AND q.program_id = :programId";
  }
  
  if ($timeframe !== 'all') {
    $quizQuery .= " AND qa.attempt_date >= :cutoff_date";
  }
  
  $quizQuery .= " ORDER BY qa.attempt_date DESC";
  
  $stmt = $pdo->prepare($quizQuery);
  $stmt->bindParam(':userId', $trainee['id'], PDO::PARAM_INT);
  
  if ($programId) {
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
  }
  
  if ($timeframe !== 'all') {
    $stmt->bindParam(':cutoff_date', $cutoffDate);
  }
  
  $stmt->execute();
  $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // Calculate average quiz score
  $quizTotal = 0;
  foreach ($quizzes as $quiz) {
    $quizTotal += $quiz['score'];
  }
  
  $trainee['quiz_score'] = count($quizzes) > 0 ? round($quizTotal / count($quizzes), 2) : 0;
  $trainee['quizzes'] = $quizzes;
  
  // Get practical exam attempts
  $examQuery = "
    SELECT 
      pe.id AS exam_id,
      pe.title AS exam_title,
      pea.id AS attempt_id,
      pea.score,
      pea.submitted_at,
      pea.graded_at
    FROM 
      practical_exam_attempts pea
    JOIN 
      practical_exams pe ON pea.exam_id = pe.id
    WHERE 
      pea.user_id = :userId
      AND pea.graded_at IS NOT NULL
  ";
  
  if ($programId) {
    $examQuery .= " AND pe.program_id = :programId";
  }
  
  if ($timeframe !== 'all') {
    $examQuery .= " AND pea.submitted_at >= :cutoff_date";
  }
  
  $examQuery .= " ORDER BY pea.submitted_at DESC";
  
  $stmt = $pdo->prepare($examQuery);
  $stmt->bindParam(':userId', $trainee['id'], PDO::PARAM_INT);
  
  if ($programId) {
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
  }
  
  if ($timeframe !== 'all') {
    $stmt->bindParam(':cutoff_date', $cutoffDate);
  }
  
  $stmt->execute();
  $exams = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // Calculate average practical exam score
  $examTotal = 0;
  foreach ($exams as $exam) {
    $examTotal += $exam['score'];
  }
  
  $trainee['practical_score'] = count($exams) > 0 ? round($examTotal / count($exams), 2) : 0;
  $trainee['practical_exams'] = $exams;
  
  // Get grading configuration
  $configQuery = "SELECT * FROM grade_configuration LIMIT 1";
  $stmt = $pdo->prepare($configQuery);
  $stmt->execute();
  $config = $stmt->fetch(PDO::FETCH_ASSOC);
  
  // Calculate overall score based on weights
  if ($config) {
    $quizWeight = floatval($config['quiz_weight']);
    $practicalWeight = floatval($config['practical_exam_weight']);
    $passingGrade = floatval($config['passing_grade']);
  } else {
    // Default weights if no configuration exists
    $quizWeight = 0.6;
    $practicalWeight = 0.4;
    $passingGrade = 70.0;
  }
  
  // Calculate overall score
  if (count($quizzes) > 0 && count($exams) > 0) {
    // Both quiz and practical exam scores exist
    $trainee['overall_score'] = round(
      ($trainee['quiz_score'] * $quizWeight) + 
      ($trainee['practical_score'] * $practicalWeight),
      2
    );
  } else if (count($quizzes) > 0) {
    // Only quiz scores exist
    $trainee['overall_score'] = $trainee['quiz_score'];
  } else if (count($exams) > 0) {
    // Only practical exam scores exist
    $trainee['overall_score'] = $trainee['practical_score'];
  } else {
    // No scores exist
    $trainee['overall_score'] = 0;
  }
  
  // Add grade info
  $trainee['grade_config'] = [
    'quiz_weight' => $quizWeight,
    'practical_weight' => $practicalWeight,
    'passing_grade' => $passingGrade
  ];
}

// Sort trainees by overall score (descending)
usort($trainees, function($a, $b) {
  return $b['overall_score'] <=> $a['overall_score'];
});

// Add rank
foreach ($trainees as $index => &$trainee) {
  $trainee['rank'] = $index + 1;
}

http_response_code(200);
echo json_encode($trainees);

} catch (PDOException $e) {
http_response_code(500);
echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
exit;
?>