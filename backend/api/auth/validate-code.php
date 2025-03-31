<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// This endpoint doesn't require authentication since it's used for public validation

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get the input data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['code']) || empty($data['code'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Access code is required']);
        exit;
    }
    
    $code = $data['code'];
    
    // Check if the code exists and is not expired
    $query = "
        SELECT 
            ac.id, ac.user_id, ac.code, ac.created_at, ac.expires_at,
            u.username, u.full_name, u.email, u.role, u.status
        FROM 
            access_codes ac
        JOIN 
            users u ON ac.user_id = u.id
        WHERE 
            ac.code = :code
            AND (ac.expires_at IS NULL OR ac.expires_at > NOW())
            AND u.status = 'active'
            AND u.role = 'applicant'
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':code', $code, PDO::PARAM_STR);
    $stmt->execute();
    
    $accessCode = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$accessCode) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['valid' => false, 'error' => 'Invalid or expired access code']);
        exit;
    }
    
    // Code is valid
    header('Content-Type: application/json');
    echo json_encode([
        'valid' => true,
        'user' => [
            'id' => $accessCode['user_id'],
            'username' => $accessCode['username'],
            'full_name' => $accessCode['full_name'],
            'email' => $accessCode['email']
        ]
    ]);
    
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
?>