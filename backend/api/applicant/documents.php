<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers early
header('Content-Type: application/json');

// Optionally disable display_errors in production
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/php/logs/php_error_log'); // Adjust path or remove

require_once __DIR__ . '/../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Read Authorization header for Bearer token
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// Fallback: accept token in the query string (for testing only)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// If token is still empty, return 401
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    if (!isset($pdo)) {
        throw new Exception('Database connection not established');
    }

    // In a real system, parse the token to get user ID
    $userId = 4; // Hard-coded for example; replace with real token parsing
    
    // Check if application_id is provided
    if (!isset($_GET['application_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Application ID is required']);
        exit;
    }
    
    $applicationId = intval($_GET['application_id']);
    
    // First verify the application belongs to this user
    $appQuery = "SELECT id FROM applications WHERE id = ? AND user_id = ? LIMIT 1";
    $appStmt = $pdo->prepare($appQuery);
    $appStmt->execute([$applicationId, $userId]);
    
    if ($appStmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied to this application']);
        exit;
    }
    
    // Fetch documents related to this application
    $documentsQuery = "
        SELECT id, description, file_path, created_at
        FROM records 
        WHERE user_id = ? 
          AND record_type = 'applicant'
          AND category = 'evaluations'
        ORDER BY created_at DESC
    ";
    
    $documentsStmt = $pdo->prepare($documentsQuery);
    $documentsStmt->execute([$userId]);
    $documents = $documentsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return the documents
    echo json_encode($documents);

} catch (PDOException $e) {
    error_log("Application Documents API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("Application Documents API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
    exit;
}
?>