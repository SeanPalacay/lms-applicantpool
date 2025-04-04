<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// Optionally hide errors in production
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/php/logs/php_error_log');

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Grab Bearer token
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// Allow token also via GET ?token=...
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// If still no token, reject
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    if (!isset($pdo)) {
        throw new Exception('Database connection not established');
    }

    // Instead of JWT decode, parse base64 "<userId>:<timestamp>"
    // Example of $token => "MTA6MTc0MjI2NzgyMw==" => base64_decode => "10:1742267823"
    $decoded = base64_decode($token);
    // Safely split on colon
    $parts = explode(':', $decoded);
    $trainerId = isset($parts[0]) ? (int)$parts[0] : 0;

    // Fallback to session if no valid userId from token
    if (!$trainerId && isset($_SESSION['user_id'])) {
        $trainerId = (int) $_SESSION['user_id'];
    }

    // If still no userId, throw error
    if (!$trainerId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token format or missing user ID']);
        exit;
    }

    // Log trainer ID for debugging
    error_log("Trainer Dashboard API - Trainer ID: " . $trainerId);

    $response = [
        'user' => [
            'full_name' => '',
            'email'     => '',
            'role'      => 'trainer'
        ],
        'createdPrograms'   => [],     // Changed from assignedPrograms to match expected format
        'upcomingSessions'   => [],
        'traineesProgress'   => [],
        'pendingAssessments' => [],
        'notifications'      => [],
        'alerts'             => []
    ];

    // 1) Fetch Trainer User Info
    $userQuery = "
        SELECT full_name, email, role
        FROM users
        WHERE id = ? AND role = 'trainer'
        LIMIT 1
    ";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$trainerId]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        http_response_code(404);
        echo json_encode(['error' => 'No trainer found for this user']);
        exit;
    }
    $response['user'] = $userData;

    // 2) Fetch Programs created by this trainer
    $programsQuery = "
        SELECT 
            p.id,
            p.title,
            p.description,
            p.type,
            p.created_at,
            'active' AS status,
            (SELECT COUNT(DISTINCT pe.user_id) FROM program_enrollments pe WHERE pe.program_id = p.id) AS enrolled_trainees
        FROM programs p
        WHERE p.created_by = ?
        ORDER BY p.created_at DESC
    ";
    $programsStmt = $pdo->prepare($programsQuery);
    $programsStmt->execute([$trainerId]);
    $programs = $programsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Log count of programs found
    error_log("Trainer Dashboard API - Programs found: " . count($programs));
    
    $response['createdPrograms'] = $programs;
    $response['totalPrograms'] = count($programs);

    // 3) No direct sessions table exists, so let's create dummy data
    // In a real implementation, you would create and query a sessions table
    $response['upcomingSessions'] = [
        [
            'id' => 1,
            'title' => 'Program Orientation',
            'description' => 'Introduction to the training program',
            'session_date' => date('Y-m-d', strtotime('+2 days')),
            'start_time' => '09:00:00',
            'end_time' => '10:30:00',
            'program_title' => isset($programs[0]['title']) ? $programs[0]['title'] : 'N/A',
            'program_id' => isset($programs[0]['id']) ? $programs[0]['id'] : 0,
            'confirmed_attendees' => 5
        ]
    ];

    // 4) Trainees Progress Overview - Based on program_enrollments
    $progressQuery = "
        SELECT 
            u.id AS trainee_id,
            u.full_name AS trainee_name,
            p.id AS program_id,
            p.title AS program_title,
            pe.completion_percentage,
            pe.completion_status,
            (SELECT COUNT(*) FROM milestone_progress mp 
             JOIN milestones m ON mp.milestone_id = m.id
             WHERE mp.user_id = u.id 
             AND m.program_id = p.id 
             AND mp.status = 'completed') AS completed_milestones,
            (SELECT COUNT(*) FROM milestones 
             WHERE program_id = p.id) AS total_milestones
        FROM program_enrollments pe
        JOIN users u ON pe.user_id = u.id
        JOIN programs p ON pe.program_id = p.id
        WHERE p.created_by = ?
        ORDER BY p.title, pe.completion_percentage DESC
        LIMIT 20
    ";
    $progressStmt = $pdo->prepare($progressQuery);
    $progressStmt->execute([$trainerId]);
    $traineesProgress = $progressStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['traineesProgress'] = $traineesProgress;

    // 5) Created Quizzes
    $quizzesQuery = "
        SELECT 
            q.id,
            q.title,
            q.description,
            q.time_limit,
            q.passing_score,
            q.created_at,
            p.title AS program_title,
            p.id AS program_id
        FROM quizzes q
        JOIN programs p ON q.program_id = p.id
        WHERE p.created_by = ?
        ORDER BY q.created_at DESC
        LIMIT 5
    ";
    $quizzesStmt = $pdo->prepare($quizzesQuery);
    $quizzesStmt->execute([$trainerId]);
    $quizzes = $quizzesStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['createdQuizzes'] = $quizzes;

    // 6) Created Milestones
    $milestonesQuery = "
        SELECT 
            m.id,
            m.title,
            m.description,
            m.due_date,
            p.title AS program_title,
            p.id AS program_id
        FROM milestones m
        JOIN programs p ON m.program_id = p.id
        WHERE p.created_by = ?
        ORDER BY m.due_date ASC
        LIMIT 5
    ";
    $milestonesStmt = $pdo->prepare($milestonesQuery);
    $milestonesStmt->execute([$trainerId]);
    $milestones = $milestonesStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['createdMilestones'] = $milestones;

    // 7) Pending Assessments - Use practical_exam_attempts
    $assessmentsQuery = "
        SELECT 
            pea.id,
            pe.title,
            'practical_exam' AS type,
            pea.submitted_at AS submission_date,
            u.full_name AS trainee_name,
            u.id AS trainee_id,
            p.title AS program_title,
            p.id AS program_id
        FROM practical_exam_attempts pea
        JOIN practical_exams pe ON pea.exam_id = pe.id
        JOIN users u ON pea.user_id = u.id
        JOIN programs p ON pe.program_id = p.id
        WHERE p.created_by = ?
          AND pea.graded_at IS NULL
        ORDER BY pea.submitted_at ASC
        LIMIT 10
    ";
    $assessmentsStmt = $pdo->prepare($assessmentsQuery);
    $assessmentsStmt->execute([$trainerId]);
    $pendingAssessments = $assessmentsStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['pendingAssessments'] = $pendingAssessments;

    // 8) Notifications
    $notifQuery = "
        SELECT 
            id,
            type,
            title,
            message,
            created_at,
            read_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 5
    ";
    $notifStmt = $pdo->prepare($notifQuery);
    $notifStmt->execute([$trainerId]);
    $notifications = $notifStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['notifications'] = $notifications;

    // 9) Custom Alerts
    $alerts = [];

    // Alert for ungraded practical exams
    $ungradedExamsQuery = "
        SELECT 
            pe.title, 
            u.full_name AS trainee_name,
            DATEDIFF(CURRENT_DATE, pea.submitted_at) AS days_pending
        FROM practical_exam_attempts pea
        JOIN practical_exams pe ON pea.exam_id = pe.id
        JOIN users u ON pea.user_id = u.id
        JOIN programs p ON pe.program_id = p.id
        WHERE p.created_by = ?
          AND pea.graded_at IS NULL
          AND pea.submitted_at < DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY)
        ORDER BY pea.submitted_at ASC
        LIMIT 3
    ";
    $ungradedStmt = $pdo->prepare($ungradedExamsQuery);
    $ungradedStmt->execute([$trainerId]);
    $ungradedExams = $ungradedStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($ungradedExams as $exam) {
        $alerts[] = [
            'type'    => 'warning',
            'title'   => 'Ungraded Practical Exam',
            'message' => "Practical exam '{$exam['title']}' submitted by {$exam['trainee_name']} has been pending review for {$exam['days_pending']} days."
        ];
    }

    // Alert for trainees with low quiz scores
    $lowScoreQuery = "
        SELECT 
            u.full_name AS trainee_name,
            q.title AS quiz_title,
            qa.score,
            p.title AS program_title
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        JOIN users u ON qa.user_id = u.id
        JOIN programs p ON q.program_id = p.id
        WHERE p.created_by = ?
          AND qa.score < q.passing_score
          AND qa.attempt_date > DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
        ORDER BY qa.attempt_date DESC
        LIMIT 3
    ";
    $lowScoreStmt = $pdo->prepare($lowScoreQuery);
    $lowScoreStmt->execute([$trainerId]);
    $lowScores = $lowScoreStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($lowScores as $score) {
        $alerts[] = [
            'type'    => 'error',
            'title'   => 'Low Quiz Score',
            'message' => "Trainee {$score['trainee_name']} scored {$score['score']}% on '{$score['quiz_title']}' in the '{$score['program_title']}' program."
        ];
    }

    $response['alerts'] = $alerts;

    // Set active trainees count
    $response['activeTrainees'] = count($traineesProgress);

    // Send final JSON
    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Trainer Dashboard PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("Trainer Dashboard General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'General error: ' . $e->getMessage()]);
    exit;
}
?>