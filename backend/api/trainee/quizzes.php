<?php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

ini_set('display_errors', 0);
error_reporting(E_ERROR);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}

list($userId, $timestamp) = explode(':', $decodedToken);

if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

try {
    $query = "SELECT id, role FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    if ($user['role'] !== 'trainee' && $user['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    $programId = isset($_GET['programId']) ? $_GET['programId'] : '';
    if (empty($programId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Program ID is required']);
        exit;
    }

    $query = "
        SELECT q.id, q.title, q.description, q.time_limit, q.passing_score,
               qa.id AS attempt_id, qa.score, qa.feedback, qa.attempt_date
        FROM quizzes q
        LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.user_id = :userId
        WHERE q.program_id = :programId AND q.status IN ('active', 'draft')
        ORDER BY q.created_at ASC, qa.attempt_date DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $quizzes = [];
    $quizMap = [];

    foreach ($results as $row) {
        $quizId = $row['id'];
        if (!isset($quizMap[$quizId])) {
            $quizMap[$quizId] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'description' => $row['description'],
                'time_limit' => $row['time_limit'],
                'passing_score' => $row['passing_score'],
                'attempts' => []
            ];
        }

        if ($row['attempt_id'] !== null) {
            $quizMap[$quizId]['attempts'][] = [
                'id' => $row['attempt_id'],
                'score' => $row['score'],
                'feedback' => $row['feedback'],
                'attempt_date' => $row['attempt_date']
            ];
        }
    }

    $quizzes = array_values($quizMap);
    
    http_response_code(200);
    echo json_encode($quizzes);

} catch (PDOException $e) {
    error_log('Error in trainee_quizzes.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
    error_log('Error in trainee_quizzes.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while fetching quizzes']);
}
?>