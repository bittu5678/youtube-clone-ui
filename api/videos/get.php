<?php
/**
 * FaceTube - Get Single Video API
 * GET /api/videos/get.php?id={id}
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$id = trim($_GET['id'] ?? ($_GET['videoId'] ?? ''));

if (empty($id)) {
    jsonResponse(['success' => false, 'error' => 'Video ID is required.'], 400);
}

// Increment view count atomically
$upStmt = $pdo->prepare('UPDATE uploaded_videos SET views = views + 1 WHERE id = ?');
$upStmt->execute([$id]);

$stmt = $pdo->prepare('
    SELECT 
        id, user_id, creator_name, title, description, video_url, thumbnail_url,
        video_type, content_type, category, duration, views, likes,
        payment_status, payment_id, payment_amount, is_promoted,
        promotion_plan, promotion_expires_at, created_at, updated_at
    FROM uploaded_videos
    WHERE id = ?
    LIMIT 1
');
$stmt->execute([$id]);
$row = $stmt->fetch();

if (!$row) {
    jsonResponse(['success' => false, 'error' => 'Video not found.'], 404);
}

$video = [
    'id' => $row['id'],
    'userId' => $row['user_id'],
    'user_id' => $row['user_id'],
    'creatorName' => $row['creator_name'],
    'creator_name' => $row['creator_name'],
    'title' => $row['title'],
    'description' => $row['description'] ?? '',
    'videoUrl' => $row['video_url'],
    'video_url' => $row['video_url'],
    'thumbnailUrl' => $row['thumbnail_url'] ?? '',
    'thumbnail_url' => $row['thumbnail_url'] ?? '',
    'videoType' => $row['video_type'],
    'video_type' => $row['video_type'],
    'contentType' => $row['content_type'],
    'content_type' => $row['content_type'],
    'category' => $row['category'] ?? 'General',
    'duration' => $row['duration'] ?? '0:00',
    'views' => (int)$row['views'],
    'likes' => (int)$row['likes'],
    'paymentStatus' => $row['payment_status'],
    'payment_status' => $row['payment_status'],
    'paymentId' => $row['payment_id'],
    'payment_id' => $row['payment_id'],
    'paymentAmount' => (float)$row['payment_amount'],
    'payment_amount' => (float)$row['payment_amount'],
    'isPromoted' => (bool)$row['is_promoted'],
    'is_promoted' => (bool)$row['is_promoted'],
    'promotionPlan' => $row['promotion_plan'],
    'promotionExpiresAt' => $row['promotion_expires_at'],
    'createdAt' => $row['created_at'],
    'created_at' => $row['created_at'],
    'updatedAt' => $row['updated_at'],
    'updated_at' => $row['updated_at'],
];

jsonResponse(['success' => true, 'video' => $video]);
