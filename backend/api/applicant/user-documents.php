<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers for normal responses
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

// Fallback: accept token in the query string (for testing only and for download/view actions)
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
    
    // Check which action is requested
    $action = isset($_GET['action']) ? $_GET['action'] : 'list';
    
    // Handle actions
    switch ($action) {
        case 'list':
            // Fetch user documents
            $query = "
                SELECT id, description, file_path, category, created_at
                FROM records 
                WHERE user_id = ? AND record_type = 'applicant'
                ORDER BY created_at DESC
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([$userId]);
            $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode($documents);
            break;
            
        case 'download':
            // Download a specific document
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Document ID is required']);
                exit;
            }
            
            $documentId = intval($_GET['id']);
            
            // Get document info
            $query = "
                SELECT file_path, description 
                FROM records 
                WHERE id = ? AND user_id = ? AND record_type = 'applicant'
                LIMIT 1
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([$documentId, $userId]);
            $document = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$document) {
                http_response_code(404);
                echo json_encode(['error' => 'Document not found']);
                exit;
            }
            
            $filePath = $document['file_path'];
            
            if (!file_exists($filePath)) {
                http_response_code(404);
                echo json_encode(['error' => 'File not found on server']);
                exit;
            }
            
            // Clear any previous output
            ob_clean();
            
            // Set headers for file download
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
            header('Content-Length: ' . filesize($filePath));
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Expires: 0');
            
            // Reset content type header (we're no longer returning JSON)
            header('Content-Type: ' . mime_content_type($filePath));
            
            // Output file
            readfile($filePath);
            exit;
            
        case 'view':
            // View a specific document
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Document ID is required']);
                exit;
            }
            
            $documentId = intval($_GET['id']);
            
            // Get document info
            $query = "
                SELECT file_path, description 
                FROM records 
                WHERE id = ? AND user_id = ? AND record_type = 'applicant'
                LIMIT 1
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([$documentId, $userId]);
            $document = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$document) {
                http_response_code(404);
                echo json_encode(['error' => 'Document not found']);
                exit;
            }
            
            $filePath = $document['file_path'];
            
            if (!file_exists($filePath)) {
                http_response_code(404);
                echo json_encode(['error' => 'File not found on server']);
                exit;
            }
            
            // Clear any previous output
            ob_clean();
            
            // Set headers for file viewing
            header('Content-Type: ' . mime_content_type($filePath));
            header('Content-Length: ' . filesize($filePath));
            header('Cache-Control: public');
            
            // Output file
            readfile($filePath);
            exit;
            
        case 'delete':
            // Delete a specific document
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Document ID is required']);
                exit;
            }
            
            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed. Use DELETE for this action.']);
                exit;
            }
            
            $documentId = intval($_GET['id']);
            
            // Get document info first (to get the file path)
            $query = "
                SELECT file_path 
                FROM records 
                WHERE id = ? AND user_id = ? AND record_type = 'applicant'
                LIMIT 1
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([$documentId, $userId]);
            $document = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$document) {
                http_response_code(404);
                echo json_encode(['error' => 'Document not found']);
                exit;
            }
            
            // Delete from database
            $deleteQuery = "DELETE FROM records WHERE id = ? AND user_id = ?";
            $deleteStmt = $pdo->prepare($deleteQuery);
            $deleteResult = $deleteStmt->execute([$documentId, $userId]);
            
            if (!$deleteResult) {
                throw new Exception('Failed to delete document from database');
            }
            
            // Try to delete the file (but don't fail if file deletion fails)
            $filePath = $document['file_path'];
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action requested']);
            break;
    }
} catch (PDOException $e) {
    error_log("User Documents API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("User Documents API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
    exit;
}
?>