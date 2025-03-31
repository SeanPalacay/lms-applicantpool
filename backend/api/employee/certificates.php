<?php
// lms-forbes/backend/api/trainee/certificates.php
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

// Verify user role
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

    // Get the user's program enrollments first
    $enrollmentsQuery = "
    SELECT pe.program_id, p.title AS program_title
    FROM program_enrollments pe
    JOIN programs p ON pe.program_id = p.id
    WHERE pe.user_id = :userId AND pe.completion_status = 'completed'
    ";
    
    $enrollmentsStmt = $pdo->prepare($enrollmentsQuery);
    $enrollmentsStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $enrollmentsStmt->execute();
    $completedPrograms = $enrollmentsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If no completed programs, return empty array
    if (empty($completedPrograms)) {
        http_response_code(200);
        echo json_encode([]);
        exit;
    }
    
    // Get records for certificates based on completed programs
    // Since we don't have direct relation between records and programs,
    // we'll manually create certificate objects
    $certificates = [];
    
    foreach ($completedPrograms as $program) {
        // For each completed program, create a certificate record
        $certificate = [
            'id' => $program['program_id'], // Using program_id as certificate id
            'record_type' => 'training',
            'category' => 'certificate',
            'description' => "Certificate of Completion: " . $program['program_title'],
            'file_path' => "/certificates/program_" . $program['program_id'] . "_user_" . $userId . ".pdf",
            'created_at' => date('Y-m-d H:i:s'), // Current time as issue date
            'status' => 'active',
            'expiry_date' => date('Y-m-d H:i:s', strtotime('+1 year')), // 1 year from now
            'program_id' => $program['program_id'],
            'program_title' => $program['program_title']
        ];
        
        $certificates[] = $certificate;
    }
    
    // Get existing certificates from records table if any
    $recordsQuery = "
    SELECT r.id, r.record_type, r.category, r.description, r.file_path, r.created_at,
           'active' as status, DATE_ADD(r.created_at, INTERVAL 1 YEAR) as expiry_date,
           COALESCE(p.id, 0) as program_id, COALESCE(p.title, 'Unknown Program') as program_title
    FROM records r
    LEFT JOIN (
        SELECT id, title FROM programs
    ) p ON r.description LIKE CONCAT('%', p.title, '%')
    WHERE r.user_id = :userId
    AND r.record_type = 'training'
    AND r.category = 'certificates'
    ";
    
    $recordsStmt = $pdo->prepare($recordsQuery);
    $recordsStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $recordsStmt->execute();
    $existingCertificates = $recordsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Merge existing certificates with generated ones
    $allCertificates = array_merge($certificates, $existingCertificates);
    
    // Sort by created_at (newest first)
    usort($allCertificates, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    http_response_code(200);
    echo json_encode($allCertificates);

} catch (PDOException $e) {
    error_log('Error in certificates.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log('Error in certificates.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while fetching certificates']);
}
?>