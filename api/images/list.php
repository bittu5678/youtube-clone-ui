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

$sql = "
    SELECT id, user_id, creator_name, title, description, image_url, format, file_size, category, views, likes, created_at, updated_at
    FROM uploaded_images
    {$whereSql}
    ORDER BY created_at DESC
    LIMIT {$limit}
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$images = array_map(function ($r) {
    return [
        'id' => $r['id'],
        'userId' => $r['user_id'],
        'creatorName' => $r['creator_name'],
        'title' => $r['title'],
        'description' => $r['description'] ?? '',
        'imageUrl' => $r['image_url'],
        'format' => $r['format'],
        'fileSize' => $r['file_size'] ?? '1.0 MB',
        'category' => $r['category'] ?? 'Entertainment',
        'views' => (int)$r['views'],
        'likes' => (int)$r['likes'],
        'createdAt' => $r['created_at'],
    ];
}, $rows);

jsonResponse(['success' => true, 'images' => $images, 'total' => count($images)]);
