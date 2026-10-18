<?php
/**
 * FaceTube - Reset Password API
 * POST /api/auth/reset-password.php
 *
 * Security Protections:
 * 1. Verifies SHA-256 token hash against single-use, unexpired token in `password_reset_tokens`.
 * 2. Marks token as used immediately.
 * 3. Bcrypt hashes the new password before updating `users.password_hash`.
 * 4. Invalidates all active sessions for the user in `sessions` table.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$input = getRequestPayload();

$email = strtolower(trim($input['email'] ?? ''));
$rawToken = trim($input['token'] ?? '');
$newPassword = (string)($input['newPassword'] ?? ($input['new_password'] ?? ($input['password'] ?? '')));
$confirmPassword = (string)($input['confirmPassword'] ?? ($input['confirm_password'] ?? ''));

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'error' => 'Valid email address is required.'], 400);
}

if (empty($rawToken)) {
    jsonResponse(['success' => false, 'error' => 'Reset token is required.'], 400);
}

if (empty($newPassword) || strlen($newPassword) < 6) {
    jsonResponse(['success' => false, 'error' => 'New password must be at least 6 characters long.'], 400);
}

if (!empty($confirmPassword) && $newPassword !== $confirmPassword) {
    jsonResponse(['success' => false, 'error' => 'Passwords do not match.'], 400);
}

$pdo = getDatabaseConnection();
$tokenHash = hash('sha256', $rawToken);

try {
    // 1. Verify token exists, is unused, and has not expired
    $stmtToken = $pdo->prepare('
        SELECT id, email, expires_at, used
        FROM password_reset_tokens
        WHERE LOWER(email) = LOWER(?) AND token_hash = ? AND used = 0 AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
    ');
    $stmtToken->execute([$email, $tokenHash]);
    $tokenRow = $stmtToken->fetch();

    if (!$tokenRow) {
        jsonResponse([
            'success' => false,
            'error' => 'This password reset link is invalid, has already been used, or has expired. Please request a new link.'
        ], 400);
    }

    // 2. Mark token as used immediately (single-use enforcement)
    $stmtMark = $pdo->prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?');
    $stmtMark->execute([$tokenRow['id']]);

    // 3. Find target user
    $stmtUser = $pdo->prepare('SELECT id, user_id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
    $stmtUser->execute([$email]);
    $userRow = $stmtUser->fetch();

    if (!$userRow) {
        jsonResponse([
            'success' => false,
            'error' => 'Account associated with this email address was not found.'
        ], 404);
    }

    // 4. Update user password_hash with secure BCRYPT
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmtUpdate = $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
    $stmtUpdate->execute([$newHash, $userRow['id']]);

    // 5. Invalidate all active sessions for this user (security hygiene)
    try {
        $stmtDelSessions = $pdo->prepare('DELETE FROM sessions WHERE user_id = ?');
        $stmtDelSessions->execute([$userRow['id']]);
    } catch (Exception $eSess) {
        // Non-blocking
    }

    jsonResponse([
        'success' => true,
        'message' => 'Your password has been reset successfully. Please log in with your new password.'
    ]);

} catch (PDOException $e) {
    jsonResponse([
        'success' => false,
        'error' => 'Database error while resetting password: ' . $e->getMessage()
    ], 500);
}
