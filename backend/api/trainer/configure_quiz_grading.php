<?php
// lms-forbes/backend/api/trainer/configure_quiz_grading.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use PUT.']);
    exit;
}

// Ensure all required supporting tables exist
function ensureSupportingTablesExist($pdo) {
    // Weights table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `quiz_question_weights` (
            `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `quiz_id` INT(11) NOT NULL,
            `question_id` INT(11) NOT NULL,
            `weight` DECIMAL(5,2) DEFAULT 1.00,
            UNIQUE KEY quiz_question (quiz_id, question_id),
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");
    
    // Feedback templates table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `quiz_feedback_templates` (
            `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `quiz_id` INT(11) NOT NULL,
            `score_range_min` DECIMAL(5,2) DEFAULT 0.00,
            `score_range_max` DECIMAL(5,2) DEFAULT 100.00,
            `feedback_template` TEXT NOT NULL,
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");
    
    // Update quizzes table if needed
    try {
        $pdo->exec("
            ALTER TABLE `quizzes` 
            ADD COLUMN IF NOT EXISTS `grading_type` ENUM('standard','weighted','custom') DEFAULT 'standard',
            ADD COLUMN IF NOT EXISTS `auto_feedback` TINYINT(1) DEFAULT 0
        ");
    } catch (PDOException $e) {
        // If IF NOT EXISTS is not supported (older MySQL), handle it differently
        try {
            // Check if columns exist
            $stmt = $pdo->query("SHOW COLUMNS FROM `quizzes` LIKE 'grading_type'");
            if ($stmt->rowCount() === 0) {
                $pdo->exec("ALTER TABLE `quizzes` ADD COLUMN `grading_type` ENUM('standard','weighted','custom') DEFAULT 'standard'");
            }
            
            $stmt = $pdo->query("SHOW COLUMNS FROM `quizzes` LIKE 'auto_feedback'");
            if ($stmt->rowCount() === 0) {
                $pdo->exec("ALTER TABLE `quizzes` ADD COLUMN `auto_feedback` TINYINT(1) DEFAULT 0");
            }
        } catch (PDOException $innerEx) {
            error_log("Error adjusting quizzes table: " . $innerEx->getMessage());
        }
    }
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

    list($trainerId, $timestamp) = explode(':', $decodedToken);
    if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }

    // Verify trainer role
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

    // Get quiz ID
    $quizId = isset($_GET['quizId']) ? (int)$_GET['quizId'] : 0;
    if (!$quizId) {
        http_response_code(400);
        echo json_encode(['error' => 'Quiz ID is required']);
        exit;
    }

    // Verify quiz exists and belongs to this trainer
    $query = "
        SELECT q.id 
        FROM quizzes q
        JOIN programs p ON q.program_id = p.id
        WHERE q.id = :quizId AND p.created_by = :trainerId
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
    $stmt->execute();
    
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Quiz not found or access denied']);
        exit;
    }

    // Get request body
    $requestBody = file_get_contents('php://input');
    $data = json_decode($requestBody, true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request data']);
        exit;
    }

    // Ensure supporting tables exist
    ensureSupportingTablesExist($pdo);

    // Start transaction
    $pdo->beginTransaction();

    // 1. Update quiz settings
    $passing_score = isset($data['passing_score']) ? floatval($data['passing_score']) : 70.00;
    $grading_type = isset($data['grading_type']) ? $data['grading_type'] : 'standard';
    $auto_feedback = isset($data['auto_feedback']) ? ($data['auto_feedback'] ? 1 : 0) : 0;
    
    // Validate grading type
    $allowedGradingTypes = ['standard', 'weighted', 'custom'];
    if (!in_array($grading_type, $allowedGradingTypes)) {
        $grading_type = 'standard';
    }

    // Update quiz settings
    $updateQuery = "
        UPDATE quizzes 
        SET passing_score = :passing_score,
            grading_type = :grading_type,
            auto_feedback = :auto_feedback
        WHERE id = :quizId
    ";
    $stmt = $pdo->prepare($updateQuery);
    $stmt->bindParam(':passing_score', $passing_score, PDO::PARAM_STR);
    $stmt->bindParam(':grading_type', $grading_type, PDO::PARAM_STR);
    $stmt->bindParam(':auto_feedback', $auto_feedback, PDO::PARAM_INT);
    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
    $stmt->execute();

    // 2. Handle question weights if provided and grading type is 'weighted'
    if ($grading_type === 'weighted' && isset($data['question_weights']) && is_array($data['question_weights'])) {
        // Delete existing weights for this quiz
        $deleteQuery = "DELETE FROM quiz_question_weights WHERE quiz_id = :quizId";
        $stmt = $pdo->prepare($deleteQuery);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        
        // Insert new weights
        $insertQuery = "
            INSERT INTO quiz_question_weights (quiz_id, question_id, weight) 
            VALUES (:quizId, :questionId, :weight)
        ";
        $stmt = $pdo->prepare($insertQuery);
        
        foreach ($data['question_weights'] as $weightData) {
            if (isset($weightData['question_id']) && isset($weightData['weight'])) {
                $questionId = (int)$weightData['question_id'];
                $weight = floatval($weightData['weight']);
                
                // Verify the question belongs to this quiz
                $verifyQuery = "SELECT id FROM quiz_questions WHERE id = :questionId AND quiz_id = :quizId";
                $verifyStmt = $pdo->prepare($verifyQuery);
                $verifyStmt->bindParam(':questionId', $questionId, PDO::PARAM_INT);
                $verifyStmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
                $verifyStmt->execute();
                
                if ($verifyStmt->fetch()) {
                    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
                    $stmt->bindParam(':questionId', $questionId, PDO::PARAM_INT);
                    $stmt->bindParam(':weight', $weight, PDO::PARAM_STR);
                    $stmt->execute();
                }
            }
        }
    }

    // 3. Handle feedback templates if provided and auto_feedback is enabled
    if ($auto_feedback && isset($data['feedback_templates']) && is_array($data['feedback_templates'])) {
        // Delete existing templates for this quiz
        $deleteQuery = "DELETE FROM quiz_feedback_templates WHERE quiz_id = :quizId";
        $stmt = $pdo->prepare($deleteQuery);
        $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
        $stmt->execute();
        
        // Insert new templates
        $insertQuery = "
            INSERT INTO quiz_feedback_templates (quiz_id, score_range_min, score_range_max, feedback_template) 
            VALUES (:quizId, :min_score, :max_score, :template)
        ";
        $stmt = $pdo->prepare($insertQuery);
        
        foreach ($data['feedback_templates'] as $template) {
            if (isset($template['min_score']) && isset($template['max_score']) && isset($template['template'])) {
                $minScore = floatval($template['min_score']);
                $maxScore = floatval($template['max_score']);
                $feedbackTemplate = trim($template['template']);
                
                if (!empty($feedbackTemplate)) {
                    $stmt->bindParam(':quizId', $quizId, PDO::PARAM_INT);
                    $stmt->bindParam(':min_score', $minScore, PDO::PARAM_STR);
                    $stmt->bindParam(':max_score', $maxScore, PDO::PARAM_STR);
                    $stmt->bindParam(':template', $feedbackTemplate, PDO::PARAM_STR);
                    $stmt->execute();
                }
            }
        }
    }

    // Commit transaction
    $pdo->commit();

    // Return success
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Quiz grading configuration updated successfully',
        'quiz_id' => $quizId
    ]);

} catch (Exception $e) {
    // Roll back transaction on error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

exit;