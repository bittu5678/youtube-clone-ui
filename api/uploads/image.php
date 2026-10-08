<?php
/**
 * FaceTube - Image Upload API
 * POST /api/uploads/image.php
 */

require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

if (!isset($_FILES['image']) && !isset($_FILES['file'])) {
    jsonResponse(['success' => false, 'error' => 'No image file uploaded.'], 400);
}

$file = $_FILES['image'] ?? $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'error' => 'Upload error code: ' . $file['error']], 400);
}

$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!isset($allowedMimes[$mimeType])) {
    jsonResponse(['success' => false, 'error' => 'Invalid file format. Only JPG, PNG, and WebP images are allowed.'], 400);
}

$maxSize = 10 * 1024 * 1024; // 10MB
if ($file['size'] > $maxSize) {
    jsonResponse(['success' => false, 'error' => 'File size exceeds maximum limit of 10MB.'], 400);
}

$ext = $allowedMimes[$mimeType];
$fileName = 'img_' . time() . '_' . substr(md5(random_bytes(8)), 0, 8) . '.' . $ext;

$uploadDir = __DIR__ . '/../../uploads/images/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$destination = $uploadDir . $fileName;
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    jsonResponse(['success' => false, 'error' => 'Failed to move uploaded file.'], 500);
}

$fileSizeBytes = $file['size'];
$fileSizeStr = $fileSizeBytes > 1024 * 1024
    ? round($fileSizeBytes / (1024 * 1024), 1) . ' MB'
    : round($fileSizeBytes / 1024) . ' KB';

$publicUrl = '/uploads/images/' . $fileName;

jsonResponse([
    'success' => true,
    'url' => $publicUrl,
    'fileName' => $fileName,
    'format' => $ext,
    'fileSize' => $fileSizeStr,
]);
