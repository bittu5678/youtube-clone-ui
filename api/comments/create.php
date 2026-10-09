<?php
/**
 * FaceTube - Create Video Comment API
 * POST /api/comments/create.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$input = getRequestPayload();
$videoId = trim($input['videoId'] ?? ($input['video_id'] ?? ''));
$userId = trim($input['userId'] ?? ($input['user_id'] ?? ''));
$userName = trim($input['userName'] ?? ($input['user_name'] ?? 'FaceTube Viewer'));
$avatarUrl = trim($input['avatarUrl'] ?? ($input['avatar_url'] ?? ''));
$comment = trim($input['comment'] ?? '');

if (empty($videoId) || empty($comment)) {
    jsonResponse(['success' => false, 'error' => 'Video ID and comment text are required.'], 400);
}

$id = 'cmt_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(6)), 0, 5);
$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->prepare('
        INSERT INTO video_comments (id, video_id, user_id, user_name, avatar_url, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ');
    $stmt->execute([$id, $videoId, $userId, $userName, $avatarUrl, $comment]);

    jsonResponse([
        'success' => true,
        'comment' => [
            'id' => $id,
            'videoId' => $videoId,
            'userId' => $userId,
            'userName' => $userName,
            'avatarUrl' => $avatarUrl,
            'comment' => $comment,
            'createdAt' => date('c'),
        ]
    ], 201);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
