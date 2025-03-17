<?php
// lms-forbes/backend/api/trainee/grade_quiz_attempt.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

try {
    // Validate authentication token
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

    list($userId, $timestamp) = explode(':', $decodedToken);
    if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }

    // Get request body
    $requestBody = file_get_contents('php://input');
    $data = json_decode($requestBody, true);
    
    if (!$data || !isset($data['quiz_id']) || !isset($data['answers']) || !is_array($data['answers'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request data']);
        exit;
    }

    $quizId = (int)$data['quiz_id'];
    $timeTaken = isset($data['time_taken']) ? (int)$data['time_taken'] : null;
    $answers = $data['answers'];
    
    // Verify quiz exists
    $query = "SELECT id, title, passing_score, grading_type, auto_feedback FROM quizzes WHERE id = :quizId";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->execute();
    $quiz = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$quiz) {
        http_response_code(404);
        echo json_encode(['error' => 'Quiz not found']);
        exit;
    }

    // Start transaction
    $pdo->beginTransaction();
    
    // Create new attempt
    $createAttemptQuery = "
        INSERT INTO quiz_attempts (user_id, quiz_id, time_taken, attempt_date)
        VALUES (:userId, :quizId, :timeTaken, NOW())
    ";
    $stmt = $pdo->prepare($createAttemptQuery);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->bindParam(':timeTaken', $timeTaken, PDO::PARAM_INT);
    $stmt->execute();
    
    $attemptId = $pdo->lastInsertId();
    
    // Process answers and calculate score
    $correctCount = 0;
    $totalQuestions = 0;
    $score = 0;
    
    // Different calculation based on grading type
    switch ($quiz['grading_type']) {
        case 'weighted':
            // Get question weights
            $weightQuery = "
                SELECT qq.id, COALESCE(qw.weight, 1.0) as weight, qq.correct_answer
                FROM quiz_questions qq
                LEFT JOIN quiz_question_weights qw ON qq.id = qw.question_id AND qw.quiz_id = :quizId
                WHERE qq.quiz_id = :quizId
            ";
            $stmt = $pdo->prepare($weightQuery);
            $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
            $stmt->execute();
            $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($questions)) {
                // Fall back to standard grading if no questions found
                goto standard_grading;
            }
            
            $totalWeight = 0;
            $weightedCorrect = 0;
            
            foreach ($questions as $question) {
                $totalWeight += floatval($question['weight']);
                $questionId = $question['id'];
                $correctAnswer = $question['correct_answer'];
                
                // Find this question in submitted answers
                foreach ($answers as $answer) {
                    if ((int)$answer['question_id'] === (int)$questionId) {
                        $selected = $answer['selected_answer'];
                        $isCorrect = ($selected === $correctAnswer);
                        
                        // Save answer to database
                        $saveAnswerQuery = "
                            INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_answer)
                            VALUES (:attemptId, :questionId, :selected)
                        ";
                        $stmt = $pdo->prepare($saveAnswerQuery);
                        $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
                        $stmt->bindParam(':questionId', $questionId, PDO::PARAM_INT);
                        $stmt->bindParam(':selected', $selected, PDO::PARAM_STR);
                        $stmt->execute();
                        
                        if ($isCorrect) {
                            $weightedCorrect += floatval($question['weight']);
                        }
                        
                        break;
                    }
                }
            }
            
            // Calculate weighted score
            $score = ($totalWeight > 0) ? ($weightedCorrect / $totalWeight) * 100 : 0;
            break;
            
        case 'custom':
            // This could be extended for custom scoring algorithms
            // For now, fall through to standard grading
            
        case 'standard':
        default:
            standard_grading:
            // Get all questions for this quiz
            $questionsQuery = "SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = :quizId";
            $stmt = $pdo->prepare($questionsQuery);
            $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
            $stmt->execute();
            $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $totalQuestions = count($questions);
            
            if ($totalQuestions === 0) {
                // No questions in quiz
                $score = 0;
            } else {
                foreach ($questions as $question) {
                    $questionId = $question['id'];
                    $correctAnswer = $question['correct_answer'];
                    
                    // Find this question in submitted answers
                    foreach ($answers as $answer) {
                        if ((int)$answer['question_id'] === (int)$questionId) {
                            $selected = $answer['selected_answer'];
                            $isCorrect = ($selected === $correctAnswer);
                            
                            // Save answer to database
                            $saveAnswerQuery = "
                                INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_answer)
                                VALUES (:attemptId, :questionId, :selected)
                            ";
                            $stmt = $pdo->prepare($saveAnswerQuery);
                            $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
                            $stmt->bindParam(':questionId', $questionId, PDO::PARAM_INT);
                            $stmt->bindParam(':selected', $selected, PDO::PARAM_STR);
                            $stmt->execute();
                            
                            if ($isCorrect) {
                                $correctCount++;
                            }
                            
                            break;
                        }
                    }
                }
                
                // Calculate standard score
                $score = ($correctCount / $totalQuestions) * 100;
            }
            break;
    }
    
    // Round score to 2 decimal places
    $score = round($score, 2);
    
    // Update attempt with score
    $updateScoreQuery = "UPDATE quiz_attempts SET score = :score WHERE id = :attemptId";
    $stmt = $pdo->prepare($updateScoreQuery);
    $stmt->bindParam(':score', $score, PDO::PARAM_STR);
    $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
    $stmt->execute();
    
    // Generate feedback if enabled
    $feedback = null;
    if ($quiz['auto_feedback']) {
        // Get appropriate feedback template based on score
        $feedbackQuery = "
            SELECT feedback_template 
            FROM quiz_feedback_templates 
            WHERE quiz_id = :quizId 
            AND :score BETWEEN score_range_min AND score_range_max
            ORDER BY id ASC
            LIMIT 1
        ";
        $stmt = $pdo->prepare($feedbackQuery);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->bindParam(':score', $score, PDO::PARAM_STR);
        $stmt->execute();
        $feedbackResult = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($feedbackResult) {
            $feedback = $feedbackResult['feedback_template'];
            
            // Update attempt with feedback
            $updateFeedbackQuery = "UPDATE quiz_attempts SET feedback = :feedback WHERE id = :attemptId";
            $stmt = $pdo->prepare($updateFeedbackQuery);
            $stmt->bindParam(':feedback', $feedback, PDO::PARAM_STR);
            $stmt->bindParam(':attemptId', $attemptId, PDO::PARAM_INT);
            $stmt->execute();
        }
    }
    
    // Commit transaction
    $pdo->commit();
    
    // Determine if passed
    $passed = ($score >= $quiz['passing_score']);
    
    // Return result
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'attempt_id' => $attemptId,
        'quiz_id' => $quizId,
        'quiz_title' => $quiz['title'],
        'score' => $score,
        'passing_score' => $quiz['passing_score'],
        'passed' => $passed,
        'correct_count' => $correctCount,
        'total_questions' => $totalQuestions,
        'feedback' => $feedback
    ]);

} catch (Exception $e) {
    // Roll back transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;