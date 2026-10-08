<?php
/**
 * FaceTube - Current Authenticated User API
 * GET /api/auth/me.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$user = getAuthUser($pdo);

if (!$user) {
    jsonResponse(['authenticated' => false, 'user' => null], 200);
}

jsonResponse([
    'authenticated' => true,
    'user' => $user
]);
