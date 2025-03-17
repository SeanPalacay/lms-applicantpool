<?php
// lms-forbes/backend/api/trainer/trainee_progress.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Enable error logging for diagnosis
ini_set('display_errors', 0);
error_reporting(E_ALL);
error_log("Starting trainee_progress.php");

header('Content-Type: application/json');

try {
    // Check if trainee ID is provided
    if (!isset($_GET['traineeId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Trainee ID is required']);
        exit;
    }

    $traineeId = $_GET['traineeId'];
    $timeRange = isset($_GET['timeRange']) ? $_GET['timeRange'] : 'all';
    
    error_log("Processing request for traineeId: $traineeId, timeRange: $timeRange");

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

    // Basic token validation (24-hour expiration)
    if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }

    error_log("Token validated for trainer ID: $trainerId");

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

    // Check if trainee exists and is a trainee
    $query = "SELECT id, full_name, email FROM users WHERE id = :id AND role = 'trainee'";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $traineeId, PDO::PARAM_INT);
    $stmt->execute();
    $trainee = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$trainee) {
        http_response_code(404);
        echo json_encode(['error' => 'Trainee not found']);
        exit;
    }

    error_log("Trainee found: " . $trainee['full_name']);

    // Return simplified data for testing
    $result = [
        'trainee' => [
            'id' => $trainee['id'],
            'full_name' => $trainee['full_name'],
            'email' => $trainee['email']
        ],
        'programs' => [],
        'overallProgress' => 0,
        'activities' => [],
        'progressHistory' => [],
        'achievements' => []
    ];
    
    // Fetch only basic program data
    $query = "
        SELECT 
            p.id,
            p.title,
            p.type,
            pe.enrollment_date,
            pe.completion_status,
            pe.completion_percentage
        FROM 
            program_enrollments pe
        JOIN 
            programs p ON pe.program_id = p.id
        WHERE 
            pe.user_id = :traineeId
        ORDER BY 
            pe.enrollment_date DESC
    ";
    
    error_log("Executing program query");
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':traineeId', $traineeId, PDO::PARAM_INT);
    $stmt->execute();
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Found " . count($programs) . " programs");
    
    $result['programs'] = $programs;
    
    // Calculate a simple overall progress
    if (count($programs) > 0) {
        $totalProgress = 0;
        foreach ($programs as $program) {
            $progress = 0;
            if ($program['completion_status'] === 'completed') {
                $progress = 100;
            } elseif ($program['completion_status'] === 'in_progress' && isset($program['completion_percentage'])) {
                $progress = $program['completion_percentage'];
            }
            $totalProgress += $progress;
        }
        $result['overallProgress'] = round($totalProgress / count($programs));
    }
    
    // Add a simple progress history
    $result['progressHistory'] = [
        ['date' => date('Y-m-d', strtotime('-3 months')), 'progressPercentage' => 10],
        ['date' => date('Y-m-d', strtotime('-2 months')), 'progressPercentage' => 30],
        ['date' => date('Y-m-d', strtotime('-1 month')), 'progressPercentage' => 60],
        ['date' => date('Y-m-d'), 'progressPercentage' => $result['overallProgress']]
    ];
    
    error_log("Returning success response");
    http_response_code(200);
    echo json_encode($result);
    exit;

} catch (Exception $e) {
    error_log('Error in trainee_progress.php: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode(['error' => 'An internal server error occurred: ' . $e->getMessage()]);
    exit;
}
?>