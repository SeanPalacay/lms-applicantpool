<?php
// lms-forbes/backend/api/public/download_shared_certificate.php
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

// Check for share token
if (!isset($_GET['token']) || empty($_GET['token'])) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'Share token is required']);
    exit;
}

$shareToken = $_GET['token'];

try {
    // In a real implementation, you would have a table to store share tokens
    // For now, we'll parse the token to extract user ID and certificate ID
    
    // This is a simplified implementation - in a real system, you would:
    // 1. Look up the token in a share_tokens table
    // 2. Check if it's expired
    // 3. Get the associated certificate ID and user ID
    
    // For demo purposes, we'll assume the token is a hash of userId_certificateId_timestamp
    // and we'll extract a user ID and certificate ID from it
    // In a real implementation, NEVER do this - use a proper database lookup instead
    
    // Get a test user ID based on hash value
    $userId = 3; // Default to trainee user (this should be looked up from a tokens table)
    
    // Get a certificate ID to show (this would be looked up in a real implementation)
    // For demo, we'll extract a simple hash
    $certificateId = hexdec(substr($shareToken, 0, 8)) % 10; // Just getting a number 0-9
    if ($certificateId === 0) $certificateId = 1; // Ensure at least ID 1
    
    // Check if this is a program completion certificate 
    $programQuery = "
    SELECT p.id, p.title, pe.completion_status, pe.enrollment_date, u.full_name
    FROM programs p
    JOIN program_enrollments pe ON p.id = pe.program_id
    JOIN users u ON pe.user_id = u.id
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
        SELECT r.*, u.full_name as recipient 
        FROM records r
        JOIN users u ON r.user_id = u.id
        WHERE r.user_id = :userId
        AND r.record_type = 'training'
        AND r.category = 'certificates'
        LIMIT 1
        ";
        
        $recordStmt = $pdo->prepare($recordQuery);
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
        $pdf->Cell(0, 15, $program['full_name'], 0, 1, 'C');
        
        // More certificate text
        $pdf->SetFont('helvetica', '', 16);
        $pdf->Cell(0, 10, 'has successfully completed the program', 0, 1, 'C');
        
        // Program name
        $pdf->SetFont('helvetica', 'B', 20);
        $pdf->Cell(0, 15, $program['title'], 0, 1, 'C');
        
        // Date
        $pdf->SetFont('helvetica', '', 14);
        $completionDate = date('F d, Y', strtotime($program['enrollment_date']));
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
    echo json_encode(['error' => 'Database error']);
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['error' => 'This share link is invalid or has expired']);
}
?>