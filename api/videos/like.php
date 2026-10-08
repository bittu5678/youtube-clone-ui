<?php
/**
 * FaceTube - Like / Unlike Video API
 * POST /api/videos/like.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$videoId = trim($input['videoId'] ?? ($input['video_id'] ?? ''));
$userId = trim($input['userId'] ?? ($input['user_id'] ?? ''));

if (empty($videoId)) {
    jsonResponse(['success' => false, 'error' => 'Video ID is required.'], 400);
}
if (empty($userId)) {
    jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
}

// Check if already liked
$stmt = $pdo->prepare('SELECT id FROM video_likes WHERE video_id = ? AND user_id = ? LIMIT 1');
$stmt->execute([$videoId, $userId]);
$existing = $stmt->fetch();

if ($existing) {
    // Unlike
    $del = $pdo->prepare('DELETE FROM video_likes WHERE id = ?');
    $del->execute([$existing['id']]);
    $up = $pdo->prepare('UPDATE uploaded_videos SET likes = GREATEST(0, CAST(likes AS SIGNED) - 1) WHERE id = ?');
    $up->execute([$videoId]);
    $liked = false;
} else {
    // Like
    $ins = $pdo->prepare('INSERT INTO video_likes (video_id, user_id, created_at) VALUES (?, ?, NOW())');
    $ins->execute([$videoId, $userId]);
    $up = $pdo->prepare('UPDATE uploaded_videos SET likes = likes + 1 WHERE id = ?');
    $up->execute([$videoId]);
    $liked = true;
}

$countStmt = $pdo->prepare('SELECT likes FROM uploaded_videos WHERE id = ? LIMIT 1');
$countStmt->execute([$videoId]);
$totalLikes = (int)($countStmt->fetchColumn() ?: 0);

jsonResponse(['success' => true, 'liked' => $liked, 'likes' => $totalLikes]);
