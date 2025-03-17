<?php
// lms-forbes/backend/api/trainee/take_quiz.php
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

    if (!$user || ($user['role'] !== 'trainee' && $user['role'] !== 'administrator')) {
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $quizId = isset($_GET['quizId']) ? $_GET['quizId'] : '';
        if (empty($quizId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Quiz ID is required']);
            exit;
        }

        // Fetch quiz details
        $query = "SELECT id, title, description, time_limit, passing_score 
                  FROM quizzes 
                  WHERE id = :quizId AND status = 'active'";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$quiz) {
            http_response_code(404);
            echo json_encode(['error' => 'Quiz not found or not active']);
            exit;
        }

        // Fetch questions
        $query = "SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer 
                  FROM quiz_questions 
                  WHERE quiz_id = :quizId";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(['quiz' => $quiz, 'questions' => $questions]);
    } elseif ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $quizId = $input['quiz_id'] ?? '';
        $answers = $input['answers'] ?? [];

        if (empty($quizId) || empty($answers)) {
            http_response_code(400);
            echo json_encode(['error' => 'Quiz ID and answers are required']);
            exit;
        }

        // Fetch quiz details
        $query = "SELECT passing_score FROM quizzes WHERE id = :quizId AND status = 'active'";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$quiz) {
            http_response_code(404);
            echo json_encode(['error' => 'Quiz not found or not active']);
            exit;
        }

        // Fetch correct answers
        $query = "SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = :quizId";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        $correctAnswers = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $correctCount = 0;
        $totalQuestions = count($correctAnswers);

        foreach ($answers as $answer) {
            $questionId = $answer['question_id'];
            if (isset($correctAnswers[$questionId]) && $correctAnswers[$questionId] === $answer['answer']) {
                $correctCount++;
            }
        }

        $score = ($totalQuestions > 0) ? ($correctCount / $totalQuestions) * 100 : 0;
        $feedback = $score >= $quiz['passing_score'] ? 'Good job!' : 'Review the material and try again.';

        // Insert quiz attempt
        $query = "INSERT INTO quiz_attempts (user_id, quiz_id, score, feedback, attempt_date) 
                  VALUES (:userId, :quizId, :score, :feedback, NOW())";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->bindParam(':score', $score);
        $stmt->bindParam(':feedback', $feedback);
        $stmt->execute();

        $attemptId = $pdo->lastInsertId();

        // Insert answers
        $query = "INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_answer) 
                  VALUES (:attemptId, :questionId, :answer)";
        $stmt = $pdo->prepare($query);

        foreach ($answers as $answer) {
            $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
            $stmt->bindParam(':questionId', $answer['question_id'], PDO::PARAM_INT);
            $stmt->bindParam(':answer', $answer['answer']);
            $stmt->execute();
        }

        http_response_code(200);
        echo json_encode(['attempt_id' => $attemptId]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    error_log('Error in take_quiz.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>