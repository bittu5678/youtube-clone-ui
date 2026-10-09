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

$input = getRequestPayload();
$targetUserId = trim($input['targetUserId'] ?? ($input['target_user_id'] ?? ''));
$role = trim($input['role'] ?? 'user');

if (empty($targetUserId)) {
    jsonResponse(['success' => false, 'error' => 'Target user ID is required.'], 400);
}

if (!in_array($role, ['admin', 'user'], true)) {
    jsonResponse(['success' => false, 'error' => 'Role must be admin or user.'], 400);
}

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->prepare('UPDATE users SET role = ?, updated_at = NOW() WHERE UPPER(user_id) = UPPER(?) OR id = ?');
    $stmt->execute([$role, $targetUserId, $targetUserId]);

    jsonResponse(['success' => true, 'message' => "User role updated to {$role} successfully."]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
