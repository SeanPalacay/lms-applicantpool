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
            // Check if a specific pool ID is requested
            if (isset($_GET['id'])) {
                // Get a specific pool
                getApplicantPoolById($pdo, $_GET['id']);
            } else {
                // Get all pools
                getAllApplicantPools($pdo);
            }
            break;
            
        case 'POST':
            // Create a new pool
            createApplicantPool($pdo);
            break;
            
        case 'PUT':
            // Update an existing pool
            updateApplicantPool($pdo);
            break;
            
        case 'DELETE':
            // Delete a pool
            deleteApplicantPool($pdo);
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
 * Get all applicant pools
 */
function getAllApplicantPools($pdo) {
    // Basic query to get all pools
    $query = "
        SELECT 
            ap.id,
            ap.pool_name,
            ap.description,
            ap.created_by,
            ap.created_at,
            u.username as created_by_name,
            COUNT(apa.id) as applicant_count
        FROM 
            applicant_pools ap
        LEFT JOIN 
            applicant_pool_assignments apa ON ap.id = apa.pool_id
        LEFT JOIN
            users u ON ap.created_by = u.id
        GROUP BY 
            ap.id
        ORDER BY 
            ap.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $pools = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($pools);
}

/**
 * Get a specific applicant pool by ID
 */
function getApplicantPoolById($pdo, $id) {
    // Validate ID
    if (!is_numeric($id)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid pool ID']);
        return;
    }
    
    // Query to get the pool details
    $query = "
        SELECT 
            ap.id,
            ap.pool_name,
            ap.description,
            ap.created_by,
            ap.created_at,
            u.username as created_by_name,
            (SELECT COUNT(*) FROM applicant_pool_assignments apa WHERE apa.pool_id = ap.id) as applicant_count
        FROM 
            applicant_pools ap
        LEFT JOIN
            users u ON ap.created_by = u.id
        WHERE 
            ap.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $pool = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$pool) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Applicant pool not found']);
        return;
    }
    
    header('Content-Type: application/json');
    echo json_encode($pool);
}

/**
 * Create a new applicant pool
 */
function createApplicantPool($pdo) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['pool_name']) || empty($data['pool_name'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Pool name is required']);
        return;
    }
    
    // Get user ID from token (simplified for this example)
    // TODO: Replace with proper token-based user identification
    $userId = 1;
    
    // Insert the new pool
    $query = "
        INSERT INTO applicant_pools (pool_name, description, created_by)
        VALUES (:pool_name, :description, :created_by)
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':pool_name', $data['pool_name'], PDO::PARAM_STR);
    $stmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
    $stmt->bindParam(':created_by', $userId, PDO::PARAM_INT);
    
    $stmt->execute();
    $poolId = $pdo->lastInsertId();
    
    // Return the created pool
    $query = "
        SELECT 
            id, pool_name, description, created_by, created_at,
            0 as applicant_count
        FROM 
            applicant_pools
        WHERE 
            id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $poolId, PDO::PARAM_INT);
    $stmt->execute();
    
    $pool = $stmt->fetch(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    http_response_code(201); // Created
    echo json_encode($pool);
}

/**
 * Update an existing applicant pool
 */
function updateApplicantPool($pdo) {
    // Check if ID is provided
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid pool ID is required']);
        return;
    }
    
    $id = $_GET['id'];
    
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['pool_name']) || empty($data['pool_name'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Pool name is required']);
        return;
    }
    
    // Check if pool exists
    $checkQuery = "SELECT id FROM applicant_pools WHERE id = :id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Applicant pool not found']);
        return;
    }
    
    // Update the pool
    $query = "
        UPDATE applicant_pools
        SET pool_name = :pool_name, description = :description
        WHERE id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':pool_name', $data['pool_name'], PDO::PARAM_STR);
    $stmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    
    $stmt->execute();
    
    // Return the updated pool
    $query = "
        SELECT 
            id, pool_name, description, created_by, created_at,
            (SELECT COUNT(*) FROM applicant_pool_assignments apa WHERE apa.pool_id = applicant_pools.id) as applicant_count
        FROM 
            applicant_pools
        WHERE 
            id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $pool = $stmt->fetch(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($pool);
}

/**
 * Delete an applicant pool
 */
function deleteApplicantPool($pdo) {
    // Check if ID is provided
    if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Valid pool ID is required']);
        return;
    }
    
    $id = $_GET['id'];
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // First delete all assignments to this pool
        $deleteAssignmentsQuery = "DELETE FROM applicant_pool_assignments WHERE pool_id = :id";
        $deleteAssignmentsStmt = $pdo->prepare($deleteAssignmentsQuery);
        $deleteAssignmentsStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $deleteAssignmentsStmt->execute();
        
        // Then delete the pool
        $deletePoolQuery = "DELETE FROM applicant_pools WHERE id = :id";
        $deletePoolStmt = $pdo->prepare($deletePoolQuery);
        $deletePoolStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $deletePoolStmt->execute();
        
        // If no rows were affected, pool doesn't exist
        if ($deletePoolStmt->rowCount() === 0) {
            $pdo->rollBack();
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['error' => 'Applicant pool not found']);
            return;
        }
        
        // Commit transaction
        $pdo->commit();
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Applicant pool deleted successfully']);
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
}