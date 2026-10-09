<?php
/**
 * FaceTube - Create Uploaded Video API
 * POST /api/videos/create.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$id = trim($input['id'] ?? ('vid_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(6)), 0, 6)));
$userId = trim($input['user_id'] ?? ($input['userId'] ?? ''));
$creatorName = trim($input['creator_name'] ?? ($input['creatorName'] ?? 'Creator'));
$title = trim($input['title'] ?? '');
$description = trim($input['description'] ?? '');
$videoUrl = trim($input['video_url'] ?? ($input['videoUrl'] ?? ''));
$thumbnailUrl = trim($input['thumbnail_url'] ?? ($input['thumbnailUrl'] ?? ''));
$videoType = trim($input['video_type'] ?? ($input['videoType'] ?? 'free'));
$contentType = trim($input['content_type'] ?? ($input['contentType'] ?? 'long'));
$category = trim($input['category'] ?? 'General');
$duration = trim($input['duration'] ?? '0:00');
$paymentStatus = trim($input['payment_status'] ?? ($input['paymentStatus'] ?? ($videoType === 'premium' ? 'pending' : 'not_required')));
$paymentId = !empty($input['payment_id']) ? trim($input['payment_id']) : (!empty($input['paymentId']) ? trim($input['paymentId']) : null);
$paymentAmount = floatval($input['payment_amount'] ?? ($input['paymentAmount'] ?? ($videoType === 'premium' ? 6.00 : 0.00)));

if (empty($title)) {
    jsonResponse(['success' => false, 'error' => 'Video title is required.'], 400);
}

if (empty($videoUrl)) {
    jsonResponse(['success' => false, 'error' => 'Video URL or file is required.'], 400);
}

try {
    $stmt = $pdo->prepare('
        INSERT INTO uploaded_videos (
            id, user_id, creator_name, title, description, video_url, thumbnail_url,
            video_type, content_type, category, duration, views, likes,
            payment_status, payment_id, payment_amount, is_promoted,
            created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, 0, 0,
            ?, ?, ?, 0,
            NOW(), NOW()
        )
    ');

    $stmt->execute([
        $id,
        $userId,
        $creatorName,
        $title,
        $description,
        $videoUrl,
        $thumbnailUrl,
        $videoType,
        $contentType,
        $category,
        $duration,
        $paymentStatus,
        $paymentId,
        $paymentAmount
    ]);

    jsonResponse([
        'success' => true,
        'video' => [
            'id' => $id,
            'userId' => $userId,
            'user_id' => $userId,
            'creatorName' => $creatorName,
            'creator_name' => $creatorName,
            'title' => $title,
            'description' => $description,
            'videoUrl' => $videoUrl,
            'video_url' => $videoUrl,
            'thumbnailUrl' => $thumbnailUrl,
            'thumbnail_url' => $thumbnailUrl,
            'videoType' => $videoType,
            'video_type' => $videoType,
            'contentType' => $contentType,
            'content_type' => $contentType,
            'category' => $category,
            'duration' => $duration,
            'paymentStatus' => $paymentStatus,
            'payment_status' => $paymentStatus,
            'paymentId' => $paymentId,
            'paymentAmount' => $paymentAmount,
            'isPromoted' => false,
            'created_at' => date('c'),
        ]
    ], 201);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database insert error: ' . $e->getMessage()], 500);
}
