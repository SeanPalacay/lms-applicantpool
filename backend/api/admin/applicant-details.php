<?php
// File: backend/api/admin/applicant-details.php
// API endpoint for admin to get detailed information about a specific applicant in a pool

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

// Get the request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Only allow GET method
    if ($method !== 'GET') {
        header('Content-Type: application/json');
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    // Check if pool_id and applicant_id are provided
    if (!isset($_GET['pool_id']) || !isset($_GET['applicant_id'])) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode(['error' => 'Pool ID and Applicant ID are required']);
        exit;
    }

    $poolId = $_GET['pool_id'];
    $applicantId = $_GET['applicant_id'];

    // Get applicant details
    $query = "
        SELECT 
            apa.id, 
            apa.application_id,
            a.user_id,
            a.job_role,
            a.department,
            a.status,
            a.evaluation_score,
            a.fst_score,
            a.applied_at,
            a.updated_at,
            u.full_name,
            u.email
        FROM 
            applicant_pool_assignments apa
        INNER JOIN 
            applications a ON apa.application_id = a.id
        INNER JOIN 
            users u ON a.user_id = u.id
        WHERE 
            apa.pool_id = :pool_id AND apa.id = :applicant_id
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
    $stmt->bindParam(':applicant_id', $applicantId, PDO::PARAM_INT);
    $stmt->execute();

    $applicant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$applicant) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Applicant not found in this pool']);
        exit;
    }

    // Add empty program data since we don't have a direct relationship
    $applicant['program'] = [
        'title' => 'General Application',
        'type' => 'regular'
    ];

    // Get applicant documents
    $documentsQuery = "
        SELECT 
            r.id,
            r.file_path,
            r.description,
            r.created_at
        FROM 
            records r
        WHERE 
            r.user_id = :user_id AND r.record_type = 'applicant'
        ORDER BY 
            r.created_at DESC
    ";

    $documentsStmt = $pdo->prepare($documentsQuery);
    $documentsStmt->bindParam(':user_id', $applicant['user_id'], PDO::PARAM_INT);
    $documentsStmt->execute();

    $documents = $documentsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get applicant notes
    $notesQuery = "
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

    // First check if applicant_notes table exists
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
        
        $notesStmt = $pdo->prepare($notesQuery);
        $notesStmt->bindParam(':applicant_id', $applicantId, PDO::PARAM_INT);
        $notesStmt->execute();
        $notes = $notesStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // If there's an error, just return empty notes
        $notes = [];
    }

    // Add documents and notes to the applicant object
    $applicant['documents'] = $documents;
    $applicant['notes'] = $notes;

    // Return the applicant details
    header('Content-Type: application/json');
    echo json_encode($applicant);

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
?>