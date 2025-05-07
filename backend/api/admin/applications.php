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
            if (isset($_GET['action']) && $_GET['action'] === 'waitlist' && isset($_GET['position_id'])) {
                getWaitlistByPosition($pdo, $_GET['position_id']);
            } 
            else if (isset($_GET['id'])) {
                getApplicationById($pdo, $_GET['id']);
            } 
            else {
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
            
        case 'POST':
            if (isset($_GET['action']) && $_GET['action'] === 'move_waitlisted' && isset($_GET['position_id'])) {
                moveNextWaitlistedToApplied($pdo, $_GET['position_id']);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Invalid or missing action/position_id']);
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

function getWaitlistByPosition($pdo, $positionId) {
    error_log('Getting waitlist for position_id: ' . $positionId);
    
    // Verify the position_id is numeric
    if (!is_numeric($positionId)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid position ID']);
        return;
    }
    
    // Query to get waitlisted applicants with position information
    $query = "
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
        JOIN 
            job_positions jp ON ja.position_id = jp.id
        WHERE 
            ja.position_id = :position_id AND 
            ja.status = 'waitlisted'
        ORDER BY 
            ja.applied_at ASC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':position_id', $positionId, PDO::PARAM_INT);
    $stmt->execute();
    
    $waitlist = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode($waitlist);
}

/**
 * Get applications with optional filters
 */
function getApplications($pdo) {
    error_log('Getting applications with filters: ' . json_encode($_GET));
    
    // Base query
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
    JOIN  -- Use INNER JOIN instead of LEFT JOIN to ensure position data
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
    
    // Add position_id filter
    if (isset($_GET['position_id']) && is_numeric($_GET['position_id'])) {
        $baseQuery .= " AND ja.position_id = :position_id";
        $params[':position_id'] = $_GET['position_id'];
    }
    
    // Add search filter
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $search = '%' . $_GET['search'] . '%';
        $baseQuery .= " AND (u.full_name LIKE :search OR u.email LIKE :search OR jp.position_name LIKE :search)";
        $params[':search'] = $search;
    }
    
    // Add order by (ASC for waitlist to support FCFS, DESC otherwise)
    if (isset($_GET['status']) && $_GET['status'] === 'waitlisted') {
        $baseQuery .= " ORDER BY ja.applied_at ASC"; // FCFS: Earliest first
    } else {
        $baseQuery .= " ORDER BY ja.applied_at DESC";
    }
    
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
    
    // Get application notes
    $notesQuery = "
        SELECT 
            id,
            note,
            created_at
        FROM 
            application_notes
        WHERE 
            application_id = :application_id
        ORDER BY 
            created_at DESC
    ";
    
    $notesStmt = $pdo->prepare($notesQuery);
    $notesStmt->bindParam(':application_id', $application['id'], PDO::PARAM_INT);
    $notesStmt->execute();
    
    $application['notes'] = $notesStmt->fetchAll(PDO::FETCH_ASSOC);
    
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
    
    // Validate status
    $validStatuses = ['pending', 'waitlisted', 'shortlisted', 'hired', 'rejected'];
    if (isset($data['status']) && !in_array($data['status'], $validStatuses)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status value']);
        return;
    }
    
    // Check if application exists and get user ID
    $checkQuery = "SELECT user_id, position_id FROM job_applications WHERE id = :id";
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
    $positionId = $applicationData['position_id'];
    
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
                              (($data['status'] === 'hired' || $data['status'] === 'shortlisted') ? 'success' : 'info');
        }
        
        // If no fields to update
        if (empty($updateFields)) {
            header('Content-Type: application/json');
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
        }
        
        // Build and execute update query
        $updateQuery = "UPDATE job_applications SET " . implode(", ", $updateFields) . ", updated_at = NOW() WHERE id = :id";
        $updateStmt = $pdo->prepare($updateQuery);
        
        foreach ($params as $key => $value) {
            $updateStmt->bindValue($key, $value);
        }
        
        $updateStmt->execute();
        
        // Store reason/note if provided
        if (isset($data['reason']) && !empty($data['reason'])) {
            $noteQuery = "
                INSERT INTO application_notes (application_id, note, created_at)
                VALUES (:application_id, :note, NOW())
            ";
            $noteStmt = $pdo->prepare($noteQuery);
            $noteStmt->bindParam(':application_id', $id, PDO::PARAM_INT);
            $noteStmt->bindParam(':note', $data['reason'], PDO::PARAM_STR);
            $noteStmt->execute();
        }
        
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
 * Move the next waitlisted applicant to applied status for a position
 */
function moveNextWaitlistedToApplied($pdo, $positionId) {
    error_log('Moving next waitlisted applicant for position_id: ' . $positionId);
    
    // Verify the position_id is numeric
    if (!is_numeric($positionId)) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Invalid position ID']);
        return;
    }
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Find the earliest waitlisted applicant
        $query = "
            SELECT id, user_id
            FROM job_applications
            WHERE position_id = :position_id AND status = 'waitlisted'
            ORDER BY applied_at ASC
            LIMIT 1
        ";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':position_id', $positionId, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            $pdo->commit();
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'No waitlisted applicants']);
            return;
        }
        
        $application = $stmt->fetch(PDO::FETCH_ASSOC);
        $applicationId = $application['id'];
        $applicantUserId = $application['user_id'];
        
        // Update status to applied
        $updateQuery = "
            UPDATE job_applications
            SET status = 'pending', updated_at = NOW()
            WHERE id = :id
        ";
        $updateStmt = $pdo->prepare($updateQuery);
        $updateStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
        $updateStmt->execute();
        
        // Create notification
        $notificationTitle = "Application Status Updated";
        $notificationMessage = "Your application has been moved from waitlisted to pending review.";
        $notificationType = 'info';
        
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
        
        // Commit the transaction
        $pdo->commit();
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Moved waitlisted applicant to pending', 'application_id' => $applicationId]);
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
        // Delete the application
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
?>