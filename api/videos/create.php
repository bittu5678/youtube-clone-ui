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
if (empty($userId)) {
    $userId = 'FT483921';
}
$creatorName = trim($input['creator_name'] ?? ($input['creatorName'] ?? 'FaceTube Creator'));
$title = trim($input['title'] ?? '');
$description = trim($input['description'] ?? '');
$videoUrl = trim($input['video_url'] ?? ($input['videoUrl'] ?? ''));
$thumbnailUrl = trim($input['thumbnail_url'] ?? ($input['thumbnailUrl'] ?? ''));
$videoType = strtolower(trim($input['video_type'] ?? ($input['videoType'] ?? 'free')));
if (!in_array($videoType, ['free', 'premium'], true)) {
    $videoType = 'free';
}
$contentType = strtolower(trim($input['content_type'] ?? ($input['contentType'] ?? 'long')));
if (!in_array($contentType, ['short', 'long'], true)) {
    $contentType = 'long';
}
$category = trim($input['category'] ?? 'General');
$duration = trim($input['duration'] ?? '0:00');
$paymentStatus = trim($input['payment_status'] ?? ($input['paymentStatus'] ?? ($videoType === 'premium' ? 'pending' : 'not_required')));
$paymentId = !empty($input['payment_id']) ? trim($input['payment_id']) : (!empty($input['paymentId']) ? trim($input['paymentId']) : null);
$paymentAmount = floatval($input['payment_amount'] ?? ($input['paymentAmount'] ?? ($videoType === 'premium' ? 6.00 : 0.00)));

// If thumbnail is a base64 data URL, persist it to physical disk in uploads/images/
if (!empty($thumbnailUrl) && str_starts_with($thumbnailUrl, 'data:image/')) {
    $imgData = explode(',', $thumbnailUrl, 2);
    if (count($imgData) === 2) {
        $decoded = base64_decode($imgData[1]);
        if ($decoded !== false) {
            $imgUploadDir = __DIR__ . '/../../uploads/images/';
            if (!is_dir($imgUploadDir)) {
                @mkdir($imgUploadDir, 0755, true);
            }
            $imgExt = 'jpg';
            if (str_contains($imgData[0], 'png')) $imgExt = 'png';
            else if (str_contains($imgData[0], 'webp')) $imgExt = 'webp';

            $safeVidId = preg_replace('/[^a-zA-Z0-9_-]/', '_', $id);
            $imgFileName = 'thumb_' . $safeVidId . '.' . $imgExt;
            $imgPath = $imgUploadDir . $imgFileName;
            if (@file_put_contents($imgPath, $decoded)) {
                $thumbnailUrl = '/uploads/images/' . $imgFileName;
            }
        }
    }
}

// Fallback to category cover image if thumbnail is empty or overly long data URI
if (empty($thumbnailUrl) || strlen($thumbnailUrl) > 60000) {
    $categoryThumbnails = [
        'Cartoon' => 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        'Agriculture' => 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
        'Coding' => 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        'Motivational' => 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
        'Comedy' => 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&auto=format&fit=crop&q=80',
        'Entertainment' => 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
        'Finance' => 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=80',
        'Share Market' => 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
        'General' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
    ];
    $thumbnailUrl = $categoryThumbnails[$category] ?? $categoryThumbnails['General'];
}

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
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            video_url = VALUES(video_url),
            thumbnail_url = VALUES(thumbnail_url),
            video_type = VALUES(video_type),
            content_type = VALUES(content_type),
            category = VALUES(category),
            duration = VALUES(duration),
            payment_status = VALUES(payment_status),
            payment_id = VALUES(payment_id),
            payment_amount = VALUES(payment_amount),
            updated_at = NOW()
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
