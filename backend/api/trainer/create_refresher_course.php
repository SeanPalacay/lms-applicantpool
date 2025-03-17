<?php
// lms-forbes/backend/api/trainer/create_refresher_course.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

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

// Basic token validation (24-hour expiration)
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

// Get request data
$requestData = json_decode(file_get_contents('php://input'), true);

if (!$requestData || !isset($requestData['title'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Title is required']);
  exit;
}

try {
  // Start transaction
  $pdo->beginTransaction();
  
  // Create new refresher course
  $query = "
    INSERT INTO programs (
      title, 
      description, 
      type, 
      created_by, 
      created_at
    ) VALUES (
      :title,
      :description,
      'refresher',
      :created_by,
      NOW()
    )
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':title', $requestData['title']);
  $stmt->bindParam(':description', $requestData['description']);
  $stmt->bindParam(':created_by', $trainerId);
  $stmt->execute();
  
  $courseId = $pdo->lastInsertId();
  
  // If quiz data is provided, create a quiz for the refresher
  if (isset($requestData['quiz']) && is_array($requestData['quiz'])) {
    $quizData = $requestData['quiz'];
    
    $query = "
      INSERT INTO quizzes (
        program_id,
        title,
        description,
        time_limit,
        passing_score,
        created_by,
        created_at,
        status
      ) VALUES (
        :program_id,
        :title,
        :description,
        :time_limit,
        :passing_score,
        :created_by,
        NOW(),
        :status
      )
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':program_id', $courseId);
    $stmt->bindParam(':title', $quizData['title']);
    $stmt->bindParam(':description', $quizData['description']);
    $stmt->bindParam(':time_limit', $quizData['time_limit']);
    $stmt->bindParam(':passing_score', $quizData['passing_score']);
    $stmt->bindParam(':created_by', $trainerId);
    $stmt->bindParam(':status', $quizData['status'] ?? 'draft');
    $stmt->execute();
    
    $quizId = $pdo->lastInsertId();
    
    // If questions are provided, add them
    if (isset($quizData['questions']) && is_array($quizData['questions'])) {
      $questionQuery = "
        INSERT INTO quiz_questions (
          quiz_id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer
        ) VALUES (
          :quiz_id,
          :question_text,
          :option_a,
          :option_b,
          :option_c,
          :option_d,
          :correct_answer
        )
      ";
      
      $questionStmt = $pdo->prepare($questionQuery);
      
      foreach ($quizData['questions'] as $question) {
        $questionStmt->bindParam(':quiz_id', $quizId);
        $questionStmt->bindParam(':question_text', $question['question_text']);
        $questionStmt->bindParam(':option_a', $question['option_a']);
        $questionStmt->bindParam(':option_b', $question['option_b']);
        $questionStmt->bindParam(':option_c', $question['option_c'] ?? null);
        $questionStmt->bindParam(':option_d', $question['option_d'] ?? null);
        $questionStmt->bindParam(':correct_answer', $question['correct_answer']);
        $questionStmt->execute();
      }
    }
  }
  
  // Commit transaction
  $pdo->commit();
  
  // Return the newly created refresher course
  $query = "
    SELECT 
      p.id,
      p.title,
      p.description,
      p.type,
      p.created_at,
      p.created_by,
      u.full_name AS created_by_name
    FROM 
      programs p
    LEFT JOIN
      users u ON p.created_by = u.id
    WHERE 
      p.id = :courseId
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':courseId', $courseId);
  $stmt->execute();
  $course = $stmt->fetch(PDO::FETCH_ASSOC);
  
  http_response_code(201); // Created
  echo json_encode([
    'success' => true, 
    'message' => 'Refresher course created successfully',
    'course' => $course
  ]);

} catch (Exception $e) {
  // Rollback transaction on error
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  
  error_log('Error in create_refresher_course.php: ' . $e->getMessage());
  
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while creating the refresher course']);
}
exit;
?>