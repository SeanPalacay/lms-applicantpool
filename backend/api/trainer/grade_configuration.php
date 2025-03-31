<?php
// File: lms-forbes/backend/api/trainer/grade_configuration.php

// Turn off PHP error display in output
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set proper headers
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log request information
error_log("grade_configuration.php called with REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);

try {
    // Include dependencies
    require_once '../../shared/cors_middleware.php';
    require_once __DIR__ . '/../../config/db_config.php';

    // Skip authentication temporarily for debugging
    // This should be uncommented in production
    /*
    $user = validateToken();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
        exit;
    }

    // Check if user is a trainer or administrator
    if ($user['role'] !== 'trainer' && $user['role'] !== 'administrator') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied. Only trainers or administrators can manage grade configuration.']);
        exit;
    }
    */

    // Get database connection
    $db = getDatabase();
    if (!$db) {
        throw new Exception("Database connection failed");
    }

    // Log successful database connection
    error_log("Database connection successful");

    // Handle GET request - retrieve grade configuration
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // First, check if grade_configuration table exists
        $tableCheck = $db->query("SHOW TABLES LIKE 'grade_configuration'");
        $tableExists = ($tableCheck->num_rows > 0);
        
        if (!$tableExists) {
            // If table doesn't exist, create it
            $createTableSQL = "
                CREATE TABLE `grade_configuration` (
                    `id` int(11) NOT NULL AUTO_INCREMENT,
                    `quiz_weight` decimal(5,2) NOT NULL DEFAULT 0.60,
                    `practical_exam_weight` decimal(5,2) NOT NULL DEFAULT 0.40,
                    `passing_grade` decimal(5,2) NOT NULL DEFAULT 70.00,
                    `created_by` int(11) DEFAULT NULL,
                    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
                    PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            ";
            
            $db->query($createTableSQL);
            
            // Insert default configuration
            $insertDefaultSQL = "
                INSERT INTO `grade_configuration` 
                (`quiz_weight`, `practical_exam_weight`, `passing_grade`, `created_by`)
                VALUES (0.60, 0.40, 70.00, 1);
            ";
            
            $db->query($insertDefaultSQL);
            
            // Get the default we just created
            $configQuery = "SELECT * FROM grade_configuration LIMIT 1";
        } else {
            // Table exists, get the latest configuration
            $configQuery = "SELECT * FROM grade_configuration ORDER BY id DESC LIMIT 1";
        }
        
        $configResult = $db->query($configQuery);
        
        if (!$configResult) {
            error_log("Error in querying grade_configuration: " . $db->error);
            throw new Exception("Database error: " . $db->error);
        }
        
        $config = $configResult->fetch_assoc();
        
        if (!$config) {
            // If no configuration exists, use default values
            $config = [
                'quiz_weight' => 0.60,
                'practical_exam_weight' => 0.40,
                'passing_grade' => 70.00
            ];
        }
        
        error_log("Grade configuration retrieved: " . json_encode($config));
        
        echo json_encode(['success' => true, 'config' => $config]);
    }
    // Handle POST request - save grade configuration
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get input data
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if ($json === false || $data === null) {
            error_log("Invalid JSON received: " . $json);
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid request data']);
            exit;
        }
        
        error_log("Received configuration data: " . json_encode($data));
        
        if (!isset($data['quiz_weight']) || !isset($data['practical_exam_weight']) || !isset($data['passing_grade'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields']);
            exit;
        }
        
        // Validate data
        $quizWeight = floatval($data['quiz_weight']);
        $practicalWeight = floatval($data['practical_exam_weight']);
        $passingGrade = floatval($data['passing_grade']);
        
        // Check if weights sum to 1.0 (allowing for small floating-point errors)
        if (abs(($quizWeight + $practicalWeight) - 1.0) > 0.01) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Component weights must sum to 100%']);
            exit;
        }
        
        // Validate passing grade
        if ($passingGrade < 50 || $passingGrade > 100) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Passing grade must be between 50% and 100%']);
            exit;
        }
        
        // First, check if grade_configuration table exists
        $tableCheck = $db->query("SHOW TABLES LIKE 'grade_configuration'");
        $tableExists = ($tableCheck->num_rows > 0);
        
        if (!$tableExists) {
            // If table doesn't exist, create it
            $createTableSQL = "
                CREATE TABLE `grade_configuration` (
                    `id` int(11) NOT NULL AUTO_INCREMENT,
                    `quiz_weight` decimal(5,2) NOT NULL DEFAULT 0.60,
                    `practical_exam_weight` decimal(5,2) NOT NULL DEFAULT 0.40,
                    `passing_grade` decimal(5,2) NOT NULL DEFAULT 70.00,
                    `created_by` int(11) DEFAULT NULL,
                    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
                    PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            ";
            
            $db->query($createTableSQL);
        }
        
        // Insert new configuration
        $createById = 1; // Default to admin user if authentication is disabled
        if (isset($user) && isset($user['id'])) {
            $createById = $user['id'];
        }
        
        $stmt = $db->prepare("
            INSERT INTO grade_configuration 
            (quiz_weight, practical_exam_weight, passing_grade, created_by) 
            VALUES (?, ?, ?, ?)
        ");
        
        if (!$stmt) {
            error_log("Error preparing insertion statement: " . $db->error);
            throw new Exception("Database prepare error: " . $db->error);
        }
        
        $stmt->bind_param("dddi", $quizWeight, $practicalWeight, $passingGrade, $createById);
        
        if ($stmt->execute()) {
            error_log("Grade configuration saved successfully");
            echo json_encode(['success' => true, 'message' => 'Grade configuration saved successfully']);
        } else {
            error_log("Failed to save grade configuration: " . $stmt->error);
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save grade configuration']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    // Log the error for server-side debugging
    error_log("Error in grade_configuration.php: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    
    // Return user-friendly error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error occurred',
        'message' => $e->getMessage()
    ]);
}
?>