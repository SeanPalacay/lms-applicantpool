<?php
// lms-forbes/backend/api/employee/profile.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

ini_set('display_errors', 0);
error_reporting(E_ERROR);
header('Content-Type: application/json');

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
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Decode base64 "userId:timestamp"
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}
list($userId, $timestamp) = explode(':', $decodedToken);

// Expiration
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

try {
    // 1) Fetch user record
    $userQuery = "
        SELECT
            id,
            username,
            full_name,
            email,
            role,
            status,
            created_at,
            last_login,
            department
        FROM users
        WHERE id = :id
    ";
    $stmt = $pdo->prepare($userQuery);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Only allow 'employee' or 'administrator' roles to access this endpoint
    if ($user['role'] !== 'employee' && $user['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    // 2) Log profile view
    $activityStmt = $pdo->prepare("
        INSERT INTO user_activity (user_id, activity_type, details)
        VALUES (:uid, :atype, :details)
    ");
    $activityType    = 'profile_view';
    $activityDetails = 'Viewed own profile';
    $activityStmt->bindParam(':uid', $userId, PDO::PARAM_INT);
    $activityStmt->bindParam(':atype', $activityType, PDO::PARAM_STR);
    $activityStmt->bindParam(':details', $activityDetails, PDO::PARAM_STR);
    $activityStmt->execute();

    // 3) Fetch all résumés from `user_resumes` for this user
    $resumeQuery = "
        SELECT
            id,
            file_path,
            original_name,
            uploaded_at
        FROM user_resumes
        WHERE user_id = :uid
        ORDER BY uploaded_at DESC
    ";
    $resStmt = $pdo->prepare($resumeQuery);
    $resStmt->bindParam(':uid', $userId, PDO::PARAM_INT);
    $resStmt->execute();
    $resumes = $resStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4) Return combined data
    http_response_code(200);

    // Get the most recent resume path, if any
    $resumePath = !empty($resumes) ? $resumes[0]['file_path'] : null;

    echo json_encode([
        'id'         => $user['id'],
        'username'   => $user['username'],
        'full_name'  => $user['full_name'],
        'email'      => $user['email'],
        'role'       => $user['role'],
        'status'     => $user['status'],
        'created_at' => $user['created_at'],
        'last_login' => $user['last_login'],
        'department' => $user['department'],
        'resume_path' => $resumePath,
        'resumes'    => $resumes
    ]);

} catch (PDOException $e) {
    error_log('Error in employee/profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log('Error in employee/profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while fetching profile']);
}