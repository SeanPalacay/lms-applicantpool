<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set content type to JSON early
header('Content-Type: application/json');

// Log errors instead of displaying them
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/php/logs/php_error_log'); // Adjust path if needed

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
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    if (!isset($pdo)) {
        throw new Exception('Database connection not established');
    }

    $response = [
        'user' => ['full_name' => ''],
        'createdPrograms' => [],
        'totalPrograms' => 0,
        'activeTrainees' => 0,
        'createdQuizzes' => [],
        'createdMilestones' => [],
        'traineeProgress' => [],
        'alerts' => []
    ];

    $trainerId = 9; // Hardcoded for testing; replace with token validation later
    error_log("Starting trainer dashboard fetch for trainer ID: $trainerId");

    // User Details
    $userQuery = "SELECT full_name FROM users WHERE id = ?";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$trainerId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        $response['user'] = $user;
    } else {
        error_log("No trainer found for ID: $trainerId");
    }

    // Created Programs
    $programsQuery = "SELECT id, title, description, type, created_at 
                      FROM programs 
                      WHERE created_by = ?";
    $programsStmt = $pdo->prepare($programsQuery);
    $programsStmt->execute([$trainerId]);
    $response['createdPrograms'] = $programsStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['totalPrograms'] = count($response['createdPrograms']);
    error_log("Created programs fetched: " . $response['totalPrograms']);

    // Active Trainees
    $traineesQuery = "SELECT COUNT(DISTINCT pe.user_id) as active_trainees
                      FROM program_enrollments pe
                      JOIN programs p ON pe.program_id = p.id
                      WHERE p.created_by = ?";
    $traineesStmt = $pdo->prepare($traineesQuery);
    $traineesStmt->execute([$trainerId]);
    $trainees = $traineesStmt->fetch(PDO::FETCH_ASSOC);
    $response['activeTrainees'] = (int)$trainees['active_trainees'];
    error_log("Active trainees: " . $response['activeTrainees']);

    // Created Quizzes
    $quizzesQuery = "SELECT q.id, q.title, q.time_limit, p.title as program_title, q.created_at
                     FROM quizzes q
                     JOIN programs p ON q.program_id = p.id
                     WHERE q.created_by = ?
                     ORDER BY q.created_at DESC
                     LIMIT 5";
    $quizzesStmt = $pdo->prepare($quizzesQuery);
    $quizzesStmt->execute([$trainerId]);
    $response['createdQuizzes'] = $quizzesStmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Created quizzes fetched: " . count($response['createdQuizzes']));

    // Created Milestones
    $milestonesQuery = "SELECT m.id, m.title, m.due_date, p.title as program_title
                        FROM milestones m
                        JOIN programs p ON m.program_id = p.id
                        WHERE m.created_by = ?
                        ORDER BY m.due_date ASC
                        LIMIT 5";
    $milestonesStmt = $pdo->prepare($milestonesQuery);
    $milestonesStmt->execute([$trainerId]);
    $response['createdMilestones'] = $milestonesStmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Created milestones fetched: " . count($response['createdMilestones']));

    // Trainee Progress (Fixed: Ensure avg_completion is a number)
    $progressQuery = "SELECT p.title, 
                             COUNT(pe.user_id) as enrolled_count, 
                             COALESCE(AVG(pe.completion_percentage), 0) as avg_completion,
                             COUNT(qa.id) as quiz_attempts
                      FROM programs p
                      LEFT JOIN program_enrollments pe ON p.id = pe.program_id
                      LEFT JOIN quizzes q ON q.program_id = p.id
                      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
                      WHERE p.created_by = ?
                      GROUP BY p.id, p.title";
    $progressStmt = $pdo->prepare($progressQuery);
    $progressStmt->execute([$trainerId]);
    $progressData = $progressStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($progressData as &$prog) {
        $prog['avg_completion'] = (float)$prog['avg_completion']; // Cast to float
    }
    unset($prog);
    $response['traineeProgress'] = $progressData;
    error_log("Trainee progress fetched: " . count($response['traineeProgress']));

    // Alerts (Fixed: Include program_id)
    $alerts = [];
    $alertsQuery = "SELECT 'milestone' as type, m.id, m.title, m.due_date, p.id as program_id, p.title as program_title
                    FROM milestones m
                    JOIN programs p ON m.program_id = p.id
                    LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.status = 'completed'
                    WHERE m.created_by = ? 
                      AND m.due_date < CURRENT_DATE 
                      AND mp.id IS NULL
                    LIMIT 5";
    $alertsStmt = $pdo->prepare($alertsQuery);
    $alertsStmt->execute([$trainerId]);
    while ($alert = $alertsStmt->fetch(PDO::FETCH_ASSOC)) {
        $dueDate = new DateTime($alert['due_date']);
        $today = new DateTime();
        $daysOverdue = $today->diff($dueDate)->days;
        $alerts[] = [
            'type' => 'warning',
            'title' => $alert['title'],
            'message' => "Milestone overdue by $daysOverdue days in {$alert['program_title']}",
            'dueDate' => $alert['due_date'],
            'actionLink' => "/trainer/programs/{$alert['program_id']}/milestones/{$alert['id']}",
            'actionText' => 'View'
        ];
    }
    $response['alerts'] = $alerts;
    error_log("Alerts generated: " . count($response['alerts']));

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