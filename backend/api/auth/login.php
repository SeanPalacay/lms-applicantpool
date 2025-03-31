<?php
if (session_status() === PHP_SESSION_NONE) session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header("Content-Type: application/json");

function debug_log($message, $data = null) {
    $log_file = "login_debug.log";
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message";
    if ($data !== null) $log_entry .= " " . json_encode($data);
    file_put_contents($log_file, $log_entry . PHP_EOL, FILE_APPEND);
}

require_once __DIR__ . '/../../config/db_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    debug_log("Invalid request method: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $input = file_get_contents('php://input');
    debug_log("Received login request", $input);
    $data = json_decode($input, true);

    if (!isset($data['username']) || empty($data['username'])) {
        debug_log("Missing username");
        http_response_code(400);
        echo json_encode(['error' => 'Username is required']);
        exit;
    }
    if (!isset($data['password']) || empty($data['password'])) {
        debug_log("Missing password");
        http_response_code(400);
        echo json_encode(['error' => 'Password is required']);
        exit;
    }

    $username = $data['username'];
    $password = $data['password'];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username OR email = :email");
    $stmt->execute(['username' => $username, 'email' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        debug_log("User not found", $username);
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }

    // Check if user is an applicant
    if ($user['role'] === 'applicant') {
        debug_log("Applicant tried to login with credentials", $username);
        http_response_code(403);
        echo json_encode(['error' => 'Applicants must use their access code to log in']);
        exit;
    }

    if (!password_verify($password, $user['password'])) {
        debug_log("Password verification failed");
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }

    $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
    $updateStmt->execute(['id' => $user['id']]);

    $token = base64_encode($user['id'] . ':' . time());

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['user_role'] = $user['role'];

    $response = [
        'token' => $token,
        'user_id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'full_name' => $user['full_name'] ?? $user['username'],
        'email' => $user['email'] ?? ''
    ];

    debug_log("Login successful", $response);
    echo json_encode($response);
} catch (PDOException $e) {
    debug_log("Database error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    debug_log("General error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>