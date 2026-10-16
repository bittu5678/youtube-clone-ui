<?php
/**
 * FaceTube - Production Video Upload API
 * POST /api/uploads/video.php
 */

require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed. Use POST to upload video files.'], 405);
}

// Ensure destination storage directory exists and is writable in the public web root
$uploadDir = ensureMediaStorageDir('videos');
if (!$uploadDir) {
    jsonResponse([
        'success' => false,
        'error' => 'Failed to initialize video upload storage directory. Please verify write permissions on uploads/videos/ on Hostinger.'
    ], 500);
}

if (empty($_FILES['video'])) {
    jsonResponse([
        'success' => false,
        'error' => 'No video file was sent in the request. Please attach a video file with field name "video".'
    ], 400);
}

$file = $_FILES['video'];

// Handle PHP upload error codes
if ($file['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
        UPLOAD_ERR_FORM_SIZE  => 'The uploaded file exceeds the MAX_FILE_SIZE directive in the HTML form.',
        UPLOAD_ERR_PARTIAL    => 'The uploaded file was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder on the server.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload.',
    ];
    $errMsg = $uploadErrors[$file['error']] ?? 'Unknown error occurred during file upload.';
    jsonResponse(['success' => false, 'error' => $errMsg], 400);
}

$fileSize = $file['size'];
$maxSizeBytes = 250 * 1024 * 1024; // 250 MB
if ($fileSize <= 0) {
    jsonResponse(['success' => false, 'error' => 'The uploaded video file is empty (0 bytes).'], 400);
}
if ($fileSize > $maxSizeBytes) {
    jsonResponse([
        'success' => false,
        'error' => 'Video file size exceeds maximum permitted limit (250MB). Please compress or trim the video.'
    ], 400);
}

// Validate file extension
$origName = basename($file['name']);
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
$allowedExts = ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv'];

if (!in_array($ext, $allowedExts, true)) {
    jsonResponse([
        'success' => false,
        'error' => 'Unsupported video format "' . htmlspecialchars($ext) . '". Supported formats are MP4, WebM, OGG, MOV, M4V.'
    ], 400);
}

// Validate MIME type using finfo if available
$tmpName = $file['tmp_name'];
$mime = '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $tmpName);
    finfo_close($finfo);
} elseif (!empty($file['type'])) {
    $mime = $file['type'];
}

$allowedMimes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-m4v',
    'video/x-matroska',
    'application/octet-stream', // fallback for some browsers
];

if (!empty($mime) && !in_array($mime, $allowedMimes, true)) {
    jsonResponse([
        'success' => false,
        'error' => 'Invalid video MIME type ("' . htmlspecialchars($mime) . '"). Only authentic video files are accepted.'
    ], 400);
}

// Generate unique, non-guessable production filename
$safeBaseName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
$safeBaseName = substr($safeBaseName, 0, 30);
$uniqueId = time() . '_' . bin2hex(random_bytes(6));
$counter = 0;
$candidateName = 'vid_' . $uniqueId . '.' . $ext;
while (file_exists($uploadDir . $candidateName)) {
    $counter++;
    $candidateName = 'vid_' . $uniqueId . '_' . $counter . '.' . $ext;
}
$fileName = $candidateName;
$target = $uploadDir . $fileName;

if (!@move_uploaded_file($tmpName, $target)) {
    jsonResponse([
        'success' => false,
        'error' => 'Failed to save uploaded video to storage. Please check disk space and file write permissions.'
    ], 500);
}

// Sync to secondary storage directories (e.g. root uploads/) so both docroots stay consistent
$allDirs = getMediaStorageDirectories('videos');
foreach ($allDirs as $otherDir) {
    if ($otherDir !== $uploadDir && is_dir($otherDir) && is_writable($otherDir)) {
        @copy($target, $otherDir . $fileName);
    }
}

$fileSizeMb = round($fileSize / (1024 * 1024), 2) . ' MB';
$publicUrl = toAbsoluteMediaUrl('/uploads/videos/' . $fileName, 'videos');

jsonResponse([
    'success' => true,
    'url' => $publicUrl,
    'fileName' => $fileName,
    'format' => $ext,
    'fileSize' => $fileSizeMb,
    'sizeBytes' => $fileSize,
    'uploadedAt' => date('c'),
], 201);
