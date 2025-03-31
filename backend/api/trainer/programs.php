<?php
// lms-forbes/backend/api/trainer/programs.php

// Turn off error display to prevent HTML output in JSON responses
ini_set('display_errors', 0);
error_reporting(E_ERROR);

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Set content type early
header('Content-Type: application/json');

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
  $token = $matches[1];
}

if (empty($token)) {
  http_response_code(401);
  echo json_encode(['error' => 'Authentication required']);
  exit;
}

// Decode token (base64-encoded "userId:timestamp")
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid token format']);
  exit;
}

list($trainerId, $timestamp) = explode(':', $decodedToken);

// Basic token validation
if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
  exit;
}

// Verify trainer role
$query = "SELECT role FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $trainerId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] !== 'trainer') {
  http_response_code(403);
  echo json_encode(['error' => 'Permission denied']);
  exit;
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

try {
  switch ($method) {
    case 'GET':
      // Check if specific program ID was requested
 // Inside the GET case where you check for a single program ID:
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
  $programId = $_GET['id'];
  error_log("Fetching program details for ID: $programId by trainer ID: $trainerId");
  
  // Fetch program details created by this trainer
  $query = "
    SELECT 
      p.id,
      p.title,
      p.description,
      p.type,
      'active' AS status,
      p.created_at
    FROM 
      programs p
    WHERE 
      p.id = :programId AND p.created_by = :trainerId
  ";
  
  error_log("Query: $query");
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
  $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
  $stmt->execute();
  
  $program = $stmt->fetch(PDO::FETCH_ASSOC);
  error_log("Program fetch result: " . json_encode($program));
  
  if (!$program) {
    error_log("No program found with ID: $programId for trainer: $trainerId");
    http_response_code(404);
    echo json_encode(['error' => 'Program not found or you do not have permission to access it']);
    exit;
  }
  
  http_response_code(200);
  echo json_encode($program);
  exit;
}
      // Fetch all programs created by this trainer (your existing code)
      $query = "
        SELECT 
          p.id,
          p.title,
          p.description,
          p.type,
          'active' AS status, -- No status field in schema, default to 'active'
          p.created_at,
          (SELECT COUNT(*) FROM program_enrollments pe WHERE pe.program_id = p.id) AS enrollmentCount,
          (SELECT AVG(qa.score) FROM quiz_attempts qa 
           JOIN quizzes q ON qa.quiz_id = q.id 
           WHERE q.program_id = p.id) AS averageScore,
          (SELECT COUNT(*) FROM quizzes q WHERE q.program_id = p.id) AS quizCount,
          (SELECT COUNT(*) FROM program_enrollments pe 
           WHERE pe.program_id = p.id AND pe.completion_status = 'completed') * 100.0 / 
           NULLIF((SELECT COUNT(*) FROM program_enrollments pe WHERE pe.program_id = p.id), 0) AS completionRate
        FROM 
          programs p
        WHERE 
          p.created_by = :trainerId
        ORDER BY 
          p.created_at DESC
      ";
      $stmt = $pdo->prepare($query);
      $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
      $stmt->execute();
      $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);

      http_response_code(200);
      echo json_encode($programs);
      break;

    case 'POST':
      // Your existing POST code for creating a program...
      $input = file_get_contents('php://input');
      $data = json_decode($input, true);
      
      if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit;
      }
      
      // Validate input
      if (!isset($data['title']) || empty(trim($data['title']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Program title is required']);
        exit;
      }
      
      // Insert the new program
      $insertQuery = "INSERT INTO programs (title, description, type, created_by, created_at) 
                     VALUES (:title, :description, :type, :created_by, NOW())";
      
      $stmt = $pdo->prepare($insertQuery);
      $stmt->bindParam(':title', $data['title']);
      $description = isset($data['description']) ? $data['description'] : '';
      $stmt->bindParam(':description', $description);
      $type = isset($data['type']) ? $data['type'] : 'regular';
      $stmt->bindParam(':type', $type);
      $stmt->bindParam(':created_by', $trainerId);
      $stmt->execute();
      
      $programId = $pdo->lastInsertId();
      
      // Fetch the newly created program
      $fetchQuery = "SELECT id, title, description, type, created_at FROM programs WHERE id = :id";
      $stmt = $pdo->prepare($fetchQuery);
      $stmt->bindParam(':id', $programId);
      $stmt->execute();
      $program = $stmt->fetch(PDO::FETCH_ASSOC);
      
      http_response_code(201); // Created
      echo json_encode($program);
      break;

    case 'PUT':
      // Your existing PUT code for updating a program...
      // Check for program ID
      if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Program ID is required']);
        exit;
      }
      
      $programId = $_GET['id'];
      
      // Verify the trainer owns this program
      $verifyQuery = "SELECT id FROM programs WHERE id = :id AND created_by = :trainerId";
      $stmt = $pdo->prepare($verifyQuery);
      $stmt->bindParam(':id', $programId, PDO::PARAM_INT);
      $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
      $stmt->execute();
      
      $program = $stmt->fetch(PDO::FETCH_ASSOC);
      if (!$program) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to update this program']);
        exit;
      }
      
      // Get JSON input
      $input = file_get_contents('php://input');
      $data = json_decode($input, true);
      
      if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
        exit;
      }
      
      // Validate input
      if (isset($data['title']) && empty(trim($data['title']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Program title cannot be empty']);
        exit;
      }
      
      // Build the update query
      $updateFields = [];
      $params = [':id' => $programId];
      
      if (isset($data['title'])) {
        $updateFields[] = "title = :title";
        $params[':title'] = $data['title'];
      }
      
      if (isset($data['description'])) {
        $updateFields[] = "description = :description";
        $params[':description'] = $data['description'];
      }
      
      if (isset($data['type'])) {
        $updateFields[] = "type = :type";
        $params[':type'] = $data['type'];
      }
      
      if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
      }
      
      // Execute the update
      $updateQuery = "UPDATE programs SET " . implode(", ", $updateFields) . " WHERE id = :id";
      $stmt = $pdo->prepare($updateQuery);
      
      if (!$stmt->execute($params)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update program']);
        exit;
      }
      
      // Fetch and return the updated program
      $fetchQuery = "SELECT id, title, description, type, created_at FROM programs WHERE id = :id";
      $stmt = $pdo->prepare($fetchQuery);
      $stmt->bindParam(':id', $programId);
      $stmt->execute();
      $updatedProgram = $stmt->fetch(PDO::FETCH_ASSOC);
      
      http_response_code(200);
      echo json_encode($updatedProgram);
      break;
      
    default:
      http_response_code(405); // Method Not Allowed
      echo json_encode(['error' => 'Method not allowed']);
      break;
  }
} catch (PDOException $e) {
  error_log("Database error in trainer/programs.php: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
  error_log("Error in trainer/programs.php: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>