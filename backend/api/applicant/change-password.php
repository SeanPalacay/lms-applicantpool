<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers
header('Content-Type: application/json');

// Optionally disable display_errors in production
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/php/logs/php_error_log'); // Adjust path or remove

require_once __DIR__ . '/../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Read Authorization header for Bearer token
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// Fallback: accept token in the query string (for testing only)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// If token is still empty, return 401
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Only allow PUT method
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use PUT for password changes.']);
    exit;
}

try {
    if (!isset($pdo)) {
        throw new Exception('Database connection not established');
    }

    // In a real system, parse the token to get user ID
    // For this example, we'll use a hard-coded ID
    $userId = 4; // Hard-coded for example; should be extracted from token
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request data']);
        exit;
    }
    
    // Validate required fields
    if (empty($data['current_password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Current password is required']);
        exit;
    }
    
    if (empty($data['new_password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'New password is required']);
        exit;
    }
    
    // Validate password length
    if (strlen($data['new_password']) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'New password must be at least 8 characters long']);
        exit;
    }
    
    // Get current user data (to verify the current password)
    $userQuery = "
        SELECT id, password 
        FROM users 
        WHERE id = ? AND role = 'applicant'
        LIMIT 1
    ";
    
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Verify current password
    if (!password_verify($data['current_password'], $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }
    
    // Hash the new password
    $newPasswordHash = password_hash($data['new_password'], PASSWORD_BCRYPT);
    
    // Update the password
    $updateQuery = "
        UPDATE users 
        SET password = ? 
        WHERE id = ?
    ";
    
    $updateStmt = $pdo->prepare($updateQuery);
    $updateResult = $updateStmt->execute([$newPasswordHash, $userId]);
    
    if (!$updateResult) {
        throw new Exception('Failed to update password');
    }
    
    // Log activity
    $activityQuery = "
        INSERT INTO user_activity (user_id, activity_type, details) 
        VALUES (?, 'password_change', 'Changed account password')
    ";
    
    $activityStmt = $pdo->prepare($activityQuery);
    $activityStmt->execute([$userId]);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Change Password API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("Change Password API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
    exit;
}
?>