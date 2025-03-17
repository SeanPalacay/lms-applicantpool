<?php
// lms-forbes/backend/api/trainer/upload_record.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// For debugging - uncomment these lines to see specific errors
// ini_set('display_errors', 1);
// error_reporting(E_ALL);

// For production
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
  $token = $matches[1];
}

if (empty($token)) {
  http_response_code(401);
  echo json_encode(['error' => 'Authentication required']);
  exit;
}

// Decode token (base64-encoded "userId:timestamp")
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid token format']);
  exit;
}

list($userId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24-hour expiration)
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
  exit;
}

// Verify user role
try {
  $query = "SELECT role FROM users WHERE id = :id";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
  $stmt->execute();
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$user || ($user['role'] !== 'trainer' && $user['role'] !== 'administrator')) {
    http_response_code(403);
    echo json_encode(['error' => 'Permission denied']);
    exit;
  }

  // Validate required parameters
  if (!isset($_POST['description']) || trim($_POST['description']) === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Description is required']);
    exit;
  }

  if (!isset($_POST['category']) || trim($_POST['category']) === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Category is required']);
    exit;
  }

  if (!isset($_FILES['file']) || $_FILES['file']['error'] != UPLOAD_ERR_OK) {
    http_response_code(400);
    $errorMessage = 'File upload failed';
    
    // Provide more details about the error
    if (isset($_FILES['file']['error'])) {
      switch ($_FILES['file']['error']) {
        case UPLOAD_ERR_INI_SIZE:
          $errorMessage .= ': The uploaded file exceeds the upload_max_filesize directive in php.ini';
          break;
        case UPLOAD_ERR_FORM_SIZE:
          $errorMessage .= ': The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form';
          break;
        case UPLOAD_ERR_PARTIAL:
          $errorMessage .= ': The uploaded file was only partially uploaded';
          break;
        case UPLOAD_ERR_NO_FILE:
          $errorMessage .= ': No file was uploaded';
          break;
        case UPLOAD_ERR_NO_TMP_DIR:
          $errorMessage .= ': Missing a temporary folder';
          break;
        case UPLOAD_ERR_CANT_WRITE:
          $errorMessage .= ': Failed to write file to disk';
          break;
        case UPLOAD_ERR_EXTENSION:
          $errorMessage .= ': A PHP extension stopped the file upload';
          break;
      }
    }
    
    echo json_encode(['error' => $errorMessage]);
    exit;
  }

  // Get file information
  $file = $_FILES['file'];
  $fileName = $file['name'];
  $fileSize = $file['size'];
  $fileTmpPath = $file['tmp_name'];
  $fileType = $file['type'];
  
  // Validate file size (10MB max)
  $maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
  if ($fileSize > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File size exceeds the 10MB limit']);
    exit;
  }
  
  // Validate file type
  $allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];
  
  // Check MIME type (can be spoofed, but provides a basic check)
  if (!in_array($fileType, $allowedTypes)) {
    // If mime_content_type function is available, perform a more reliable check
    if (function_exists('mime_content_type')) {
      $actualMimeType = mime_content_type($fileTmpPath);
      if (!in_array($actualMimeType, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Unsupported file type. Please upload PDF, Word, Excel, PowerPoint, or image files.']);
        exit;
      }
    } else {
      // If we can't verify with mime_content_type, check file extension as a fallback
      $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
      $allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'txt'];
      
      if (!in_array($fileExtension, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['error' => 'Unsupported file type. Please upload PDF, Word, Excel, PowerPoint, or image files.']);
        exit;
      }
    }
  }
  
  // Create upload directory if it doesn't exist
  $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/records/';
  if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
  }
  
  // Generate a unique filename
  $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
  $newFileName = uniqid() . '_' . time() . '.' . $fileExtension;
  $uploadPath = $uploadDir . $newFileName;
  
  // Move the file to the uploads directory
  if (!move_uploaded_file($fileTmpPath, $uploadPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to upload file']);
    exit;
  }
  
  // Get request data
  $description = trim($_POST['description']);
  $category = trim($_POST['category']);
  $assignedUserId = isset($_POST['user_id']) && !empty($_POST['user_id']) ? 
    intval($_POST['user_id']) : null;
  
  // Validate assigned user if provided
  if ($assignedUserId !== null) {
    $query = "SELECT id FROM users WHERE id = :id AND role = 'trainee'";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $assignedUserId, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
      // If the file was uploaded, remove it
      if (file_exists($uploadPath)) {
        unlink($uploadPath);
      }
      
      http_response_code(400);
      echo json_encode(['error' => 'Invalid trainee selected']);
      exit;
    }
  }
  
  // Store the relative path for the file (without document root)
  $relativePath = '/uploads/records/' . $newFileName;
  
  // Start transaction
  $pdo->beginTransaction();
  
  // Insert record into database
  $query = "
    INSERT INTO records (
      user_id,
      record_type,
      category,
      file_path,
      description,
      created_at
    ) VALUES (
      :user_id,
      :record_type,
      :category,
      :file_path,
      :description,
      NOW()
    )
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
  $recordType = $assignedUserId !== null ? 'training' : 'other';
  $stmt->bindParam(':record_type', $recordType);
  $stmt->bindParam(':category', $category);
  $stmt->bindParam(':file_path', $relativePath);
  $stmt->bindParam(':description', $description);
  $stmt->execute();
  
  $recordId = $pdo->lastInsertId();
  
  // If assigned to a trainee, create trainee-specific record
  if ($assignedUserId !== null) {
    // Perform any additional operations for trainee-specific records here
    // For example, you might want to add a record to a trainee_records table
    // or update some trainee-related statistics
  }
  
  // Commit transaction
  $pdo->commit();
  
  // Return success
  http_response_code(200);
  echo json_encode([
    'success' => true,
    'message' => 'Record uploaded successfully',
    'record_id' => $recordId,
    'file_path' => $relativePath
  ]);

} catch (PDOException $e) {
  // Rollback transaction on error
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  
  // If the file was uploaded, remove it
  if (isset($uploadPath) && file_exists($uploadPath)) {
    unlink($uploadPath);
  }
  
  error_log('Error in upload_record.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
  // Rollback transaction on error
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  
  // If the file was uploaded, remove it
  if (isset($uploadPath) && file_exists($uploadPath)) {
    unlink($uploadPath);
  }
  
  error_log('Error in upload_record.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while uploading the record']);
}
?>