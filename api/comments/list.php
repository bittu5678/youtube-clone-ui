<?php
/**
 * FaceTube - List Video Comments API
 * GET /api/comments/list.php?videoId={videoId}
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$videoId = trim($_GET['videoId'] ?? ($_GET['video_id'] ?? ''));

if (empty($videoId)) {
    jsonResponse(['success' => false, 'error' => 'Video ID is required.'], 400);
}

$stmt = $pdo->prepare('
    SELECT id, video_id, user_id, user_name, avatar_url, comment, created_at
    FROM video_comments
    WHERE video_id = ?
    ORDER BY created_at DESC
');
$stmt->execute([$videoId]);
$rows = $stmt->fetchAll();

$comments = array_map(function ($r) {
    return [
        'id' => (string)$r['id'],
        'videoId' => $r['video_id'],
        'userId' => $r['user_id'],
        'userName' => $r['user_name'],
        'avatarUrl' => $r['avatar_url'],
        'comment' => $r['comment'],
        'createdAt' => $r['created_at'],
    ];
}, $rows);

jsonResponse(['success' => true, 'comments' => $comments, 'total' => count($comments)]);
