<?php
/**
 * FaceTube - User Logout API
 * POST /api/auth/logout.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$token = getAuthToken();

if ($token) {
    $stmt = $pdo->prepare('DELETE FROM sessions WHERE token = ?');
    $stmt->execute([$token]);
}

jsonResponse(['success' => true, 'message' => 'Logged out successfully.']);
