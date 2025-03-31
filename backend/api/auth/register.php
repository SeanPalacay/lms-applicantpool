<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

function debug_log($message, $data = null) {
    $log_file = "register_debug.log";
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message";
    if ($data !== null) $log_entry .= " " . json_encode($data);
    file_put_contents($log_file, $log_entry . PHP_EOL, FILE_APPEND);
}

debug_log("Registration request received");

try {
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

    $required_fields = ['first_name', 'last_name', 'email', 'password', 'role'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            debug_log("Missing required field", $field);
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }

    $first_name = htmlspecialchars(trim($data['first_name']));
    $last_name = htmlspecialchars(trim($data['last_name']));
    $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
    $password = $data['password'];
    $role = htmlspecialchars(trim($data['role']));
    $full_name = "$first_name $last_name";

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        debug_log("Invalid email format", $email);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }

    if ($role !== 'applicant') {
        debug_log("Invalid role for this endpoint", $role);
        http_response_code(400);
        echo json_encode(['error' => 'This registration endpoint is for applicants only']);
        exit;
    }

    // Generate unique username
    $base_username = strtolower($first_name[0] . $last_name);
    $username = $base_username;
    $suffix = 1;
    while (true) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if (!$stmt->fetch()) break;
        $username = $base_username . $suffix++;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

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
        'user_id' => $userId,
        'username' => $username
    ]);
} catch (Exception $e) {
    debug_log("Registration error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>