<?php
// lms-forbes/backend/api/trainee/upload_resume.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Hide raw PHP errors from output
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Must be POST for uploading
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// Check the Authorization header for a Bearer token
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

// Decode the base64 token: "userId:timestamp"
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}

list($userId, $timestamp) = explode(':', $decodedToken);

// 24-hour expiration check
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

try {
    // 1) Check user role (optional).
    // Let’s say only 'trainee' or 'applicant' can upload a résumé.
    $roleStmt = $pdo->prepare("SELECT role FROM users WHERE id = :id");
    $roleStmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $roleStmt->execute();
    $userRow = $roleStmt->fetch(PDO::FETCH_ASSOC);
    if (!$userRow) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Only let 'trainee' or 'applicant' upload
    $allowedRoles = ['trainee', 'applicant'];
    if (!in_array($userRow['role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    // 2) Check if a file was uploaded
    if (!isset($_FILES['resume']) || empty($_FILES['resume']['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded. Please attach a file with "resume" key.']);
        exit;
    }

    // 3) Process the file
    $originalName = $_FILES['resume']['name'];
    $tmpName      = $_FILES['resume']['tmp_name'];

    // Build upload directory (e.g. "backend/uploads/resume/")
    $uploadDir = __DIR__ . '/../../uploads/resume/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Generate unique filename to prevent collisions
    $uniqueFile = $userId . '_' . time() . '_' . basename($originalName);
    $destination = $uploadDir . $uniqueFile;

    if (!move_uploaded_file($tmpName, $destination)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to move uploaded file.']);
        exit;
    }

    // 4) Insert into user_resumes table
    // We’ll store "uploads/resume/<filename>" as the path
    $filePath = 'uploads/resume/' . $uniqueFile;

    $insertQuery = "
        INSERT INTO user_resumes (user_id, file_path, original_name)
        VALUES (:userId, :filePath, :originalName)
    ";
    $stmt = $pdo->prepare($insertQuery);
    $stmt->bindParam(':userId',       $userId,      PDO::PARAM_INT);
    $stmt->bindParam(':filePath',     $filePath,    PDO::PARAM_STR);
    $stmt->bindParam(':originalName', $originalName, PDO::PARAM_STR);
    $stmt->execute();
    $insertId = $pdo->lastInsertId();

    // Optionally log an activity
    $activityStmt = $pdo->prepare("
        INSERT INTO user_activity (user_id, activity_type, details)
        VALUES (:uid, :atype, :details)
    ");
    $activityType    = 'profile_update';
    $activityDetails = 'Uploaded a resume: ' . $originalName;
    $activityStmt->bindParam(':uid', $userId, PDO::PARAM_INT);
    $activityStmt->bindParam(':atype', $activityType, PDO::PARAM_STR);
    $activityStmt->bindParam(':details', $activityDetails, PDO::PARAM_STR);
    $activityStmt->execute();

    // 5) Return the new record info
    $selectQuery = "
        SELECT id, user_id, file_path, original_name, uploaded_at
        FROM user_resumes
        WHERE id = :id
    ";
    $selectStmt = $pdo->prepare($selectQuery);
    $selectStmt->bindParam(':id', $insertId, PDO::PARAM_INT);
    $selectStmt->execute();
    $newResume = $selectStmt->fetch(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'message' => 'File uploaded successfully.',
        'resume'  => $newResume
    ]);

} catch (PDOException $e) {
    error_log('Error in upload_resume.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: '.$e->getMessage()]);
} catch (Exception $e) {
    error_log('Error in upload_resume.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while uploading resume.']);
}
