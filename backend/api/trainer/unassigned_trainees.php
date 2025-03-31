<?php
// File: lms-forbes/backend/api/trainer/unassigned_trainees.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

// Basic method check
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

// [NO TOKEN CHECK] - We removed the authentication portion

// Now read programId from the query string
$programId = isset($_GET['programId']) ? (int)$_GET['programId'] : 0;
if (!$programId) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing programId parameter']);
  exit;
}

try {
  // Get all trainees who are NOT in program_enrollments
  $sql = "
    SELECT u.id, u.full_name, u.email
    FROM users u
    WHERE u.role = 'trainee'
      AND u.status = 'active'
      AND u.id NOT IN (
        SELECT user_id
        FROM program_enrollments
        WHERE program_id = :programId
      )
  ";
  $stmt = $pdo->prepare($sql);
  $stmt->bindValue(':programId', $programId, PDO::PARAM_INT);
  $stmt->execute();

  $unassignedTrainees = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($unassignedTrainees);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
exit;
