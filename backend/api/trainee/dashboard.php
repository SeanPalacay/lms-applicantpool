<?php
// File: /lms-forbes/backend/api/trainee/dashboard.php

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// Get the token from Authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract the token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// Check if token exists
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// In a production system, you would validate the token here
// For now, we'll just accept any token and proceed

try {
    // Get the user ID from the token
    // In a real application, you would decode the token to get the user ID
    // For now, let's assume we have a fixed user ID for testing
    $userId = 8; // This should be the trainee's user ID

    // Initialize response with default values
    $response = [
        'enrolledPrograms' => [],
        'totalEnrolled' => 0,
        'completedPrograms' => 0,
        'averageScore' => 0,
        'upcomingQuizzes' => [],
        'pendingMilestones' => [],
        'alerts' => []
    ];
    
    // Get enrolled programs for the trainee
    $programsQuery = "SELECT 
                        p.id, 
                        p.title, 
                        p.description, 
                        pe.completion_status, 
                        pe.completion_percentage 
                      FROM programs p
                      JOIN program_enrollments pe ON p.id = pe.program_id
                      WHERE pe.user_id = ?
                      ORDER BY pe.enrollment_date DESC";
    $programsStmt = $pdo->prepare($programsQuery);
    $programsStmt->execute([$userId]);
    
    $enrolledPrograms = [];
    while ($program = $programsStmt->fetch()) {
        $enrolledPrograms[] = $program;
    }
    
    $response['enrolledPrograms'] = $enrolledPrograms;
    $response['totalEnrolled'] = count($enrolledPrograms);
    
    // Count completed programs
    $completedQuery = "SELECT COUNT(*) as completed
                      FROM program_enrollments
                      WHERE user_id = ? AND completion_status = 'completed'";
    $completedStmt = $pdo->prepare($completedQuery);
    $completedStmt->execute([$userId]);
    $completed = $completedStmt->fetch();
    
    $response['completedPrograms'] = (int)$completed['completed'];
    
    // Get average quiz score
    $scoreQuery = "SELECT AVG(score) as average_score
                  FROM quiz_attempts
                  WHERE user_id = ? AND status = 'completed'";
    $scoreStmt = $pdo->prepare($scoreQuery);
    $scoreStmt->execute([$userId]);
    $score = $scoreStmt->fetch();
    
    $response['averageScore'] = round((float)($score['average_score'] ?? 0));
    
    // Get upcoming quizzes
    $quizzesQuery = "SELECT 
                        q.id, 
                        q.title, 
                        q.time_limit, 
                        q.due_date,
                        p.title as program_title
                     FROM quizzes q
                     JOIN modules m ON q.module_id = m.id
                     JOIN programs p ON m.program_id = p.id
                     JOIN program_enrollments pe ON p.id = pe.program_id
                     WHERE pe.user_id = ?
                       AND q.id NOT IN (
                           SELECT quiz_id FROM quiz_attempts 
                           WHERE user_id = ? AND status = 'completed'
                       )
                     ORDER BY q.due_date ASC
                     LIMIT 5";
    $quizzesStmt = $pdo->prepare($quizzesQuery);
    $quizzesStmt->execute([$userId, $userId]);
    
    $upcomingQuizzes = [];
    while ($quiz = $quizzesStmt->fetch()) {
        $upcomingQuizzes[] = $quiz;
    }
    
    $response['upcomingQuizzes'] = $upcomingQuizzes;
    
    // Get pending milestones
    $milestonesQuery = "SELECT 
                            m.id, 
                            m.title, 
                            m.description, 
                            m.due_date,
                            p.title as program_title
                         FROM milestones m
                         JOIN program_milestones pm ON m.id = pm.milestone_id
                         JOIN programs p ON pm.program_id = p.id
                         JOIN program_enrollments pe ON p.id = pe.program_id
                         WHERE pe.user_id = ?
                           AND m.id NOT IN (
                               SELECT milestone_id FROM milestone_submissions 
                               WHERE user_id = ? AND status = 'approved'
                           )
                         ORDER BY m.due_date ASC
                         LIMIT 5";
    $milestonesStmt = $pdo->prepare($milestonesQuery);
    $milestonesStmt->execute([$userId, $userId]);
    
    $pendingMilestones = [];
    while ($milestone = $milestonesStmt->fetch()) {
        $pendingMilestones[] = $milestone;
    }
    
    $response['pendingMilestones'] = $pendingMilestones;
    
    // Generate alerts for the trainee dashboard
    $alerts = [];
    
    // Check for upcoming deadlines
    $deadlinesQuery = "SELECT 
                          'milestone' as type,
                          m.id,
                          m.title,
                          m.due_date,
                          p.title as program_title
                       FROM milestones m
                       JOIN program_milestones pm ON m.id = pm.milestone_id
                       JOIN programs p ON pm.program_id = p.id
                       JOIN program_enrollments pe ON p.id = pe.program_id
                       WHERE pe.user_id = ?
                         AND m.due_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
                         AND m.id NOT IN (
                             SELECT milestone_id FROM milestone_submissions 
                             WHERE user_id = ? AND status IN ('submitted', 'approved')
                         )
                       UNION
                       SELECT 
                          'quiz' as type,
                          q.id,
                          q.title,
                          q.due_date,
                          p.title as program_title
                       FROM quizzes q
                       JOIN modules m ON q.module_id = m.id
                       JOIN programs p ON m.program_id = p.id
                       JOIN program_enrollments pe ON p.id = pe.program_id
                       WHERE pe.user_id = ?
                         AND q.due_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
                         AND q.id NOT IN (
                             SELECT quiz_id FROM quiz_attempts 
                             WHERE user_id = ? AND status = 'completed'
                         )
                       ORDER BY due_date ASC
                       LIMIT 5";
    $deadlinesStmt = $pdo->prepare($deadlinesQuery);
    $deadlinesStmt->execute([$userId, $userId, $userId, $userId]);
    
    while ($deadline = $deadlinesStmt->fetch()) {
        $dueDate = new DateTime($deadline['due_date']);
        $today = new DateTime();
        $daysRemaining = $today->diff($dueDate)->days;
        
        $alertType = $daysRemaining <= 2 ? 'warning' : 'info';
        $alertMessage = $deadline['type'] === 'quiz' 
            ? "You have a quiz due soon in {$deadline['program_title']}" 
            : "You have a milestone submission due soon in {$deadline['program_title']}";
        
        $actionLink = $deadline['type'] === 'quiz' 
            ? "/trainee/quizzes/{$deadline['id']}" 
            : "/trainee/milestones/{$deadline['id']}";
        
        $actionText = $deadline['type'] === 'quiz' ? 'Take Quiz' : 'Submit Work';
        
        $alerts[] = [
            'type' => $alertType,
            'title' => $deadline['title'],
            'message' => $alertMessage,
            'dueDate' => $deadline['due_date'],
            'actionLink' => $actionLink,
            'actionText' => $actionText
        ];
    }
    
    // Check for new feedback 
    $feedbackQuery = "SELECT 
                        ms.id,
                        m.title,
                        mf.created_at,
                        p.title as program_title
                      FROM milestone_feedback mf
                      JOIN milestone_submissions ms ON mf.submission_id = ms.id
                      JOIN milestones m ON ms.milestone_id = m.id
                      JOIN program_milestones pm ON m.id = pm.milestone_id
                      JOIN programs p ON pm.program_id = p.id
                      WHERE ms.user_id = ? AND mf.read_status = 'unread'
                      ORDER BY mf.created_at DESC
                      LIMIT 3";
    $feedbackStmt = $pdo->prepare($feedbackQuery);
    $feedbackStmt->execute([$userId]);
    
    while ($feedback = $feedbackStmt->fetch()) {
        $alerts[] = [
            'type' => 'success',
            'title' => 'New Feedback Available',
            'message' => "You've received feedback on your submission for {$feedback['title']} in {$feedback['program_title']}",
            'actionLink' => "/trainee/submissions/{$feedback['id']}",
            'actionText' => 'View Feedback'
        ];
    }
    
    $response['alerts'] = $alerts;
    
    // Set content type and output response
    header('Content-Type: application/json');
    echo json_encode($response);
    
} catch (PDOException $e) {
    // Log error
    error_log("Trainee Dashboard API Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Log error
    error_log("Trainee Dashboard API Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}