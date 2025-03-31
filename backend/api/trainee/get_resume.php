<?php
// lms-forbes/backend/api/trainee/get_resume.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Hide raw PHP errors from output
ini_set('display_errors', 0);
error_reporting(E_ERROR);

// Validate token
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (empty($token)) {
    http_response_code(401);
    exit('Unauthorized');
}

// Decode the base64 token: "userId:timestamp"
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    exit('Invalid token format');
}

list($userId, $timestamp) = explode(':', $decodedToken);

// 24-hour expiration check
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    exit('Token expired');
}

try {
    // Get resume path from query parameter
    $resumePath = isset($_GET['path']) ? $_GET['path'] : '';
    
    if (empty($resumePath)) {
        // If no path specified, try to get the latest resume for the user
        $stmt = $pdo->prepare("
            SELECT file_path, original_name 
            FROM user_resumes 
            WHERE user_id = :userId 
            ORDER BY uploaded_at DESC 
            LIMIT 1
        ");
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $resume = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$resume) {
            http_response_code(404);
            exit('No resume found for this user');
        }
        
        $resumePath = $resume['file_path'];
        $originalName = $resume['original_name'];
    } else {
        // Verify that the requested resume belongs to this user or the user has permission
        $stmt = $pdo->prepare("
            SELECT ur.file_path, ur.original_name, ur.user_id, u.role
            FROM user_resumes ur
            JOIN users u ON u.id = :userId
            WHERE ur.file_path = :path
        ");
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':path', $resumePath, PDO::PARAM_STR);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Allow access if: 
        // 1. The resume belongs to the current user OR
        // 2. The current user is an administrator or trainer
        if (!$result || ($result['user_id'] != $userId && 
                         !in_array($result['role'], ['administrator', 'trainer']))) {
            http_response_code(403);
            exit('Access denied');
        }
        
        $originalName = $result['original_name'];
    }
    
    // Full server path to the file
    $fullPath = __DIR__ . '/../../' . $resumePath;
    
    // Check if file exists on the server
    if (!file_exists($fullPath)) {
        http_response_code(404);
        exit('File not found');
    }
    
    // Log access
    $stmt = $pdo->prepare("
        INSERT INTO user_activity (user_id, activity_type, details)
        VALUES (:userId, 'document_view', :details)
    ");
    $details = "Viewed resume: " . $originalName;
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':details', $details, PDO::PARAM_STR);
    $stmt->execute();
    
    // Determine MIME type
    $mimeType = mime_content_type($fullPath);
    
    // Set appropriate headers
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: inline; filename="' . $originalName . '"');
    header('Content-Length: ' . filesize($fullPath));
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');
    
    // Output file content
    readfile($fullPath);
    exit;
    
} catch (PDOException $e) {
    error_log('Database error in get_resume.php: ' . $e->getMessage());
    http_response_code(500);
    exit('Server error');
} catch (Exception $e) {
    error_log('Error in get_resume.php: ' . $e->getMessage());
    http_response_code(500);
    exit('Server error');
}