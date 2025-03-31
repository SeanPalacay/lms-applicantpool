<?php
// lms-forbes/backend/api/trainee/quiz_feedback.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

ini_set('display_errors', 0);
error_reporting(E_ERROR);

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

    $quizId = isset($_GET['quizId']) ? $_GET['quizId'] : '';
    $attemptId = isset($_GET['attemptId']) ? $_GET['attemptId'] : '';
    $format = isset($_GET['format']) && $_GET['format'] === 'pdf' ? 'pdf' : 'json';

    if (empty($quizId) || empty($attemptId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Quiz ID and Attempt ID are required']);
        exit;
    }

    // Fetch quiz details
    $query = "SELECT id, title, description, time_limit, passing_score 
              FROM quizzes 
              WHERE id = :quizId";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->execute();
    $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$quiz) {
        http_response_code(404);
        echo json_encode(['error' => 'Quiz not found']);
        exit;
    }

    // Fetch attempt details
    $query = "SELECT score, feedback, attempt_date 
              FROM quiz_attempts 
              WHERE id = :attemptId AND quiz_id = :quizId AND user_id = :userId";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $attempt = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$attempt) {
        http_response_code(404);
        echo json_encode(['error' => 'Attempt not found']);
        exit;
    }

    // Fetch questions and answers
    $query = "SELECT qq.id, qq.question_text, qq.option_a, qq.option_b, qq.option_c, qq.option_d, qq.correct_answer, 
                     qaa.selected_answer AS answer
              FROM quiz_questions qq
              LEFT JOIN quiz_attempt_answers qaa ON qq.id = qaa.question_id AND qaa.attempt_id = :attemptId
              WHERE qq.quiz_id = :quizId";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $correctCount = 0;
    foreach ($questions as $q) {
        if ($q['answer'] === $q['correct_answer']) {
            $correctCount++;
        }
    }
    $attempt['correct_answers'] = $correctCount;
    $attempt['answers'] = array_map(function($q) {
        return ['question_id' => $q['id'], 'answer' => $q['answer']];
    }, $questions);

    if ($format === 'pdf') {
        require_once 'vendor/autoload.php'; // Assuming TCPDF or similar is installed via Composer
        $pdf = new TCPDF();
        $pdf->AddPage();
        $pdf->SetFont('helvetica', '', 12);
        $pdf->Write(0, "Quiz Results: {$quiz['title']}\n\n");
        $pdf->Write(0, "Score: {$attempt['score']}%\n");
        $pdf->Write(0, "Passing Score: {$quiz['passing_score']}%\n");
        $pdf->Write(0, "Correct Answers: {$correctCount} / " . count($questions) . "\n");
        $pdf->Write(0, "Attempt Date: " . $attempt['attempt_date'] . "\n\n");
        $pdf->Write(0, "Feedback: {$attempt['feedback']}\n\n");

        foreach ($questions as $index => $q) {
            $pdf->Write(0, "Question " . ($index + 1) . ": {$q['question_text']}\n");
            $pdf->Write(0, "Your Answer: {$q['answer']}\n");
            $pdf->Write(0, "Correct Answer: {$q['correct_answer']}\n\n");
        }

        header('Content-Type: application/pdf');
        $pdf->Output("Quiz_Results_{$quizId}.pdf", 'I');
        exit;
    } else {
        http_response_code(200);
        echo json_encode(['quiz' => $quiz, 'attempt' => $attempt, 'questions' => $questions]);
    }
} catch (PDOException $e) {
    error_log('Error in quiz_feedback.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>