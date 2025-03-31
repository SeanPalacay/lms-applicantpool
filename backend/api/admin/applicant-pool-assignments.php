<?php
// File: backend/api/admin/applicant-pool-assignments.php
// API endpoint for admin to manage applicant pool assignments

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
            // Get applicants for a specific pool
            if (isset($_GET['pool_id'])) {
                getApplicantsByPool($pdo, $_GET['pool_id']);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Pool ID is required']);
            }
            break;
            
        case 'POST':
            // Assign an applicant to a pool
            assignApplicantToPool($pdo);
            break;
            
        case 'DELETE':
            // Remove an applicant from a pool
            if (isset($_GET['id'])) {
                removeApplicantFromPool($pdo, $_GET['id']);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Assignment ID is required']);
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
 * Get applicants for a specific pool
 */
function getApplicantsByPool($pdo, $poolId) {
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

    // Get applicants for this pool
    $query = "
        SELECT 
            apa.id,
            apa.application_id,
            apa.pool_id,
            apa.assigned_at,
            a.id as application_id,
            a.user_id,
            a.job_role,
            a.department,
            a.status,
            a.evaluation_score,
            a.fst_score,
            a.applied_at,
            a.updated_at,
            u.full_name
        FROM 
            applicant_pool_assignments apa
        INNER JOIN 
            applications a ON apa.application_id = a.id
        INNER JOIN 
            users u ON a.user_id = u.id
        WHERE 
            apa.pool_id = :pool_id
        ORDER BY 
            apa.assigned_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
    $stmt->execute();

    $applicants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: application/json');
    echo json_encode($applicants);
}

/**
 * Assign an applicant to a pool
 */
function assignApplicantToPool($pdo) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['application_id']) || !is_numeric($data['application_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Application ID is required']);
        return;
    }

    if (!isset($data['pool_id']) || !is_numeric($data['pool_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Pool ID is required']);
        return;
    }

    // Check if the application exists
    $checkApplicationQuery = "SELECT id FROM applications WHERE id = :id";
    $checkApplicationStmt = $pdo->prepare($checkApplicationQuery);
    $checkApplicationStmt->bindParam(':id', $data['application_id'], PDO::PARAM_INT);
    $checkApplicationStmt->execute();

    if ($checkApplicationStmt->rowCount() === 0) {
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

    // Check if the application is already assigned to this pool
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
        echo json_encode(['error' => 'Application is already assigned to this pool']);
        return;
    }

    // Create the assignment
    $insertAssignmentQuery = "
        INSERT INTO applicant_pool_assignments (application_id, pool_id)
        VALUES (:application_id, :pool_id)
    ";
    
    $insertAssignmentStmt = $pdo->prepare($insertAssignmentQuery);
    $insertAssignmentStmt->bindParam(':application_id', $data['application_id'], PDO::PARAM_INT);
    $insertAssignmentStmt->bindParam(':pool_id', $data['pool_id'], PDO::PARAM_INT);
    $insertAssignmentStmt->execute();
    
    $assignmentId = $pdo->lastInsertId();
    
    // Get the created assignment details
    $query = "
        SELECT 
            apa.id,
            apa.application_id,
            apa.pool_id,
            apa.assigned_at,
            a.job_role,
            a.department,
            a.status,
            a.applied_at,
            u.full_name
        FROM 
            applicant_pool_assignments apa
        INNER JOIN 
            applications a ON apa.application_id = a.id
        INNER JOIN 
            users u ON a.user_id = u.id
        WHERE 
            apa.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $assignmentId, PDO::PARAM_INT);
    $stmt->execute();
    
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    http_response_code(201); // Created
    echo json_encode(['success' => true, 'data' => $assignment]);
}

/**
 * Remove an applicant from a pool and delete the application
 */
function removeApplicantFromPool($pdo, $assignmentId) {
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Check if the assignment exists and get the application_id
        $checkAssignmentQuery = "SELECT application_id FROM applicant_pool_assignments WHERE id = :id";
        $checkAssignmentStmt = $pdo->prepare($checkAssignmentQuery);
        $checkAssignmentStmt->bindParam(':id', $assignmentId, PDO::PARAM_INT);
        $checkAssignmentStmt->execute();

        $assignment = $checkAssignmentStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$assignment) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['error' => 'Assignment not found']);
            return;
        }
        
        $applicationId = $assignment['application_id'];
        
        // 1. Delete the assignment from applicant_pool_assignments
        $deleteAssignmentQuery = "DELETE FROM applicant_pool_assignments WHERE id = :id";
        $deleteAssignmentStmt = $pdo->prepare($deleteAssignmentQuery);
        $deleteAssignmentStmt->bindParam(':id', $assignmentId, PDO::PARAM_INT);
        $deleteAssignmentStmt->execute();
        
        // 2. Delete the application from applications table
        $deleteApplicationQuery = "DELETE FROM applications WHERE id = :id";
        $deleteApplicationStmt = $pdo->prepare($deleteApplicationQuery);
        $deleteApplicationStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
        $deleteApplicationStmt->execute();
        
        // Commit transaction
        $pdo->commit();
        
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Applicant completely deleted from the system',
            'data' => [
                'assignment_id' => $assignmentId,
                'application_id' => $applicationId
            ]
        ]);
    } catch (Exception $e) {
        // Rollback in case of error
        $pdo->rollBack();
        
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Error deleting applicant: ' . $e->getMessage()]);
    }
}
?>