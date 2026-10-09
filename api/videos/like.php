<?php
/**
 * FaceTube - Like Video API
 * POST /api/videos/like.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$input = getRequestPayload();
$videoId = trim($input['videoId'] ?? ($input['video_id'] ?? ''));
$userId = trim($input['userId'] ?? ($input['user_id'] ?? ''));

if (empty($videoId)) {
    jsonResponse(['success' => false, 'error' => 'Video ID is required.'], 400);
}

$pdo = getDatabaseConnection();

try {
    // Check if like exists
    $stmtCheck = $pdo->prepare('SELECT id FROM video_likes WHERE video_id = ? AND user_id = ? LIMIT 1');
    $stmtCheck->execute([$videoId, $userId]);
    $liked = (bool)$stmtCheck->fetch();

    if ($liked) {
        $pdo->prepare('DELETE FROM video_likes WHERE video_id = ? AND user_id = ?')->execute([$videoId, $userId]);
        $pdo->prepare('UPDATE uploaded_videos SET likes = GREATEST(0, likes - 1) WHERE id = ?')->execute([$videoId]);
        $newLiked = false;
    } else {
        $pdo->prepare('INSERT INTO video_likes (video_id, user_id, created_at) VALUES (?, ?, NOW())')->execute([$videoId, $userId]);
        $pdo->prepare('UPDATE uploaded_videos SET likes = likes + 1 WHERE id = ?')->execute([$videoId]);
        $newLiked = true;
    }

    $stmtLikes = $pdo->prepare('SELECT likes FROM uploaded_videos WHERE id = ? LIMIT 1');
    $stmtLikes->execute([$videoId]);
    $row = $stmtLikes->fetch();
    $likes = intval($row['likes'] ?? 0);

    jsonResponse(['success' => true, 'liked' => $newLiked, 'likes' => $likes]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
