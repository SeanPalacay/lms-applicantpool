<?php
// lms-forbes/backend/api/admin/leaderboard.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

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

list($userId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24-hour expiration)
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

// Verify administrator role
$query = "SELECT role FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $userId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(403);
    echo json_encode(['error' => 'Permission denied', 'details' => 'User not found for ID: ' . $userId]);
    exit;
}
if ($user['role'] !== 'administrator') {
    http_response_code(403);
    echo json_encode(['error' => 'Permission denied', 'details' => 'User role is ' . $user['role'] . ', administrator role required']);
    exit;
}

// Get pool_id parameter
$poolId = isset($_GET['pool_id']) ? $_GET['pool_id'] : null;
if (!$poolId) {
    http_response_code(400);
    echo json_encode(['error' => 'pool_id parameter is required']);
    exit;
}

try {
    // Get trainees in the specified pool with batch and position info
    $query = "
        SELECT 
            u.id AS trainee_id,
            u.full_name,
            pe.batch_id,
            pe.position_id,
            p.position_name AS position_name,
            pe.program_id,
            pr.title AS program_name
        FROM 
            users u
        JOIN 
            pool_enrollments pe ON u.id = pe.user_id
        JOIN 
            job_positions p ON pe.position_id = p.id
        JOIN 
            programs pr ON pe.program_id = pr.id
        WHERE 
            u.role = 'trainee'
            AND pe.pool_id = :pool_id
    ";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':pool_id', $poolId, PDO::PARAM_INT);
    $stmt->execute();
    $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Initialize result structure
    $result = [
        'byBatch' => [],
        'byPosition' => []
    ];

    // Process each trainee
    foreach ($trainees as &$trainee) {
        // Get quiz attempts
        $quizQuery = "
            SELECT 
                AVG(qa.score) AS avg_score
            FROM 
                quiz_attempts qa
            JOIN 
                quizzes q ON qa.quiz_id = q.id
            WHERE 
                qa.user_id = :user_id
                AND q.program_id = :program_id
        ";
        $stmt = $pdo->prepare($quizQuery);
        $stmt->bindParam(':user_id', $trainee['trainee_id'], PDO::PARAM_INT);
        $stmt->bindParam(':program_id', $trainee['program_id'], PDO::PARAM_INT);
        $stmt->execute();
        $quizResult = $stmt->fetch(PDO::FETCH_ASSOC);
        $quizScore = $quizResult['avg_score'] ? floatval($quizResult['avg_score']) : 0;

        // Get practical exam attempts
        $examQuery = "
            SELECT 
                AVG(pea.score) AS avg_score
            FROM 
                practical_exam_attempts pea
            JOIN 
                practical_exams pe ON pea.exam_id = pe.id
            WHERE 
                pea.user_id = :user_id
                AND pe.program_id = :program_id
            AND pea.graded_at IS NOT NULL
        ";
        $stmt = $pdo->prepare($examQuery);
        $stmt->bindParam(':user_id', $trainee['trainee_id'], PDO::PARAM_INT);
        $stmt->bindParam(':program_id', $trainee['program_id'], PDO::PARAM_INT);
        $stmt->execute();
        $examResult = $stmt->fetch(PDO::FETCH_ASSOC);
        $examScore = $examResult['avg_score'] ? floatval($examResult['avg_score']) : 0;

        // Get grading configuration
        $configQuery = "SELECT * FROM grade_configuration LIMIT 1";
        $stmt = $pdo->prepare($configQuery);
        $stmt->execute();
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calculate overall score based on weights
        if ($config) {
            $quizWeight = floatval($config['quiz_weight']);
            $practicalWeight = floatval($config['practical_exam_weight']);
        } else {
            // Default weights
            $quizWeight = 0.60;
            $practicalWeight = 0.40;
        }

        // Calculate score
        if ($quizScore > 0 && $examScore > 0) {
            $trainee['score'] = round(($quizScore * $quizWeight) + ($examScore * $practicalWeight), 2);
        } elseif ($quizScore > 0) {
            $trainee['score'] = round($quizScore, 2);
        } elseif ($examScore > 0) {
            $trainee['score'] = round($examScore, 2);
        } else {
            $trainee['score'] = 0;
        }

        // Group by batch
        if (!isset($result['byBatch'][$trainee['batch_id']])) {
            $result['byBatch'][$trainee['batch_id']] = [];
        }
        $result['byBatch'][$trainee['batch_id']][] = $trainee;

        // Group by position
        if (!isset($result['byPosition'][$trainee['position_id']])) {
            $result['byPosition'][$trainee['position_id']] = [];
        }
        $result['byPosition'][$trainee['position_id']][] = $trainee;
    }

    // Sort each group by score (descending)
    foreach ($result['byBatch'] as &$batch) {
        usort($batch, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });
    }
    foreach ($result['byPosition'] as &$position) {
        usort($position, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });
    }

    http_response_code(200);
    echo json_encode($result);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
exit;
?>