<?php
/**
 * FaceTube - List Users API
 * GET /api/users/list.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query('
        SELECT id, user_id, name, mobile, email, role, referral_code, avatar_url, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 100
    ');
    $users = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'users' => $users,
        'total' => count($users)
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
