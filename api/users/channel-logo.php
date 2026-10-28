<?php
/**
 * FaceTube - Update Channel Logo & Details API
 * POST /api/users/channel-logo.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$authUser = getAuthUser($pdo);

if (!$authUser) {
    jsonResponse(['success' => false, 'error' => 'Authentication required'], 401);
}

$input = getRequestPayload();
$channelLogoUrl = trim($input['channel_logo_url'] ?? ($input['channelLogoUrl'] ?? ''));
$channelName = trim($input['channel_name'] ?? ($input['channelName'] ?? ''));

if (empty($channelLogoUrl) && empty($channelName)) {
    jsonResponse(['success' => false, 'error' => 'No channel updates provided'], 400);
}

try {
    $updates = [];
    $params = [];

    if (!empty($channelLogoUrl)) {
        $updates[] = '`channel_logo_url` = ?';
        $params[] = $channelLogoUrl;
    }

    if (!empty($channelName)) {
        $updates[] = '`channel_name` = ?';
        $params[] = $channelName;
    }

    $updates[] = '`updated_at` = NOW()';
    $params[] = $authUser['id'];

    $sql = 'UPDATE `users` SET ' . implode(', ', $updates) . ' WHERE `id` = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    jsonResponse([
        'success' => true,
        'message' => 'Channel details updated successfully',
        'channel_logo_url' => $channelLogoUrl ?: ($authUser['channel_logo_url'] ?? null),
        'channel_name' => $channelName ?: ($authUser['channel_name'] ?? null),
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
