<?php
// Database configuration
$host = 'localhost';
$dbname = 'lms_forbes';
$username = 'root';
$password = '';

// Global PDO connection
$pdo = null;

try {
    // Create PDO instance
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    
    // Configure PDO to throw exceptions on errors
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Configure PDO to return associative arrays by default
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Ensure all strings are properly handled with UTF-8
    $pdo->exec("SET NAMES utf8mb4");
    
} catch (PDOException $e) {
    // Log the error
    error_log("Database Connection Error: " . $e->getMessage());
    
    // If this file is directly accessed, return JSON error
    if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Database connection failed']);
    }
    
    // Otherwise just throw the error to be caught by the requiring script
    throw new PDOException("Database connection failed: " . $e->getMessage());
}

// No debugging echo statements!
?>