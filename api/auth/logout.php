<?php
/**
 * FaceTube - Logout API
 * POST /api/auth/logout.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$token = getBearerToken();

if ($token) {
    try {
        $stmt = $pdo->prepare('DELETE FROM sessions WHERE token = ?');
        $stmt->execute([$token]);
    } catch (Exception $e) {
        // Silently continue
    }
}

jsonResponse(['success' => true, 'message' => 'Logged out successfully.']);
