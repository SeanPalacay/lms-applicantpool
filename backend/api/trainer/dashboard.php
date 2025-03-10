<?php
// File: /lms-forbes/backend/api/trainer/dashboard.php

// Set headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Include necessary files
require_once "../../config/db_config.php";
require_once "../../shared/auth.php";

// Authenticate user and check authorization
$auth = new Auth($pdo);

if (!$auth->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if (!$auth->hasRole('trainer')) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Trainer access required']);
    exit;
}

try {
    // Get current user
    $currentUser = $auth->getCurrentUser();
    $trainerId = $currentUser['id'];

    // 1. Get programs created by this trainer
    $programStmt = $pdo->prepare("
        SELECT id, title, description, type, created_at
        FROM programs
        WHERE created_by = ?
        ORDER BY created_at DESC
    ");
    $programStmt->execute([$trainerId]);
    $programs = $programStmt->fetchAll(PDO::FETCH_ASSOC);
    $totalPrograms = count($programs);

    // 2. Get active programs with enrollment statistics
    $activePrograms = [];
    foreach ($programs as $program) {
        $enrollmentStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as enrolled_count,
                AVG(completion_percentage) as avg_completion
            FROM program_enrollments
            WHERE program_id = ?
        ");
        $enrollmentStmt->execute([$program['id']]);
        $enrollmentData = $enrollmentStmt->fetch(PDO::FETCH_ASSOC);

        if ($enrollmentData['enrolled_count'] > 0) {
            $activePrograms[] = [
                'id' => (int)$program['id'],
                'title' => $program['title'],
                'description' => $program['description'],
                'type' => $program['type'],
                'enrolled_count' => (int)$enrollmentData['enrolled_count'],
                'completion_rate' => round($enrollmentData['avg_completion'], 2),
            ];
        }
    }

    // 3. Get total trainees enrolled in trainer's programs
    $traineeStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT user_id) as total_trainees
        FROM program_enrollments
        WHERE program_id IN (
            SELECT id FROM programs WHERE created_by = ?
        )
    ");
    $traineeStmt->execute([$trainerId]);
    $traineeData = $traineeStmt->fetch(PDO::FETCH_ASSOC);
    $totalTrainees = (int)$traineeData['total_trainees'];

    // 4. Get pending quiz reviews
    $quizStmt = $pdo->prepare("
        SELECT COUNT(*) as pending_quizzes
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE q.created_by = ?
        AND qa.feedback IS NULL
    ");
    $quizStmt->execute([$trainerId]);
    $quizData = $quizStmt->fetch(PDO::FETCH_ASSOC);
    $pendingQuizzes = (int)$quizData['pending_quizzes'];

    // 5. Calculate overall progress
    $overallProgressStmt = $pdo->prepare("
        SELECT AVG(completion_percentage) as overall_progress
        FROM program_enrollments
        WHERE program_id IN (
            SELECT id FROM programs WHERE created_by = ?
        )
    ");
    $overallProgressStmt->execute([$trainerId]);
    $progressData = $overallProgressStmt->fetch(PDO::FETCH_ASSOC);
    $overallProgress = round($progressData['overall_progress'] ?? 0, 2);

    // 6. Get trainee performance data
    $performanceStmt = $pdo->prepare("
        SELECT 
            u.id,
            u.full_name,
            AVG(pe.completion_percentage) as progress,
            AVG(qa.score) as quiz_average,
            CASE 
                WHEN AVG(pe.completion_percentage) = 100 THEN 'Completed'
                WHEN AVG(pe.completion_percentage) > 50 THEN 'In Progress'
                ELSE 'Starting'
            END as status
        FROM users u
        JOIN program_enrollments pe ON u.id = pe.user_id
        LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
        WHERE pe.program_id IN (
            SELECT id FROM programs WHERE created_by = ?
        )
        GROUP BY u.id, u.full_name
        ORDER BY progress DESC
        LIMIT 10
    ");
    $performanceStmt->execute([$trainerId]);
    $traineePerformance = $performanceStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($traineePerformance as &$trainee) {
        $trainee['progress'] = round($trainee['progress'], 2);
        $trainee['quiz_average'] = round($trainee['quiz_average'] ?? 0, 2);
    }

    // Generate alerts
    $alerts = [];
    if ($pendingQuizzes > 0) {
        $alerts[] = [
            'type' => 'warning',
            'title' => 'Pending Quiz Reviews',
            'message' => "You have $pendingQuizzes quiz submissions awaiting review.",
            'actionLink' => '/trainer/quizzes/review',
            'actionText' => 'Review Quizzes',
        ];
    }

    $inactiveStmt = $pdo->prepare("
        SELECT COUNT(*) as inactive_count
        FROM program_enrollments
        WHERE program_id IN (
            SELECT id FROM programs WHERE created_by = ?
        )
        AND completion_status = 'not_started'
    ");
    $inactiveStmt->execute([$trainerId]);
    $inactiveData = $inactiveStmt->fetch(PDO::FETCH_ASSOC);
    $inactiveCount = (int)$inactiveData['inactive_count'];

    if ($inactiveCount > 0) {
        $alerts[] = [
            'type' => 'info',
            'title' => 'Inactive Trainees',
            'message' => "$inactiveCount trainees have not started their programs.",
            'actionLink' => '/trainer/trainees',
            'actionText' => 'View Trainees',
        ];
    }

    $lowCompletionStmt = $pdo->prepare("
        SELECT p.title, AVG(pe.completion_percentage) as avg_completion
        FROM programs p
        JOIN program_enrollments pe ON p.id = pe.program_id
        WHERE p.created_by = ?
        GROUP BY p.id, p.title
        HAVING AVG(pe.completion_percentage) < 30
    ");
    $lowCompletionStmt->execute([$trainerId]);
    $lowCompletionPrograms = $lowCompletionStmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($lowCompletionPrograms) > 0) {
        $programNames = array_column($lowCompletionPrograms, 'title');
        $programList = implode(', ', array_slice($programNames, 0, 2));
        if (count($programNames) > 2) {
            $programList .= ' and ' . (count($programNames) - 2) . ' more';
        }
        $alerts[] = [
            'type' => 'warning',
            'title' => 'Low Completion Rates',
            'message' => "Programs with low completion: $programList",
            'actionLink' => '/trainer/progress',
            'actionText' => 'View Progress',
        ];
    }

    // Response
    $response = [
        'activePrograms' => $activePrograms,
        'totalPrograms' => $totalPrograms,
        'totalTrainees' => $totalTrainees,
        'pendingQuizzes' => $pendingQuizzes,
        'overallProgress' => $overallProgress,
        'traineePerformance' => $traineePerformance,
        'alerts' => $alerts,
    ];

    http_response_code(200);
    echo json_encode($response);
} catch (Exception $e) {
    error_log("Trainer Dashboard API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage(),
    ]);
}
?>