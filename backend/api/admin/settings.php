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

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $query = "SELECT * FROM settings LIMIT 1";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$settings) {
                $settings = ['systemName' => 'LMS Forbes', 'maxUsers' => 1000, 'backupFrequency' => 7];
            }
            header('Content-Type: application/json');
            echo json_encode($settings);
            break;

        case 'PUT':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            $query = "INSERT INTO settings (system_name, max_users, backup_frequency) VALUES (:systemName, :maxUsers, :backupFrequency)
                      ON DUPLICATE KEY UPDATE system_name = :systemName, max_users = :maxUsers, backup_frequency = :backupFrequency";
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                ':systemName' => $data['systemName'] ?? 'LMS Forbes',
                ':maxUsers' => $data['maxUsers'] ?? 1000,
                ':backupFrequency' => $data['backupFrequency'] ?? 7
            ]);

            header('Content-Type: application/json');
            echo json_encode(['message' => 'Settings updated successfully']);
            break;

        default:
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    error_log("Settings API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage']);
} catch (Exception $e) {
    error_log("Settings API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage']);
}