<?php
// lms-forbes/backend/api/trainer/delete_milestone.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

// Check if milestone ID is provided
if (!isset($_GET['milestoneId'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Milestone ID is required']);
  exit;
}

$milestoneId = $_GET['milestoneId'];

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

// Begin transaction
$pdo->beginTransaction();

try {
  // First delete milestone progress records
  $query = "DELETE FROM milestone_progress WHERE milestone_id = :milestoneId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':milestoneId', $milestoneId, PDO::PARAM_INT);
  $stmt->execute();
  
  // Then delete the milestone
  $query = "DELETE FROM milestones WHERE id = :milestoneId AND created_by = :trainerId";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':milestoneId', $milestoneId, PDO::PARAM_INT);
  $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
  $stmt->execute();
  
  // Commit transaction
  $pdo->commit();
  
  // Return success response
  http_response_code(200);
  echo json_encode([
    'success' => true,
    'message' => 'Milestone deleted successfully'
  ]);
  
} catch (Exception $e) {
  // Rollback transaction on error
  $pdo->rollBack();
  
  http_response_code(500);
  echo json_encode(['error' => 'Failed to delete milestone: ' . $e->getMessage()]);
}
exit;
?>