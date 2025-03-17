<?php
// lms-forbes/backend/api/trainer/quizzes.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

try {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }

    $token = $matches[1];
    $decodedToken = base64_decode($token);
    if ($decodedToken === false || strpos($decodedToken, ':') === false) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token format']);
        exit;
    }

    list($trainerId, $timestamp) = explode(':', $decodedToken);
    if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
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

    $programId = isset($_GET['programId']) ? (int)$_GET['programId'] : 0;
    $whereClause = $programId ? "AND q.program_id = :programId" : "AND p.created_by = :trainerId";

    $query = "
        SELECT 
            q.id,
            q.title,
            q.description,
            q.program_id,
            q.time_limit,
            q.passing_score,
            (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
            (SELECT AVG(qa.score) FROM quiz_attempts qa WHERE qa.quiz_id = q.id) AS average_score,
            (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.score >= q.passing_score) * 100.0 /
            NULLIF((SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id), 0) AS pass_rate,
            (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz_id = q.id) AS attempt_count
        FROM 
            quizzes q
        JOIN 
            programs p ON q.program_id = p.id
        WHERE 
            1=1 $whereClause
        ORDER BY 
            q.id DESC
    ";
    $stmt = $pdo->prepare($query);
    if ($programId) {
        $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    } else {
        $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
    }
    $stmt->execute();
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($quizzes);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
exit;