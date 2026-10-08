<?php
/**
 * FaceTube - Add Video Comment API
 * POST /api/comments/create.php
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
$userName = trim($input['userName'] ?? ($input['user_name'] ?? 'Viewer'));
$avatarUrl = trim($input['avatarUrl'] ?? ($input['avatar_url'] ?? ''));
$comment = trim($input['comment'] ?? ($input['content'] ?? ''));

if (empty($videoId)) {
    jsonResponse(['success' => false, 'error' => 'Video ID is required.'], 400);
}
if (empty($userId)) {
    jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
}
if (empty($comment)) {
    jsonResponse(['success' => false, 'error' => 'Comment text cannot be empty.'], 400);
}

$stmt = $pdo->prepare('
    INSERT INTO video_comments (video_id, user_id, user_name, avatar_url, comment, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
');
$stmt->execute([$videoId, $userId, $userName, $avatarUrl ?: null, $comment]);
$newId = (string)$pdo->lastInsertId();

$created = [
    'id' => $newId,
    'videoId' => $videoId,
    'userId' => $userId,
    'userName' => $userName,
    'avatarUrl' => $avatarUrl ?: null,
    'comment' => $comment,
    'createdAt' => date('c'),
];

jsonResponse(['success' => true, 'comment' => $created], 201);
