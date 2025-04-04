<?php
// Added error handling
ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
error_log("====== QUIZ CREATION STARTED ======");

// lms-forbes/backend/api/trainer/create_quiz.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

try {
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

    // Get and validate input data
    $rawInput = file_get_contents('php://input');
    error_log("Raw input received: " . substr($rawInput, 0, 1000) . (strlen($rawInput) > 1000 ? '...' : ''));
    
    $data = json_decode($rawInput, true);
    if (!$data || !isset($data['title']) || !isset($data['program_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
        exit;
    }

    // Verify trainer owns the program
    $query = "SELECT id FROM programs WHERE id = :program_id AND created_by = :trainerId";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':program_id', $data['program_id'], PDO::PARAM_INT);
    $stmt->bindParam(':trainerId', $trainerId, PDO::PARAM_INT);
    $stmt->execute();
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Program not found or not owned by trainer']);
        exit;
    }
    
    // Make database schema changes directly first, without using a function
    error_log("Checking database schema...");
    
    // First, check if correct_answer is TEXT
    try {
        $columnCheck = $pdo->query("SHOW COLUMNS FROM quiz_questions WHERE Field = 'correct_answer'");
        if ($columnCheck) {
            $column = $columnCheck->fetch(PDO::FETCH_ASSOC);
            
            if ($column && strpos(strtolower($column['Type'] ?? ''), 'enum') !== false) {
                error_log("Converting correct_answer to TEXT type");
                $pdo->exec("ALTER TABLE quiz_questions MODIFY COLUMN correct_answer TEXT");
            }
        }
    } catch (PDOException $e) {
        error_log("Error checking or modifying correct_answer column: " . $e->getMessage());
    }
    
    // Second, check if question_type ENUM includes all required types
    try {
        $typeCheck = $pdo->query("SHOW COLUMNS FROM quiz_questions WHERE Field = 'question_type'");
        if ($typeCheck) {
            $typeColumn = $typeCheck->fetch(PDO::FETCH_ASSOC);
            
            if ($typeColumn) {
                // Make sure it includes all types
                $neededTypes = ['multiple_choice','multiple_answer','true_false','identification','matching','essay'];
                $currentType = $typeColumn['Type'] ?? '';
                $missingTypes = [];
                
                foreach ($neededTypes as $type) {
                    if (strpos($currentType, $type) === false) {
                        $missingTypes[] = $type;
                    }
                }
                
                if (!empty($missingTypes)) {
                    error_log("Updating question_type ENUM to include missing types: " . implode(", ", $missingTypes));
                    $pdo->exec("
                        ALTER TABLE quiz_questions 
                        MODIFY COLUMN question_type ENUM('multiple_choice','multiple_answer','true_false','identification','matching','essay') 
                        NOT NULL DEFAULT 'multiple_choice'
                    ");
                }
            }
        }
    } catch (PDOException $e) {
        error_log("Error checking or modifying question_type column: " . $e->getMessage());
    }
    
    // Create necessary tables
    try {
        // Quiz Question Metadata table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `quiz_question_metadata` (
              `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              `question_id` INT(11) NOT NULL,
              `meta_key` VARCHAR(50) NOT NULL,
              `meta_value` TEXT,
              INDEX (question_id),
              UNIQUE KEY question_meta (question_id, meta_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        ");
        
        // Multiple Answer Options table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `quiz_question_answer_options` (
              `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              `question_id` INT(11) NOT NULL,
              `option_text` VARCHAR(255) NOT NULL,
              `option_key` VARCHAR(2) NOT NULL,
              `is_correct` TINYINT(1) DEFAULT 0,
              INDEX (question_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        ");
        
        // Matching Pairs table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `quiz_question_matching_pairs` (
              `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              `question_id` INT(11) NOT NULL,
              `left_item` VARCHAR(255) NOT NULL,
              `right_item` VARCHAR(255) NOT NULL,
              `pair_key` VARCHAR(2) NOT NULL,
              INDEX (question_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        ");
        
        // Weights table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `quiz_question_weights` (
              `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
              `quiz_id` INT(11) NOT NULL,
              `question_id` INT(11) NOT NULL,
              `weight` DECIMAL(5,2) DEFAULT 1.00,
              UNIQUE KEY quiz_question (quiz_id, question_id),
              INDEX (quiz_id),
              INDEX (question_id)
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
              INDEX (quiz_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        ");
        
        // Update quizzes table
        $columnCheck = $pdo->query("SHOW COLUMNS FROM quizzes LIKE 'grading_type'");
        if ($columnCheck && $columnCheck->rowCount() === 0) {
            $pdo->exec("
                ALTER TABLE quizzes ADD COLUMN grading_type ENUM('standard','weighted','custom') DEFAULT 'standard'
            ");
        }
        
        $columnCheck = $pdo->query("SHOW COLUMNS FROM quizzes LIKE 'auto_feedback'");
        if ($columnCheck && $columnCheck->rowCount() === 0) {
            $pdo->exec("
                ALTER TABLE quizzes ADD COLUMN auto_feedback TINYINT(1) DEFAULT 0
            ");
        }
        
        error_log("Database schema checks and updates completed");
    } catch (PDOException $e) {
        error_log("Error updating database schema: " . $e->getMessage());
        // Continue anyway - tables might exist with different structure
    }

    // Validate all questions before beginning transaction
    foreach ($data['questions'] as $index => $question) {
        $questionType = $question['question_type'] ?? 'multiple_choice';
        error_log("Validating question $index of type $questionType");
        
        // Basic validation for all question types
        if (!isset($question['question_text']) || empty(trim($question['question_text']))) {
            http_response_code(400);
            echo json_encode(['error' => "Question " . ($index + 1) . ": Question text is required"]);
            exit;
        }
        
        // Type-specific validation
        switch ($questionType) {
            case 'multiple_choice':
            case 'multiple_answer':
                if (!isset($question['option_a']) || empty(trim($question['option_a'])) ||
                    !isset($question['option_b']) || empty(trim($question['option_b']))) {
                    http_response_code(400);
                    echo json_encode(['error' => "Question " . ($index + 1) . ": Please provide at least options A and B for multiple choice/answer questions."]);
                    exit;
                }
                
                if ($questionType === 'multiple_choice' && 
                    (!isset($question['correct_answer']) || empty($question['correct_answer']))) {
                    http_response_code(400);
                    echo json_encode(['error' => "Question " . ($index + 1) . ": Please select the correct answer."]);
                    exit;
                }
                
                if ($questionType === 'multiple_answer' && 
                    (!isset($question['correct_answers']) || !is_array($question['correct_answers']) || empty($question['correct_answers']))) {
                    http_response_code(400);
                    echo json_encode(['error' => "Question " . ($index + 1) . ": Please select at least one correct answer."]);
                    exit;
                }
                break;
                
            case 'identification':
                if (!isset($question['answer_text']) || empty(trim($question['answer_text']))) {
                    http_response_code(400);
                    echo json_encode(['error' => "Question " . ($index + 1) . ": Please provide the correct answer for the identification question."]);
                    exit;
                }
                break;
                
            case 'matching':
                if (!isset($question['matching_pairs']) || !is_array($question['matching_pairs']) || count($question['matching_pairs']) < 2) {
                    http_response_code(400);
                    echo json_encode(['error' => "Question " . ($index + 1) . ": Please provide at least two matching pairs."]);
                    exit;
                }
                
                foreach ($question['matching_pairs'] as $pairIndex => $pair) {
                    if (!isset($pair['left']) || empty(trim($pair['left'])) || 
                        !isset($pair['right']) || empty(trim($pair['right']))) {
                        http_response_code(400);
                        echo json_encode(['error' => "Question " . ($index + 1) . ": Please complete both sides of all matching pairs."]);
                        exit;
                    }
                }
                break;
        }
    }

    // Start transaction
    $pdo->beginTransaction();
    error_log("Starting database transaction for quiz creation");

    // Insert quiz with proper defaults for missing fields
    $grading_type = isset($data['grade_weighting']) && $data['grade_weighting'] === 'custom' ? 'weighted' : 'standard';
    $auto_feedback = isset($data['auto_feedback']) ? (bool)$data['auto_feedback'] : false;
    
    $query = "
        INSERT INTO quizzes (
          title, 
          description, 
          program_id, 
          time_limit, 
          passing_score, 
          status, 
          created_by,
          grading_type,
          auto_feedback
        )
        VALUES (
          :title, 
          :description, 
          :program_id, 
          :time_limit, 
          :passing_score, 
          :status, 
          :created_by,
          :grading_type,
          :auto_feedback
        )
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':title' => $data['title'],
        ':description' => $data['description'] ?? null,
        ':program_id' => $data['program_id'],
        ':time_limit' => $data['time_limit'],
        ':passing_score' => $data['passing_score'],
        ':status' => $data['status'] ?? 'draft',
        ':created_by' => $trainerId,
        ':grading_type' => $grading_type,
        ':auto_feedback' => $auto_feedback
    ]);
    
    $quizId = $pdo->lastInsertId();
    error_log("Created quiz with ID: $quizId");

    // Insert questions
    foreach ($data['questions'] as $index => $question) {
        $questionType = $question['question_type'] ?? 'multiple_choice';
        error_log("Processing question $index of type $questionType");
        
        // Build query with placeholders
        $query = "
            INSERT INTO quiz_questions (
              quiz_id, 
              question_type, 
              question_text, 
              option_a, 
              option_b, 
              option_c, 
              option_d, 
              correct_answer
            )
            VALUES (
              :quiz_id, 
              :question_type, 
              :question_text, 
              :option_a, 
              :option_b, 
              :option_c, 
              :option_d, 
              :correct_answer
            )
        ";
        
        try {
            $stmt = $pdo->prepare($query);
            
            // Initialize variables with default values
            $options = [
                ':quiz_id' => $quizId,
                ':question_type' => $questionType,
                ':question_text' => $question['question_text'],
                ':option_a' => null,
                ':option_b' => null,
                ':option_c' => null,
                ':option_d' => null,
                ':correct_answer' => null
            ];
            
            // Process based on question type
            switch ($questionType) {
                case 'multiple_choice':
                    $options[':option_a'] = $question['option_a'] ?? '';
                    $options[':option_b'] = $question['option_b'] ?? '';
                    $options[':option_c'] = $question['option_c'] ?? null;
                    $options[':option_d'] = $question['option_d'] ?? null;
                    $options[':correct_answer'] = $question['correct_answer'] ?? 'a';
                    break;
                
                case 'multiple_answer':
                    $options[':option_a'] = $question['option_a'] ?? '';
                    $options[':option_b'] = $question['option_b'] ?? '';
                    $options[':option_c'] = $question['option_c'] ?? null;
                    $options[':option_d'] = $question['option_d'] ?? null;
                    
                    // For DB record, store as comma-separated for backward compatibility
                    $correctAnswers = [];
                    if (isset($question['correct_answers']) && is_array($question['correct_answers'])) {
                        $correctAnswers = $question['correct_answers'];
                    }
                    $options[':correct_answer'] = implode(',', $correctAnswers);
                    break;
                
                case 'true_false':
                    $options[':option_a'] = 'True';
                    $options[':option_b'] = 'False';
                    $options[':option_c'] = null;
                    $options[':option_d'] = null;
                    $options[':correct_answer'] = isset($question['is_true']) && $question['is_true'] ? 'a' : 'b';
                    break;
                
                case 'identification':
                    // For identification questions, all options are null
                    $options[':option_a'] = null;
                    $options[':option_b'] = null;
                    $options[':option_c'] = null;
                    $options[':option_d'] = null;
                    
                    // Make sure we have a valid answer text
                    if (isset($question['answer_text']) && is_string($question['answer_text'])) {
                        $options[':correct_answer'] = trim($question['answer_text']);
                    } else {
                        error_log("Warning: Missing or invalid answer_text for identification question");
                        $options[':correct_answer'] = ""; // Use empty string as fallback
                    }
                    break;
                
                case 'matching':
                    // For matching, all options are null
                    $options[':option_a'] = null;
                    $options[':option_b'] = null;
                    $options[':option_c'] = null;
                    $options[':option_d'] = null;
                    $options[':correct_answer'] = null;
                    break;
                
                case 'essay':
                    // For essay questions, all options are null
                    $options[':option_a'] = null;
                    $options[':option_b'] = null;
                    $options[':option_c'] = null;
                    $options[':option_d'] = null;
                    
                    // Store model answer if provided
                    $options[':correct_answer'] = $question['answer_text'] ?? null;
                    break;
                
                default:
                    error_log("Warning: Unknown question type $questionType");
                    // Use safe defaults for unknown types
                    $options[':option_a'] = null;
                    $options[':option_b'] = null;
                    $options[':option_c'] = null;
                    $options[':option_d'] = null;
                    $options[':correct_answer'] = null;
                    break;
            }
            
            error_log("Inserting question with options: " . substr(json_encode($options), 0, 500));
            $stmt->execute($options);
            $questionId = $pdo->lastInsertId();
            error_log("Created question with ID: $questionId");
            
            // Handle special question types with additional tables
            if ($questionType === 'matching' && isset($question['matching_pairs'])) {
                error_log("Processing matching pairs for question $questionId");
                
                $insertPairQuery = "
                    INSERT INTO quiz_question_matching_pairs (
                      question_id, 
                      left_item, 
                      right_item, 
                      pair_key
                    )
                    VALUES (
                      :question_id, 
                      :left_item, 
                      :right_item, 
                      :pair_key
                    )
                ";
                
                $pairStmt = $pdo->prepare($insertPairQuery);
                
                foreach ($question['matching_pairs'] as $pairIndex => $pair) {
                    if (!isset($pair['left']) || !isset($pair['right'])) {
                        error_log("Warning: Invalid pair at index $pairIndex");
                        continue;
                    }
                    
                    $pairKey = isset($pair['key']) ? $pair['key'] : chr(97 + $pairIndex); // a, b, c...
                    
                    $pairStmt->execute([
                        ':question_id' => $questionId,
                        ':left_item' => $pair['left'],
                        ':right_item' => $pair['right'],
                        ':pair_key' => $pairKey
                    ]);
                    
                    error_log("Added matching pair with key $pairKey");
                }
            }
            
            if ($questionType === 'multiple_answer') {
                error_log("Processing multiple-answer options for question $questionId");
                
                // Check if correct_answers exists and is valid
                if (!isset($question['correct_answers']) || !is_array($question['correct_answers'])) {
                    error_log("Warning: correct_answers missing or not an array for question $questionId");
                    $question['correct_answers'] = []; // Default to empty array
                }
                
                $insertOptionQuery = "
                    INSERT INTO quiz_question_answer_options (
                      question_id, 
                      option_text, 
                      option_key, 
                      is_correct
                    )
                    VALUES (
                      :question_id, 
                      :option_text, 
                      :option_key, 
                      :is_correct
                    )
                ";
                
                $optionStmt = $pdo->prepare($insertOptionQuery);
                
                foreach (['a', 'b', 'c', 'd'] as $key) {
                    $optionField = "option_$key";
                    if (isset($question[$optionField]) && $question[$optionField] !== null && $question[$optionField] !== '') {
                        $isCorrect = in_array($key, $question['correct_answers']) ? 1 : 0;
                        
                        error_log("Adding option $key for question $questionId: text={$question[$optionField]}, isCorrect=$isCorrect");
                        
                        try {
                            $optionStmt->execute([
                                ':question_id' => $questionId,
                                ':option_text' => $question[$optionField],
                                ':option_key' => $key,
                                ':is_correct' => $isCorrect
                            ]);
                        } catch (Exception $e) {
                            error_log("Error inserting option $key for question $questionId: " . $e->getMessage());
                            // Continue with other options - don't throw exception
                        }
                    }
                }
            }
            
            // Add metadata for identification questions if needed
            if ($questionType === 'identification') {
                error_log("Processing metadata for identification question $questionId");
                
                try {
                    // Only try to add alternative answers if they exist
                    if (isset($question['alternative_answers']) && is_string($question['alternative_answers']) && !empty(trim($question['alternative_answers']))) {
                        $insertMetaQuery = "
                            INSERT INTO quiz_question_metadata (
                              question_id, 
                              meta_key, 
                              meta_value
                            )
                            VALUES (
                              :question_id, 
                              :meta_key, 
                              :meta_value
                            )
                        ";
                        
                        $metaStmt = $pdo->prepare($insertMetaQuery);
                        
                        // Insert alternative answers
                        $metaStmt->execute([
                            ':question_id' => $questionId,
                            ':meta_key' => 'alternative_answers',
                            ':meta_value' => trim($question['alternative_answers'])
                        ]);
                        
                        error_log("Added alternative answers metadata for question $questionId");
                        
                        // Insert case sensitivity setting
                        $caseSensitive = isset($question['case_sensitive']) && $question['case_sensitive'] ? '1' : '0';
                        
                        $metaStmt->execute([
                            ':question_id' => $questionId,
                            ':meta_key' => 'case_sensitive',
                            ':meta_value' => $caseSensitive
                        ]);
                        
                        error_log("Added case sensitivity metadata for question $questionId");
                    } else {
                        error_log("No alternative answers to add for question $questionId");
                    }
                } catch (Exception $metaEx) {
                    error_log("Error adding metadata for question $questionId: " . $metaEx->getMessage());
                    // Continue processing - metadata is not critical
                }
            }
            
            // Add question weights if grading type is weighted
            if ($grading_type === 'weighted' && isset($data['question_weights']) && isset($data['question_weights'][$index])) {
                $weight = floatval($data['question_weights'][$index]);
                
                if ($weight > 0) {
                    error_log("Adding weight $weight for question $questionId");
                    
                    try {
                        $insertWeightQuery = "
                            INSERT INTO quiz_question_weights (
                              quiz_id, 
                              question_id, 
                              weight
                            )
                            VALUES (
                              :quiz_id, 
                              :question_id, 
                              :weight
                            )
                        ";
                        
                        $weightStmt = $pdo->prepare($insertWeightQuery);
                        $weightStmt->execute([
                            ':quiz_id' => $quizId,
                            ':question_id' => $questionId,
                            ':weight' => $weight
                        ]);
                    } catch (Exception $weightEx) {
                        error_log("Error adding weight for question $questionId: " . $weightEx->getMessage());
                        // Continue processing - weights are not critical
                    }
                }
            }
        } catch (Exception $questionEx) {
            error_log("Error creating question $index: " . $questionEx->getMessage());
            throw $questionEx; // Re-throw to be caught by main try-catch
        }
    }
    
    // Add feedback templates if auto_feedback is enabled
    if ($auto_feedback && isset($data['feedback_templates']) && is_array($data['feedback_templates']) && !empty($data['feedback_templates'])) {
        error_log("Adding feedback templates");
        
        try {
            $insertTemplateQuery = "
                INSERT INTO quiz_feedback_templates (
                  quiz_id, 
                  score_range_min, 
                  score_range_max, 
                  feedback_template
                )
                VALUES (
                  :quiz_id, 
                  :min_score, 
                  :max_score, 
                  :template
                )
            ";
            
            $templateStmt = $pdo->prepare($insertTemplateQuery);
            
            foreach ($data['feedback_templates'] as $template) {
                if (!isset($template['min_score']) || !isset($template['max_score']) || !isset($template['template'])) {
                    continue;
                }
                
                $templateStmt->execute([
                    ':quiz_id' => $quizId,
                    ':min_score' => floatval($template['min_score']),
                    ':max_score' => floatval($template['max_score']),
                    ':template' => $template['template']
                ]);
            }
        } catch (Exception $templateEx) {
            error_log("Error adding feedback templates: " . $templateEx->getMessage());
            // Continue processing - templates are not critical
        }
    }

    // Commit transaction
    $pdo->commit();
    error_log("Quiz creation successfully completed for quiz ID: $quizId");
    
    // Return success response
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'quizId' => $quizId, 
        'message' => 'Quiz created successfully'
    ]);
    
} catch (Exception $e) {
    // Roll back transaction if it was started
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Log detailed error information
    $errorMessage = $e->getMessage();
    $errorCode = $e->getCode();
    $errorTrace = $e->getTraceAsString();
    
    error_log("Quiz creation failed - Error: $errorMessage");
    error_log("Error code: $errorCode");
    error_log("Stack trace: $errorTrace");
    
    // Return error response
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create quiz: ' . $errorMessage]);
}

exit;
?>