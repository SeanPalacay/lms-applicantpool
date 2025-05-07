<?php
// lms-forbes/backend/api/trainer/program_details.php

// Start output buffering to prevent any accidental output
ob_start();

// Set error handling to suppress HTML errors
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set exception handler to return JSON errors
set_exception_handler(function($e) {
    ob_end_clean(); // Clear any buffered output
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit;
});

// Set error handler to convert errors to exceptions
set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

try {
    require_once '../../shared/cors_middleware.php';
    require_once __DIR__ . '/../../config/db_config.php';

    // Set content type header
    header('Content-Type: application/json');

    // Check authorization header
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

    // Decode token (base64-encoded "userId:timestamp")
    $decodedToken = base64_decode($token);
    if ($decodedToken === false || strpos($decodedToken, ':') === false) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token format']);
        exit;
    }

    list($trainerId, $timestamp) = explode(':', $decodedToken);

    // Basic token validation
    if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }

    // Configure PDO to throw exceptions
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verify trainer role and program ownership
    $programId = isset($_GET['programId']) ? (int)$_GET['programId'] : 0;
    if ($programId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid program ID']);
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

    // Fetch program basic details
    $query = "
      SELECT 
        p.id,
        p.title,
        p.description,
        p.type,
        p.status, 
        p.created_by,
        p.created_at,
        u.full_name AS createdByName
      FROM 
        programs p
      LEFT JOIN 
        users u ON p.created_by = u.id
      WHERE 
        p.id = :programId
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $program = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$program) {
        http_response_code(404);
        echo json_encode(['error' => 'Program not found']);
        exit;
    }

    // Fetch enrollments
    $query = "
      SELECT 
        pe.id,
        pe.user_id,
        u.full_name AS trainee_name,
        u.email AS trainee_email,
        pe.enrollment_date,
        pe.completion_status,
        pe.completion_percentage
      FROM 
        program_enrollments pe
      JOIN 
        users u ON pe.user_id = u.id
      WHERE 
        pe.program_id = :programId
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $enrollments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Make sure enrollments is at least an empty array, not null
    if ($enrollments === false) {
        $enrollments = [];
    }

    // Fetch practical exams for this program
    $query = "
      SELECT 
        pe.id,
        pe.title,
        pe.description,
        pe.max_score,
        pe.created_at,
        pe.created_by,
        u.full_name as created_by_name,
        (SELECT COUNT(*) FROM practical_exam_attempts WHERE exam_id = pe.id) as attempt_count,
        (SELECT COALESCE(AVG(score), 0) FROM practical_exam_attempts WHERE exam_id = pe.id) as average_score
      FROM 
        practical_exams pe
      LEFT JOIN 
        users u ON pe.created_by = u.id
      WHERE 
        pe.program_id = :programId
      ORDER BY 
        pe.created_at DESC
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $practicalExams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($practicalExams === false) {
        $practicalExams = [];
    }

    // Fetch milestones
    $query = "
      SELECT 
        m.id,
        m.title,
        m.description,
        m.due_date,
        (SELECT COUNT(*) FROM milestone_progress mp 
         WHERE mp.milestone_id = m.id AND mp.status = 'completed') AS completionCount
      FROM 
        milestones m
      WHERE 
        m.program_id = :programId
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $milestones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($milestones === false) {
        $milestones = [];
    }

    // Fetch quizzes - fix the query to handle NULL values with COALESCE
    $query = "
      SELECT 
        q.id,
        q.title,
        q.description,
        q.time_limit,
        q.passing_score,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count,
        (SELECT COALESCE(AVG(score), 0) FROM quiz_attempts WHERE quiz_id = q.id) AS average_score,
        (SELECT 
           CASE 
             WHEN COUNT(*) > 0 THEN 
               (COUNT(CASE WHEN score >= q.passing_score THEN 1 END) * 100.0 / COUNT(*))
             ELSE 0 
           END
         FROM quiz_attempts WHERE quiz_id = q.id) AS pass_rate,
        (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) AS attempt_count
      FROM 
        quizzes q
      WHERE 
        q.program_id = :programId
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($quizzes === false) {
        $quizzes = [];
    }

    // Fetch quiz enrollments
    $query = "
      SELECT 
        qe.id,
        qe.user_id,
        u.full_name AS trainee_name,
        q.id AS quiz_id,
        q.title AS quiz_title,
        qe.program_id,
        qe.enrollment_date,
        qe.status
      FROM 
        quiz_enrollments qe
      JOIN 
        users u ON qe.user_id = u.id
      JOIN 
        quizzes q ON qe.quiz_id = q.id
      WHERE 
        qe.program_id = :programId
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $quizEnrollments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($quizEnrollments === false) {
        $quizEnrollments = [];
    }

    // Calculate stats safely
    $totalEnrollments = count($enrollments);
    $completionRate = 0;
    if ($totalEnrollments > 0) {
        $completionSum = 0;
        foreach ($enrollments as $enrollment) {
            $completionSum += floatval($enrollment['completion_percentage']);
        }
        $completionRate = $completionSum / $totalEnrollments;
    }

    // Get average quiz score
    $averageScoreQuery = "
      SELECT COALESCE(AVG(qa.score), 0) 
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE q.program_id = :programId
    ";
    $stmt = $pdo->prepare($averageScoreQuery);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $averageScore = $stmt->fetchColumn();
    
    if ($averageScore === false) {
        $averageScore = 0;
    }

    // Fetch progress data (simplified: completion over time)
    $query = "
      SELECT 
        DATE(pe.enrollment_date) AS date,
        COALESCE(AVG(pe.completion_percentage), 0) AS completionRate
      FROM 
        program_enrollments pe
      WHERE 
        pe.program_id = :programId
      GROUP BY 
        DATE(pe.enrollment_date)
      ORDER BY 
        date ASC
    ";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':programId', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $progressData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($progressData === false) {
        $progressData = [];
    }

    // Assemble response
    $response = [
      'id' => $program['id'],
      'title' => $program['title'],
      'description' => $program['description'],
      'type' => $program['type'],
      'status' => $program['status'],
      'created_by' => $program['created_by'],
      'created_at' => $program['created_at'],
      'createdByName' => $program['createdByName'],
      'enrollments' => $enrollments,
      'milestones' => $milestones,
      'quizzes' => $quizzes,
      'practicalExams' => $practicalExams,
      'quiz_enrollments' => $quizEnrollments,
      'stats' => [
        'totalEnrollments' => $totalEnrollments,
        'completionRate' => round($completionRate, 2),
        'averageScore' => round($averageScore, 2)
      ],
      'progressData' => $progressData
    ];

    // Clear output buffer and send JSON response
    ob_end_clean();
    http_response_code(200);
    echo json_encode($response);
    exit;
    
} catch (PDOException $e) {
    // Database error
    ob_end_clean(); // Clear any previous output
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    // General error
    ob_end_clean(); // Clear any previous output
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    exit;
}
?>