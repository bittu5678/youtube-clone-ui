<?php
/**
 * FaceTube - User Registration API
 * POST /api/auth/register.php
 * Persists user directly into Hostinger MySQL `users` table.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$input = getRequestPayload();

$name = trim($input['name'] ?? ($input['fullName'] ?? ''));
$mobile = trim($input['mobile'] ?? '');
$email = trim(strtolower($input['email'] ?? ''));
$password = (string)($input['password'] ?? '');
$referralCode = !empty($input['referralCode']) ? trim($input['referralCode']) : (!empty($input['referral_code']) ? trim($input['referral_code']) : null);

// 1. Validation
if (empty($name) || strlen($name) < 2) {
    jsonResponse(['success' => false, 'error' => 'Full Name must be at least 2 characters long.'], 400);
}

if (empty($mobile) || strlen(preg_replace('/[^0-9+]/', '', $mobile)) < 7) {
    jsonResponse(['success' => false, 'error' => 'Please enter a valid Mobile Number (at least 7 digits).'], 400);
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'error' => 'Please enter a valid email address.'], 400);
}

if (empty($password) || strlen($password) < 6) {
    jsonResponse(['success' => false, 'error' => 'Password must be at least 6 characters long.'], 400);
}

$pdo = getDatabaseConnection();

try {
    // 2. Check if email already exists in users table
    $stmtCheck = $pdo->prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
    $stmtCheck->execute([$email]);
    if ($stmtCheck->fetch()) {
        jsonResponse([
            'success' => false,
            'error' => "The email \"{$email}\" is already registered. Please sign in."
        ], 409);
    }

    // 3. Generate unique FT User ID (e.g. FT102857)
    $userId = null;
    $attempts = 0;
    while ($attempts < 30) {
        $candidate = 'FT' . str_pad((string)mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        $stmtUid = $pdo->prepare('SELECT 1 FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
        $stmtUid->execute([$candidate]);
        if (!$stmtUid->fetch()) {
            $userId = $candidate;
            break;
        }
        $attempts++;
    }

    if (!$userId) {
        $userId = 'FT' . substr(str_pad((string)time(), 6, '0', STR_PAD_LEFT), -6);
    }

    // 4. Generate UUID v4 for primary key
    $uuid = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    // 5. Securely hash password using PHP BCRYPT
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $role = ($email === 'admin@facetube.com') ? 'admin' : 'user';

    // 6. Insert new user into MySQL users table
    $stmtInsert = $pdo->prepare('
        INSERT INTO users (id, user_id, name, mobile, email, password_hash, role, referral_code, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ');
    $stmtInsert->execute([
        $uuid,
        $userId,
        $name,
        $mobile,
        $email,
        $passwordHash,
        $role,
        $referralCode
    ]);

    // 7. Initialize wallet balances record
    try {
        $stmtWallet = $pdo->prepare('
            INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
            VALUES (?, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NOW())
            ON DUPLICATE KEY UPDATE updated_at = NOW()
        ');
        $stmtWallet->execute([$userId]);
    } catch (Exception $eWallet) {
        // Non-blocking wallet init
    }

    // 8. Generate session token
    $sessionToken = bin2hex(random_bytes(32));
    try {
        $stmtSession = $pdo->prepare('
            INSERT INTO sessions (token, user_id, expires_at, created_at)
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())
        ');
        $stmtSession->execute([$sessionToken, $uuid]);
    } catch (Exception $eSession) {
        // Sessions table optional
    }

    // 9. Fetch freshly created user record directly from MySQL
    $stmtGet = $pdo->prepare('
        SELECT id, user_id, name, mobile, email, role, referral_code, avatar_url, created_at
        FROM users
        WHERE id = ?
        LIMIT 1
    ');
    $stmtGet->execute([$uuid]);
    $userRecord = $stmtGet->fetch();

    // 10. Trigger Welcome Email dispatch only AFTER user record is securely inserted
    $emailDelivery = [
        'success' => false,
        'provider' => 'none',
        'error' => 'Email delivery failed'
    ];
    try {
        $loginLink = getenv('LOGIN_URL') ?: (getenv('APP_URL') ? rtrim(getenv('APP_URL'), '/') . '/login' : 'https://facetube.online/login');
        $emailDelivery = sendWelcomeEmailPhp($name, $email, $userId, $loginLink);
    } catch (Throwable $eMail) {
        $emailDelivery = [
            'success' => false,
            'provider' => 'smtp',
            'error' => 'Email delivery error: ' . $eMail->getMessage()
        ];
    }

    jsonResponse([
        'success' => true,
        'token' => $sessionToken,
        'userId' => $userId,
        'user' => $userRecord,
        'emailDelivery' => $emailDelivery,
        'message' => 'Registration successful.'
    ], 201);

} catch (PDOException $e) {
    http_response_code(500);
    jsonResponse([
        'success' => false,
        'error' => 'Database error during registration: ' . $e->getMessage()
    ], 500);
}
