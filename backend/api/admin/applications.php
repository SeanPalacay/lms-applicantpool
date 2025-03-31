<?php
// admin/applications.php

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Error logging for debugging
error_log('Applications Request received: ' . $_SERVER['REQUEST_METHOD'] . ' ' . $_SERVER['REQUEST_URI']);
error_log('GET params: ' . json_encode($_GET));

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
            if (isset($_GET['id'])) {
                getApplicationById($pdo, $_GET['id']);
            } else {
                getApplications($pdo);
            }
            break;
            
        case 'PUT':
            if (isset($_GET['id'])) {
                updateApplication($pdo, $_GET['id']);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Missing application ID']);
            }
            break;
            
        case 'DELETE':
            if (isset($_GET['id'])) {
                deleteApplication($pdo, $_GET['id']);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Missing application ID']);
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
    error_log('PDO Error: ' . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Other errors
    error_log('General Error: ' . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get applications with optional filters
 */
function getApplications($pdo) {
    error_log('Getting applications with filters: ' . json_encode($_GET));
    
    // Base query
    $baseQuery = "
        SELECT 
            a.*, 
            u.full_name, 
            u.email, 
            jp.department as position_department
        FROM 
            applications a
        JOIN 
            users u ON a.user_id = u.id
        LEFT JOIN 
            job_positions jp ON a.job_role = jp.position_name
        WHERE 1=1
    ";
    
    $params = [];
    
    // Add status filter
    if (isset($_GET['status']) && !empty($_GET['status']) && $_GET['status'] !== 'all') {
        $baseQuery .= " AND a.status = :status";
        $params[':status'] = $_GET['status'];
    }
    
    // Add department filter
    if (isset($_GET['department']) && !empty($_GET['department']) && $_GET['department'] !== 'all') {
        $baseQuery .= " AND (a.department = :department OR jp.department = :department)";
        $params[':department'] = $_GET['department'];
    }
    
    // Add search filter
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $search = '%' . $_GET['search'] . '%';
        $baseQuery .= " AND (u.full_name LIKE :search OR u.email LIKE :search OR a.job_role LIKE :search)";
        $params[':search'] = $search;
    }
    
    // Add order by
    $baseQuery .= " ORDER BY a.applied_at DESC";
    
    // Log the query for debugging
    error_log('SQL Query: ' . $baseQuery);
    error_log('Params: ' . json_encode($params));
    
    // Prepare and execute
    $stmt = $pdo->prepare($baseQuery);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Log the results for debugging
    error_log('Found ' . count($applications) . ' applications');
    
    header('Content-Type: application/json');
    echo json_encode($applications);
}

/**
 * Get a specific application by ID
 */
function getApplicationById($pdo, $id) {
    error_log('Getting application with ID: ' . $id);
    
    // Verify the ID is numeric
    if (!is_numeric($id)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid application ID']);
        return;
    }
    
    // Query to get application details
    $query = "
        SELECT 
            a.*, 
            u.full_name, 
            u.email, 
            u.phone, 
            u.address,
            jp.department as position_department
        FROM 
            applications a
        JOIN 
            users u ON a.user_id = u.id
        LEFT JOIN 
            job_positions jp ON a.job_role = jp.position_name
        WHERE 
            a.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        return;
    }
    
    $application = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get pools the application is assigned to
    $poolsQuery = "
        SELECT 
            ap.* 
        FROM 
            applicant_pool_assignments apa
        JOIN 
            applicant_pools ap ON apa.pool_id = ap.id
        WHERE 
            apa.application_id = :application_id
    ";
    
    $poolsStmt = $pdo->prepare($poolsQuery);
    $poolsStmt->bindParam(':application_id', $id, PDO::PARAM_INT);
    $poolsStmt->execute();
    
    $pools = $poolsStmt->fetchAll(PDO::FETCH_ASSOC);
    $application['pools'] = $pools;
    
    header('Content-Type: application/json');
    echo json_encode($application);
}

/**
 * Update an application (typically status)
 */
function updateApplication($pdo, $id) {
    error_log('Updating application with ID: ' . $id);
    
    // Verify the ID is numeric
    if (!is_numeric($id)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid application ID']);
        return;
    }
    
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);
    error_log('Update data: ' . json_encode($data));
    
    // Check if application exists and get user ID
    $checkQuery = "SELECT user_id FROM applications WHERE id = :id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        return;
    }
    
    $applicationData = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $applicantUserId = $applicationData['user_id'];
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Build update fields
        $updateFields = [];
        $params = [':id' => $id]; // Start with ID parameter
        
        // Check for fields to update
        if (isset($data['status'])) {
            $updateFields[] = "status = :status";
            $params[':status'] = $data['status'];
            
            // Set notification variables based on status
            $notificationTitle = "Application Status Updated";
            $notificationMessage = "Your application status has been updated to " . ucfirst($data['status']) . ".";
            $notificationType = ($data['status'] === 'rejected') ? 'error' : 
                              (($data['status'] === 'hired') ? 'success' : 
                              (($data['status'] === 'shortlisted') ? 'success' : 'info'));
        }
        
        if (isset($data['evaluation_score'])) {
            $updateFields[] = "evaluation_score = :evaluation_score";
            $params[':evaluation_score'] = $data['evaluation_score'];
        }
        
        if (isset($data['fst_score'])) {
            $updateFields[] = "fst_score = :fst_score";
            $params[':fst_score'] = $data['fst_score'];
        }
        
        if (isset($data['job_role'])) {
            $updateFields[] = "job_role = :job_role";
            $params[':job_role'] = $data['job_role'];
        }
        
        if (isset($data['department'])) {
            $updateFields[] = "department = :department";
            $params[':department'] = $data['department'];
        }
        
        // If no fields to update
        if (empty($updateFields)) {
            header('Content-Type: application/json');
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        // Build and execute update query
        $updateQuery = "UPDATE applications SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = :id";
        $updateStmt = $pdo->prepare($updateQuery);
        
        foreach ($params as $key => $value) {
            $updateStmt->bindValue($key, $value);
        }
        
        $updateStmt->execute();
        
        // Create notification if status was updated
        if (isset($data['status'])) {
            $notifQuery = "
                INSERT INTO notifications (user_id, type, title, message) 
                VALUES (:user_id, :type, :title, :message)
            ";
            $notifStmt = $pdo->prepare($notifQuery);
            $notifStmt->bindParam(':user_id', $applicantUserId, PDO::PARAM_INT);
            $notifStmt->bindParam(':type', $notificationType, PDO::PARAM_STR);
            $notifStmt->bindParam(':title', $notificationTitle, PDO::PARAM_STR);
            $notifStmt->bindParam(':message', $notificationMessage, PDO::PARAM_STR);
            $notifStmt->execute();
        }
        
        // Commit the transaction
        $pdo->commit();
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Application updated successfully']);
    } catch (Exception $e) {
        // Rollback the transaction on error
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Delete an application
 */
function deleteApplication($pdo, $id) {
    error_log('Deleting application with ID: ' . $id);
    
    // Verify the ID is numeric
    if (!is_numeric($id)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid application ID']);
        return;
    }
    
    // Check if application exists and get user ID
    $checkQuery = "SELECT user_id FROM applications WHERE id = :id";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        return;
    }
    
    $applicationData = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $applicantUserId = $applicationData['user_id'];
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Delete associated pool assignments first (foreign key constraint)
        $deleteAssignmentsQuery = "DELETE FROM applicant_pool_assignments WHERE application_id = :id";
        $deleteAssignmentsStmt = $pdo->prepare($deleteAssignmentsQuery);
        $deleteAssignmentsStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $deleteAssignmentsStmt->execute();
        
        // Delete the application
        $deleteQuery = "DELETE FROM applications WHERE id = :id";
        $deleteStmt = $pdo->prepare($deleteQuery);
        $deleteStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $deleteStmt->execute();
        
        // Create notification
        $notifQuery = "
            INSERT INTO notifications (user_id, type, title, message) 
            VALUES (:user_id, 'warning', 'Application Removed', 'Your application has been removed.')
        ";
        $notifStmt = $pdo->prepare($notifQuery);
        $notifStmt->bindParam(':user_id', $applicantUserId, PDO::PARAM_INT);
        $notifStmt->execute();
        
        // Commit the transaction
        $pdo->commit();
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Application deleted successfully']);
    } catch (Exception $e) {
        // Rollback the transaction on error
        $pdo->rollBack();
        throw $e;
    }
}