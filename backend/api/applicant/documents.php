<?php
// File: backend/api/applicant/documents.php
// API endpoint for applicants to manage their documents

// Disable error display in production (but log errors)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set content type early
header('Content-Type: application/json');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include required files
try {
    require_once '../../shared/cors_middleware.php';
    require_once __DIR__ . '/../../config/db_config.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load required files: ' . $e->getMessage()]);
    exit;
}

// Function to log debug messages
function debug_log($message, $data = null) {
    $log_file = "documents_debug.log";
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message";
    
    if ($data !== null) {
        if (is_array($data) || is_object($data)) {
            $log_entry .= " " . json_encode($data);
        } else {
            $log_entry .= " $data";
        }
    }
    
    file_put_contents($log_file, $log_entry . PHP_EOL, FILE_APPEND);
}

debug_log("Documents API Request", $_SERVER['REQUEST_METHOD']);

// Determine the actual logged-in user ID
try {
    // Get authentication details
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    $token = '';
    
    // Extract bearer token from the Authorization header
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        debug_log("Token extracted from header", $token);
    }
    
    // If no token in header, check if it's in the query string (for testing)
    if (empty($token) && isset($_GET['token'])) {
        $token = $_GET['token'];
        debug_log("Token from query string", $token);
    }
    
    // Get user ID from query parameter if available
    $userId = null;
    if (isset($_GET['user_id']) && is_numeric($_GET['user_id'])) {
        $userId = (int)$_GET['user_id'];
        debug_log("User ID from query parameter", $userId);
    } else if (isset($_POST['user_id']) && is_numeric($_POST['user_id'])) {
        $userId = (int)$_POST['user_id'];
        debug_log("User ID from POST data", $userId);
    }
    
    // If no user ID in parameters, try to extract from token
    if (!$userId && !empty($token)) {
        try {
            $decodedToken = base64_decode($token, true);
            if ($decodedToken === false || strpos($decodedToken, ':') === false) {
                debug_log("Token is not valid base64 or missing colon", $token);
                throw new Exception('Invalid token format');
            }
            $parts = explode(':', $decodedToken);
            if (!isset($parts[0]) || !is_numeric($parts[0]) || !isset($parts[1]) || !is_numeric($parts[1])) {
                debug_log("Token parts invalid", $parts);
                throw new Exception('Invalid token structure');
            }
            $userId = (int)$parts[0];
            $timestamp = (int)$parts[1];
            $expirationTime = $timestamp + (24 * 60 * 60); // 24-hour expiration
            if (time() > $expirationTime) {
                debug_log("Token expired", ['userId' => $userId, 'timestamp' => $timestamp]);
                http_response_code(401);
                echo json_encode(['error' => 'Token expired']);
                exit;
            }
            debug_log("User ID extracted from token", $userId);
        } catch (Exception $e) {
            debug_log("Error decoding token", $e->getMessage());
            http_response_code(401);
            echo json_encode(['error' => 'Invalid authentication token']);
            exit;
        }
    }
    
    // Check if session has user ID as last resort
    if (!$userId && isset($_SESSION['user_id'])) {
        $userId = (int)$_SESSION['user_id'];
        debug_log("User ID from session", $userId);
    }
    
    // If we don't have a valid user ID, respond with an error
    if (!$userId) {
        debug_log("No valid user ID found");
        http_response_code(401);
        echo json_encode(['error' => 'Invalid authentication token']);
        exit;
    }
    
    // Verify user exists
    $checkUserQuery = "SELECT id, username, role FROM users WHERE id = ?";
    $checkUserStmt = $pdo->prepare($checkUserQuery);
    $checkUserStmt->execute([$userId]);
    
    if ($checkUserStmt->rowCount() === 0) {
        debug_log("User ID $userId not found in database");
        http_response_code(401);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $user = $checkUserStmt->fetch(PDO::FETCH_ASSOC);
    debug_log("User authenticated", $user);
    
    // Get the requested action
    $method = $_SERVER['REQUEST_METHOD'];
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($method) {
        case 'GET':
            if (isset($_GET['id']) && is_numeric($_GET['id'])) {
                // Get a specific document
                $documentId = (int)$_GET['id'];
                
                if ($action === 'view') {
                    viewDocument($pdo, $documentId, $userId);
                } else if ($action === 'download') {
                    downloadDocument($pdo, $documentId, $userId);
                } else {
                    getDocumentById($pdo, $documentId, $userId);
                }
            } else {
                // Get all documents for this user and optionally filter by application_id
                getUserDocuments($pdo, $userId);
            }
            break;
            
        case 'POST':
            // Upload a new document
            uploadDocument($pdo, $userId);
            break;
            
        case 'DELETE':
            // Delete a document
            if (isset($_GET['id']) && is_numeric($_GET['id'])) {
                $documentId = (int)$_GET['id'];
                deleteDocument($pdo, $documentId, $userId);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Document ID is required']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    debug_log("Database error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    debug_log("General error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get all documents for the specified user, optionally filtered by application_id
 */
function getUserDocuments($pdo, $userId) {
    debug_log("Getting documents for user", $userId);
    
    $applicationId = isset($_GET['application_id']) && is_numeric($_GET['application_id']) ? (int)$_GET['application_id'] : null;
    
    $query = "
        SELECT id, description, file_path, record_type, category, application_id, created_at
        FROM records
        WHERE user_id = ? AND record_type = 'applicant'
    ";
    $params = [$userId];
    
    if ($applicationId) {
        $query .= " AND application_id = ?";
        $params[] = $applicationId;
    }
    
    $query .= " ORDER BY created_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    debug_log("Found " . count($documents) . " documents");
    
    echo json_encode($documents);
}

/**
 * Get a specific document by ID
 */
function getDocumentById($pdo, $documentId, $userId) {
    debug_log("Getting document $documentId for user $userId");
    
    $query = "
        SELECT id, description, file_path, record_type, category, application_id, created_at
        FROM records
        WHERE id = ? AND user_id = ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$documentId, $userId]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['error' => 'Document not found']);
        return;
    }
    
    echo json_encode($document);
}

/**
 * Upload a new document
 */
function uploadDocument($pdo, $userId) {
    debug_log("Upload document request for user", $userId);
    
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $errorCode = isset($_FILES['file']) ? $_FILES['file']['error'] : 'No file uploaded';
        debug_log("File upload error", $errorCode);
        http_response_code(400);
        echo json_encode(['error' => 'File upload failed. Error code: ' . $errorCode]);
        return;
    }
    
    $file = $_FILES['file'];
    $fileName = $file['name'];
    $fileSize = $file['size'];
    $fileTmpName = $file['tmp_name'];
    $fileType = $file['type'];
    
    // Validate file type
    $allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!in_array($fileType, $allowedTypes)) {
        debug_log("Invalid file type", $fileType);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Allowed types: PDF, DOC, DOCX']);
        return;
    }
    
    // Validate file size (5MB limit)
    $maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if ($fileSize > $maxSize) {
        debug_log("File too large", $fileSize);
        http_response_code(400);
        echo json_encode(['error' => 'File size exceeds 5MB limit']);
        return;
    }
    
    // Get additional information
    $description = isset($_POST['description']) ? $_POST['description'] : $fileName;
    $recordType = isset($_POST['record_type']) ? $_POST['record_type'] : 'applicant';
    $category = isset($_POST['category']) ? $_POST['category'] : 'evaluations';
    $applicationId = isset($_POST['application_id']) && is_numeric($_POST['application_id']) ? (int)$_POST['application_id'] : null;
    
    // Create uploads directory if it doesn't exist
    $uploadsDir = __DIR__ . '/../../../uploads/documents';
    if (!file_exists($uploadsDir)) {
        if (!mkdir($uploadsDir, 0755, true)) {
            debug_log("Failed to create uploads directory", $uploadsDir);
            throw new Exception("Failed to create uploads directory");
        }
    }
    if (!is_writable($uploadsDir)) {
        debug_log("Uploads directory is not writable", $uploadsDir);
        throw new Exception("Uploads directory is not writable");
    }
    
    // Generate a unique filename
    $uniqueFilename = $userId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . pathinfo($fileName, PATHINFO_EXTENSION);
    $uploadPath = $uploadsDir . '/' . $uniqueFilename;
    $databasePath = "uploads/documents/" . $uniqueFilename;
    
    debug_log("Moving uploaded file to", $uploadPath);
    
    if (!move_uploaded_file($fileTmpName, $uploadPath)) {
        $error = error_get_last();
        debug_log("Failed to move uploaded file", $error ? $error['message'] : 'Unknown error');
        throw new Exception("Failed to save uploaded file: " . ($error ? $error['message'] : 'Unknown error'));
    }
    
    // Verify file exists after upload
    if (!file_exists($uploadPath)) {
        debug_log("Uploaded file not found after move", $uploadPath);
        throw new Exception("Uploaded file not found after move");
    }
    
    // Insert record into database
    $query = "
        INSERT INTO records (user_id, record_type, category, file_path, description, application_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId, $recordType, $category, $databasePath, $description, $applicationId]);
    $recordId = $pdo->lastInsertId();
    
    debug_log("Document uploaded successfully with ID", $recordId);
    
    // Return the record information
    $record = [
        'id' => $recordId,
        'user_id' => $userId,
        'record_type' => $recordType,
        'category' => $category,
        'file_path' => $databasePath,
        'description' => $description,
        'application_id' => $applicationId,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    http_response_code(201);
    echo json_encode($record);
}

/**
 * Delete a document
 */
function deleteDocument($pdo, $documentId, $userId) {
    debug_log("Delete document $documentId for user $userId");
    
    // First get the document to check ownership and get the file path
    $query = "
        SELECT id, file_path
        FROM records
        WHERE id = ? AND user_id = ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$documentId, $userId]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['error' => 'Document not found or not owned by you']);
        return;
    }
    
    // Delete the file from the file system
    $basePath = realpath(__DIR__ . '/../../../');
    $filePath = $basePath . '/backend/' . $document['file_path'];
    if (file_exists($filePath)) {
        if (!unlink($filePath)) {
            debug_log("Failed to delete file", $filePath);
        }
    }
    
    // Delete the record from the database
    $deleteQuery = "DELETE FROM records WHERE id = ? AND user_id = ?";
    $deleteStmt = $pdo->prepare($deleteQuery);
    $deleteStmt->execute([$documentId, $userId]);
    
    debug_log("Document deleted successfully");
    
    echo json_encode(['success' => true, 'message' => 'Document deleted successfully']);
}

/**
 * View a document in the browser
 */
function viewDocument($pdo, $documentId, $userId) {
    debug_log("View document $documentId for user $userId");
    
    $query = "
        SELECT file_path, description
        FROM records
        WHERE id = ? AND user_id = ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$documentId, $userId]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['error' => 'Document not found or not owned by you']);
        return;
    }
    
    $basePath = realpath(__DIR__ . '/../../../');
    $filePath = $basePath . '/backend/' . $document['file_path'];
    debug_log("Attempting to access file", $filePath);
    
    if (!file_exists($filePath)) {
        debug_log("File not found", $filePath);
        http_response_code(404);
        echo json_encode(['error' => 'Document file not found on server']);
        return;
    }
    
    if (!is_readable($filePath)) {
        debug_log("File not readable", $filePath);
        http_response_code(403);
        echo json_encode(['error' => 'Document file not readable']);
        return;
    }
    
    // Determine content type based on file extension
    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $contentType = 'application/octet-stream'; // Default
    
    if ($extension === 'pdf') {
        $contentType = 'application/pdf';
    } else if ($extension === 'doc') {
        $contentType = 'application/msword';
    } else if ($extension === 'docx') {
        $contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    // Clear any previous output
    ob_clean();
    
    // Set headers for viewing in browser
    header('Content-Type: ' . $contentType);
    header('Content-Disposition: inline; filename="' . basename($document['description']) . '"');
    header('Cache-Control: public, max-age=0');
    
    // Output the file
    readfile($filePath);
    exit;
}

/**
 * Download a document
 */
function downloadDocument($pdo, $documentId, $userId) {
    debug_log("Download document $documentId for user $userId");
    
    $query = "
        SELECT file_path, description
        FROM records
        WHERE id = ? AND user_id = ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$documentId, $userId]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$document) {
        http_response_code(404);
        echo json_encode(['error' => 'Document not found or not owned by you']);
        return;
    }
    
    $basePath = realpath(__DIR__ . '/../../../');
    $filePath = $basePath . '/backend/' . $document['file_path'];
    debug_log("Attempting to access file for download", $filePath);
    
    if (!file_exists($filePath)) {
        debug_log("File not found", $filePath);
        http_response_code(404);
        echo json_encode(['error' => 'Document file not found on server']);
        return;
    }
    
    if (!is_readable($filePath)) {
        debug_log("File not readable", $filePath);
        http_response_code(403);
        echo json_encode(['error' => 'Document file not readable']);
        return;
    }
    
    // Clear any previous output
    ob_clean();
    
    // Set headers for download
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($document['description']) . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Output the file
    readfile($filePath);
    exit;
}
?>