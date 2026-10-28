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
$uploadDir = ensureMediaStorageDir('images');
if (!$uploadDir) {
    jsonResponse([
        'success' => false,
        'error' => 'Failed to initialize image upload storage directory on Hostinger.'
    ], 500);
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

    // Enforce 9:16 aspect ratio for image uploads
    $imageInfo = @getimagesize($tmpName);
    if ($imageInfo) {
        $width = $imageInfo[0];
        $height = $imageInfo[1];
        if ($width > 0 && $height > 0) {
            $ratio = $width / $height;
            $targetRatio = 9 / 16; // 0.5625
            if (abs($ratio - $targetRatio) > 0.08) {
                jsonResponse([
                    'success' => false,
                    'error' => "Image must strictly be in 9:16 vertical aspect ratio (e.g. 1080x1920). Current dimensions: {$width}x{$height}."
                ], 400);
            }
        }
    }

    $uniqueId = time() . '_' . substr(md5(random_bytes(6)), 0, 6);
    $counter = 0;
    $candidateName = 'img_' . $uniqueId . '.' . ($ext ?: 'jpg');
    while (file_exists($uploadDir . $candidateName)) {
        $counter++;
        $candidateName = 'img_' . $uniqueId . '_' . $counter . '.' . ($ext ?: 'jpg');
    }
    $fileName = $candidateName;
    $target = $uploadDir . $fileName;

    if (@move_uploaded_file($tmpName, $target)) {
        // Sync to secondary storage directories (e.g. root uploads/)
        $allDirs = getMediaStorageDirectories('images');
        foreach ($allDirs as $otherDir) {
            if ($otherDir !== $uploadDir && is_dir($otherDir) && is_writable($otherDir)) {
                @copy($target, $otherDir . $fileName);
            }
        }

        $publicUrl = toAbsoluteMediaUrl('/uploads/images/' . $fileName, 'images');

        jsonResponse([
            'success' => true,
            'url' => $publicUrl,
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
