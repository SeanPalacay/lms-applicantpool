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

// Define the base path (aligned with applicant/documents.php)
$BASE_PATH = realpath(__DIR__ . '/../../../');

// Get authentication details
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// Check if we have a token
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication token is required']);
    exit;
}

// Validate and extract user ID from token
try {
    // Parse Base64 token (USER_ID:TIMESTAMP format)
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);

    if (count($parts) !== 2 || !is_numeric($parts[0]) || !is_numeric($parts[1])) {
        error_log("Invalid token format: $decoded");
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'Invalid authentication token']);
        exit;
    }

    $userId = (int)$parts[0];
    $timestamp = (int)$parts[1];
    $currentTime = time();
    $tokenAge = $currentTime - $timestamp;

    if ($tokenAge > 24 * 60 * 60) { // 24 hours expiration
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'Token expired']);
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
    $validRoles = ['administrator', 'trainer', 'admin'];

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
        if (!is_numeric($applicantId)) {
            header('Content-Type: application/json');
            http_response_code(400);
            echo json_encode(['error' => 'Invalid applicant ID']);
            return;
        }
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
    if (!is_numeric($documentId)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid document ID']);
        return;
    }

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
    global $BASE_PATH;

    if (!is_numeric($documentId)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid document ID']);
        return;
    }

    $checkStmt = $pdo->prepare("
        SELECT file_path, description FROM records 
        WHERE id = ? AND record_type = 'applicant'
    ");
    $checkStmt->execute([$documentId]);

    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        return;
    }

    $document = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $relative_path = ltrim($document['file_path'], '/');

    // Prevent directory traversal
    if (strpos($relative_path, '..') !== false || strpos($relative_path, '\\') !== false) {
        error_log("Invalid file path detected: $relative_path");
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file path']);
        return;
    }

    // Align file path construction with applicant/documents.php
    $file_path = $BASE_PATH . '/backend/' . $relative_path;
    error_log("Resolved file path for download: $file_path");
    error_log("Checking if file exists: " . (file_exists($file_path) ? 'Yes' : 'No'));
    error_log("Checking if file is readable: " . (is_readable($file_path) ? 'Yes' : 'No'));

    if (!file_exists($file_path) || !is_readable($file_path)) {
        error_log("File not found or not readable at: $file_path");
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Document file not found']);
        return;
    }

    $file_info = pathinfo($file_path);
    $extension = strtolower($file_info['extension']);

    $content_type = match ($extension) {
        'pdf' => 'application/pdf',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        default => 'application/octet-stream',
    };

    header('Content-Type: ' . $content_type);
    header('Content-Disposition: attachment; filename="' . ($document['description'] ?: 'document') . '.' . $extension . '"');
    header('Content-Length: ' . filesize($file_path));

    ob_clean();
    flush();
    readfile($file_path);
    exit;
}

/**
 * View a document in browser
 */
/**
 * View a document in browser
 */
function viewDocument($pdo, $documentId) {
    global $BASE_PATH;

    if (!is_numeric($documentId)) {
        error_log("Invalid document ID provided: $documentId");
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid document ID']);
        return;
    }

    $checkStmt = $pdo->prepare("
        SELECT file_path, description
        FROM records 
        WHERE id = ? AND record_type = 'applicant'
    ");
    $checkStmt->execute([$documentId]);

    if ($checkStmt->rowCount() === 0) {
        error_log("Document not found for ID: $documentId");
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        return;
    }

    $document = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $relative_path = ltrim($document['file_path'], '/');

    // Prevent directory traversal
    if (strpos($relative_path, '..') !== false || strpos($relative_path, '\\') !== false) {
        error_log("Invalid file path detected: $relative_path");
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file path']);
        return;
    }

    // Align file path construction with applicant/documents.php
    $file_path = $BASE_PATH . '/backend/' . $relative_path;
    error_log("Resolved file path for view: $file_path");
    error_log("Checking if file exists: " . (file_exists($file_path) ? 'Yes' : 'No'));
    error_log("Checking if file is readable: " . (is_readable($file_path) ? 'Yes' : 'No'));

    if (!file_exists($file_path) || !is_readable($file_path)) {
        error_log("File not found or not readable at: $file_path");
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Document file not found']);
        return;
    }

    $file_size = filesize($file_path);
    if ($file_size > 104857600) { // 100 MB limit
        error_log("File too large to stream: $file_path, size: $file_size bytes");
        header('Content-Type: application/json');
        http_response_code(413);
        echo json_encode(['error' => 'File too large to view']);
        return;
    }

    $extension = strtolower(pathinfo($file_path, PATHINFO_EXTENSION));
    $content_type = match ($extension) {
        'pdf' => 'application/pdf',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        default => 'application/octet-stream',
    };

    // Set headers for viewing
    header('Content-Type: ' . $content_type);
    header('Content-Disposition: inline; filename="' . ($document['description'] ?: basename($file_path)) . '"');
    header('Content-Length: ' . $file_size);
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Content-Security-Policy: default-src \'self\'; frame-ancestors \'none\'');

    ob_clean();
    flush();
    readfile($file_path);
    exit;
}
?>