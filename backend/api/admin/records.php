<?php
// api/admin/records.php

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CORS middleware and database connection
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string or form data
if (empty($token)) {
    if (isset($_GET['token'])) {
        $token = $_GET['token'];
    } elseif (isset($_POST['token'])) {
        $token = $_POST['token'];
    }
}

// Simple token validation (in production, use proper JWT validation)
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Determine request type and process accordingly
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Process GET requests
    if ($method === 'GET') {
        // Check if specific record is requested
        if (isset($_GET['id'])) {
            $recordId = $_GET['id'];
            
            // Check if download action is requested
            if (isset($_GET['action']) && $_GET['action'] === 'download') {
                downloadRecord($pdo, $recordId);
            } else {
                // Return record details
                getRecordById($pdo, $recordId);
            }
        } 
        // Check if categories are requested
        elseif (isset($_GET['action']) && $_GET['action'] === 'categories') {
            getRecordCategories($pdo);
        }
        // Return all records
        else {
            getAllRecords($pdo);
        }
    }
    // Process POST requests (record upload)
    elseif ($method === 'POST') {
        // Check if bulk download action is requested
        if (isset($_GET['action']) && $_GET['action'] === 'download-bulk') {
            // Get record IDs from request body
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['record_ids']) || !is_array($data['record_ids'])) {
                throw new Exception('Record IDs are required for bulk download');
            }
            downloadMultipleRecords($pdo, $data['record_ids']);
        } else {
            // Handle file upload
            uploadRecord($pdo);
        }
    }
    // Process DELETE requests
    elseif ($method === 'DELETE') {
        // Check if bulk delete action is requested
        if (isset($_GET['action']) && $_GET['action'] === 'delete-bulk') {
            // Get record IDs from request body
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['record_ids']) || !is_array($data['record_ids'])) {
                throw new Exception('Record IDs are required for bulk delete');
            }
            deleteMultipleRecords($pdo, $data['record_ids']);
        } 
        // Delete single record
        elseif (isset($_GET['id'])) {
            $recordId = $_GET['id'];
            deleteRecord($pdo, $recordId);
        } else {
            throw new Exception('Record ID is required for deletion');
        }
    }
    // Handle invalid request methods
    else {
        header('Content-Type: application/json');
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
} catch (PDOException $e) {
    // Handle database errors
    error_log("Records API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Handle general errors
    error_log("Records API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Get all records
 */
function getAllRecords($pdo) {
    // Query to fetch all records with user details
    $query = "
        SELECT 
            r.id,
            r.user_id,
            r.record_type,
            r.category,
            r.file_path,
            r.description,
            r.created_at,
            u.full_name AS userName,
            u.role AS userRole
        FROM 
            records r
        LEFT JOIN 
            users u ON r.user_id = u.id
        ORDER BY 
            r.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    $records = $stmt->fetchAll();
    
    header('Content-Type: application/json');
    echo json_encode(['records' => $records]);
}

/**
 * Get record by ID
 */
function getRecordById($pdo, $recordId) {
    // Query to fetch record details with user information
    $query = "
        SELECT 
            r.id,
            r.user_id,
            r.record_type,
            r.category,
            r.file_path,
            r.description,
            r.created_at,
            u.full_name AS userName,
            u.role AS userRole
        FROM 
            records r
        LEFT JOIN 
            users u ON r.user_id = u.id
        WHERE 
            r.id = ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$recordId]);
    
    $record = $stmt->fetch();
    
    if (!$record) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
        exit;
    }
    
    // Determine file type based on file_path extension
    if ($record['file_path']) {
        $extension = pathinfo($record['file_path'], PATHINFO_EXTENSION);
        switch (strtolower($extension)) {
            case 'pdf':
                $record['file_type'] = 'application/pdf';
                break;
            case 'doc':
            case 'docx':
                $record['file_type'] = 'application/msword';
                break;
            case 'xls':
            case 'xlsx':
                $record['file_type'] = 'application/vnd.ms-excel';
                break;
            case 'jpg':
            case 'jpeg':
                $record['file_type'] = 'image/jpeg';
                break;
            case 'png':
                $record['file_type'] = 'image/png';
                break;
            default:
                $record['file_type'] = 'application/octet-stream';
        }
        
        // Get file size if the file exists
        $filePath = $record['file_path'];
        if (!file_exists($filePath)) {
            // Try to resolve relative to document root
            $docRoot = $_SERVER['DOCUMENT_ROOT'];
            $filePath = $docRoot . $filePath;
        }
        
        if (file_exists($filePath)) {
            $record['file_size'] = filesize($filePath);
        } else {
            $record['file_size'] = null;
        }
    } else {
        $record['file_type'] = null;
        $record['file_size'] = null;
    }
    
    header('Content-Type: application/json');
    echo json_encode($record);
}

/**
 * Download record file
 */
function downloadRecord($pdo, $recordId) {
    // Get record info
    $query = "
        SELECT 
            file_path,
            description
        FROM 
            records
        WHERE 
            id = ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$recordId]);
    
    $record = $stmt->fetch();
    
    if (!$record) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
        exit;
    }
    
    $filePath = $record['file_path'];
    
    // Check if file path is absolute or relative
    if (!file_exists($filePath)) {
        // Try to resolve relative to document root
        $docRoot = $_SERVER['DOCUMENT_ROOT'];
        $filePath = $docRoot . $filePath;
    }
    
    if (file_exists($filePath)) {
        // Get file MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);
        
        // Set headers for file download
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        // Output file and exit
        readfile($filePath);
        exit;
    } else {
        // File not found
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'File not found at path: ' . $record['file_path']]);
        exit;
    }
}

/**
 * Download multiple records as ZIP archive
 */
function downloadMultipleRecords($pdo, $recordIds) {
    // Create temporary file for ZIP archive
    $tempFile = tempnam(sys_get_temp_dir(), 'records_');
    $zip = new ZipArchive();
    
    if ($zip->open($tempFile, ZipArchive::CREATE) !== true) {
        throw new Exception('Could not create ZIP archive');
    }
    
    // Placeholder for used filenames to avoid duplicates
    $usedFilenames = [];
    
    // Add each record to the ZIP archive
    foreach ($recordIds as $recordId) {
        // Get file info from database
        $query = "
            SELECT 
                file_path,
                description
            FROM 
                records
            WHERE 
                id = ?
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$recordId]);
        
        $record = $stmt->fetch();
        
        if ($record) {
            $filePath = $record['file_path'];
            
            // Check if file path is absolute or relative
            if (!file_exists($filePath)) {
                // Try to resolve relative to document root
                $docRoot = $_SERVER['DOCUMENT_ROOT'];
                $filePath = $docRoot . $filePath;
            }
            
            if (file_exists($filePath)) {
                $filename = basename($filePath);
                
                // Handle duplicate filenames
                if (in_array($filename, $usedFilenames)) {
                    $pathInfo = pathinfo($filename);
                    $filename = $pathInfo['filename'] . '_' . $recordId . '.' . $pathInfo['extension'];
                }
                
                $usedFilenames[] = $filename;
                
                // Add file to ZIP
                $zip->addFile($filePath, $filename);
            }
        }
    }
    
    $zip->close();
    
    // Set headers for ZIP download
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="records_' . date('Y-m-d') . '.zip"');
    header('Content-Length: ' . filesize($tempFile));
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Output ZIP file and clean up
    readfile($tempFile);
    unlink($tempFile);
    exit;
}

/**
 * Delete record
 */
function deleteRecord($pdo, $recordId) {
    // Get file path before deleting record
    $query = "SELECT file_path FROM records WHERE id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$recordId]);
    $record = $stmt->fetch();
    
    if (!$record) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Record not found']);
        exit;
    }
    
    // Delete from database
    $deleteStmt = $pdo->prepare("DELETE FROM records WHERE id = ?");
    $deleteStmt->execute([$recordId]);
    
    // Try to delete the file if it exists
    $filePath = $record['file_path'];
    if (!file_exists($filePath)) {
        // Try to resolve relative to document root
        $docRoot = $_SERVER['DOCUMENT_ROOT'];
        $filePath = $docRoot . $filePath;
    }
    
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Record deleted successfully'
    ]);
}

/**
 * Delete multiple records
 */
function deleteMultipleRecords($pdo, $recordIds) {
    // Get file paths before deleting records
    $placeholders = implode(',', array_fill(0, count($recordIds), '?'));
    $query = "SELECT id, file_path FROM records WHERE id IN ($placeholders)";
    $stmt = $pdo->prepare($query);
    $stmt->execute($recordIds);
    $records = $stmt->fetchAll();
    
    // Delete from database
    $deleteStmt = $pdo->prepare("DELETE FROM records WHERE id IN ($placeholders)");
    $deleteStmt->execute($recordIds);
    $deletedCount = $deleteStmt->rowCount();
    
    // Try to delete the files if they exist
    foreach ($records as $record) {
        $filePath = $record['file_path'];
        if (!file_exists($filePath)) {
            // Try to resolve relative to document root
            $docRoot = $_SERVER['DOCUMENT_ROOT'];
            $filePath = $docRoot . $filePath;
        }
        
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Records deleted successfully',
        'deleted_count' => $deletedCount
    ]);
}

/**
 * Upload record file
 */
function uploadRecord($pdo) {
    // Check if file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File upload failed. Error code: ' . ($_FILES['file']['error'] ?? 'No file uploaded'));
    }
    
    // Get uploaded file info
    $file = $_FILES['file'];
    $fileName = basename($file['name']);
    $fileType = $file['type'];
    $fileTmpPath = $file['tmp_name'];
    
    // Get other form data
    $userId = !empty($_POST['user_id']) ? $_POST['user_id'] : null;
    $recordType = $_POST['record_type'] ?? '';
    $category = $_POST['category'] ?? '';
    $description = $_POST['description'] ?? '';
    
    // Validate required fields
    if (empty($recordType) || empty($category) || empty($description)) {
        throw new Exception('Record type, category, and description are required');
    }
    
    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../uploads/' . $recordType . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename to prevent overwriting
    $uniqueFileName = uniqid() . '_' . $fileName;
    $uploadPath = $uploadDir . $uniqueFileName;
    
    // Define the file path to store in database (relative to document root)
    $dbFilePath = '/uploads/' . $recordType . '/' . $uniqueFileName;
    
    // Move the uploaded file
    if (!move_uploaded_file($fileTmpPath, $uploadPath)) {
        throw new Exception('Failed to save uploaded file');
    }
    
    // Insert record into database
    $stmt = $pdo->prepare("
        INSERT INTO records (
            user_id, 
            record_type, 
            category, 
            file_path, 
            description
        ) VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $userId,
        $recordType,
        $category,
        $dbFilePath,
        $description
    ]);
    
    $recordId = $pdo->lastInsertId();
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Record uploaded successfully',
        'record_id' => $recordId
    ]);
}

/**
 * Get record categories
 */
function getRecordCategories($pdo) {
    // Query to get distinct categories from records table
    $query = "
        SELECT DISTINCT
            category,
            record_type
        FROM 
            records
        WHERE 
            category IS NOT NULL AND category != ''
        ORDER BY 
            record_type, category
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    $results = $stmt->fetchAll();
    
    // Format results for frontend
    $categories = [];
    foreach ($results as $row) {
        $categories[] = [
            'value' => $row['category'],
            'label' => ucfirst(str_replace('_', ' ', $row['category'])),
            'record_type' => $row['record_type']
        ];
    }
    
    // Default categories if none found
    if (empty($categories)) {
        $categories = [
            ['value' => 'certificates', 'label' => 'Certificates', 'record_type' => 'training'],
            ['value' => 'guides', 'label' => 'Guides', 'record_type' => 'training'],
            ['value' => 'evaluations', 'label' => 'Evaluations', 'record_type' => 'applicant'],
            ['value' => 'miscellaneous', 'label' => 'Miscellaneous', 'record_type' => 'other']
        ];
    }
    
    header('Content-Type: application/json');
    echo json_encode($categories);
}