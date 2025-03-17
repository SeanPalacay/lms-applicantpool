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

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Handle different HTTP methods
    switch ($method) {
        case 'GET':
            // Get pool assignments
            getPoolAssignments($pdo);
            break;
            
        case 'POST':
            // Create a new assignment
            createPoolAssignment($pdo);
            break;
            
        case 'DELETE':
            // Delete an assignment
            deletePoolAssignment($pdo);
            break;
            
        default:
            // Method not allowed
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    // Database error
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Other errors
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get applicants assigned to a pool
 */
function getPoolAssignments($pdo) {
    // Check if pool_id is provided
    if (!isset($_GET['pool_id']) || !is_numeric($_GET['pool_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid pool ID is required']);
        return;
    }
    
    $poolId = $_GET['pool_id'];
    
    // Query to get all applicants in the pool with their details
    $query = "
        SELECT 
            apa.id,
            apa.application_id,
            apa.pool_id,
            apa.assigned_at,
            a.user_id,
            a.program_id,
            a.job_role,
            a.department,
            a.status,
            a.evaluation_score,
            a.fst_score,
            a.applied_at,
            a.updated_at,
            u.full_name,
            u.email,
            p.title as program_title
        FROM 
            applicant_pool_assignments apa
        INNER JOIN 
            applications a ON apa.application_id = a.id
        INNER JOIN 
            users u ON a.user_id = u.id
        INNER JOIN 
            programs p ON a.program_id = p.id
        WHERE 
            apa.pool_id = :pool_id
        ORDER BY 
            apa.assigned_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
    $stmt->execute();
    
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($assignments);
}

/**
 * Create a new pool assignment
 */
function createPoolAssignment($pdo) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['application_id']) || !is_numeric($data['application_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid application ID is required']);
        return;
    }
    
    if (!isset($data['pool_id']) || !is_numeric($data['pool_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid pool ID is required']);
        return;
    }
    
    // Check if the application exists
    $checkAppQuery = "SELECT id FROM applications WHERE id = :id";
    $checkAppStmt = $pdo->prepare($checkAppQuery);
    $checkAppStmt->bindParam(':id', $data['application_id'], PDO::PARAM_INT);
    $checkAppStmt->execute();
    
    if ($checkAppStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        return;
    }
    
    // Check if the pool exists
    $checkPoolQuery = "SELECT id FROM applicant_pools WHERE id = :id";
    $checkPoolStmt = $pdo->prepare($checkPoolQuery);
    $checkPoolStmt->bindParam(':id', $data['pool_id'], PDO::PARAM_INT);
    $checkPoolStmt->execute();
    
    if ($checkPoolStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Applicant pool not found']);
        return;
    }
    
    // Check if this assignment already exists
    $checkAssignmentQuery = "
        SELECT id FROM applicant_pool_assignments 
        WHERE application_id = :application_id AND pool_id = :pool_id
    ";
    $checkAssignmentStmt = $pdo->prepare($checkAssignmentQuery);
    $checkAssignmentStmt->bindParam(':application_id', $data['application_id'], PDO::PARAM_INT);
    $checkAssignmentStmt->bindParam(':pool_id', $data['pool_id'], PDO::PARAM_INT);
    $checkAssignmentStmt->execute();
    
    if ($checkAssignmentStmt->rowCount() > 0) {
        header('Content-Type: application/json');
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'This application is already assigned to this pool']);
        return;
    }
    
    // Insert the new assignment
    $query = "
        INSERT INTO applicant_pool_assignments (application_id, pool_id)
        VALUES (:application_id, :pool_id)
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':application_id', $data['application_id'], PDO::PARAM_INT);
    $stmt->bindParam(':pool_id', $data['pool_id'], PDO::PARAM_INT);
    
    $stmt->execute();
    
    header('Content-Type: application/json');
    http_response_code(201); // Created
    echo json_encode(['success' => true, 'message' => 'Applicant assigned to pool']);
}

/**
 * Delete a pool assignment
 */
function deletePoolAssignment($pdo) {
    // Check if ID is provided
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid assignment ID is required']);
        return;
    }
    
    $id = $_GET['id'];
    
    // Delete the assignment
    $query = "DELETE FROM applicant_pool_assignments WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    // If no rows were affected, assignment doesn't exist
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Assignment not found']);
        return;
    }
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Assignment deleted successfully']);
}