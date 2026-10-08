<?php
/**
 * FaceTube - User Login API
 * POST /api/auth/login.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$rawIdentifier = trim($input['identifier'] ?? ($input['email'] ?? ($input['username'] ?? ($input['user_id'] ?? ''))));
$password = (string)($input['password'] ?? '');

if (empty($rawIdentifier)) {
    jsonResponse(['success' => false, 'error' => 'Please enter your User ID or Email.'], 400);
}
if (empty($password)) {
    jsonResponse(['success' => false, 'error' => 'Please enter your password.'], 400);
}

// 1. Look up user by user_id OR email (case-insensitive)
$stmt = $pdo->prepare('
    SELECT id, user_id, name, mobile, email, password_hash, role, referral_code, avatar_url, created_at
    FROM users
    WHERE UPPER(user_id) = UPPER(?) OR LOWER(email) = LOWER(?)
    LIMIT 1
');
$stmt->execute([$rawIdentifier, $rawIdentifier]);
$user = $stmt->fetch();

if (!$user) {
    jsonResponse([
        'success' => false,
        'error' => 'Account not found. Please check your User ID (e.g. FT123456) or Email, or sign up.'
    ], 404);
}

// 2. Verify password (bcrypt or legacy SHA-256 fallback)
$storedHash = $user['password_hash'];
$isValid = password_verify($password, $storedHash);

// Backward-compat check for legacy SHA-256 seed passwords
if (!$isValid && strlen($storedHash) === 64 && hash('sha256', $password) === $storedHash) {
    $isValid = true;
    // Upgrade to modern bcrypt hash
    $newHash = password_hash($password, PASSWORD_BCRYPT);
    $upStmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $upStmt->execute([$newHash, $user['id']]);
}

if (!$isValid) {
    jsonResponse(['success' => false, 'error' => 'Incorrect password. Please try again.'], 401);
}

// 3. Issue new session token
$sessionToken = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

$stmtSession = $pdo->prepare('
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, NOW())
');
$stmtSession->execute([$sessionToken, $user['id'], $expiresAt]);

unset($user['password_hash']);

jsonResponse([
    'success' => true,
    'token' => $sessionToken,
    'user' => $user,
    'message' => 'Login successful.'
]);
