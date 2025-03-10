<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Database connection parameters
    $host = 'localhost';
    $dbname = 'lms_forbes';
    $username = 'root';
    $password = '';
    
    // Create PDO instance
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get all users
    $stmt = $pdo->query("SELECT id, username, email, password, role FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $testPassword = 'test';
    $correctHash = '$2y$10$m96uyuUiZrABTGi4Lh3WQOEWGQdQXwnvVZdNLu5kLH.xZYFWUJJl6';
    
    $results = [];
    
    foreach ($users as $user) {
        // Test password against stored hash
        $storedHash = $user['password'];
        $passwordVerifies = password_verify($testPassword, $storedHash);
        
        // Test against our known correct hash
        $correctHashVerifies = password_verify($testPassword, $correctHash);
        
        // Create a new hash for 'test'
        $newHash = password_hash($testPassword, PASSWORD_DEFAULT);
        
        $results[] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'] ?? 'N/A',
            'role' => $user['role'],
            'stored_hash' => $storedHash,
            'password_verifies' => $passwordVerifies ? 'Yes' : 'No',
            'correct_hash_verifies' => $correctHashVerifies ? 'Yes' : 'No',
            'hash_length' => strlen($storedHash),
            'correct_hash_length' => strlen($correctHash),
            'stored_hash_starts_with' => substr($storedHash, 0, 7),
            'correct_hash_starts_with' => substr($correctHash, 0, 7)
        ];
    }
    
    // Output results
    echo json_encode([
        'database_connected' => true,
        'user_count' => count($users),
        'test_password' => $testPassword,
        'correct_hash' => $correctHash,
        'php_version' => PHP_VERSION,
        'results' => $results,
        'solutions' => [
            [
                'description' => 'If password_verify() fails, update all passwords with working hash',
                'sql' => "UPDATE users SET password = '$correctHash' WHERE id > 0;"
            ],
            [
                'description' => 'If the login issue persists, try updating with a new fresh hash',
                'sql' => "UPDATE users SET password = '" . $newHash . "' WHERE id > 0;"
            ]
        ]
    ]);
    
} catch (PDOException $e) {
    // Error response
    echo json_encode([
        'database_connected' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>