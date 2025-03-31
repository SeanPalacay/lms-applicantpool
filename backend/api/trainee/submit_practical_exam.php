<?php
// backend/api/trainee/submit_practical_exam.php

// Disable error display to prevent HTML output in JSON responses
ini_set('display_errors', 0);
error_reporting(E_ERROR);

// Start output buffering to prevent "headers already sent" issues
ob_start();

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Set content type early
header('Content-Type: application/json');

// For debugging (comment this out in production)
$logFile = __DIR__ . '/submit_practical_exam_log.txt';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Request received\n", FILE_APPEND);

// Check method
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

list($userId, $timestamp) = explode(':', $decodedToken);

// Basic token validation
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

// Verify trainee role
$query = "SELECT role FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $userId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] !== 'trainee') {
    http_response_code(403);
    echo json_encode(['error' => 'Permission denied']);
    exit;
}

// Get and parse JSON data
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

// Log received data
file_put_contents($logFile, "Received data: " . print_r($data, true) . "\n", FILE_APPEND);

// Validate required fields
if (!isset($data['exam_id']) || !isset($data['submission_text'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Exam ID and submission text are required']);
    exit;
}

$examId = filter_var($data['exam_id'], FILTER_VALIDATE_INT);
$submissionText = $data['submission_text'];

if (!$examId) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid exam ID']);
    exit;
}

// Simplified approach: Just verify the exam exists
$query = "SELECT id FROM practical_exams WHERE id = :exam_id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':exam_id', $examId, PDO::PARAM_INT);
$stmt->execute();

if (!$stmt->fetch()) {
    http_response_code(404);
    echo json_encode(['error' => 'Practical exam not found']);
    exit;
}

// Check if user has already submitted this exam
$query = "
    SELECT id FROM practical_exam_attempts 
    WHERE user_id = :user_id AND exam_id = :exam_id
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
$stmt->bindParam(':exam_id', $examId, PDO::PARAM_INT);
$stmt->execute();

if ($stmt->fetch()) {
    http_response_code(409); // Conflict
    echo json_encode(['error' => 'You have already submitted this exam']);
    exit;
}

try {
    // Begin transaction
    $pdo->beginTransaction();
    
    // Insert practical exam attempt
    $query = "
        INSERT INTO practical_exam_attempts 
        (user_id, exam_id, submission_text, submitted_at)
        VALUES (:user_id, :exam_id, :submission_text, NOW())
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':exam_id', $examId, PDO::PARAM_INT);
    $stmt->bindParam(':submission_text', $submissionText, PDO::PARAM_STR);
    $stmt->execute();
    
    $attemptId = $pdo->lastInsertId();
    
    // Create notification for trainee
    $query = "
        INSERT INTO notifications 
        (user_id, type, title, message, created_at)
        VALUES (:user_id, 'success', 'Practical Exam Submitted', 'Your practical exam has been submitted successfully and is awaiting grading.', NOW())
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    // Commit transaction
    $pdo->commit();
    
    // Return success response
    http_response_code(201); // Created
    echo json_encode([
        'message' => 'Practical exam submitted successfully',
        'attempt_id' => $attemptId
    ]);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    $pdo->rollBack();
    
    error_log("Database error in submit_practical_exam.php: " . $e->getMessage());
    file_put_contents($logFile, "PDO Error: " . $e->getMessage() . "\n", FILE_APPEND);
    
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    // Rollback transaction on error
    $pdo->rollBack();
    
    error_log("Error in submit_practical_exam.php: " . $e->getMessage());
    file_put_contents($logFile, "General Error: " . $e->getMessage() . "\n", FILE_APPEND);
    
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

// End output buffering and flush
ob_end_flush();