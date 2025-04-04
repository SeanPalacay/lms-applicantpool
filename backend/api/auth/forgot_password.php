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
    debug_log("Starting forgot password process (no email)");
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
    debug_log("Received forgot password request", $input);
    
    // Decode and validate input
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        debug_log("Invalid JSON input", json_last_error_msg());
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    if (!isset($data['email']) || empty($data['email'])) {
        debug_log("Missing email");
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        exit;
    }

    $email = trim($data['email']);
    
    // Basic email validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        debug_log("Invalid email format", $email);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }

    debug_log("Checking if email exists", $email);
    
    // Check if email exists in the database
    $stmt = $pdo->prepare("SELECT id, username, full_name FROM users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Since we're in development without email, we'll tell the user directly
        debug_log("Email not found in database", $email);
        http_response_code(400);
        echo json_encode(['error' => 'Email address not found in our records']);
        exit;
    }

    debug_log("User found", $user);
    
    // Check if the tokens table exists, create it if not
    try {
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'password_reset_tokens'");
        
        if ($tableCheck->rowCount() === 0) {
            debug_log("Creating password_reset_tokens table");
            
            $createTable = $pdo->exec("
                CREATE TABLE `password_reset_tokens` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `user_id` int(11) NOT NULL,
                  `token` varchar(255) NOT NULL,
                  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                  `expires_at` timestamp NULL DEFAULT NULL,
                  PRIMARY KEY (`id`),
                  UNIQUE KEY `user_id` (`user_id`),
                  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            ");
            
            if ($createTable === false) {
                throw new PDOException("Failed to create token table");
            }
            
            debug_log("Token table created successfully");
        }
    } catch (PDOException $e) {
        debug_log("Error checking/creating tokens table", $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Server configuration error. Please contact the administrator.']);
        exit;
    }

    // Generate token
    $token = bin2hex(random_bytes(32));
    $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

    debug_log("Generated token", ['token' => $token, 'expires' => $expiry]);
    
    // Store token in database - first check if a reset token already exists
    $checkStmt = $pdo->prepare("SELECT id FROM password_reset_tokens WHERE user_id = :user_id");
    $checkStmt->execute(['user_id' => $user['id']]);
    $existingToken = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($existingToken) {
        // Update existing token
        debug_log("Updating existing token", $existingToken);
        
        $updateStmt = $pdo->prepare("UPDATE password_reset_tokens SET token = :token, expires_at = :expires_at, created_at = NOW() WHERE user_id = :user_id");
        $updateResult = $updateStmt->execute([
            'token' => $token,
            'expires_at' => $expiry,
            'user_id' => $user['id']
        ]);
        
        if (!$updateResult) {
            throw new PDOException("Failed to update token");
        }
    } else {
        // Create new token entry
        debug_log("Creating new token");
        
        $insertStmt = $pdo->prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)");
        $insertResult = $insertStmt->execute([
            'user_id' => $user['id'],
            'token' => $token,
            'expires_at' => $expiry
        ]);
        
        if (!$insertResult) {
            throw new PDOException("Failed to insert token");
        }
    }

    // Since we're not using email, we'll return the token directly to the frontend
    debug_log("Returning token to frontend for direct reset");
    echo json_encode([
        'success' => true,
        'message' => 'Password reset initiated',
        'token' => $token, 
        'email' => $email
    ]);
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