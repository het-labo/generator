<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Set a max size (e.g., 3MB)
$maxSize = 3 * 1024 * 1024; 
$allowed = ['image/jpeg','image/png','image/gif','image/webp'];

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$f = $_FILES['file'];
if ($f['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload error: ' . $f['error']]);
    exit;
}

if ($f['size'] > $maxSize) {
    http_response_code(413);
    echo json_encode(['error' => 'File too large']);
    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $f['tmp_name']);
if (!in_array($mime, $allowed, true)) {
    http_response_code(415);
    echo json_encode(['error' => 'Unsupported file type: ' . $mime]);
    exit;
}

// Create uploads dir if needed
$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate safe unique filename
$originalName = pathinfo($f['name'], PATHINFO_FILENAME);
$ext = pathinfo($f['name'], PATHINFO_EXTENSION);
$basename = bin2hex(random_bytes(8));
$filename = $basename . '.' . strtolower($ext);
$targetPath = $uploadDir . '/' . $filename;

if (!move_uploaded_file($f['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit;
}

// Build public URL
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
$publicUrl = $scheme . '://' . $host . $scriptDir . '/uploads/' . $filename;

header('Content-Type: application/json');
echo json_encode(['url' => $publicUrl]);
