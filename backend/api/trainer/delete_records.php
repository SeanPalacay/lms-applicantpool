<?php
// lms-forbes/backend/api/trainer/delete_records.php
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

if (!$user || ($user['role'] !== 'trainer' && $user['role'] !== 'administrator')) {
  http_response_code(403);
  echo json_encode(['error' => 'Permission denied']);
  exit;
}

// Get request data
$requestData = json_decode(file_get_contents('php://input'), true);

if (!$requestData || !isset($requestData['record_ids']) || !is_array($requestData['record_ids']) || empty($requestData['record_ids'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Record IDs are required']);
  exit;
}

$recordIds = array_map('intval', $requestData['record_ids']);

try {
  // Start transaction
  $pdo->beginTransaction();
  
  // Get file paths for records (needed to delete files from the file system)
  $placeholders = implode(',', array_fill(0, count($recordIds), '?'));
  $query = "SELECT id, file_path FROM records WHERE id IN ($placeholders)";
  $stmt = $pdo->prepare($query);
  
  foreach ($recordIds as $index => $id) {
    $stmt->bindValue($index + 1, $id, PDO::PARAM_INT);
  }
  
  $stmt->execute();
  $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // Delete physical files if they exist
  foreach ($records as $record) {
    if (!empty($record['file_path'])) {
      $filePath = $_SERVER['DOCUMENT_ROOT'] . $record['file_path'];
      if (file_exists($filePath)) {
        unlink($filePath);
      }
    }
  }
  
  // Delete records from database
  $query = "DELETE FROM records WHERE id IN ($placeholders)";
  $stmt = $pdo->prepare($query);
  
  foreach ($recordIds as $index => $id) {
    $stmt->bindValue($index + 1, $id, PDO::PARAM_INT);
  }
  
  $stmt->execute();
  $deletedCount = $stmt->rowCount();
  
  // Commit transaction
  $pdo->commit();
  
  http_response_code(200);
  echo json_encode([
    'success' => true,
    'message' => "$deletedCount record(s) deleted successfully"
  ]);

} catch (PDOException $e) {
  // Rollback transaction on error
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  
  error_log('Error in delete_records.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
  // Rollback transaction on error
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  
  error_log('Error in delete_records.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while deleting records']);
}
?>