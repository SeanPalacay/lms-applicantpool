<?php
// lms-forbes/backend/api/trainee/quiz_feedback.php
ob_start(); // Buffer output to prevent early output
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Log all errors to file
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');
error_reporting(E_ALL);

try {
    // Check TCPDF availability (only for PDF format)
    $format = isset($_GET['format']) && $_GET['format'] === 'pdf' ? 'pdf' : 'json';
    if ($format === 'pdf') {
        if (!file_exists(__DIR__ . '/../../shared/tcpdf/tcpdf.php')) {
            throw new Exception('TCPDF library not found at shared/tcpdf/tcpdf.php');
        }
        require_once __DIR__ . '/../../shared/tcpdf/tcpdf.php';
    }

    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    $token = '';

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    }

    if (empty($token)) {
        ob_clean();
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }

    $decodedToken = base64_decode($token);
    if ($decodedToken === false || strpos($decodedToken, ':') === false) {
        ob_clean();
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid token format']);
        exit;
    }

    list($userId, $timestamp) = explode(':', $decodedToken);

    if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
        ob_clean();
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }

    $query = "SELECT id, role FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || ($user['role'] !== 'trainee' && $user['role'] !== 'administrator')) {
        ob_clean();
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    $quizId = isset($_GET['quizId']) ? (int)$_GET['quizId'] : 0;
    $attemptId = isset($_GET['attemptId']) ? (int)$_GET['attemptId'] : 0;

    if ($quizId <= 0 || $attemptId <= 0) {
        ob_clean();
        http_response_code(400);
        header('Content-Type: application/json');
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
        ob_clean();
        http_response_code(404);
        header('Content-Type: application/json');
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
        ob_clean();
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Attempt not found']);
        exit;
    }

    // Fetch questions and answers
    $query = "SELECT q.id, q.question_type, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, 
                     qaa.selected_answer AS answer
              FROM questions q
              LEFT JOIN quiz_attempt_answers qaa ON q.id = qaa.question_id AND qaa.attempt_id = :attemptId
              WHERE q.quiz_id = :quizId
              ORDER BY q.id ASC";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate correct answers
    $correctCount = 0;
    $totalQuestions = 0;
    foreach ($questions as &$q) {
        if ($q['question_type'] === 'essay') {
            continue; // Essays are manually graded
        }
        $totalQuestions++;
        $isCorrect = false;

        switch ($q['question_type']) {
            case 'multiple_choice':
            case 'true_false':
                $isCorrect = $q['answer'] === $q['correct_answer'];
                break;
            case 'multiple_answer':
                $correctOptions = $q['correct_answer'] ? explode(',', $q['correct_answer']) : [];
                $submittedOptions = $q['answer'] ? explode(',', $q['answer']) : [];
                sort($correctOptions);
                sort($submittedOptions);
                $isCorrect = $submittedOptions === $correctOptions;
                break;
            case 'identification':
                $isCorrect = strtolower(trim($q['answer'] ?? '')) === strtolower(trim($q['correct_answer'] ?? ''));
                break;
            case 'matching':
                $submittedMatches = json_decode($q['answer'] ?? '{}', true) ?: [];
                $correctPairs = json_decode($q['correct_answer'] ?? '{}', true) ?: [];
                $correctMatches = [];
                foreach ($correctPairs as $pair) {
                    $correctMatches[$pair['key']] = $pair['right'];
                }
                $allCorrect = true;
                foreach ($submittedMatches as $leftKey => $rightKey) {
                    if (!isset($correctMatches[$leftKey]) || $correctMatches[$leftKey] !== $rightKey) {
                        $allCorrect = false;
                        break;
                    }
                }
                $isCorrect = $allCorrect && count($submittedMatches) === count($correctMatches);
                break;
        }
        if ($isCorrect) {
            $correctCount++;
        }
    }
    unset($q);

    $attempt['correct_answers'] = $correctCount;
    $attempt['answers'] = array_map(function($q) {
        return ['question_id' => $q['id'], 'answer' => $q['answer']];
    }, $questions);

    // Prepare response
    $response = [
        'quiz' => [
            'title' => $quiz['title'],
            'passing_score' => (float)$quiz['passing_score']
        ],
        'attempt' => [
            'score' => (float)$attempt['score'],
            'feedback' => $attempt['feedback'],
            'attempt_date' => $attempt['attempt_date'],
            'correct_answers' => $correctCount,
            'answers' => $attempt['answers']
        ],
        'questions' => array_map(function($q) {
            return [
                'id' => $q['id'],
                'question_type' => $q['question_type'],
                'question_text' => $q['question_text'],
                'option_a' => $q['option_a'],
                'option_b' => $q['option_b'],
                'option_c' => $q['option_c'],
                'option_d' => $q['option_d'],
                'correct_answer' => $q['correct_answer']
            ];
        }, $questions)
    ];

    ob_clean(); // Clear any buffered output
    if ($format === 'pdf') {
        $pdf = new TCPDF();
        $pdf->SetCreator('LMS Forbes');
        $pdf->SetAuthor('LMS Forbes');
        $pdf->SetTitle('Quiz Feedback');
        $pdf->SetMargins(15, 15, 15);
        $pdf->AddPage();
        $pdf->SetFont('helvetica', 'B', 16);
        $pdf->Cell(0, 10, 'Quiz Feedback: ' . $quiz['title'], 0, 1, 'C');
        $pdf->Ln(5);
        $pdf->SetFont('helvetica', '', 12);
        $pdf->Cell(0, 10, 'Score: ' . $attempt['score'] . '%', 0, 1);
        $pdf->Cell(0, 10, 'Passing Score: ' . $quiz['passing_score'] . '%', 0, 1);
        $pdf->Cell(0, 10, 'Correct Answers: ' . $correctCount . ' / ' . $totalQuestions, 0, 1);
        $pdf->Cell(0, 10, 'Attempt Date: ' . $attempt['attempt_date'], 0, 1);
        if ($attempt['feedback']) {
            $pdf->Cell(0, 10, 'Feedback: ' . $attempt['feedback'], 0, 1);
        }
        $pdf->Ln(10);
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'Question Review', 0, 1);
        $pdf->SetFont('helvetica', '', 10);

        foreach ($questions as $index => $q) {
            $userAnswer = $q['answer'];
            $pdf->Cell(0, 8, 'Question ' . ($index + 1) . ' (' . $q['question_type'] . '): ' . $q['question_text'], 0, 1);
            if (in_array($q['question_type'], ['multiple_choice', 'true_false'])) {
                foreach (['a', 'b', 'c', 'd'] as $option) {
                    if ($q['option_' . $option]) {
                        $prefix = ($q['correct_answer'] === $option) ? '[Correct] ' : '';
                        $prefix .= ($userAnswer === $option) ? ($userAnswer === $q['correct_answer'] ? '[Your Answer - Correct]' : '[Your Answer - Incorrect]') : '';
                        $pdf->Cell(0, 6, $prefix . 'Option ' . strtoupper($option) . ': ' . $q['option_' . $option], 0, 1);
                    }
                }
            } else {
                $pdf->Cell(0, 6, 'Your Answer: ' . ($userAnswer ?: 'None'), 0, 1);
                if ($q['question_type'] !== 'essay') {
                    $pdf->Cell(0, 6, 'Correct Answer: ' . ($q['correct_answer'] ?: 'None'), 0, 1);
                } else {
                    $pdf->Cell(0, 6, 'Status: Awaiting manual grading', 0, 1);
                }
            }
            $pdf->Ln(5);
        }

        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="Quiz_Results_' . $quizId . '.pdf"');
        $pdf->Output('Quiz_Results_' . $quizId . '.pdf', 'D');
        exit;
    } else {
        header('Content-Type: application/json');
        http_response_code(200);
        echo json_encode($response);
    }
} catch (PDOException $e) {
    ob_clean();
    error_log('PDO Error in quiz_feedback.php: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    ob_clean();
    error_log('General Error in quiz_feedback.php: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'An error occurred: ' . $e->getMessage()]);
}
ob_end_flush();
?>