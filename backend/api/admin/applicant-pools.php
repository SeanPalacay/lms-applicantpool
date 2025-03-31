<?php
// File: backend/api/admin/applicant-pools.php
// API endpoint for admin to manage applicant pools

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

// Get the logged-in user ID (you would normally extract this from the token)
// For demonstration, we'll use a simple mock user. In production, validate the token properly.
$userId = 1; // Assuming this is the admin user ID

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Handle different HTTP methods
    switch ($method) {
        case 'GET':
            // Check if a specific pool is requested
            if (isset($_GET['id'])) {
                getApplicantPoolById($pdo, $_GET['id']);
            } else {
                getApplicantPools($pdo);
            }
            break;
            
        case 'POST':
            // Create a new pool
            createApplicantPool($pdo, $userId);
            break;
            
        case 'PUT':
            // Update an existing pool
            if (isset($_GET['id'])) {
                updateApplicantPool($pdo, $_GET['id'], $userId);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Pool ID is required for updates']);
            }
            break;
            
        case 'DELETE':
            // Delete a pool
            if (isset($_GET['id'])) {
                deleteApplicantPool($pdo, $_GET['id']);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Pool ID is required for deletion']);
            }
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
function getApplicantPools($pdo) {
    $query = "
        SELECT 
            ap.id,
            ap.pool_name,
            ap.description,
            ap.department,
            ap.created_at,
            ap.created_by,
            u.username as created_by_name,
            COUNT(DISTINCT apa.id) as applicant_count
        FROM 
            applicant_pools ap
        LEFT JOIN
            users u ON ap.created_by = u.id
        LEFT JOIN
            applicant_pool_assignments apa ON ap.id = apa.pool_id
        GROUP BY 
            ap.id
        ORDER BY 
            ap.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $pools = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get positions for each pool
    foreach ($pools as &$pool) {
        $positionsQuery = "
            SELECT position_name
            FROM applicant_pool_positions
            WHERE pool_id = :pool_id
        ";
        
        $posStmt = $pdo->prepare($positionsQuery);
        $posStmt->bindParam(':pool_id', $pool['id'], PDO::PARAM_INT);
        $posStmt->execute();
        
        $positions = $posStmt->fetchAll(PDO::FETCH_COLUMN);
        $pool['positions'] = $positions;
    }

    header('Content-Type: application/json');
    echo json_encode($pools);
}

/**
 * Get a specific applicant pool by ID
 */
function getApplicantPoolById($pdo, $poolId) {
    $query = "
        SELECT 
            ap.id,
            ap.pool_name,
            ap.description,
            ap.department,
            ap.created_at,
            ap.created_by,
            u.username as created_by_name,
            COUNT(DISTINCT apa.id) as applicant_count
        FROM 
            applicant_pools ap
        LEFT JOIN
            users u ON ap.created_by = u.id
        LEFT JOIN
            applicant_pool_assignments apa ON ap.id = apa.pool_id
        WHERE 
            ap.id = :id
        GROUP BY 
            ap.id
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $poolId, PDO::PARAM_INT);
    $stmt->execute();

    $pool = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pool) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Applicant pool not found']);
        return;
    }

    // Get positions for this pool
    $positionsQuery = "
        SELECT position_name
        FROM applicant_pool_positions
        WHERE pool_id = :pool_id
    ";
    
    $posStmt = $pdo->prepare($positionsQuery);
    $posStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
    $posStmt->execute();
    
    $positions = $posStmt->fetchAll(PDO::FETCH_COLUMN);
    $pool['positions'] = $positions;

    header('Content-Type: application/json');
    echo json_encode($pool);
}

/**
 * Create a new applicant pool
 */
function createApplicantPool($pdo, $userId) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['pool_name']) || empty(trim($data['pool_name']))) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Pool name is required']);
        return;
    }

    if (!isset($data['department']) || empty(trim($data['department']))) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Department is required']);
        return;
    }

    // Begin transaction
    $pdo->beginTransaction();

    try {
        // Create the pool
        $insertPoolQuery = "
            INSERT INTO applicant_pools (pool_name, description, department, created_by)
            VALUES (:pool_name, :description, :department, :created_by)
        ";
        
        $insertPoolStmt = $pdo->prepare($insertPoolQuery);
        $insertPoolStmt->bindParam(':pool_name', $data['pool_name'], PDO::PARAM_STR);
        $insertPoolStmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
        $insertPoolStmt->bindParam(':department', $data['department'], PDO::PARAM_STR);
        $insertPoolStmt->bindParam(':created_by', $userId, PDO::PARAM_INT);
        $insertPoolStmt->execute();
        
        $poolId = $pdo->lastInsertId();
        
        // If positions are provided, add them to the pool
        if (isset($data['positions']) && is_array($data['positions']) && !empty($data['positions'])) {
            $insertPositionQuery = "
                INSERT INTO applicant_pool_positions (pool_id, position_name)
                VALUES (:pool_id, :position_name)
            ";
            
            $insertPositionStmt = $pdo->prepare($insertPositionQuery);
            
            foreach ($data['positions'] as $position) {
                $insertPositionStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
                $insertPositionStmt->bindParam(':position_name', $position, PDO::PARAM_STR);
                $insertPositionStmt->execute();
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Return the created pool
        $query = "
            SELECT 
                id,
                pool_name,
                description,
                department,
                created_at,
                created_by
            FROM 
                applicant_pools
            WHERE 
                id = :id
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id', $poolId, PDO::PARAM_INT);
        $stmt->execute();
        
        $pool = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get positions for this pool
        $positionsQuery = "
            SELECT position_name
            FROM applicant_pool_positions
            WHERE pool_id = :pool_id
        ";
        
        $posStmt = $pdo->prepare($positionsQuery);
        $posStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $posStmt->execute();
        
        $positions = $posStmt->fetchAll(PDO::FETCH_COLUMN);
        $pool['positions'] = $positions;
        
        header('Content-Type: application/json');
        http_response_code(201); // Created
        echo json_encode(['success' => true, 'data' => $pool]);
    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Update an existing applicant pool
 */
function updateApplicantPool($pdo, $poolId, $userId) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['pool_name']) || empty(trim($data['pool_name']))) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Pool name is required']);
        return;
    }

    if (!isset($data['department']) || empty(trim($data['department']))) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Department is required']);
        return;
    }

    // Check if the pool exists
    $checkPoolQuery = "SELECT id FROM applicant_pools WHERE id = :id";
    $checkPoolStmt = $pdo->prepare($checkPoolQuery);
    $checkPoolStmt->bindParam(':id', $poolId, PDO::PARAM_INT);
    $checkPoolStmt->execute();

    if ($checkPoolStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Applicant pool not found']);
        return;
    }

    // Begin transaction
    $pdo->beginTransaction();

    try {
        // Update the pool
        $updatePoolQuery = "
            UPDATE applicant_pools
            SET 
                pool_name = :pool_name,
                description = :description,
                department = :department
            WHERE id = :id
        ";
        
        $updatePoolStmt = $pdo->prepare($updatePoolQuery);
        $updatePoolStmt->bindParam(':pool_name', $data['pool_name'], PDO::PARAM_STR);
        $updatePoolStmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
        $updatePoolStmt->bindParam(':department', $data['department'], PDO::PARAM_STR);
        $updatePoolStmt->bindParam(':id', $poolId, PDO::PARAM_INT);
        $updatePoolStmt->execute();
        
        // Delete existing positions
        $deletePositionsQuery = "DELETE FROM applicant_pool_positions WHERE pool_id = :pool_id";
        $deletePositionsStmt = $pdo->prepare($deletePositionsQuery);
        $deletePositionsStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $deletePositionsStmt->execute();
        
        // If positions are provided, add them to the pool
        if (isset($data['positions']) && is_array($data['positions']) && !empty($data['positions'])) {
            $insertPositionQuery = "
                INSERT INTO applicant_pool_positions (pool_id, position_name)
                VALUES (:pool_id, :position_name)
            ";
            
            $insertPositionStmt = $pdo->prepare($insertPositionQuery);
            
            foreach ($data['positions'] as $position) {
                $insertPositionStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
                $insertPositionStmt->bindParam(':position_name', $position, PDO::PARAM_STR);
                $insertPositionStmt->execute();
            }
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Return the updated pool
        $query = "
            SELECT 
                id,
                pool_name,
                description,
                department,
                created_at,
                created_by
            FROM 
                applicant_pools
            WHERE 
                id = :id
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id', $poolId, PDO::PARAM_INT);
        $stmt->execute();
        
        $pool = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get positions for this pool
        $positionsQuery = "
            SELECT position_name
            FROM applicant_pool_positions
            WHERE pool_id = :pool_id
        ";
        
        $posStmt = $pdo->prepare($positionsQuery);
        $posStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $posStmt->execute();
        
        $positions = $posStmt->fetchAll(PDO::FETCH_COLUMN);
        $pool['positions'] = $positions;
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'data' => $pool]);
    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Delete an applicant pool
 */
function deleteApplicantPool($pdo, $poolId) {
    // Check if the pool exists
    $checkPoolQuery = "SELECT id FROM applicant_pools WHERE id = :id";
    $checkPoolStmt = $pdo->prepare($checkPoolQuery);
    $checkPoolStmt->bindParam(':id', $poolId, PDO::PARAM_INT);
    $checkPoolStmt->execute();

    if ($checkPoolStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Applicant pool not found']);
        return;
    }

    // Begin transaction
    $pdo->beginTransaction();

    try {
        // Delete positions for this pool
        $deletePositionsQuery = "DELETE FROM applicant_pool_positions WHERE pool_id = :pool_id";
        $deletePositionsStmt = $pdo->prepare($deletePositionsQuery);
        $deletePositionsStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $deletePositionsStmt->execute();
        
        // Delete pool assignments
        $deleteAssignmentsQuery = "DELETE FROM applicant_pool_assignments WHERE pool_id = :pool_id";
        $deleteAssignmentsStmt = $pdo->prepare($deleteAssignmentsQuery);
        $deleteAssignmentsStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $deleteAssignmentsStmt->execute();
        
        // Delete the pool
        $deletePoolQuery = "DELETE FROM applicant_pools WHERE id = :id";
        $deletePoolStmt = $pdo->prepare($deletePoolQuery);
        $deletePoolStmt->bindParam(':id', $poolId, PDO::PARAM_INT);
        $deletePoolStmt->execute();
        
        // Commit transaction
        $pdo->commit();
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Applicant pool deleted successfully']);
    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        throw $e;
    }
}
?>