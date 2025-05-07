<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string (for testing or file downloads)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// Simple token check (for demonstration)
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                getUserById($pdo, $_GET['id']);
            } else if (isset($_GET['action']) && $_GET['action'] === 'export') {
                exportUsers($pdo, isset($_GET['format']) ? $_GET['format'] : 'csv');
            } else {
                getAllUsers($pdo);
            }
            break;
            
        case 'POST':
            createUser($pdo);
            break;
            
        case 'PUT':
            updateUser($pdo);
            break;
            
        case 'DELETE':
            deleteUser($pdo);
            break;
            
        default:
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get all users
 */
function getAllUsers($pdo) {
    $query = "
        SELECT 
            u.id, u.username, u.full_name, u.email, u.role, u.status, u.created_at, u.last_login,
            u.position_id, jp.position_name AS position_name
        FROM 
            users u
        LEFT JOIN 
            job_positions jp ON u.position_id = jp.id
        ORDER BY 
            u.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($users);
    exit;
}

/**
 * Get a specific user by ID
 */
function getUserById($pdo, $id) {
    if (!is_numeric($id)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid user ID']);
        return;
    }
    
    $query = "
        SELECT 
            u.id, u.username, u.full_name, u.email, u.role, u.status, u.created_at, u.last_login,
            u.position_id, jp.position_name AS position_name
        FROM 
            users u
        LEFT JOIN 
            job_positions jp ON u.position_id = jp.id
        WHERE 
            u.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    header('Content-Type: application/json');
    echo json_encode($user);
}   

/**
 * Create a new user
 */
/**
 * Create a new user
 */
function createUser($pdo) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['username']) || empty($data['username'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Username is required']);
        return;
    }
    
    if (!isset($data['password']) || empty($data['password'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Password is required']);
        return;
    }
    
    if (!isset($data['full_name']) || empty($data['full_name'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Full name is required']);
        return;
    }
    
    if (!isset($data['email']) || empty($data['email'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        return;
    }
    
    $checkQuery = "SELECT id FROM users WHERE username = :username";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':username', $data['username'], PDO::PARAM_STR);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        header('Content-Type: application/json');
        http_response_code(409);
        echo json_encode(['error' => 'Username already exists']);
        return;
    }
    
    $checkEmailQuery = "SELECT id FROM users WHERE email = :email";
    $checkEmailStmt = $pdo->prepare($checkEmailQuery);
    $checkEmailStmt->bindParam(':email', $data['email'], PDO::PARAM_STR);
    $checkEmailStmt->execute();
    
    if ($checkEmailStmt->rowCount() > 0) {
        header('Content-Type: application/json');
        http_response_code(409);
        echo json_encode(['error' => 'Email already exists']);
        return;
    }
    
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    $role = isset($data['role']) ? $data['role'] : 'trainee';
    $status = isset($data['status']) ? $data['status'] : 'active';
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        $query = "
            INSERT INTO users (username, password, full_name, email, role, status)
            VALUES (:username, :password, :full_name, :email, :role, :status)
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':username', $data['username'], PDO::PARAM_STR);
        $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
        $stmt->bindParam(':full_name', $data['full_name'], PDO::PARAM_STR);
        $stmt->bindParam(':email', $data['email'], PDO::PARAM_STR);
        $stmt->bindParam(':role', $role, PDO::PARAM_STR);
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        
        $stmt->execute();
        $userId = $pdo->lastInsertId();
        
        // If this is an applicant user and access_code is provided, create an access code
        if ($role === 'applicant' && isset($data['access_code']) && !empty($data['access_code'])) {
            $createdBy = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
            $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
            
            $accessCodeQuery = "
                INSERT INTO access_codes (user_id, code, created_by, expires_at)
                VALUES (:user_id, :code, :created_by, :expires_at)
            ";
            
            $accessCodeStmt = $pdo->prepare($accessCodeQuery);
            $accessCodeStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $accessCodeStmt->bindParam(':code', $data['access_code'], PDO::PARAM_STR);
            $accessCodeStmt->bindParam(':created_by', $createdBy, PDO::PARAM_INT);
            $accessCodeStmt->bindParam(':expires_at', $expiresAt, PDO::PARAM_STR);
            
            $accessCodeStmt->execute();
        }
        
        $pdo->commit();
        
        $query = "
            SELECT 
                id, username, full_name, email, role, status, created_at, last_login
            FROM 
                users
            WHERE 
                id = :id
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Add access code to response if applicable
        if ($role === 'applicant' && isset($data['access_code']) && !empty($data['access_code'])) {
            $user['access_code'] = $data['access_code'];
        }
        
        header('Content-Type: application/json');
        http_response_code(201);
        echo json_encode($user);
    } catch (Exception $e) {
        $pdo->rollBack();
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user: ' . $e->getMessage()]);
    }
}

/**
 * Update an existing user
 */
function updateUser($pdo) {
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid user ID is required']);
        return;
    }
    
    $id = $_GET['id'];
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['full_name']) || empty($data['full_name'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Full name is required']);
        return;
    }
    
    if (!isset($data['email']) || empty($data['email'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        return;
    }
    
    $checkQuery = "SELECT id, password FROM users WHERE id = :id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    
    $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    $checkEmailQuery = "SELECT id FROM users WHERE email = :email AND id != :id";
    $checkEmailStmt = $pdo->prepare($checkEmailQuery);
    $checkEmailStmt->bindParam(':email', $data['email'], PDO::PARAM_STR);
    $checkEmailStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkEmailStmt->execute();
    
    if ($checkEmailStmt->rowCount() > 0) {
        header('Content-Type: application/json');
        http_response_code(409);
        echo json_encode(['error' => 'Email already exists for another user']);
        return;
    }
    
    $updateFields = [];
    $params = [];
    
    $updateFields[] = "full_name = :full_name";
    $params[':full_name'] = $data['full_name'];
    
    $updateFields[] = "email = :email";
    $params[':email'] = $data['email'];
    
    if (isset($data['current_password']) && isset($data['password'])) {
        if (!password_verify($data['current_password'], $user['password'])) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['error' => 'Current password is incorrect']);
            return;
        }
        
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $updateFields[] = "password = :password";
        $params[':password'] = $hashedPassword;
    }
    
    if (isset($data['role'])) {
        $updateFields[] = "role = :role";
        $params[':role'] = $data['role'];
    }
    
    if (isset($data['status'])) {
        $updateFields[] = "status = :status";
        $params[':status'] = $data['status'];
    }
    
    if (isset($data['position_id'])) {
        if ($data['position_id'] === null || $data['position_id'] === '') {
            $updateFields[] = "position_id = NULL";
        } else {
            // Verify position_id exists and is active
            $checkPositionQuery = "SELECT id FROM job_positions WHERE id = :position_id AND is_active = 1";
            $checkPositionStmt = $pdo->prepare($checkPositionQuery);
            $checkPositionStmt->bindParam(':position_id', $data['position_id'], PDO::PARAM_INT);
            $checkPositionStmt->execute();
            
            if ($checkPositionStmt->rowCount() === 0) {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Invalid or inactive position ID']);
                return;
            }
            
            $updateFields[] = "position_id = :position_id";
            $params[':position_id'] = $data['position_id'];
        }
    }
    
    $params[':id'] = $id;
    
    $query = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = :id";
    $stmt = $pdo->prepare($query);
    
    foreach ($params as $param => $value) {
        $stmt->bindValue($param, $value);
    }
    
    $stmt->execute();
    
    $query = "
        SELECT 
            u.id, u.username, u.full_name, u.email, u.role, u.status, u.created_at, u.last_login,
            u.position_id, jp.position_name AS position_name
        FROM 
            users u
        LEFT JOIN 
            job_positions jp ON u.position_id = jp.id
        WHERE 
            u.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($updatedUser);
}

/**
 * Delete a user
 */
function deleteUser($pdo) {
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid user ID is required']);
        return;
    }
    
    $id = $_GET['id'];
    
    $checkQuery = "SELECT id FROM users WHERE id = :id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Delete related records (adjust based on your database schema)
        $tables = [
            'user_activity' => 'user_id',
            'program_enrollments' => 'user_id',
            'milestone_progress' => 'user_id',
            'quiz_attempts' => 'user_id',
            'notifications' => 'user_id',
            'performance_incidents' => 'user_id',
            'performance_incidents' => 'reported_by'
        ];
        
        foreach ($tables as $table => $column) {
            $query = "DELETE FROM $table WHERE $column = :id";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
        }
        
        // Delete the user
        $query = "DELETE FROM users WHERE id = :id";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $pdo->commit();
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete user: ' . $e->getMessage()]);
    }
}

/**
 * Export users in CSV or JSON format
 */
function exportUsers($pdo, $format = 'csv') {
    $query = "
        SELECT 
            id, username, full_name, email, role, status, created_at, last_login
        FROM 
            users
        ORDER BY 
            created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($format === 'json') {
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="users_export_' . date('Y-m-d') . '.json"');
        echo json_encode($users);
    } else {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="users_export_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        fputcsv($output, ['ID', 'Username', 'Full Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login']);
        
        foreach ($users as $user) {
            fputcsv($output, $user);
        }
        
        fclose($output);
    }
    
    exit;
}
?>