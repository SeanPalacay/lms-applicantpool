<?php
// File: backend/api/admin/convert-applicant.php
header('Content-Type: application/json');
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Add these lines for better error handling
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_log("convert-applicant.php endpoint hit with method: " . $_SERVER['REQUEST_METHOD']);

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract token from Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    error_log("Found token in Authorization header: " . substr($token, 0, 10) . "...");
}

// Verify the token and get user ID
try {
    $stmt = $pdo->prepare("SELECT user_id, role FROM auth_tokens WHERE token = :token AND expired_at > NOW()");
    $stmt->bindParam(':token', $token, PDO::PARAM_STR);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }
    
    $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
    $adminId = $tokenData['user_id'];
    $role = $tokenData['role'];
    
    // Verify admin role
    if ($role !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'Insufficient permissions']);
        exit;
    }
} catch (PDOException $e) {
    error_log("Database error verifying token: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    exit;
}

// Handle POST request to convert applicant to trainee
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get request body
        $requestData = json_decode(file_get_contents('php://input'), true);
        error_log("Request data: " . json_encode($requestData));
        
        if (!isset($requestData['user_id']) || empty($requestData['user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required']);
            exit;
        }
        
        $userId = $requestData['user_id'];
        $note = isset($requestData['note']) ? $requestData['note'] : '';
        $applicationId = isset($requestData['application_id']) ? $requestData['application_id'] : null;
        
        // Begin transaction
        $pdo->beginTransaction();
        
        // 1. Verify that the user exists and is an applicant
        $userStmt = $pdo->prepare("SELECT * FROM users WHERE id = :id AND role = 'applicant'");
        $userStmt->bindParam(':id', $userId, PDO::PARAM_INT);
        $userStmt->execute();
        
        if ($userStmt->rowCount() == 0) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'User not found or is not an applicant']);
            exit;
        }
        
        $userData = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        // 2. Update user role to trainee
        $updateRoleStmt = $pdo->prepare("UPDATE users SET role = 'trainee' WHERE id = :id");
        $updateRoleStmt->bindParam(':id', $userId, PDO::PARAM_INT);
        $updateRoleStmt->execute();
        
        // 3. If application ID is provided, update application status to 'hired'
        if ($applicationId) {
            $updateAppStmt = $pdo->prepare("UPDATE applications SET status = 'hired', updated_at = NOW() WHERE id = :id AND user_id = :user_id");
            $updateAppStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
            $updateAppStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $updateAppStmt->execute();
            
            // Also check and update job_applications table if it exists
            $checkJobAppStmt = $pdo->prepare("SELECT id FROM job_applications WHERE id = :id AND user_id = :user_id");
            $checkJobAppStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
            $checkJobAppStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $checkJobAppStmt->execute();
            
            if ($checkJobAppStmt->rowCount() > 0) {
                $updateJobAppStmt = $pdo->prepare("UPDATE job_applications SET status = 'hired', updated_at = NOW() WHERE id = :id AND user_id = :user_id");
                $updateJobAppStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
                $updateJobAppStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $updateJobAppStmt->execute();
            }
        }
        
        // 4. Add a note to the conversion if provided
        if (!empty($note)) {
            $noteStmt = $pdo->prepare("
                INSERT INTO user_activity (
                    user_id, 
                    activity_type, 
                    details, 
                    activity_time
                ) VALUES (
                    :user_id, 
                    'profile_update', 
                    :details, 
                    NOW()
                )
            ");
            
            $details = "User role changed from applicant to trainee by admin. Note: " . $note;
            $noteStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $noteStmt->bindParam(':details', $details, PDO::PARAM_STR);
            $noteStmt->execute();
        }
        
        // 5. Add notification for the user
        $notifyStmt = $pdo->prepare("
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                created_at
            ) VALUES (
                :user_id,
                'success',
                'Application Status Updated',
                :message,
                NOW()
            )
        ");
        
        $message = "Congratulations! Your application has been accepted and your account has been upgraded to trainee status.";
        $notifyStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $notifyStmt->bindParam(':message', $message, PDO::PARAM_STR);
        $notifyStmt->execute();
        
        // Commit transaction
        $pdo->commit();
        
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'User successfully converted from applicant to trainee',
            'user_id' => $userId,
            'new_role' => 'trainee'
        ]);
        
    } catch (PDOException $e) {
        // Rollback transaction on error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        // Rollback transaction on error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        
        error_log("Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}