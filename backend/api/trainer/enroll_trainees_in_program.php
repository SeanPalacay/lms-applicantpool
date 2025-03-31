<?php
// lms-forbes/backend/api/trainer/enroll_trainees_in_program.php

// ===========================================================
//  FOR LOCAL DEBUGGING ONLY — NO AUTH, NO METHOD CHECKS
// ===========================================================

// If you want basic cross-origin headers
require_once '../../shared/cors_middleware.php'; 
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

// Turn error display on for debugging (optional):
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Grab JSON data from the request body (if any)
$requestData = json_decode(file_get_contents('php://input'), true) ?? [];

// Alternatively, read from GET/POST if you want to test in browser
$programId = $requestData['programId'] 
    ?? $_REQUEST['programId'] 
    ?? null;

$traineeIds = $requestData['traineeIds'] 
    ?? (isset($_REQUEST['traineeIds']) ? explode(',', $_REQUEST['traineeIds']) : []);

// Make sure we have a programId and some traineeIds
if (!$programId || empty($traineeIds)) {
  http_response_code(400);
  echo json_encode(['error' => 'programId and traineeIds are required']);
  exit;
}

// Check if the program exists
$query = "SELECT id, title, type FROM programs WHERE id = :programId";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
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

  // Check if trainees exist and are valid
  // We'll expect them to be 'trainee' and 'active'
  $placeholders = implode(',', array_fill(0, count($traineeIds), '?'));
  $query = "
    SELECT id, full_name, email
    FROM users
    WHERE id IN ($placeholders)
      AND role = 'trainee'
      AND status = 'active'
  ";
  $stmt = $pdo->prepare($query);
  foreach ($traineeIds as $index => $traineeId) {
    $stmt->bindValue($index + 1, $traineeId, PDO::PARAM_INT);
  }
  $stmt->execute();
  $foundTrainees = $stmt->fetchAll(PDO::FETCH_ASSOC);

  if (count($foundTrainees) !== count($traineeIds)) {
    // Some IDs not found or not active
    $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['error' => 'Some trainee IDs not found or not active']);
    exit;
  }

  // Check who is already enrolled
  $checkEnrollQuery = "
    SELECT user_id
    FROM program_enrollments
    WHERE program_id = :programId
      AND user_id IN ($placeholders)
  ";
  $checkStmt = $pdo->prepare($checkEnrollQuery);
  $checkStmt->bindValue(':programId', $programId, PDO::PARAM_INT);

  // Next placeholders for user IDs
  foreach ($traineeIds as $index => $traineeId) {
    $checkStmt->bindValue($index + 1, $traineeId, PDO::PARAM_INT);
  }
  $checkStmt->execute();
  $alreadyEnrolled = $checkStmt->fetchAll(PDO::FETCH_COLUMN);

  // Figure out which are new
  $newEnrollments = array_diff($traineeIds, $alreadyEnrolled);

  $enrollmentStats = [
    'total_requested' => count($traineeIds),
    'already_enrolled' => count($alreadyEnrolled),
    'newly_enrolled' => 0
  ];

  // Insert any new enrollments
  if (!empty($newEnrollments)) {
    $insertQuery = "
      INSERT INTO program_enrollments (
        user_id,
        program_id,
        enrollment_date,
        completion_status,
        completion_percentage
      ) VALUES (
        :user_id,
        :program_id,
        NOW(),
        'not_started',
        0
      )
    ";
    $insertStmt = $pdo->prepare($insertQuery);

    foreach ($newEnrollments as $traineeId) {
      $insertStmt->bindValue(':user_id', $traineeId, PDO::PARAM_INT);
      $insertStmt->bindValue(':program_id', $programId, PDO::PARAM_INT);
      $insertStmt->execute();
      $enrollmentStats['newly_enrolled']++;
    }

    // Optionally create notifications for newly enrolled trainees
    $notifQuery = "
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        created_at
      ) VALUES (
        :user_id,
        'info',
        'New Program Enrollment',
        :message,
        NOW()
      )
    ";
    $notifStmt = $pdo->prepare($notifQuery);

    foreach ($newEnrollments as $traineeId) {
      $message = "You have been enrolled in the program: " . $program['title'];
      $notifStmt->bindValue(':user_id', $traineeId, PDO::PARAM_INT);
      $notifStmt->bindValue(':message', $message, PDO::PARAM_STR);
      $notifStmt->execute();
    }
  }

  // Commit
  $pdo->commit();

  http_response_code(200);
  echo json_encode([
    'success' => true,
    'message' => 'Trainees enrolled successfully',
    'stats' => $enrollmentStats
  ]);

} catch (Exception $e) {
  if ($pdo->inTransaction()) {
    $pdo->rollBack();
  }
  error_log('Error in enroll_trainees_in_program.php: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'An error occurred while enrolling trainees']);
}
exit;
