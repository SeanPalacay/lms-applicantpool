<?php
// lms-forbes/backend/api/public/shared_certificate.php
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

// Check for share token
if (!isset($_GET['token']) || empty($_GET['token'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Share token is required']);
    exit;
}

$shareToken = $_GET['token'];

try {
    // In a real implementation, you would have a table to store share tokens
    // For now, we'll parse the token to extract user ID and certificate ID
    
    // This is a simplified implementation - in a real system, you would:
    // 1. Look up the token in a share_tokens table
    // 2. Check if it's expired
    // 3. Get the associated certificate ID and user ID
    
    // For demo purposes, we'll assume the token is a hash of userId_certificateId_timestamp
    // and we'll extract a user ID and certificate ID from it
    // In a real implementation, NEVER do this - use a proper database lookup instead
    
    // Get a test user ID based on hash value
    $userId = 3; // Default to trainee user (this should be looked up from a tokens table)
    
    // Get a certificate ID to show (this would be looked up in a real implementation)
    // For demo, we'll extract a simple hash
    $certificateId = hexdec(substr($shareToken, 0, 8)) % 10; // Just getting a number 0-9
    if ($certificateId === 0) $certificateId = 1; // Ensure at least ID 1
    
    // Check if this is a program completion certificate 
    $programQuery = "
    SELECT p.id, p.title, pe.completion_status, pe.enrollment_date, u.full_name
    FROM programs p
    JOIN program_enrollments pe ON p.id = pe.program_id
    JOIN users u ON pe.user_id = u.id
    WHERE pe.user_id = :userId AND p.id = :programId
    AND pe.completion_status = 'completed'
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
            'created_at' => $program['enrollment_date'], // Using enrollment date as issue date
            'status' => 'active',
            'expiry_date' => date('Y-m-d H:i:s', strtotime($program['enrollment_date'] . ' + 1 year')), // 1 year from enrollment
            'program_id' => $program['id'],
            'program_title' => $program['title']
        ];
        
        http_response_code(200);
        echo json_encode([
            'certificate' => $certificate,
            'recipient' => $program['full_name']
        ]);
        exit;
    }
    
    // If not a program completion certificate, check records table
    $recordQuery = "
    SELECT r.id, r.record_type, r.category, r.description, r.file_path, r.created_at,
           'active' as status, DATE_ADD(r.created_at, INTERVAL 1 YEAR) as expiry_date,
           COALESCE(p.id, 0) as program_id, COALESCE(p.title, 'Unknown Program') as program_title,
           u.full_name as recipient
    FROM records r
    LEFT JOIN (
        SELECT id, title FROM programs
    ) p ON r.description LIKE CONCAT('%', p.title, '%')
    JOIN users u ON r.user_id = u.id
    WHERE r.user_id = :userId
    AND r.record_type = 'training'
    AND r.category = 'certificates'
    LIMIT 1
    ";
    
    $recordStmt = $pdo->prepare($recordQuery);
    $recordStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $recordStmt->execute();
    $result = $recordStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        throw new Exception('Certificate not found');
    }
    
    $certificate = [
        'id' => $result['id'],
        'record_type' => $result['record_type'],
        'category' => $result['category'],
        'description' => $result['description'],
        'file_path' => $result['file_path'],
        'created_at' => $result['created_at'],
        'status' => $result['status'],
        'expiry_date' => $result['expiry_date'],
        'program_id' => $result['program_id'],
        'program_title' => $result['program_title']
    ];
    
    $recipient = $result['recipient'];
    
    http_response_code(200);
    echo json_encode([
        'certificate' => $certificate,
        'recipient' => $recipient
    ]);

} catch (PDOException $e) {
    error_log('Error in shared_certificate.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
} catch (Exception $e) {
    error_log('Error in shared_certificate.php: ' . $e->getMessage());
    http_response_code(404);
    echo json_encode(['error' => 'This share link is invalid or has expired']);
}
?>