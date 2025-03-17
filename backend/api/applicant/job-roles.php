<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set JSON headers early
header('Content-Type: application/json');

// Optionally disable display_errors in production
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/php/logs/php_error_log'); // Adjust path or remove

require_once __DIR__ . '/../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Read Authorization header for Bearer token
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// Fallback: accept token in the query string (for testing only)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// If token is still empty, return 401
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    if (!isset($pdo)) {
        throw new Exception('Database connection not established');
    }
    
    // In a production environment, this data would come from a database table
    // For this example, we'll return structured sample data
    $jobRoles = [
        [
            'id' => 1,
            'title' => 'Loan Officer',
            'department' => 'Operations',
            'description' => 'Evaluate loan applications, ensure compliance with lending policies, and provide excellent customer service.',
            'requirements' => [
                'Bachelor\'s degree in Finance, Business, or related field',
                'Strong analytical and decision-making skills',
                'Excellent communication and interpersonal abilities',
                'Knowledge of lending regulations and compliance requirements'
            ],
            'responsibilities' => [
                'Process and evaluate loan applications',
                'Conduct financial analysis and risk assessment',
                'Ensure compliance with lending policies and regulations',
                'Build and maintain client relationships',
                'Document and maintain accurate records'
            ],
            'programs' => ['Loan Officer Basics', 'Advanced Loan Training']
        ],
        [
            'id' => 2,
            'title' => 'Financial Educator',
            'department' => 'Training',
            'description' => 'Develop and deliver financial literacy training programs to clients and community members.',
            'requirements' => [
                'Bachelor\'s degree in Education, Finance, or related field',
                'Teaching or training experience',
                'Strong presentation and public speaking skills',
                'Knowledge of personal finance and financial literacy concepts'
            ],
            'responsibilities' => [
                'Develop financial literacy curriculum and training materials',
                'Conduct workshops and training sessions',
                'Assess learning outcomes and program effectiveness',
                'Stay updated on financial education best practices',
                'Collaborate with community organizations'
            ],
            'programs' => ['Policy Refresher 2025']
        ],
        [
            'id' => 3,
            'title' => 'Credit Analyst',
            'department' => 'Risk Management',
            'description' => 'Analyze financial data to assess credit risk and make recommendations on loan approvals.',
            'requirements' => [
                'Bachelor\'s degree in Finance, Accounting, or related field',
                'Strong analytical and quantitative skills',
                'Proficiency in financial analysis software',
                'Knowledge of credit risk assessment methodologies'
            ],
            'responsibilities' => [
                'Evaluate creditworthiness of loan applicants',
                'Analyze financial statements and credit reports',
                'Assess collateral values and loan security',
                'Prepare credit risk reports and recommendations',
                'Monitor and review existing loan portfolios'
            ],
            'programs' => ['Advanced Loan Training']
        ]
    ];
    
    // In a real implementation, you would fetch data from a database table
    // For example:
    /*
    $query = "SELECT id, title, department, description FROM job_roles";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $jobRoles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Then fetch requirements, responsibilities, and related programs for each role
    foreach ($jobRoles as &$role) {
        // Fetch requirements
        $reqQuery = "SELECT requirement FROM job_requirements WHERE job_role_id = ?";
        $reqStmt = $pdo->prepare($reqQuery);
        $reqStmt->execute([$role['id']]);
        $role['requirements'] = $reqStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Fetch responsibilities
        $respQuery = "SELECT responsibility FROM job_responsibilities WHERE job_role_id = ?";
        $respStmt = $pdo->prepare($respQuery);
        $respStmt->execute([$role['id']]);
        $role['responsibilities'] = $respStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Fetch related programs
        $progQuery = "SELECT p.title FROM programs p 
                      JOIN job_programs jp ON p.id = jp.program_id 
                      WHERE jp.job_role_id = ?";
        $progStmt = $pdo->prepare($progQuery);
        $progStmt->execute([$role['id']]);
        $role['programs'] = $progStmt->fetchAll(PDO::FETCH_COLUMN);
    }
    */
    
    // Return the job roles
    echo json_encode($jobRoles);

} catch (PDOException $e) {
    error_log("Job Roles API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log("Job Roles API General Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
    exit;
}
?>