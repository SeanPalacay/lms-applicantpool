<?php
// lms-forbes/backend/api/trainer/refresher_course_details.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// For debugging - enable these temporarily to see specific errors
// ini_set('display_errors', 1);
// error_reporting(E_ALL);

// For production
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check if course ID is provided
if (!isset($_GET['courseId'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Course ID is required']);
  exit;
}

$courseId = intval($_GET['courseId']);

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

try {
  // First, check if the refresher course exists
  $checkQuery = "
    SELECT id
    FROM programs 
    WHERE id = :courseId AND type = 'refresher'
  ";
  
  $checkStmt = $pdo->prepare($checkQuery);
  $checkStmt->bindParam(':courseId', $courseId, PDO::PARAM_INT);
  $checkStmt->execute();
  
  if ($checkStmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Refresher course not found']);
    exit;
  }
  
  // Fetch refresher course basic details
  $query = "
    SELECT 
      p.id,
      p.title,
      p.description,
      p.type,
      p.created_at,
      p.created_by,
      u.full_name AS created_by_name
    FROM 
      programs p
    LEFT JOIN
      users u ON p.created_by = u.id
    WHERE 
      p.id = :courseId
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':courseId', $courseId, PDO::PARAM_INT);
  $stmt->execute();
  $course = $stmt->fetch(PDO::FETCH_ASSOC);
  
  // Determine status separately
  $statusQuery = "
    SELECT 
      CASE 
        WHEN EXISTS (SELECT 1 FROM quizzes WHERE program_id = :programId AND status = 'active') THEN 'active'
        WHEN EXISTS (SELECT 1 FROM quizzes WHERE program_id = :programId AND status = 'draft') THEN 'draft'
        ELSE 'archived'
      END AS status
  ";
  
  $statusStmt = $pdo->prepare($statusQuery);
  $statusStmt->bindParam(':programId', $courseId, PDO::PARAM_INT);
  $statusStmt->execute();
  $statusResult = $statusStmt->fetch(PDO::FETCH_ASSOC);
  
  $course['status'] = $statusResult['status'];
  
  // Get enrollment details
  $query = "
    SELECT 
      pe.id,
      pe.user_id,
      u.full_name,
      u.email,
      pe.enrollment_date,
      pe.completion_status,
      pe.completion_percentage
    FROM 
      program_enrollments pe
    JOIN
      users u ON pe.user_id = u.id
    WHERE 
      pe.program_id = :programId
    ORDER BY
      u.full_name
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':programId', $courseId, PDO::PARAM_INT);
  $stmt->execute();
  $enrollments = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  $course['enrollments'] = $enrollments;
  
  // Get quizzes
  $query = "
    SELECT 
      q.id,
      q.title,
      q.description,
      q.time_limit,
      q.passing_score,
      q.status,
      q.created_at
    FROM 
      quizzes q
    WHERE 
      q.program_id = :programId
    ORDER BY
      q.created_at DESC
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':programId', $courseId, PDO::PARAM_INT);
  $stmt->execute();
  $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  $course['quizzes'] = $quizzes;
  
  // Get milestones
  $query = "
    SELECT 
      m.id,
      m.title,
      m.description,
      m.due_date,
      m.created_at
    FROM 
      milestones m
    WHERE 
      m.program_id = :programId
    ORDER BY
      m.due_date
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':programId', $courseId, PDO::PARAM_INT);
  $stmt->execute();
  $milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  $course['milestones'] = $milestones;
  
  // Get completion statistics
  $totalEnrollments = count($enrollments);
  $completedEnrollments = 0;
  $inProgressEnrollments = 0;
  $notStartedEnrollments = 0;
  
  foreach ($enrollments as $enrollment) {
    if ($enrollment['completion_status'] === 'completed') {
      $completedEnrollments++;
    } elseif ($enrollment['completion_status'] === 'in_progress') {
      $inProgressEnrollments++;
    } else {
      $notStartedEnrollments++;
    }
  }
  
  $course['stats'] = [
    'total_enrollments' => $totalEnrollments,
    'completed' => $completedEnrollments,
    'in_progress' => $inProgressEnrollments,
    'not_started' => $notStartedEnrollments,
    'completion_rate' => $totalEnrollments > 0 ? round(($completedEnrollments / $totalEnrollments) * 100) : 0
  ];
  
  http_response_code(200);
  echo json_encode($course);

} catch (PDOException $e) {
  // Log the error but don't expose details to client
  error_log('Error in refresher_course_details.php (PDO): ' . $e->getMessage());
  
  http_response_code(500);
  echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
  // Log the error but don't expose details to client
  error_log('Error in refresher_course_details.php: ' . $e->getMessage());
  
  http_response_code(500);
  echo json_encode(['error' => 'An internal server error occurred. Please try again later.']);
}
exit;
?>