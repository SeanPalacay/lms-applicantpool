<?php
// File: backend/api/applicant/job-roles.php
header('Content-Type: application/json');
require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

// Check authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

// If no token in header, check if it's in the query string (for testing)
if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

// Simple token check
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

try {
    // Check if a specific job role ID is requested
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        $roleId = $_GET['id'];
        
        // Get the specific job role
        $query = "
            SELECT 
                jp.id,
                jp.department,
                jp.position_name as title,
                jp.description,
                jp.is_active
            FROM 
                job_positions jp
            WHERE 
                jp.id = :id
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id', $roleId, PDO::PARAM_INT);
        $stmt->execute();
        
        $position = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$position) {
            http_response_code(404);
            echo json_encode(['error' => 'Job role not found']);
            exit;
        }
        
        // Get requirements
        $requirementsQuery = "
            SELECT requirement 
            FROM job_requirements 
            WHERE position_id = :position_id
        ";
        
        $requirementsStmt = $pdo->prepare($requirementsQuery);
        $requirementsStmt->bindParam(':position_id', $position['id'], PDO::PARAM_INT);
        $requirementsStmt->execute();
        
        $requirements = $requirementsStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // If no requirements found, provide default ones based on the position category
        if (empty($requirements)) {
            $requirements = [
                "Experience in {$position['title']} role",
                "Knowledge of {$position['department']} processes",
                "Communication and teamwork skills",
                "Problem-solving abilities"
            ];
        }
        
        // Get responsibilities
        $responsibilitiesQuery = "
            SELECT responsibility 
            FROM job_responsibilities 
            WHERE position_id = :position_id
        ";
        
        $responsibilitiesStmt = $pdo->prepare($responsibilitiesQuery);
        $responsibilitiesStmt->bindParam(':position_id', $position['id'], PDO::PARAM_INT);
        $responsibilitiesStmt->execute();
        
        $responsibilities = $responsibilitiesStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // If no responsibilities found, provide default ones based on the position
        if (empty($responsibilities)) {
            $responsibilities = [
                "Perform {$position['title']} duties",
                "Collaborate with team members in {$position['department']}",
                "Maintain accurate records",
                "Report to department supervisor"
            ];
        }
        
        // Get related programs
        $programsQuery = "
            SELECT p.title, p.id
            FROM programs p
            JOIN position_program_relation ppr ON p.id = ppr.program_id
            WHERE ppr.position_id = :position_id
            ORDER BY p.title
        ";
        
        $programsStmt = $pdo->prepare($programsQuery);
        $programsStmt->bindParam(':position_id', $position['id'], PDO::PARAM_INT);
        $programsStmt->execute();
        
        $programs = $programsStmt->fetchAll(PDO::FETCH_COLUMN, 0);
        
        // Add requirements and responsibilities to the position
        $position['requirements'] = $requirements;
        $position['responsibilities'] = $responsibilities;
        $position['programs'] = $programs;
        
        echo json_encode($position);
    } else {
        // Get all job roles from the job_positions table with department filtering if provided
        $query = "
            SELECT 
                jp.id,
                jp.department,
                jp.position_name as title,
                jp.description,
                jp.is_active
            FROM 
                job_positions jp
            WHERE 
                jp.is_active = 1
        ";
        
        // Add department filter if provided
        if (isset($_GET['department']) && !empty($_GET['department'])) {
            $query .= " AND jp.department = :department";
        }
        
        // Add ordering
        $query .= " ORDER BY jp.department, jp.position_name";
        
        $stmt = $pdo->prepare($query);
        
        // Bind department parameter if provided
        if (isset($_GET['department']) && !empty($_GET['department'])) {
            $stmt->bindParam(':department', $_GET['department'], PDO::PARAM_STR);
        }
        
        $stmt->execute();
        $positions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Enhanced positions array
        $enhancedPositions = [];
        
        foreach ($positions as $position) {
            // Get requirements from job_requirements table
            $requirementsQuery = "
                SELECT requirement 
                FROM job_requirements 
                WHERE position_id = :position_id
            ";
            
            $requirementsStmt = $pdo->prepare($requirementsQuery);
            $requirementsStmt->bindParam(':position_id', $position['id'], PDO::PARAM_INT);
            $requirementsStmt->execute();
            
            $requirements = $requirementsStmt->fetchAll(PDO::FETCH_COLUMN);
            
            // If no requirements found, provide default ones based on the position category
            if (empty($requirements)) {
                $requirements = [
                    "Experience in {$position['title']} role",
                    "Knowledge of {$position['department']} processes",
                    "Communication and teamwork skills",
                    "Problem-solving abilities"
                ];
            }
            
            // Get responsibilities from job_responsibilities table
            $responsibilitiesQuery = "
                SELECT responsibility 
                FROM job_responsibilities 
                WHERE position_id = :position_id
            ";
            
            $responsibilitiesStmt = $pdo->prepare($responsibilitiesQuery);
            $responsibilitiesStmt->bindParam(':position_id', $position['id'], PDO::PARAM_INT);
            $responsibilitiesStmt->execute();
            
            $responsibilities = $responsibilitiesStmt->fetchAll(PDO::FETCH_COLUMN);
            
            // If no responsibilities found, provide default ones based on the position
            if (empty($responsibilities)) {
                $responsibilities = [
                    "Perform {$position['title']} duties",
                    "Collaborate with team members in {$position['department']}",
                    "Maintain accurate records",
                    "Report to department supervisor"
                ];
            }
            
            // Get related programs from position_program_relation and programs tables
            $programsQuery = "
                SELECT p.title, p.id
                FROM programs p
                JOIN position_program_relation ppr ON p.id = ppr.program_id
                WHERE ppr.position_id = :position_id
                ORDER BY p.title
            ";
            
            $programsStmt = $pdo->prepare($programsQuery);
            $programsStmt->bindParam(':position_id', $position['id'], PDO::PARAM_INT);
            $programsStmt->execute();
            
            $programs = $programsStmt->fetchAll(PDO::FETCH_COLUMN, 0);
            
            // If no programs found, find any that might be related by keyword in the title
            if (empty($programs)) {
                $keywordProgramsQuery = "
                    SELECT title 
                    FROM programs 
                    WHERE title LIKE :keyword1 OR title LIKE :keyword2 OR description LIKE :keyword3
                    LIMIT 2
                ";
                
                $keywordProgramsStmt = $pdo->prepare($keywordProgramsQuery);
                $keyword1 = "%{$position['title']}%";
                $keyword2 = "%{$position['department']}%";
                $keyword3 = "%{$position['title']}%";
                
                $keywordProgramsStmt->bindParam(':keyword1', $keyword1, PDO::PARAM_STR);
                $keywordProgramsStmt->bindParam(':keyword2', $keyword2, PDO::PARAM_STR);
                $keywordProgramsStmt->bindParam(':keyword3', $keyword3, PDO::PARAM_STR);
                $keywordProgramsStmt->execute();
                
                $programs = $keywordProgramsStmt->fetchAll(PDO::FETCH_COLUMN);
            }
            
            // If still no programs found, get the latest 2 company-wide programs
            if (empty($programs)) {
                $generalProgramsQuery = "
                    SELECT title 
                    FROM programs 
                    WHERE type = 'regular'
                    ORDER BY created_at DESC
                    LIMIT 2
                ";
                
                $generalProgramsStmt = $pdo->prepare($generalProgramsQuery);
                $generalProgramsStmt->execute();
                
                $programs = $generalProgramsStmt->fetchAll(PDO::FETCH_COLUMN);
            }
            
            // Create enhanced position object
            $enhancedPosition = [
                'id' => $position['id'],
                'title' => $position['title'],
                'department' => $position['department'],
                'description' => $position['description'] ?: "This position plays a key role in the {$position['department']} department.",
                'requirements' => $requirements,
                'responsibilities' => $responsibilities,
                'programs' => $programs
            ];
            
            $enhancedPositions[] = $enhancedPosition;
        }
        
        // Add pagination metadata if requested
        if (isset($_GET['page']) && isset($_GET['limit'])) {
            $page = (int)$_GET['page'];
            $limit = (int)$_GET['limit'];
            $offset = ($page - 1) * $limit;
            
            $totalPositions = count($enhancedPositions);
            $totalPages = ceil($totalPositions / $limit);
            
            $paginatedPositions = array_slice($enhancedPositions, $offset, $limit);
            
            $response = [
                'data' => $paginatedPositions,
                'pagination' => [
                    'total' => $totalPositions,
                    'per_page' => $limit,
                    'current_page' => $page,
                    'last_page' => $totalPages
                ]
            ];
            
            echo json_encode($response);
        } else {
            // Return all positions without pagination
            echo json_encode($enhancedPositions);
        }
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}