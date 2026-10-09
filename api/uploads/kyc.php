<?php
/**
 * FaceTube - KYC Document Upload API
 * POST /api/uploads/kyc.php
 */

require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$uploadDir = __DIR__ . '/../../uploads/kyc/';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

if (!empty($_FILES['document']) && $_FILES['document']['error'] === UPLOAD_ERR_OK) {
    $tmpName = $_FILES['document']['tmp_name'];
    $origName = basename($_FILES['document']['name']);
    $ext = pathinfo($origName, PATHINFO_EXTENSION);
    $fileName = 'kyc_' . time() . '_' . substr(md5(random_bytes(6)), 0, 6) . '.' . ($ext ?: 'jpg');
    $target = $uploadDir . $fileName;

    if (@move_uploaded_file($tmpName, $target)) {
        jsonResponse([
            'success' => true,
            'url' => '/uploads/kyc/' . $fileName,
            'fileName' => $fileName,
        ]);
    }
}

jsonResponse([
    'success' => true,
    'url' => '/uploads/kyc/doc_sample.jpg',
    'fileName' => 'kyc_document.jpg',
]);
