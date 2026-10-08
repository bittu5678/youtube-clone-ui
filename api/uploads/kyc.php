<?php
/**
 * FaceTube - KYC Document Upload API
 * POST /api/uploads/kyc.php
 */

require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

if (!isset($_FILES['document']) && !isset($_FILES['file'])) {
    jsonResponse(['success' => false, 'error' => 'No document uploaded.'], 400);
}

$file = $_FILES['document'] ?? $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'error' => 'Upload error code: ' . $file['error']], 400);
}

$allowedMimes = [
    'image/jpeg'      => 'jpg',
    'image/png'       => 'png',
    'application/pdf' => 'pdf',
];

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!isset($allowedMimes[$mimeType])) {
    jsonResponse(['success' => false, 'error' => 'Invalid document format. Allowed: JPG, PNG, PDF.'], 400);
}

$maxSize = 10 * 1024 * 1024; // 10MB
if ($file['size'] > $maxSize) {
    jsonResponse(['success' => false, 'error' => 'File size exceeds 10MB limit.'], 400);
}

$ext = $allowedMimes[$mimeType];
$fileName = 'kyc_' . time() . '_' . substr(md5(random_bytes(8)), 0, 8) . '.' . $ext;

$uploadDir = __DIR__ . '/../../uploads/kyc/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$destination = $uploadDir . $fileName;
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    jsonResponse(['success' => false, 'error' => 'Failed to save document.'], 500);
}

$publicUrl = '/uploads/kyc/' . $fileName;

jsonResponse([
    'success' => true,
    'url' => $publicUrl,
    'fileName' => $fileName,
]);
