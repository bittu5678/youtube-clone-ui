<?php
/**
 * FaceTube - Live Streams API
 * GET /api/live/streams.php - List all live and upcoming streams
 * POST /api/live/streams.php - Create or update a live stream broadcast
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query('
            SELECT s.*, u.name as streamer_name, u.avatar_url, u.channel_logo_url
            FROM live_streams s
            LEFT JOIN users u ON s.user_id = u.user_id
            WHERE s.status IN ("live", "upcoming")
            ORDER BY (s.status = "live") DESC, s.viewers_count DESC, s.created_at DESC
        ');
        $streams = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse([
            'success' => true,
            'streams' => $streams,
        ]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

if ($method === 'POST') {
    $authUser = getAuthUser($pdo);
    if (!$authUser) {
        jsonResponse(['success' => false, 'error' => 'Authentication required to start a live stream'], 401);
    }

    $input = getRequestPayload();
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $category = trim($input['category'] ?? 'Coding & Tech');
    $thumbnailUrl = trim($input['thumbnail_url'] ?? ($input['thumbnailUrl'] ?? ''));

    if (empty($title)) {
        jsonResponse(['success' => false, 'error' => 'Stream title is required'], 400);
    }

    $streamId = 'live_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(4)), 0, 4);
    $streamKey = 'sk_live_' . bin2hex(random_bytes(16));
    $playbackUrl = 'https://live.facetube.online/hls/' . $streamId . '/index.m3u8';

    try {
        $stmt = $pdo->prepare('
            INSERT INTO live_streams (id, user_id, title, description, category, stream_key, playback_url, thumbnail_url, status, viewers_count, started_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, "live", 1, NOW(), NOW())
        ');
        $stmt->execute([
            $streamId,
            $authUser['user_id'],
            $title,
            $description,
            $category,
            $streamKey,
            $playbackUrl,
            $thumbnailUrl ?: null
        ]);

        jsonResponse([
            'success' => true,
            'message' => 'Live stream created successfully',
            'stream' => [
                'id' => $streamId,
                'user_id' => $authUser['user_id'],
                'title' => $title,
                'stream_key' => $streamKey,
                'playback_url' => $playbackUrl,
                'status' => 'live',
            ]
        ], 201);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Failed to create stream: ' . $e->getMessage()], 500);
    }
}

jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
