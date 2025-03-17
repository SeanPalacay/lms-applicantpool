<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers early
header('Content-Type: application/json');

// Optionally disable display_errors in production
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/php/logs/php_error_log'); // Adjust path or remove

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Read Authorization header for Bearer token
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// Fallback: accept token in the query string (for testing only)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// If token is still empty, return 401
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    if (!isset($pdo)) {
        throw new Exception('Database connection not established');
    }

    // In a real system, parse the token or read $_SESSION to get applicant user_id
    $applicantId = 4; // Hard-coded for example; replace with real logic

    // Basic structure for the applicant dashboard response
    $response = [
        'user' => [
            'full_name' => '',
            'email' => '',
            'status' => '',  // e.g., 'active' or 'inactive'
        ],
        'myApplications' => [],   // array of applications data
        'notifications'  => [],   // array of notifications
        'alerts'         => []    // custom alerts
    ];

    /*
     * 1. Fetch Applicant User Info
     */
    $userQuery = "SELECT full_name, email, status 
                  FROM users 
                  WHERE id = ? AND role = 'applicant' 
                  LIMIT 1";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$applicantId]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        // If no matching applicant found, possibly return error or empty data
        http_response_code(404);
        echo json_encode(['error' => 'No applicant found for this user']);
        exit;
    }

    $response['user'] = $userData;

    /*
     * 2. Fetch All Applications for This Applicant
     *    We join the `applications` table with `programs` or any relevant data
     */
    $appsQuery = "
        SELECT 
            a.id AS application_id,
            a.program_id,
            p.title AS program_title,
            a.job_role,
            a.department,
            a.status,
            a.evaluation_score,
            a.fst_score,
            a.applied_at,
            a.updated_at
        FROM applications a
        JOIN programs p ON a.program_id = p.id
        WHERE a.user_id = ? 
        ORDER BY a.applied_at DESC
    ";
    $appsStmt = $pdo->prepare($appsQuery);
    $appsStmt->execute([$applicantId]);
    $applications = $appsStmt->fetchAll(PDO::FETCH_ASSOC);

    $response['myApplications'] = $applications;

    /*
     * 3. Fetch Notifications for This Applicant
     *    E.g., from `notifications` table
     */
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
    $notifStmt->execute([$applicantId]);
    $notifications = $notifStmt->fetchAll(PDO::FETCH_ASSOC);
    $response['notifications'] = $notifications;

    /*
     * 4. Generate Any Custom Alerts
     *    For example, if an application is 'rejected', or FST score below threshold, etc.
     */
    $alerts = [];

    // Example: Alert if any pending application older than X days
    $pendingOldQuery = "
        SELECT DATEDIFF(CURRENT_DATE, applied_at) as days_since
        FROM applications
        WHERE user_id = ?
          AND status = 'pending'
        HAVING days_since >= 14
        LIMIT 1
    ";
    $pendingOldStmt = $pdo->prepare($pendingOldQuery);
    $pendingOldStmt->execute([$applicantId]);
    $pendingResult = $pendingOldStmt->fetch(PDO::FETCH_ASSOC);

    if ($pendingResult && isset($pendingResult['days_since'])) {
        $daysSince = (int)$pendingResult['days_since'];
        $alerts[] = [
            'type' => 'info',
            'title' => 'Application Pending',
            'message' => "Your application has been pending for $daysSince days."
        ];
    }

    // Example: Alert if any application is 'rejected' but FST < 70
    $rejectedFSTQuery = "
        SELECT COUNT(*) AS count_rej
        FROM applications
        WHERE user_id = ?
          AND status = 'rejected'
          AND (fst_score IS NOT NULL AND fst_score < 70)
    ";
    $rejectedFSTStmt = $pdo->prepare($rejectedFSTQuery);
    $rejectedFSTStmt->execute([$applicantId]);
    $rejRow = $rejectedFSTStmt->fetch(PDO::FETCH_ASSOC);
    if ($rejRow && $rejRow['count_rej'] > 0) {
        $alerts[] = [
            'type' => 'warning',
            'title' => 'Rejected Application',
            'message' => 'Your FST score was below 70 for a rejected application. Consider re-applying.'
        ];
    }

    $response['alerts'] = $alerts;

    /*
     * 5. Return JSON
     */
    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Applicant Dashboard PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("Applicant Dashboard General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'General error: ' . $e->getMessage()]);
    exit;
}
