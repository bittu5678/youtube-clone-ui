<?php
/**
 * FaceTube - Update User Role API
 * POST /api/admin/role.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$authUser = getAuthUser($pdo);

if (!$authUser) {
    jsonResponse(['success' => false, 'error' => 'Authentication required. Please provide a valid Bearer session token.'], 401);
}

if (strtolower($authUser['role'] ?? '') !== 'admin') {
    jsonResponse(['success' => false, 'error' => 'Admin authorization required to modify user roles.'], 403);
}

$input = getRequestPayload();
$targetUserId = trim($input['targetUserId'] ?? ($input['target_user_id'] ?? ($input['userId'] ?? ($input['user_id'] ?? ''))));
$role = trim($input['role'] ?? 'user');

if (empty($targetUserId)) {
    jsonResponse(['success' => false, 'error' => 'Target user ID is required.'], 400);
}

if (!in_array($role, ['admin', 'user'], true)) {
    jsonResponse(['success' => false, 'error' => 'Role must be admin or user.'], 400);
}

try {
    $stmt = $pdo->prepare('UPDATE users SET role = ?, updated_at = NOW() WHERE UPPER(user_id) = UPPER(?) OR id = ?');
    $stmt->execute([$role, $targetUserId, $targetUserId]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'error' => 'User not found or role already set.'], 404);
    }

    jsonResponse(['success' => true, 'message' => "User role updated to {$role} successfully."]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}

