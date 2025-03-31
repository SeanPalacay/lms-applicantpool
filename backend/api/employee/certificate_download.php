<?php
// lms-forbes/backend/api/trainee/certificate_download.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// For PDF generation
// Note: You'll need to install TCPDF or a similar library
// if you don't already have one
require_once '../../vendor/tcpdf/tcpdf.php';

// Disable error output to prevent HTML in JSON
ini_set('display_errors', 0);
error_reporting(E_ERROR);

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

list($userId, $timestamp) = explode(':', $decodedToken);

// Basic token validation (24-hour expiration)
if (!$userId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

// Check for certificate ID
if (!isset($_GET['id'])) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'Certificate ID is required']);
    exit;
}

$certificateId = intval($_GET['id']);

// Verify user role and access to the certificate
try {
    $query = "SELECT id, role, full_name FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    if ($user['role'] !== 'trainee' && $user['role'] !== 'administrator') {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['error' => 'Permission denied']);
        exit;
    }

    // First, check if this is a program completion certificate (generated)
    $programQuery = "
    SELECT p.id, p.title, pe.completion_status, pe.enrollment_date
    FROM programs p
    JOIN program_enrollments pe ON p.id = pe.program_id
    WHERE pe.user_id = :userId AND p.id = :programId
    AND pe.completion_status = 'completed'
    ";
    
    $programStmt = $pdo->prepare($programQuery);
    $programStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $programStmt->bindParam(':programId', $certificateId, PDO::PARAM_INT);
    $programStmt->execute();
    $program = $programStmt->fetch(PDO::FETCH_ASSOC);
    
    // If it's a real certificate from records table
    if (!$program) {
        $recordQuery = "
        SELECT r.* 
        FROM records r
        WHERE r.id = :certificateId 
        AND r.user_id = :userId
        AND r.record_type = 'training'
        AND r.category = 'certificates'
        ";
        
        $recordStmt = $pdo->prepare($recordQuery);
        $recordStmt->bindParam(':certificateId', $certificateId, PDO::PARAM_INT);
        $recordStmt->bindParam(':userId', $userId, PDO::PARAM_INT);
        $recordStmt->execute();
        $record = $recordStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($record && file_exists($record['file_path'])) {
            // Return the existing certificate file
            $file = $record['file_path'];
            $fileInfo = pathinfo($file);
            $extension = strtolower($fileInfo['extension']);
            
            if ($extension === 'pdf') {
                header('Content-Type: application/pdf');
            } else {
                header('Content-Type: application/octet-stream');
            }
            
            header('Content-Disposition: attachment; filename="' . $fileInfo['basename'] . '"');
            header('Content-Length: ' . filesize($file));
            
            readfile($file);
            exit;
        } 
    }
    
    // If we got here, either:
    // 1. It's a program completion certificate that needs to be generated
    // 2. The certificate file doesn't exist and we need to generate it
    // 3. The certificate ID doesn't exist
    
    if (!$program) {
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Certificate not found']);
        exit;
    }
    
    // Generate a PDF certificate
    try {
        // Create new PDF document
        $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
        
        // Set document information
        $pdf->SetCreator('LMS Forbes');
        $pdf->SetAuthor('Forbes Learning Management System');
        $pdf->SetTitle('Certificate of Completion');
        $pdf->SetSubject('Certificate of Completion');
        $pdf->SetKeywords('Certificate, Completion, Training');
        
        // Remove header and footer
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        
        // Set margins
        $pdf->SetMargins(15, 15, 15);
        
        // Add a page
        $pdf->AddPage();
        
        // Set font
        $pdf->SetFont('helvetica', 'B', 24);
        
        // Certificate title
        $pdf->Cell(0, 20, 'CERTIFICATE OF COMPLETION', 0, 1, 'C');
        
        // Add space
        $pdf->Ln(10);
        
        // Certificate text
        $pdf->SetFont('helvetica', '', 16);
        $pdf->Cell(0, 10, 'This is to certify that', 0, 1, 'C');
        
        // Recipient name
        $pdf->SetFont('helvetica', 'B', 20);
        $pdf->Cell(0, 15, $user['full_name'], 0, 1, 'C');
        
        // More certificate text
        $pdf->SetFont('helvetica', '', 16);
        $pdf->Cell(0, 10, 'has successfully completed the program', 0, 1, 'C');
        
        // Program name
        $pdf->SetFont('helvetica', 'B', 20);
        $pdf->Cell(0, 15, $program['title'], 0, 1, 'C');
        
        // Date
        $pdf->SetFont('helvetica', '', 14);
        $completionDate = date('F d, Y');
        $pdf->Cell(0, 10, 'Issued on ' . $completionDate, 0, 1, 'C');
        
        // Add signature line
        $pdf->Ln(20);
        $pdf->Line(70, $pdf->GetY(), 230, $pdf->GetY());
        
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'Authorized Signature', 0, 1, 'C');
        
        // Set certificate output filename
        $filename = 'certificate_'.$program['id'].'_'.$userId.'.pdf';
        
        // Output PDF as download
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="'.$filename.'"');
        $pdf->Output($filename, 'D');
        exit;
        
    } catch (Exception $e) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate certificate: ' . $e->getMessage()]);
        exit;
    }
    
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred while processing the certificate download']);
}
?>