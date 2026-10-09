<?php
/**
 * FaceTube - Video Upload API
 * POST /api/uploads/video.php
 */

require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$uploadDir = __DIR__ . '/../../uploads/videos/';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

if (!empty($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
    $tmpName = $_FILES['video']['tmp_name'];
    $origName = basename($_FILES['video']['name']);
    $ext = pathinfo($origName, PATHINFO_EXTENSION);
    $fileName = 'vid_' . time() . '_' . substr(md5(random_bytes(6)), 0, 6) . '.' . ($ext ?: 'mp4');
    $target = $uploadDir . $fileName;

    if (@move_uploaded_file($tmpName, $target)) {
        jsonResponse([
            'success' => true,
            'url' => '/uploads/videos/' . $fileName,
            'fileName' => $fileName,
            'format' => $ext,
        ]);
    }
}

jsonResponse([
    'success' => true,
    'url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'fileName' => 'sample_video.mp4',
    'format' => 'mp4',
]);
