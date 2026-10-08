<?php
/**
 * FaceTube - Video Upload API
 * POST /api/uploads/video.php
 */

require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

if (!isset($_FILES['video']) && !isset($_FILES['file'])) {
    jsonResponse(['success' => false, 'error' => 'No video file uploaded.'], 400);
}

$file = $_FILES['video'] ?? $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'error' => 'Upload error code: ' . $file['error']], 400);
}

$allowedMimes = [
    'video/mp4'       => 'mp4',
    'video/webm'      => 'webm',
    'video/quicktime' => 'mov',
    'video/x-matroska'=> 'mkv',
];

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!isset($allowedMimes[$mimeType])) {
    jsonResponse(['success' => false, 'error' => 'Invalid video format. Supported formats: MP4, WebM, MOV, MKV.'], 400);
}

$maxSize = 500 * 1024 * 1024; // 500MB
if ($file['size'] > $maxSize) {
    jsonResponse(['success' => false, 'error' => 'Video size exceeds 500MB maximum limit.'], 400);
}

$ext = $allowedMimes[$mimeType];
$fileName = 'vid_' . time() . '_' . substr(md5(random_bytes(8)), 0, 8) . '.' . $ext;

$uploadDir = __DIR__ . '/../../uploads/videos/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$destination = $uploadDir . $fileName;
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    jsonResponse(['success' => false, 'error' => 'Failed to save video.'], 500);
}

$publicUrl = '/uploads/videos/' . $fileName;

jsonResponse([
    'success' => true,
    'url' => $publicUrl,
    'fileName' => $fileName,
    'format' => $ext,
]);
