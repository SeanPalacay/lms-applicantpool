<?php
// File: backend/api/applicant/pools.php
// API endpoint for applicants to view and apply to applicant pools

// Disable error display
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set content type early
header('Content-Type: application/json');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Include required files
try {
    require_once '../../shared/cors_middleware.php';
    require_once __DIR__ . '/../../config/db_config.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load required files: ' . $e->getMessage()]);
    exit;
}

// Determine the actual logged-in user ID
try {
    // Get authentication details
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    $token = '';
    
    // Extract bearer token from the Authorization header
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    }
    
    // If no token in header, check if it's in the query string (for testing)
    if (empty($token) && isset($_GET['token'])) {
        $token = $_GET['token'];
    }
    
    // Check if we have a token
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication token is required']);
        exit;
    }
    
    // Get the actual user ID from the token
    $userId = null;
    
    // Parse Base64 token (USER_ID:TIMESTAMP format)
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    
    // The first part should be the user ID
    if (!empty($parts[0]) && is_numeric($parts[0])) {
        $userId = (int)$parts[0];
        error_log("Successfully extracted user ID $userId from token");
    } else {
        error_log("Failed to extract user ID from token: $decoded");
    }
    
    // Verify user exists and is an applicant
    if ($userId) {
        $checkUserQuery = "SELECT id, username, role FROM users WHERE id = ?";
        $checkUserStmt = $pdo->prepare($checkUserQuery);
        $checkUserStmt->execute([$userId]);
        
        if ($checkUserStmt->rowCount() === 0) {
            error_log("User ID $userId not found in the database");
            $userId = null;
        } else {
            $user = $checkUserStmt->fetch(PDO::FETCH_ASSOC);
            if ($user['role'] !== 'applicant') {
                error_log("User {$user['username']} (ID: $userId) has role {$user['role']} instead of applicant");
                // We'll still use this user ID even if not an applicant, just log a warning
            }
        }
    }
    
    // If we don't have a valid user ID, use the one from URL if provided (for testing)
    if (!$userId && isset($_GET['user_id']) && is_numeric($_GET['user_id'])) {
        $userId = (int)$_GET['user_id'];
        error_log("Using user_id from URL: $userId");
    }
    
    // Final fallback - If still no user ID, respond with an error
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid authentication token or user not found']);
        exit;
    }
    
    // Log the determined user ID for debugging
    error_log("Processing request for user ID: $userId");

    // Get the requested action
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            if (isset($_GET['type']) && $_GET['type'] === 'my-pools') {
                getUserAppliedPools($pdo, $userId);
            } else {
                getAvailablePools($pdo, $userId);
            }
            break;
            
        case 'POST':
            applyToPool($pdo, $userId);
            break;
            
        case 'DELETE':
            withdrawApplication($pdo, $userId);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    error_log("Database error in pools.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("General error in pools.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}

/**
 * Get pools that the current user has already applied to
 */
function getUserAppliedPools($pdo, $userId) {
    error_log("Getting applied pools for user ID: $userId");
    
    try {
        // Get the pools this specific user has applied to
        $query = "
            SELECT 
                ap.id,
                ap.pool_name,
                ap.description,
                ap.department,
                ap.created_at,
                apa.id as assignment_id,
                apa.assigned_at,
                a.id as application_id,
                a.job_role,
                a.status,
                a.applied_at,
                a.updated_at
            FROM 
                applications a
            INNER JOIN 
                applicant_pool_assignments apa ON a.id = apa.application_id
            INNER JOIN 
                applicant_pools ap ON apa.pool_id = ap.id
            WHERE 
                a.user_id = ?
            ORDER BY 
                apa.assigned_at DESC
        ";

        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $pools = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Found " . count($pools) . " applied pools for user $userId");

        // Get positions for each pool
        foreach ($pools as &$pool) {
            $positionsQuery = "
                SELECT position_name
                FROM applicant_pool_positions
                WHERE pool_id = ?
            ";
            
            $posStmt = $pdo->prepare($positionsQuery);
            $posStmt->execute([$pool['id']]);
            $positions = $posStmt->fetchAll(PDO::FETCH_COLUMN);
            $pool['positions'] = $positions;
        }

        echo json_encode($pools);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get applied pools: ' . $e->getMessage()]);
    }
}

/**
 * Get pools available to the user (not yet applied to)
 */
function getAvailablePools($pdo, $userId) {
    error_log("Getting available pools for user ID: $userId");
    
    try {
        // Check if there are any applied pools first
        $appliedPoolIdsQuery = "
            SELECT DISTINCT apa.pool_id 
            FROM applications a
            INNER JOIN applicant_pool_assignments apa ON a.id = apa.application_id
            WHERE a.user_id = ?
        ";
        $appliedPoolsStmt = $pdo->prepare($appliedPoolIdsQuery);
        $appliedPoolsStmt->execute([$userId]);
        $appliedPoolIds = $appliedPoolsStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Simplified query approach
        if (empty($appliedPoolIds)) {
            // If no applied pools, return all pools
            $query = "
                SELECT 
                    ap.id,
                    ap.pool_name,
                    ap.description,
                    ap.department,
                    ap.created_at
                FROM 
                    applicant_pools ap
                ORDER BY 
                    ap.created_at DESC
            ";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
        } else {
            // If there are applied pools, exclude them
            $placeholders = implode(',', array_fill(0, count($appliedPoolIds), '?'));
            $query = "
                SELECT 
                    ap.id,
                    ap.pool_name,
                    ap.description,
                    ap.department,
                    ap.created_at
                FROM 
                    applicant_pools ap
                WHERE 
                    ap.id NOT IN ($placeholders)
                ORDER BY 
                    ap.created_at DESC
            ";
            $stmt = $pdo->prepare($query);
            $stmt->execute($appliedPoolIds);
        }
        
        $pools = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log("Found " . count($pools) . " available pools for user $userId");

        // Get positions for each pool
        foreach ($pools as &$pool) {
            $positionsQuery = "
                SELECT position_name
                FROM applicant_pool_positions
                WHERE pool_id = ?
            ";
            
            $posStmt = $pdo->prepare($positionsQuery);
            $posStmt->execute([$pool['id']]);
            $positions = $posStmt->fetchAll(PDO::FETCH_COLUMN);
            $pool['positions'] = $positions;
        }

        echo json_encode($pools);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get available pools: ' . $e->getMessage(), 'detail' => $e->getTraceAsString()]);
    }
}

/**
 * Apply to a pool as the current user
 */
function applyToPool($pdo, $userId) {
    // Get JSON data
    $requestBody = file_get_contents('php://input');
    $data = json_decode($requestBody, true);
    
    if (!isset($data['pool_id']) || !is_numeric($data['pool_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid pool ID is required']);
        return;
    }
    
    $poolId = $data['pool_id'];
    
    // Debug info
    error_log("Received application request: " . $requestBody);
    
    // Simple check for existing applications
    $checkQuery = "
        SELECT id FROM applications 
        WHERE user_id = ? AND pool_id = ?
    ";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->execute([$userId, $poolId]);
    
    if ($checkStmt->rowCount() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'You have already applied to this pool']);
        return;
    }
    
    // Get pool info
    $poolQuery = "SELECT * FROM applicant_pools WHERE id = ?";
    $poolStmt = $pdo->prepare($poolQuery);
    $poolStmt->execute([$poolId]);
    
    if ($poolStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Pool not found']);
        return;
    }
    
    $pool = $poolStmt->fetch(PDO::FETCH_ASSOC);
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Get position if available
        $jobRole = null;
        
        // Check if position_name is provided in the request
        if (isset($data['position_name']) && !empty($data['position_name'])) {
            $jobRole = $data['position_name'];
        } else {
            // If not, try to get the first position from the pool
            $positionsQuery = "SELECT position_name FROM applicant_pool_positions WHERE pool_id = ? LIMIT 1";
            $posStmt = $pdo->prepare($positionsQuery);
            $posStmt->execute([$poolId]);
            
            if ($posStmt->rowCount() > 0) {
                $jobRole = $posStmt->fetchColumn();
            }
        }
        
        // Log what we're doing
        error_log("Creating application for user $userId, pool $poolId, role: " . ($jobRole ?: 'null'));
        
        // Create new application
        $insertAppQuery = "
            INSERT INTO applications (user_id, pool_id, job_role, department, status, applied_at)
            VALUES (?, ?, ?, ?, 'pending', NOW())
        ";
        $insertAppStmt = $pdo->prepare($insertAppQuery);
        $insertAppStmt->execute([
            $userId, 
            $poolId,
            $jobRole, 
            $pool['department']
        ]);
        
        $appId = $pdo->lastInsertId();
        
        // Create assignment
        $insertAssignQuery = "
            INSERT INTO applicant_pool_assignments (application_id, pool_id)
            VALUES (?, ?)
        ";
        $insertAssignStmt = $pdo->prepare($insertAssignQuery);
        $insertAssignStmt->execute([$appId, $poolId]);
        
        $assignmentId = $pdo->lastInsertId();
        
        // For debugging
        error_log("Created application with ID $appId and assignment ID $assignmentId");
        
        // Commit
        $pdo->commit();
        
        // Refresh data for client
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Successfully applied to pool',
            'data' => [
                'assignment_id' => $assignmentId,
                'application_id' => $appId,
                'pool_id' => $poolId,
                'job_role' => $jobRole
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Error in applyToPool: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error applying to pool: ' . $e->getMessage()]);
    }
}

/**
 * Withdraw an application - completely delete the application and assignment
 */
function withdrawApplication($pdo, $userId) {
    if (!isset($_GET['assignment_id']) || !is_numeric($_GET['assignment_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid assignment ID is required']);
        return;
    }
    
    $assignmentId = $_GET['assignment_id'];
    
    // Check if assignment belongs to user
    $checkQuery = "
        SELECT apa.id, apa.application_id, apa.pool_id
        FROM applicant_pool_assignments apa
        INNER JOIN applications a ON apa.application_id = a.id
        WHERE apa.id = ? AND a.user_id = ?
    ";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->execute([$assignmentId, $userId]);
    
    if ($checkStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Assignment not found or not owned by you']);
        return;
    }
    
    $assignment = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $applicationId = $assignment['application_id'];
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // First delete the assignment
        $deleteAssignQuery = "DELETE FROM applicant_pool_assignments WHERE id = ?";
        $deleteAssignStmt = $pdo->prepare($deleteAssignQuery);
        $deleteAssignStmt->execute([$assignmentId]);
        
        // Then delete the application entirely
        $deleteAppQuery = "DELETE FROM applications WHERE id = ? AND user_id = ?";
        $deleteAppStmt = $pdo->prepare($deleteAppQuery);
        $deleteAppStmt->execute([$applicationId, $userId]);
        
        // Commit
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Application withdrawn successfully'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Error withdrawing application: ' . $e->getMessage()]);
    }
}
?>