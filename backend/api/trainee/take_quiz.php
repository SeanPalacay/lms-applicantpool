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

        // Fetch quiz details with enrollment check
        $query = "
            SELECT q.id, q.title, q.description, q.time_limit, q.passing_score 
            FROM quizzes q
            JOIN programs p ON q.program_id = p.id
            JOIN program_enrollments pe ON p.id = pe.program_id
            WHERE q.id = :quizId 
            AND q.status = 'active' 
            AND pe.user_id = :userId";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$quiz) {
            http_response_code(404);
            echo json_encode(['error' => 'Quiz not found, not active, or not enrolled']);
            exit;
        }

        // Fetch questions
        $query = "
            SELECT id, question_type, question_text, option_a, option_b, option_c, option_d, 
                   correct_answer 
            FROM questions 
            WHERE quiz_id = :quizId";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Process questions
        foreach ($questions as &$question) {
            $question['matching_pairs'] = []; // Default empty array
            if ($question['question_type'] === 'multiple_answer') {
                // Fetch correct options
                $optionsQuery = "
                    SELECT option_key 
                    FROM question_answer_options 
                    WHERE question_id = :questionId AND is_correct = 1";
                $optionsStmt = $pdo->prepare($optionsQuery);
                $optionsStmt->bindParam(':questionId', $question['id'], PDO::PARAM_INT);
                $optionsStmt->execute();
                $correctOptions = $optionsStmt->fetchAll(PDO::FETCH_COLUMN);
                $question['correct_answers'] = $correctOptions;
                $question['correct_answer'] = implode(',', $correctOptions);
            } elseif ($question['question_type'] === 'matching') {
                // Fetch matching pairs
                $pairsQuery = "
                    SELECT `key`, left_item AS `left`, right_item AS `right`
                    FROM matching_pairs 
                    WHERE question_id = :questionId";
                $pairsStmt = $pdo->prepare($pairsQuery);
                $pairsStmt->bindParam(':questionId', $question['id'], PDO::PARAM_INT);
                $pairsStmt->execute();
                $question['matching_pairs'] = $pairsStmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }
        unset($question);

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

        // Fetch quiz details with enrollment check
        $query = "
            SELECT q.passing_score 
            FROM quizzes q
            JOIN programs p ON q.program_id = p.id
            JOIN program_enrollments pe ON p.id = pe.program_id
            WHERE q.id = :quizId 
            AND q.status = 'active' 
            AND pe.user_id = :userId";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$quiz) {
            http_response_code(404);
            echo json_encode(['error' => 'Quiz not found, not active, or not enrolled']);
            exit;
        }

        // Fetch questions
        $query = "
            SELECT id, question_type, correct_answer 
            FROM questions 
            WHERE quiz_id = :quizId";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $questionsById = [];
        foreach ($questions as $question) {
            $questionsById[$question['id']] = $question;
        }

        $correctCount = 0;
        $totalQuestions = count($questions);
        $needsGrading = [];

        foreach ($answers as $answer) {
            $questionId = $answer['question_id'];
            $submittedAnswer = $answer['answer'];
            $questionType = $answer['question_type'] ?? 'multiple_choice';

            if (!isset($questionsById[$questionId])) continue;

            $question = $questionsById[$questionId];
            $isCorrect = false;

            switch ($questionType) {
                case 'multiple_choice':
                case 'true_false':
                    $isCorrect = ($submittedAnswer === $question['correct_answer']);
                    break;

                case 'multiple_answer':
                    $query = "
                        SELECT option_key 
                        FROM question_answer_options 
                        WHERE question_id = :questionId AND is_correct = 1";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':questionId', $questionId, PDO::PARAM_INT);
                    $stmt->execute();
                    $correctOptions = $stmt->fetchAll(PDO::FETCH_COLUMN);

                    $submittedOptions = $submittedAnswer ? explode(',', $submittedAnswer) : [];
                    sort($submittedOptions);
                    sort($correctOptions);
                    $isCorrect = ($submittedOptions == $correctOptions);
                    break;

                case 'matching':
                    // Fetch correct matching pairs
                    $pairsQuery = "
                        SELECT `key`, right_item AS `right`
                        FROM matching_pairs 
                        WHERE question_id = :questionId";
                    $pairsStmt = $pdo->prepare($pairsQuery);
                    $pairsStmt->bindParam(':questionId', $questionId, PDO::PARAM_INT);
                    $pairsStmt->execute();
                    $correctPairs = $pairsStmt->fetchAll(PDO::FETCH_ASSOC);

                    $correctMatches = [];
                    foreach ($correctPairs as $pair) {
                        $correctMatches[$pair['key']] = $pair['right'];
                    }

                    $submittedMatches = json_decode($submittedAnswer, true) ?: [];
                    $allCorrect = true;
                    foreach ($submittedMatches as $leftKey => $rightKey) {
                        if (!isset($correctMatches[$leftKey]) || $correctMatches[$leftKey] !== $rightKey) {
                            $allCorrect = false;
                            break;
                        }
                    }
                    $isCorrect = $allCorrect && count($submittedMatches) === count($correctMatches);
                    break;

                case 'identification':
                    $isCorrect = (strtolower(trim($submittedAnswer)) === strtolower(trim($question['correct_answer'])));
                    break;

                case 'essay':
                    $needsGrading[] = $questionId;
                    $totalQuestions--;
                    continue 2;
            }

            if ($isCorrect) {
                $correctCount++;
            }
        }

        $score = ($totalQuestions > 0) ? ($correctCount / $totalQuestions) * 100 : 0;
        $feedback = !empty($needsGrading) ? "Note: Your essay questions will be graded manually. " : "";
        $feedback .= $score >= $quiz['passing_score'] ? 'Good job!' : 'Review the material and try again.';

        $query = "
            INSERT INTO quiz_attempts (user_id, quiz_id, score, feedback, attempt_date) 
            VALUES (:userId, :quizId, :score, :feedback, NOW())";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->bindParam(':score', $score);
        $stmt->bindParam(':feedback', $feedback);
        $stmt->execute();

        $attemptId = $pdo->lastInsertId();

        $query = "
            INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_answer) 
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