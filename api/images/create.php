<?php
/**
 * FaceTube - Create Uploaded Image API
 * POST /api/images/create.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$id = trim($input['id'] ?? ('img-' . round(microtime(true) * 1000) . '-' . random_int(1000, 9999)));
$userId = trim($input['userId'] ?? ($input['user_id'] ?? ''));
$creatorName = trim($input['creatorName'] ?? ($input['creator_name'] ?? 'Creator'));
$title = trim($input['title'] ?? '');
$description = trim($input['description'] ?? '');
$imageUrl = trim($input['imageUrl'] ?? ($input['image_url'] ?? ''));
$format = strtolower(trim($input['format'] ?? 'png'));
$fileSize = trim($input['fileSize'] ?? ($input['file_size'] ?? '1.2 MB'));
$category = trim($input['category'] ?? 'Entertainment');

if (empty($userId)) {
    jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
}
if (empty($title)) {
    jsonResponse(['success' => false, 'error' => 'Image title is required.'], 400);
}
if (empty($imageUrl)) {
    jsonResponse(['success' => false, 'error' => 'Image URL is required.'], 400);
}

if (!in_array($format, ['jpg', 'jpeg', 'png', 'webp'], true)) {
    $format = 'png';
}

$stmt = $pdo->prepare('
    INSERT INTO uploaded_images (id, user_id, creator_name, title, description, image_url, format, file_size, category, views, likes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())
');
$stmt->execute([$id, $userId, $creatorName, $title, $description, $imageUrl, $format, $fileSize, $category]);

$created = [
    'id' => $id,
    'userId' => $userId,
    'creatorName' => $creatorName,
    'title' => $title,
    'description' => $description,
    'imageUrl' => $imageUrl,
    'format' => $format,
    'fileSize' => $fileSize,
    'category' => $category,
    'views' => 0,
    'likes' => 0,
    'createdAt' => date('c'),
];

jsonResponse(['success' => true, 'image' => $created], 201);
