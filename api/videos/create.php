<?php
/**
 * FaceTube - Create Video Upload API
 * POST /api/videos/create.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$id = trim($input['id'] ?? ('vid-' . round(microtime(true) * 1000) . '-' . random_int(1000, 9999)));
$userId = trim($input['userId'] ?? ($input['user_id'] ?? ''));
$creatorName = trim($input['creatorName'] ?? ($input['creator_name'] ?? 'Creator'));
$title = trim($input['title'] ?? '');
$description = trim($input['description'] ?? '');
$videoUrl = trim($input['videoUrl'] ?? ($input['video_url'] ?? ''));
$thumbnailUrl = trim($input['thumbnailUrl'] ?? ($input['thumbnail_url'] ?? ''));
$videoType = ($input['videoType'] ?? ($input['video_type'] ?? 'free')) === 'premium' ? 'premium' : 'free';
$contentType = ($input['contentType'] ?? ($input['content_type'] ?? 'long')) === 'short' ? 'short' : 'long';
$category = trim($input['category'] ?? 'Entertainment');
$duration = trim($input['duration'] ?? ($contentType === 'short' ? '0:45' : '12:30'));
$paymentStatus = trim($input['paymentStatus'] ?? ($input['payment_status'] ?? ($videoType === 'premium' ? 'pending' : 'not_required')));
$paymentId = trim($input['paymentId'] ?? ($input['payment_id'] ?? ''));
$paymentAmount = (float)($input['paymentAmount'] ?? ($input['payment_amount'] ?? ($videoType === 'premium' ? 6.00 : 0.00)));

if (empty($userId)) {
    jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
}
if (empty($title)) {
    jsonResponse(['success' => false, 'error' => 'Video title is required.'], 400);
}

// Fallback sample URLs if not provided
if (empty($videoUrl)) {
    $videoUrl = $contentType === 'short'
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
}
if (empty($thumbnailUrl)) {
    $thumbnailUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60';
}

$stmt = $pdo->prepare('
    INSERT INTO uploaded_videos (
        id, user_id, creator_name, title, description, video_url, thumbnail_url,
        video_type, content_type, category, duration, views, likes,
        payment_status, payment_id, payment_amount, is_promoted, created_at, updated_at
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 0, 0,
        ?, ?, ?, 0, NOW(), NOW()
    )
    ON DUPLICATE KEY UPDATE
        payment_status = VALUES(payment_status),
        payment_id = VALUES(payment_id),
        payment_amount = VALUES(payment_amount),
        updated_at = NOW()
');

$stmt->execute([
    $id, $userId, $creatorName, $title, $description, $videoUrl, $thumbnailUrl,
    $videoType, $contentType, $category, $duration,
    $paymentStatus, $paymentId ?: null, $paymentAmount
]);

$createdVideo = [
    'id' => $id,
    'userId' => $userId,
    'creatorName' => $creatorName,
    'title' => $title,
    'description' => $description,
    'videoUrl' => $videoUrl,
    'thumbnailUrl' => $thumbnailUrl,
    'videoType' => $videoType,
    'contentType' => $contentType,
    'category' => $category,
    'duration' => $duration,
    'views' => 0,
    'likes' => 0,
    'paymentStatus' => $paymentStatus,
    'paymentId' => $paymentId ?: null,
    'paymentAmount' => $paymentAmount,
    'isPromoted' => false,
    'createdAt' => date('c'),
    'updatedAt' => date('c'),
];

jsonResponse(['success' => true, 'video' => $createdVideo], 201);
