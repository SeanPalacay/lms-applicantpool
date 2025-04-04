<?php
// File: backend/api/admin/records.php
// Error logging for debugging
error_log('Records endpoint hit: ' . $_SERVER['REQUEST_METHOD'] . ' ' . $_SERVER['REQUEST_URI']);
error_log('GET params: ' . json_encode($_GET));

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string (for downloads)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// Simple token check (for demonstration)
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Only perform authentication check for non-download actions
if (!isset($_GET['action']) || $_GET['action'] !== 'download') {
    try {
        $stmt = $pdo->prepare("SELECT user_id, role FROM auth_tokens WHERE token = :token AND expired_at > NOW()");
        $stmt->bindParam(':token', $token, PDO::PARAM_STR);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Invalid or expired token']);
            exit;
        }
        
        $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
        $adminId = $tokenData['user_id'];
        $role = $tokenData['role'];
        
        // Verify admin role
        if ($role !== 'administrator' && $role !== 'trainer') {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Insufficient permissions']);
            exit;
        }
    } catch (PDOException $e) {
        error_log("Database error verifying token: " . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Internal server error']);
        exit;
    }
}

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Handle different HTTP methods
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                if (isset($_GET['action']) && $_GET['action'] === 'download') {
                    downloadRecord($pdo, $_GET['id']);
                } else {
                    getRecordById($pdo, $_GET['id']);
                }
            } else {
                getAllRecords($pdo);
            }
            break;
            
        case 'DELETE':
            if (isset($_GET['id'])) {
                deleteRecord($pdo, $_GET['id']);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Missing record ID']);
            }
            break;
            
        default:
            // Method not allowed
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    // Database error
    error_log('PDO Error: ' . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Other errors
    error_log('General Error: ' . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get all records
 */
function getAllRecords($pdo) {
    $query = "
        SELECT 
            r.*, 
            u.full_name
        FROM 
            records r
        LEFT JOIN 
            users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($records);
}

/**
 * Get a specific record by ID
 */
function getRecordById($pdo, $id) {
    $query = "
        SELECT 
            r.*, 
            u.full_name,
            u.email
        FROM 
            records r
        LEFT JOIN 
            users u ON r.user_id = u.id
        WHERE 
            r.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
        return;
    }
    
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($record);
}

/**
 * Download a record
 */
function downloadRecord($pdo, $id) {
    // Get record info
    $query = "SELECT * FROM records WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
        return;
    }
    
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    $filePath = $record['file_path'];
    
    // Verify file exists
    $fullPath = __DIR__ . '/../../' . $filePath;
    if (!file_exists($fullPath)) {
        error_log("File not found: " . $fullPath);
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        return;
    }
    
    // Prepare file for download
    $fileName = basename($filePath);
    $fileSize = filesize($fullPath);
    $fileType = mime_content_type($fullPath);
    
    // Set appropriate headers
    header('Content-Description: File Transfer');
    header('Content-Type: ' . $fileType);
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . $fileSize);
    
    // Output file
    readfile($fullPath);
    exit;
}

/**
 * Delete a record
 */
function deleteRecord($pdo, $id) {
    // First get record info to delete the physical file
    $query = "SELECT * FROM records WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
        return;
    }
    
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    $filePath = $record['file_path'];
    
    // Delete from database
    $deleteQuery = "DELETE FROM records WHERE id = :id";
    $deleteStmt = $pdo->prepare($deleteQuery);
    $deleteStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $deleteStmt->execute();
    
    // Try to delete file if it exists
    $fullPath = __DIR__ . '/../../' . $filePath;
    if (file_exists($fullPath)) {
        unlink($fullPath);
    }
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Record deleted successfully']);
}