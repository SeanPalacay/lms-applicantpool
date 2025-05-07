<?php
// lms-forbes/backend/api/trainer/position_mappings.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Decode token (base64-encoded "userId:timestamp")
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}

list($trainerId, $timestamp) = explode(':', $decodedToken);

// Basic token validation
if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

// Verify trainer role
$query = "SELECT role FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $trainerId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] !== 'trainer') {
    http_response_code(403);
    echo json_encode(['error' => 'Permission denied']);
    exit;
}

$positionId = isset($_GET['positionId']) ? (int)$_GET['positionId'] : 0;
if ($positionId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid position ID']);
    exit;
}

try {
    // Fetch position-specific quizzes
    $query = "
        SELECT q.id, q.title 
        FROM quizzes q 
        JOIN position_quiz_relation pqr ON q.id = pqr.quiz_id 
        WHERE pqr.position_id = :position_id AND q.status = 'active'
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':position_id', $positionId, PDO::PARAM_INT);
    $stmt->execute();
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch position-specific programs
    $query = "
        SELECT p.id, p.title 
        FROM programs p 
        JOIN position_program_relation ppr ON p.id = ppr.program_id 
        WHERE ppr.position_id = :position_id
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':position_id', $positionId, PDO::PARAM_INT);
    $stmt->execute();
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'quizzes' => $quizzes,
        'programs' => $programs
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred: ' . $e->getMessage()]);
}
exit;
?>