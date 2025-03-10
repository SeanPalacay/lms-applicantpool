<?php
// Enable error reporting for troubleshooting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include CORS middleware first
header("Access-Control-Allow-Origin: http://localhost:3000"); 
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Set header for regular requests
header("Content-Type: application/json");

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Debug function
function debug_log($message, $data = null) {
    $log_file = "verify_debug.log";
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message";
    
    if ($data !== null) {
        if (is_array($data) || is_object($data)) {
            $log_entry .= " " . json_encode($data);
        } else {
            $log_entry .= " $data";
        }
    }
    
    file_put_contents($log_file, $log_entry . PHP_EOL, FILE_APPEND);
}

debug_log("Verify request received");

// Check if we have the Authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? null;

debug_log("Auth header", $authHeader);

if (!$authHeader) {
    debug_log("No Authorization header found");
    http_response_code(401);
    echo json_encode(['error' => 'No authorization token provided', 'isValid' => false]);
    exit;
}

// Extract token from header
$token = null;
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
} else {
    // If no Bearer prefix, use the whole header
    $token = $authHeader;
}

debug_log("Extracted token", $token);

if (!$token) {
    debug_log("Invalid token format");
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token format', 'isValid' => false]);
    exit;
}

// Decode the token (simple implementation)
try {
    // In a real app, you'd validate with a proper JWT library or against a database
    // This is a simplified implementation for the sample token format
    $decodedToken = base64_decode($token);
    debug_log("Decoded token", $decodedToken);
    
    // Expecting format "userId:timestamp"
    $parts = explode(':', $decodedToken);
    
    if (count($parts) !== 2) {
        throw new Exception("Invalid token format");
    }
    
    $userId = $parts[0];
    $timestamp = $parts[1];
    
    // Check if token is expired (24 hour expiry for this example)
    $expiryTime = $timestamp + (24 * 60 * 60); // 24 hours after creation
    $currentTime = time();
    
    if ($currentTime > $expiryTime) {
        debug_log("Token expired", ["expiry" => $expiryTime, "current" => $currentTime]);
        throw new Exception("Token expired");
    }
    
    // In a real app, you would verify the user exists in the database
    // For this example, we'll just consider it valid if we could decode it
    debug_log("Token verification successful", ["userId" => $userId]);
    
    echo json_encode([
        'isValid' => true,
        'userId' => $userId
    ]);
    
} catch (Exception $e) {
    debug_log("Token verification failed", $e->getMessage());
    http_response_code(401);
    echo json_encode([
        'error' => $e->getMessage(),
        'isValid' => false
    ]);
}
?>