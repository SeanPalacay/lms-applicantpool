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
    $traineeId = isset($parts[0]) ? (int)$parts[0] : 0;

    // Fallback to session if no valid userId from token
    if (!$traineeId && isset($_SESSION['user_id'])) {
        $traineeId = (int) $_SESSION['user_id'];
    }

    // If still no userId, throw error
    if (!$traineeId) {
        throw new Exception('User ID not found in token or session');
    }

    $response = [
        'user' => [
            'full_name' => '',
            'email'     => '',
            'role'      => 'trainee'
        ],
        'enrollments'    => [],
        'quizAttempts'   => [],
        'milestoneStatus'=> [],
        'notifications'  => [],
        'alerts'         => []
    ];

    // 1) Fetch Trainee User Info
    $userQuery = "
        SELECT full_name, email, role
        FROM users
        WHERE id = ? AND role = 'trainee'
        LIMIT 1
    ";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$traineeId]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        http_response_code(404);
        echo json_encode(['error' => 'No trainee found for this user']);
        exit;
    }
    $response['user'] = $userData;

    // 2) Fetch Enrollments
    $enrollQuery = "
    SELECT 
        pe.id,
        pe.program_id,
        p.title AS program_title,
        pe.enrollment_date,
        pe.completion_status,
        pe.completion_percentage
    FROM program_enrollments pe
    JOIN programs p ON p.id = pe.program_id
    WHERE pe.user_id = ?
    ORDER BY pe.enrollment_date DESC
";
$enrollStmt = $pdo->prepare($enrollQuery);
$enrollStmt->execute([$traineeId]);
$enrollments = $enrollStmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($enrollments as &$enrollment) {
    // Count total quizzes for the program
    $totalQuizzesQuery = "
        SELECT COUNT(*) 
        FROM quizzes 
        WHERE program_id = ? AND status = 'active'
    ";
    $totalQuizzesStmt = $pdo->prepare($totalQuizzesQuery);
    $totalQuizzesStmt->execute([$enrollment['program_id']]);
    $totalQuizzes = (int)$totalQuizzesStmt->fetchColumn();

    // Initialize completion percentage
    $completionPercentage = 0.00;

    if ($totalQuizzes > 0) {
        // Count completed quizzes (score >= passing_score)
        $completedQuizzesQuery = "
            SELECT COUNT(DISTINCT qa.quiz_id)
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.user_id = ? 
            AND q.program_id = ? 
            AND qa.score >= q.passing_score
        ";
        $completedQuizzesStmt = $pdo->prepare($completedQuizzesQuery);
        $completedQuizzesStmt->execute([$traineeId, $enrollment['program_id']]);
        $completedQuizzes = (int)$completedQuizzesStmt->fetchColumn();

        // Calculate completion percentage based on quizzes
        $completionPercentage = ($completedQuizzes / $totalQuizzes) * 100;
    }

    // Update the database
    $newStatus = $completionPercentage >= 100 ? 'completed' : ($completionPercentage > 0 ? 'in_progress' : 'not_started');
    $updatePercentageQuery = "
        UPDATE program_enrollments
        SET completion_percentage = ?, completion_status = ?
        WHERE id = ?
    ";
    $updateStmt = $pdo->prepare($updatePercentageQuery);
    $updateStmt->execute([$completionPercentage, $newStatus, $enrollment['id']]);

    // Update the response data
    $enrollment['completion_percentage'] = $completionPercentage;
    $enrollment['completion_status'] = $newStatus;
}
$response['enrollments'] = $enrollments;

    // 3) Fetch Quiz Attempts
    $quizQuery = "
        SELECT 
            qa.id,
            q.title AS quiz_title,
            qa.score,
            qa.attempt_date,
            qa.feedback
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.user_id = ?
        ORDER BY qa.attempt_date DESC
        LIMIT 5
    ";
    $quizStmt = $pdo->prepare($quizQuery);
    $quizStmt->execute([$traineeId]);
    $quizAttempts = $quizStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['quizAttempts'] = $quizAttempts;

    // 4) Milestone Progress
    $milestoneQuery = "
        SELECT 
            m.id AS milestone_id,
            m.title,
            m.due_date,
            mp.status,
            mp.completion_date,
            p.title AS program_title
        FROM milestone_progress mp
        JOIN milestones m ON mp.milestone_id = m.id
        JOIN programs p ON m.program_id = p.id
        WHERE mp.user_id = ?
        ORDER BY m.due_date ASC
        LIMIT 10
    ";
    $milestoneStmt = $pdo->prepare($milestoneQuery);
    $milestoneStmt->execute([$traineeId]);
    $milestones = $milestoneStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['milestoneStatus'] = $milestones;

    // 5) Notifications
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
    $notifStmt->execute([$traineeId]);
    $notifications = $notifStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['notifications'] = $notifications;

    // 6) Custom Alerts
    $alerts = [];

    // Example: Alert if any milestone is overdue
    $overdueMileQuery = "
        SELECT m.id, m.title, p.title AS program_title, 
               DATEDIFF(CURRENT_DATE, m.due_date) AS days_overdue
        FROM milestone_progress mp
        JOIN milestones m ON mp.milestone_id = m.id
        JOIN programs p ON m.program_id = p.id
        WHERE mp.user_id = ?
          AND mp.status != 'completed'
          AND m.due_date < CURRENT_DATE
        LIMIT 3
    ";
    $overdueStmt = $pdo->prepare($overdueMileQuery);
    $overdueStmt->execute([$traineeId]);
    $overdueMileRows = $overdueStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($overdueMileRows as $row) {
        $alerts[] = [
            'type'    => 'warning',
            'title'   => 'Overdue Milestone',
            'message' => "Milestone '{$row['title']}' in '{$row['program_title']}' is overdue by {$row['days_overdue']} days."
        ];
    }

    $response['alerts'] = $alerts;

    // Send final JSON
    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Trainee Dashboard PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("Trainee Dashboard General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'General error: ' . $e->getMessage()]);
    exit;
}


?>
