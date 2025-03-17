<?php
// lms-forbes/backend/api/trainee/update_profile.php
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

// Check if method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
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

// Get request body
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// Validate input
if (!isset($input['full_name']) || trim($input['full_name']) === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Full name is required']);
    exit;
}

if (!isset($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Valid email is required']);
    exit;
}

// Verify user role
try {
    $query = "SELECT id, role FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    if ($user['role'] !== 'trainee' && $user['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    // Check if email is already taken by another user
    $emailCheckQuery = "SELECT id FROM users WHERE email = :email AND id != :userId";
    $emailCheckStmt = $pdo->prepare($emailCheckQuery);
    $emailCheckStmt->bindParam(':email', $input['email'], PDO::PARAM_STR);
    $emailCheckStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $emailCheckStmt->execute();
    
    if ($emailCheckStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Email address is already in use by another account']);
        exit;
    }

    // Update user profile
    $updateQuery = "
        UPDATE users 
        SET full_name = :full_name, 
            email = :email
        WHERE id = :userId
    ";
    
    $updateStmt = $pdo->prepare($updateQuery);
    $updateStmt->bindParam(':full_name', $input['full_name'], PDO::PARAM_STR);
    $updateStmt->bindParam(':email', $input['email'], PDO::PARAM_STR);
    $updateStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $updateStmt->execute();

    // Log activity
    $activityDetails = "Updated profile information";
    $activityQuery = "
        INSERT INTO user_activity (user_id, activity_type, details)
        VALUES (:userId, '', :details)
    ";
    
    $activityStmt = $pdo->prepare($activityQuery);
    $activityStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $activityStmt->bindParam(':details', $activityDetails, PDO::PARAM_STR);
    $activityStmt->execute();

    // Get updated user data
    $userQuery = "SELECT id, full_name, email FROM users WHERE id = :userId";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $userStmt->execute();
    $updatedUser = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    // Return success response
    http_response_code(200);
    echo json_encode($updatedUser);

} catch (PDOException $e) {
    error_log('Error in update_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log('Error in update_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while updating profile']);
}
?>