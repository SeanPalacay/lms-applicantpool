<?php
// lms-forbes/backend/api/trainee/certificate_details.php
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

// Check if certificate ID is provided
if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Certificate ID is required']);
    exit;
}

$certificateId = intval($_GET['id']);

// Verify user role
try {
    $query = "SELECT id, role, full_name FROM users WHERE id = :id";
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

    // First, check if this is a program completion certificate (generated)
    $programQuery = "
    SELECT p.id, p.title, pe.completion_status, pe.enrollment_date
    FROM programs p
    JOIN program_enrollments pe ON p.id = pe.program_id
    WHERE pe.user_id = :userId AND p.id = :programId
    ";
    
    $programStmt = $pdo->prepare($programQuery);
    $programStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $programStmt->bindParam(':programId', $certificateId, PDO::PARAM_INT);
    $programStmt->execute();
    $program = $programStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($program) {
        // This is a program completion certificate (generated)
        $certificate = [
            'id' => $program['id'],
            'record_type' => 'training',
            'category' => 'certificate',
            'description' => "Certificate of Completion: " . $program['title'],
            'file_path' => "/certificates/program_" . $program['id'] . "_user_" . $userId . ".pdf",
            'created_at' => $program['enrollment_date'] ? $program['enrollment_date'] : date('Y-m-d H:i:s'),
            'status' => 'active',
            'expiry_date' => $program['enrollment_date'] ? 
                date('Y-m-d H:i:s', strtotime($program['enrollment_date'] . ' + 1 year')) : 
                date('Y-m-d H:i:s', strtotime('+1 year')),
            'program_id' => $program['id'],
            'program_title' => $program['title']
        ];
        
        http_response_code(200);
        echo json_encode($certificate);
        exit;
    }
    
    // If certificate not found by program ID, return a dummy certificate for testing
    // In production, you would want to check the records table or return an error
    
    // For testing purposes, return a sample certificate
    $dummyCertificate = [
        'id' => $certificateId,
        'record_type' => 'training',
        'category' => 'certificate',
        'description' => 'Certificate of Completion: Loan Officer Basics',
        'file_path' => '/certificates/certificate_' . $certificateId . '.pdf',
        'created_at' => date('Y-m-d H:i:s', strtotime('-1 month')),
        'status' => 'active',
        'expiry_date' => date('Y-m-d H:i:s', strtotime('+11 months')),
        'program_id' => 1,
        'program_title' => 'Loan Officer Basics'
    ];
    
    http_response_code(200);
    echo json_encode($dummyCertificate);

} catch (PDOException $e) {
    error_log('Error in certificate_details.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log('Error in certificate_details.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while fetching certificate details']);
}
?>