<?php
// File: backend/api/admin/positions.php
// API endpoint for admin to fetch positions by department

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

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Only allow GET method
    if ($method !== 'GET') {
        header('Content-Type: application/json');
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    // Check if department is provided
    if (!isset($_GET['department']) || empty($_GET['department'])) {
        // Get all positions if no department is specified
        $query = "
            SELECT id, department, position_name as name, description
            FROM job_positions
            WHERE is_active = 1
            ORDER BY department, position_name
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
    } else {
        // Get positions for a specific department
        $department = $_GET['department'];
        
        $query = "
            SELECT id, department, position_name as name, description
            FROM job_positions
            WHERE department = :department AND is_active = 1
            ORDER BY position_name
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':department', $department, PDO::PARAM_STR);
        $stmt->execute();
    }
    
    $positions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the positions
    header('Content-Type: application/json');
    echo json_encode($positions);

} catch (PDOException $e) {
    // Database error
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Other errors
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
?>