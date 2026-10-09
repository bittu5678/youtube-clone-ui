<?php
/**
 * FaceTube - List Video Comments API
 * GET /api/comments/list.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$videoId = trim($_GET['videoId'] ?? ($_GET['video_id'] ?? ''));

if (empty($videoId)) {
    jsonResponse(['success' => false, 'error' => 'Video ID is required.'], 400);
}

try {
    $stmt = $pdo->prepare('
        SELECT id, video_id, user_id, user_name, avatar_url, comment, created_at
        FROM video_comments
        WHERE video_id = ?
        ORDER BY created_at DESC
        LIMIT 100
    ');
    $stmt->execute([$videoId]);
    $rows = $stmt->fetchAll();

    $comments = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'videoId' => $r['video_id'],
            'video_id' => $r['video_id'],
            'userId' => $r['user_id'],
            'user_id' => $r['user_id'],
            'userName' => $r['user_name'],
            'user_name' => $r['user_name'],
            'avatarUrl' => $r['avatar_url'] ?? '',
            'avatar_url' => $r['avatar_url'] ?? '',
            'comment' => $r['comment'],
            'createdAt' => $r['created_at'],
            'created_at' => $r['created_at'],
        ];
    }, $rows);

    jsonResponse(['success' => true, 'comments' => $comments, 'total' => count($comments)]);
} catch (PDOException $e) {
    // If table doesn't exist yet, return empty list gracefully
    jsonResponse(['success' => true, 'comments' => [], 'total' => 0]);
}
