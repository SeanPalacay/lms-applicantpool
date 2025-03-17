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

    // In a real system, parse the token to get user ID
    // For this example, we'll use a hard-coded ID
    $userId = 4; // Hard-coded for example; should be extracted from token
    
    // Get query parameters
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $limit = min($limit, 50); // Cap limit to 50 items max
    
    // Get user activity
    $query = "
        SELECT id, activity_type, activity_time, details
        FROM user_activity 
        WHERE user_id = ? 
        ORDER BY activity_time DESC
        LIMIT ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId, $limit]);
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