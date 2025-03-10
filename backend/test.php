<?php
// File: /lms-forbes/backend/test.php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'message' => 'Backend is accessible',
    'time' => date('Y-m-d H:i:s')
]);