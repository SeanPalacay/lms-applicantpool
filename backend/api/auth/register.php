<?php
header("Access-Control-Allow-Origin: http://localhost:3000"); // Adjust to your frontend origin
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

function debug_log($message, $data = null) {
    $log_file = "register_debug.log";
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message";
    if ($data !== null) {
        $log_entry .= " " . json_encode($data);
    }
    file_put_contents($log_file, $log_entry . PHP_EOL, FILE_APPEND);
}

debug_log("Registration request received");

try {
    // Database connection
    require_once "../../config/db_config.php";
    if (!isset($pdo) || !$pdo) {
        debug_log("Database connection failed: PDO not initialized");
        throw new Exception("Database connection not available");
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    debug_log("Database connection successful");

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        debug_log("Invalid request method", $_SERVER['REQUEST_METHOD']);
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $json_data = file_get_contents("php://input");
    debug_log("Raw request data", $json_data);
    $data = json_decode($json_data, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        debug_log("JSON decode error", json_last_error_msg());
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data: ' . json_last_error_msg()]);
        exit;
    }

    // Validate required fields
    $required_fields = ['username', 'password', 'full_name', 'role'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            debug_log("Missing required field", $field);
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }

    // Sanitize inputs
    $username = htmlspecialchars(trim($data['username']));
    $password = $data['password'];
    $email = isset($data['email']) && !empty($data['email']) ? filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL) : null;
    $full_name = htmlspecialchars(trim($data['full_name']));
    $role = htmlspecialchars(trim($data['role']));

    // Validate email if provided
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        debug_log("Invalid email format", $email);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }

    // Validate role
    $allowedRoles = ['administrator', 'trainer', 'trainee', 'applicant'];
    if (!in_array($role, $allowedRoles)) {
        debug_log("Invalid role", $role);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid role']);
        exit;
    }

    // Check for existing user
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR (email = ? AND email IS NOT NULL)");
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        debug_log("User already exists", ['username' => $username, 'email' => $email]);
        http_response_code(409);
        echo json_encode(['error' => 'A user with this username or email already exists']);
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $stmt = $pdo->prepare("
        INSERT INTO users (username, password, full_name, email, role, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', NOW())
    ");
    $stmt->execute([$username, $hashedPassword, $full_name, $email, $role]);
    $userId = $pdo->lastInsertId();

    debug_log("User registered successfully", ['id' => $userId, 'username' => $username, 'role' => $role]);
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'user_id' => $userId
    ]);

} catch (Exception $e) {
    debug_log("Registration error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>