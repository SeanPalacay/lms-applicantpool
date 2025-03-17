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

try {
    if (!isset($pdo)) {
        throw new Exception('Database connection not established');
    }

    // In a real system, parse the token to get user ID
    // For this example, we'll use a hard-coded ID
    $userId = 4; // Hard-coded for example; should be extracted from token
    
    // Handle different HTTP methods
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Get user profile data - excluding additional_info which doesn't exist
            $query = "
                SELECT id, username, full_name, email, role, status, created_at, last_login, 
                       department
                FROM users 
                WHERE id = ? AND role = 'applicant'
                LIMIT 1
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                exit;
            }
            
            // Add empty additional_info for client compatibility
            $user['additional_info'] = '{}';
            
            // Return user data
            echo json_encode($user);
            break;
            
        case 'PUT':
            // Update user profile
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid request data']);
                exit;
            }
            
            // Validate required fields
            if (empty($data['full_name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Full name is required']);
                exit;
            }
            
            if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Valid email is required']);
                exit;
            }
            
            // Check if email is already taken by another user
            $emailQuery = "
                SELECT id FROM users 
                WHERE email = ? AND id != ? 
                LIMIT 1
            ";
            
            $emailStmt = $pdo->prepare($emailQuery);
            $emailStmt->execute([$data['email'], $userId]);
            $existingUser = $emailStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingUser) {
                http_response_code(409);
                echo json_encode(['error' => 'Email address is already in use']);
                exit;
            }
            
            // Update user data - exclude additional_info since it doesn't exist
            $updateQuery = "
                UPDATE users 
                SET full_name = ?, email = ?
                WHERE id = ?
            ";
            
            $updateStmt = $pdo->prepare($updateQuery);
            $updateResult = $updateStmt->execute([
                $data['full_name'],
                $data['email'],
                $userId
            ]);
            
            if (!$updateResult) {
                throw new Exception('Failed to update user profile');
            }
            
            // Log activity
            $activityQuery = "
                INSERT INTO user_activity (user_id, activity_type, details) 
                VALUES (?, 'login', 'Updated profile information')
            ";
            
            $activityStmt = $pdo->prepare($activityQuery);
            $activityStmt->execute([$userId]);
            
            // Get updated user data
            $userQuery = "
                SELECT id, username, full_name, email, role, status, created_at, last_login, 
                       department
                FROM users 
                WHERE id = ?
                LIMIT 1
            ";
            
            $userStmt = $pdo->prepare($userQuery);
            $userStmt->execute([$userId]);
            $updatedUser = $userStmt->fetch(PDO::FETCH_ASSOC);
            
            // Add empty additional_info for client compatibility
            $updatedUser['additional_info'] = '{}';
            
            // Return updated user data
            echo json_encode($updatedUser);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    error_log("Profile API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("Profile API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
    exit;
}
?>