<?php
// File: /lms-forbes/backend/api/admin/debug-dashboard.php
// Start session
session_start();

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// Set content type
header('Content-Type: application/json');

// Log session status
error_log("Debug dashboard - Session status: " . session_status());
error_log("Debug dashboard - Session data: " . print_r($_SESSION, true));

// Initialize response with default values
$response = [
    'activeUsers' => 5,
    'totalUsers' => 25,
    'usersByRole' => [
        'administrator' => 1,
        'trainer' => 2,
        'trainee' => 20,
        'applicant' => 2
    ],
    'activePrograms' => 3,
    'totalPrograms' => 5,
    'totalQuizzes' => 10,
    'pendingApplicants' => 2,
    'shortlistedApplicants' => 1,
    'hiredApplicants' => 1,
    'rejectedApplicants' => 0,
    'totalApplicants' => 4,
    'inactiveUsers' => 2,
    'lastBackupDays' => 3,
    'lastBackupStatus' => 'status-healthy',
    'session_debug' => [
        'session_id' => session_id(),
        'session_data' => $_SESSION,
        'cookies' => $_COOKIE
    ]
];

// Add mock data for charts and tables
$response['recentActivity'] = [
    [
        'type' => 'user',
        'message' => 'Admin logged in',
        'timestamp' => date('Y-m-d H:i:s', time() - 3600)
    ],
    [
        'type' => 'program',
        'message' => 'New program created: PHP Basics',
        'timestamp' => date('Y-m-d H:i:s', time() - 7200)
    ],
    [
        'type' => 'system',
        'message' => 'System backup completed',
        'timestamp' => date('Y-m-d H:i:s', time() - 86400)
    ]
];

$response['programActivity'] = [];
$currentDate = new DateTime();
for ($i = 6; $i >= 0; $i--) {
    $date = clone $currentDate;
    $date->modify("-$i days");
    
    $response['programActivity'][] = [
        'date' => $date->format('Y-m-d'),
        'enrollments' => rand(5, 15),
        'completions' => rand(2, 8)
    ];
}

$response['recentBackups'] = [
    [
        'id' => 1,
        'backup_name' => 'Automatic Backup',
        'backup_type' => 'full',
        'created_at' => date('Y-m-d H:i:s', time() - 259200) // 3 days ago
    ],
    [
        'id' => 2,
        'backup_name' => 'Manual Backup',
        'backup_type' => 'full',
        'created_at' => date('Y-m-d H:i:s', time() - 604800) // 7 days ago
    ]
];

$response['recentApplicants'] = [
    [
        'id' => 1,
        'full_name' => 'John Smith',
        'job_role' => 'Web Developer',
        'department' => 'IT',
        'status' => 'pending',
        'applied_at' => date('Y-m-d H:i:s', time() - 172800) // 2 days ago
    ],
    [
        'id' => 2,
        'full_name' => 'Jane Johnson',
        'job_role' => 'Course Designer',
        'department' => 'Education',
        'status' => 'shortlisted',
        'applied_at' => date('Y-m-d H:i:s', time() - 345600) // 4 days ago
    ]
];

$response['alerts'] = [
    [
        'type' => 'warning',
        'title' => 'Scheduled Maintenance',
        'message' => 'System maintenance scheduled for tomorrow at 2:00 AM.',
        'deadline' => date('Y-m-d', strtotime('+1 day'))
    ],
    [
        'type' => 'info',
        'title' => 'Inactive Users',
        'message' => '2 users have not logged in for over 30 days.',
        'actionLink' => '/admin/user-management?filter=inactive',
        'actionText' => 'View Users'
    ],
    [
        'type' => 'success',
        'title' => 'New Feature Available',
        'message' => 'You can now export quiz results in multiple formats.',
        'actionLink' => '/admin/help/new-features',
        'actionText' => 'Learn More'
    ]
];

// Output response
echo json_encode($response);