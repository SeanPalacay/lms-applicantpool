<?php
// File: backend/api/admin/applicant-notes.php
// API endpoint for admin to manage applicant notes

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
            // Get notes for a specific applicant
            if (isset($_GET['application_id'])) {
                getApplicantNotes($pdo, $_GET['application_id']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Application ID is required']);
            }
            break;
            
        case 'POST':
            // Add a new note for an applicant
            addApplicantNote($pdo, $userId);
            break;
            
        case 'DELETE':
            // Delete a note
            if (isset($_GET['id'])) {
                deleteApplicantNote($pdo, $_GET['id'], $userId);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Note ID is required']);
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
    error_log("Applicant Notes API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Other errors
    error_log("Applicant Notes API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get notes for a specific applicant
 */
function getApplicantNotes($pdo, $applicationId) {
    // Check if the application exists
    $checkApplicationQuery = "
        SELECT id FROM applications 
        WHERE id = :id
    ";
    $checkApplicationStmt = $pdo->prepare($checkApplicationQuery);
    $checkApplicationStmt->bindParam(':id', $applicationId, PDO::PARAM_INT);
    $checkApplicationStmt->execute();

    if ($checkApplicationStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        return;
    }

    // Get notes for this applicant based on application ID
    $query = "
        SELECT 
            n.id,
            n.content,
            n.created_at,
            u.full_name as author_name
        FROM 
            applicant_notes n
        LEFT JOIN
            users u ON n.created_by = u.id
        WHERE 
            n.applicant_id = :application_id
        ORDER BY 
            n.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':application_id', $applicationId, PDO::PARAM_INT);
    $stmt->execute();

    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($notes);
}

/**
 * Add a new note for an applicant
 */
function addApplicantNote($pdo, $userId) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['application_id']) || !is_numeric($data['application_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Application ID is required']);
        return;
    }

    if (!isset($data['content']) || empty(trim($data['content']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Note content is required']);
        return;
    }

    // Check if the application exists
    $checkApplicationQuery = "
        SELECT id FROM applications 
        WHERE id = :id
    ";
    $checkApplicationStmt = $pdo->prepare($checkApplicationQuery);
    $checkApplicationStmt->bindParam(':id', $data['application_id'], PDO::PARAM_INT);
    $checkApplicationStmt->execute();

    if ($checkApplicationStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Application not found']);
        return;
    }

    // Insert the note
    $insertNoteQuery = "
        INSERT INTO applicant_notes (applicant_id, content, created_by)
        VALUES (:applicant_id, :content, :created_by)
    ";
    
    $insertNoteStmt = $pdo->prepare($insertNoteQuery);
    $insertNoteStmt->bindParam(':applicant_id', $data['application_id'], PDO::PARAM_INT);
    $insertNoteStmt->bindParam(':content', $data['content'], PDO::PARAM_STR);
    $insertNoteStmt->bindParam(':created_by', $userId, PDO::PARAM_INT);
    $insertNoteStmt->execute();
    
    $noteId = $pdo->lastInsertId();
    
    // Get the created note details
    $query = "
        SELECT 
            n.id,
            n.content,
            n.created_at,
            u.full_name as author_name
        FROM 
            applicant_notes n
        LEFT JOIN
            users u ON n.created_by = u.id
        WHERE 
            n.id = :id
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $noteId, PDO::PARAM_INT);
    $stmt->execute();
    
    $note = $stmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(201); // Created
    echo json_encode(['success' => true, 'data' => $note]);
}

/**
 * Delete a note
 */
function deleteApplicantNote($pdo, $noteId, $userId) {
    // Check if the note exists
    $checkNoteQuery = "
        SELECT id, created_by FROM applicant_notes 
        WHERE id = :id
    ";
    $checkNoteStmt = $pdo->prepare($checkNoteQuery);
    $checkNoteStmt->bindParam(':id', $noteId, PDO::PARAM_INT);
    $checkNoteStmt->execute();

    if ($checkNoteStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Note not found']);
        return;
    }

    $note = $checkNoteStmt->fetch(PDO::FETCH_ASSOC);
    
    // Delete the note
    $deleteNoteQuery = "DELETE FROM applicant_notes WHERE id = :id";
    $deleteNoteStmt = $pdo->prepare($deleteNoteQuery);
    $deleteNoteStmt->bindParam(':id', $noteId, PDO::PARAM_INT);
    $deleteNoteStmt->execute();
    
    // Log the deletion
    $logQuery = "
        INSERT INTO user_activity (
            user_id, 
            activity_type, 
            details, 
            activity_time
        ) VALUES (
            :user_id, 
            'note_deleted', 
            :details, 
            NOW()
        )
    ";
    
    $details = "Deleted applicant note (ID: $noteId)";
    $logStmt = $pdo->prepare($logQuery);
    $logStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $logStmt->bindParam(':details', $details, PDO::PARAM_STR);
    $logStmt->execute();
    
    echo json_encode(['success' => true, 'message' => 'Note deleted successfully']);
}
?>