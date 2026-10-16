<?php
/**
 * FaceTube - List Uploaded Images API
 * GET /api/images/list.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$userId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));
$category = trim($_GET['category'] ?? '');
$limit = max(1, min(100, intval($_GET['limit'] ?? 50)));

$where = [];
$params = [];

if (!empty($userId)) {
    $where[] = 'UPPER(user_id) = UPPER(?)';
    $params[] = $userId;
}

if (!empty($category) && $category !== 'All') {
    $where[] = 'category = ?';
    $params[] = $category;
}

$whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

try {
    $sql = "
        SELECT id, user_id, creator_name, title, description, image_url, thumbnail_url, category, views, likes, created_at
        FROM uploaded_images
        {$whereSql}
        ORDER BY created_at DESC
        LIMIT {$limit}
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rawImages = $stmt->fetchAll();
    $images = array_map(function ($img) {
        $img['image_url'] = toAbsoluteMediaUrl($img['image_url'] ?? '', 'images');
        $img['imageUrl'] = $img['image_url'];
        $img['thumbnail_url'] = toAbsoluteMediaUrl($img['thumbnail_url'] ?? '', 'images');
        $img['thumbnailUrl'] = $img['thumbnail_url'];
        return $img;
    }, $rawImages);

    jsonResponse(['success' => true, 'images' => $images, 'total' => count($images)]);
} catch (PDOException $e) {
    jsonResponse(['success' => true, 'images' => [], 'total' => 0]);
}
