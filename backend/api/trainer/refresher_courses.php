<?php
// lms-forbes/backend/api/trainer/refresher_courses.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Enable detailed error logging
ini_set('display_errors', 0);
error_reporting(E_ALL);
error_log("Starting refresher_courses.php");

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
try {
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

  error_log("Trainer role verified successfully for ID: " . $trainerId);

  // Check if the 'type' column exists in the programs table
  $checkColumnQuery = "SHOW COLUMNS FROM programs LIKE 'type'";
  $stmt = $pdo->prepare($checkColumnQuery);
  $stmt->execute();
  $typeColumnExists = $stmt->rowCount() > 0;

  error_log("Type column exists: " . ($typeColumnExists ? 'yes' : 'no'));

  // Simplified query to get just the basics - avoiding complex joins that might cause issues
  if ($typeColumnExists) {
    // If 'type' column exists, use it to filter for refresher courses
    $query = "
      SELECT 
        p.id,
        p.title,
        p.description,
        p.created_at,
        p.created_by,
        'active' AS status  -- Simple default for now
      FROM 
        programs p
      WHERE 
        p.type = 'refresher'
      ORDER BY 
        p.created_at DESC
    ";
  } else {
    // If 'type' column doesn't exist, return all programs (for testing)
    $query = "
      SELECT 
        p.id,
        p.title,
        p.description,
        p.created_at,
        p.created_by,
        'active' AS status  -- Simple default for now
      FROM 
        programs p
      ORDER BY 
        p.created_at DESC
      LIMIT 10
    ";
    error_log("Type column does not exist, returning all programs");
  }
  
  error_log("Executing query: " . $query);
  $stmt = $pdo->prepare($query);
  $stmt->execute();
  $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
  error_log("Query executed successfully, found " . count($courses) . " courses");
  
  // Return simplified data without the complex enrollment details for now
  http_response_code(200);
  echo json_encode($courses);

} catch (Exception $e) {
  // Log detailed error for debugging
  error_log('Error in refresher_courses.php: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
  
  http_response_code(500);
  echo json_encode(['error' => 'An internal server error occurred: ' . $e->getMessage()]);
}
exit;
?>