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

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

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
            error_log('Executing GET request for programs');
            
            // Check if specific program ID was requested
            if (isset($_GET['id']) && is_numeric($_GET['id'])) {
                $id = $_GET['id'];
                error_log('Fetching single program with ID: ' . $id);
                
                $query = "SELECT p.id, p.title, p.description, p.type, p.created_by, p.created_at, u.full_name as createdByName
                         FROM programs p
                         LEFT JOIN users u ON p.created_by = u.id
                         WHERE p.id = :id";
                
                $stmt = $pdo->prepare($query);
                $stmt->execute([':id' => $id]);
                
                $program = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$program) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Program not found']);
                    exit;
                }
                
                header('Content-Type: application/json');
                echo json_encode($program);
            } else {
                // Get all programs
                $query = "SELECT id, title, description, type, created_at FROM programs ORDER BY created_at DESC";
                error_log('Prepared query: ' . $query);
                $stmt = $pdo->prepare($query);
                error_log('Executing query');
                $stmt->execute();
                error_log('Fetching results');
                $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                error_log('Programs fetched: ' . print_r($programs, true));
                header('Content-Type: application/json');
                echo json_encode($programs);
            }
            break;

        case 'POST':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['title']) || empty($data['title'])) {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                exit;
            }

            $query = "INSERT INTO programs (title, description, type) VALUES (:title, :description, :type)";
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                ':title' => $data['title'],
                ':description' => $data['description'] ?? null,
                ':type' => $data['type'] ?? 'regular'
            ]);

            $programId = $pdo->lastInsertId();
            $query = "SELECT id, title, description, type, created_at FROM programs WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->execute([':id' => $programId]);
            $program = $stmt->fetch(PDO::FETCH_ASSOC);

            header('Content-Type: application/json');
            http_response_code(201);
            echo json_encode($program);
            break;

        case 'PUT':
            if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Valid program ID is required']);
                exit;
            }

            $id = $_GET['id'];
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            $query = "UPDATE programs SET title = :title, description = :description, type = :type WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                ':title' => $data['title'] ?? null,
                ':description' => $data['description'] ?? null,
                ':type' => $data['type'] ?? 'regular',
                ':id' => $id
            ]);

            $query = "SELECT id, title, description, type, created_at FROM programs WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->execute([':id' => $id]);
            $program = $stmt->fetch(PDO::FETCH_ASSOC);

            header('Content-Type: application/json');
            echo json_encode($program);
            break;

        case 'DELETE':
            if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
                header('Content-Type: program/json');
                http_response_code(400);
                echo json_encode(['error' => 'Valid program ID is required']);
                exit;
            }

            $id = $_GET['id'];
            $query = "DELETE FROM programs WHERE id = :id";
            $stmt = $pdo->prepare($query);
            error_log('Executing DELETE query for program ID: ' . $id);
            $stmt->execute([':id' => $id]);
            error_log('DELETE query executed successfully');

            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'Program deleted successfully']);
            break;

        default:
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    error_log("Programs API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Programs API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}