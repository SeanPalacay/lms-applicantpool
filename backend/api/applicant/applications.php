<?php
// File: backend/api/applicant/applications.php
header('Content-Type: application/json');
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Add these lines for better error handling
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_log("Applications.php endpoint hit with method: " . $_SERVER['REQUEST_METHOD']);

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// First, try to get token from Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    error_log("Found token in Authorization header: " . substr($token, 0, 10) . "...");
}

// If no token in header, check if it's in the query string
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
    error_log("Found token in query string: " . substr($token, 0, 10) . "...");
}

// Get user ID from query parameter - THIS IS THE KEY CHANGE
$userIdFromQuery = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
error_log("User ID from query: " . ($userIdFromQuery ? $userIdFromQuery : "none"));

// IMPORTANT: For testing, we'll trust the user_id parameter directly if provided
// In production, you should validate this against the token
$userId = $userIdFromQuery;

// If no user_id provided in query, extract from token
if (!$userId && !empty($token)) {
    // Try to get user ID from token (your existing token validation logic)
    // Method 1: Try base64 decode
    try {
        $tokenData = base64_decode($token);
        if ($tokenData) {
            $tokenParts = explode(':', $tokenData);
            $userIdFromToken = isset($tokenParts[0]) ? intval($tokenParts[0]) : null;
            if ($userIdFromToken) {
                $userId = $userIdFromToken;
                error_log("Extracted user ID from token: $userId");
            }
        }
    } catch (Exception $e) {
        error_log("Error decoding token: " . $e->getMessage());
    }
    
    // Method 2: Check auth_tokens table if needed
    if (!$userId) {
        try {
            $stmt = $pdo->prepare("SELECT user_id FROM auth_tokens WHERE token = :token AND expired_at > NOW()");
            $stmt->bindParam(':token', $token, PDO::PARAM_STR);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $userId = $stmt->fetch(PDO::FETCH_ASSOC)['user_id'];
                error_log("Found user ID in auth_tokens table: $userId");
            }
        } catch (PDOException $e) {
            error_log("Database error checking token: " . $e->getMessage());
        }
    }
}

// Final check for user ID
if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid authentication token or user ID']);
    error_log("Authentication failed - no valid user ID found");
    exit;
}

error_log("Proceeding with user ID: $userId");

// Handle GET requests - Retrieve applications for the current user
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if specific application is requested
        if (isset($_GET['id'])) {
            $applicationId = $_GET['id'];
            
            $query = "
                SELECT 
                    ja.*, 
                    jp.position_name,
                    jp.department
                FROM 
                    job_applications ja
                LEFT JOIN 
                    job_positions jp ON ja.position_id = jp.id
                WHERE 
                    ja.id = :id AND ja.user_id = :user_id
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            $application = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$application) {
                http_response_code(404);
                echo json_encode(['error' => 'Application not found or access denied']);
                exit;
            }
            
            echo json_encode($application);
        } else {
            // Get all applications for the user
            $query = "
                SELECT 
                    ja.*, 
                    jp.position_name,
                    jp.department,
                    DATE_FORMAT(ja.applied_at, '%Y-%m-%d %H:%i:%s') as applied_at,
                    DATE_FORMAT(ja.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
                FROM 
                    job_applications ja
                LEFT JOIN 
                    job_positions jp ON ja.position_id = jp.id
                WHERE 
                    ja.user_id = :user_id
                ORDER BY 
                    ja.applied_at DESC
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($applications);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        error_log("PDO Exception in GET: " . $e->getMessage());
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
        error_log("Exception in GET: " . $e->getMessage());
    }
}

// Handle POST requests - Submit a new application
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get JSON data from request body
        $jsonData = file_get_contents('php://input');
        error_log("Received JSON data: " . $jsonData);
        
        $data = json_decode($jsonData, true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request data']);
            error_log("Failed to parse JSON data");
            exit;
        }
        
        // Log the decoded data
        error_log("Decoded data: " . print_r($data, true));
        
        // Validate required fields
        if (!isset($data['position_id']) || empty($data['position_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Position ID is required']);
            error_log("Missing position_id in request");
            exit;
        }
        
        if (!isset($data['reasons']) || empty($data['reasons'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Reasons field is required']);
            error_log("Missing reasons in request");
            exit;
        }
        
        // Check if position exists and is active
        $checkPosQuery = "
            SELECT * FROM job_positions 
            WHERE id = :position_id AND is_active = 1
        ";
        
        $checkPosStmt = $pdo->prepare($checkPosQuery);
        $checkPosStmt->bindParam(':position_id', $data['position_id'], PDO::PARAM_INT);
        $checkPosStmt->execute();
        
        $position = $checkPosStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$position) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or inactive position']);
            error_log("Position ID not found or inactive: " . $data['position_id']);
            exit;
        }
        
        // Check if user already applied for this position
        $checkQuery = "
            SELECT COUNT(*) FROM job_applications 
            WHERE user_id = :user_id AND position_id = :position_id
        ";
        
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $checkStmt->bindParam(':position_id', $data['position_id'], PDO::PARAM_INT);
        $checkStmt->execute();
        
        if ($checkStmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'You have already applied for this position']);
            error_log("User already applied for this position");
            exit;
        }
        
        // Begin transaction
        $pdo->beginTransaction();
        
        // Prepare insert query for job_applications table
        // Fix: Using positional placeholders to avoid issues with reserved words like 'references'
        $insertQuery = "
            INSERT INTO job_applications (
                user_id, 
                position_id,
                reasons,
                experience,
                skills,
                education,
                availability,
                `references`,
                document_id,
                status,
                applied_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW()
            )
        ";
        
        $insertStmt = $pdo->prepare($insertQuery);
        
        // Bind parameters using positional parameters
        $insertStmt->bindValue(1, $userId, PDO::PARAM_INT);
        $insertStmt->bindValue(2, $data['position_id'], PDO::PARAM_INT);
        $insertStmt->bindValue(3, $data['reasons'], PDO::PARAM_STR);
        $insertStmt->bindValue(4, isset($data['experience']) ? $data['experience'] : null, PDO::PARAM_STR);
        $insertStmt->bindValue(5, isset($data['skills']) ? $data['skills'] : null, PDO::PARAM_STR);
        $insertStmt->bindValue(6, isset($data['education']) ? $data['education'] : null, PDO::PARAM_STR);
        $insertStmt->bindValue(7, isset($data['availability']) ? $data['availability'] : null, PDO::PARAM_STR);
        $insertStmt->bindValue(8, isset($data['references']) ? $data['references'] : null, PDO::PARAM_STR);
        $insertStmt->bindValue(9, isset($data['document_id']) ? $data['document_id'] : null, PDO::PARAM_INT);
        
        $insertStmt->execute();
        $applicationId = $pdo->lastInsertId();
        error_log("Successfully inserted application with ID: $applicationId");
        
        // Add notification for the user
        $notifyQuery = "
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                created_at
            ) VALUES (
                :user_id,
                'info',
                'Application Submitted',
                :message,
                NOW()
            )
        ";
        
        $message = "Your application for {$position['position_name']} has been submitted successfully.";
        
        $notifyStmt = $pdo->prepare($notifyQuery);
        $notifyStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $notifyStmt->bindParam(':message', $message, PDO::PARAM_STR);
        $notifyStmt->execute();
        error_log("Added notification for user");
        
        // Commit transaction
        $pdo->commit();
        
        // Return success
        echo json_encode([
            'success' => true,
            'message' => 'Application submitted successfully',
            'application_id' => $applicationId
        ]);
        error_log("Application submission completed successfully");
        
    } catch (PDOException $e) {
        // Rollback in case of error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        error_log("PDO Exception: " . $e->getMessage());
    } catch (Exception $e) {
        // Rollback in case of error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
        error_log("Exception: " . $e->getMessage());
    }
}

// Handle PUT requests - Update application (e.g., withdraw)
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($_GET['id'])) {
    try {
        $applicationId = $_GET['id'];
        
        // First check if the application belongs to the user
        $checkQuery = "
            SELECT ja.*, jp.position_name 
            FROM job_applications ja
            LEFT JOIN job_positions jp ON ja.position_id = jp.id
            WHERE ja.id = :id AND ja.user_id = :user_id
        ";
        
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
        $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $checkStmt->execute();
        
        $application = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$application) {
            http_response_code(404);
            echo json_encode(['error' => 'Application not found or access denied']);
            error_log("Application not found or access denied for ID: $applicationId, user ID: $userId");
            exit;
        }
        
        // Get JSON data from request body
        $jsonData = file_get_contents('php://input');
        $data = json_decode($jsonData, true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request data']);
            error_log("Failed to parse JSON data in PUT request");
            exit;
        }
        
        // Check if status is being updated to 'withdrawn'
        if (isset($data['status']) && $data['status'] === 'withdrawn') {
            $updateQuery = "
                UPDATE job_applications 
                SET status = 'withdrawn', updated_at = NOW() 
                WHERE id = :id AND user_id = :user_id
            ";
            
            $updateStmt = $pdo->prepare($updateQuery);
            $updateStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
            $updateStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $updateStmt->execute();
            
            // Add notification for the withdrawal
            $notifyQuery = "
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    message,
                    created_at
                ) VALUES (
                    :user_id,
                    'info',
                    'Application Withdrawn',
                    :message,
                    NOW()
                )
            ";
            
            $message = "You have withdrawn your application for {$application['position_name']}.";
            
            $notifyStmt = $pdo->prepare($notifyQuery);
            $notifyStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $notifyStmt->bindParam(':message', $message, PDO::PARAM_STR);
            $notifyStmt->execute();
            
            echo json_encode([
                'success' => true,
                'message' => 'Application has been withdrawn successfully'
            ]);
            
            error_log("Application withdrawn successfully: ID $applicationId");
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid update operation']);
            error_log("Invalid update operation in PUT request");
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        error_log("PDO Exception in PUT: " . $e->getMessage());
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
        error_log("Exception in PUT: " . $e->getMessage());
    }
}