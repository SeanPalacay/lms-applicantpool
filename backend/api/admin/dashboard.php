<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CORS middleware (adjust the path for your project)
require_once '../../shared/cors_middleware.php';

// Include database connection (adjust the path for your project)
require_once __DIR__ . '/../../config/db_config.php';

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string (optional for testing)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// Simple token check (for demonstration). In production, validate properly (JWT, etc.)
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required', 'headers' => $headers]);
    exit;
}

try {
    // Initialize a response array with default structure
    $response = [
        'activeUsers'       => 0,
        'totalUsers'        => 0,
        'inactiveUsers'     => 0,
        'usersByRole'       => [
            'administrator' => 0,
            'trainer'       => 0,
            'trainee'       => 0,
            'applicant'     => 0,
        ],
        'activePrograms'    => 0,
        'totalPrograms'     => 0,
        'totalQuizzes'      => 0,
        'pendingApplicants' => 0,
        'shortlistedApplicants' => 0,
        'hiredApplicants'   => 0,
        'rejectedApplicants'=> 0,
        'totalApplicants'   => 0,
        'recentBackups'     => [],
        'recentActivity'    => [],
        'programActivity'   => [],
        'recentApplicants'  => [],
        'lastBackupDays'    => null,
        'lastBackupStatus'  => null,
        'alerts'            => []
    ];

    /*
     * 1. User Statistics
     */
    $userQuery = "
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive
        FROM users
    ";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute();
    $userStats = $userStmt->fetch();

    $response['totalUsers']    = (int)$userStats['total'];
    $response['activeUsers']   = (int)$userStats['active'];
    $response['inactiveUsers'] = (int)$userStats['inactive'];

    // Users by role
    $roleQuery = "
        SELECT role, COUNT(*) AS count
        FROM users
        GROUP BY role
    ";
    $roleStmt = $pdo->prepare($roleQuery);
    $roleStmt->execute();

    $usersByRole = [
        'administrator' => 0,
        'trainer'       => 0,
        'trainee'       => 0,
        'applicant'     => 0
    ];

    while ($row = $roleStmt->fetch()) {
        $r = $row['role'];
        if (isset($usersByRole[$r])) {
            $usersByRole[$r] = (int)$row['count'];
        }
    }
    $response['usersByRole'] = $usersByRole;

    /*
     * 2. Applicant (Application) Statistics
     *    We join applications with users, ensuring we only count where users.role='applicant'
     */
    $applicantQuery = "
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN a.status='pending' THEN 1 ELSE 0 END)      AS pending,
            SUM(CASE WHEN a.status='shortlisted' THEN 1 ELSE 0 END)  AS shortlisted,
            SUM(CASE WHEN a.status='hired' THEN 1 ELSE 0 END)        AS hired,
            SUM(CASE WHEN a.status='rejected' THEN 1 ELSE 0 END)     AS rejected
        FROM applications a
        INNER JOIN users u ON a.user_id = u.id
        WHERE u.role = 'applicant'
    ";
    $applicantStmt = $pdo->prepare($applicantQuery);
    $applicantStmt->execute();
    $appStats = $applicantStmt->fetch();

    $response['totalApplicants']       = (int)$appStats['total'];
    $response['pendingApplicants']     = (int)$appStats['pending'];
    $response['shortlistedApplicants'] = (int)$appStats['shortlisted'];
    $response['hiredApplicants']       = (int)$appStats['hired'];
    $response['rejectedApplicants']    = (int)$appStats['rejected'];

    /*
     * 3. Program Statistics
     */
    $programQuery = "
        SELECT COUNT(*) AS total
        FROM programs
    ";
    $programStmt = $pdo->prepare($programQuery);
    $programStmt->execute();
    $programStats = $programStmt->fetch();

    $response['totalPrograms']  = (int)$programStats['total'];
    // If you consider all programs are “active” by default:
    $response['activePrograms'] = (int)$programStats['total'];

    /*
     * 4. Quizzes Count
     */
    $quizQuery = "SELECT COUNT(*) AS total FROM quizzes";
    $quizStmt = $pdo->prepare($quizQuery);
    $quizStmt->execute();
    $quizStats = $quizStmt->fetch();
    $response['totalQuizzes'] = (int)$quizStats['total'];

    /*
     * 5. Program Activity (Last 7 days of enrollments + completions)
     */
    $programActivityQuery = "
        SELECT
            DATE(enrollment_date) AS date,
            COUNT(*) AS enrollments,
            SUM(CASE WHEN completion_status='completed' THEN 1 ELSE 0 END) AS completions
        FROM program_enrollments
        WHERE enrollment_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)
        GROUP BY DATE(enrollment_date)
        ORDER BY date ASC
    ";
    $programActivityStmt = $pdo->prepare($programActivityQuery);
    $programActivityStmt->execute();
    $rawActivity = $programActivityStmt->fetchAll();

    // Build a 7-day window (including days with zero enrollments)
    $activityData = [];
    $today = new DateTime();
    for ($i = 6; $i >= 0; $i--) {
        $day = clone $today;
        $day->modify("-$i days");
        $dayStr = $day->format('Y-m-d');

        $dayRow = [
            'date' => $dayStr,
            'enrollments' => 0,
            'completions' => 0
        ];

        foreach ($rawActivity as $ra) {
            if ($ra['date'] === $dayStr) {
                $dayRow['enrollments'] = (int)$ra['enrollments'];
                $dayRow['completions'] = (int)$ra['completions'];
                break;
            }
        }
        $activityData[] = $dayRow;
    }
    $response['programActivity'] = $activityData;

    /*
     * 6. Recent Backups
     */
    $backupQuery = "
        SELECT
            id,
            backup_name,
            backup_type,
            created_at
        FROM backups
        ORDER BY created_at DESC
        LIMIT 5
    ";
    $backupStmt = $pdo->prepare($backupQuery);
    $backupStmt->execute();
    $response['recentBackups'] = $backupStmt->fetchAll();

    // Days since last backup
    $lastBackupQuery = "
        SELECT created_at 
        FROM backups
        ORDER BY created_at DESC
        LIMIT 1
    ";
    $lastBackupStmt = $pdo->prepare($lastBackupQuery);
    $lastBackupStmt->execute();
    $lastBackup = $lastBackupStmt->fetch();

    if ($lastBackup) {
        $lastBackupDate = new DateTime($lastBackup['created_at']);
        $diffDays = (new DateTime())->diff($lastBackupDate)->days;
        $response['lastBackupDays']   = $diffDays;
        // For example, healthy if within 7 days, else warning
        $response['lastBackupStatus'] = ($diffDays <= 7) ? 'status-healthy' : 'status-warning';
    }

    /*
     * 7. Recent Applicants (limit 5) 
     *    Show the newest 'applicant' role users from applications
     */
    $recentApplicantsQuery = "
        SELECT
            a.id AS application_id,
            u.full_name,
            a.job_role,
            a.department,
            a.status,
            a.applied_at
        FROM applications a
        INNER JOIN users u ON a.user_id = u.id
        WHERE u.role = 'applicant'
        ORDER BY a.applied_at DESC
        LIMIT 5
    ";
    $recentApplicantsStmt = $pdo->prepare($recentApplicantsQuery);
    $recentApplicantsStmt->execute();
    $response['recentApplicants'] = $recentApplicantsStmt->fetchAll();

    /*
     * 8. Recent System Activity
     *    For demonstration: We'll list recent program enrollments
     */
    $recentActivityQuery = "
        SELECT
            'program' AS type,
            CONCAT(u.full_name, ' enrolled in ', p.title) AS message,
            pe.enrollment_date AS timestamp
        FROM program_enrollments pe
        JOIN users u ON pe.user_id = u.id
        JOIN programs p ON pe.program_id = p.id
        ORDER BY pe.enrollment_date DESC
        LIMIT 10
    ";
    $recentActivityStmt = $pdo->prepare($recentActivityQuery);
    $recentActivityStmt->execute();
    $response['recentActivity'] = $recentActivityStmt->fetchAll();

    /*
     * 9. Generate Alerts
     *    Example logic to highlight issues or info for the dashboard
     */
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

    // Alert for backup older than 7 days
    if (isset($response['lastBackupDays']) && $response['lastBackupDays'] > 7) {
        $alerts[] = [
            'type' => 'warning',
            'title' => 'Backup Needed',
            'message' => "It's been " . $response['lastBackupDays'] . " days since your last system backup.",
            'actionLink' => '/admin/backups/create',
            'actionText' => 'Create Backup'
        ];
    } elseif (!isset($response['lastBackupDays'])) {
        // No backups found at all
        $alerts[] = [
            'type' => 'warning',
            'title' => 'No Backups Found',
            'message' => 'No system backups have been found. Consider creating your first backup.',
            'actionLink' => '/admin/backups/create',
            'actionText' => 'Create Backup'
        ];
    }

    // Example feature announcement
    $alerts[] = [
        'type' => 'success',
        'title' => 'New Feature Available',
        'message' => 'You can now export quiz results in multiple formats.',
        'actionLink' => '/admin/help/new-features',
        'actionText' => 'Learn More'
    ];

    // Example scheduled maintenance notice
    $alerts[] = [
        'type' => 'warning',
        'title' => 'Scheduled Maintenance',
        'message' => 'System maintenance scheduled for tomorrow at 2:00 AM.',
        'deadline' => date('Y-m-d', strtotime('+1 day'))
    ];

    $response['alerts'] = $alerts;

    /*
     * 10. Return the final JSON response
     */
    header('Content-Type: application/json');
    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Dashboard API Error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Dashboard API Error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
