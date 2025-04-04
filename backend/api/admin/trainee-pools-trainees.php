<?php
// File: backend/api/admin/trainee-pools-trainees.php
// API endpoint for managing trainees in pools

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

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

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            if (isset($_GET['pool_id'])) {
                getTraineesByPool($pdo, $_GET['pool_id']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Pool ID is required']);
            }
            break;
            
        case 'DELETE':
            if (isset($_GET['application_id']) && isset($_GET['pool_id'])) {
                removeTraineeFromPool($pdo, $_GET['application_id'], $_GET['pool_id']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Application ID and Pool ID are required']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    error_log("Trainee Pool API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Trainee Pool API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

function getTraineesByPool($pdo, $poolId) {
    // Query adapted to match the existing database schema
    $query = "
        SELECT 
            a.id as application_id,
            u.id as user_id,
            u.full_name,
            u.email,
            u.department,
            a.job_role,
            a.status,
            a.applied_at,
            apa.assigned_at
        FROM 
            applicant_pool_assignments apa
        JOIN
            applications a ON apa.application_id = a.id
        JOIN
            users u ON a.user_id = u.id
        WHERE 
            apa.pool_id = :pool_id
        ORDER BY
            apa.assigned_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
    $stmt->execute();

    $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($trainees);
}

function removeTraineeFromPool($pdo, $applicationId, $poolId) {
    // Begin transaction for data consistency
    $pdo->beginTransaction();
    
    try {
        // Check if the assignment exists
        $checkQuery = "SELECT id FROM applicant_pool_assignments 
                      WHERE application_id = :app_id AND pool_id = :pool_id";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->bindParam(':app_id', $applicationId, PDO::PARAM_INT);
        $checkStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $checkStmt->execute();

        if ($checkStmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Applicant not found in specified pool']);
            $pdo->rollBack();
            return;
        }

        // Get the user ID from the application for notification
        $userQuery = "SELECT user_id FROM applications WHERE id = :app_id";
        $userStmt = $pdo->prepare($userQuery);
        $userStmt->bindParam(':app_id', $applicationId, PDO::PARAM_INT);
        $userStmt->execute();
        $userData = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$userData) {
            http_response_code(404);
            echo json_encode(['error' => 'Application not found']);
            $pdo->rollBack();
            return;
        }
        
        $userId = $userData['user_id'];

        // Delete the pool assignment
        $deleteQuery = "DELETE FROM applicant_pool_assignments 
                       WHERE application_id = :app_id AND pool_id = :pool_id";
        $deleteStmt = $pdo->prepare($deleteQuery);
        $deleteStmt->bindParam(':app_id', $applicationId, PDO::PARAM_INT);
        $deleteStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $deleteStmt->execute();

        // Add notification to the user
        $notifQuery = "INSERT INTO notifications 
                      (user_id, type, title, message, created_at) 
                      VALUES (?, 'info', 'Pool Assignment Removed', 'You have been removed from an applicant pool.', NOW())";
        $notifStmt = $pdo->prepare($notifQuery);
        $notifStmt->execute([$userId]);
        
        $pdo->commit();
        echo json_encode([
            'success' => true, 
            'message' => 'Applicant removed from pool successfully'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}
?>