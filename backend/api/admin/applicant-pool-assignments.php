<?php
// File: backend/api/admin/applicant-pool-assignments.php
// API endpoint for admin to manage applicant pool assignments

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

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

// If no token in header, check if it's in the query string
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// Validate token
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    // Decode token to get user ID
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    $userId = isset($parts[0]) ? (int)$parts[0] : 0;

    // Fallback to session if no valid userId from token
    if (!$userId && isset($_SESSION['user_id'])) {
        $userId = (int) $_SESSION['user_id'];
    }

    // If still no userId, throw error
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token format or missing user ID']);
        exit;
    }

    // Check if user is an administrator
    $userQuery = "SELECT role FROM users WHERE id = ? LIMIT 1";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$userId]);
    $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData || $userData['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied. Administrator privileges required.']);
        exit;
    }

    // Get the request method
    $method = $_SERVER['REQUEST_METHOD'];

    // Handle different HTTP methods
    switch ($method) {
        case 'GET':
            // Get applicants for a specific pool
            if (isset($_GET['pool_id'])) {
                getApplicantsByPool($pdo, $_GET['pool_id']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Pool ID is required']);
            }
            break;
            
        case 'POST':
            // Assign an applicant to a pool
            assignApplicantToPool($pdo, $userId);
            break;
            
        case 'DELETE':
            // Remove an applicant from a pool
            if (isset($_GET['id'])) {
                removeApplicantFromPool($pdo, $_GET['id'], $userId);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Assignment ID is required']);
            }
            break;
            
        default:
            // Method not allowed
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    // Database error
    error_log("Applicant Pool Assignments API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Other errors
    error_log("Applicant Pool Assignments API General Error: " . $e->getMessage());
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
        http_response_code(404);
        echo json_encode(['error' => 'Applicant pool not found']);
        return;
    }

    // Get applicants for this pool
    $query = "
        SELECT 
            apa.id AS assignment_id,
            apa.application_id,
            apa.pool_id,
            apa.assigned_at,
            a.job_role,
            a.department,
            a.status,
            a.evaluation_score,
            a.fst_score,
            a.applied_at,
            a.updated_at,
            u.id AS user_id,
            u.full_name,
            u.email,
            u.phone
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

    echo json_encode($applicants);
}

/**
 * Assign an applicant to a pool
 */
function assignApplicantToPool($pdo, $userId) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['application_id']) || !is_numeric($data['application_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Application ID is required']);
        return;
    }

    if (!isset($data['pool_id']) || !is_numeric($data['pool_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Pool ID is required']);
        return;
    }

    // Begin transaction
    $pdo->beginTransaction();

    try {
        // Check if the application exists and get the user_id
        $checkApplicationQuery = "SELECT id, user_id FROM applications WHERE id = :id";
        $checkApplicationStmt = $pdo->prepare($checkApplicationQuery);
        $checkApplicationStmt->bindParam(':id', $data['application_id'], PDO::PARAM_INT);
        $checkApplicationStmt->execute();

        if ($checkApplicationStmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Application not found']);
            $pdo->rollBack();
            return;
        }

        $applicationData = $checkApplicationStmt->fetch(PDO::FETCH_ASSOC);
        $applicationUserId = $applicationData['user_id'];

        // Check if the pool exists
        $checkPoolQuery = "SELECT id, pool_name FROM applicant_pools WHERE id = :id";
        $checkPoolStmt = $pdo->prepare($checkPoolQuery);
        $checkPoolStmt->bindParam(':id', $data['pool_id'], PDO::PARAM_INT);
        $checkPoolStmt->execute();

        if ($checkPoolStmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Applicant pool not found']);
            $pdo->rollBack();
            return;
        }
        
        $poolData = $checkPoolStmt->fetch(PDO::FETCH_ASSOC);
        $poolName = $poolData['pool_name'];

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
            http_response_code(409); // Conflict
            echo json_encode(['error' => 'Application is already assigned to this pool']);
            $pdo->rollBack();
            return;
        }

        // Create the assignment
        $insertAssignmentQuery = "
            INSERT INTO applicant_pool_assignments (application_id, pool_id, assigned_at)
            VALUES (:application_id, :pool_id, NOW())
        ";
        
        $insertAssignmentStmt = $pdo->prepare($insertAssignmentQuery);
        $insertAssignmentStmt->bindParam(':application_id', $data['application_id'], PDO::PARAM_INT);
        $insertAssignmentStmt->bindParam(':pool_id', $data['pool_id'], PDO::PARAM_INT);
        $insertAssignmentStmt->execute();
        
        $assignmentId = $pdo->lastInsertId();
        
        // Create notification for the applicant
        $notificationQuery = "
            INSERT INTO notifications (
                user_id, 
                type, 
                title, 
                message, 
                created_at
            ) VALUES (
                :user_id, 
                'info', 
                'Pool Assignment', 
                :message, 
                NOW()
            )
        ";
        
        $message = "You have been added to the applicant pool: " . $poolName;
        $notificationStmt = $pdo->prepare($notificationQuery);
        $notificationStmt->bindParam(':user_id', $applicationUserId, PDO::PARAM_INT);
        $notificationStmt->bindParam(':message', $message, PDO::PARAM_STR);
        $notificationStmt->execute();
        
        // Log the activity
        $logQuery = "
            INSERT INTO user_activity (
                user_id, 
                activity_type, 
                details, 
                activity_time
            ) VALUES (
                :user_id, 
                'pool_assignment', 
                :details, 
                NOW()
            )
        ";
        
        $details = "Added application (ID: {$data['application_id']}) to pool: $poolName (ID: {$data['pool_id']})";
        $logStmt = $pdo->prepare($logQuery);
        $logStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $logStmt->bindParam(':details', $details, PDO::PARAM_STR);
        $logStmt->execute();
        
        // Get the created assignment details
        $query = "
            SELECT 
                apa.id AS assignment_id,
                apa.application_id,
                apa.pool_id,
                apa.assigned_at,
                a.job_role,
                a.department,
                a.status,
                a.applied_at,
                u.id AS user_id,
                u.full_name,
                p.pool_name
            FROM 
                applicant_pool_assignments apa
            INNER JOIN 
                applications a ON apa.application_id = a.id
            INNER JOIN 
                users u ON a.user_id = u.id
            INNER JOIN
                applicant_pools p ON apa.pool_id = p.id
            WHERE 
                apa.id = :id
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id', $assignmentId, PDO::PARAM_INT);
        $stmt->execute();
        
        $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $pdo->commit();
        
        http_response_code(201); // Created
        echo json_encode(['success' => true, 'data' => $assignment]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Remove an applicant from a pool
 */
function removeApplicantFromPool($pdo, $assignmentId, $userId) {
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Check if the assignment exists and get relevant info
        $checkAssignmentQuery = "
            SELECT 
                apa.application_id, 
                apa.pool_id, 
                a.user_id,
                p.pool_name
            FROM 
                applicant_pool_assignments apa
            JOIN 
                applications a ON apa.application_id = a.id
            JOIN 
                applicant_pools p ON apa.pool_id = p.id
            WHERE 
                apa.id = :id
        ";
        $checkAssignmentStmt = $pdo->prepare($checkAssignmentQuery);
        $checkAssignmentStmt->bindParam(':id', $assignmentId, PDO::PARAM_INT);
        $checkAssignmentStmt->execute();

        $assignment = $checkAssignmentStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$assignment) {
            http_response_code(404);
            echo json_encode(['error' => 'Assignment not found']);
            $pdo->rollBack();
            return;
        }
        
        $applicationId = $assignment['application_id'];
        $poolId = $assignment['pool_id'];
        $applicantUserId = $assignment['user_id'];
        $poolName = $assignment['pool_name'];
        
        // Delete the assignment
        $deleteAssignmentQuery = "DELETE FROM applicant_pool_assignments WHERE id = :id";
        $deleteAssignmentStmt = $pdo->prepare($deleteAssignmentQuery);
        $deleteAssignmentStmt->bindParam(':id', $assignmentId, PDO::PARAM_INT);
        $deleteAssignmentStmt->execute();
        
        // Add notification for the applicant
        $notificationQuery = "
            INSERT INTO notifications (
                user_id, 
                type, 
                title, 
                message, 
                created_at
            ) VALUES (
                :user_id, 
                'info', 
                'Pool Assignment Removed', 
                :message, 
                NOW()
            )
        ";
        
        $message = "You have been removed from the applicant pool: " . $poolName;
        $notificationStmt = $pdo->prepare($notificationQuery);
        $notificationStmt->bindParam(':user_id', $applicantUserId, PDO::PARAM_INT);
        $notificationStmt->bindParam(':message', $message, PDO::PARAM_STR);
        $notificationStmt->execute();
        
        // Log the activity
        $logQuery = "
            INSERT INTO user_activity (
                user_id, 
                activity_type, 
                details, 
                activity_time
            ) VALUES (
                :user_id, 
                'pool_assignment_removal', 
                :details, 
                NOW()
            )
        ";
        
        $details = "Removed application (ID: $applicationId) from pool: $poolName (ID: $poolId)";
        $logStmt = $pdo->prepare($logQuery);
        $logStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $logStmt->bindParam(':details', $details, PDO::PARAM_STR);
        $logStmt->execute();
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Applicant removed from pool successfully',
            'data' => [
                'assignment_id' => $assignmentId,
                'application_id' => $applicationId,
                'pool_id' => $poolId,
                'pool_name' => $poolName
            ]
        ]);
    } catch (Exception $e) {
        // Rollback in case of error
        $pdo->rollBack();
        throw $e;
    }
}
?>