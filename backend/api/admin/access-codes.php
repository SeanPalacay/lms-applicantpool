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
    // Handle the special action for sending email
    if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'send-email') {
        sendAccessCodeEmail($pdo);
        exit;
    }

    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                getAccessCodeById($pdo, $_GET['id']);
            } elseif (isset($_GET['user_id'])) {
                getAccessCodesByUser($pdo, $_GET['user_id']);
            } else {
                getAllAccessCodes($pdo);
            }
            break;
            
        case 'POST':
            createAccessCode($pdo);
            break;

        case 'PUT':
            updateAccessCode($pdo);
            break;
            
        case 'DELETE':
            deleteAccessCode($pdo);
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
 * Get all access codes
 */
function getAllAccessCodes($pdo) {
    $query = "
        SELECT 
            ac.id, ac.user_id, ac.code, ac.created_by, ac.created_at, ac.expires_at,
            u.full_name, u.username, u.email,
            creator.username as creator_username
        FROM 
            access_codes ac
        JOIN 
            users u ON ac.user_id = u.id
        LEFT JOIN 
            users creator ON ac.created_by = creator.id
        ORDER BY 
            ac.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $accessCodes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($accessCodes);
    exit;
}

/**
 * Get access code by ID
 */
function getAccessCodeById($pdo, $id) {
    if (!is_numeric($id)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid access code ID']);
        return;
    }
    
    $query = "
        SELECT 
            ac.id, ac.user_id, ac.code, ac.created_by, ac.created_at, ac.expires_at,
            u.full_name, u.username, u.email,
            creator.username as creator_username
        FROM 
            access_codes ac
        JOIN 
            users u ON ac.user_id = u.id
        LEFT JOIN 
            users creator ON ac.created_by = creator.id
        WHERE 
            ac.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $accessCode = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$accessCode) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Access code not found']);
        return;
    }
    
    header('Content-Type: application/json');
    echo json_encode($accessCode);
}

/**
 * Get access codes by user ID
 */
function getAccessCodesByUser($pdo, $userId) {
    if (!is_numeric($userId)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid user ID']);
        return;
    }
    
    $query = "
        SELECT 
            ac.id, ac.user_id, ac.code, ac.created_by, ac.created_at, ac.expires_at,
            u.full_name, u.username, u.email,
            creator.username as creator_username
        FROM 
            access_codes ac
        JOIN 
            users u ON ac.user_id = u.id
        LEFT JOIN 
            users creator ON ac.created_by = creator.id
        WHERE 
            ac.user_id = :user_id
        ORDER BY 
            ac.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $accessCodes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($accessCodes);
}

/**
 * Create a new access code
 */
function createAccessCode($pdo) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['user_id']) || !is_numeric($data['user_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid user ID is required']);
        return;
    }
    
    if (!isset($data['code']) || empty($data['code'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Access code is required']);
        return;
    }
    
    // Check if user exists and is an applicant
    $userQuery = "SELECT id, role FROM users WHERE id = :user_id";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
    $userStmt->execute();
    
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    if ($user['role'] !== 'applicant') {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Access codes can only be created for applicant users']);
        return;
    }
    
    // Check if code already exists
    $checkQuery = "SELECT id FROM access_codes WHERE code = :code";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':code', $data['code'], PDO::PARAM_STR);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        header('Content-Type: application/json');
        http_response_code(409);
        echo json_encode(['error' => 'Access code already exists']);
        return;
    }
    
    // Get current admin ID from session or token
    $createdBy = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
    // Set expiration date (default: 30 days from now)
    $expiresAt = isset($data['expires_at']) ? $data['expires_at'] : date('Y-m-d H:i:s', strtotime('+30 days'));
    
    $query = "
        INSERT INTO access_codes (user_id, code, created_by, expires_at)
        VALUES (:user_id, :code, :created_by, :expires_at)
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
    $stmt->bindParam(':code', $data['code'], PDO::PARAM_STR);
    $stmt->bindParam(':created_by', $createdBy, PDO::PARAM_INT);
    $stmt->bindParam(':expires_at', $expiresAt, PDO::PARAM_STR);
    
    $stmt->execute();
    $accessCodeId = $pdo->lastInsertId();
    
    $query = "
        SELECT 
            ac.id, ac.user_id, ac.code, ac.created_by, ac.created_at, ac.expires_at,
            u.full_name, u.username, u.email,
            creator.username as creator_username
        FROM 
            access_codes ac
        JOIN 
            users u ON ac.user_id = u.id
        LEFT JOIN 
            users creator ON ac.created_by = creator.id
        WHERE 
            ac.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $accessCodeId, PDO::PARAM_INT);
    $stmt->execute();
    
    $accessCode = $stmt->fetch(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    http_response_code(201);
    echo json_encode($accessCode);
}

/**
 * Update an access code
 */
function updateAccessCode($pdo) {
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid access code ID is required']);
        return;
    }
    
    $id = $_GET['id'];
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $checkQuery = "SELECT id FROM access_codes WHERE id = :id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Access code not found']);
        return;
    }
    
    $updateFields = [];
    $params = [];
    
    if (isset($data['code']) && !empty($data['code'])) {
        // Check if code already exists for another entry
        $checkCodeQuery = "SELECT id FROM access_codes WHERE code = :code AND id != :id";
        $checkCodeStmt = $pdo->prepare($checkCodeQuery);
        $checkCodeStmt->bindParam(':code', $data['code'], PDO::PARAM_STR);
        $checkCodeStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkCodeStmt->execute();
        
        if ($checkCodeStmt->rowCount() > 0) {
            header('Content-Type: application/json');
            http_response_code(409);
            echo json_encode(['error' => 'Access code already exists']);
            return;
        }
        
        $updateFields[] = "code = :code";
        $params[':code'] = $data['code'];
    }
    
    if (isset($data['expires_at'])) {
        $updateFields[] = "expires_at = :expires_at";
        $params[':expires_at'] = $data['expires_at'];
    }
    
    if (empty($updateFields)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        return;
    }
    
    $params[':id'] = $id;
    
    $query = "UPDATE access_codes SET " . implode(", ", $updateFields) . " WHERE id = :id";
    $stmt = $pdo->prepare($query);
    
    foreach ($params as $param => $value) {
        $stmt->bindValue($param, $value);
    }
    
    $stmt->execute();
    
    $query = "
        SELECT 
            ac.id, ac.user_id, ac.code, ac.created_by, ac.created_at, ac.expires_at,
            u.full_name, u.username, u.email,
            creator.username as creator_username
        FROM 
            access_codes ac
        JOIN 
            users u ON ac.user_id = u.id
        LEFT JOIN 
            users creator ON ac.created_by = creator.id
        WHERE 
            ac.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $accessCode = $stmt->fetch(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($accessCode);
}

/**
 * Delete an access code
 */
function deleteAccessCode($pdo) {
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid access code ID is required']);
        return;
    }
    
    $id = $_GET['id'];
    
    $checkQuery = "SELECT id FROM access_codes WHERE id = :id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Access code not found']);
        return;
    }
    
    $query = "DELETE FROM access_codes WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Access code deleted successfully']);
}

/**
 * Send access code email to user
 */
/**
 * Send access code email to user
 */
function sendAccessCodeEmail($pdo) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Validate required data (just as before)
    if (!isset($data['user_id']) || !isset($data['code']) || !isset($data['email'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Missing required data']);
        exit;
    }
    
    // Get user details
    $userId = $data['user_id'];
    $query = "SELECT full_name, username FROM users WHERE id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(1, $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get admin ID for logging
    $adminId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 1; // Default to admin ID 1 if not in session
    
    // Log the email that would have been sent
    $timestamp = date('Y-m-d H:i:s');
    $logQuery = "INSERT INTO user_activity (user_id, activity_type, activity_time, details) VALUES (?, ?, ?, ?)";
    $logStmt = $pdo->prepare($logQuery);
    $details = "DEV MODE: Access code " . $data['code'] . " would be emailed to " . $data['email'] . " for user ID " . $userId;
    
    $activityType = 'access_code_email';
    
    // Make sure we don't pass NULL to the user_id column
    if ($adminId === null) {
        // Either use a default admin ID
        $adminId = 1; // Change this to your default admin ID
    }
    
    $logStmt->bindParam(1, $adminId, PDO::PARAM_INT);
    $logStmt->bindParam(2, $activityType, PDO::PARAM_STR);
    $logStmt->bindParam(3, $timestamp, PDO::PARAM_STR);
    $logStmt->bindParam(4, $details, PDO::PARAM_STR);
    $logStmt->execute();
    
    // Create a log file with the email content for testing
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/email_' . time() . '.html';
    
    // Create the email content to log
    $messageHtml = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e88e5; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; background-color: #f8f9fa; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
            .code-box { background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 5px; padding: 15px; margin: 15px 0; font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; }
            .footer { background-color: #f1f1f1; padding: 10px 20px; border-radius: 0 0 5px 5px; border: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>LMS Forbes Access Code</h2>
            </div>
            <div class='content'>
                <p>Hello " . htmlspecialchars($user['full_name']) . ",</p>
                
                <p>Your access code for the Learning Management System has been created. Please use this code to log in to your account.</p>
                
                <p><strong>Username:</strong> " . htmlspecialchars($user['username']) . "</p>
                
                <div class='code-box'>" . htmlspecialchars($data['code']) . "</div>
                
                <p>This code will expire on: " . htmlspecialchars($data['expires_at']) . "</p>
                
                <p>Please keep this code secure and do not share it with others. If you have any questions or need assistance, please contact our support team.</p>
            </div>
            <div class='footer'>
                <p>This is an automated message from the development environment.</p>
                <p>To: " . htmlspecialchars($data['email']) . "</p>
                <p>&copy; " . date('Y') . " LMS Forbes. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    file_put_contents($logFile, $messageHtml);
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => '[DEV MODE] Access code would be sent to ' . $data['email'],
        'emailLogFile' => $logFile
    ]);
}
?>