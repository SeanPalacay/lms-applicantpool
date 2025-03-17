<?php
// lms-forbes/backend/api/trainee/progress_export.php
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';
require_once __DIR__ . '/../../vendor/autoload.php'; // Assuming Composer with TCPDF

use TCPDF;

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$headers = getallheaders();
if (!preg_match('/Bearer\s(\S+)/', $headers['Authorization'] ?? '', $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$token = $matches[1];
$decoded = base64_decode($token);
if ($decoded === false || strpos($decoded, ':') === false) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format']);
    exit;
}

list($userId, $timestamp) = explode(':', $decoded);
if (time() - $timestamp > 24 * 60 * 60) {
    http_response_code(401);
    echo json_encode(['error' => 'Token expired']);
    exit;
}

try {
    $query = "SELECT p.title, pe.completion_percentage, pe.completion_status, pe.enrollment_date
              FROM program_enrollments pe
              JOIN programs p ON pe.program_id = p.id
              WHERE pe.user_id = :userId";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':userId', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $enrollments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $pdf = new TCPDF();
    $pdf->AddPage();
    $pdf->SetFont('helvetica', '', 12);
    $pdf->Cell(0, 10, 'Trainee Progress Report', 0, 1, 'C');
    $pdf->Ln(10);

    foreach ($enrollments as $enrollment) {
        $pdf->Cell(0, 10, "Program: {$enrollment['title']}", 0, 1);
        $pdf->Cell(0, 10, "Progress: {$enrollment['completion_percentage']}%", 0, 1);
        $pdf->Cell(0, 10, "Status: {$enrollment['completion_status']}", 0, 1);
        $pdf->Cell(0, 10, "Enrolled: " . date('Y-m-d', strtotime($enrollment['enrollment_date'])), 0, 1);
        $pdf->Ln(5);
    }

    $pdf->Output('Progress_Report.pdf', 'D');
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>