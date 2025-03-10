<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection and authentication
require_once __DIR__ . '/../../config/db_config.php';
require_once __DIR__ . '/../../shared/auth.php';

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Only GET method is allowed']);
    exit;
}

try {
    // Initialize Auth class
    $auth = new Auth($pdo);
    
    // Check if user is logged in and has admin role
    if (!$auth->isLoggedIn()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    
    // Verify user has admin role
    if (!$auth->hasRole('administrator')) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied. Administrator privileges required.']);
        exit;
    }
    
    // Initialize response with default values
    $response = [
        'activeUsers' => 0,
        'totalUsers' => 0,
        'usersByRole' => [
            'administrator' => 0,
            'trainer' => 0,
            'trainee' => 0,
            'applicant' => 0
        ],
        'activePrograms' => 0,
        'totalPrograms' => 0,
        'totalQuizzes' => 0,
        'pendingApplicants' => 0,
        'shortlistedApplicants' => 0,
        'hiredApplicants' => 0,
        'rejectedApplicants' => 0,
        'totalApplicants' => 0,
        'recentBackups' => [],
        'recentActivity' => [],
        'inactiveUsers' => 0,
        'lastBackupDays' => null,
        'lastBackupStatus' => null,
        'alerts' => []
    ];
    
    // Get active and total users count
    $userQuery = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
                  FROM users";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute();
    $userStats = $userStmt->fetch();
    
    $response['totalUsers'] = (int)$userStats['total'];
    $response['activeUsers'] = (int)$userStats['active'];
    $response['inactiveUsers'] = (int)$userStats['inactive'];
    
    // Get users by role
    $roleQuery = "SELECT 
                    role, 
                    COUNT(*) as count 
                  FROM users 
                  GROUP BY role";
    $roleStmt = $pdo->prepare($roleQuery);
    $roleStmt->execute();
    
    $usersByRole = [
        'administrator' => 0,
        'trainer' => 0,
        'trainee' => 0,
        'applicant' => 0
    ];
    
    while ($role = $roleStmt->fetch()) {
        $usersByRole[$role['role']] = (int)$role['count'];
    }
    
    $response['usersByRole'] = $usersByRole;
    
    // Get program statistics
    $programQuery = "SELECT 
                        COUNT(*) as total 
                     FROM programs";
    $programStmt = $pdo->prepare($programQuery);
    $programStmt->execute();
    $programStats = $programStmt->fetch();
    
    $response['totalPrograms'] = (int)$programStats['total'];
    
    // For active programs, we're going to consider programs that have at least one active enrollment
    $activeProgramsQuery = "SELECT 
                                COUNT(DISTINCT p.id) as active 
                            FROM programs p
                            JOIN program_enrollments pe ON p.id = pe.program_id
                            WHERE pe.completion_status IN ('in_progress', 'not_started')";
    $activeProgramsStmt = $pdo->prepare($activeProgramsQuery);
    $activeProgramsStmt->execute();
    $activeProgramsStats = $activeProgramsStmt->fetch();
    
    $response['activePrograms'] = (int)$activeProgramsStats['active'];
    
    // Get quiz count
    $quizQuery = "SELECT COUNT(*) as total FROM quizzes";
    $quizStmt = $pdo->prepare($quizQuery);
    $quizStmt->execute();
    $quizStats = $quizStmt->fetch();
    
    $response['totalQuizzes'] = (int)$quizStats['total'];
    
    // Get applicant statistics
    $applicantQuery = "SELECT 
                           COUNT(*) as total,
                           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                           SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
                           SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) as hired,
                           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                       FROM applicants";
    $applicantStmt = $pdo->prepare($applicantQuery);
    $applicantStmt->execute();
    $applicantStats = $applicantStmt->fetch();
    
    $response['totalApplicants'] = (int)$applicantStats['total'];
    $response['pendingApplicants'] = (int)$applicantStats['pending'];
    $response['shortlistedApplicants'] = (int)$applicantStats['shortlisted'];
    $response['hiredApplicants'] = (int)$applicantStats['hired'];
    $response['rejectedApplicants'] = (int)$applicantStats['rejected'];
    
    // Get recent applicants
    $recentApplicantsQuery = "SELECT 
                                a.id, 
                                a.full_name, 
                                a.job_role, 
                                a.department, 
                                a.status, 
                                a.applied_at
                              FROM applicants a
                              ORDER BY a.applied_at DESC
                              LIMIT 5";
    $recentApplicantsStmt = $pdo->prepare($recentApplicantsQuery);
    $recentApplicantsStmt->execute();
    
    $recentApplicants = [];
    while ($applicant = $recentApplicantsStmt->fetch()) {
        $recentApplicants[] = $applicant;
    }
    
    $response['recentApplicants'] = $recentApplicants;
    
    // Get recent backups
    $backupQuery = "SELECT 
                        id, 
                        backup_name, 
                        backup_type, 
                        created_at 
                    FROM backups 
                    ORDER BY created_at DESC 
                    LIMIT 5";
    $backupStmt = $pdo->prepare($backupQuery);
    $backupStmt->execute();
    
    $recentBackups = [];
    while ($backup = $backupStmt->fetch()) {
        $recentBackups[] = $backup;
    }
    
    $response['recentBackups'] = $recentBackups;
    
    // Get last backup date for system health
    if (count($recentBackups) > 0) {
        $lastBackupDate = new DateTime($recentBackups[0]['created_at']);
        $currentDate = new DateTime();
        $daysDiff = $currentDate->diff($lastBackupDate)->days;
        
        $response['lastBackupDays'] = $daysDiff;
        
        if ($daysDiff <= 1) {
            $response['lastBackupStatus'] = 'status-healthy';
        } else if ($daysDiff <= 7) {
            $response['lastBackupStatus'] = 'status-healthy';
        } else {
            $response['lastBackupStatus'] = 'status-warning';
        }
    }
    
    // Create a function to generate recent activity logs
    // In a real system, you would have an activity log table 
    // This is a simplified demonstration
    $recentActivity = [];
    
    // Get recent user activities
    $userActivityQuery = "SELECT 
                            'user' as type,
                            CONCAT(u.full_name, ' ', 
                                CASE 
                                    WHEN u.status = 'active' THEN 'logged in'
                                    ELSE 'account was deactivated'
                                END
                            ) as message,
                            u.last_login as timestamp
                          FROM users u
                          WHERE u.last_login IS NOT NULL
                          ORDER BY u.last_login DESC
                          LIMIT 3";
    $userActivityStmt = $pdo->prepare($userActivityQuery);
    $userActivityStmt->execute();
    
    while ($activity = $userActivityStmt->fetch()) {
        $recentActivity[] = $activity;
    }
    
    // Get recent quiz activities
    $quizActivityQuery = "SELECT 
                            'quiz' as type,
                            CONCAT(u.full_name, ' completed quiz: ', q.title) as message,
                            qa.attempt_date as timestamp
                          FROM quiz_attempts qa
                          JOIN users u ON qa.user_id = u.id
                          JOIN quizzes q ON qa.quiz_id = q.id
                          ORDER BY qa.attempt_date DESC
                          LIMIT 3";
    $quizActivityStmt = $pdo->prepare($quizActivityQuery);
    $quizActivityStmt->execute();
    
    while ($activity = $quizActivityStmt->fetch()) {
        $recentActivity[] = $activity;
    }
    
    // Get recent program activities
    $programActivityQuery = "SELECT 
                                'program' as type,
                                CONCAT(u.full_name, ' enrolled in program: ', p.title) as message,
                                pe.enrollment_date as timestamp
                             FROM program_enrollments pe
                             JOIN users u ON pe.user_id = u.id
                             JOIN programs p ON pe.program_id = p.id
                             ORDER BY pe.enrollment_date DESC
                             LIMIT 3";
    $programActivityStmt = $pdo->prepare($programActivityQuery);
    $programActivityStmt->execute();
    
    while ($activity = $programActivityStmt->fetch()) {
        $recentActivity[] = $activity;
    }
    
    // Get recent applicant activities
    $applicantActivityQuery = "SELECT 
                                'applicant' as type,
                                CONCAT(a.full_name, ' application status changed to: ', a.status) as message,
                                a.applied_at as timestamp
                               FROM applicants a
                               ORDER BY a.applied_at DESC
                               LIMIT 3";
    $applicantActivityStmt = $pdo->prepare($applicantActivityQuery);
    $applicantActivityStmt->execute();
    
    while ($activity = $applicantActivityStmt->fetch()) {
        $recentActivity[] = $activity;
    }
    
    // Get recent backup activities
    $backupActivityQuery = "SELECT 
                                'system' as type,
                                CONCAT('System backup created: ', backup_name) as message,
                                created_at as timestamp
                            FROM backups
                            ORDER BY created_at DESC
                            LIMIT 2";
    $backupActivityStmt = $pdo->prepare($backupActivityQuery);
    $backupActivityStmt->execute();
    
    while ($activity = $backupActivityStmt->fetch()) {
        $recentActivity[] = $activity;
    }
    
    // Sort activities by timestamp
    usort($recentActivity, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    // Limit to 10 most recent activities
    $recentActivity = array_slice($recentActivity, 0, 10);
    
    $response['recentActivity'] = $recentActivity;
    
    // Generate sample program activity data for the chart
    // In a real system, this would come from actual data
    $programActivity = [];
    $currentDate = new DateTime();
    
    // Generate data for the last 7 days
    for ($i = 6; $i >= 0; $i--) {
        $date = clone $currentDate;
        $date->modify("-$i days");
        
        // Generate some sample data - in a real system, you would query from database
        $enrollments = rand(3, 15);
        $completions = rand(0, $enrollments);
        
        $programActivity[] = [
            'date' => $date->format('Y-m-d'),
            'enrollments' => $enrollments,
            'completions' => $completions
        ];
    }
    
    $response['programActivity'] = $programActivity;
    
    // Generate alerts for the admin dashboard
    $alerts = [];
    
    // Check for users with no activity in the last 30 days
    $inactiveUsersQuery = "SELECT COUNT(*) as count 
                           FROM users 
                           WHERE status = 'active' 
                           AND last_login < DATE_SUB(NOW(), INTERVAL 30 DAY)";
    $inactiveUsersStmt = $pdo->prepare($inactiveUsersQuery);
    $inactiveUsersStmt->execute();
    $inactiveUsers = $inactiveUsersStmt->fetch();
    
    if ($inactiveUsers['count'] > 0) {
        $alerts[] = [
            'type' => 'info',
            'title' => 'Inactive Users',
            'message' => $inactiveUsers['count'] . ' users have not logged in for over 30 days.',
            'actionLink' => '/admin/user-management?filter=inactive',
            'actionText' => 'View Users'
        ];
    }
    
    // Check if backup is needed (if last backup > 7 days)
    if (isset($response['lastBackupDays']) && $response['lastBackupDays'] > 7) {
        $alerts[] = [
            'type' => 'warning',
            'title' => 'Backup Needed',
            'message' => 'Your last system backup was ' . $response['lastBackupDays'] . ' days ago.',
            'actionLink' => '/admin/backups/create',
            'actionText' => 'Create Backup'
        ];
    }
    
    // Check for pending applicants
    if ($response['pendingApplicants'] > 0) {
        $alerts[] = [
            'type' => 'info',
            'title' => 'Pending Applicants',
            'message' => 'You have ' . $response['pendingApplicants'] . ' applicants waiting for review.',
            'actionLink' => '/admin/applicant-dashboard?filter=pending',
            'actionText' => 'Review Applicants'
        ];
    }
    
    // Hypothetical alert for upcoming maintenance
    $alerts[] = [
        'type' => 'warning',
        'title' => 'Scheduled Maintenance',
        'message' => 'System maintenance scheduled for tomorrow at 2:00 AM. The system will be unavailable for approximately 30 minutes.',
        'deadline' => date('Y-m-d', strtotime('+1 day'))
    ];
    
    // Hypothetical alert for new feature
    $alerts[] = [
        'type' => 'success',
        'title' => 'New Feature Available',
        'message' => 'You can now export quiz results in multiple formats including PDF and Excel.',
        'actionLink' => '/admin/help/new-features',
        'actionText' => 'Learn More'
    ];
    
    $response['alerts'] = $alerts;
    
    // Success response
    echo json_encode($response);
    
} catch (PDOException $e) {
    // Log error (in a real application)
    error_log("Dashboard API Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Log error (in a real application)
    error_log("Dashboard API Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}   