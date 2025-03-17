<?php
// lms-forbes/backend/api/trainee/certificate_share.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
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

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// Get request body
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['certificate_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Certificate ID is required']);
    exit;
}

$certificateId = intval($input['certificate_id']);

// Verify user role and access to the certificate
try {
    $query = "SELECT id, role FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    if ($user['role'] !== 'trainee' && $user['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    // Check if certificate exists - either in records or as a program completion certificate
    $hasCertificate = false;
    
    // Check program enrollments first (for generated certificates)
    $programQuery = "
    SELECT pe.program_id
    FROM program_enrollments pe
    WHERE pe.user_id = :userId AND pe.program_id = :programId
    AND pe.completion_status = 'completed'
    ";
    
    $programStmt = $pdo->prepare($programQuery);
    $programStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $programStmt->bindParam(':programId', $certificateId, PDO::PARAM_INT);
    $programStmt->execute();
    $program = $programStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($program) {
        $hasCertificate = true;
    } else {
        // Check records table
        $recordQuery = "
        SELECT id 
        FROM records 
        WHERE id = :certificateId 
        AND user_id = :userId
        AND record_type = 'training'
        AND category = 'certificates'
        ";
        
        $recordStmt = $pdo->prepare($recordQuery);
        $recordStmt->bindParam(':certificateId', $certificateId, PDO::PARAM_INT);
        $recordStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $recordStmt->execute();
        $record = $recordStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($record) {
            $hasCertificate = true;
        }
    }
    
    if (!$hasCertificate) {
        http_response_code(404);
        echo json_encode(['error' => 'Certificate not found']);
        exit;
    }
    
    // Generate a shareable link (in a real system, this would be a unique token stored in a database)
    // For this example, we'll create a simple hash that would work with your front-end routes
    $shareToken = md5($userId . '_' . $certificateId . '_' . time());
    $baseUrl = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'http://localhost';
    $sharePath = '/certificate/share/' . $shareToken;
    $shareLink = $baseUrl . $sharePath;
    
    // In a real implementation, you would:
    // 1. Store the share token, certificate ID, and expiration in a database
    // 2. Create an endpoint to validate the token and serve the certificate
    
    // Return shareable link
    echo json_encode([
        'success' => true,
        'shareLink' => $shareLink,
        'expiresIn' => '7 days'
    ]);
    
} catch (PDOException $e) {
    error_log('Error in certificate_share.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log('Error in certificate_share.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while processing the certificate share request']);
}
?>