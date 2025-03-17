<?php
// lms-forbes/backend/api/trainer/records.php
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

try {
  // Fetch all training records
  $query = "
    SELECT 
      r.id,
      r.user_id,
      r.record_type,
      r.category,
      r.file_path,
      r.description,
      r.created_at,
      u.full_name AS uploaded_by
    FROM 
      records r
    LEFT JOIN
      users u ON r.user_id = u.id
    WHERE 
      r.record_type IN ('training', 'other')
    ORDER BY
      r.created_at DESC
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->execute();
  $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  http_response_code(200);
  echo json_encode($records);

} catch (PDOException $e) {
  error_log('Error in records.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
  error_log('Error in records.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while fetching records']);
}
?>