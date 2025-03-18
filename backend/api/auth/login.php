<?php
// Enable error reporting for troubleshooting
error_reporting(E_ALL);
ini_set('display_errors', 1); // Enable visible errors for debugging

// Include CORS headers directly (before any output)
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Set header for regular requests
header("Content-Type: application/json");

// Function to log to a file for debugging
function debug_log($message, $data = null) {
    $log_file = "login_debug.log";
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

debug_log("Login request received");

try {
    // Include database configuration
    require_once "../../config/db_config.php";
    
    // Check if $pdo is available from db_config.php
    if (!isset($pdo) || !$pdo) {
        debug_log("Database connection failed");
        throw new Exception("Database connection not available");
    }

    debug_log("Database connection successful");

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get request body
        $json_data = file_get_contents("php://input");
        debug_log("Raw request data", $json_data);
        
        $data = json_decode($json_data, true);
        debug_log("Decoded data", $data);
        
        // Validate data
        if (!isset($data['username']) || !isset($data['password']) || 
            empty($data['username']) || empty($data['password'])) {
            debug_log("Missing username or password");
            http_response_code(400);
            echo json_encode(['error' => 'Username and password are required']);
            exit;
        }
        
        $username = $data['username'];
        $password = $data['password'];
        
        debug_log("Attempting to authenticate", ["username" => $username, "password_length" => strlen($password)]);
        
        // Check if we should use username or email field
        $stmt = $pdo->prepare("SHOW COLUMNS FROM users");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        debug_log("Table columns", $columns);
        
        $useEmailAsUsername = in_array('email', $columns);
        
        // Query for user by username or email
        if ($useEmailAsUsername) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :username OR username = :username");
        } else {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
        }
        
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        debug_log("User query result", $user ? ["id" => $user['id'], "found" => true] : ["found" => false]);
        
        if (!$user) {
            debug_log("User not found", ['username' => $username]);
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
            exit;
        }
        
        // Verify password
        debug_log("Stored password hash", $user['password']);
        $passwordMatch = password_verify($password, $user['password']);
        debug_log("Password verification result", $passwordMatch ? "matched" : "failed");
        
        // If password matches
        if ($passwordMatch) {
            debug_log("Authentication successful");
            
            // Update last login time if column exists
            if (in_array('last_login', $columns)) {
                $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
                $updateStmt->execute(['id' => $user['id']]);
            }
            
            // Generate token (simple base64 encode, not secure for production)
            $token = base64_encode($user['id'] . ':' . time());
            
            // Determine role and full name
            $role = $user['role'] ?? '';
            
            $fullName = '';
            if (isset($user['full_name']) && !empty($user['full_name'])) {
                $fullName = $user['full_name'];
            } elseif (isset($user['first_name']) && isset($user['last_name'])) {
                $fullName = $user['first_name'] . ' ' . $user['last_name'];
            } else {
                $fullName = $user['username'];
            }
            
            // Return success response
            $response = [
                'token' => $token,
                'role' => $role,
                'full_name' => $fullName,
                'user_id' => $user['id'] // Add user_id for compatibility
            ];
            
            debug_log("Login successful, returning data", $response);
            echo json_encode($response);
        } else {
            debug_log("Password verification failed");
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
        }
    } else {
        // Method not allowed
        debug_log("Invalid request method: " . $_SERVER['REQUEST_METHOD']);
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    // Log the error
    debug_log("Login error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>