<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers
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

     // -- PARSE BASE64 TOKEN -- //
    // The token is assumed to be something like base64("4:1679999999"),
    // which decodes to "4:1679999999". Split on ":" to get the user/applicant ID.
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    $userId = isset($parts[0]) ? (int)$parts[0] : 0;
    
    // If still no ID, we bail
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token or no user ID found']);
        exit;
    }
    // Get query parameters
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $limit = min($limit, 50); // Cap limit to 50 items max
    
    // Use direct integer for LIMIT (avoid binding)
    $query = "
        SELECT id, activity_type, activity_time, details
        FROM user_activity 
        WHERE user_id = ?
        ORDER BY activity_time DESC
        LIMIT $limit
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    $activity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return the activity data
    echo json_encode($activity);
    
} catch (PDOException $e) {
    error_log("User Activity API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("User Activity API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
    exit;
}
?>