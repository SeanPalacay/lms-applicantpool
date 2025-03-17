<?php
// lms-forbes/backend/api/trainer/download_record.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// For debugging - uncomment these lines to see specific errors
// ini_set('display_errors', 1);
// error_reporting(E_ALL);

// For production
ini_set('display_errors', 0);
error_reporting(E_ERROR);

// Check if record ID is provided
if (!isset($_GET['recordId'])) {
  header('Content-Type: application/json');
  http_response_code(400);
  echo json_encode(['error' => 'Record ID is required']);
  exit;
}

$recordId = intval($_GET['recordId']);

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
  $token = $matches[1];
}

if (empty($token)) {
  header('Content-Type: application/json');
  http_response_code(401);
  echo json_encode(['error' => 'Authentication required']);
  exit;
}

// Decode token (base64-encoded "userId:timestamp")
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
  header('Content-Type: application/json');
  http_response_code(401);
  echo json_encode(['error' => 'Invalid token format']);
  exit;
}

list($userId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24-hour expiration)
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  header('Content-Type: application/json');
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
    header('Content-Type: application/json');
    http_response_code(403);
    echo json_encode(['error' => 'Permission denied']);
    exit;
  }

  // Get record file path
  $query = "
    SELECT 
      file_path,
      description
    FROM 
      records
    WHERE 
      id = :id
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':id', $recordId, PDO::PARAM_INT);
  $stmt->execute();
  $record = $stmt->fetch(PDO::FETCH_ASSOC);
  
  if (!$record || empty($record['file_path'])) {
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['error' => 'Record not found or no file available']);
    exit;
  }

  // For demo/testing purposes - create a sample file if real file doesn't exist
  $filePath = $_SERVER['DOCUMENT_ROOT'] . $record['file_path'];
  
  if (!file_exists($filePath)) {
    // Return a dummy PDF for demonstration
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="sample.pdf"');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Create a very simple PDF using text
    echo "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R/Parent 2 0 R>>endobj 4 0 obj<</Length 90>>stream\nBT\n/F1 24 Tf\n100 700 Td\n(Sample PDF File - {$record['description']}) Tj\n0 -50 Td\n(This is a placeholder file.) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000015 00000 n\n0000000061 00000 n\n0000000114 00000 n\n0000000213 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n353\n%%EOF";
    exit;
  }
  
  // Get file info
  $fileInfo = pathinfo($filePath);
  $fileName = $fileInfo['basename'];
  $fileExtension = strtolower($fileInfo['extension']);
  
  // Set content type based on file extension
  $mimeTypes = [
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls' => 'application/vnd.ms-excel',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'txt' => 'text/plain'
  ];
  
  $contentType = isset($mimeTypes[$fileExtension]) ? $mimeTypes[$fileExtension] : 'application/octet-stream';
  
  // Set headers for file download
  header('Content-Type: ' . $contentType);
  header('Content-Disposition: attachment; filename="' . $fileName . '"');
  header('Content-Length: ' . filesize($filePath));
  header('Cache-Control: no-cache, no-store, must-revalidate');
  header('Pragma: no-cache');
  header('Expires: 0');
  
  // Output file content
  readfile($filePath);
  exit;

} catch (PDOException $e) {
  error_log('Error in download_record.php: ' . $e->getMessage());
  header('Content-Type: application/json');
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
  exit;
} catch (Exception $e) {
  error_log('Error in download_record.php: ' . $e->getMessage());
  header('Content-Type: application/json');
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred: ' . $e->getMessage()]);
  exit;
}
?>