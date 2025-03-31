<?php
// File: lms-forbes/backend/api/trainer/trainee_grades.php

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
    error_log("trainee_grades.php called - " . date('Y-m-d H:i:s'));
    
    // Include dependencies
    require_once '../../shared/cors_middleware.php';
    require_once __DIR__ . '/../../config/db_config.php';

    // Get request parameters
    $traineeId = isset($_GET['trainee_id']) ? intval($_GET['trainee_id']) : 0;
    $programId = isset($_GET['program_id']) ? intval($_GET['program_id']) : null;
    
    error_log("trainee_id=$traineeId, program_id=" . ($programId ?? 'null'));

    // Get database connection
    global $pdo;
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }
    
    // Check if trainee exists
    $stmt = $pdo->prepare("SELECT id, full_name, email FROM users WHERE id = :traineeId AND role = 'trainee'");
    $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        throw new Exception("Trainee not found with ID: $traineeId");
    }
    
    $trainee = $stmt->fetch(PDO::FETCH_ASSOC);
    error_log("Found trainee: " . $trainee['full_name']);
    
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
    
    // Get quiz attempts
    $quizAttemptsQuery = "
        SELECT q.id as quiz_id, q.title, qa.id as attempt_id, qa.score, 
               qa.attempt_date, q.passing_score, q.program_id, p.title as program_title
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        LEFT JOIN programs p ON q.program_id = p.id
        WHERE qa.user_id = :traineeId
    ";
    
    $quizStmt = $pdo->prepare($quizAttemptsQuery);
    $quizStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
    
    if ($programId) {
        $quizAttemptsQuery = "
            SELECT q.id as quiz_id, q.title, qa.id as attempt_id, qa.score, 
                   qa.attempt_date, q.passing_score, q.program_id, p.title as program_title
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            LEFT JOIN programs p ON q.program_id = p.id
            WHERE qa.user_id = :traineeId AND q.program_id = :programId
            ORDER BY qa.attempt_date DESC
        ";
        
        $quizStmt = $pdo->prepare($quizAttemptsQuery);
        $quizStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
        $quizStmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    }
    
    $quizStmt->execute();
    
    $quizAttempts = [];
    while ($row = $quizStmt->fetch(PDO::FETCH_ASSOC)) {
        $quizAttempts[] = $row;
    }
    
    // Calculate quiz average
    $quizAvgQuery = "SELECT AVG(score) as avg_score FROM quiz_attempts WHERE user_id = :traineeId";
    $avgStmt = $pdo->prepare($quizAvgQuery);
    $avgStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
    
    if ($programId) {
        $quizAvgQuery = "
            SELECT AVG(qa.score) as avg_score 
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.user_id = :traineeId AND q.program_id = :programId
        ";
        $avgStmt = $pdo->prepare($quizAvgQuery);
        $avgStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
        $avgStmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    }
    
    $avgStmt->execute();
    $avgRow = $avgStmt->fetch(PDO::FETCH_ASSOC);
    $quizAverage = $avgRow['avg_score'] ? floatval($avgRow['avg_score']) : 0;
    
    // Get practical exams (check if table exists first)
    $tablesQuery = "SHOW TABLES LIKE 'practical_exam_attempts'";
    $tableStmt = $pdo->query($tablesQuery);
    $practicalExamsExist = $tableStmt && $tableStmt->rowCount() > 0;
    
    $practicalAverage = 0;
    $practicalAttempts = [];
    
    if ($practicalExamsExist) {
        $practicalQuery = "
            SELECT pe.id as exam_id, pe.title as exam_title, pea.id as attempt_id,
                   pea.score, pe.max_score, pea.submitted_at, pea.graded_at, pea.feedback,
                   pe.program_id, p.title as program_title, u.full_name as graded_by_name
            FROM practical_exam_attempts pea
            JOIN practical_exams pe ON pea.exam_id = pe.id
            LEFT JOIN programs p ON pe.program_id = p.id
            LEFT JOIN users u ON pea.graded_by = u.id
            WHERE pea.user_id = :traineeId
        ";
        
        $practicalStmt = $pdo->prepare($practicalQuery);
        $practicalStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
        
        if ($programId) {
            $practicalQuery = "
                SELECT pe.id as exam_id, pe.title as exam_title, pea.id as attempt_id,
                       pea.score, pe.max_score, pea.submitted_at, pea.graded_at, pea.feedback,
                       pe.program_id, p.title as program_title, u.full_name as graded_by_name
                FROM practical_exam_attempts pea
                JOIN practical_exams pe ON pea.exam_id = pe.id
                LEFT JOIN programs p ON pe.program_id = p.id
                LEFT JOIN users u ON pea.graded_by = u.id
                WHERE pea.user_id = :traineeId AND pe.program_id = :programId
                ORDER BY pea.submitted_at DESC
            ";
            
            $practicalStmt = $pdo->prepare($practicalQuery);
            $practicalStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
            $practicalStmt->bindParam(':programId', $programId, PDO::PARAM_INT);
        }
        
        $practicalStmt->execute();
        
        while ($row = $practicalStmt->fetch(PDO::FETCH_ASSOC)) {
            $practicalAttempts[] = $row;
        }
        
        // Calculate practical average
        $practicalAvgQuery = "
            SELECT AVG((pea.score / pe.max_score) * 100) as avg_score
            FROM practical_exam_attempts pea
            JOIN practical_exams pe ON pea.exam_id = pe.id
            WHERE pea.user_id = :traineeId AND pea.graded_at IS NOT NULL
        ";
        
        $practicalAvgStmt = $pdo->prepare($practicalAvgQuery);
        $practicalAvgStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
        
        if ($programId) {
            $practicalAvgQuery = "
                SELECT AVG((pea.score / pe.max_score) * 100) as avg_score
                FROM practical_exam_attempts pea
                JOIN practical_exams pe ON pea.exam_id = pe.id
                WHERE pea.user_id = :traineeId AND pea.graded_at IS NOT NULL AND pe.program_id = :programId
            ";
            
            $practicalAvgStmt = $pdo->prepare($practicalAvgQuery);
            $practicalAvgStmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
            $practicalAvgStmt->bindParam(':programId', $programId, PDO::PARAM_INT);
        }
        
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
    $passingGrade = floatval($gradeConfig['passing_grade']);
    
    // Prepare response
    $response = [
        'trainee' => $trainee,
        'grade_config' => [
            'quiz_weight' => $quizWeight,
            'practical_exam_weight' => $practicalWeight,
            'passing_grade' => $passingGrade
        ],
        'quiz_average' => $quizAverage,
        'practical_average' => $practicalAverage,
        'final_grade' => $finalGrade,
        'passed' => ($finalGrade >= $passingGrade),
        'quiz_attempts' => $quizAttempts,
        'practical_attempts' => $practicalAttempts,
        'components' => [
            'quiz_component' => $quizComponent,
            'practical_component' => $practicalComponent
        ]
    ];
    
    // End output buffering and discard any unexpected output
    ob_end_clean();
    
    // Return JSON
    echo json_encode($response);
    
} catch (Exception $e) {
    // Log the error
    error_log("Error in trainee_grades.php: " . $e->getMessage());
    
    // End output buffering and discard any unexpected output
    ob_end_clean();
    
    // Return error
    http_response_code(500);
    echo json_encode([
        'error' => 'Error retrieving grade data',
        'message' => $e->getMessage()
    ]);
}
?>