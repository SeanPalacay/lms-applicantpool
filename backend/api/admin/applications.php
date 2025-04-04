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
    
    // Base query - UPDATED for job_applications table
    $baseQuery = "
        SELECT 
            ja.*, 
            u.full_name, 
            u.email, 
            jp.position_name,
            jp.department
        FROM 
            job_applications ja
        JOIN 
            users u ON ja.user_id = u.id
        LEFT JOIN 
            job_positions jp ON ja.position_id = jp.id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Add status filter
    if (isset($_GET['status']) && !empty($_GET['status']) && $_GET['status'] !== 'all') {
        $baseQuery .= " AND ja.status = :status";
        $params[':status'] = $_GET['status'];
    }
    
    // Add department filter
    if (isset($_GET['department']) && !empty($_GET['department']) && $_GET['department'] !== 'all') {
        $baseQuery .= " AND jp.department = :department";
        $params[':department'] = $_GET['department'];
    }
    
    // Add search filter
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $search = '%' . $_GET['search'] . '%';
        $baseQuery .= " AND (u.full_name LIKE :search OR u.email LIKE :search OR jp.position_name LIKE :search)";
        $params[':search'] = $search;
    }
    
    // Add order by
    $baseQuery .= " ORDER BY ja.applied_at DESC";
    
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
    
    // Query to get application details - UPDATED for job_applications table
    $query = "
        SELECT 
            ja.*, 
            u.full_name, 
            u.email, 
            u.phone, 
            u.address,
            jp.position_name,
            jp.department
        FROM 
            job_applications ja
        JOIN 
            users u ON ja.user_id = u.id
        LEFT JOIN 
            job_positions jp ON ja.position_id = jp.id
        WHERE 
            ja.id = :id
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
    
    // Get user documents
    $documentsQuery = "
        SELECT 
            r.id,
            r.file_path,
            r.description,
            r.created_at
        FROM 
            records r
        WHERE 
            r.user_id = :user_id
        ORDER BY 
            r.created_at DESC
    ";
    
    $documentsStmt = $pdo->prepare($documentsQuery);
    $documentsStmt->bindParam(':user_id', $application['user_id'], PDO::PARAM_INT);
    $documentsStmt->execute();
    
    $documents = $documentsStmt->fetchAll(PDO::FETCH_ASSOC);
    $application['documents'] = $documents;
    
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
    
    // Check if application exists and get user ID - UPDATED for job_applications table
    $checkQuery = "SELECT user_id FROM job_applications WHERE id = :id";
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
        
        // If no fields to update
        if (empty($updateFields)) {
            header('Content-Type: application/json');
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        // Build and execute update query - UPDATED for job_applications table
        $updateQuery = "UPDATE job_applications SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = :id";
        $updateStmt = $pdo->prepare($updateQuery);
        
        foreach ($params as $key => $value) {
            $updateStmt->bindValue($key, $value);
        }
        
        $updateStmt->execute();
        
        // Create notification if status was updated
        if (isset($data['status'])) {
            $notifQuery = "
                INSERT INTO notifications (user_id, type, title, message, created_at) 
                VALUES (:user_id, :type, :title, :message, NOW())
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
    
    // Check if application exists and get user ID - UPDATED for job_applications table
    $checkQuery = "SELECT user_id FROM job_applications WHERE id = :id";
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
        // Delete the application - UPDATED for job_applications table
        $deleteQuery = "DELETE FROM job_applications WHERE id = :id";
        $deleteStmt = $pdo->prepare($deleteQuery);
        $deleteStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $deleteStmt->execute();
        
        // Create notification
        $notifQuery = "
            INSERT INTO notifications (user_id, type, title, message, created_at) 
            VALUES (:user_id, 'warning', 'Application Removed', 'Your application has been removed.', NOW())
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