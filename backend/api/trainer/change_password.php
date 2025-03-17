<?php
// lms-forbes/backend/api/trainer/change_password.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

list($userId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24-hour expiration)
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

// Get JSON input data
$inputData = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
if (empty($inputData['current_password']) || empty($inputData['new_password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Current password and new password are required']);
    exit;
}

// Verify new password length
if (strlen($inputData['new_password']) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'New password must be at least 8 characters long']);
    exit;
}

try {
    // Get user password
    $query = "SELECT id, password, role FROM users WHERE id = :id";
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

    // Verify current password
    if (!password_verify($inputData['current_password'], $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }

    // Hash new password
    $hashedPassword = password_hash($inputData['new_password'], PASSWORD_DEFAULT);

    // Start transaction
    $pdo->beginTransaction();

    // Update password
    $updateQuery = "UPDATE users SET password = :password WHERE id = :id";
    $stmt = $pdo->prepare($updateQuery);
    $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    // Log this activity
    $activityQuery = "
        INSERT INTO user_activity (user_id, activity_type, details)
        VALUES (:user_id, 'password_change', 'Changed account password')
    ";
    
    $stmt = $pdo->prepare($activityQuery);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    // Commit transaction
    $pdo->commit();

    http_response_code(200);
    echo json_encode(['message' => 'Password updated successfully']);

} catch (PDOException $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }

    error_log('Error in change_password.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }

    error_log('Error in change_password.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while changing password']);
}
?>