<?php
// lms-forbes/backend/api/trainer/programs.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

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

// Fetch programs created by this trainer
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
exit;
?>