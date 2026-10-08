<?php
/**
 * FaceTube - User Profile API
 * GET / POST /api/users/profile.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $targetUserId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ($_GET['id'] ?? '')));

    if (!empty($targetUserId)) {
        $stmt = $pdo->prepare('
            SELECT id, user_id, name, mobile, email, role, referral_code, avatar_url, created_at
            FROM users
            WHERE id = ? OR UPPER(user_id) = UPPER(?) OR LOWER(email) = LOWER(?)
            LIMIT 1
        ');
        $stmt->execute([$targetUserId, $targetUserId, $targetUserId]);
        $user = $stmt->fetch();
    } else {
        $user = getAuthUser($pdo);
    }

    if (!$user) {
        jsonResponse(['success' => false, 'error' => 'User not found.'], 404);
    }

    jsonResponse(['success' => true, 'profile' => $user]);
}

if ($method === 'POST' || $method === 'PUT') {
    $authUser = requireAuthUser($pdo);
    $payload = getRequestPayload();

    $name = trim($payload['name'] ?? ($payload['full_name'] ?? $authUser['name']));
    $mobile = trim($payload['mobile'] ?? $authUser['mobile']);
    $avatarUrl = trim($payload['avatar_url'] ?? ($authUser['avatar_url'] ?? ''));

    $stmt = $pdo->prepare('
        UPDATE users
        SET name = ?, mobile = ?, avatar_url = ?, updated_at = NOW()
        WHERE id = ?
    ');
    $stmt->execute([$name, $mobile, $avatarUrl ?: null, $authUser['id']]);

    $authUser['name'] = $name;
    $authUser['mobile'] = $mobile;
    $authUser['avatar_url'] = $avatarUrl ?: null;

    jsonResponse(['success' => true, 'profile' => $authUser, 'message' => 'Profile updated successfully.']);
}

jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
