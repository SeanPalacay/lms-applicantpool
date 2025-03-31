<?php
require_once '../../shared/cors_middleware.php'; // Sets CORS headers
require_once '../../config/db_config.php';    // Database connection ($pdo)

header('Content-Type: application/json');

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check authentication
$token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Get programId from query parameters
$programId = $_GET['programId'] ?? null;
if (!$programId) {
    http_response_code(400);
    echo json_encode(['error' => 'Program ID is required']);
    exit;
}

// Fetch unenrolled trainees
$query = "
    SELECT u.id, u.full_name, u.email 
    FROM users u 
    WHERE u.role = 'trainee' AND u.status = 'active' 
    AND u.id NOT IN (
        SELECT pe.user_id 
        FROM program_enrollments pe 
        WHERE pe.program_id = :programId
    )
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':programId', $programId);
$stmt->execute();
$trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Send response
http_response_code(200);
echo json_encode($trainees);
exit;
?>