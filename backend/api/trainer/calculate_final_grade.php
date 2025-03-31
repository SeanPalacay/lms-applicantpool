<?php
// File: lms-forbes/backend/api/trainer/calculate_final_grade.php
header('Content-Type: application/json');
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Validate trainer authentication
$user = validateToken();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

// Check if user is a trainer
if ($user['role'] !== 'trainer' && $user['role'] !== 'administrator') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. Only trainers can access this resource.']);
    exit;
}

// Get database connection
$db = getDatabase();

// Get trainee ID and program ID from request
$traineeId = isset($_GET['trainee_id']) ? intval($_GET['trainee_id']) : null;
$programId = isset($_GET['program_id']) ? intval($_GET['program_id']) : null;

if (!$traineeId) {
    http_response_code(400);
    echo json_encode(['error' => 'Trainee ID is required']);
    exit;
}

try {
    // Get grade configuration
    $configStmt = $db->query("SELECT * FROM grade_configuration ORDER BY id DESC LIMIT 1");
    $gradeConfig = $configStmt->fetch_assoc();
    
    if (!$gradeConfig) {
        // If no configuration exists, use default weights
        $gradeConfig = [
            'quiz_weight' => 0.60,
            'practical_exam_weight' => 0.40,
            'passing_grade' => 70.00
        ];
    }
    
    // Calculate quiz average
    $quizQuery = "SELECT AVG(qa.score) as avg_score
                 FROM quiz_attempts qa
                 JOIN quizzes q ON qa.quiz_id = q.id
                 WHERE qa.user_id = ?";
    
    // Add program filter if specified
    if ($programId) {
        $quizQuery .= " AND q.program_id = ?";
        $quizStmt = $db->prepare($quizQuery);
        $quizStmt->bind_param("ii", $traineeId, $programId);
    } else {
        $quizStmt = $db->prepare($quizQuery);
        $quizStmt->bind_param("i", $traineeId);
    }
    
    $quizStmt->execute();
    $quizResult = $quizStmt->get_result()->fetch_assoc();
    $quizAverage = $quizResult['avg_score'] ? floatval($quizResult['avg_score']) : 0;
    
    // Calculate practical exam average
    $practicalQuery = "SELECT AVG((pea.score / pe.max_score) * 100) as avg_score
                     FROM practical_exam_attempts pea
                     JOIN practical_exams pe ON pea.exam_id = pe.id
                     WHERE pea.user_id = ? AND pea.graded_at IS NOT NULL";
    
    // Add program filter if specified
    if ($programId) {
        $practicalQuery .= " AND pe.program_id = ?";
        $practicalStmt = $db->prepare($practicalQuery);
        $practicalStmt->bind_param("ii", $traineeId, $programId);
    } else {
        $practicalStmt = $db->prepare($practicalQuery);
        $practicalStmt->bind_param("i", $traineeId);
    }
    
    $practicalStmt->execute();
    $practicalResult = $practicalStmt->get_result()->fetch_assoc();
    $practicalAverage = $practicalResult['avg_score'] ? floatval($practicalResult['avg_score']) : 0;
    
    // Calculate final grade
    $quizComponent = $quizAverage * $gradeConfig['quiz_weight'];
    $practicalComponent = $practicalAverage * $gradeConfig['practical_exam_weight'];
    $finalGrade = $quizComponent + $practicalComponent;
    
    // Prepare response
    $response = [
        'success' => true,
        'quiz_average' => $quizAverage,
        'practical_average' => $practicalAverage,
        'final_grade' => $finalGrade,
        'passing_grade' => floatval($gradeConfig['passing_grade']),
        'passed' => $finalGrade >= floatval($gradeConfig['passing_grade']),
        'grade_components' => [
            'quiz_component' => $quizComponent,
            'practical_component' => $practicalComponent
        ],
        'weights' => [
            'quiz_weight' => floatval($gradeConfig['quiz_weight']),
            'practical_exam_weight' => floatval($gradeConfig['practical_exam_weight'])
        ]
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>