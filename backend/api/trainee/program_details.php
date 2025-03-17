<?php
// lms-forbes/backend/api/trainee/program_details.php
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

// Check for program ID
if (!isset($_GET['programId']) || !is_numeric($_GET['programId'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Program ID is required']);
    exit;
}
$programId = (int)$_GET['programId'];

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

    // Check if the user is enrolled in the program
    $enrollmentQuery = "
        SELECT pe.id, pe.enrollment_date, pe.completion_status, pe.completion_percentage
        FROM program_enrollments pe
        WHERE pe.user_id = :userId AND pe.program_id = :programId
    ";
    
    $stmt = $pdo->prepare($enrollmentQuery);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $enrollment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$enrollment) {
        http_response_code(403);
        echo json_encode(['error' => 'You are not enrolled in this program']);
        exit;
    }
    
    // Get program details
    $query = "
        SELECT p.id, p.title, p.description, p.type, p.created_at
        FROM programs p
        WHERE p.id = :programId
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $program = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$program) {
        http_response_code(404);
        echo json_encode(['error' => 'Program not found']);
        exit;
    }
    
    // Merge program and enrollment data
    $programData = array_merge($program, $enrollment);
    
    // Get active quizzes for the program
    $quizzesQuery = "
        SELECT COUNT(*) as total_quizzes
        FROM quizzes
        WHERE program_id = :programId AND status = 'active'
    ";
    
    $stmt = $pdo->prepare($quizzesQuery);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $quizCount = $stmt->fetch(PDO::FETCH_ASSOC);
    $programData['total_quizzes'] = $quizCount['total_quizzes'];
    
    // Get completed quizzes for the user
    $completedQuizzesQuery = "
        SELECT COUNT(DISTINCT qa.quiz_id) as completed_quizzes
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE q.program_id = :programId 
        AND qa.user_id = :userId 
        AND qa.score >= q.passing_score
    ";
    
    $stmt = $pdo->prepare($completedQuizzesQuery);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $completedCount = $stmt->fetch(PDO::FETCH_ASSOC);
    $programData['completed_quizzes'] = $completedCount['completed_quizzes'];
    
    // Get milestones count
    $milestonesQuery = "
        SELECT COUNT(*) as total_milestones
        FROM milestones
        WHERE program_id = :programId
    ";
    
    $stmt = $pdo->prepare($milestonesQuery);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $milestoneCount = $stmt->fetch(PDO::FETCH_ASSOC);
    $programData['total_milestones'] = $milestoneCount['total_milestones'];
    
    // Get completed milestones for the user
    $completedMilestonesQuery = "
        SELECT COUNT(*) as completed_milestones
        FROM milestone_progress mp
        JOIN milestones m ON mp.milestone_id = m.id
        WHERE m.program_id = :programId 
        AND mp.user_id = :userId 
        AND mp.status = 'completed'
    ";
    
    $stmt = $pdo->prepare($completedMilestonesQuery);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $completedMilestones = $stmt->fetch(PDO::FETCH_ASSOC);
    $programData['completed_milestones'] = $completedMilestones['completed_milestones'];
    
    // Get the trainer information
    $trainerQuery = "
        SELECT u.id, u.full_name, u.email
        FROM users u
        WHERE u.id = :createdBy AND u.role = 'trainer'
    ";
    
    $stmt = $pdo->prepare($trainerQuery);
    $stmt->bindParam(':createdBy', $program['created_by'], PDO::PARAM_INT);
    $stmt->execute();
    $trainer = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($trainer) {
        $programData['trainer'] = [
            'id' => $trainer['id'],
            'name' => $trainer['full_name'],
            'email' => $trainer['email']
        ];
    }
    
    http_response_code(200);
    echo json_encode($programData);

} catch (PDOException $e) {
    error_log('Error in program_details.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
    error_log('Error in program_details.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while fetching program details']);
}
?>