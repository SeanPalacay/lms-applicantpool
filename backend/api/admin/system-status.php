<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string (for testing)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// Simple token check (for demonstration)
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    $status = [
        'databaseStatus' => 'healthy', // Simulate status (could check actual DB health)
        'lastBackupDays' => null,
        'systemLoad' => 'normal' // Simulate load (could use system commands)
    ];

    // Calculate days since last backup
    $query = "SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $lastBackup = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($lastBackup) {
        $lastBackupDate = new DateTime($lastBackup['created_at']);
        $status['lastBackupDays'] = (new DateTime())->diff($lastBackupDate)->days;
    }

    header('Content-Type: application/json');
    echo json_encode($status);
} catch (PDOException $e) {
    error_log("System Status API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("System Status API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}