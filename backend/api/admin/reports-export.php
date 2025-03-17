<?php
// api/admin/reports-export.php

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Export quiz report as CSV
 */
function exportQuizReport($pdo, $output, $dateRangeSQL, $startDate, $endDate) {
    // Replace date_column with attempt_date
    $dateFilter = str_replace('date_column', 'qa.attempt_date', $dateRangeSQL);
    
    // Write CSV header row
    fputcsv($output, [
        'Quiz ID',
        'Quiz Name',
        'Program',
        'Total Attempts',
        'Average Score',
        'Passing Score',
        'Pass Rate',
        'Min Score',
        'Max Score',
        'Created By',
        'Created Date'
    ]);
    
    // Query to get quiz data
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
            u.full_name AS created_by,
            q.created_at
        FROM 
            quizzes q
        LEFT JOIN 
            programs p ON q.program_id = p.id
        LEFT JOIN 
            quiz_attempts qa ON q.id = qa.quiz_id
        LEFT JOIN
            users u ON q.created_by = u.id
        WHERE 
            1=1
            $dateFilter
        GROUP BY 
            q.id, q.title, p.title, q.passing_score, u.full_name, q.created_at
        ORDER BY 
            p.title, q.title
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    // Write data rows
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Calculate pass rate
        $passRate = "0%";
        if ($row['attempt_count'] > 0) {
            // Query to get pass count
            $passQuery = "
                SELECT COUNT(*) AS pass_count
                FROM quiz_attempts
                WHERE quiz_id = ? AND score >= ?
            ";
            $passStmt = $pdo->prepare($passQuery);
            $passStmt->execute([$row['quiz_id'], $row['passing_score']]);
            $passCount = $passStmt->fetch(PDO::FETCH_ASSOC)['pass_count'];
            
            $passRate = round(($passCount / $row['attempt_count']) * 100, 2) . "%";
        }
        
        fputcsv($output, [
            $row['quiz_id'],
            $row['quiz_name'],
            $row['program_name'],
            $row['attempt_count'],
            $row['average_score'],
            $row['passing_score'],
            $passRate,
            $row['min_score'] ?: 'N/A',
            $row['max_score'] ?: 'N/A',
            $row['created_by'],
            $row['created_at']
        ]);
    }
    
    // Add a summary row
    fputcsv($output, []);
    
    // Query for summary data
    $summaryQuery = "
        SELECT 
            COUNT(DISTINCT q.id) AS total_quizzes,
            COUNT(qa.id) AS total_attempts,
            ROUND(AVG(qa.score), 2) AS overall_average,
            SUM(CASE WHEN qa.score >= q.passing_score THEN 1 ELSE 0 END) AS total_passed
        FROM 
            quizzes q
        LEFT JOIN 
            quiz_attempts qa ON q.id = qa.quiz_id
        WHERE 
            1=1
            $dateFilter
    ";
    
    $summaryStmt = $pdo->prepare($summaryQuery);
    $summaryStmt->execute();
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate overall pass rate
    $overallPassRate = "0%";
    if ($summary['total_attempts'] > 0) {
        $overallPassRate = round(($summary['total_passed'] / $summary['total_attempts']) * 100, 2) . "%";
    }
    
    // Write summary information
    fputcsv($output, ['SUMMARY']);
    fputcsv($output, ['Total Quizzes', $summary['total_quizzes']]);
    fputcsv($output, ['Total Attempts', $summary['total_attempts']]);
    fputcsv($output, ['Overall Average Score', $summary['overall_average']]);
    fputcsv($output, ['Overall Pass Rate', $overallPassRate]);
    
    // Add report generation details
    fputcsv($output, []);
    fputcsv($output, ['Report Generated', date('Y-m-d H:i:s')]);
    fputcsv($output, ['Date Range', $startDate && $endDate ? "$startDate to $endDate" : getDateRangeText($dateRangeSQL)]);
    fputcsv($output, ['Report Type', 'Quiz Performance']);
}

/**
 * Export user activity report as CSV
 */
function exportActivityReport($pdo, $output, $dateRangeSQL, $startDate, $endDate) {
    // Replace date_column with activity_time
    $dateFilter = str_replace('date_column', 'ua.activity_time', $dateRangeSQL);
    
    // Write CSV header row
    fputcsv($output, [
        'User ID',
        'Full Name',
        'Username',
        'Role',
        'Activity Type',
        'Activity Date',
        'Activity Time',
        'Details'
    ]);
    
    // Query to get user activity data
    $query = "
        SELECT 
            u.id AS user_id,
            u.full_name,
            u.username,
            u.role,
            ua.activity_type,
            DATE(ua.activity_time) AS activity_date,
            TIME(ua.activity_time) AS activity_time,
            ua.details
        FROM 
            user_activity ua
        JOIN 
            users u ON ua.user_id = u.id
        WHERE 
            1=1
            $dateFilter
        ORDER BY 
            ua.activity_time DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    // Write data rows
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, [
            $row['user_id'],
            $row['full_name'],
            $row['username'],
            $row['role'],
            $row['activity_type'],
            $row['activity_date'],
            $row['activity_time'],
            $row['details']
        ]);
    }
    
    // Add a summary row
    fputcsv($output, []);
    
    // Query for summary data
    $summaryQuery = "
        SELECT 
            COUNT(*) AS total_activities,
            COUNT(DISTINCT ua.user_id) AS unique_users,
            SUM(CASE WHEN ua.activity_type = 'login' THEN 1 ELSE 0 END) AS login_count,
            SUM(CASE WHEN ua.activity_type = 'attendance' THEN 1 ELSE 0 END) AS attendance_count,
            SUM(CASE WHEN ua.activity_type = 'logout' THEN 1 ELSE 0 END) AS logout_count
        FROM 
            user_activity ua
        WHERE 
            1=1
            $dateFilter
    ";
    
    $summaryStmt = $pdo->prepare($summaryQuery);
    $summaryStmt->execute();
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);
    
    // Write summary information
    fputcsv($output, ['SUMMARY']);
    fputcsv($output, ['Total Activities', $summary['total_activities']]);
    fputcsv($output, ['Unique Users', $summary['unique_users']]);
    fputcsv($output, ['Login Events', $summary['login_count']]);
    fputcsv($output, ['Attendance Events', $summary['attendance_count']]);
    fputcsv($output, ['Logout Events', $summary['logout_count']]);
    
    // Add daily activity summary
    fputcsv($output, []);
    fputcsv($output, ['DAILY ACTIVITY SUMMARY']);
    fputcsv($output, ['Date', 'Logins', 'Attendance', 'Logouts', 'Total']);
    
    // Query for daily activity
    $dailyQuery = "
        SELECT 
            DATE(ua.activity_time) AS date,
            SUM(CASE WHEN ua.activity_type = 'login' THEN 1 ELSE 0 END) AS logins,
            SUM(CASE WHEN ua.activity_type = 'attendance' THEN 1 ELSE 0 END) AS attendance,
            SUM(CASE WHEN ua.activity_type = 'logout' THEN 1 ELSE 0 END) AS logouts,
            COUNT(*) AS total
        FROM 
            user_activity ua
        WHERE 
            1=1
            $dateFilter
        GROUP BY 
            DATE(ua.activity_time)
        ORDER BY 
            date DESC
    ";
    
    $dailyStmt = $pdo->prepare($dailyQuery);
    $dailyStmt->execute();
    
    // Write daily summary rows
    while ($row = $dailyStmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, [
            $row['date'],
            $row['logins'],
            $row['attendance'],
            $row['logouts'],
            $row['total']
        ]);
    }
    
    // Add report generation details
    fputcsv($output, []);
    fputcsv($output, ['Report Generated', date('Y-m-d H:i:s')]);
    fputcsv($output, ['Date Range', $startDate && $endDate ? "$startDate to $endDate" : getDateRangeText($dateRangeSQL)]);
    fputcsv($output, ['Report Type', 'User Activity']);
}

/**
 * Export applicant report as CSV
 */
function exportApplicantReport($pdo, $output, $dateRangeSQL, $startDate, $endDate) {
    // Replace date_column with applied_at
    $dateFilter = str_replace('date_column', 'a.applied_at', $dateRangeSQL);
    
    // Write CSV header row
    fputcsv($output, [
        'Application ID',
        'Applicant Name',
        'Email',
        'Program',
        'Job Role',
        'Department',
        'Status',
        'Evaluation Score',
        'FST Score',
        'Applied Date',
        'Applicant Pool'
    ]);
    
    // Query to get applicant data
    $query = "
        SELECT 
            a.id AS application_id,
            u.full_name,
            u.email,
            p.title AS program_name,
            a.job_role,
            a.department,
            a.status,
            a.evaluation_score,
            a.fst_score,
            a.applied_at,
            GROUP_CONCAT(ap.pool_name SEPARATOR ', ') AS applicant_pools
        FROM 
            applications a
        JOIN 
            users u ON a.user_id = u.id
        JOIN 
            programs p ON a.program_id = p.id
        LEFT JOIN
            applicant_pool_assignments apa ON a.id = apa.application_id
        LEFT JOIN
            applicant_pools ap ON apa.pool_id = ap.id
        WHERE 
            u.role = 'applicant'
            $dateFilter
        GROUP BY
            a.id, u.full_name, u.email, p.title, a.job_role, 
            a.department, a.status, a.evaluation_score, a.fst_score, a.applied_at
        ORDER BY 
            a.applied_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    // Write data rows
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, [
            $row['application_id'],
            $row['full_name'],
            $row['email'],
            $row['program_name'],
            $row['job_role'],
            $row['department'],
            $row['status'],
            $row['evaluation_score'] ?: 'N/A',
            $row['fst_score'] ?: 'N/A',
            $row['applied_at'],
            $row['applicant_pools'] ?: 'None'
        ]);
    }
    
    // Add a summary row
    fputcsv($output, []);
    
    // Query for summary data
    $summaryQuery = "
        SELECT 
            COUNT(*) AS total_applications,
            SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN a.status = 'shortlisted' THEN 1 ELSE 0 END) AS shortlisted_count,
            SUM(CASE WHEN a.status = 'hired' THEN 1 ELSE 0 END) AS hired_count,
            SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
            AVG(a.evaluation_score) AS avg_evaluation,
            AVG(a.fst_score) AS avg_fst
        FROM 
            applications a
        JOIN 
            users u ON a.user_id = u.id
        WHERE 
            u.role = 'applicant'
            $dateFilter
    ";
    
    $summaryStmt = $pdo->prepare($summaryQuery);
    $summaryStmt->execute();
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);
    
    // Write summary information
    fputcsv($output, ['SUMMARY']);
    fputcsv($output, ['Total Applications', $summary['total_applications']]);
    fputcsv($output, ['Pending Applications', $summary['pending_count']]);
    fputcsv($output, ['Shortlisted Applications', $summary['shortlisted_count']]);
    fputcsv($output, ['Hired Applications', $summary['hired_count']]);
    fputcsv($output, ['Rejected Applications', $summary['rejected_count']]);
    fputcsv($output, ['Average Evaluation Score', round($summary['avg_evaluation'], 2)]);
    fputcsv($output, ['Average FST Score', round($summary['avg_fst'], 2)]);
    
    // Query for job role summary
    fputcsv($output, []);
    fputcsv($output, ['JOB ROLE SUMMARY']);
    fputcsv($output, ['Job Role', 'Total Applications', 'Average Evaluation Score', 'Average FST Score']);
    
    $roleQuery = "
        SELECT 
            a.job_role,
            COUNT(*) AS total,
            ROUND(AVG(a.evaluation_score), 2) AS avg_evaluation,
            ROUND(AVG(a.fst_score), 2) AS avg_fst
        FROM 
            applications a
        JOIN 
            users u ON a.user_id = u.id
        WHERE 
            u.role = 'applicant'
            $dateFilter
        GROUP BY 
            a.job_role
        ORDER BY 
            total DESC
    ";
    
    $roleStmt = $pdo->prepare($roleQuery);
    $roleStmt->execute();
    
    while ($row = $roleStmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, [
            $row['job_role'],
            $row['total'],
            $row['avg_evaluation'] ?: 'N/A',
            $row['avg_fst'] ?: 'N/A'
        ]);
    }
    
    // Add report generation details
    fputcsv($output, []);
    fputcsv($output, ['Report Generated', date('Y-m-d H:i:s')]);
    fputcsv($output, ['Date Range', $startDate && $endDate ? "$startDate to $endDate" : getDateRangeText($dateRangeSQL)]);
    fputcsv($output, ['Report Type', 'Applicant Data']);
}

/**
 * Export combined report as CSV
 */
function exportCombinedReport($pdo, $output, $dateRangeSQL, $startDate, $endDate) {
    // Write header for combined report
    fputcsv($output, ['LMS FORBES SYSTEM REPORT - ' . date('Y-m-d')]);
    fputcsv($output, ['Date Range', $startDate && $endDate ? "$startDate to $endDate" : getDateRangeText($dateRangeSQL)]);
    fputcsv($output, []);
    
    // System Overview
    fputcsv($output, ['SYSTEM OVERVIEW']);
    
    // Query for system stats
    $systemQuery = "
        SELECT 
            (SELECT COUNT(*) FROM users WHERE status = 'active') AS active_users,
            (SELECT COUNT(*) FROM programs) AS total_programs,
            (SELECT COUNT(*) FROM quizzes) AS total_quizzes,
            (SELECT COUNT(*) FROM applications WHERE status = 'pending') AS pending_applications
    ";
    
    $systemStmt = $pdo->prepare($systemQuery);
    $systemStmt->execute();
    $systemStats = $systemStmt->fetch(PDO::FETCH_ASSOC);
    
    fputcsv($output, ['Active Users', $systemStats['active_users']]);
    fputcsv($output, ['Total Programs', $systemStats['total_programs']]);
    fputcsv($output, ['Total Quizzes', $systemStats['total_quizzes']]);
    fputcsv($output, ['Pending Applications', $systemStats['pending_applications']]);
    
    // Section for Program Enrollment
    fputcsv($output, []);
    fputcsv($output, ['PROGRAM ENROLLMENT']);
    fputcsv($output, [
        'Program Name',
        'Type',
        'Enrollments',
        'Completed',
        'In Progress',
        'Completion %'
    ]);
    
    // Replace date_column with enrollment_date
    $enrollmentFilter = str_replace('date_column', 'pe.enrollment_date', $dateRangeSQL);
    
    $enrollmentQuery = "
        SELECT 
            p.title AS program_name,
            p.type,
            COUNT(pe.id) AS enrollments,
            SUM(CASE WHEN pe.completion_status = 'completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN pe.completion_status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
            ROUND(
                SUM(CASE WHEN pe.completion_status = 'completed' THEN 1 ELSE 0 END) * 100 / 
                NULLIF(COUNT(pe.id), 0), 2
            ) AS completion_percentage
        FROM 
            programs p
        LEFT JOIN 
            program_enrollments pe ON p.id = pe.program_id
        WHERE 
            1=1
            $enrollmentFilter
        GROUP BY 
            p.id, p.title, p.type
        ORDER BY 
            enrollments DESC
    ";
    
    $enrollmentStmt = $pdo->prepare($enrollmentQuery);
    $enrollmentStmt->execute();
    
    while ($row = $enrollmentStmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, [
            $row['program_name'],
            $row['type'],
            $row['enrollments'],
            $row['completed'],
            $row['in_progress'],
            ($row['completion_percentage'] ?: '0') . '%'
        ]);
    }
    
    // Section for Quiz Performance
    fputcsv($output, []);
    fputcsv($output, ['QUIZ PERFORMANCE']);
    fputcsv($output, [
        'Quiz Name',
        'Program',
        'Attempts',
        'Avg. Score',
        'Pass Rate'
    ]);
    
    // Replace date_column with attempt_date
    $quizFilter = str_replace('date_column', 'qa.attempt_date', $dateRangeSQL);
    
    $quizQuery = "
        SELECT 
            q.title AS quiz_name,
            p.title AS program_name,
            COUNT(qa.id) AS attempts,
            ROUND(AVG(qa.score), 2) AS avg_score,
            q.passing_score,
            q.id AS quiz_id
        FROM 
            quizzes q
        LEFT JOIN 
            programs p ON q.program_id = p.id
        LEFT JOIN 
            quiz_attempts qa ON q.id = qa.quiz_id
        WHERE 
            1=1
            $quizFilter
        GROUP BY 
            q.id, q.title, p.title, q.passing_score
        ORDER BY 
            attempts DESC
    ";
    
    $quizStmt = $pdo->prepare($quizQuery);
    $quizStmt->execute();
    
    while ($row = $quizStmt->fetch(PDO::FETCH_ASSOC)) {
        // Calculate pass rate
        $passRate = "0%";
        if ($row['attempts'] > 0) {
            $passQuery = "
                SELECT COUNT(*) AS pass_count
                FROM quiz_attempts
                WHERE quiz_id = ? AND score >= ?
            ";
            $passStmt = $pdo->prepare($passQuery);
            $passStmt->execute([$row['quiz_id'], $row['passing_score']]);
            $passCount = $passStmt->fetch(PDO::FETCH_ASSOC)['pass_count'];
            
            $passRate = round(($passCount / $row['attempts']) * 100, 2) . "%";
        }
        
        fputcsv($output, [
            $row['quiz_name'],
            $row['program_name'],
            $row['attempts'],
            $row['avg_score'],
            $passRate
        ]);
    }
    
    // Section for User Activity
    fputcsv($output, []);
    fputcsv($output, ['USER ACTIVITY SUMMARY']);
    fputcsv($output, [
        'Date',
        'Logins',
        'Attendance',
        'Logouts',
        'Total'
    ]);
    
    // Replace date_column with activity_time
    $activityFilter = str_replace('date_column', 'ua.activity_time', $dateRangeSQL);
    
    $activityQuery = "
        SELECT 
            DATE(ua.activity_time) AS date,
            SUM(CASE WHEN ua.activity_type = 'login' THEN 1 ELSE 0 END) AS logins,
            SUM(CASE WHEN ua.activity_type = 'attendance' THEN 1 ELSE 0 END) AS attendance,
            SUM(CASE WHEN ua.activity_type = 'logout' THEN 1 ELSE 0 END) AS logouts,
            COUNT(*) AS total
        FROM 
            user_activity ua
        WHERE 
            1=1
            $activityFilter
        GROUP BY 
            DATE(ua.activity_time)
        ORDER BY 
            date DESC
        LIMIT 15
    ";
    
    $activityStmt = $pdo->prepare($activityQuery);
    $activityStmt->execute();
    
    while ($row = $activityStmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, [
            $row['date'],
            $row['logins'],
            $row['attendance'],
            $row['logouts'],
            $row['total']
        ]);
    }
    
    // Section for Applicant Status
    fputcsv($output, []);
    fputcsv($output, ['APPLICANT STATUS SUMMARY']);
    fputcsv($output, [
        'Status',
        'Count',
        'Percentage'
    ]);
    
    // Replace date_column with applied_at
    $applicantFilter = str_replace('date_column', 'a.applied_at', $dateRangeSQL);
    
    $statusQuery = "
        SELECT 
            a.status,
            COUNT(*) AS count,
            (SELECT COUNT(*) FROM applications WHERE 1=1 $applicantFilter) AS total
        FROM 
            applications a
        WHERE 
            1=1
            $applicantFilter
        GROUP BY 
            a.status
    ";
    
    $statusStmt = $pdo->prepare($statusQuery);
    $statusStmt->execute();
    
    while ($row = $statusStmt->fetch(PDO::FETCH_ASSOC)) {
        $percentage = $row['total'] > 0 ? round(($row['count'] / $row['total']) * 100, 2) . "%" : "0%";
        fputcsv($output, [
            ucfirst($row['status']),
            $row['count'],
            $percentage
        ]);
    }
    
    // Add report generation details
    fputcsv($output, []);
    fputcsv($output, ['Report Generated', date('Y-m-d H:i:s')]);
    fputcsv($output, ['Date Range', $startDate && $endDate ? "$startDate to $endDate" : getDateRangeText($dateRangeSQL)]);
    fputcsv($output, ['Report Type', 'Combined System Report']);
}

/**
 * Helper function to get human-readable date range text
 */
function getDateRangeText($dateRangeSQL) {
    if (strpos($dateRangeSQL, 'INTERVAL 1 WEEK') !== false) {
        return 'Last Week';
    } elseif (strpos($dateRangeSQL, 'INTERVAL 1 MONTH') !== false) {
        return 'Last Month';
    } elseif (strpos($dateRangeSQL, 'INTERVAL 3 MONTH') !== false) {
        return 'Last Quarter';
    } elseif (strpos($dateRangeSQL, 'INTERVAL 1 YEAR') !== false) {
        return 'Last Year';
    } else {
        return 'All Time';
    }
}

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// Check authorization
$token = isset($_GET['token']) ? $_GET['token'] : '';
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Simple token validation (in production, use proper JWT validation)
// At minimum, verify that the token belongs to an admin user

// Get export parameters
$reportType = isset($_GET['type']) ? $_GET['type'] : 'all';
$format = isset($_GET['format']) ? strtolower($_GET['format']) : 'csv';
$dateRange = isset($_GET['range']) ? $_GET['range'] : 'month';
$startDate = isset($_GET['start']) ? $_GET['start'] : null;
$endDate = isset($_GET['end']) ? $_GET['end'] : null;

// Validate format
if ($format !== 'csv' && $format !== 'pdf') {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'Invalid export format. Supported formats: csv, pdf']);
    exit;
}

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

try {
    // Set headers for file download
    $filename = "lms_forbes_{$reportType}_report_" . date('Y-m-d');
    
    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
        
        // Create a file pointer for output
        $output = fopen('php://output', 'w');
        
        // Export based on report type
        switch ($reportType) {
            case 'enrollment':
                exportEnrollmentReport($pdo, $output, $dateRangeSQL, $startDate, $endDate);
                break;
                
            case 'quiz':
                exportQuizReport($pdo, $output, $dateRangeSQL, $startDate, $endDate);
                break;
                
            case 'activity':
                exportActivityReport($pdo, $output, $dateRangeSQL, $startDate, $endDate);
                break;
                
            case 'applicants':
                exportApplicantReport($pdo, $output, $dateRangeSQL, $startDate, $endDate);
                break;
                
            default:
                // Default to a general report with all data sections
                exportCombinedReport($pdo, $output, $dateRangeSQL, $startDate, $endDate);
        }
        
        // Close the output file pointer
        fclose($output);
        
    } elseif ($format === 'pdf') {
        // For PDF export, we'd typically use a library like TCPDF or FPDF
        // This is a placeholder that returns a JSON message instead
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'PDF export is not implemented yet',
            'message' => 'Please use CSV format for now'
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Reports Export API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Reports Export API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Export enrollment report as CSV
 */
function exportEnrollmentReport($pdo, $output, $dateRangeSQL, $startDate, $endDate) {
    // Replace date_column with enrollment_date
    $dateFilter = str_replace('date_column', 'pe.enrollment_date', $dateRangeSQL);
    
    // Write CSV header row
    fputcsv($output, [
        'Program ID',
        'Program Name',
        'Program Type',
        'Total Enrollments',
        'Completed',
        'In Progress',
        'Not Started',
        'Completion Percentage',
        'Created By',
        'Created Date'
    ]);
    
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
            ROUND(AVG(pe.completion_percentage), 2) AS avg_completion,
            u.full_name AS created_by,
            p.created_at
        FROM 
            programs p
        LEFT JOIN 
            program_enrollments pe ON p.id = pe.program_id
        LEFT JOIN
            users u ON p.created_by = u.id
        WHERE 
            1=1
            $dateFilter
        GROUP BY 
            p.id, p.title, p.type, u.full_name, p.created_at
        ORDER BY 
            p.title
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    // Write data rows
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, [
            $row['program_id'],
            $row['program_name'],
            $row['program_type'],
            $row['enrolled_count'],
            $row['completed_count'],
            $row['in_progress_count'],
            $row['not_started_count'],
            $row['avg_completion'] . '%',
            $row['created_by'],
            $row['created_at']
        ]);
    }
    
    // Add a summary row
    fputcsv($output, []);
    
    // Query for summary data
    $summaryQuery = "
        SELECT 
            COUNT(DISTINCT p.id) AS total_programs,
            COUNT(pe.id) AS total_enrollments,
            SUM(CASE WHEN pe.completion_status = 'completed' THEN 1 ELSE 0 END) AS total_completed,
            ROUND(
                SUM(CASE WHEN pe.completion_status = 'completed' THEN 1 ELSE 0 END) * 100 / 
                COUNT(pe.id), 2
            ) AS completion_rate
        FROM 
            programs p
        LEFT JOIN 
            program_enrollments pe ON p.id = pe.program_id
        WHERE 
            1=1
            $dateFilter
    ";
    
    $summaryStmt = $pdo->prepare($summaryQuery);
    $summaryStmt->execute();
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);
    
    // Write summary information
    fputcsv($output, ['SUMMARY']);
    fputcsv($output, ['Total Programs', $summary['total_programs']]);
    fputcsv($output, ['Total Enrollments', $summary['total_enrollments']]);
    fputcsv($output, ['Total Completed', $summary['total_completed']]);
    fputcsv($output, ['Overall Completion Rate', $summary['completion_rate'] . '%']);
    
    // Add report generation details
    fputcsv($output, []);
    fputcsv($output, ['Report Generated', date('Y-m-d H:i:s')]);
    fputcsv($output, ['Date Range', $startDate && $endDate ? "$startDate to $endDate" : getDateRangeText($dateRangeSQL)]);
    fputcsv($output, ['Report Type', 'Program Enrollment']);
}