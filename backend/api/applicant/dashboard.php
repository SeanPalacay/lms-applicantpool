<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers early
header('Content-Type: application/json');

// Add debugging
function debug_log($message, $data = null) {
    $log_file = "dashboard_debug.log";
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message";
    
    if ($data !== null) {
        if (is_array($data) || is_object($data)) {
            $log_entry .= " " . json_encode($data);
        } else {
            $log_entry .= " $data";
        }
    }
    
    file_put_contents($log_file, $log_entry . PHP_EOL, FILE_APPEND);
}

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

debug_log("Headers received", $headers);

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    debug_log("Token from Authorization header", $token);
}

// Fallback: accept token in the query string (for testing only)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
    debug_log("Token from query parameter", $token);
}

// Check if userId is provided directly
$applicantId = 0;
if (isset($_GET['userId'])) {
    $applicantId = (int)$_GET['userId'];
    debug_log("Using userId from query parameter", $applicantId);
}

// If token is still empty and no userId, return 401
if (empty($token) && $applicantId === 0) {
    debug_log("No token or userId found");
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    if (!isset($pdo)) {
        throw new Exception('Database connection not established');
    }

    // Only try to parse the token if we don't already have an applicantId
    if ($applicantId === 0 && !empty($token)) {
        // Try to decode as base64 first (userId:timestamp format)
        $tokenData = base64_decode($token, true);
        debug_log("Attempting to decode token", $tokenData);
        
        if ($tokenData !== false && strpos($tokenData, ':') !== false) {
            // It's a base64 token with expected format
            $parts = explode(':', $tokenData);
            $applicantId = (int)$parts[0];
            debug_log("Parsed applicantId from base64 token", $applicantId);
        } else {
            // Fallback: Try to get userId from localStorage
            if (isset($_GET['userId'])) {
                $applicantId = (int)$_GET['userId'];
                debug_log("Using userId from query parameter", $applicantId);
            } else {
                // Last resort: check session
                if (isset($_SESSION['user_id'])) {
                    $applicantId = (int)$_SESSION['user_id'];
                    debug_log("Using userId from session", $applicantId);
                }
            }
        }
    }
    
    // If still no ID, we bail
    if (!$applicantId) {
        debug_log("Failed to determine applicantId");
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token or no user ID found']);
        exit;
    }
    
    debug_log("Processing dashboard for applicantId", $applicantId);
    
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
        debug_log("No applicant found for user ID", $applicantId);
        http_response_code(404);
        echo json_encode(['error' => 'No applicant found for this user']);
        exit;
    }

    $response['user'] = $userData;
    debug_log("Found user data", $userData);

    // Rest of your code remains the same...
    
    /*
     * 2. Fetch All Applications for This Applicant
     *    We join the `applications` table with `applicant_pools` for relevant data
     */
    $appsQuery = "
        SELECT 
            a.id AS application_id,
            a.pool_id,
            ap.pool_name,
            a.job_role,
            a.department,
            a.status,
            a.evaluation_score,
            a.fst_score,
            a.applied_at,
            a.updated_at
        FROM applications a
        JOIN applicant_pools ap ON a.pool_id = ap.id
        WHERE a.user_id = ? 
        ORDER BY a.applied_at DESC
    ";
    $appsStmt = $pdo->prepare($appsQuery);
    $appsStmt->execute([$applicantId]);
    $applications = $appsStmt->fetchAll(PDO::FETCH_ASSOC);

    $response['myApplications'] = $applications;
    debug_log("Found applications", count($applications));

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
    debug_log("Found notifications", count($notifications));

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
    debug_log("Generated alerts", count($alerts));

    /*
     * 5. Return JSON
     */
    debug_log("Returning dashboard data", $response);
    echo json_encode($response);

} catch (PDOException $e) {
    $errorMsg = "Applicant Dashboard PDO Error: " . $e->getMessage();
    debug_log($errorMsg);
    error_log($errorMsg);
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    $errorMsg = "Applicant Dashboard General Error: " . $e->getMessage();
    debug_log($errorMsg);
    error_log($errorMsg);
    http_response_code(500);
    echo json_encode(['error' => 'General error: ' . $e->getMessage()]);
    exit;
}