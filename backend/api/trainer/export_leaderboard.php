<?php
// lms-forbes/backend/api/trainer/export_leaderboard.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in CSV/PDF
ini_set('display_errors', 0);
error_reporting(E_ERROR);

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
  $token = $matches[1];
}

if (empty($token)) {
  http_response_code(401);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'Authentication required']);
  exit;
}

// Decode token (base64-encoded "userId:timestamp")
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
  http_response_code(401);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'Invalid token format']);
  exit;
}

list($trainerId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24-hour expiration)
if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  header('Content-Type: application/json');
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
  header('Content-Type: application/json');
  echo json_encode(['error' => 'Permission denied']);
  exit;
}

// Get export format (csv or pdf)
$format = isset($_GET['format']) ? $_GET['format'] : 'csv';

// Get filter parameters
$programId = isset($_GET['programId']) ? $_GET['programId'] : null;
$timeframe = isset($_GET['timeframe']) ? $_GET['timeframe'] : 'all';

// Build timeframe condition
$timeframeCondition = '';
$timeframeParams = [];

if ($timeframe !== 'all') {
  $cutoffDate = date('Y-m-d H:i:s');
  
  if ($timeframe === 'week') {
    $cutoffDate = date('Y-m-d H:i:s', strtotime('-7 days'));
  } else if ($timeframe === 'month') {
    $cutoffDate = date('Y-m-d H:i:s', strtotime('-30 days'));
  } else if ($timeframe === 'quarter') {
    $cutoffDate = date('Y-m-d H:i:s', strtotime('-90 days'));
  }
  
  $timeframeCondition = ' AND (qa.attempt_date >= :cutoff_date OR pea.submitted_at >= :cutoff_date)';
  $timeframeParams[':cutoff_date'] = $cutoffDate;
}

try {
  // Get program name if program filter is applied
  $programName = 'All Programs';
  if ($programId) {
    $programQuery = "SELECT title FROM programs WHERE id = :id";
    $stmt = $pdo->prepare($programQuery);
    $stmt->bindParam(':id', $programId, PDO::PARAM_INT);
    $stmt->execute();
    $programResult = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($programResult) {
      $programName = $programResult['title'];
    }
  }

  // Get timeframe description
  $timeframeDesc = 'All Time';
  if ($timeframe === 'week') {
    $timeframeDesc = 'Last 7 Days';
  } else if ($timeframe === 'month') {
    $timeframeDesc = 'Last 30 Days';
  } else if ($timeframe === 'quarter') {
    $timeframeDesc = 'Last 90 Days';
  }

  // Get all trainees with basic info
  $query = "
    SELECT 
      u.id, 
      u.full_name,
      u.email,
      u.phone,
      u.status,
      (SELECT MIN(pe.enrollment_date) FROM program_enrollments pe WHERE pe.user_id = u.id) AS enrollment_date
    FROM 
      users u
    WHERE 
      u.role = 'trainee'
    ORDER BY 
      u.full_name
  ";
  
  $stmt = $pdo->prepare($query);
  $stmt->execute();
  $trainees = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // For each trainee, get their program enrollments, quiz scores, and practical exam scores
  foreach ($trainees as &$trainee) {
    // Calculate program completion rate (similar to leaderboard.php)
    // ... [calculations omitted for brevity - use same logic as in leaderboard.php]
    
    // Get quiz attempts and calculate average score
    // ... [calculations omitted for brevity - use same logic as in leaderboard.php]
    
    // Get practical exam attempts and calculate average score
    // ... [calculations omitted for brevity - use same logic as in leaderboard.php]
    
    // Calculate overall score based on weights
    // ... [calculations omitted for brevity - use same logic as in leaderboard.php]
  }
  
  // Sort trainees by overall score (descending)
  usort($trainees, function($a, $b) {
    return $b['overall_score'] <=> $a['overall_score'];
  });
  
  // Add rank
  foreach ($trainees as $index => &$trainee) {
    $trainee['rank'] = $index + 1;
  }
  
  // Generate export file based on format
  if ($format === 'csv') {
    // CSV export
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="trainee_leaderboard.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Add title and filters
    fputcsv($output, ['Trainee Leaderboard Report']);
    fputcsv($output, ['Generated: ' . date('Y-m-d H:i:s')]);
    fputcsv($output, ['Program: ' . $programName]);
    fputcsv($output, ['Timeframe: ' . $timeframeDesc]);
    fputcsv($output, []); // Empty line
    
    // Add headers
    fputcsv($output, ['Rank', 'Name', 'Email', 'Status', 'Overall Score', 'Quiz Score', 'Practical Score', 'Completion Rate']);
    
    // Add data rows
    foreach ($trainees as $trainee) {
      fputcsv($output, [
        $trainee['rank'],
        $trainee['full_name'],
        $trainee['email'],
        $trainee['status'],
        number_format($trainee['overall_score'], 2) . '%',
        number_format($trainee['quiz_score'], 2) . '%',
        number_format($trainee['practical_score'], 2) . '%',
        $trainee['completion_rate'] . '%'
      ]);
    }
    
    fclose($output);
    
  } else if ($format === 'pdf') {
    // Require TCPDF library (make sure it's installed)
    require_once __DIR__ . '/../../vendor/autoload.php';
    
    // Create PDF
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    
    // Set document information
    $pdf->SetCreator('LMS Forbes');
    $pdf->SetAuthor('Trainer');
    $pdf->SetTitle('Trainee Leaderboard');
    $pdf->SetSubject('Trainee Performance Report');
    
    // Remove header/footer
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    
    // Add a page
    $pdf->AddPage();
    
    // Set font
    $pdf->SetFont('helvetica', 'B', 16);
    
    // Title
    $pdf->Cell(0, 10, 'Trainee Leaderboard Report', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 10);
    $pdf->Cell(0, 6, 'Generated: ' . date('Y-m-d H:i:s'), 0, 1, 'C');
    $pdf->Cell(0, 6, 'Program: ' . $programName, 0, 1, 'C');
    $pdf->Cell(0, 6, 'Timeframe: ' . $timeframeDesc, 0, 1, 'C');
    
    $pdf->Ln(10);
    
    // Table header
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->SetFillColor(230, 230, 230);
    $pdf->Cell(15, 7, 'Rank', 1, 0, 'C', true);
    $pdf->Cell(50, 7, 'Name', 1, 0, 'C', true);
    $pdf->Cell(50, 7, 'Email', 1, 0, 'C', true);
    $pdf->Cell(25, 7, 'Overall Score', 1, 0, 'C', true);
    $pdf->Cell(25, 7, 'Quiz Score', 1, 0, 'C', true);
    $pdf->Cell(25, 7, 'Practical', 1, 0, 'C', true);
    $pdf->Cell(15, 7, 'Completion', 1, 1, 'C', true);
    
    // Table rows
    $pdf->SetFont('helvetica', '', 9);
    
    $fillRow = false;
    foreach ($trainees as $trainee) {
      $pdf->SetFillColor(245, 245, 245);
      
      // Highlight top 3
      if ($trainee['rank'] <= 3) {
        switch ($trainee['rank']) {
          case 1:
            $pdf->SetFillColor(255, 248, 225); // Light gold
            break;
          case 2:
            $pdf->SetFillColor(243, 243, 243); // Light silver
            break;
          case 3:
            $pdf->SetFillColor(255, 239, 231); // Light bronze
            break;
        }
        $fillRow = true;
      } else {
        $fillRow = !$fillRow;
      }
      
      $pdf->Cell(15, 6, $trainee['rank'], 1, 0, 'C', $fillRow);
      $pdf->Cell(50, 6, $trainee['full_name'], 1, 0, 'L', $fillRow);
      $pdf->Cell(50, 6, $trainee['email'], 1, 0, 'L', $fillRow);
      $pdf->Cell(25, 6, number_format($trainee['overall_score'], 2) . '%', 1, 0, 'C', $fillRow);
      $pdf->Cell(25, 6, number_format($trainee['quiz_score'], 2) . '%', 1, 0, 'C', $fillRow);
      $pdf->Cell(25, 6, number_format($trainee['practical_score'], 2) . '%', 1, 0, 'C', $fillRow);
      $pdf->Cell(15, 6, $trainee['completion_rate'] . '%', 1, 1, 'C', $fillRow);
    }
    
    // Add explanation
    $pdf->Ln(10);
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->Cell(0, 6, 'About the Scores:', 0, 1);
    $pdf->SetFont('helvetica', '', 9);
    $pdf->MultiCell(0, 5, 'Overall Score: Calculated using the weighted average of quiz scores (60%) and practical exam scores (40%).', 0, 'L');
    $pdf->MultiCell(0, 5, 'Quiz Score: Average score across all quiz attempts.', 0, 'L');
    $pdf->MultiCell(0, 5, 'Practical: Average score across all practical exam submissions.', 0, 'L');
    $pdf->MultiCell(0, 5, 'Completion: Percentage of assigned programs that have been completed.', 0, 'L');
    
    // Output PDF
    $pdf->Output('trainee_leaderboard.pdf', 'D');
    
  } else {
    // Unsupported format
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unsupported export format. Use "csv" or "pdf".']);
  }
  
} catch (PDOException $e) {
  http_response_code(500);
  header('Content-Type: application/json');
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
exit;