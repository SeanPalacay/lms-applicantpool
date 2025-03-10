<?php
require_once __DIR__ . '/../config/db_config.php';

// Function for mysqli authentication
function authenticateUser($username, $password) {
    global $conn;
    $stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            return $user;
        }
    }
    return false;
}

function createUserSession($user) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['role'] = $user['role']; // Set both for compatibility
}

// Auth class for PDO
class Auth {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function login($username, $password) {
        try {
            $stmt = $this->db->prepare("SELECT id, username, password, role, status FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && password_verify($password, $user['password'])) {
                if ($user['status'] !== 'active' && isset($user['status'])) {
                    error_log("Login failed: Account inactive for user $username");
                    return [
                        'success' => false,
                        'message' => 'Your account is inactive. Please contact an administrator.'
                    ];
                }
                
                // Set session variables
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['user_role'] = $user['role'];
                $_SESSION['role'] = $user['role']; // Set both for compatibility
                $_SESSION['login_time'] = time();
                
                // Make sure session is written
                session_write_close();
                session_start();
                
                // Log successful login
                error_log("User {$user['username']} (ID: {$user['id']}, Role: {$user['role']}) logged in successfully. Session ID: " . session_id());
                
                // Update last login time
                $updateStmt = $this->db->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
                $updateStmt->execute([$user['id']]);
                
                return [
                    'success' => true,
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'role' => $user['role']
                ];
            }
            
            error_log("Login failed: Invalid credentials for user $username");
            return [
                'success' => false,
                'message' => 'Invalid username or password.'
            ];
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Login error: ' . $e->getMessage()
            ];
        }
}
    
    public function isLoggedIn() {
        return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    }
    
    public function hasRole($requiredRole) {
        if (!$this->isLoggedIn()) {
            error_log("Auth check failed: Not logged in");
            return false;
        }
        
        $userRole = $_SESSION['user_role'] ?? $_SESSION['role'] ?? '';
        error_log("Auth check: User role is '$userRole', required role is '$requiredRole'");
        
        // Administrator can access everything
        if ($userRole === 'administrator') {
            error_log("Auth check passed: User is administrator");
            return true;
        }
        
        $result = ($userRole === $requiredRole);
        error_log("Auth check result: " . ($result ? "Passed" : "Failed"));
        return $result;
    }
    
    public function getCurrentUser() {
        if (!$this->isLoggedIn()) {
            return null;
        }
        
        try {
            $stmt = $this->db->prepare("SELECT id, username, email, first_name, last_name, role, status FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            return null;
        }
    }
    
    public function logout() {
        $_SESSION = [];
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        session_destroy();
        return true;
    }
}