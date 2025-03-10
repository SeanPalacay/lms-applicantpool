<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string (for testing)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// Verify token (simple verification for now)
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required', 'headers' => $headers]);
    exit;
}

// In a real application, you would validate the token more thoroughly
// For now, we'll just check if it exists and proceed

try {
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
        'programActivity' => [],
        'recentApplicants' => [],
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
        if (isset($usersByRole[$role['role']])) {
            $usersByRole[$role['role']] = (int)$role['count'];
        }
    }
    
    $response['usersByRole'] = $usersByRole;
    
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
    
    // Get programs statistics
    $programQuery = "SELECT COUNT(*) as total FROM programs";
    $programStmt = $pdo->prepare($programQuery);
    $programStmt->execute();
    $programStats = $programStmt->fetch();
    
    $response['totalPrograms'] = (int)$programStats['total'];
    $response['activePrograms'] = (int)$programStats['total']; // Assuming all programs are active
    
    // Get quiz count
    $quizQuery = "SELECT COUNT(*) as total FROM quizzes";
    $quizStmt = $pdo->prepare($quizQuery);
    $quizStmt->execute();
    $quizStats = $quizStmt->fetch();
    
    $response['totalQuizzes'] = (int)$quizStats['total'];
    
    // Get program activity (enrollments by date)
    $programActivityQuery = "SELECT 
                            DATE(enrollment_date) as date,
                            COUNT(*) as enrollments,
                            SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completions
                        FROM program_enrollments
                        WHERE enrollment_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)
                        GROUP BY DATE(enrollment_date)
                        ORDER BY date ASC";
    
    $programActivityStmt = $pdo->prepare($programActivityQuery);
    $programActivityStmt->execute();
    $programActivityResults = $programActivityStmt->fetchAll();
    
    // Create a complete 7-day series with real data
    $programActivity = [];
    $currentDate = new DateTime();
    
    for ($i = 6; $i >= 0; $i--) {
        $date = clone $currentDate;
        $date->modify("-$i days");
        $dateStr = $date->format('Y-m-d');
        
        // Default values
        $dayData = [
            'date' => $dateStr,
            'enrollments' => 0,
            'completions' => 0
        ];
        
        // Replace with actual data if available
        foreach ($programActivityResults as $result) {
            if ($result['date'] == $dateStr) {
                $dayData['enrollments'] = (int)$result['enrollments'];
                $dayData['completions'] = (int)$result['completions'];
                break;
            }
        }
        
        $programActivity[] = $dayData;
    }
    
    $response['programActivity'] = $programActivity;
    
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
    $response['recentBackups'] = $backupStmt->fetchAll();
    
    // Calculate last backup days
    $lastBackupQuery = "SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1";
    $lastBackupStmt = $pdo->prepare($lastBackupQuery);
    $lastBackupStmt->execute();
    $lastBackup = $lastBackupStmt->fetch();
    
    if ($lastBackup) {
        $lastBackupDate = new DateTime($lastBackup['created_at']);
        $today = new DateTime();
        $daysDiff = $today->diff($lastBackupDate)->days;
        
        $response['lastBackupDays'] = $daysDiff;
        $response['lastBackupStatus'] = ($daysDiff <= 7) ? 'status-healthy' : 'status-warning';
    }
    
    // Get recent applicants
    $recentApplicantsQuery = "SELECT 
                             id,
                             full_name,
                             job_role,
                             department,
                             status,
                             applied_at
                           FROM applicants
                           ORDER BY applied_at DESC
                           LIMIT 5";
    
    $recentApplicantsStmt = $pdo->prepare($recentApplicantsQuery);
    $recentApplicantsStmt->execute();
    $response['recentApplicants'] = $recentApplicantsStmt->fetchAll();
    
    // Get recent system activity (mimic with recent enrollments, could be expanded in future)
    $recentActivityQuery = "SELECT 
                          'program' as type,
                          CONCAT(u.full_name, ' enrolled in ', p.title) as message,
                          pe.enrollment_date as timestamp
                        FROM program_enrollments pe
                        JOIN users u ON pe.user_id = u.id
                        JOIN programs p ON pe.program_id = p.id
                        ORDER BY pe.enrollment_date DESC
                        LIMIT 10";
    
    $recentActivityStmt = $pdo->prepare($recentActivityQuery);
    $recentActivityStmt->execute();
    $response['recentActivity'] = $recentActivityStmt->fetchAll();
    
    // Generate alerts based on real data
    $alerts = [];
    
    // Alert for inactive users
    if ($response['inactiveUsers'] > 0) {
        $alerts[] = [
            'type' => 'info',
            'title' => 'Inactive Users',
            'message' => $response['inactiveUsers'] . ' users have not logged in for over 30 days.',
            'actionLink' => '/admin/user-management?filter=inactive',
            'actionText' => 'View Users'
        ];
    }
    
    // Alert for pending applicants
    if ($response['pendingApplicants'] > 0) {
        $alerts[] = [
            'type' => 'info',
            'title' => 'Pending Applications',
            'message' => 'You have ' . $response['pendingApplicants'] . ' pending applications to review.',
            'actionLink' => '/admin/applicant-dashboard',
            'actionText' => 'Review Applications'
        ];
    }
    
    // Alert for backup status
    if (isset($response['lastBackupDays']) && $response['lastBackupDays'] > 7) {
        $alerts[] = [
            'type' => 'warning',
            'title' => 'Backup Needed',
            'message' => 'It\'s been ' . $response['lastBackupDays'] . ' days since your last system backup.',
            'actionLink' => '/admin/backups/create',
            'actionText' => 'Create Backup'
        ];
    } elseif (!isset($response['lastBackupDays'])) {
        $alerts[] = [
            'type' => 'warning',
            'title' => 'No Backups Found',
            'message' => 'No system backups have been found. Consider creating your first backup.',
            'actionLink' => '/admin/backups/create',
            'actionText' => 'Create Backup'
        ];
    }
    
    // Example feature announcement (could be from a database in a production system)
    $alerts[] = [
        'type' => 'success',
        'title' => 'New Feature Available',
        'message' => 'You can now export quiz results in multiple formats.',
        'actionLink' => '/admin/help/new-features',
        'actionText' => 'Learn More'
    ];
    
    // Add scheduled maintenance alert if needed (could be based on settings table)
    $alerts[] = [
        'type' => 'warning',
        'title' => 'Scheduled Maintenance',
        'message' => 'System maintenance scheduled for tomorrow at 2:00 AM.',
        'deadline' => date('Y-m-d', strtotime('+1 day'))
    ];
    
    $response['alerts'] = $alerts;
    
    // Set content type and output response
    header('Content-Type: application/json');
    echo json_encode($response);
    
} catch (PDOException $e) {
    // Log error
    error_log("Dashboard API Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Log error
    error_log("Dashboard API Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}