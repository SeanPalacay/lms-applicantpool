<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// Include auth helper
require_once '../../shared/auth_helper.php';

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string (for testing)
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

// Validate token and get user info
$userId = getUserIdFromToken($token);
if (!$userId) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

// Check user role (must be applicant)
$userRole = getUserRoleFromToken($token);
if ($userRole !== 'applicant') {
    header('Content-Type: application/json');
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. Only applicants can access this resource.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get a specific application
                getApplicationById($pdo, $userId, $_GET['id']);
            } else {
                // Get all applications for the current user
                getUserApplications($pdo, $userId);
            }
            break;
            
        case 'POST':
            // Submit a new application
            submitApplication($pdo, $userId);
            break;
            
        case 'PUT':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Application ID is required']);
                exit;
            }
            // Update an application (limited fields)
            updateApplication($pdo, $userId, $_GET['id']);
            break;
            
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Application ID is required']);
                exit;
            }
            // Withdraw an application (users can only delete their own pending applications)
            withdrawApplication($pdo, $userId, $_GET['id']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    error_log("Applicant Applications API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Applicant Applications API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Function to validate token and get user ID
 * This would be replaced with your actual token validation logic
 */
function getUserIdFromToken($token) {
    // Placeholder implementation - replace with your actual token validation
    global $pdo;
    
    // For this example, we'll assume the token is stored in a sessions table
    $query = "SELECT user_id FROM sessions WHERE token = :token AND expires_at > NOW()";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        return null;
    }
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result['user_id'];
}

/**
 * Get user role from token
 */
function getUserRoleFromToken($token) {
    global $pdo;
    
    // Get user ID from token
    $userId = getUserIdFromToken($token);
    if (!$userId) {
        return null;
    }
    
    // Get user role
    $query = "SELECT role FROM users WHERE id = :user_id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        return null;
    }
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result['role'];
}

/**
 * Get all applications for the current user
 */
function getUserApplications($pdo, $userId) {
    $query = "
        SELECT 
            a.id, a.user_id, a.program_id, a.job_role, a.department, 
            a.status, a.evaluation_score, a.fst_score, a.applied_at, a.updated_at,
            p.title as program_title, p.type as program_type, p.description as program_description
        FROM applications a
        INNER JOIN programs p ON a.program_id = p.id
        WHERE a.user_id = :user_id
        ORDER BY a.applied_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($applications);
}

/**
 * Get a specific application by ID (only if it belongs to the current user)
 */
function getApplicationById($pdo, $userId, $applicationId) {
    $query = "
        SELECT 
            a.id, a.user_id, a.program_id, a.job_role, a.department, 
            a.status, a.evaluation_score, a.fst_score, a.applied_at, a.updated_at,
            p.title as program_title, p.type as program_type, p.description as program_description
        FROM applications a
        INNER JOIN programs p ON a.program_id = p.id
        WHERE a.id = :application_id AND a.user_id = :user_id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found or does not belong to you']);
        exit;
    }
    
    $application = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get documents associated with this application
    $docQuery = "
        SELECT id, file_path, description, created_at
        FROM records
        WHERE user_id = :user_id 
        AND record_type = 'applicant'
        AND category = 'evaluations'
    ";
    
    $docStmt = $pdo->prepare($docQuery);
    $docStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $docStmt->execute();
    
    $application['documents'] = $docStmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($application);
}

/**
 * Submit a new application
 */
function submitApplication($pdo, $userId) {
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['program_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Program ID is required']);
        exit;
    }
    
    // Check if program exists
    $programQuery = "SELECT id FROM programs WHERE id = :program_id";
    $programStmt = $pdo->prepare($programQuery);
    $programStmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
    $programStmt->execute();
    
    if ($programStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Program not found']);
        exit;
    }
    
    // Check if user already applied to this program
    $checkQuery = "SELECT id FROM applications WHERE user_id = :user_id AND program_id = :program_id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $checkStmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        header('Content-Type: application/json');
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'You have already applied to this program']);
        exit;
    }
    
    // Insert application
    $query = "
        INSERT INTO applications (
            user_id, program_id, job_role, department, status, applied_at
        ) VALUES (
            :user_id, :program_id, :job_role, :department, 'pending', NOW()
        )
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
    $stmt->bindParam(':job_role', $data['job_role'], PDO::PARAM_STR);
    $stmt->bindParam(':department', $data['department'], PDO::PARAM_STR);
    $stmt->execute();
    
    $applicationId = $pdo->lastInsertId();
    
    // Save cover letter and additional info as notes if provided
    if (!empty($data['cover_letter']) || !empty($data['additional_info'])) {
        // Assuming a notes table or similar exists
        $content = "";
        if (!empty($data['cover_letter'])) {
            $content .= "Cover Letter:\n" . $data['cover_letter'] . "\n\n";
        }
        if (!empty($data['additional_info'])) {
            $content .= "Additional Information:\n" . $data['additional_info'];
        }
        
        // Add note to the application
        $noteQuery = "
            INSERT INTO application_notes (
                application_id, content, created_by, created_at
            ) VALUES (
                :application_id, :content, :user_id, NOW()
            )
        ";
        
        $noteStmt = $pdo->prepare($noteQuery);
        $noteStmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
        $noteStmt->bindParam(':content', $content, PDO::PARAM_STR);
        $noteStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $noteStmt->execute();
    }
    
    // Create a notification for the training staff
    $query = "
        INSERT INTO notifications (
            user_id, type, title, message, created_at
        ) SELECT 
            id, 'info', 'New Application Received', 
            CONCAT('A new application was submitted for the program: ', 
                  (SELECT title FROM programs WHERE id = :program_id)),
            NOW()
        FROM users
        WHERE role = 'trainer' OR role = 'administrator'
    ";
    
    $notifStmt = $pdo->prepare($query);
    $notifStmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
    $notifStmt->execute();
    
    // Get application details for response
    $getAppQuery = "
        SELECT 
            a.id, a.user_id, a.program_id, a.job_role, a.department, 
            a.status, a.applied_at,
            p.title as program_title
        FROM applications a
        INNER JOIN programs p ON a.program_id = p.id
        WHERE a.id = :application_id
    ";
    
    $getAppStmt = $pdo->prepare($getAppQuery);
    $getAppStmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
    $getAppStmt->execute();
    
    $application = $getAppStmt->fetch(PDO::FETCH_ASSOC);
    
    // Return success response
    header('Content-Type: application/json');
    http_response_code(201); // Created
    echo json_encode([
        'success' => true,
        'message' => 'Application submitted successfully',
        'application' => $application
    ]);
}

/**
 * Update an application (limited fields - applicants can only update certain fields)
 */
function updateApplication($pdo, $userId, $applicationId) {
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check if application exists and belongs to the user
    $checkQuery = "
        SELECT status FROM applications 
        WHERE id = :application_id AND user_id = :user_id
    ";
    
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
    $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found or does not belong to you']);
        exit;
    }
    
    $application = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    // Only allow updates if status is pending
    if ($application['status'] !== 'pending') {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['error' => 'You can only update pending applications']);
        exit;
    }
    
    // Build update query - only allow updating job_role and department
    $updateFields = [];
    $params = [
        ':application_id' => $applicationId,
        ':user_id' => $userId
    ];
    
    if (isset($data['job_role'])) {
        $updateFields[] = "job_role = :job_role";
        $params[':job_role'] = $data['job_role'];
    }
    
    if (isset($data['department'])) {
        $updateFields[] = "department = :department";
        $params[':department'] = $data['department'];
    }
    
    if (empty($updateFields)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        exit;
    }
    
    // Update application
    $query = "
        UPDATE applications 
        SET " . implode(", ", $updateFields) . ", updated_at = NOW()
        WHERE id = :application_id AND user_id = :user_id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Application updated successfully'
    ]);
}

/**
 * Withdraw an application (only if status is pending)
 */
function withdrawApplication($pdo, $userId, $applicationId) {
    // Check if application exists and belongs to the user
    $checkQuery = "
        SELECT status FROM applications 
        WHERE id = :application_id AND user_id = :user_id
    ";
    
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
    $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found or does not belong to you']);
        exit;
    }
    
    $application = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    // Only allow withdrawal if status is pending
    if ($application['status'] !== 'pending') {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['error' => 'You can only withdraw pending applications']);
        exit;
    }
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Delete from pool assignments if any
        $deleteAssignmentsQuery = "
            DELETE FROM applicant_pool_assignments
            WHERE application_id = :application_id
        ";
        
        $deleteAssignmentsStmt = $pdo->prepare($deleteAssignmentsQuery);
        $deleteAssignmentsStmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
        $deleteAssignmentsStmt->execute();
        
        // Delete application
        $deleteQuery = "
            DELETE FROM applications
            WHERE id = :application_id AND user_id = :user_id
        ";
        
        $deleteStmt = $pdo->prepare($deleteQuery);
        $deleteStmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
        $deleteStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $deleteStmt->execute();
        
        // Commit transaction
        $pdo->commit();
        
        // Return success response
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Application withdrawn successfully'
        ]);
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
}