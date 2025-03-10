<?php
// Include CORS middleware
header("Access-Control-Allow-Origin: http://localhost:3000"); 
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

header("Content-Type: application/json");

// Function to log to a file for debugging
function debug_log($message, $data = null) {
    $log_file = "register_debug.log";
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

debug_log("Registration request received");

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
        
        // Validate required fields
        $required_fields = ['username', 'password', 'email', 'full_name', 'role'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                // Special case for full_name which might be constructed from first_name and last_name
                if ($field === 'full_name' && isset($data['first_name']) && isset($data['last_name'])) {
                    $data['full_name'] = $data['first_name'] . ' ' . $data['last_name'];
                } else {
                    debug_log("Missing required field", $field);
                    http_response_code(400);
                    echo json_encode(['error' => "Missing required field: $field"]);
                    exit;
                }
            }
        }
        
        // Sanitize inputs
        $username = htmlspecialchars(trim($data['username']));
        $password = $data['password'];
        $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
        $full_name = htmlspecialchars(trim($data['full_name']));
        $role = htmlspecialchars(trim($data['role']));
        
        // Validate email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            debug_log("Invalid email format", $email);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email format']);
            exit;
        }
        
        // Validate role (only allow specific roles as per schema)
        $allowedRoles = ['administrator', 'trainer', 'trainee', 'applicant'];
        if (!in_array($role, $allowedRoles)) {
            debug_log("Invalid role", $role);
            http_response_code(400);
            echo json_encode(['error' => 'Invalid role. Allowed roles are: administrator, trainer, trainee, applicant']);
            exit;
        }
        
        // Check if username or email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        $existingUser = $stmt->fetch();
        
        if ($existingUser) {
            debug_log("User already exists", ['username' => $username, 'email' => $email]);
            http_response_code(409); // Conflict
            echo json_encode(['error' => 'A user with this username or email already exists']);
            exit;
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert new user
        $stmt = $pdo->prepare("
            INSERT INTO users (
                username, 
                password, 
                full_name, 
                email, 
                role, 
                status, 
                created_at
            ) VALUES (?, ?, ?, ?, ?, 'active', NOW())
        ");
        
        $stmt->execute([
            $username,
            $hashedPassword,
            $full_name,
            $email,
            $role
        ]);
        
        $userId = $pdo->lastInsertId();
        
        // If registering as an applicant, add to applicants table
        if ($role === 'applicant') {
            $stmt = $pdo->prepare("
                INSERT INTO applicants (
                    user_id,
                    full_name,
                    status,
                    applied_at
                ) VALUES (?, ?, 'pending', NOW())
            ");
            
            $stmt->execute([
                $userId,
                $full_name
            ]);
        }
        
        debug_log("User registered successfully", ['id' => $userId, 'username' => $username, 'role' => $role]);
        
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful',
            'user_id' => $userId
        ]);
        
    } else {
        debug_log("Invalid request method", $_SERVER['REQUEST_METHOD']);
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    debug_log("Registration error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>