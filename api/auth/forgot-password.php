<?php
/**
 * FaceTube - Forgot Password Request API
 * POST /api/auth/forgot-password.php
 *
 * Security Protections:
 * 1. Anti-enumeration: Returns uniform success message whether the account exists or not.
 * 2. Cryptographically secure single-use token (32 bytes = 64 hex chars).
 * 3. Token hashed with SHA-256 before storage in `password_reset_tokens`.
 * 4. 1-hour expiration with automatic invalidation of prior unused tokens.
 * 5. Rate limiting: Max 1 reset request per email per 60 seconds.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/email.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$input = getRequestPayload();
$rawIdentifier = trim($input['identifier'] ?? ($input['email'] ?? ($input['user_id'] ?? '')));

if (empty($rawIdentifier)) {
    jsonResponse([
        'success' => false,
        'error' => 'Please enter your User ID or Email address.'
    ], 400);
}

$pdo = getDatabaseConnection();

// Standard response message that prevents user account enumeration
$genericSuccessResponse = [
    'success' => true,
    'message' => 'If an account associated with that User ID or Email exists, a password reset link has been dispatched to your registered email address.'
];

try {
    // 1. Look up user by user_id OR email (case-insensitive)
    $stmtUser = $pdo->prepare('
        SELECT id, user_id, name, email
        FROM users
        WHERE UPPER(user_id) = UPPER(?) OR LOWER(email) = LOWER(?)
        LIMIT 1
    ');
    $stmtUser->execute([$rawIdentifier, $rawIdentifier]);
    $user = $stmtUser->fetch();

    if (!$user || empty($user['email'])) {
        // Return uniform success to avoid revealing whether user exists
        jsonResponse($genericSuccessResponse);
    }

    $email = strtolower(trim($user['email']));

    // 2. Ensure password_reset_tokens table exists (fail-safe)
    try {
        $pdo->exec('
            CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
              `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              `email` VARCHAR(255) NOT NULL,
              `token_hash` VARCHAR(64) NOT NULL,
              `expires_at` DATETIME NOT NULL,
              `used` TINYINT(1) NOT NULL DEFAULT 0,
              `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_prt_email` (`email`),
              KEY `idx_prt_token_hash` (`token_hash`),
              KEY `idx_prt_expires` (`expires_at`),
              KEY `idx_prt_created_at` (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ');
    } catch (Exception $eTbl) {
        // Continue if table exists
    }

    // 3. Rate limiting: Check if an active token was generated in the last 60 seconds
    try {
        $stmtRate = $pdo->prepare('
            SELECT id FROM password_reset_tokens
            WHERE LOWER(email) = LOWER(?) AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
            LIMIT 1
        ');
        $stmtRate->execute([$email]);
        if ($stmtRate->fetch()) {
            // Already sent recently, return uniform success without resending spam
            jsonResponse($genericSuccessResponse);
        }
    } catch (Exception $eRate) {
        // Fall through
    }

    // 4. Invalidate all existing unused tokens for this email
    try {
        $stmtInvalidate = $pdo->prepare('
            UPDATE password_reset_tokens
            SET used = 1
            WHERE LOWER(email) = LOWER(?) AND used = 0
        ');
        $stmtInvalidate->execute([$email]);
    } catch (Exception $eInv) {
        // Non-blocking
    }

    // 5. Generate cryptographically secure random token (32 bytes = 64 hex characters)
    $rawToken = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $rawToken);

    // 6. Persist token hash with 1-hour expiration
    $stmtInsert = $pdo->prepare('
        INSERT INTO password_reset_tokens (email, token_hash, expires_at, used, created_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 0, NOW())
    ');
    $stmtInsert->execute([$email, $tokenHash]);

    // 7. Dispatch Password Reset Link via configured SMTP
    $appBaseUrl = getenv('APP_URL') ?: 'https://facetube.online';
    $resetLink = rtrim($appBaseUrl, '/') . '/auth?mode=reset&token=' . urlencode($rawToken) . '&email=' . urlencode($email);

    try {
        sendPasswordResetEmailPhp($user['name'], $email, $user['user_id'], $resetLink);
    } catch (Throwable $eMail) {
        error_log('[FaceTube Forgot Password] Email sending error: ' . $eMail->getMessage());
    }

    // Always return safe public response without exposing token
    jsonResponse($genericSuccessResponse);

} catch (PDOException $e) {
    error_log('[FaceTube Forgot Password] Database error: ' . $e->getMessage());
    // Safe response even on internal failure to avoid revealing database structure
    jsonResponse($genericSuccessResponse);
}
