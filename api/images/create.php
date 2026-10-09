<?php
/**
 * FaceTube - Create Uploaded Image Record API
 * POST /api/images/create.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$input = getRequestPayload();
$id = trim($input['id'] ?? ('img_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(6)), 0, 5)));
$userId = trim($input['user_id'] ?? ($input['userId'] ?? ''));
$creatorName = trim($input['creator_name'] ?? ($input['creatorName'] ?? 'Creator'));
$title = trim($input['title'] ?? 'Uploaded Image');
$description = trim($input['description'] ?? '');
$imageUrl = trim($input['image_url'] ?? ($input['imageUrl'] ?? ''));
$thumbnailUrl = trim($input['thumbnail_url'] ?? ($input['thumbnailUrl'] ?? $imageUrl));
$category = trim($input['category'] ?? 'General');

if (empty($imageUrl)) {
    jsonResponse(['success' => false, 'error' => 'Image URL is required.'], 400);
}

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->prepare('
        INSERT INTO uploaded_images (id, user_id, creator_name, title, description, image_url, thumbnail_url, category, views, likes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NOW())
    ');
    $stmt->execute([$id, $userId, $creatorName, $title, $description, $imageUrl, $thumbnailUrl, $category]);

    jsonResponse([
        'success' => true,
        'image' => [
            'id' => $id,
            'userId' => $userId,
            'creatorName' => $creatorName,
            'title' => $title,
            'description' => $description,
            'imageUrl' => $imageUrl,
            'thumbnailUrl' => $thumbnailUrl,
            'category' => $category,
            'createdAt' => date('c'),
        ]
    ], 201);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
