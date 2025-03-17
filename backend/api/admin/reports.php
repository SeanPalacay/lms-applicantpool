<?php
// api/admin/reports.php

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

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string (optional for testing)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// Token validation
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required', 'headers' => $headers]);
    exit;
}

// Process the request for reports data
try {
    // Get report type and date range from query parameters
    $reportType = isset($_GET['type']) ? $_GET['type'] : 'all';
    $dateRange = isset($_GET['range']) ? $_GET['range'] : 'month';
    $startDate = isset($_GET['start']) ? $_GET['start'] : null;
    $endDate = isset($_GET['end']) ? $_GET['end'] : null;

    // Generate date range SQL condition
    $dateRangeSQL = "";
    if ($startDate && $endDate) {
        // Custom date range
        $dateRangeSQL = " AND date_column BETWEEN '$startDate' AND '$endDate'";
    } else {
        // Predefined date ranges
        switch ($dateRange) {
            case 'week':
                $dateRangeSQL = " AND date_column >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 WEEK)";
                break;
            case 'month':
                $dateRangeSQL = " AND date_column >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)";
                break;
            case 'quarter':
                $dateRangeSQL = " AND date_column >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)";
                break;
            case 'year':
                $dateRangeSQL = " AND date_column >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)";
                break;
            default:
                $dateRangeSQL = ""; // Default to no date filter
        }
    }

    // Initialize a response array
    $response = [];

    // Process requested report types
    if ($reportType === 'all' || $reportType === 'enrollment') {
        // Get program enrollment data
        $response['enrollment'] = getProgramEnrollmentData($pdo, $dateRangeSQL, $startDate, $endDate);
    }

    if ($reportType === 'all' || $reportType === 'quiz') {
        // Get quiz performance data
        $response['quiz'] = getQuizPerformanceData($pdo, $dateRangeSQL, $startDate, $endDate);
    }

    if ($reportType === 'all' || $reportType === 'activity') {
        // Get user activity data
        $response['activity'] = getUserActivityData($pdo, $dateRangeSQL, $startDate, $endDate);
    }

    if ($reportType === 'all' || $reportType === 'applicants') {
        // Get applicant data
        $response['applicants'] = getApplicantData($pdo, $dateRangeSQL, $startDate, $endDate);
    }

    // Return the data as JSON
    header('Content-Type: application/json');
    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Reports API Error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Reports API Error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get program enrollment data
 * 
 * @param PDO $pdo Database connection
 * @param string $dateRangeSQL Date range SQL condition
 * @param string|null $startDate Custom start date
 * @param string|null $endDate Custom end date
 * @return array Enrollment data
 */
function getProgramEnrollmentData($pdo, $dateRangeSQL, $startDate, $endDate) {
    // Replace date_column with appropriate column name in your query
    $dateColumn = 'pe.enrollment_date';
    $dateFilter = str_replace('date_column', $dateColumn, $dateRangeSQL);
    
    // Query to get program enrollment data
    $query = "
        SELECT 
            p.id AS program_id,
            p.title AS program_name,
            p.type AS program_type,
            COUNT(pe.id) AS enrolled_count,
            SUM(CASE WHEN pe.completion_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN pe.completion_status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
            SUM(CASE WHEN pe.completion_status = 'not_started' THEN 1 ELSE 0 END) AS not_started_count,
            ROUND(AVG(pe.completion_percentage), 2) AS avg_completion
        FROM 
            programs p
        LEFT JOIN 
            program_enrollments pe ON p.id = pe.program_id
        WHERE 
            1=1
            $dateFilter
        GROUP BY 
            p.id, p.title, p.type
        ORDER BY 
            p.title
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate summary statistics
    $totalPrograms = count($programs);
    $totalEnrollments = 0;
    $totalCompleted = 0;
    $totalInProgress = 0;
    
    foreach ($programs as $program) {
        $totalEnrollments += $program['enrolled_count'];
        $totalCompleted += $program['completed_count'];
        $totalInProgress += $program['in_progress_count'];
    }
    
    $completionRate = $totalEnrollments > 0 ? round(($totalCompleted / $totalEnrollments) * 100, 2) : 0;
    
    // Format the response
    return [
        'programs' => $programs,
        'summary' => [
            'totalPrograms' => $totalPrograms,
            'totalEnrollments' => $totalEnrollments,
            'totalCompleted' => $totalCompleted,
            'totalInProgress' => $totalInProgress,
            'completionRate' => $completionRate
        ]
    ];
}

/**
 * Get quiz performance data
 * 
 * @param PDO $pdo Database connection
 * @param string $dateRangeSQL Date range SQL condition
 * @param string|null $startDate Custom start date
 * @param string|null $endDate Custom end date
 * @return array Quiz performance data
 */
function getQuizPerformanceData($pdo, $dateRangeSQL, $startDate, $endDate) {
    // Replace date_column with appropriate column name in your query
    $dateColumn = 'qa.attempt_date';
    $dateFilter = str_replace('date_column', $dateColumn, $dateRangeSQL);
    
    // Query to get quiz performance data
    $query = "
        SELECT 
            q.id AS quiz_id,
            q.title AS quiz_name,
            p.title AS program_name,
            q.passing_score,
            COUNT(qa.id) AS attempt_count,
            ROUND(AVG(qa.score), 2) AS average_score,
            MIN(qa.score) AS min_score,
            MAX(qa.score) AS max_score,
            SUM(CASE WHEN qa.score >= q.passing_score THEN 1 ELSE 0 END) AS passed_count
        FROM 
            quizzes q
        LEFT JOIN 
            programs p ON q.program_id = p.id
        LEFT JOIN 
            quiz_attempts qa ON q.id = qa.quiz_id
        WHERE 
            1=1
            $dateFilter
        GROUP BY 
            q.id, q.title, p.title, q.passing_score
        ORDER BY 
            q.title
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate pass rates
    foreach ($quizzes as &$quiz) {
        // Calculate pass rate as percentage
        $quiz['pass_rate'] = $quiz['attempt_count'] > 0 
            ? round(($quiz['passed_count'] / $quiz['attempt_count']) * 100, 2)
            : 0;
    }
    
    // Calculate summary statistics
    $totalQuizzes = count($quizzes);
    $totalAttempts = 0;
    $totalPassed = 0;
    $sumScores = 0;
    
    foreach ($quizzes as $quiz) {
        $totalAttempts += $quiz['attempt_count'];
        $totalPassed += $quiz['passed_count'];
        $sumScores += $quiz['average_score'] * $quiz['attempt_count'];
    }
    
    $overallPassRate = $totalAttempts > 0 ? round(($totalPassed / $totalAttempts) * 100, 2) : 0;
    $overallAverageScore = $totalAttempts > 0 ? round($sumScores / $totalAttempts, 2) : 0;
    
    // Format the response
    return [
        'quizzes' => $quizzes,
        'summary' => [
            'totalQuizzes' => $totalQuizzes,
            'totalAttempts' => $totalAttempts,
            'totalPassed' => $totalPassed,
            'overallPassRate' => $overallPassRate,
            'overallAverageScore' => $overallAverageScore
        ]
    ];
}

/**
 * Get user activity data
 * 
 * @param PDO $pdo Database connection
 * @param string $dateRangeSQL Date range SQL condition
 * @param string|null $startDate Custom start date
 * @param string|null $endDate Custom end date
 * @return array User activity data
 */
function getUserActivityData($pdo, $dateRangeSQL, $startDate, $endDate) {
    // Replace date_column with appropriate column name in your query
    $dateColumn = 'ua.activity_time';
    $dateFilter = str_replace('date_column', $dateColumn, $dateRangeSQL);
    
    // Query to get daily activity counts
    $activityQuery = "
        SELECT 
            DATE(ua.activity_time) AS date,
            ua.activity_type,
            COUNT(*) AS count
        FROM 
            user_activity ua
        WHERE 
            1=1
            $dateFilter
        GROUP BY 
            DATE(ua.activity_time), ua.activity_type
        ORDER BY 
            date ASC
    ";
    
    $activityStmt = $pdo->prepare($activityQuery);
    $activityStmt->execute();
    $activityData = $activityStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert to chart data format (daily activity)
    $chartData = [];
    foreach ($activityData as $activity) {
        $date = $activity['date'];
        if (!isset($chartData[$date])) {
            $chartData[$date] = [
                'date' => $date,
                'logins' => 0,
                'attendance' => 0,
                'logout' => 0
            ];
        }
        
        // Map activity types to chart data properties
        if ($activity['activity_type'] === 'login') {
            $chartData[$date]['logins'] = (int)$activity['count'];
        } elseif ($activity['activity_type'] === 'attendance') {
            $chartData[$date]['attendance'] = (int)$activity['count'];
        } elseif ($activity['activity_type'] === 'logout') {
            $chartData[$date]['logout'] = (int)$activity['count'];
        }
    }
    
    // Convert to indexed array
    $chartData = array_values($chartData);
    
    // Query to get recent user activities
    $recentQuery = "
        SELECT 
            ua.id,
            u.username,
            u.full_name,
            u.role,
            ua.activity_type,
            ua.details,
            DATE(ua.activity_time) AS activity_date,
            TIME(ua.activity_time) AS activity_time
        FROM 
            user_activity ua
        JOIN 
            users u ON ua.user_id = u.id
        WHERE 
            1=1
            $dateFilter
        ORDER BY 
            ua.activity_time DESC
        LIMIT 20
    ";
    
    $recentStmt = $pdo->prepare($recentQuery);
    $recentStmt->execute();
    $recentActivity = $recentStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get active users count
    $activeUsersQuery = "SELECT COUNT(*) AS active_users FROM users WHERE status = 'active'";
    $activeUsersStmt = $pdo->prepare($activeUsersQuery);
    $activeUsersStmt->execute();
    $activeUsers = $activeUsersStmt->fetch(PDO::FETCH_ASSOC)['active_users'];
    
    // Calculate totals
    $totalLogins = 0;
    $totalAttendance = 0;
    
    foreach ($chartData as $data) {
        $totalLogins += $data['logins'];
        $totalAttendance += $data['attendance'];
    }
    
    // Format the response
    return [
        'chartData' => $chartData,
        'recentActivity' => $recentActivity,
        'summary' => [
            'activeUsers' => (int)$activeUsers,
            'totalLogins' => $totalLogins,
            'totalAttendance' => $totalAttendance
        ]
    ];
}

/**
 * Get applicant data
 * 
 * @param PDO $pdo Database connection
 * @param string $dateRangeSQL Date range SQL condition
 * @param string|null $startDate Custom start date
 * @param string|null $endDate Custom end date
 * @return array Applicant data
 */
function getApplicantData($pdo, $dateRangeSQL, $startDate, $endDate) {
    // Replace date_column with appropriate column name in your query
    $dateColumn = 'a.applied_at';
    $dateFilter = str_replace('date_column', $dateColumn, $dateRangeSQL);
    
    // Query to get application status distribution
    $statusQuery = "
        SELECT 
            a.status,
            COUNT(*) AS count
        FROM 
            applications a
        JOIN 
            users u ON a.user_id = u.id
        WHERE 
            u.role = 'applicant'
        GROUP BY 
            a.status
    ";
    
    $statusStmt = $pdo->prepare($statusQuery);
    $statusStmt->execute();
    $statusCounts = $statusStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format for chart data
    $statusData = [];
    foreach ($statusCounts as $status) {
        $statusData[] = [
            'name' => ucfirst($status['status']),
            'value' => (int)$status['count']
        ];
    }
    
    // Query to get evaluation scores by job role
    $evaluationQuery = "
        SELECT 
            a.job_role,
            COUNT(*) AS application_count,
            ROUND(AVG(a.evaluation_score), 2) AS avg_evaluation_score,
            ROUND(AVG(a.fst_score), 2) AS avg_fst_score
        FROM 
            applications a
        WHERE 
            a.evaluation_score IS NOT NULL
            $dateFilter
        GROUP BY 
            a.job_role
    ";
    
    $evaluationStmt = $pdo->prepare($evaluationQuery);
    $evaluationStmt->execute();
    $evaluationData = $evaluationStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format for chart data
    $evaluationChartData = [];
    foreach ($evaluationData as $role) {
        $evaluationChartData[] = [
            'name' => $role['job_role'],
            'evaluation' => (float)$role['avg_evaluation_score'],
            'fst' => (float)$role['avg_fst_score'],
            'count' => (int)$role['application_count']
        ];
    }
    
    // Query to get recent applications
    $applicationsQuery = "
        SELECT 
            a.id,
            u.full_name,
            p.title AS program_name,
            a.job_role,
            a.department,
            a.status,
            a.evaluation_score,
            a.fst_score,
            a.applied_at
        FROM 
            applications a
        JOIN 
            users u ON a.user_id = u.id
        JOIN 
            programs p ON a.program_id = p.id
        WHERE 
            u.role = 'applicant'
            $dateFilter
        ORDER BY 
            a.applied_at DESC
        LIMIT 20
    ";
    
    $applicationsStmt = $pdo->prepare($applicationsQuery);
    $applicationsStmt->execute();
    $applications = $applicationsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Count applications by status
    $pendingCount = 0;
    $shortlistedCount = 0;
    $hiredCount = 0;
    $rejectedCount = 0;
    
    foreach ($statusData as $status) {
        if ($status['name'] === 'Pending') {
            $pendingCount = $status['value'];
        } elseif ($status['name'] === 'Shortlisted') {
            $shortlistedCount = $status['value'];
        } elseif ($status['name'] === 'Hired') {
            $hiredCount = $status['value'];
        } elseif ($status['name'] === 'Rejected') {
            $rejectedCount = $status['value'];
        }
    }
    
    // Format the response
    return [
        'statusData' => $statusData,
        'evaluationData' => $evaluationChartData,
        'applications' => $applications,
        'summary' => [
            'totalApplications' => array_sum(array_column($statusData, 'value')),
            'pendingCount' => $pendingCount,
            'shortlistedCount' => $shortlistedCount,
            'hiredCount' => $hiredCount,
            'rejectedCount' => $rejectedCount
        ]
    ];
}