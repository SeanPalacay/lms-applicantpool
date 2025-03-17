<?php
// lms-forbes/backend/api/trainer/program_details.php
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

// Verify trainer role and program ownership
$programId = isset($_GET['programId']) ? (int)$_GET['programId'] : 0;
if ($programId <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid program ID']);
  exit;
}

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

// Fetch program basic details
$query = "
  SELECT 
    p.id,
    p.title,
    p.description,
    p.type,
    'active' AS status, -- No status field in schema
    p.created_by,
    p.created_at,
    u.full_name AS createdByName
  FROM 
    programs p
  LEFT JOIN 
    users u ON p.created_by = u.id
  WHERE 
    p.id = :programId AND p.created_by = :trainerId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
$stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
$stmt->execute();
$program = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$program) {
  http_response_code(404);
  echo json_encode(['error' => 'Program not found or not owned by this trainer']);
  exit;
}

// Fetch enrollments
$query = "
  SELECT 
    pe.id,
    pe.user_id,
    u.full_name AS trainee_name,
    u.email AS trainee_email,
    pe.enrollment_date,
    pe.completion_status,
    pe.completion_percentage
  FROM 
    program_enrollments pe
  JOIN 
    users u ON pe.user_id = u.id
  WHERE 
    pe.program_id = :programId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
$stmt->execute();
$enrollments = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch milestones
$query = "
  SELECT 
    m.id,
    m.title,
    m.description,
    m.due_date,
    (SELECT COUNT(*) FROM milestone_progress mp 
     WHERE mp.milestone_id = m.id AND mp.status = 'completed') AS completionCount
  FROM 
    milestones m
  WHERE 
    m.program_id = :programId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
$stmt->execute();
$milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch quizzes
$query = "
  SELECT 
    q.id,
    q.title,
    q.description,
    q.time_limit,
    q.passing_score,
    (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
    (SELECT AVG(qa.score) FROM quiz_attempts qa WHERE qa.quiz_id = q.id) AS average_score,
    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.score >= q.passing_score) * 100.0 /
    NULLIF((SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id), 0) AS pass_rate,
    (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id) AS attempt_count
  FROM 
    quizzes q
  WHERE 
    q.program_id = :programId
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
$stmt->execute();
$quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate stats
$totalEnrollments = count($enrollments);
$completionRate = $totalEnrollments > 0 
  ? (array_sum(array_column($enrollments, 'completion_percentage')) / $totalEnrollments) 
  : 0;
$averageScoreQuery = "
  SELECT AVG(qa.score) 
  FROM quiz_attempts qa
  JOIN quizzes q ON qa.quiz_id = q.id
  WHERE q.program_id = :programId
";
$stmt = $pdo->prepare($averageScoreQuery);
$stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
$stmt->execute();
$averageScore = $stmt->fetchColumn() ?: 0;

// Fetch progress data (simplified: completion over time)
$query = "
  SELECT 
    DATE(pe.enrollment_date) AS date,
    AVG(pe.completion_percentage) AS completionRate
  FROM 
    program_enrollments pe
  WHERE 
    pe.program_id = :programId
  GROUP BY 
    DATE(pe.enrollment_date)
  ORDER BY 
    date ASC
";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
$stmt->execute();
$progressData = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Assemble response
$response = [
  'id' => $program['id'],
  'title' => $program['title'],
  'description' => $program['description'],
  'type' => $program['type'],
  'status' => $program['status'],
  'created_by' => $program['created_by'],
  'created_at' => $program['created_at'],
  'createdByName' => $program['createdByName'],
  'enrollments' => $enrollments,
  'milestones' => $milestones,
  'quizzes' => $quizzes,
  'stats' => [
    'totalEnrollments' => $totalEnrollments,
    'completionRate' => round($completionRate, 2),
    'averageScore' => round($averageScore, 2)
  ],
  'progressData' => $progressData
];

http_response_code(200);
echo json_encode($response);
exit;
?>