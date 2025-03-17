<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include CORS middleware
require_once '../../shared/cors_middleware.php';

// Include database connection
require_once __DIR__ . '/../../config/db_config.php';

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

// Extract bearer token from the Authorization header
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string (for testing)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// Simple token check (for demonstration)
if (empty($token)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get quizzes (optionally filtered by program_id)
            $programId = isset($_GET['program_id']) ? (int)$_GET['program_id'] : null;
            $query = "SELECT id, title, program_id, created_at FROM quizzes" . ($programId ? " WHERE program_id = :program_id" : "");
            $stmt = $pdo->prepare($query);
            if ($programId) {
                $stmt->execute([':program_id' => $programId]);
            } else {
                $stmt->execute();
            }
            $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            header('Content-Type: application/json');
            echo json_encode($quizzes);
            break;

        case 'POST':
            // Create a new quiz
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!isset($data['title']) || empty($data['title'])) {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                exit;
            }

            if (!isset($data['program_id']) || !is_numeric($data['program_id'])) {
                header('Content-Type: application/json');
                http_response_code(400);
                echo json_encode(['error' => 'Valid program ID is required']);
                exit;
            }

            $pdo->beginTransaction();

            $query = "INSERT INTO quizzes (title, program_id) VALUES (:title, :program_id)";
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                ':title' => $data['title'],
                ':program_id' => $data['program_id']
            ]);
            $quizId = $pdo->lastInsertId();

            if (isset($data['questions']) && is_array($data['questions'])) {
                foreach ($data['questions'] as $question) {
                    if (!isset($question['question_text']) || !isset($question['correct_answer'])) {
                        $pdo->rollBack();
                        header('Content-Type: application/json');
                        http_response_code(400);
                        echo json_encode(['error' => 'Question text and correct answer are required']);
                        exit;
                    }

                    $query = "INSERT INTO questions (quiz_id, question_text, correct_answer) VALUES (:quiz_id, :question_text, :correct_answer)";
                    $stmt = $pdo->prepare($query);
                    $stmt->execute([
                        ':quiz_id' => $quizId,
                        ':question_text' => $question['question_text'],
                        ':correct_answer' => $question['correct_answer']
                    ]);
                    $questionId = $pdo->lastInsertId();

                    if (isset($question['options']) && is_array($question['options'])) {
                        foreach ($question['options'] as $option) {
                            $isCorrect = ($option === $question['correct_answer']) ? 1 : 0;
                            $query = "INSERT INTO options (question_id, option_text, is_correct) VALUES (:question_id, :option_text, :is_correct)";
                            $stmt = $pdo->prepare($query);
                            $stmt->execute([
                                ':question_id' => $questionId,
                                ':option_text' => $option,
                                ':is_correct' => $is_correct
                            ]);
                        }
                    }
                }
            }

            $pdo->commit();

            $query = "SELECT id, title, program_id, created_at FROM quizzes WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->execute([':id' => $quizId]);
            $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

            header('Content-Type: application/json');
            http_response_code(201);
            echo json_encode($quiz);
            break;

        default:
            header('Content-Type: application/json');
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Quizzes API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Quizzes API Error: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}