<?php
// File: backend/api/admin/trainees-status.php
// API endpoint for updating application status

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
        case 'PUT':
            if (isset($_GET['id'])) {
                updateApplicationStatus($pdo, $_GET['id'], $userId);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Application ID is required']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    error_log("Application Status API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Application Status API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

function updateApplicationStatus($pdo, $applicationId, $adminId) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['status']) || empty(trim($data['status']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Status is required']);
        return;
    }

    $validStatuses = ['pending', 'shortlisted', 'hired', 'rejected', 'withdrawn'];
    if (!in_array($data['status'], $validStatuses)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status value. Valid values are: ' . implode(', ', $validStatuses)]);
        return;
    }

    // Begin transaction
    $pdo->beginTransaction();

    try {
        // Check if application exists
        $checkQuery = "SELECT a.id, a.user_id, a.status, u.full_name 
                       FROM applications a
                       JOIN users u ON a.user_id = u.id
                       WHERE a.id = :id";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
        $checkStmt->execute();
        
        $application = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            http_response_code(404);
            echo json_encode(['error' => 'Application not found']);
            $pdo->rollBack();
            return;
        }

        // Only update if status has changed
        if ($application['status'] === $data['status']) {
            echo json_encode([
                'success' => true, 
                'message' => 'Status unchanged', 
                'application_id' => $applicationId, 
                'status' => $data['status']
            ]);
            $pdo->rollBack(); // No changes needed
            return;
        }

        // Update application status
        $updateQuery = "
            UPDATE applications
            SET status = :status, 
                updated_at = NOW()
            WHERE id = :id
        ";
        
        $updateStmt = $pdo->prepare($updateQuery);
        $updateStmt->bindParam(':status', $data['status'], PDO::PARAM_STR);
        $updateStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
        $updateStmt->execute();

        // Determine notification type based on status
        $notificationType = 'info';
        if ($data['status'] === 'shortlisted' || $data['status'] === 'hired') {
            $notificationType = 'success';
        } elseif ($data['status'] === 'rejected') {
            $notificationType = 'error';
        }

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
                :type, 
                'Application Status Updated', 
                :message, 
                NOW()
            )
        ";
        
        $message = "Your application status has been updated to " . ucfirst($data['status']) . ".";
        $notificationStmt = $pdo->prepare($notificationQuery);
        $notificationStmt->bindParam(':user_id', $application['user_id'], PDO::PARAM_INT);
        $notificationStmt->bindParam(':type', $notificationType, PDO::PARAM_STR);
        $notificationStmt->bindParam(':message', $message, PDO::PARAM_STR);
        $notificationStmt->execute();

        // Log the status change
        $logQuery = "
            INSERT INTO user_activity (
                user_id, 
                activity_type, 
                details, 
                activity_time
            ) VALUES (
                :admin_id, 
                'status_update', 
                :details, 
                NOW()
            )
        ";
        
        $details = "Updated application status for " . $application['full_name'] . " (ID: " . $applicationId . ") from " . 
                   $application['status'] . " to " . $data['status'];
        $logStmt = $pdo->prepare($logQuery);
        $logStmt->bindParam(':admin_id', $adminId, PDO::PARAM_INT);
        $logStmt->bindParam(':details', $details, PDO::PARAM_STR);
        $logStmt->execute();

        $pdo->commit();

        echo json_encode([
            'success' => true, 
            'application_id' => $applicationId, 
            'old_status' => $application['status'],
            'new_status' => $data['status'],
            'applicant_name' => $application['full_name'],
            'applicant_id' => $application['user_id']
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}
?>