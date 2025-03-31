<?php
// File: backend/api/admin/documents.php
// API endpoint for admin to access applicant documents

// Disable error display in production
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include required files
try {
    require_once '../../shared/cors_middleware.php';
    require_once __DIR__ . '/../../config/db_config.php';
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load required files: ' . $e->getMessage()]);
    exit;
}

// Get authentication details
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in form data or query string (for testing)
if (empty($token)) {
    if (isset($_POST['token'])) {
        $token = $_POST['token'];
    } elseif (isset($_GET['token'])) {
        $token = $_GET['token'];
    }
}

// Check if we have a token
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication token is required']);
    exit;
}

// Get the user ID from the token
try {
    // Parse Base64 token (USER_ID:TIMESTAMP format)
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    
    // The first part should be the user ID
    if (!empty($parts[0]) && is_numeric($parts[0])) {
        $userId = (int)$parts[0];
        error_log("Successfully extracted user ID $userId from token");
    } else {
        error_log("Failed to extract user ID from token: $decoded");
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'Invalid authentication token']);
        exit;
    }
    
    // Verify user exists and has admin permissions
    $checkUserQuery = "SELECT id, username, role FROM users WHERE id = ?";
    $checkUserStmt = $pdo->prepare($checkUserQuery);
    $checkUserStmt->execute([$userId]);
    
    if ($checkUserStmt->rowCount() === 0) {
        error_log("User ID $userId not found in the database");
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $user = $checkUserStmt->fetch(PDO::FETCH_ASSOC);
    $validRoles = ['administrator', 'trainer', 'admin']; // Roles that can access documents
    
    if (!in_array($user['role'], $validRoles)) {
        error_log("User {$user['username']} (ID: $userId) has role {$user['role']} which is not allowed");
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['error' => 'Access denied. Only administrators can use this endpoint.']);
        exit;
    }
    
    // Get the requested action
    $method = $_SERVER['REQUEST_METHOD'];
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($method) {
        case 'GET':
            if (isset($_GET['id']) && is_numeric($_GET['id'])) {
                if ($action === 'download') {
                    downloadDocument($pdo, $_GET['id']);
                } elseif ($action === 'view') {
                    viewDocument($pdo, $_GET['id']);
                } else {
                    getDocumentById($pdo, $_GET['id']);
                }
            } else {
                getApplicantDocuments($pdo, isset($_GET['applicant_id']) ? $_GET['applicant_id'] : null);
            }
            break;
            
        default:
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    error_log("Database error in admin/documents.php: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("General error in admin/documents.php: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get documents for an applicant (or all if no applicant_id specified)
 */
function getApplicantDocuments($pdo, $applicantId = null) {
    $query = "
        SELECT 
            r.id,
            r.user_id,
            r.record_type,
            r.category,
            r.file_path,
            r.description,
            r.created_at
        FROM 
            records r
        WHERE 
            r.record_type = 'applicant'
    ";
    
    $params = [];
    
    if ($applicantId) {
        $query .= " AND r.user_id = ?";
        $params[] = $applicantId;
    }
    
    $query .= " ORDER BY r.created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($documents);
}

/**
 * Get a specific document by ID
 */
function getDocumentById($pdo, $documentId) {
    $query = "
        SELECT 
            r.id,
            r.user_id,
            r.record_type,
            r.category,
            r.file_path,
            r.description,
            r.created_at,
            u.full_name as user_name
        FROM 
            records r
        LEFT JOIN 
            users u ON r.user_id = u.id
        WHERE 
            r.id = ? AND
            r.record_type = 'applicant'
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$documentId]);
    
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        return;
    }
    
    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($document);
}

/**
 * Download a document
 */
function downloadDocument($pdo, $documentId) {
    // Check if document exists
    $checkQuery = "
        SELECT file_path, description FROM records 
        WHERE id = ? AND record_type = 'applicant'
    ";
    
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->execute([$documentId]);
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        return;
    }
    
    $document = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $file_path = __DIR__ . '/../../' . $document['file_path'];
    
    if (!file_exists($file_path)) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Document file not found']);
        return;
    }
    
    // Get file info
    $file_info = pathinfo($file_path);
    $extension = strtolower($file_info['extension']);
    
    // Set content type based on file extension
    switch ($extension) {
        case 'pdf':
            $content_type = 'application/pdf';
            break;
        case 'doc':
            $content_type = 'application/msword';
            break;
        case 'docx':
            $content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        default:
            $content_type = 'application/octet-stream';
    }
    
    // Force download
    header('Content-Type: ' . $content_type);
    header('Content-Disposition: attachment; filename="' . basename($document['description']) . '.' . $extension . '"');
    header('Content-Length: ' . filesize($file_path));
    
    // Clear output buffer
    ob_clean();
    flush();
    
    // Output file
    readfile($file_path);
    exit;
}

/**
 * View a document in browser
 */
function viewDocument($pdo, $documentId) {
    // Check if document exists
    $checkQuery = "
        SELECT file_path FROM records 
        WHERE id = ? AND record_type = 'applicant'
    ";
    
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->execute([$documentId]);
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        return;
    }
    
    $document = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $file_path = __DIR__ . '/../../' . $document['file_path'];
    
    if (!file_exists($file_path)) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Document file not found']);
        return;
    }
    
    // Get file info
    $file_info = pathinfo($file_path);
    $extension = strtolower($file_info['extension']);
    
    // Set content type based on file extension
    switch ($extension) {
        case 'pdf':
            $content_type = 'application/pdf';
            break;
        case 'doc':
            $content_type = 'application/msword';
            break;
        case 'docx':
            $content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        default:
            $content_type = 'application/octet-stream';
    }
    
    // View in browser
    header('Content-Type: ' . $content_type);
    header('Content-Disposition: inline; filename="' . basename($file_path) . '"');
    header('Content-Length: ' . filesize($file_path));
    
    // Clear output buffer
    ob_clean();
    flush();
    
    // Output file
    readfile($file_path);
    exit;
}
?>