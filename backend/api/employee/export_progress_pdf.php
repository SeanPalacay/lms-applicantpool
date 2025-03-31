<?php
// lms-forbes/backend/api/employee/export_progress_pdf.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';
require_once __DIR__ . '/../../vendor/autoload.php'; // For PDF generation (TCPDF)

// Disable error output
ini_set('display_errors', 0);
error_reporting(E_ERROR);

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Decode token
$decodedToken = base64_decode($token);
if ($decodedToken === false || strpos($decodedToken, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}

list($userId, $timestamp) = explode(':', $decodedToken);

// Validate token
if (!ctype_digit($userId) || !ctype_digit($timestamp) || (time() - $timestamp > 24 * 60 * 60)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

try {
    // Verify user role
    $query = "SELECT id, role, full_name FROM users WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    if ($user['role'] !== 'employee') {
        http_response_code(403);
        echo json_encode([
            'error' => 'Permission denied',
            'detail' => 'This endpoint is for employees only'
        ]);
        exit;
    }

    // Get enrollments
    $queryEnrollments = "
        SELECT 
            pe.id, 
            p.title, 
            pe.enrollment_date, 
            pe.completion_status, 
            pe.completion_percentage
        FROM program_enrollments pe
        JOIN programs p ON pe.program_id = p.id
        WHERE pe.user_id = :userId
    ";
    $stmtEnrollments = $pdo->prepare($queryEnrollments);
    $stmtEnrollments->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmtEnrollments->execute();
    $enrollments = $stmtEnrollments->fetchAll(PDO::FETCH_ASSOC);

    // Get quiz attempts
    $queryQuizzes = "
        SELECT 
            qa.id, 
            q.title as quiz_title, 
            p.title as program_title, 
            qa.score, 
            qa.attempt_date
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        LEFT JOIN programs p ON q.program_id = p.id
        WHERE qa.user_id = :userId
        ORDER BY qa.attempt_date DESC
    ";
    $stmtQuizzes = $pdo->prepare($queryQuizzes);
    $stmtQuizzes->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmtQuizzes->execute();
    $quizzes = $stmtQuizzes->fetchAll(PDO::FETCH_ASSOC);

    // Get milestones
    $queryMilestones = "
        SELECT 
            m.id, 
            m.title, 
            p.title as program_title,
            mp.status, 
            mp.completion_date
        FROM milestones m
        JOIN programs p ON m.program_id = p.id
        LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = :userId
        JOIN program_enrollments pe ON p.id = pe.program_id AND pe.user_id = :userId
    ";
    $stmtMilestones = $pdo->prepare($queryMilestones);
    $stmtMilestones->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmtMilestones->execute();
    $milestones = $stmtMilestones->fetchAll(PDO::FETCH_ASSOC);

    // Generate PDF using TCPDF
    // Make sure you have TCPDF installed or use another PDF generation library
    require_once(__DIR__ . '/../../vendor/tecnickcom/tcpdf/tcpdf.php');

    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    
    // Set document information
    $pdf->SetCreator('LMS Forbes');
    $pdf->SetAuthor('LMS System');
    $pdf->SetTitle('Employee Progress Report');
    $pdf->SetSubject('Training Progress Report');
    
    // Set margins
    $pdf->SetMargins(15, 15, 15);
    $pdf->SetHeaderMargin(5);
    $pdf->SetFooterMargin(10);
    
    // Remove default header/footer
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(true);
    
    // Add a page
    $pdf->AddPage();
    
    // Set font
    $pdf->SetFont('helvetica', 'B', 16);
    
    // User Information and Title
    $pdf->Cell(0, 10, 'Employee Progress Report', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, 'Generated: ' . date('Y-m-d H:i:s'), 0, 1, 'C');
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Employee: ' . $user['full_name'], 0, 1);
    $pdf->Ln(5);
    
    // Overall Progress
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Overall Progress', 0, 1);
    
    $totalPercentage = 0;
    $count = count($enrollments);
    
    if ($count > 0) {
        foreach($enrollments as $enrollment) {
            $totalPercentage += floatval($enrollment['completion_percentage'] ?? 0);
        }
        $overallProgress = $totalPercentage / $count;
    } else {
        $overallProgress = 0;
    }
    
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, 'Average Completion: ' . number_format($overallProgress, 1) . '%', 0, 1);
    $pdf->Ln(5);
    
    // Program Enrollments
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Program Enrollments', 0, 1);
    
    if (count($enrollments) > 0) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(80, 7, 'Program', 1);
        $pdf->Cell(40, 7, 'Enrollment Date', 1);
        $pdf->Cell(30, 7, 'Status', 1);
        $pdf->Cell(30, 7, 'Completion', 1);
        $pdf->Ln();
        
        $pdf->SetFont('helvetica', '', 12);
        foreach($enrollments as $enrollment) {
            $pdf->Cell(80, 7, $enrollment['title'] ?? 'N/A', 1);
            $pdf->Cell(40, 7, $enrollment['enrollment_date'] ? date('Y-m-d', strtotime($enrollment['enrollment_date'])) : 'N/A', 1);
            $pdf->Cell(30, 7, $enrollment['completion_status'] ?? 'N/A', 1);
            $pdf->Cell(30, 7, ($enrollment['completion_percentage'] ?? '0') . '%', 1);
            $pdf->Ln();
        }
    } else {
        $pdf->SetFont('helvetica', '', 12);
        $pdf->Cell(0, 10, 'No program enrollments found.', 0, 1);
    }
    $pdf->Ln(5);
    
    // Quiz Attempts
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Quiz Performance', 0, 1);
    
    if (count($quizzes) > 0) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(70, 7, 'Quiz', 1);
        $pdf->Cell(60, 7, 'Program', 1);
        $pdf->Cell(30, 7, 'Score', 1);
        $pdf->Cell(30, 7, 'Date', 1);
        $pdf->Ln();
        
        $pdf->SetFont('helvetica', '', 12);
        foreach($quizzes as $quiz) {
            $pdf->Cell(70, 7, $quiz['quiz_title'] ?? 'N/A', 1);
            $pdf->Cell(60, 7, $quiz['program_title'] ?? 'N/A', 1);
            $pdf->Cell(30, 7, ($quiz['score'] ?? '0') . '%', 1);
            $pdf->Cell(30, 7, date('Y-m-d', strtotime($quiz['attempt_date'])), 1);
            $pdf->Ln();
        }
    } else {
        $pdf->SetFont('helvetica', '', 12);
        $pdf->Cell(0, 10, 'No quiz attempts found.', 0, 1);
    }
    $pdf->Ln(5);
    
    // Milestones
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Milestones', 0, 1);
    
    if (count($milestones) > 0) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(70, 7, 'Milestone', 1);
        $pdf->Cell(60, 7, 'Program', 1);
        $pdf->Cell(30, 7, 'Status', 1);
        $pdf->Cell(30, 7, 'Completed', 1);
        $pdf->Ln();
        
        $pdf->SetFont('helvetica', '', 12);
        foreach($milestones as $milestone) {
            $pdf->Cell(70, 7, $milestone['title'] ?? 'N/A', 1);
            $pdf->Cell(60, 7, $milestone['program_title'] ?? 'N/A', 1);
            $pdf->Cell(30, 7, $milestone['status'] ?? 'not_started', 1);
            $completionDate = !empty($milestone['completion_date']) ? date('Y-m-d', strtotime($milestone['completion_date'])) : 'N/A';
            $pdf->Cell(30, 7, $completionDate, 1);
            $pdf->Ln();
        }
    } else {
        $pdf->SetFont('helvetica', '', 12);
        $pdf->Cell(0, 10, 'No milestones found.', 0, 1);
    }
    
    // Output the PDF
    $pdfContent = $pdf->Output('Employee_Progress_Report.pdf', 'S');
    
    // Set the appropriate headers for PDF download
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="Employee_Progress_Report.pdf"');
    header('Content-Length: ' . strlen($pdfContent));
    
    // Output the PDF
    echo $pdfContent;
    
} catch (PDOException $e) {
    error_log("Database error in export_progress_pdf.php: " . $e->getMessage() . " | User ID: $userId");
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database error occurred. Please try again later.']);
} catch (Exception $e) {
    error_log("General error in export_progress_pdf.php: " . $e->getMessage() . " | User ID: $userId");
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'An error occurred while generating the PDF']);
}
?>