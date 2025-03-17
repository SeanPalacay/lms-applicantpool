<?php
// lms-forbes/backend/api/trainer/delete_refresher_course.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check if it's a DELETE request
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

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

// Check if the refresher course exists
$query = "SELECT id FROM programs WHERE id = :id AND type = 'refresher'";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $courseId, PDO::PARAM_INT);
$stmt->execute();
$course = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$course) {
  http_response_code(404);
  echo json_encode(['error' => 'Refresher course not found']);
  exit;
}

try {
  // Start transaction to ensure data consistency
  $pdo->beginTransaction();
  
  // First check if there are any enrollments
  $query = "SELECT COUNT(*) FROM program_enrollments WHERE program_id = :programId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':programId', $courseId, PDO::PARAM_INT);
  $stmt->execute();
  $enrollmentCount = $stmt->fetchColumn();
  
  // If there are enrollments, don't allow deletion
  if ($enrollmentCount > 0) {
    $pdo->rollBack();
    http_response_code(400);
    echo json_encode([
      'error' => 'Cannot delete this course because it has active enrollments. Please unenroll all trainees first.'
    ]);
    exit;
  }
  
  // Delete any quizzes associated with this course
  $query = "DELETE FROM quizzes WHERE program_id = :programId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':programId', $courseId, PDO::PARAM_INT);
  $stmt->execute();
  
  // Delete any milestones associated with this course
  $query = "DELETE FROM milestones WHERE program_id = :programId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':programId', $courseId, PDO::PARAM_INT);
  $stmt->execute();
  
  // Delete the refresher course itself
  $query = "DELETE FROM programs WHERE id = :programId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':programId', $courseId, PDO::PARAM_INT);
  $stmt->execute();
  
  // Commit the transaction
  $pdo->commit();
  
  // Return success response
  http_response_code(200);
  echo json_encode([
    'success' => true,
    'message' => 'Refresher course deleted successfully'
  ]);
  
} catch (PDOException $e) {
  // Rollback the transaction on error
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  
  error_log('Error in delete_refresher_course.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
  // Rollback the transaction on error
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  
  error_log('Error in delete_refresher_course.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while deleting the refresher course']);
}
?>