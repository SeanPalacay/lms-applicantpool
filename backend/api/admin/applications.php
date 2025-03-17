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

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['action']) && $_GET['action'] === 'export') {
                // Handle export
                handleExport($pdo);
            } else if (isset($_GET['id'])) {
                // Get single application
                getSingleApplication($pdo, $_GET['id']);
            } else {
                // Get all applications with optional filters
                getAllApplications($pdo);
            }
            break;
            
        case 'POST':
            // Create application
            createApplication($pdo);
            break;
            
        case 'PUT':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Application ID is required']);
                exit;
            }
            // Update application (e.g., status)
            updateApplication($pdo, $_GET['id']);
            break;
            
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Application ID is required']);
                exit;
            }
            // Delete application
            deleteApplication($pdo, $_GET['id']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    error_log("Applications API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Applications API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get all applications with optional filters
 */
function getAllApplications($pdo) {
    // Build query with optional filters
    $query = "
        SELECT 
            a.id, a.user_id, a.program_id, a.job_role, a.department, 
            a.status, a.evaluation_score, a.fst_score, a.applied_at, a.updated_at,
            u.full_name, u.email, 
            p.title as program_title, p.type as program_type
        FROM applications a
        INNER JOIN users u ON a.user_id = u.id
        INNER JOIN programs p ON a.program_id = p.id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Add filters if provided
    if (isset($_GET['status']) && !empty($_GET['status'])) {
        $query .= " AND a.status = :status";
        $params[':status'] = $_GET['status'];
    }
    
    if (isset($_GET['program_id']) && !empty($_GET['program_id'])) {
        $query .= " AND a.program_id = :program_id";
        $params[':program_id'] = $_GET['program_id'];
    }
    
    if (isset($_GET['department']) && !empty($_GET['department'])) {
        $query .= " AND a.department = :department";
        $params[':department'] = $_GET['department'];
    }
    
    // Order by application date (newest first)
    $query .= " ORDER BY a.applied_at DESC";
    
    // For debugging
    error_log("Applications query: " . $query);
    error_log("Application params: " . print_r($params, true));
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($applications);
}

/**
 * Get a single application by ID
 */
function getSingleApplication($pdo, $id) {
    $query = "
        SELECT 
            a.id, a.user_id, a.program_id, a.job_role, a.department, 
            a.status, a.evaluation_score, a.fst_score, a.applied_at, a.updated_at,
            u.full_name, u.email, 
            p.title as program_title, p.type as program_type
        FROM applications a
        INNER JOIN users u ON a.user_id = u.id
        INNER JOIN programs p ON a.program_id = p.id
        WHERE a.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        exit;
    }
    
    $application = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get any documents for this application
    $docQuery = "
        SELECT r.id, r.file_path, r.description, r.created_at
        FROM records r
        WHERE r.user_id = :user_id 
        AND r.record_type = 'applicant'
        AND r.category = 'evaluations'
    ";
    
    $docStmt = $pdo->prepare($docQuery);
    $docStmt->bindParam(':user_id', $application['user_id'], PDO::PARAM_INT);
    $docStmt->execute();
    $documents = $docStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add documents to application data
    $application['documents'] = $documents;
    
    header('Content-Type: application/json');
    echo json_encode($application);
}

/**
 * Handle exporting applications data
 */
function handleExport($pdo) {
    $format = isset($_GET['format']) ? $_GET['format'] : 'csv';
    $query = "
        SELECT a.id, u.full_name, a.job_role, a.department, a.status, a.applied_at
        FROM applications a
        INNER JOIN users u ON a.user_id = u.id
        WHERE u.role = 'applicant'
        ORDER BY a.applied_at DESC
    ";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $applicants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($format === 'json') {
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="applicants_export_' . date('Y-m-d') . '.json"');
        echo json_encode($applicants);
    } else {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="applicants_export_' . date('Y-m-d') . '.csv"');
        $output = fopen('php://output', 'w');
        fputcsv($output, ['ID', 'Full Name', 'Job Role', 'Department', 'Status', 'Applied At']);
        foreach ($applicants as $applicant) {
            fputcsv($output, $applicant);
        }
        fclose($output);
    }
    exit;
}

/**
 * Create a new application
 */
function createApplication($pdo) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['user_id']) || !isset($data['program_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'User ID and Program ID are required']);
        exit;
    }
    
    // Check if application already exists for this user and program
    $checkQuery = "SELECT id FROM applications WHERE user_id = :user_id AND program_id = :program_id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
    $checkStmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        header('Content-Type: application/json');
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'Application already exists for this user and program']);
        exit;
    }
    
    // Insert the new application
    $query = "
        INSERT INTO applications (
            user_id, program_id, job_role, department, status
        ) VALUES (
            :user_id, :program_id, :job_role, :department, :status
        )
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
    $stmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
    $stmt->bindParam(':job_role', $data['job_role'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':department', $data['department'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':status', $data['status'] ?? 'pending', PDO::PARAM_STR);
    $stmt->execute();
    
    $applicationId = $pdo->lastInsertId();
    
    // Return the newly created application
    header('Content-Type: application/json');
    http_response_code(201); // Created
    echo json_encode([
        'id' => $applicationId,
        'user_id' => $data['user_id'],
        'program_id' => $data['program_id'],
        'job_role' => $data['job_role'] ?? null,
        'department' => $data['department'] ?? null,
        'status' => $data['status'] ?? 'pending',
        'applied_at' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Update an application (e.g., change status)
 */
function updateApplication($pdo, $id) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Build update query based on provided fields
    $updateFields = [];
    $params = [':id' => $id];
    
    if (isset($data['job_role'])) {
        $updateFields[] = "job_role = :job_role";
        $params[':job_role'] = $data['job_role'];
    }
    
    if (isset($data['department'])) {
        $updateFields[] = "department = :department";
        $params[':department'] = $data['department'];
    }
    
    if (isset($data['status'])) {
        $updateFields[] = "status = :status";
        $params[':status'] = $data['status'];
    }
    
    if (isset($data['evaluation_score'])) {
        $updateFields[] = "evaluation_score = :evaluation_score";
        $params[':evaluation_score'] = $data['evaluation_score'];
    }
    
    if (isset($data['fst_score'])) {
        $updateFields[] = "fst_score = :fst_score";
        $params[':fst_score'] = $data['fst_score'];
    }
    
    // If no fields to update, return error
    if (empty($updateFields)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    
    // Update the application
    $query = "UPDATE applications SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    
    // If no rows were affected, application doesn't exist
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        exit;
    }
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Application updated successfully']);
}

/**
 * Delete an application
 */
function deleteApplication($pdo, $id) {
    // Check if application exists
    $checkQuery = "SELECT id FROM applications WHERE id = :id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        exit;
    }
    
    // Begin transaction to ensure data integrity
    $pdo->beginTransaction();
    
    try {
        // First delete from applicant_pool_assignments (foreign key constraint)
        $deleteAssignmentsQuery = "DELETE FROM applicant_pool_assignments WHERE application_id = :id";
        $deleteAssignmentsStmt = $pdo->prepare($deleteAssignmentsQuery);
        $deleteAssignmentsStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $deleteAssignmentsStmt->execute();
        
        // Then delete the application
        $deleteQuery = "DELETE FROM applications WHERE id = :id";
        $deleteStmt = $pdo->prepare($deleteQuery);
        $deleteStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $deleteStmt->execute();
        
        // Commit the transaction
        $pdo->commit();
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Application deleted successfully']);
    } catch (Exception $e) {
        // Rollback on error
        $pdo->rollBack();
        throw $e;
    }
}