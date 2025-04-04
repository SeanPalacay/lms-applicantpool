<?php
// File: backend/api/admin/application-notes.php
header('Content-Type: application/json');
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Add these lines for better error handling
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_log("application-notes.php endpoint hit with method: " . $_SERVER['REQUEST_METHOD']);

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
    if ($role !== 'administrator' && $role !== 'trainer') {
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

// Handle GET request to fetch application notes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if specific application ID is provided
        if (!isset($_GET['application_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Application ID is required']);
            exit;
        }
        
        $applicationId = $_GET['application_id'];
        
        // Create a table if it doesn't exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS application_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                content TEXT NOT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            );
        ");
        
        // Query to get notes for the application
        $query = "
            SELECT 
                an.id,
                an.application_id, 
                an.content, 
                an.created_at, 
                u.full_name as created_by_name,
                u.id as created_by_id
            FROM 
                application_notes an
            LEFT JOIN 
                users u ON an.created_by = u.id
            WHERE 
                an.application_id = :application_id
            ORDER BY 
                an.created_at DESC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
        $stmt->execute();
        
        $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Return the notes
        echo json_encode($notes);
        
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        error_log("Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
    }
}

// Handle POST request to add a new note
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get request body
        $requestData = json_decode(file_get_contents('php://input'), true);
        error_log("Request data: " . json_encode($requestData));
        
        if (!isset($requestData['application_id']) || empty($requestData['application_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Application ID is required']);
            exit;
        }
        
        if (!isset($requestData['content']) || empty($requestData['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Note content is required']);
            exit;
        }
        
        $applicationId = $requestData['application_id'];
        $content = $requestData['content'];
        
        // Create a table if it doesn't exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS application_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                content TEXT NOT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            );
        ");
        
        // Verify that the application exists
        $appStmt = $pdo->prepare("SELECT * FROM applications WHERE id = :id");
        $appStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
        $appStmt->execute();
        
        if ($appStmt->rowCount() == 0) {
            // Check also in job_applications table
            $jobAppStmt = $pdo->prepare("SELECT * FROM job_applications WHERE id = :id");
            $jobAppStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
            $jobAppStmt->execute();
            
            if ($jobAppStmt->rowCount() == 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Application not found']);
                exit;
            }
        }
        
        // Insert the note
        $insertStmt = $pdo->prepare("
            INSERT INTO application_notes (
                application_id,
                content,
                created_by
            ) VALUES (
                :application_id,
                :content,
                :created_by
            )
        ");
        
        $insertStmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
        $insertStmt->bindParam(':content', $content, PDO::PARAM_STR);
        $insertStmt->bindParam(':created_by', $adminId, PDO::PARAM_INT);
        $insertStmt->execute();
        
        $noteId = $pdo->lastInsertId();
        
        // Get the created note details
        $noteStmt = $pdo->prepare("
            SELECT 
                an.id,
                an.application_id,
                an.content,
                an.created_at,
                u.full_name as created_by_name,
                u.id as created_by_id
            FROM 
                application_notes an
            LEFT JOIN 
                users u ON an.created_by = u.id
            WHERE 
                an.id = :id
        ");
        $noteStmt->bindParam(':id', $noteId, PDO::PARAM_INT);
        $noteStmt->execute();
        
        $note = $noteStmt->fetch(PDO::FETCH_ASSOC);
        
        // Return the created note
        echo json_encode([
            'success' => true,
            'message' => 'Note added successfully',
            'note' => $note
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        error_log("Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
    }
}

// Handle DELETE request to delete a note
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        // Check if specific note ID is provided
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Note ID is required']);
            exit;
        }
        
        $noteId = $_GET['id'];
        
        // First check if the note exists and belongs to the admin
        $checkStmt = $pdo->prepare("
            SELECT * FROM application_notes 
            WHERE id = :id AND (created_by = :admin_id OR :is_admin = 1)
        ");
        $isAdmin = ($role === 'administrator') ? 1 : 0;
        $checkStmt->bindParam(':id', $noteId, PDO::PARAM_INT);
        $checkStmt->bindParam(':admin_id', $adminId, PDO::PARAM_INT);
        $checkStmt->bindParam(':is_admin', $isAdmin, PDO::PARAM_INT);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Note not found or you do not have permission to delete it']);
            exit;
        }
        
        // Delete the note
        $deleteStmt = $pdo->prepare("DELETE FROM application_notes WHERE id = :id");
        $deleteStmt->bindParam(':id', $noteId, PDO::PARAM_INT);
        $deleteStmt->execute();
        
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Note deleted successfully'
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    } catch (Exception $e) {
        error_log("Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
    }
}