<?php
/**
 * FaceTube - User Registration API
 * POST /api/auth/register.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$name = trim($input['name'] ?? ($input['fullName'] ?? ''));
$mobile = trim($input['mobile'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$password = (string)($input['password'] ?? '');
$referralCode = trim($input['referralCode'] ?? ($input['referral_code'] ?? ''));

if (empty($name)) {
    jsonResponse(['success' => false, 'error' => 'Full Name is required.'], 400);
}
if (empty($mobile)) {
    jsonResponse(['success' => false, 'error' => 'Mobile number is required.'], 400);
}
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'error' => 'A valid email address is required.'], 400);
}
if (strlen($password) < 6) {
    jsonResponse(['success' => false, 'error' => 'Password must be at least 6 characters long.'], 400);
}

// Check for existing email
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonResponse(['success' => false, 'error' => "The email \"{$email}\" is already registered. Please sign in."], 409);
}

// Generate unique FT User ID (e.g. FT123456)
$userId = generateFTUserId($pdo);
$uuid = generateUuid();
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$role = ($email === 'admin@facetube.com') ? 'admin' : 'user';
$refCodeVal = !empty($referralCode) ? $referralCode : null;

try {
    $pdo->beginTransaction();

    // 1. Insert into users table
    $stmt = $pdo->prepare('
        INSERT INTO users (id, user_id, name, mobile, email, password_hash, role, referral_code, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ');
    $stmt->execute([$uuid, $userId, $name, $mobile, $email, $passwordHash, $role, $refCodeVal]);

    // 2. Initialize default wallet balance
    $stmtWallet = $pdo->prepare('
        INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
        VALUES (?, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW()
    ');
    $stmtWallet->execute([$userId]);

    // 3. Create active session token
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    $stmtSession = $pdo->prepare('
        INSERT INTO sessions (token, user_id, expires_at, created_at)
        VALUES (?, ?, ?, NOW())
    ');
    $stmtSession->execute([$sessionToken, $uuid, $expiresAt]);

    $pdo->commit();

    $userData = [
        'id' => $uuid,
        'user_id' => $userId,
        'name' => $name,
        'mobile' => $mobile,
        'email' => $email,
        'role' => $role,
        'referral_code' => $refCodeVal,
        'created_at' => date('c'),
    ];

    jsonResponse([
        'success' => true,
        'token' => $sessionToken,
        'user' => $userData,
        'userId' => $userId,
        'message' => 'Registration successful.',
    ], 201);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'success' => false,
        'error' => 'Failed to create user account. ' . $e->getMessage(),
    ], 500);
}
