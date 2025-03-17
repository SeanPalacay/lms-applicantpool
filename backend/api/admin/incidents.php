<?php
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

// Simple token check
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get specific incident (unchanged)
                $id = (int)$_GET['id'];
                $query = "
                    SELECT pi.*, 
                           u.full_name AS userName, 
                           r.full_name AS reporterName,
                           r.role AS reporterRole
                    FROM performance_incidents pi
                    LEFT JOIN users u ON pi.user_id = u.id
                    LEFT JOIN users r ON pi.reported_by = r.id
                    WHERE pi.id = :id
                ";
                $stmt = $pdo->prepare($query);
                $stmt->execute([':id' => $id]);
                $incident = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$incident) {
                    header('Content-Type: application/json');
                    http_response_code(404);
                    echo json_encode(['error' => 'Incident not found']);
                    exit;
                }
                
                $relatedQuery = "
                    SELECT id, incident_type, incident_date
                    FROM performance_incidents
                    WHERE user_id = :user_id
                    AND id != :current_id
                    ORDER BY incident_date DESC
                    LIMIT 5
                ";
                $relatedStmt = $pdo->prepare($relatedQuery);
                $relatedStmt->execute([
                    ':user_id' => $incident['user_id'],
                    ':current_id' => $id
                ]);
                $relatedIncidents = $relatedStmt->fetchAll(PDO::FETCH_ASSOC);
                $incident['relatedIncidents'] = $relatedIncidents;
                
                try {
                    $notesQuery = "
                        SELECT n.*, u.full_name AS author_name
                        FROM incident_notes n
                        LEFT JOIN users u ON n.created_by = u.id
                        WHERE n.incident_id = :incident_id
                        ORDER BY n.created_at ASC
                    ";
                    $notesStmt = $pdo->prepare($notesQuery);
                    $notesStmt->execute([':incident_id' => $id]);
                    $incident['notes'] = $notesStmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (PDOException $e) {
                    $incident['notes'] = [];
                }
                
                header('Content-Type: application/json');
                echo json_encode($incident);
            } elseif (isset($_GET['action']) && $_GET['action'] === 'add-note') {
                // Placeholder for adding notes (unchanged)
                header('Content-Type: application/json');
                echo json_encode([
                    'message' => 'Note functionality not implemented yet',
                    'note' => [
                        'id' => 0,
                        'incident_id' => isset($_GET['incident_id']) ? (int)$_GET['incident_id'] : 0,
                        'content' => 'This is a placeholder note.',
                        'created_by' => 1,
                        'created_at' => date('Y-m-d H:i:s'),
                        'author_name' => 'System'
                    ]
                ]);
            } elseif (isset($_GET['action']) && $_GET['action'] === 'current-user') {
                // New endpoint to get current user ID based on token
                // For now, we'll simulate token-to-user mapping (replace with real logic)
                $query = "SELECT id FROM users WHERE id = :id"; // Placeholder; adjust based on your auth system
                $stmt = $pdo->prepare($query);
                $stmt->execute([':id' => 1]); // Simulate admin user; replace with token validation
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user) {
                    header('Content-Type: application/json');
                    http_response_code(401);
                    echo json_encode(['error' => 'Unable to identify current user']);
                    exit;
                }
                
                header('Content-Type: application/json');
                echo json_encode(['userId' => $user['id']]);
            } else {
                // Get all incidents (unchanged)
                $query = "
                    SELECT pi.*, 
                           u.full_name AS userName, 
                           r.full_name AS reporterName
                    FROM performance_incidents pi
                    LEFT JOIN users u ON pi.user_id = u.id
                    LEFT JOIN users r ON pi.reported_by = r.id
                    ORDER BY pi.incident_date DESC
                ";
                $stmt = $pdo->prepare($query);
                $stmt->execute();
                $incidents = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                header('Content-Type: application/json');
                echo json_encode(['incidents' => $incidents]);
            }
            break;
            
        case 'POST':
            if (isset($_GET['action']) && $_GET['action'] === 'add-note') {
                // Handle adding notes (unchanged)
                $input = file_get_contents('php://input');
                $data = json_decode($input, true);
                
                if (!isset($data['incident_id']) || !isset($data['content'])) {
                    header('Content-Type: application/json');
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing required fields']);
                    exit;
                }
                
                $checkQuery = "SELECT id FROM performance_incidents WHERE id = :id";
                $checkStmt = $pdo->prepare($checkQuery);
                $checkStmt->execute([':id' => $data['incident_id']]);
                
                if ($checkStmt->rowCount() === 0) {
                    header('Content-Type: application/json');
                    http_response_code(404);
                    echo json_encode(['error' => 'Incident not found']);
                    exit;
                }
                
                header('Content-Type: application/json');
                http_response_code(201);
                echo json_encode([
                    'message' => 'Note added successfully (placeholder)',
                    'note' => [
                        'id' => 1,
                        'incident_id' => $data['incident_id'],
                        'content' => $data['content'],
                        'created_by' => isset($data['created_by']) ? $data['created_by'] : 1,
                        'created_at' => date('Y-m-d H:i:s'),
                        'author_name' => 'Admin'
                    ]
                ]);
            } else {
                // Create a new incident
                $input = file_get_contents('php://input');
                $data = json_decode($input, true);
                
                error_log("Incident data received: " . print_r($data, true));
                
                if (!isset($data['user_id']) || !isset($data['incident_type']) || !isset($data['description'])) {
                    header('Content-Type: application/json');
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing required fields']);
                    exit;
                }
                
                $userId = (int)$data['user_id'];
                $incidentType = $data['incident_type'];
                $description = $data['description'];
                $incidentDate = $data['incident_date'] ?? date('Y-m-d H:i:s');
                
                // Get reported_by from token (simulate for now; replace with real logic)
                $reportedByQuery = "SELECT id FROM users WHERE id = :id"; // Placeholder; adjust based on your auth system
                $reportedByStmt = $pdo->prepare($reportedByQuery);
                $reportedByStmt->execute([':id' => 1]); // Simulate admin user; replace with token validation
                $reportedByUser = $reportedByStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$reportedByUser) {
                    header('Content-Type: application/json');
                    http_response_code(401);
                    echo json_encode(['error' => 'Unable to identify current user']);
                    exit;
                }
                
                $reportedBy = (int)$reportedByUser['id'];
                error_log("Reported_by value: " . $reportedBy);
                
                $query = "
                    INSERT INTO performance_incidents 
                    (user_id, incident_type, description, incident_date, reported_by)
                    VALUES (:user_id, :incident_type, :description, :incident_date, :reported_by)
                ";
                $stmt = $pdo->prepare($query);
                $stmt->execute([
                    ':user_id' => $userId,
                    ':incident_type' => $incidentType,
                    ':description' => $description,
                    ':incident_date' => $incidentDate,
                    ':reported_by' => $reportedBy
                ]);
                
                $incidentId = $pdo->lastInsertId();
                
                header('Content-Type: application/json');
                http_response_code(201);
                echo json_encode([
                    'message' => 'Incident created successfully',
                    'id' => $incidentId
                ]);
            }
            break;
            
        case 'PUT':
            // Update an existing incident (unchanged)
            if (!isset($_GET['id'])) {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Incident ID is required']);
                exit;
            }
            
            $id = (int)$_GET['id'];
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!isset($data['user_id']) || !isset($data['incident_type']) || !isset($data['description'])) {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields']);
                exit;
            }
            
            $userId = (int)$data['user_id'];
            $incidentType = $data['incident_type'];
            $description = $data['description'];
            $incidentDate = $data['incident_date'] ?? date('Y-m-d H:i:s');
            
            $query = "
                UPDATE performance_incidents 
                SET user_id = :user_id,
                    incident_type = :incident_type,
                    description = :description,
                    incident_date = :incident_date
                WHERE id = :id
            ";
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                ':user_id' => $userId,
                ':incident_type' => $incidentType,
                ':description' => $description,
                ':incident_date' => $incidentDate,
                ':id' => $id
            ]);
            
            if ($stmt->rowCount() === 0) {
                header('Content-Type: application/json');
                http_response_code(404);
                echo json_encode(['error' => 'Incident not found or no changes made']);
                exit;
            }
            
            header('Content-Type: application/json');
            echo json_encode([
                'message' => 'Incident updated successfully',
                'id' => $id
            ]);
            break;
            
        case 'DELETE':
            // Delete an incident (unchanged)
            if (!isset($_GET['id'])) {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Incident ID is required']);
                exit;
            }
            
            $id = (int)$_GET['id'];
            
            $query = "DELETE FROM performance_incidents WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->execute([':id' => $id]);
            
            if ($stmt->rowCount() === 0) {
                header('Content-Type: application/json');
                http_response_code(404);
                echo json_encode(['error' => 'Incident not found']);
                exit;
            }
            
            header('Content-Type: application/json');
            echo json_encode(['message' => 'Incident deleted successfully']);
            break;
            
        default:
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    error_log("Incidents API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Incidents API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
?>