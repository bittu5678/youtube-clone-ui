<?php
/**
 * FaceTube - Live Chat Messages API
 * GET /api/live/chat.php?stream_id=xyz
 * POST /api/live/chat.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $streamId = trim($_GET['stream_id'] ?? ($_GET['streamId'] ?? ''));
    if (empty($streamId)) {
        jsonResponse(['success' => false, 'error' => 'stream_id parameter is required'], 400);
    }

    try {
        $stmt = $pdo->prepare('
            SELECT id, stream_id, user_id, user_name, avatar_url, message, is_superchat, superchat_amount, created_at
            FROM live_chat_messages
            WHERE stream_id = ?
            ORDER BY created_at ASC
            LIMIT 200
        ');
        $stmt->execute([$streamId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse([
            'success' => true,
            'stream_id' => $streamId,
            'messages' => $messages,
        ]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

if ($method === 'POST') {
    $authUser = getAuthUser($pdo);
    $input = getRequestPayload();

    $streamId = trim($input['stream_id'] ?? ($input['streamId'] ?? ''));
    $message = trim($input['message'] ?? '');
    $isSuperchat = !empty($input['is_superchat']);
    $superchatAmount = floatval($input['superchat_amount'] ?? 0.0);

    if (empty($streamId) || empty($message)) {
        jsonResponse(['success' => false, 'error' => 'Stream ID and message are required'], 400);
    }

    $userId = $authUser['user_id'] ?? ('GUEST_' . substr(md5(session_id() . microtime()), 0, 6));
    $userName = $authUser['name'] ?? trim($input['user_name'] ?? 'Viewer');
    $avatarUrl = $authUser['avatar_url'] ?? null;
    $msgId = 'chat_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(4)), 0, 4);

    try {
        $stmt = $pdo->prepare('
            INSERT INTO live_chat_messages (id, stream_id, user_id, user_name, avatar_url, message, is_superchat, superchat_amount, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $msgId,
            $streamId,
            $userId,
            $userName,
            $avatarUrl,
            $message,
            $isSuperchat ? 1 : 0,
            $superchatAmount,
        ]);

        jsonResponse([
            'success' => true,
            'message' => [
                'id' => $msgId,
                'stream_id' => $streamId,
                'user_id' => $userId,
                'user_name' => $userName,
                'avatar_url' => $avatarUrl,
                'message' => $message,
                'is_superchat' => $isSuperchat,
                'superchat_amount' => $superchatAmount,
                'created_at' => date('c'),
            ]
        ], 201);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Failed to save chat: ' . $e->getMessage()], 500);
    }
}

jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
