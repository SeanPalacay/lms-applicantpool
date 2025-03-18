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

// Fallback: accept token in the form data
if (empty($token) && isset($_POST['token'])) {
    $token = $_POST['token'];
}

// If token is still empty, return 401
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Check for POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST for file uploads.']);
    exit;
}

try {
    if (!isset($pdo)) {
        throw new Exception('Database connection not established');
    }

     // -- PARSE BASE64 TOKEN -- //
    // The token is assumed to be something like base64("4:1679999999"),
    // which decodes to "4:1679999999". Split on ":" to get the user/applicant ID.
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    $userId = isset($parts[0]) ? (int)$parts[0] : 0;
    
    // If still no ID, we bail
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token or no user ID found']);
        exit;
    }
    
    // Check if file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $uploadError = $_FILES['file']['error'] ?? 'No file uploaded';
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form',
            UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
        ];
        
        $errorMessage = isset($errorMessages[$uploadError]) ? $errorMessages[$uploadError] : 'Unknown upload error';
        
        http_response_code(400);
        echo json_encode(['error' => $errorMessage]);
        exit;
    }
    
    // Get uploaded file
    $file = $_FILES['file'];
    
    // Validate file type
    $allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only PDF and Word documents are allowed.']);
        exit;
    }
    
    // Validate file size (5MB max)
    $maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File size exceeds the 5MB limit.']);
        exit;
    }
    
    // Get file metadata
    $recordType = isset($_POST['record_type']) ? $_POST['record_type'] : 'applicant';
    $category = isset($_POST['category']) ? $_POST['category'] : 'evaluations';
    $description = isset($_POST['description']) ? $_POST['description'] : basename($file['name']);
    
    // Create upload directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../uploads/applicant/' . $userId . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $newFilename = uniqid() . '_' . time() . '.' . $fileExtension;
    $filePath = $uploadDir . $newFilename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Failed to move uploaded file');
    }
    
    // Store record in database
    $query = "
        INSERT INTO records (user_id, record_type, category, file_path, description)
        VALUES (?, ?, ?, ?, ?)
    ";
    
    $stmt = $pdo->prepare($query);
    $result = $stmt->execute([
        $userId,
        $recordType,
        $category,
        $filePath,
        $description
    ]);
    
    if (!$result) {
        // If database insert fails, try to delete the uploaded file
        @unlink($filePath);
        throw new Exception('Failed to store document record in database');
    }
    
    // Get the inserted record ID
    $documentId = $pdo->lastInsertId();
    
    // Get the full document record
    $selectQuery = "SELECT id, description, file_path, category, created_at FROM records WHERE id = ? LIMIT 1";
    $selectStmt = $pdo->prepare($selectQuery);
    $selectStmt->execute([$documentId]);
    $document = $selectStmt->fetch(PDO::FETCH_ASSOC);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Document uploaded successfully',
        'id' => $documentId,
        'description' => $document['description'],
        'file_path' => basename($document['file_path']),
        'category' => $document['category'],
        'created_at' => $document['created_at']
    ]);
    
} catch (PDOException $e) {
    error_log("Upload Document API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("Upload Document API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
    exit;
}
?>