<?php
// lms-forbes/backend/api/trainer/enroll_trainees.php
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

if (!$requestData || !isset($requestData['programId']) || !isset($requestData['traineeIds']) || !is_array($requestData['traineeIds'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Program ID and trainee IDs are required']);
    exit;
}

$programId = $requestData['programId'];
$traineeIds = $requestData['traineeIds'];

// Check if program exists
$query = "SELECT id, title FROM programs WHERE id = :programId";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':programId', $programId);
$stmt->execute();
$program = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$program) {
    http_response_code(404);
    echo json_encode(['error' => 'Program not found']);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Check if trainees exist and are valid, including their position_id
    $placeholders = implode(',', array_fill(0, count($traineeIds), '?'));
    $query = "SELECT id, full_name, email, position_id 
              FROM users 
              WHERE id IN ($placeholders) AND role = 'trainee' AND status = 'active'";
    $stmt = $pdo->prepare($query);
    foreach ($traineeIds as $index => $traineeId) {
        $stmt->bindValue($index + 1, $traineeId);
    }
    $stmt->execute();
    $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if all requested trainees were found
    if (count($trainees) !== count($traineeIds)) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['error' => 'Some trainees were not found or are not active']);
        exit;
    }

    // Check for existing program enrollments
    $placeholders = implode(',', array_fill(0, count($traineeIds), '?'));
    $query = "SELECT user_id 
              FROM program_enrollments 
              WHERE program_id = ? AND user_id IN ($placeholders)";
    $stmt = $pdo->prepare($query);
    $stmt->bindValue(1, $programId);
    foreach ($traineeIds as $index => $traineeId) {
        $stmt->bindValue($index + 2, $traineeId);
    }
    $stmt->execute();
    $existingEnrollments = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Filter out already enrolled trainees
    $newEnrollments = array_diff($traineeIds, $existingEnrollments);

    // Prepare enrollment stats
    $enrollmentStats = [
        'total_requested' => count($traineeIds),
        'already_enrolled' => count($existingEnrollments),
        'newly_enrolled' => 0,
        'quiz_enrollments' => 0,
        'additional_program_enrollments' => 0
    ];

    // Enroll trainees in the program (if not already enrolled)
    if (!empty($newEnrollments)) {
        $query = "INSERT INTO program_enrollments (
                    user_id, program_id, enrollment_date, completion_status, completion_percentage
                  ) VALUES (
                    :user_id, :program_id, NOW(), 'not_started', 0
                  )";
        $stmt = $pdo->prepare($query);

        foreach ($newEnrollments as $traineeId) {
            $stmt->bindParam(':user_id', $traineeId);
            $stmt->bindParam(':program_id', $programId);
            $stmt->execute();
            $enrollmentStats['newly_enrolled']++;
        }
    }

    // Automatic enrollment in position-specific quizzes and programs
    foreach ($trainees as $trainee) {
        $traineeId = $trainee['id'];
        $positionId = $trainee['position_id'];

        if ($positionId && in_array($traineeId, $newEnrollments)) {
            // Fetch position-specific quizzes
            $query = "SELECT q.id, q.title 
                      FROM quizzes q 
                      JOIN position_quiz_relation pqr ON q.id = pqr.quiz_id 
                      WHERE pqr.position_id = :position_id AND q.status = 'active'";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':position_id', $positionId, PDO::PARAM_INT);
            $stmt->execute();
            $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Enroll in quizzes
            $query = "INSERT INTO quiz_enrollments (
                        user_id, quiz_id, program_id, enrollment_date, status
                      ) VALUES (
                        :user_id, :quiz_id, :program_id, NOW(), 'not_started'
                      )";
            $quizStmt = $pdo->prepare($query);

            foreach ($quizzes as $quiz) {
                // Check if already enrolled in quiz
                $query = "SELECT id FROM quiz_enrollments 
                          WHERE user_id = :user_id AND quiz_id = :quiz_id";
                $checkStmt = $pdo->prepare($query);
                $checkStmt->bindParam(':user_id', $traineeId, PDO::PARAM_INT);
                $checkStmt->bindParam(':quiz_id', $quiz['id'], PDO::PARAM_INT);
                $checkStmt->execute();

                if ($checkStmt->rowCount() == 0) {
                    $quizStmt->bindParam(':user_id', $traineeId, PDO::PARAM_INT);
                    $quizStmt->bindParam(':quiz_id', $quiz['id'], PDO::PARAM_INT);
                    $quizStmt->bindParam(':program_id', $programId, PDO::PARAM_INT);
                    $quizStmt->execute();
                    $enrollmentStats['quiz_enrollments']++;

                    // Create notification for quiz enrollment
                    $query = "INSERT INTO notifications (
                                user_id, type, title, message, created_at
                              ) VALUES (
                                :user_id, 'info', 'New Quiz Enrollment', :message, NOW()
                              )";
                    $notifStmt = $pdo->prepare($query);
                    $message = "You have been enrolled in the quiz: " . $quiz['title'];
                    $notifStmt->bindParam(':user_id', $traineeId);
                    $notifStmt->bindParam(':message', $message);
                    $notifStmt->execute();
                }
            }

            // Fetch position-specific programs
            $query = "SELECT p.id, p.title 
                      FROM programs p 
                      JOIN position_program_relation ppr ON p.id = ppr.program_id 
                      WHERE ppr.position_id = :position_id";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':position_id', $positionId, PDO::PARAM_INT);
            $stmt->execute();
            $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Enroll in additional programs
            $query = "INSERT INTO program_enrollments (
                        user_id, program_id, enrollment_date, completion_status, completion_percentage
                      ) VALUES (
                        :user_id, :program_id, NOW(), 'not_started', 0
                      )";
            $progStmt = $pdo->prepare($query);

            foreach ($programs as $prog) {
                if ($prog['id'] != $programId) { // Avoid re-enrolling in the same program
                    // Check if already enrolled
                    $query = "SELECT id FROM program_enrollments 
                              WHERE user_id = :user_id AND program_id = :program_id";
                    $checkStmt = $pdo->prepare($query);
                    $checkStmt->bindParam(':user_id', $traineeId, PDO::PARAM_INT);
                    $checkStmt->bindParam(':program_id', $prog['id'], PDO::PARAM_INT);
                    $checkStmt->execute();

                    if ($checkStmt->rowCount() == 0) {
                        $progStmt->bindParam(':user_id', $traineeId, PDO::PARAM_INT);
                        $progStmt->bindParam(':program_id', $prog['id'], PDO::PARAM_INT);
                        $progStmt->execute();
                        $enrollmentStats['additional_program_enrollments']++;

                        // Create notification for program enrollment
                        $query = "INSERT INTO notifications (
                                    user_id, type, title, message, created_at
                                  ) VALUES (
                                    :user_id, 'info', 'New Program Enrollment', :message, NOW()
                                  )";
                        $notifStmt = $pdo->prepare($query);
                        $message = "You have been enrolled in the program: " . $prog['title'];
                        $notifStmt->bindParam(':user_id', $traineeId);
                        $notifStmt->bindParam(':message', $message);
                        $notifStmt->execute();
                    }
                }
            }
        }
    }

    // Create notifications for program enrollments
    if ($enrollmentStats['newly_enrolled'] > 0) {
        $query = "INSERT INTO notifications (
                    user_id, type, title, message, created_at
                  ) VALUES (
                    :user_id, 'info', 'New Program Enrollment', :message, NOW()
                  )";
        $stmt = $pdo->prepare($query);

        foreach ($newEnrollments as $traineeId) {
            $message = "You have been enrolled in the program: " . $program['title'];
            $stmt->bindParam(':user_id', $traineeId);
            $stmt->bindParam(':message', $message);
            $stmt->execute();
        }
    }

    // Commit transaction
    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Trainees enrolled successfully',
        'stats' => $enrollmentStats
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Error in enroll_trainees.php: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while enrolling trainees: ' . $e->getMessage()]);
}
exit;
?>