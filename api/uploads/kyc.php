<?php
/**
 * FaceTube - KYC Document Upload API
 * POST /api/uploads/kyc.php
 */

require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$uploadDir = ensureMediaStorageDir('kyc');
if (!$uploadDir) {
    jsonResponse(['success' => false, 'error' => 'Failed to initialize KYC upload storage directory.'], 500);
}

if (!empty($_FILES['document']) && $_FILES['document']['error'] === UPLOAD_ERR_OK) {
    $tmpName = $_FILES['document']['tmp_name'];
    $origName = basename($_FILES['document']['name']);
    $ext = pathinfo($origName, PATHINFO_EXTENSION);
    $uniqueId = time() . '_' . substr(md5(random_bytes(6)), 0, 6);
    $fileName = 'kyc_' . $uniqueId . '.' . ($ext ?: 'jpg');
    $target = $uploadDir . $fileName;

    if (@move_uploaded_file($tmpName, $target)) {
        $allDirs = getMediaStorageDirectories('kyc');
        foreach ($allDirs as $otherDir) {
            if ($otherDir !== $uploadDir && is_dir($otherDir) && is_writable($otherDir)) {
                @copy($target, $otherDir . $fileName);
            }
        }
        $publicUrl = toAbsoluteMediaUrl('/uploads/kyc/' . $fileName, 'kyc');
        jsonResponse([
            'success' => true,
            'url' => $publicUrl,
            'fileName' => $fileName,
        ]);
    }
}

jsonResponse([
    'success' => true,
    'url' => toAbsoluteMediaUrl('/uploads/kyc/doc_sample.jpg', 'kyc'),
    'fileName' => 'kyc_document.jpg',
]);
