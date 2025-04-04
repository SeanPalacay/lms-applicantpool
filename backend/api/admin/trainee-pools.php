<?php
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
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    $userId = isset($parts[0]) ? (int)$parts[0] : 0;

    if (!$userId && isset($_SESSION['user_id'])) {
        $userId = (int) $_SESSION['user_id'];
    }

    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token format or missing user ID']);
        exit;
    }

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
            if (isset($_GET['id'])) {
                getTraineePoolById($pdo, $_GET['id']);
            } else {
                getTraineePools($pdo);
            }
            break;
            
        case 'POST':
            createTraineePool($pdo, $userId);
            break;
            
        case 'DELETE':
            if (isset($_GET['id'])) {
                deleteTraineePool($pdo, $_GET['id']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Pool ID is required for deletion']);
            }
            break;
            
        case 'PUT':
            if (isset($_GET['id'])) {
                $data = json_decode(file_get_contents('php://input'), true);
                updateTraineePool($pdo, $_GET['id'], $data);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Pool ID is required for update']);
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

function updateTraineePool($pdo, $poolId, $data) {
    if (empty($data['pool_name']) || empty($data['program_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Pool name and program ID are required']);
        return;
    }

    try {
        $query = "
            UPDATE trainee_pools
            SET pool_name = :pool_name,
                description = :description,
                program_id = :program_id,
                updated_at = NOW()
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':pool_name', $data['pool_name'], PDO::PARAM_STR);
        $stmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
        $stmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
        $stmt->bindParam(':id', $poolId, PDO::PARAM_INT);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(['message' => 'Trainee pool updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update trainee pool']);
        }
    } catch (PDOException $e) {
        error_log("Error updating trainee pool: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function getTraineePools($pdo) {
    $query = "
        SELECT 
            tp.id,
            tp.pool_name,
            tp.description,
            tp.program_id,
            p.title AS program_title,
            tp.created_at,
            tp.created_by,
            u.full_name AS created_by_name,
            COUNT(DISTINCT tpa.trainee_id) AS trainee_count
        FROM 
            trainee_pools tp
        LEFT JOIN
            programs p ON tp.program_id = p.id
        LEFT JOIN
            users u ON tp.created_by = u.id
        LEFT JOIN
            trainee_pools_trainees tpa ON tp.id = tpa.pool_id
        GROUP BY 
            tp.id, tp.pool_name, tp.description, tp.program_id, p.title, tp.created_at, tp.created_by, u.full_name
        ORDER BY 
            tp.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $pools = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($pools);
}

function getTraineePoolById($pdo, $poolId) {
    $query = "
        SELECT 
            tp.id,
            tp.pool_name,
            tp.description,
            tp.program_id,
            p.title AS program_title,
            tp.created_at,
            tp.created_by,
            u.full_name AS created_by_name,
            COUNT(DISTINCT tpa.trainee_id) AS trainee_count
        FROM 
            trainee_pools tp
        LEFT JOIN
            programs p ON tp.program_id = p.id
        LEFT JOIN
            users u ON tp.created_by = u.id
        LEFT JOIN
            trainee_pools_trainees tpa ON tp.id = tpa.pool_id
        WHERE 
            tp.id = :id
        GROUP BY 
            tp.id, tp.pool_name, tp.description, tp.program_id, p.title, tp.created_at, tp.created_by, u.full_name
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $poolId, PDO::PARAM_INT);
    $stmt->execute();

    $pool = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pool) {
        http_response_code(404);
        echo json_encode(['error' => 'Trainee pool not found']);
        return;
    }

    echo json_encode($pool);
}

function createTraineePool($pdo, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['pool_name']) || empty(trim($data['pool_name']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Pool name is required']);
        return;
    }

    if (!isset($data['program_id']) || empty(trim($data['program_id'])) || !is_numeric($data['program_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid program ID is required']);
        return;
    }

    $programQuery = "SELECT id FROM programs WHERE id = :program_id";
    $programStmt = $pdo->prepare($programQuery);
    $programStmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
    $programStmt->execute();
    $program = $programStmt->fetch(PDO::FETCH_ASSOC);

    if (!$program) {
        http_response_code(404);
        echo json_encode(['error' => 'Program not found']);
        return;
    }

    $description = isset($data['description']) ? $data['description'] : '';

    try {
        $insertPoolQuery = "
            INSERT INTO trainee_pools (pool_name, description, program_id, created_by, created_at)
            VALUES (:pool_name, :description, :program_id, :created_by, NOW())
        ";
        
        $insertPoolStmt = $pdo->prepare($insertPoolQuery);
        $insertPoolStmt->bindParam(':pool_name', $data['pool_name'], PDO::PARAM_STR);
        $insertPoolStmt->bindParam(':description', $description, PDO::PARAM_STR);
        $insertPoolStmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
        $insertPoolStmt->bindParam(':created_by', $userId, PDO::PARAM_INT);
        $insertPoolStmt->execute();
        
        $poolId = $pdo->lastInsertId();
        
        http_response_code(201);
        echo json_encode([
            'message' => 'Trainee pool created successfully',
            'pool_id' => $poolId
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create trainee pool: ' . $e->getMessage()]);
    }
}

function deleteTraineePool($pdo, $poolId) {
    $checkPoolQuery = "SELECT id FROM trainee_pools WHERE id = :id";
    $checkPoolStmt = $pdo->prepare($checkPoolQuery);
    $checkPoolStmt->bindParam(':id', $poolId, PDO::PARAM_INT);
    $checkPoolStmt->execute();

    if ($checkPoolStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Trainee pool not found']);
        return;
    }

    $pdo->beginTransaction();

    try {
        $traineesQuery = "
            SELECT trainee_id AS user_id 
            FROM trainee_pools_trainees
            WHERE pool_id = :pool_id
        ";
        $traineesStmt = $pdo->prepare($traineesQuery);
        $traineesStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $traineesStmt->execute();
        $trainees = $traineesStmt->fetchAll(PDO::FETCH_COLUMN);

        $deleteAssignmentsQuery = "DELETE FROM trainee_pools_trainees WHERE pool_id = :pool_id";
        $deleteAssignmentsStmt = $pdo->prepare($deleteAssignmentsQuery);
        $deleteAssignmentsStmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
        $deleteAssignmentsStmt->execute();
        
        $deletePoolQuery = "DELETE FROM trainee_pools WHERE id = :id";
        $deletePoolStmt = $pdo->prepare($deletePoolQuery);
        $deletePoolStmt->bindParam(':id', $poolId, PDO::PARAM_INT);
        $deletePoolStmt->execute();
        
        if (!empty($trainees)) {
            $notificationQuery = "
                INSERT INTO notifications (user_id, type, title, message, created_at)
                VALUES (:user_id, 'info', 'Pool Removed', 'A trainee pool you were in has been removed.', NOW())
            ";
            $notifStmt = $pdo->prepare($notificationQuery);
            
            foreach ($trainees as $traineeId) {
                $notifStmt->bindParam(':user_id', $traineeId, PDO::PARAM_INT);
                $notifStmt->execute();
            }
        }
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'message' => 'Trainee pool deleted successfully']);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete trainee pool: ' . $e->getMessage()]);
    }
}
?>
