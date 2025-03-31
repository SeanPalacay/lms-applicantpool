<?php
// File: backend/api/admin/applicant-notes.php
// API endpoint for admin to manage applicant notes

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

// Get the logged-in user ID (you would normally extract this from the token)
// For demonstration, we'll use a simple mock user. In production, validate the token properly.
$userId = 1; // Assuming this is the admin user ID

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Handle different HTTP methods
    switch ($method) {
        case 'GET':
            // Get notes for a specific applicant
            if (isset($_GET['applicant_id'])) {
                getApplicantNotes($pdo, $_GET['applicant_id']);
            } else {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Applicant ID is required']);
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
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Note ID is required']);
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
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Other errors
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get notes for a specific applicant
 */
function getApplicantNotes($pdo, $applicantId) {
    // Check if the applicant exists
    $checkApplicantQuery = "
        SELECT id FROM applicant_pool_assignments 
        WHERE id = :id
    ";
    $checkApplicantStmt = $pdo->prepare($checkApplicantQuery);
    $checkApplicantStmt->bindParam(':id', $applicantId, PDO::PARAM_INT);
    $checkApplicantStmt->execute();

    if ($checkApplicantStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Applicant not found']);
        return;
    }

    // Get notes for this applicant
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
            n.applicant_id = :applicant_id
        ORDER BY 
            n.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':applicant_id', $applicantId, PDO::PARAM_INT);
    $stmt->execute();

    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: application/json');
    echo json_encode($notes);
}

/**
 * Add a new note for an applicant
 */
function addApplicantNote($pdo, $userId) {
    // Get JSON data from request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['applicant_id']) || !is_numeric($data['applicant_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Applicant ID is required']);
        return;
    }

    if (!isset($data['content']) || empty(trim($data['content']))) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Note content is required']);
        return;
    }

    // Check if the applicant exists
    $checkApplicantQuery = "
        SELECT id FROM applicant_pool_assignments 
        WHERE id = :id
    ";
    $checkApplicantStmt = $pdo->prepare($checkApplicantQuery);
    $checkApplicantStmt->bindParam(':id', $data['applicant_id'], PDO::PARAM_INT);
    $checkApplicantStmt->execute();

    if ($checkApplicantStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Applicant not found']);
        return;
    }

    // Create the new note
    // First check if the table exists
    try {
        $checkTableQuery = "SHOW TABLES LIKE 'applicant_notes'";
        $checkTableStmt = $pdo->prepare($checkTableQuery);
        $checkTableStmt->execute();
        
        if ($checkTableStmt->rowCount() === 0) {
            // Create the table if it doesn't exist
            $createTableQuery = "
                CREATE TABLE applicant_notes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    applicant_id INT NOT NULL,
                    content TEXT NOT NULL,
                    created_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (applicant_id) REFERENCES applicant_pool_assignments(id) ON DELETE CASCADE,
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                )
            ";
            $createTableStmt = $pdo->prepare($createTableQuery);
            $createTableStmt->execute();
        }
    } catch (PDOException $e) {
        // Table might already exist or there's another issue
        error_log('Error checking/creating applicant_notes table: ' . $e->getMessage());
    }

    // Insert the note
    $insertNoteQuery = "
        INSERT INTO applicant_notes (applicant_id, content, created_by)
        VALUES (:applicant_id, :content, :created_by)
    ";
    
    $insertNoteStmt = $pdo->prepare($insertNoteQuery);
    $insertNoteStmt->bindParam(':applicant_id', $data['applicant_id'], PDO::PARAM_INT);
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
    
    header('Content-Type: application/json');
    http_response_code(201); // Created
    echo json_encode(['success' => true, 'data' => $note]);
}

/**
 * Delete a note
 */
function deleteApplicantNote($pdo, $noteId, $userId) {
    // Check if the note exists and belongs to the user (or admin)
    $checkNoteQuery = "
        SELECT id, created_by FROM applicant_notes 
        WHERE id = :id
    ";
    $checkNoteStmt = $pdo->prepare($checkNoteQuery);
    $checkNoteStmt->bindParam(':id', $noteId, PDO::PARAM_INT);
    $checkNoteStmt->execute();

    if ($checkNoteStmt->rowCount() === 0) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Note not found']);
        return;
    }

    $note = $checkNoteStmt->fetch(PDO::FETCH_ASSOC);
    
    // Check if the user is the creator of the note or an admin
    // In a real app, you'd check user roles
    if ($note['created_by'] != $userId) {
        // For simplicity, we'll allow it anyway since we're assuming an admin role
        // In a real app, you'd check admin privileges here
    }

    // Delete the note
    $deleteNoteQuery = "DELETE FROM applicant_notes WHERE id = :id";
    $deleteNoteStmt = $pdo->prepare($deleteNoteQuery);
    $deleteNoteStmt->bindParam(':id', $noteId, PDO::PARAM_INT);
    $deleteNoteStmt->execute();
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Note deleted successfully']);
}
?>