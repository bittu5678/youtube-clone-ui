<?php
/**
 * FaceTube - List Users API
 * GET /api/users/list.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();

$stmt = $pdo->query('
    SELECT id, user_id, name, mobile, email, role, referral_code, avatar_url, created_at
    FROM users
    ORDER BY created_at DESC
');
$users = $stmt->fetchAll();

jsonResponse([
    'success' => true,
    'users' => $users,
    'total' => count($users)
]);
