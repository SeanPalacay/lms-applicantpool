<?php
// lms-forbes/backend/api/trainer/trainee_ranking.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

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

// Basic token validation (24-hour expiration)
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

// Get trainee ID from query parameter
$traineeId = isset($_GET['traineeId']) ? intval($_GET['traineeId']) : 0;

if ($traineeId <= 0) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing or invalid trainee ID']);
  exit;
}

// First, verify the trainee exists and has role 'trainee'
$query = "SELECT id, full_name, email, status FROM users WHERE id = :id AND role = 'trainee'";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $traineeId, PDO::PARAM_INT);
$stmt->execute();
$trainee = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$trainee) {
  http_response_code(404);
  echo json_encode(['error' => 'Trainee not found']);
  exit;
}

try {
  // Get all trainees with their scores to calculate rankings
  $allTraineesQuery = "
    SELECT 
      u.id, 
      u.full_name,
      u.email
    FROM 
      users u
    WHERE 
      u.role = 'trainee'
  ";
  
  $stmt = $pdo->prepare($allTraineesQuery);
  $stmt->execute();
  $allTrainees = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // Get grading configuration
  $configQuery = "SELECT * FROM grade_configuration LIMIT 1";
  $stmt = $pdo->prepare($configQuery);
  $stmt->execute();
  $config = $stmt->fetch(PDO::FETCH_ASSOC);
  
  if ($config) {
    $quizWeight = floatval($config['quiz_weight']);
    $practicalWeight = floatval($config['practical_exam_weight']);
    $passingGrade = floatval($config['passing_grade']);
  } else {
    // Default weights if no configuration exists
    $quizWeight = 0.6;
    $practicalWeight = 0.4;
    $passingGrade = 70.0;
  }
  
  // For each trainee, calculate scores
  foreach ($allTrainees as &$currentTrainee) {
    // Get quiz attempts
    $quizQuery = "
      SELECT 
        AVG(qa.score) as avg_score,
        COUNT(qa.id) as attempt_count
      FROM 
        quiz_attempts qa
      WHERE 
        qa.user_id = :userId
    ";
    
    $stmt = $pdo->prepare($quizQuery);
    $stmt->bindParam(':userId', $currentTrainee['id'], PDO::PARAM_INT);
    $stmt->execute();
    $quizResult = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $currentTrainee['quiz_score'] = $quizResult['attempt_count'] > 0 ? floatval($quizResult['avg_score']) : 0;
    $currentTrainee['quiz_count'] = intval($quizResult['attempt_count']);
    
    // Get practical exam attempts
    $examQuery = "
      SELECT 
        AVG(pea.score) as avg_score,
        COUNT(pea.id) as attempt_count
      FROM 
        practical_exam_attempts pea
      WHERE 
        pea.user_id = :userId
        AND pea.graded_at IS NOT NULL
    ";
    
    $stmt = $pdo->prepare($examQuery);
    $stmt->bindParam(':userId', $currentTrainee['id'], PDO::PARAM_INT);
    $stmt->execute();
    $examResult = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $currentTrainee['practical_score'] = $examResult['attempt_count'] > 0 ? floatval($examResult['avg_score']) : 0;
    $currentTrainee['practical_count'] = intval($examResult['attempt_count']);
    
    // Get program completion data
    $programQuery = "
      SELECT 
        COUNT(*) as total_programs,
        SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completed_programs,
        AVG(CASE WHEN completion_status = 'in_progress' THEN completion_percentage ELSE 0 END) as avg_completion
      FROM 
        program_enrollments
      WHERE 
        user_id = :userId
    ";
    
    $stmt = $pdo->prepare($programQuery);
    $stmt->bindParam(':userId', $currentTrainee['id'], PDO::PARAM_INT);
    $stmt->execute();
    $programResult = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $totalPrograms = intval($programResult['total_programs']);
    $completedPrograms = intval($programResult['completed_programs']);
    $avgCompletion = floatval($programResult['avg_completion']);
    
    if ($totalPrograms > 0) {
      $completedPercentage = ($completedPrograms / $totalPrograms) * 100;
      $inProgressContribution = (($totalPrograms - $completedPrograms) / $totalPrograms) * $avgCompletion;
      $currentTrainee['completion_rate'] = round($completedPercentage + $inProgressContribution);
    } else {
      $currentTrainee['completion_rate'] = 0;
    }
    
    // Calculate overall score
    if ($currentTrainee['quiz_count'] > 0 && $currentTrainee['practical_count'] > 0) {
      // Both quiz and practical exam scores exist
      $currentTrainee['overall_score'] = round(
        ($currentTrainee['quiz_score'] * $quizWeight) + 
        ($currentTrainee['practical_score'] * $practicalWeight),
        2
      );
    } else if ($currentTrainee['quiz_count'] > 0) {
      // Only quiz scores exist
      $currentTrainee['overall_score'] = $currentTrainee['quiz_score'];
    } else if ($currentTrainee['practical_count'] > 0) {
      // Only practical exam scores exist
      $currentTrainee['overall_score'] = $currentTrainee['practical_score'];
    } else {
      // No scores exist
      $currentTrainee['overall_score'] = 0;
    }
  }
  
  // Sort all trainees by overall score (descending)
  usort($allTrainees, function($a, $b) {
    return $b['overall_score'] <=> $a['overall_score'];
  });
  
  // Prepare ranking data
  $rankings = [
    'overall' => ['rank' => 0, 'total' => count($allTrainees)],
    'quiz' => ['rank' => 0, 'total' => 0],
    'practical' => ['rank' => 0, 'total' => 0],
    'completion' => ['rank' => 0, 'total' => 0],
    'trainee' => null,
    'top_three' => array_slice($allTrainees, 0, 3)
  ];
  
  // Find ranks for the specific trainee
  foreach ($allTrainees as $index => $currentTrainee) {
    if ($currentTrainee['id'] == $traineeId) {
      $rankings['trainee'] = $currentTrainee;
      $rankings['overall']['rank'] = $index + 1;
      break;
    }
  }
  
  // Sort by quiz score
  usort($allTrainees, function($a, $b) {
    return $b['quiz_score'] <=> $a['quiz_score'];
  });
  
  // Find quiz ranking
  $quizTrainees = array_filter($allTrainees, function($t) {
    return $t['quiz_count'] > 0;
  });
  
  $rankings['quiz']['total'] = count($quizTrainees);
  foreach ($quizTrainees as $index => $currentTrainee) {
    if ($currentTrainee['id'] == $traineeId) {
      $rankings['quiz']['rank'] = $index + 1;
      break;
    }
  }
  
  // Sort by practical score
  usort($allTrainees, function($a, $b) {
    return $b['practical_score'] <=> $a['practical_score'];
  });
  
  // Find practical ranking
  $practicalTrainees = array_filter($allTrainees, function($t) {
    return $t['practical_count'] > 0;
  });
  
  $rankings['practical']['total'] = count($practicalTrainees);
  foreach ($practicalTrainees as $index => $currentTrainee) {
    if ($currentTrainee['id'] == $traineeId) {
      $rankings['practical']['rank'] = $index + 1;
      break;
    }
  }
  
  // Sort by completion rate
  usort($allTrainees, function($a, $b) {
    return $b['completion_rate'] <=> $a['completion_rate'];
  });
  
  // Find completion ranking
  $completionTrainees = array_filter($allTrainees, function($t) {
    return $t['completion_rate'] > 0;
  });
  
  $rankings['completion']['total'] = count($completionTrainees);
  foreach ($completionTrainees as $index => $currentTrainee) {
    if ($currentTrainee['id'] == $traineeId) {
      $rankings['completion']['rank'] = $index + 1;
      break;
    }
  }
  
  // Add basic trainee info
  if ($rankings['trainee']) {
    $rankings['trainee']['status'] = $trainee['status'];
  }
  
  // Add grade configuration
  $rankings['grade_config'] = [
    'quiz_weight' => $quizWeight,
    'practical_weight' => $practicalWeight,
    'passing_grade' => $passingGrade
  ];
  
  http_response_code(200);
  echo json_encode($rankings);
  
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
exit;
?>