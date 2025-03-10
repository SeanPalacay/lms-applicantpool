<?php
// File: /lms-forbes/backend/api/session-test.php
session_start();

// Set content type
header('Content-Type: application/json');

// Check if we're setting a test value
if (isset($_GET['set'])) {
    $_SESSION['test_value'] = 'Session is working!';
    $_SESSION['timestamp'] = time();
    echo json_encode([
        'message' => 'Session value set',
        'session_id' => session_id(),
        'session_data' => $_SESSION
    ]);
    exit;
}

// Check if we're clearing the session
if (isset($_GET['clear'])) {
    $_SESSION = [];
    session_destroy();
    echo json_encode([
        'message' => 'Session cleared',
        'session_status' => session_status()
    ]);
    exit;
}

// Normal response - show session data
echo json_encode([
    'session_id' => session_id(),
    'session_status' => session_status(),
    'session_data' => $_SESSION,
    'cookies' => $_COOKIE,
    'server' => [
        'remote_addr' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]
]);