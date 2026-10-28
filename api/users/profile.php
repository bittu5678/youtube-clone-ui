<?php
/**
 * FaceTube - User Profile API
 * GET/POST /api/users/profile.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $raw = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ($_GET['identifier'] ?? '')));
    if (empty($raw)) {
        $authUser = getAuthUser($pdo);
        if ($authUser) {
            jsonResponse(['success' => true, 'profile' => $authUser]);
        }
        jsonResponse(['success' => false, 'error' => 'User identifier required.'], 400);
    }

    try {
        $stmt = $pdo->prepare('
            SELECT id, user_id, name, mobile, email, role, referral_code, avatar_url, channel_logo_url, channel_name, created_at
            FROM users
            WHERE UPPER(user_id) = UPPER(?) OR LOWER(email) = LOWER(?) OR id = ?
            LIMIT 1
        ');
        $stmt->execute([$raw, $raw, $raw]);
        $profile = $stmt->fetch();

        if (!$profile) {
            jsonResponse(['success' => false, 'error' => 'Profile not found.'], 404);
        }

        jsonResponse(['success' => true, 'profile' => $profile]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $authUser = getAuthUser($pdo);
    $input = getRequestPayload();

    $userId = $authUser ? $authUser['id'] : trim($input['userId'] ?? ($input['id'] ?? ''));

    if (empty($userId)) {
        jsonResponse(['success' => false, 'error' => 'Unauthorized or missing user identifier.'], 401);
    }

    $updates = [];
    $params = [];

    if (isset($input['name']) && strlen(trim($input['name'])) >= 2) {
        $updates[] = 'name = ?';
        $params[] = trim($input['name']);
    }

    if (isset($input['mobile']) && strlen(trim($input['mobile'])) >= 7) {
        $updates[] = 'mobile = ?';
        $params[] = trim($input['mobile']);
    }

    if (isset($input['channel_logo_url'])) {
        $updates[] = 'channel_logo_url = ?';
        $params[] = trim($input['channel_logo_url']);
    }

    if (isset($input['channel_name'])) {
        $updates[] = 'channel_name = ?';
        $params[] = trim($input['channel_name']);
    }

    if (isset($input['avatar_url'])) {
        $updates[] = 'avatar_url = ?';
        $params[] = trim($input['avatar_url']);
    }

    if (empty($updates)) {
        jsonResponse(['success' => false, 'error' => 'No valid fields provided to update.'], 400);
    }

    $params[] = $userId;
    $params[] = $userId;

    try {
        $sql = 'UPDATE users SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ? OR UPPER(user_id) = UPPER(?)';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmtGet = $pdo->prepare('
            SELECT id, user_id, name, mobile, email, role, referral_code, avatar_url, created_at
            FROM users
            WHERE id = ? OR UPPER(user_id) = UPPER(?)
            LIMIT 1
        ');
        $stmtGet->execute([$userId, $userId]);
        $updatedProfile = $stmtGet->fetch();

        jsonResponse([
            'success' => true,
            'profile' => $updatedProfile,
            'message' => 'Profile updated successfully.'
        ]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database update failed: ' . $e->getMessage()], 500);
    }
} else {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}
