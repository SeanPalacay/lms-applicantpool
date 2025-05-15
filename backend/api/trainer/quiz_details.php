<?php
// lms-forbes/backend/api/trainer/quiz_details.php

ini_set('display_errors', 0);
error_reporting(E_ERROR);

// Include CORS middleware
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Fallback CORS headers (in case middleware fails)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Authentication
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

try {
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

    // Validate quizId
    $quizId = isset($_GET['quizId']) ? (int)$_GET['quizId'] : 0;
    if ($quizId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid quiz ID']);
        exit;
    }

    // Fetch quiz details
    $query = "
        SELECT 
            q.id,
            q.title,
            q.description,
            q.program_id,
            p.title AS program_title,
            q.time_limit,
            q.passing_score,
            q.status,
            q.created_at,
            q.created_by,
            u.full_name AS created_by_name,
            q.auto_grade,
            q.grade_on_submission,
            q.show_correct_answers,
            q.show_grade_immediately,
            q.grade_weighting,
            q.auto_feedback
        FROM 
            quizzes q
        LEFT JOIN 
            programs p ON q.program_id = p.id
        LEFT JOIN 
            users u ON q.created_by = u.id
        WHERE 
            q.id = :quizId
            AND (q.created_by = :trainerId OR p.created_by = :trainerId)
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
    $stmt->execute();
    $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$quiz) {
        http_response_code(404);
        echo json_encode(['error' => 'Quiz not found or you do not have access']);
        exit;
    }

    // Handle draft status
    if ($quiz['status'] === 'draft' && $quiz['created_by'] != $trainerId) {
        http_response_code(403);
        echo json_encode(['error' => 'Draft quiz is only accessible to its creator']);
        exit;
    }

    // Handle grade_weighting
    $quiz['grade_weighting'] = floatval($quiz['grade_weighting']) > 0 ? floatval($quiz['grade_weighting']) : 100.0;

    // Fetch questions
    $query = "
        SELECT 
            id,
            question_type,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer
        FROM 
            questions
        WHERE 
            quiz_id = :quizId
        ORDER BY id
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Process multiple_answer questions
    foreach ($questions as &$question) {
        if ($question['question_type'] === 'multiple_answer') {
            try {
                $query = "
                    SELECT option_text, option_key, is_correct
                    FROM quiz_question_answer_options
                    WHERE question_id = :questionId
                ";
                $optStmt = $pdo->prepare($query);
                $optStmt->bindParam(':questionId', $question['id'], PDO::PARAM_INT);
                $optStmt->execute();
                $question['answer_options'] = $optStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                error_log("Failed to fetch answer options for question {$question['id']}: " . $e->getMessage());
                $question['answer_options'] = [];
            }
        }
    }
    unset($question);

    // Fetch question weights
    $weights = [];
    try {
        $weightsQuery = "
            SELECT question_id AS question_index, weight
            FROM quiz_question_weights
            WHERE quiz_id = :quizId
            ORDER BY question_id
        ";
        $stmt = $pdo->prepare($weightsQuery);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        $weights = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Failed to fetch question weights for quiz $quizId: " . $e->getMessage());
    }

    // Fetch feedback templates
    $feedbackTemplates = [];
    try {
        $feedbackQuery = "
            SELECT min_score AS score_min, max_score AS score_max, template
            FROM quiz_feedback_templates
            WHERE quiz_id = :quizId
            ORDER BY min_score
        ";
        $stmt = $pdo->prepare($feedbackQuery);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        $feedbackTemplates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Failed to fetch feedback templates for quiz $quizId: " . $e->getMessage());
    }

    // Calculate performance statistics
    $stats = [
        'total_attempts' => 0,
        'pass_rate' => '0.00',
        'average_score' => 'N/A',
        'highest_score' => 'N/A',
        'lowest_score' => 'N/A'
    ];
    try {
        $query = "
            SELECT 
                COUNT(*) AS total_attempts,
                AVG(score) AS average_score,
                MAX(score) AS highest_score,
                MIN(score) AS lowest_score,
                (SUM(CASE WHEN score >= :passing_score THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100) AS pass_rate
            FROM 
                quiz_attempts
            WHERE 
                quiz_id = :quizId
        ";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->bindParam(':passing_score', $quiz['passing_score'], PDO::PARAM_STR);
        $stmt->execute();
        $statsData = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($statsData) {
            $stats = [
                'total_attempts' => (int)$statsData['total_attempts'],
                'pass_rate' => number_format($statsData['pass_rate'] ?? 0, 2),
                'average_score' => $statsData['average_score'] ? number_format($statsData['average_score'], 2) : 'N/A',
                'highest_score' => $statsData['highest_score'] ? number_format($statsData['highest_score'], 2) : 'N/A',
                'lowest_score' => $statsData['lowest_score'] ? number_format($statsData['lowest_score'], 2) : 'N/A'
            ];
        }
    } catch (PDOException $e) {
        error_log("Failed to fetch stats for quiz $quizId: " . $e->getMessage());
    }

    // Build response
    $quiz['questions'] = $questions;
    $quiz['question_weights'] = $weights;
    $quiz['feedback_templates'] = $feedbackTemplates;
    $quiz['stats'] = $stats;

    http_response_code(200);
    echo json_encode($quiz);
} catch (PDOException $e) {
    error_log("Database error in quiz_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
    exit;
} catch (Exception $e) {
    error_log("General error in quiz_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
    exit;
}
?>