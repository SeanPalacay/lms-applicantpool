<?php
// lms-forbes/backend/api/trainer/job_positions.php

ini_set('display_errors', 0);
error_reporting(E_ERROR);

require_once '../../shared/cors_middleware.php';
require_once __DIR__ . '/../../config/db_config.php';

header('Content-Type: application/json');

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

list($trainerId, $timestamp) = explode(':', $decodedToken);

// Basic token validation
if (!$trainerId || !$timestamp || (time() - $timestamp > 24 * 60 * 60)) {
  http_response_code(401);
  echo json_encode(['error' => 'Invalid or expired token']);
  exit;
}

// Verify trainer role
$query = "SELECT role FROM users WHERE id = :id";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $trainerId, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] !== 'trainer') {
  http_response_code(403);
  echo json_encode(['error' => 'Permission denied']);
  exit;
}

try {
  $query = "SELECT id, position_name, department FROM job_positions WHERE is_active = 1";
  $stmt = $pdo->prepare($query);
  $stmt->execute();
  $positions = $stmt->fetchAll(PDO::FETCH_ASSOC);

  http_response_code(200);
  echo json_encode($positions);
} catch (PDOException $e) {
  error_log("Database error in trainer/job_positions.php: " . $e->getMessage());
  http_response_code(500);
  echo json_encode(['error' => 'Failed to fetch job positions: ' . $e->getMessage()]);
}
?>