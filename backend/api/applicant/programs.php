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

    // In a real system, parse the token or read $_SESSION to get user info
    // For now, we're just fetching all programs

    // Fetch all available programs
    $programsQuery = "
        SELECT 
            id,
            title,
            description,
            type,
            created_at
        FROM programs
        ORDER BY created_at DESC
    ";
    $programsStmt = $pdo->prepare($programsQuery);
    $programsStmt->execute();
    $programs = $programsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the programs as JSON
    echo json_encode($programs);

} catch (PDOException $e) {
    error_log("Programs API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("Programs API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
    exit;
}
?>