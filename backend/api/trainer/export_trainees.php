<?php
// lms-forbes/backend/api/trainer/export_trainees.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Disable error output to prevent HTML in response
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
$format = isset($_GET['format']) && $_GET['format'] === 'pdf' ? 'pdf' : 'csv';

// Fetch trainees with program info for export
$query = "
  SELECT 
    u.id, 
    u.full_name,
    u.email,
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

// For each trainee, get their program enrollments as a formatted string
foreach ($trainees as &$trainee) {
  $query = "
    SELECT 
      p.title,
      pe.completion_status,
      pe.completion_percentage
    FROM 
      program_enrollments pe
    JOIN 
      programs p ON pe.program_id = p.id
    WHERE 
      pe.user_id = :userId
    ORDER BY
      pe.enrollment_date DESC
  ";
  $stmt = $pdo->prepare($query);
  $stmt->bindParam(':userId', $trainee['id'], PDO::PARAM_INT);
  $stmt->execute();
  $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // Format enrollment date
  $trainee['enrollment_date'] = !empty($trainee['enrollment_date']) 
    ? date('Y-m-d', strtotime($trainee['enrollment_date'])) 
    : 'N/A';
  
  // Calculate overall progress
  $totalProgress = 0;
  $programCount = count($programs);
  
  if ($programCount > 0) {
    foreach ($programs as $program) {
      if ($program['completion_status'] === 'completed') {
        $totalProgress += 100;
      } elseif ($program['completion_status'] === 'in_progress') {
        $totalProgress += $program['completion_percentage'];
      }
    }
    $trainee['progress'] = round($totalProgress / $programCount) . '%';
  } else {
    $trainee['progress'] = '0%';
  }
  
  // Format programs as list
  $trainee['programs'] = empty($programs) 
    ? 'None' 
    : implode(', ', array_map(function($p) { 
        return $p['title'] . ' (' . ucfirst($p['completion_status']) . ')'; 
      }, $programs));
}

// Output based on format
if ($format === 'csv') {
  // CSV export
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="trainees_export.csv"');
  
  $output = fopen('php://output', 'w');
  
  // Add UTF-8 BOM for Excel compatibility
  fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
  
  // CSV Headers
  fputcsv($output, [
    'Name', 
    'Email', 
    'Status', 
    'Enrollment Date', 
    'Overall Progress', 
    'Programs'
  ]);
  
  // CSV Rows
  foreach ($trainees as $trainee) {
    fputcsv($output, [
      $trainee['full_name'],
      $trainee['email'],
      ucfirst($trainee['status']),
      $trainee['enrollment_date'],
      $trainee['progress'],
      $trainee['programs']
    ]);
  }
  
  fclose($output);
  exit;
} else {
  // PDF export - requires TCPDF or similar library
  // For demonstration, this is simplified
  // In a real application, you'd use a PDF library like TCPDF or FPDF
  
  // If you don't have a PDF library, you can fallback to CSV
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="trainees_export.csv"');
  
  $output = fopen('php://output', 'w');
  
  // Add UTF-8 BOM for Excel compatibility
  fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
  
  // CSV Headers
  fputcsv($output, [
    'Name', 
    'Email', 
    'Status', 
    'Enrollment Date', 
    'Overall Progress', 
    'Programs'
  ]);
  
  // CSV Rows
  foreach ($trainees as $trainee) {
    fputcsv($output, [
      $trainee['full_name'],
      $trainee['email'],
      ucfirst($trainee['status']),
      $trainee['enrollment_date'],
      $trainee['progress'],
      $trainee['programs']
    ]);
  }
  
  fclose($output);
  exit;
  
  // Uncomment and implement the following for PDF support:
  /*
  // Require TCPDF library
  require_once(__DIR__ . '/../../libs/tcpdf/tcpdf.php');
  
  // Create new PDF document
  $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8');
  
  // Set document information
  $pdf->SetCreator('LMS Forbes');
  $pdf->SetAuthor('Trainer');
  $pdf->SetTitle('Trainees Report');
  $pdf->SetSubject('Trainees List');
  
  // Set default header data
  $pdf->SetHeaderData('', 0, 'Trainees Report', 'Generated on ' . date('Y-m-d H:i:s'));
  
  // Set margins
  $pdf->SetMargins(15, 20, 15);
  $pdf->SetHeaderMargin(10);
  $pdf->SetFooterMargin(10);
  
  // Set auto page breaks
  $pdf->SetAutoPageBreak(TRUE, 15);
  
  // Add a page
  $pdf->AddPage();
  
  // Create the table content
  $html = '<table border="1" cellpadding="4">
    <thead>
      <tr style="background-color: #eee; font-weight: bold;">
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
        <th>Enrollment Date</th>
        <th>Progress</th>
        <th>Programs</th>
      </tr>
    </thead>
    <tbody>';
  
  foreach ($trainees as $trainee) {
    $html .= '<tr>
      <td>' . htmlspecialchars($trainee['full_name']) . '</td>
      <td>' . htmlspecialchars($trainee['email']) . '</td>
      <td>' . ucfirst(htmlspecialchars($trainee['status'])) . '</td>
      <td>' . htmlspecialchars($trainee['enrollment_date']) . '</td>
      <td>' . htmlspecialchars($trainee['progress']) . '</td>
      <td>' . htmlspecialchars($trainee['programs']) . '</td>
    </tr>';
  }
  
  $html .= '</tbody></table>';
  
  // Print the table
  $pdf->writeHTML($html, true, false, false, false, '');
  
  // Close and output PDF document
  $pdf->Output('trainees_export.pdf', 'D');
  exit;
  */
}
?>