<?php
// lms-forbes/backend/api/employee/get_resume.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

ini_set('display_errors', 0);
error_reporting(E_ERROR);

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}
if (empty($token)) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Decode base64 "userId:timestamp"
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}
list($userId, $timestamp) = explode(':', $decodedToken);

// Expiration
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

try {
    // Verify the user exists and has the right role
    $userQuery = "SELECT id, role FROM users WHERE id = :id";
    $stmt = $pdo->prepare($userQuery);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Only allow employee or administrator roles
    if ($user['role'] !== 'employee' && $user['role'] !== 'administrator') {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    // Get resume path from URL parameter
    $resumePath = isset($_GET['path']) ? $_GET['path'] : null;
    if (!$resumePath) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Resume path is required']);
        exit;
    }

    // Sanitize and validate path
    $resumePath = filter_var($resumePath, FILTER_SANITIZE_STRING);
    $fullPath = __DIR__ . '/../../../' . $resumePath;

    // Verify the resume belongs to the user (security check)
    $verifyQuery = "
        SELECT COUNT(*) as count 
        FROM user_resumes 
        WHERE user_id = :uid AND file_path = :path
    ";
    $verifyStmt = $pdo->prepare($verifyQuery);
    $verifyStmt->bindParam(':uid', $userId, PDO::PARAM_INT);
    $verifyStmt->bindParam(':path', $resumePath, PDO::PARAM_STR);
    $verifyStmt->execute();
    $result = $verifyStmt->fetch(PDO::FETCH_ASSOC);

    // If resume doesn't belong to this user and user is not admin
    if ($result['count'] == 0 && $user['role'] !== 'administrator') {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'You do not have permission to access this file']);
        exit;
    }

    // Check if file exists
    if (!file_exists($fullPath)) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'File not found']);
        exit;
    }

    // Log activity
    $activityStmt = $pdo->prepare("
        INSERT INTO user_activity (user_id, activity_type, details)
        VALUES (:uid, :atype, :details)
    ");
    $activityType = 'document_view';
    $activityDetails = 'Viewed resume: ' . basename($resumePath);
    $activityStmt->bindParam(':uid', $userId, PDO::PARAM_INT);
    $activityStmt->bindParam(':atype', $activityType, PDO::PARAM_STR);
    $activityStmt->bindParam(':details', $activityDetails, PDO::PARAM_STR);
    $activityStmt->execute();

    // Determine file type
    $fileExtension = strtolower(pathinfo($resumePath, PATHINFO_EXTENSION));
    switch ($fileExtension) {
        case 'pdf':
            $contentType = 'application/pdf';
            break;
        case 'doc':
            $contentType = 'application/msword';
            break;
        case 'docx':
            $contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        default:
            $contentType = 'application/octet-stream';
    }

    // Output the file
    header('Content-Type: ' . $contentType);
    header('Content-Disposition: inline; filename="' . basename($resumePath) . '"');
    header('Content-Length: ' . filesize($fullPath));
    readfile($fullPath);
    exit;

} catch (PDOException $e) {
    error_log('Error in employee/get_resume.php: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log('Error in employee/get_resume.php: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'An error occurred while retrieving the resume']);
}