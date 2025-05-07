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
        $userId = (int)$_SESSION['user_id'];
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
            if (isset($_GET['pool_id']) && is_numeric($_GET['pool_id'])) {
                getTraineesByPool($pdo, (int)$_GET['pool_id']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Valid Pool ID is required']);
            }
            break;
            
        case 'DELETE':
            if (isset($_GET['trainee_id']) && isset($_GET['pool_id']) && is_numeric($_GET['trainee_id']) && is_numeric($_GET['pool_id'])) {
                removeTraineeFromPool($pdo, (int)$_GET['trainee_id'], (int)$_GET['pool_id']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Trainee ID and Pool ID are required and must be numeric']);
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
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}

function getTraineesByPool($pdo, $poolId) {
    try {
        // Query to fetch trainees based on position_id, not requiring trainee_pools
        $query = "
            SELECT 
                u.id AS user_id,
                u.full_name,
                p.id AS program_id,
                p.title AS program_name,
                pe.batch_id,
                u.role,
                pe.position_id,
                pe.enrolled_at AS added_at
            FROM 
                pool_enrollments pe
            LEFT JOIN 
                users u ON pe.user_id = u.id
            LEFT JOIN 
                programs p ON pe.program_id = p.id
            LEFT JOIN 
                trainee_pools tp ON pe.pool_id = tp.id
            WHERE 
                pe.position_id = :pool_id
                AND u.role = 'trainee'
            ORDER BY 
                pe.enrolled_at DESC
        ";

        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $stmt->execute();

        $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log("Fetched " . count($trainees) . " trainees for pool_id: $poolId");
        echo json_encode($trainees);
    } catch (PDOException $e) {
        error_log("getTraineesByPool PDO Error: " . $e->getMessage() . " | Query: $query | pool_id: $poolId");
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch trainees: ' . $e->getMessage()]);
    }
}

function removeTraineeFromPool($pdo, $traineeId, $poolId) {
    $pdo->beginTransaction();
    
    try {
        // Check if the assignment exists
        $checkQuery = "
            SELECT id 
            FROM trainee_pools_trainees 
            WHERE trainee_id = :trainee_id AND pool_id = :pool_id
        ";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->bindParam(':trainee_id', $traineeId, PDO::PARAM_INT);
        $checkStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $checkStmt->execute();

        if ($checkStmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Trainee not found in specified pool']);
            $pdo->rollBack();
            return;
        }

        // Delete the pool assignment
        $deleteQuery = "
            DELETE FROM trainee_pools_trainees 
            WHERE trainee_id = :trainee_id AND pool_id = :pool_id
        ";
        $deleteStmt = $pdo->prepare($deleteQuery);
        $deleteStmt->bindParam(':trainee_id', $traineeId, PDO::PARAM_INT);
        $deleteStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $deleteStmt->execute();

        // Add notification to the user
        $notifQuery = "
            INSERT INTO notifications 
            (user_id, type, title, message, created_at) 
            VALUES (:user_id, 'info', 'Pool Assignment Removed', 'You have been removed from an applicant pool.', NOW())
        ";
        $notifStmt = $pdo->prepare($notifQuery);
        $notifStmt->bindParam(':user_id', $traineeId, PDO::PARAM_INT);
        $notifStmt->execute();
        
        $pdo->commit();
        error_log("Trainee $traineeId removed from pool $poolId");
        echo json_encode([
            'success' => true, 
            'message' => 'Trainee removed from pool successfully'
        ]);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("removeTraineeFromPool PDO Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to remove trainee: ' . $e->getMessage()]);
    }
}
?>