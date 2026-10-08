<?php
/**
 * FaceTube - Update User Role API (Admin Only)
 * POST /api/admin/role.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$adminUser = requireAdminUser($pdo);
$input = getRequestPayload();

$targetUserId = trim($input['targetUserId'] ?? ($input['user_id'] ?? ''));
$newRole = trim($input['role'] ?? 'user');

if (!in_array($newRole, ['admin', 'user'], true)) {
    jsonResponse(['success' => false, 'error' => 'Invalid role specified.'], 400);
}

$stmt = $pdo->prepare('
    UPDATE users
    SET role = ?, updated_at = NOW()
    WHERE id = ? OR UPPER(user_id) = UPPER(?)
');
$stmt->execute([$newRole, $targetUserId, $targetUserId]);

jsonResponse([
    'success' => true,
    'message' => "User role updated to {$newRole}.",
    'targetUserId' => $targetUserId,
    'role' => $newRole,
]);
