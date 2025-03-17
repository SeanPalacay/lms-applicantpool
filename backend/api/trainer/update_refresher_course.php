<?php
// lms-forbes/backend/api/trainer/update_refresher_course.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check if it's a PUT request
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['title']) || trim($input['title']) === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Title is required']);
  exit;
}

// Prepare update data
$title = trim($input['title']);
$description = isset($input['description']) ? trim($input['description']) : null;
$duration_days = isset($input['duration_days']) ? intval($input['duration_days']) : 7;
$related_program_id = isset($input['related_program_id']) && !empty($input['related_program_id']) ? 
  intval($input['related_program_id']) : null;
$content = isset($input['content']) ? trim($input['content']) : null;
$status = isset($input['status']) && in_array($input['status'], ['draft', 'active']) ? 
  $input['status'] : 'draft';
$materials = isset($input['materials']) && is_array($input['materials']) ? 
  json_encode($input['materials']) : null;

try {
  // Update the refresher course
  $query = "
    UPDATE programs
    SET
      title = :title,
      description = :description,
      related_program_id = :related_program_id,
      content = :content,
      status = :status,
      duration_days = :duration_days,
      materials = :materials,
      updated_at = NOW()
    WHERE
      id = :id
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':title', $title);
  $stmt->bindParam(':description', $description);
  $stmt->bindParam(':related_program_id', $related_program_id);
  $stmt->bindParam(':content', $content);
  $stmt->bindParam(':status', $status);
  $stmt->bindParam(':duration_days', $duration_days);
  $stmt->bindParam(':materials', $materials);
  $stmt->bindParam(':id', $courseId);
  
  $stmt->execute();
  
  // Return success response
  http_response_code(200);
  echo json_encode([
    'success' => true,
    'message' => 'Refresher course updated successfully',
    'id' => $courseId
  ]);
  
} catch (PDOException $e) {
  error_log('Error in update_refresher_course.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
  error_log('Error in update_refresher_course.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while updating the refresher course']);
}
?>