<?php
// lms-forbes/backend/api/trainer/save_milestone.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check request method
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST' && $method !== 'PUT') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

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

// Get request body data
$requestData = json_decode(file_get_contents('php://input'), true);

if (!$requestData) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid request data']);
  exit;
}

// Validate required fields
if (empty($requestData['program_id']) || empty($requestData['title']) || empty($requestData['due_date'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Program ID, title, and due date are required']);
  exit;
}

// Get milestone ID for updates
$milestoneId = null;
if ($method === 'PUT') {
  if (!isset($_GET['milestoneId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Milestone ID is required for updates']);
    exit;
  }
  $milestoneId = $_GET['milestoneId'];
  
  // Check if milestone exists and belongs to the trainer
  $query = "SELECT id FROM milestones WHERE id = :id AND created_by = :trainerId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':id', $milestoneId, PDO::PARAM_INT);
  $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
  $stmt->execute();
  
  if (!$stmt->fetch()) {
    http_response_code(404);
    echo json_encode(['error' => 'Milestone not found or access denied']);
    exit;
  }
}

// Begin transaction
$pdo->beginTransaction();

try {
  if ($method === 'POST') {
    // Create new milestone
    $query = "
      INSERT INTO milestones (program_id, title, description, due_date, created_by, created_at)
      VALUES (:program_id, :title, :description, :due_date, :created_by, NOW())
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':program_id', $requestData['program_id'], PDO::PARAM_INT);
    $stmt->bindParam(':title', $requestData['title']);
    $stmt->bindParam(':description', $requestData['description']);
    $stmt->bindParam(':due_date', $requestData['due_date']);
    $stmt->bindParam(':created_by', $trainerId, PDO::PARAM_INT);
    $stmt->execute();
    
    $milestoneId = $pdo->lastInsertId();
  } else {
    // Update existing milestone
    $query = "
      UPDATE milestones
      SET program_id = :program_id, title = :title, 
          description = :description, due_date = :due_date
      WHERE id = :id AND created_by = :created_by
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':program_id', $requestData['program_id'], PDO::PARAM_INT);
    $stmt->bindParam(':title', $requestData['title']);
    $stmt->bindParam(':description', $requestData['description']);
    $stmt->bindParam(':due_date', $requestData['due_date']);
    $stmt->bindParam(':id', $milestoneId, PDO::PARAM_INT);
    $stmt->bindParam(':created_by', $trainerId, PDO::PARAM_INT);
    $stmt->execute();
  }
  
  // Handle trainee assignments if provided
  if (isset($requestData['trainees']) && is_array($requestData['trainees'])) {
    // First, remove existing assignments if updating
    if ($method === 'PUT') {
      $query = "DELETE FROM milestone_progress WHERE milestone_id = :milestoneId";
      $stmt = $pdo->prepare($query);
      $stmt->bindParam(':milestoneId', $milestoneId, PDO::PARAM_INT);
      $stmt->execute();
    }
    
    // Add new trainee assignments
    if (!empty($requestData['trainees'])) {
      $query = "
        INSERT INTO milestone_progress (milestone_id, user_id, status)
        VALUES (:milestone_id, :user_id, 'not_started')
      ";
      $stmt = $pdo->prepare($query);
      
      foreach ($requestData['trainees'] as $traineeId) {
        $stmt->bindParam(':milestone_id', $milestoneId, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $traineeId, PDO::PARAM_INT);
        $stmt->execute();
      }
    }
  }
  
  // Commit transaction
  $pdo->commit();
  
  // Return success response
  http_response_code($method === 'POST' ? 201 : 200);
  echo json_encode([
    'success' => true,
    'message' => $method === 'POST' ? 'Milestone created successfully' : 'Milestone updated successfully',
    'milestone_id' => $milestoneId
  ]);
  
} catch (Exception $e) {
  // Rollback transaction on error
  $pdo->rollBack();
  
  http_response_code(500);
  echo json_encode(['error' => 'Failed to ' . ($method === 'POST' ? 'create' : 'update') . ' milestone: ' . $e->getMessage()]);
}
exit;
?>