<?php
/**
 * FaceTube - Get Single Video API
 * GET /api/videos/get.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$id = trim($_GET['id'] ?? '');

if (empty($id)) {
    jsonResponse(['success' => false, 'error' => 'Video ID is required.'], 400);
}

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->prepare('SELECT * FROM uploaded_videos WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonResponse(['success' => false, 'error' => 'Video not found.'], 404);
    }

    // Increment views counter
    $pdo->prepare('UPDATE uploaded_videos SET views = views + 1 WHERE id = ?')->execute([$id]);

    $expiryTime = !empty($row['promotion_expires_at']) ? strtotime($row['promotion_expires_at']) : false;
    $isActivePromoted = !empty($row['is_promoted']) && $expiryTime !== false && $expiryTime > time();

    $video = [
        'id' => $row['id'],
        'userId' => $row['user_id'],
        'user_id' => $row['user_id'],
        'creatorName' => $row['creator_name'],
        'creator_name' => $row['creator_name'],
        'title' => $row['title'],
        'description' => $row['description'] ?? '',
        'videoUrl' => toAbsoluteMediaUrl($row['video_url'], 'videos'),
        'video_url' => toAbsoluteMediaUrl($row['video_url'], 'videos'),
        'thumbnailUrl' => toAbsoluteMediaUrl($row['thumbnail_url'] ?? '', 'images'),
        'thumbnail_url' => toAbsoluteMediaUrl($row['thumbnail_url'] ?? '', 'images'),
        'videoType' => $row['video_type'],
        'video_type' => $row['video_type'],
        'contentType' => $row['content_type'],
        'content_type' => $row['content_type'],
        'category' => $row['category'] ?? 'General',
        'duration' => $row['duration'] ?? '0:00',
        'views' => (int)$row['views'] + 1,
        'likes' => (int)$row['likes'],
        'paymentStatus' => $row['payment_status'],
        'payment_status' => $row['payment_status'],
        'paymentId' => $row['payment_id'],
        'payment_id' => $row['payment_id'],
        'paymentAmount' => (float)$row['payment_amount'],
        'payment_amount' => (float)$row['payment_amount'],
        'isPromoted' => (bool)$isActivePromoted,
        'is_promoted' => (bool)$isActivePromoted,
        'isActivePromoted' => (bool)$isActivePromoted,
        'is_active_promoted' => (bool)$isActivePromoted,
        'rawIsPromoted' => (bool)$row['is_promoted'],
        'raw_is_promoted' => (bool)$row['is_promoted'],
        'promotionPlan' => $row['promotion_plan'],
        'promotionExpiresAt' => $row['promotion_expires_at'],
        'createdAt' => $row['created_at'],
        'created_at' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
        'updated_at' => $row['updated_at'],
    ];

    jsonResponse(['success' => true, 'video' => $video]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
