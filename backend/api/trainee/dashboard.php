<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    $response = [
        'user' => ['full_name' => ''],
        'enrolledPrograms' => [],
        'totalEnrolled' => 0,
        'completedPrograms' => 0,
        'averageScore' => 0,
        'upcomingQuizzes' => [],
        'pendingMilestones' => [],
        'alerts' => []
    ];

    $userId = 8; // Hardcoded for testing; replace with token validation later
    error_log("Starting dashboard fetch for user ID: $userId");

    // User Details
    $userQuery = "SELECT full_name FROM users WHERE id = ?";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        $response['user'] = $user;
    } else {
        error_log("No user found for ID: $userId");
    }

    // Enrolled Programs
    $programsQuery = "SELECT p.id, p.title, p.description, pe.completion_status, pe.completion_percentage 
                      FROM programs p
                      LEFT JOIN program_enrollments pe ON p.id = pe.program_id AND pe.user_id = ?
                      WHERE pe.user_id = ?";
    $programsStmt = $pdo->prepare($programsQuery);
    $programsStmt->execute([$userId, $userId]);
    $response['enrolledPrograms'] = $programsStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['totalEnrolled'] = count($response['enrolledPrograms']);
    error_log("Enrolled programs fetched: " . $response['totalEnrolled']);

    // Completed Programs
    $completedQuery = "SELECT COUNT(*) as completed
                       FROM program_enrollments
                       WHERE user_id = ? AND completion_status = 'completed'";
    $completedStmt = $pdo->prepare($completedQuery);
    $completedStmt->execute([$userId]);
    $completed = $completedStmt->fetch(PDO::FETCH_ASSOC);
    $response['completedPrograms'] = (int)$completed['completed'];
    error_log("Completed programs: " . $response['completedPrograms']);

    // Average Score
    $scoreQuery = "SELECT AVG(score) as average_score
                   FROM quiz_attempts
                   WHERE user_id = ?";
    $scoreStmt = $pdo->prepare($scoreQuery);
    $scoreStmt->execute([$userId]);
    $score = $scoreStmt->fetch(PDO::FETCH_ASSOC);
    $response['averageScore'] = round((float)($score['average_score'] ?? 0));
    error_log("Average score: " . $response['averageScore']);

    // Upcoming Quizzes (Using created_at, no due_date)
    $quizzesQuery = "SELECT q.id, q.title, q.time_limit, p.title as program_title, q.created_at
                     FROM quizzes q
                     JOIN programs p ON q.program_id = p.id
                     LEFT JOIN program_enrollments pe ON p.id = pe.program_id AND pe.user_id = ?
                     LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.user_id = ?
                     WHERE pe.user_id = ? AND qa.quiz_id IS NULL
                     ORDER BY q.created_at DESC
                     LIMIT 5";
    $quizzesStmt = $pdo->prepare($quizzesQuery);
    $quizzesStmt->execute([$userId, $userId, $userId]);
    $response['upcomingQuizzes'] = $quizzesStmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Upcoming quizzes fetched: " . count($response['upcomingQuizzes']));

    // Pending Milestones
    $milestonesQuery = "SELECT m.id, m.title, m.description, m.due_date, p.title as program_title
                        FROM milestones m
                        JOIN programs p ON m.program_id = p.id
                        LEFT JOIN program_enrollments pe ON p.id = pe.program_id AND pe.user_id = ?
                        LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = ? AND mp.status = 'completed'
                        WHERE pe.user_id = ? AND mp.milestone_id IS NULL
                        ORDER BY m.due_date ASC
                        LIMIT 5";
    $milestonesStmt = $pdo->prepare($milestonesQuery);
    $milestonesStmt->execute([$userId, $userId, $userId]);
    $response['pendingMilestones'] = $milestonesStmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Pending milestones fetched: " . count($response['pendingMilestones']));

    // Alerts (Only milestones since quizzes lack due_date)
    $alerts = [];
    $deadlinesQuery = "SELECT 'milestone' as type, m.id, m.title, m.due_date, p.title as program_title
                       FROM milestones m
                       JOIN programs p ON m.program_id = p.id
                       LEFT JOIN program_enrollments pe ON p.id = pe.program_id AND pe.user_id = ?
                       LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = ? AND mp.status = 'completed'
                       WHERE pe.user_id = ?
                         AND m.due_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
                         AND mp.milestone_id IS NULL
                       ORDER BY m.due_date ASC
                       LIMIT 5";
    $deadlinesStmt = $pdo->prepare($deadlinesQuery);
    $deadlinesStmt->execute([$userId, $userId, $userId]);
    while ($deadline = $deadlinesStmt->fetch(PDO::FETCH_ASSOC)) {
        $dueDate = new DateTime($deadline['due_date']);
        $today = new DateTime();
        $daysRemaining = $today->diff($dueDate)->days;
        $alertType = $daysRemaining <= 2 ? 'warning' : 'info';
        $alertMessage = "You have a milestone due soon in {$deadline['program_title']}";
        $actionLink = "/trainee/milestones/{$deadline['id']}";
        $alerts[] = [
            'type' => $alertType,
            'title' => $deadline['title'],
            'message' => $alertMessage,
            'dueDate' => $deadline['due_date'],
            'actionLink' => $actionLink,
            'actionText' => 'View'
        ];
    }
    $response['alerts'] = $alerts;
    error_log("Alerts generated: " . count($response['alerts']));

    header('Content-Type: application/json');
    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Trainee Dashboard PDO Error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Trainee Dashboard General Error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'General error: ' . $e->getMessage()]);
}