<?php
// lms-forbes/backend/api/trainee/milestone_details.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

list($userId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24-hour expiration)
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

// Verify user role
try {
    $query = "SELECT id, role FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    if ($user['role'] !== 'trainee' && $user['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    // Get milestone ID from query parameter
    $milestoneId = isset($_GET['milestoneId']) ? $_GET['milestoneId'] : '';
    if (empty($milestoneId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Milestone ID is required']);
        exit;
    }

    // Fetch milestone details
    $query = "
        SELECT 
            m.id, 
            m.title, 
            m.description, 
            m.due_date,
            m.program_id,
            p.title as program_title,
            mp.status,
            mp.completion_date,
            mp.id as progress_id
        FROM 
            milestones m
        JOIN 
            programs p ON m.program_id = p.id
        LEFT JOIN 
            milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = :userId
        WHERE 
            m.id = :milestoneId
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':milestoneId', $milestoneId, PDO::PARAM_INT);
    $stmt->execute();
    $milestone = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$milestone) {
        http_response_code(404);
        echo json_encode(['error' => 'Milestone not found']);
        exit;
    }

    // Verify trainee has access to this milestone's program
    $checkAccessQuery = "
        SELECT 1
        FROM program_enrollments
        WHERE program_id = :programId AND user_id = :userId
    ";
    $accessStmt = $pdo->prepare($checkAccessQuery);
    $accessStmt->bindParam(':programId', $milestone['program_id'], PDO::PARAM_INT);
    $accessStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $accessStmt->execute();
    
    if ($accessStmt->rowCount() === 0 && $user['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have access to this milestone']);
        exit;
    }

    // Get related quizzes for this milestone if any
    $quizzesQuery = "
        SELECT 
            q.id, 
            q.title, 
            q.description,
            q.time_limit
        FROM 
            quizzes q
        WHERE 
            q.program_id = :programId
    ";
    $quizzesStmt = $pdo->prepare($quizzesQuery);
    $quizzesStmt->bindParam(':programId', $milestone['program_id'], PDO::PARAM_INT);
    $quizzesStmt->execute();
    $quizzes = $quizzesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the response
    $response = [
        'id' => $milestone['id'],
        'title' => $milestone['title'],
        'description' => $milestone['description'],
        'due_date' => $milestone['due_date'],
        'program' => [
            'id' => $milestone['program_id'],
            'title' => $milestone['program_title']
        ],
        'progress' => [
            'id' => $milestone['progress_id'],
            'status' => $milestone['status'] ?? 'not_started',
            'completion_date' => $milestone['completion_date']
        ],
        'quizzes' => $quizzes
    ];
    
    http_response_code(200);
    echo json_encode($response);

} catch (PDOException $e) {
    error_log('Error in milestone_details.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
    error_log('Error in milestone_details.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while fetching milestone details']);
}
?>