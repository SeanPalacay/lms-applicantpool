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

// In take_quiz.php, when fetching questions
$query = "SELECT id, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer 
FROM quiz_questions 
WHERE quiz_id = :quizId";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
$stmt->execute();
$questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Process multiple-answer questions to include correct options
foreach ($questions as &$question) {
if ($question['question_type'] === 'multiple_answer') {
// Fetch correct options from the quiz_question_answer_options table
$optionsQuery = "SELECT option_key FROM quiz_question_answer_options 
          WHERE question_id = :questionId AND is_correct = 1";
$optionsStmt = $pdo->prepare($optionsQuery);
$optionsStmt->bindParam(':questionId', $question['id'], PDO::PARAM_INT);
$optionsStmt->execute();
$correctOptions = $optionsStmt->fetchAll(PDO::FETCH_COLUMN);

// Add correct_answers array to question
$question['correct_answers'] = $correctOptions;

// Also set correct_answer for backward compatibility
$question['correct_answer'] = implode(',', $correctOptions);
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

        // Fetch all questions with their types and correct answers
        $query = "SELECT id, question_type, correct_answer FROM quiz_questions WHERE quiz_id = :quizId";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Index questions by ID for easy lookup
        $questionsById = [];
        foreach ($questions as $question) {
            $questionsById[$question['id']] = $question;
        }

        $correctCount = 0;
        $totalQuestions = count($questions);
        $needsGrading = []; // For essay questions

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
                    // Direct comparison
                    $isCorrect = ($submittedAnswer === $question['correct_answer']);
                    break;
                    
                case 'multiple_answer':
                    // For multiple answer questions
                    $submittedOptions = explode(',', $submittedAnswer);
                    
                    // Fetch correct options
                    $query = "SELECT option_key FROM quiz_question_answer_options 
                              WHERE question_id = :questionId AND is_correct = 1";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':questionId', $questionId, PDO::PARAM_INT);
                    $stmt->execute();
                    $correctOptions = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    // Check if arrays have the same elements (regardless of order)
                    sort($submittedOptions);
                    sort($correctOptions);
                    $isCorrect = ($submittedOptions == $correctOptions);
                    break;
                    
                case 'matching':
                    // For matching questions
                    $submittedMatches = json_decode($submittedAnswer, true);
                    
                    // Fetch correct matches
                    $query = "SELECT pair_key, right_item FROM quiz_question_matching_pairs 
                              WHERE question_id = :questionId";
                    $stmt = $pdo->prepare($query);
                    $stmt->bindParam(':questionId', $questionId, PDO::PARAM_INT);
                    $stmt->execute();
                    $matchingPairs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Create a map of correct matches
                    $correctMatches = [];
                    foreach ($matchingPairs as $pair) {
                        $correctMatches[$pair['pair_key']] = $pair['right_item'];
                    }
                    
                    // Check if all pairs match correctly
                    $allCorrect = true;
                    foreach ($submittedMatches as $leftKey => $rightKey) {
                        // Get the right item text for the submitted right key
                        $rightItemQuery = "SELECT right_item FROM quiz_question_matching_pairs 
                                          WHERE question_id = :questionId AND pair_key = :rightKey";
                        $stmt = $pdo->prepare($rightItemQuery);
                        $stmt->bindParam(':questionId', $questionId, PDO::PARAM_INT);
                        $stmt->bindParam(':rightKey', $rightKey, PDO::PARAM_STR);
                        $stmt->execute();
                        $rightItem = $stmt->fetchColumn();
                        
                        if (!isset($correctMatches[$leftKey]) || $correctMatches[$leftKey] !== $rightItem) {
                            $allCorrect = false;
                            break;
                        }
                    }
                    $isCorrect = $allCorrect && count($submittedMatches) === count($correctMatches);
                    break;
                    
                case 'identification':
                    // Case-insensitive comparison for identification
                    $isCorrect = (strtolower(trim($submittedAnswer)) === strtolower(trim($question['correct_answer'])));
                    break;
                    
                case 'essay':
                    // Essay questions need manual grading - mark for review
                    $needsGrading[] = $questionId;
                    // Don't count essay questions in automatic grading
                    $totalQuestions--;
                    continue 2;
            }
            
            if ($isCorrect) {
                $correctCount++;
            }
        }

        // Calculate score only from automatically graded questions
        $score = ($totalQuestions > 0) ? ($correctCount / $totalQuestions) * 100 : 0;
        
        // If there are essay questions, note that in the feedback
        $feedback = '';
        if (!empty($needsGrading)) {
            $feedback = "Note: Your essay questions will be graded manually. ";
        }
        
        // Add standard feedback based on passing score
        $feedback .= $score >= $quiz['passing_score'] ? 'Good job!' : 'Review the material and try again.';

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