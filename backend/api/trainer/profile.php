<?php
// lms-forbes/backend/api/trainer/profile.php
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

list($userId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24-hour expiration)
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
  exit;
}

// Verify user role
try {
  $query = "SELECT id, username, full_name, email, role, created_at, department, last_login FROM users WHERE id = :id";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
  $stmt->execute();
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found']);
    exit;
  }

  if ($user['role'] !== 'trainer' && $user['role'] !== 'administrator') {
    http_response_code(403);
    echo json_encode(['error' => 'Permission denied']);
    exit;
  }

  // Check if trainer_profiles table exists
  $tableExistsQuery = "
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'trainer_profiles'
  ";
  $stmt = $pdo->query($tableExistsQuery);
  $tableExists = $stmt->fetchColumn() > 0;
  
  $profile = null;
  
  // Get additional profile information if the table exists
  if ($tableExists) {
    $query = "
      SELECT phone, bio
      FROM trainer_profiles
      WHERE user_id = :userId
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
  }
  
  // Merge profile info with user data
  $userData = [
    'id' => $user['id'],
    'username' => $user['username'],
    'full_name' => $user['full_name'],
    'email' => $user['email'],
    'role' => $user['role'],
    'created_at' => $user['created_at'],
    'department' => $user['department'],
    'last_login' => $user['last_login'],
    'phone' => $profile ? $profile['phone'] : null,
    'bio' => $profile ? $profile['bio'] : null
  ];
  
  http_response_code(200);
  echo json_encode($userData);

} catch (PDOException $e) {
  error_log('Error in profile.php: ' . $e->getMessage());
  
  // Check if it's a "Table doesn't exist" error
  if (strpos($e->getMessage(), "doesn't exist") !== false) {
    // Return a basic profile using just the users table data
    try {
      $query = "SELECT id, username, full_name, email, role, created_at FROM users WHERE id = :id";
      $stmt = $pdo->prepare($query);
      $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
      $stmt->execute();
      $user = $stmt->fetch(PDO::FETCH_ASSOC);
      
      if ($user) {
        $userData = [
          'id' => $user['id'],
          'username' => $user['username'],
          'full_name' => $user['full_name'],
          'email' => $user['email'],
          'role' => $user['role'],
          'created_at' => $user['created_at'],
          'phone' => null,
          'bio' => null
        ];
        
        http_response_code(200);
        echo json_encode($userData);
        exit;
      }
    } catch (Exception $innerEx) {
      error_log('Error in profile.php fallback: ' . $innerEx->getMessage());
    }
  }
  
  http_response_code(500);
  echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
  error_log('Error in profile.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while fetching profile information']);
}
?>