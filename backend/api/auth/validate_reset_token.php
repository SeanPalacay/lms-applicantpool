<?php
// Disable error display in production to prevent breaking JSON output
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (session_status() === PHP_SESSION_NONE) session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header("Content-Type: application/json");

function debug_log($message, $data = null) {
    $log_file = __DIR__ . "/password_reset_debug.log";
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message";
    if ($data !== null) $log_entry .= " " . json_encode($data);
    file_put_contents($log_file, $log_entry . PHP_EOL, FILE_APPEND);
}

try {
    debug_log("Starting token validation process");
} catch (Exception $e) {
    // If we can't write to log, at least output a JSON error
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error: Cannot write to log file']);
    exit;
}

try {
    // Load database configuration
    require_once __DIR__ . '/../../config/db_config.php';
    
    // Test database connection
    $testQuery = $pdo->query("SELECT 1");
    if (!$testQuery) {
        throw new PDOException("Database connection test failed");
    }
    debug_log("Database connection successful");
    
} catch (PDOException $e) {
    debug_log("Database connection error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection error. Please try again later.']);
    exit;
} catch (Exception $e) {
    debug_log("Error loading database configuration", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error. Please try again later.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    debug_log("Invalid request method: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $input = file_get_contents('php://input');
    debug_log("Received token validation request", $input);
    
    // Decode and validate input
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        debug_log("Invalid JSON input", json_last_error_msg());
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    if (!isset($data['token']) || empty($data['token'])) {
        debug_log("Missing token");
        http_response_code(400);
        echo json_encode(['error' => 'Token is required']);
        exit;
    }

    if (!isset($data['email']) || empty($data['email'])) {
        debug_log("Missing email");
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        exit;
    }

    $token = trim($data['token']);
    $email = trim($data['email']);
    
    // Basic email validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        debug_log("Invalid email format", $email);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }

    debug_log("Looking up user by email", $email);
    
    // Get user ID from email
    $userStmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $userStmt->execute(['email' => $email]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        debug_log("Email not found", $email);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid token or email']);
        exit;
    }

    $userId = $user['id'];
    debug_log("User found", ['user_id' => $userId]);
    
    // Check if the tokens table exists
    try {
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'password_reset_tokens'");
        
        if ($tableCheck->rowCount() === 0) {
            debug_log("Password reset tokens table not found");
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or expired token. Please request a new password reset.']);
            exit;
        }
    } catch (PDOException $e) {
        debug_log("Error checking tokens table", $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Server configuration error. Please contact the administrator.']);
        exit;
    }

    // Validate token
    $stmt = $pdo->prepare("SELECT * FROM password_reset_tokens WHERE user_id = :user_id AND token = :token AND expires_at > NOW()");
    $stmt->execute([
        'user_id' => $userId,
        'token' => $token
    ]);
    $resetToken = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$resetToken) {
        debug_log("Invalid or expired token", ['token' => $token, 'user_id' => $userId]);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired token. Please request a new password reset.']);
        exit;
    }

    // Token is valid
    debug_log("Token validated successfully", ['token' => $token, 'user_id' => $userId]);
    echo json_encode(['success' => true, 'message' => 'Token is valid']);
} catch (PDOException $e) {
    debug_log("Database error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
    debug_log("General error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An unexpected error occurred. Please try again later.']);
}
?>