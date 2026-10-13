<?php
/**
 * FaceTube - Image Upload API
 * POST /api/uploads/image.php
 */

require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

// Support direct file upload or multipart
$uploadDir = __DIR__ . '/../../uploads/images/';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $tmpName = $_FILES['image']['tmp_name'];
    $origName = basename($_FILES['image']['name']);
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    $allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
    if (!in_array($ext, $allowedExts, true)) {
        jsonResponse([
            'success' => false,
            'error' => 'Unsupported image format ".' . htmlspecialchars($ext) . '". Supported formats are JPG, JPEG, PNG, WEBP.'
        ], 400);
    }

    if ($_FILES['image']['size'] > 25 * 1024 * 1024) {
        jsonResponse([
            'success' => false,
            'error' => 'Image file size exceeds maximum permitted limit (25MB).'
        ], 400);
    }

    $fileName = 'img_' . time() . '_' . substr(md5(random_bytes(6)), 0, 6) . '.' . ($ext ?: 'jpg');
    $target = $uploadDir . $fileName;

    if (@move_uploaded_file($tmpName, $target)) {
        jsonResponse([
            'success' => true,
            'url' => '/uploads/images/' . $fileName,
            'fileName' => $fileName,
            'format' => $ext,
            'fileSize' => round($_FILES['image']['size'] / (1024 * 1024), 2) . ' MB'
        ], 201);
    } else {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to write uploaded image to server storage.'
        ], 500);
    }
}

jsonResponse([
    'success' => false,
    'error' => 'No image file uploaded. Field "image" is required (JPG, JPEG, PNG, or WEBP).'
], 400);
