<?php
// File: lms-forbes/backend/api/admin/trainee-pool-assignments.php

// Debug settings
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/error_log.txt');

// Start output buffering to catch any unexpected output
ob_start();

// Set proper headers
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Register shutdown function to handle fatal errors
function shutdownHandler() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Fatal PHP error occurred',
            'message' => $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ]);
    }
}
register_shutdown_function('shutdownHandler');

try {
    // Log request
    error_log("trainee-pool-assignments.php called - " . date('Y-m-d H:i:s'));

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

    // If no token in header, check if it's in the query string
    if (empty($token) && isset($_GET['token'])) {
        $token = $_GET['token'];
    }

    // Validate token
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }

    // Decode token to get user ID
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    $userId = isset($parts[0]) ? (int)$parts[0] : 0;

    // If no valid userId from token, fallback to session (if available)
    if (!$userId && isset($_SESSION['user_id'])) {
        $userId = (int) $_SESSION['user_id'];
    }

    // If still no userId, throw error
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token format or missing user ID']);
        exit;
    }

    // Check if user is an administrator
    $userQuery = "SELECT role FROM users WHERE id = ? LIMIT 1";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$userId]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData || $userData['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied. Admin privileges required.']);
        exit;
    }

    // Handle GET request
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch trainees by program
        $programId = isset($_GET['program_id']) ? intval($_GET['program_id']) : null;
        if (!$programId) {
            throw new Exception("Program ID is required");
        }
        getTraineesByProgram($pdo, $programId);
    } else {
        throw new Exception("Method not allowed");
    }

} catch (Exception $e) {
    // Log the error
    error_log("Error in trainee-pool-assignments.php: " . $e->getMessage());

    // End output buffering and discard any unexpected output
    ob_end_clean();

    // Return error
    http_response_code(500);
    echo json_encode([
        'error' => 'Error processing request',
        'message' => $e->getMessage()
    ]);
}

/**
 * Get all trainees enrolled in a specific program with their final grades
 */
function getTraineesByProgram($pdo, $programId) {
    // Fetch trainees enrolled in the program
    $query = "
        SELECT 
            u.id AS user_id,
            u.full_name,
            u.email,
            pe.enrollment_date,
            pe.completion_status,
            (SELECT COUNT(*) 
             FROM trainee_pools_trainees tpt 
             JOIN trainee_pools tp ON tpt.pool_id = tp.id 
             WHERE tpt.trainee_id = u.id 
             AND tp.program_id = :program_id) AS in_pool
        FROM 
            program_enrollments pe
        JOIN 
            users u ON pe.user_id = u.id
        WHERE 
            pe.program_id = :program_id
            AND u.role = 'trainee'
        ORDER BY 
            u.full_name ASC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':program_id', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get grade configuration
    $configQuery = "SELECT * FROM grade_configuration ORDER BY id DESC LIMIT 1";
    $configStmt = $pdo->query($configQuery);
    if (!$configStmt) {
        error_log("Failed to query grade_configuration: " . implode(', ', $pdo->errorInfo()));
        throw new Exception("Failed to query grade configuration");
    }
    $gradeConfig = $configStmt->fetch(PDO::FETCH_ASSOC);
    if (!$gradeConfig) {
        // Use default configuration
        $gradeConfig = [
            'quiz_weight' => 0.60,
            'practical_exam_weight' => 0.40,
            'passing_grade' => 70.00
        ];
    }

    // Calculate final grade for each trainee
    foreach ($trainees as &$trainee) {
        $traineeId = $trainee['user_id'];

        // Get quiz average
        $quizAvgQuery = "
            SELECT AVG(qa.score) as avg_score 
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.user_id = :traineeId AND q.program_id = :programId
        ";
        $avgStmt = $pdo->prepare($quizAvgQuery);
        $avgStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
        $avgStmt->bindParam(':programId', $programId, PDO::PARAM_INT);
        $avgStmt->execute();
        $avgRow = $avgStmt->fetch(PDO::FETCH_ASSOC);
        $quizAverage = $avgRow['avg_score'] ? floatval($avgRow['avg_score']) : 0;

        // Get practical exams average
        $practicalAverage = 0;
        $tablesQuery = "SHOW TABLES LIKE 'practical_exam_attempts'";
        $tableStmt = $pdo->query($tablesQuery);
        $practicalExamsExist = $tableStmt && $tableStmt->rowCount() > 0;

        if ($practicalExamsExist) {
            $practicalAvgQuery = "
                SELECT AVG((pea.score / pe.max_score) * 100) as avg_score
                FROM practical_exam_attempts pea
                JOIN practical_exams pe ON pea.exam_id = pe.id
                WHERE pea.user_id = :traineeId AND pea.graded_at IS NOT NULL AND pe.program_id = :programId
            ";
            $practicalAvgStmt = $pdo->prepare($practicalAvgQuery);
            $practicalAvgStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
            $practicalAvgStmt->bindParam(':programId', $programId, PDO::PARAM_INT);
            $practicalAvgStmt->execute();
            $practicalAvgRow = $practicalAvgStmt->fetch(PDO::FETCH_ASSOC);
            $practicalAverage = $practicalAvgRow['avg_score'] ? floatval($practicalAvgRow['avg_score']) : 0;
        }

        // Calculate final grade
        $quizWeight = floatval($gradeConfig['quiz_weight']);
        $practicalWeight = floatval($gradeConfig['practical_exam_weight']);
        $quizComponent = $quizAverage * $quizWeight;
        $practicalComponent = $practicalAverage * $practicalWeight;
        $finalGrade = $quizComponent + $practicalComponent;

        // Add final grade to trainee data
        $trainee['final_grade'] = $finalGrade;
        $trainee['passed'] = ($finalGrade >= floatval($gradeConfig['passing_grade']));
    }

    // End output buffering and discard any unexpected output
    ob_end_clean();

    // Return JSON
    echo json_encode($trainees);
}
?>