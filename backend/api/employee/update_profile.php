<?php
// lms-forbes/backend/api/trainee/update_profile.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

ini_set('display_errors', 0);
error_reporting(E_ERROR);
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Authenticate the user
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

$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}

list($userId, $timestamp) = explode(':', $decodedToken);

if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

try {
    // Start a transaction
    $pdo->beginTransaction();
    
    // Get content type
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? $_SERVER["CONTENT_TYPE"] : '';
    
    // Check if this is a multipart/form-data request (file upload)
    $hasFile = strpos($contentType, 'multipart/form-data') !== false;
    
    // Initialize variables
    $fullName = null;
    $email = null;
    $resumePath = null;
    
    if ($hasFile) {
        // Handle form data submission with file
        $fullName = $_POST['full_name'] ?? null;
        $email = $_POST['email'] ?? null;
        
        // Process resume upload if present
        if (isset($_FILES['resume']) && $_FILES['resume']['error'] === UPLOAD_ERR_OK) {
            $originalName = $_FILES['resume']['name'];
            $tmpName = $_FILES['resume']['tmp_name'];
            
            // Create upload directory if it doesn't exist
            $uploadDir = __DIR__ . '/../../uploads/resume/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            // Generate unique filename
            $uniqueFile = $userId . '_' . time() . '_' . basename($originalName);
            $destination = $uploadDir . $uniqueFile;
            
            // Move the uploaded file
            if (move_uploaded_file($tmpName, $destination)) {
                // Set the path relative to backend directory
                $resumePath = 'uploads/resume/' . $uniqueFile;
                
                // Insert into user_resumes table
                $insertResumeQuery = "
                    INSERT INTO user_resumes (user_id, file_path, original_name)
                    VALUES (:userId, :filePath, :originalName)
                ";
                $resumeStmt = $pdo->prepare($insertResumeQuery);
                $resumeStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
                $resumeStmt->bindParam(':filePath', $resumePath, PDO::PARAM_STR);
                $resumeStmt->bindParam(':originalName', $originalName, PDO::PARAM_STR);
                $resumeStmt->execute();
            } else {
                throw new Exception('Failed to move uploaded file.');
            }
        }
    } else {
        // Handle JSON request
        $data = json_decode(file_get_contents('php://input'), true);
        $fullName = $data['full_name'] ?? null;
        $email = $data['email'] ?? null;
    }
    
    // Update user information
    $updateQuery = "
        UPDATE users
        SET full_name = :fullName, 
            email = :email
        WHERE id = :userId
    ";
    
    $updateStmt = $pdo->prepare($updateQuery);
    $updateStmt->bindParam(':fullName', $fullName, PDO::PARAM_STR);
    $updateStmt->bindParam(':email', $email, PDO::PARAM_STR);
    $updateStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $updateStmt->execute();
    
    // Log the activity
    $activityQuery = "
        INSERT INTO user_activity (user_id, activity_type, details)
        VALUES (:userId, :activityType, :details)
    ";
    
    $details = $resumePath 
        ? "Updated profile information (uploaded resume)" 
        : "Updated profile information";
    
    $activityStmt = $pdo->prepare($activityQuery);
    $activityStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $activityStmt->bindValue(':activityType', 'profile_update', PDO::PARAM_STR);
    $activityStmt->bindParam(':details', $details, PDO::PARAM_STR);
    $activityStmt->execute();
    
    // Commit the transaction
    $pdo->commit();
    
    // Get the most recent resume if one exists
    $latestResumeQuery = "
        SELECT file_path 
        FROM user_resumes 
        WHERE user_id = :userId 
        ORDER BY uploaded_at DESC 
        LIMIT 1
    ";
    $resumeStmt = $pdo->prepare($latestResumeQuery);
    $resumeStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $resumeStmt->execute();
    $latestResume = $resumeStmt->fetch(PDO::FETCH_ASSOC);
    
    // Return the updated information
    http_response_code(200);
    echo json_encode([
        'full_name' => $fullName,
        'email' => $email,
        'resume_path' => $resumePath ?? ($latestResume ? $latestResume['file_path'] : null)
    ]);
    
} catch (PDOException $e) {
    // Roll back the transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Database error in update_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Roll back the transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Error in update_profile.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred: ' . $e->getMessage()]);
}