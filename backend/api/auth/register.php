<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

function debug_log($message, $data = null) {
    $log_file = "register_debug.log";
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message";
    if ($data !== null) $log_entry .= " " . json_encode($data);
    file_put_contents($log_file, $log_entry . PHP_EOL, FILE_APPEND);
}

debug_log("Registration request received");

try {
    require_once "../../config/db_config.php";
    if (!isset($pdo) || !$pdo) {
        debug_log("Database connection failed: PDO not initialized");
        throw new Exception("Database connection not available");
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    debug_log("Database connection successful");

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        debug_log("Invalid request method", $_SERVER['REQUEST_METHOD']);
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    // Validate form fields
    $required_fields = ['first_name', 'last_name', 'email', 'password', 'role', 'file'];
    foreach ($required_fields as $field) {
        if (!isset($_FILES[$field]) && !isset($_POST[$field])) {
            debug_log("Missing required field", $field);
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }

    // Validate resume file
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $errorCode = isset($_FILES['file']) ? $_FILES['file']['error'] : 'No file uploaded';
        debug_log("File upload error", $errorCode);
        http_response_code(400);
        echo json_encode(['error' => 'Resume upload failed. Error code: ' . $errorCode]);
        exit;
    }

    $file = $_FILES['file'];
    $fileName = $file['name'];
    $fileSize = $file['size'];
    $fileTmpName = $file['tmp_name'];
    $fileType = $file['type'];

    // Validate file type
    $allowedTypes = ['application/pdf'];
    if (!in_array($fileType, $allowedTypes)) {
        debug_log("Invalid file type", $fileType);
        http_response_code(400);
        echo json_encode(['error' => 'Resume must be a PDF file']);
        exit;
    }

    // Validate file size (5MB limit)
    $maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if ($fileSize > $maxSize) {
        debug_log("File too large", $fileSize);
        http_response_code(400);
        echo json_encode(['error' => 'Resume file size exceeds 5MB limit']);
        exit;
    }

    // Get form fields
    $first_name = htmlspecialchars(trim($_POST['first_name']));
    $last_name = htmlspecialchars(trim($_POST['last_name']));
    $email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'];
    $role = htmlspecialchars(trim($_POST['role']));
    $description = isset($_POST['description']) ? htmlspecialchars(trim($_POST['description'])) : 'Resume';
    $record_type = isset($_POST['record_type']) ? htmlspecialchars(trim($_POST['record_type'])) : 'applicant';
    $category = isset($_POST['category']) ? htmlspecialchars(trim($_POST['category'])) : 'evaluations';
    $full_name = "$first_name $last_name";

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        debug_log("Invalid email format", $email);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit;
    }

    if ($role !== 'applicant') {
        debug_log("Invalid role for this endpoint", $role);
        http_response_code(400);
        echo json_encode(['error' => 'This registration endpoint is for applicants only']);
        exit;
    }

    if ($record_type !== 'applicant' || $category !== 'evaluations') {
        debug_log("Invalid record type or category", ['record_type' => $record_type, 'category' => $category]);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid record type or category']);
        exit;
    }

    // Start transaction
    $pdo->beginTransaction();

    // Generate unique username
    $base_username = strtolower($first_name[0] . $last_name);
    $username = $base_username;
    $suffix = 1;
    while (true) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if (!$stmt->fetch()) break;
        $username = $base_username . $suffix++;
    }

    // Insert user
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("
        INSERT INTO users (username, password, full_name, email, role, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'active', NOW())
    ");
    $stmt->execute([$username, $hashedPassword, $full_name, $email, $role]);
    $userId = $pdo->lastInsertId();

    // Handle resume upload
    $uploadsDir = __DIR__ . '/../../uploads/documents';
    if (!file_exists($uploadsDir)) {
        if (!mkdir($uploadsDir, 0755, true)) {
            debug_log("Failed to create uploads directory", $uploadsDir);
            throw new Exception("Failed to create uploads directory");
        }
    }
    if (!is_writable($uploadsDir)) {
        debug_log("Uploads directory is not writable", $uploadsDir);
        throw new Exception("Uploads directory is not writable");
    }

    $uniqueFilename = "resume_{$userId}_" . time() . '_' . bin2hex(random_bytes(4)) . '.' . pathinfo($fileName, PATHINFO_EXTENSION);
    $uploadPath = $uploadsDir . '/' . $uniqueFilename;
    $databasePath = "uploads/documents/" . $uniqueFilename;

    debug_log("Moving uploaded file to", $uploadPath);

    if (!move_uploaded_file($fileTmpName, $uploadPath)) {
        debug_log("Failed to move uploaded file", error_get_last());
        throw new Exception("Failed to save uploaded resume: " . (error_get_last()['message'] ?? 'Unknown error'));
    }

    // Verify file exists after upload
    if (!file_exists($uploadPath)) {
        debug_log("Uploaded file not found after move", $uploadPath);
        throw new Exception("Uploaded file not found after move");
    }

    // Insert resume record
    $stmt = $pdo->prepare("
        INSERT INTO records (user_id, record_type, category, file_path, description, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$userId, $record_type, $category, $databasePath, $description]);
    $recordId = $pdo->lastInsertId();

    // Commit transaction
    $pdo->commit();

    debug_log("User registered successfully with resume", ['id' => $userId, 'username' => $username, 'resume' => $databasePath, 'record_id' => $recordId]);
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'user_id' => $userId,
        'username' => $username
    ]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
        debug_log("Transaction rolled back due to error", $e->getMessage());
    }
    debug_log("Registration error", $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>