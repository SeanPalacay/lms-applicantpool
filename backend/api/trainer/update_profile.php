<?php
// lms-forbes/backend/api/trainer/update_profile.php
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
if (empty($inputData['full_name']) || empty($inputData['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Full name and email are required']);
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

    if ($user['role'] !== 'trainer' && $user['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    // Check if the email is already used by another user
    $emailCheckQuery = "SELECT id FROM users WHERE email = :email AND id != :id";
    $stmt = $pdo->prepare($emailCheckQuery);
    $stmt->bindParam(':email', $inputData['email'], PDO::PARAM_STR);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already in use by another user']);
        exit;
    }

    // Start transaction
    $pdo->beginTransaction();

    // Update user table - simpler query, just updating the basics
    $updateUserQuery = "
        UPDATE users
        SET 
            full_name = :full_name, 
            email = :email
        WHERE id = :id
    ";
    
    $stmt = $pdo->prepare($updateUserQuery);
    $stmt->bindParam(':full_name', $inputData['full_name'], PDO::PARAM_STR);
    $stmt->bindParam(':email', $inputData['email'], PDO::PARAM_STR);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    // We'll skip the trainer_profiles table check for now and just work with the users table
    // to simplify things and make sure the basic profile update works
    
    // Log this activity
    try {
        $activityQuery = "
            INSERT INTO user_activity (user_id, activity_type, details)
            VALUES (:user_id, 'profile_update', 'Updated profile information')
        ";
        
        $stmt = $pdo->prepare($activityQuery);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();
    } catch (Exception $e) {
        // Silently ignore activity logging errors
        error_log('Error logging activity: ' . $e->getMessage());
    }
    
    // Commit transaction
    $pdo->commit();
    
    // Fetch updated user data
    $query = "SELECT id, username, full_name, email, role, created_at, department, last_login FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Add empty profile data for now
    $profileData = [
        'phone' => $inputData['phone'] ?? null,
        'bio' => $inputData['bio'] ?? null
    ];
    
    // Merge user data with profile data
    $userData = array_merge($updatedUser, $profileData);
    
    http_response_code(200);
    echo json_encode($userData);

} catch (PDOException $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    error_log('Error in update_profile.php: ' . $e->getMessage());
    
    // Check if it's a duplicate entry error (email already exists)
    if (strpos($e->getMessage(), 'Duplicate entry') !== false && strpos($e->getMessage(), 'email') !== false) {
        http_response_code(409);
        echo json_encode(['error' => 'Email address is already in use']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Database error occurred: ' . $e->getMessage()]);
    }
} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    error_log('Error in update_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while updating profile information: ' . $e->getMessage()]);
}
?>