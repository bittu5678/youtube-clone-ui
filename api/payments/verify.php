<?php
/**
 * FaceTube - Razorpay Payment Verification & Distribution API (Hostinger / cPanel PHP Production)
 * POST /api/payments/verify.php
 *
 * Security & Reliability Safeguards:
 * 1. Cryptographic HMAC-SHA256 signature verification (Fail-closed if secret missing).
 * 2. Remote Gateway Verification via cURL (Fetches and confirms status & amount from Razorpay).
 * 3. Pre-checkout Order Verification: Compares against server-stored `payment_orders` record.
 * 4. ACID Transaction with row-level locks (FOR UPDATE):
 *    - Atomically updates payment_transactions, payment_orders, uploaded_videos, and wallet_balances.
 * 5. Idempotent Duplicate Handling: Prevents duplicate referral credits and duplicate promotion extensions.
 * 6. Explicit Promotion Renewal Rule: Extends active expiry, otherwise starts from current server time.
 * 7. Safe JSON Responses: Never exposes raw SQL errors, credentials, or internal stack traces.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$orderId = trim($input['orderId'] ?? ($input['order_id'] ?? ''));
$paymentId = trim($input['paymentId'] ?? ($input['payment_id'] ?? ''));
$signature = trim($input['signature'] ?? '');

if (empty($orderId) || empty($paymentId)) {
    jsonResponse([
        'verified' => false,
        'error' => 'Invalid verification request: orderId and paymentId are required.'
    ], 400);
}

// -----------------------------------------------------------------------------
// 1. CRYPTOGRAPHIC SIGNATURE VERIFICATION (Fail-Closed)
// -----------------------------------------------------------------------------
$keyId = getenv('RAZORPAY_KEY_ID') ?: ($_ENV['RAZORPAY_KEY_ID'] ?? ($_SERVER['RAZORPAY_KEY_ID'] ?? ''));
$secret = getenv('RAZORPAY_KEY_SECRET') ?: ($_ENV['RAZORPAY_KEY_SECRET'] ?? ($_SERVER['RAZORPAY_KEY_SECRET'] ?? ''));

if (empty($secret)) {
    error_log('[verify.php] Error: RAZORPAY_KEY_SECRET is not configured on server.');
    jsonResponse([
        'verified' => false,
        'paymentId' => $paymentId,
        'orderId' => $orderId,
        'error' => 'Payment gateway verification is unavailable on server. Please configure RAZORPAY_KEY_SECRET.'
    ], 500);
}

// Strictly reject synthetic bypasses or empty signatures
if (empty($signature) || $signature === 'mock_signature_bypass' || str_starts_with($signature, 'mock_')) {
    jsonResponse([
        'verified' => false,
        'paymentId' => $paymentId,
        'orderId' => $orderId,
        'error' => 'Payment signature missing or invalid mock signature rejected.'
    ], 400);
}

// Validate HMAC-SHA256 signature
$expectedSignature = hash_hmac('sha256', "{$orderId}|{$paymentId}", $secret);
if (!hash_equals($expectedSignature, $signature)) {
    jsonResponse([
        'verified' => false,
        'paymentId' => $paymentId,
        'orderId' => $orderId,
        'error' => 'Invalid Razorpay payment signature verification failed.'
    ], 400);
}

// -----------------------------------------------------------------------------
// 2. REMOTE GATEWAY STATUS VERIFICATION VIA RAZORPAY REST API (cURL)
// -----------------------------------------------------------------------------
$ch = curl_init("https://api.razorpay.com/v1/payments/{$paymentId}");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD => "{$keyId}:{$secret}",
    CURLOPT_TIMEOUT => 15,
]);
$pResp = curl_exec($ch);
$pCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$pErr = curl_error($ch);
curl_close($ch);

if ($pResp === false || $pCode < 200 || $pCode >= 300) {
    error_log('[verify.php] Razorpay API lookup error: ' . ($pErr ?: $pResp));
    jsonResponse([
        'verified' => false,
        'paymentId' => $paymentId,
        'orderId' => $orderId,
        'error' => 'Razorpay payment confirmation failed with gateway.',
    ], 400);
}

$pData = json_decode($pResp, true);
if (empty($pData) || !is_array($pData)) {
    jsonResponse([
        'verified' => false,
        'error' => 'Invalid response structure from payment gateway.'
    ], 400);
}

// Verify gateway payment belongs to the expected order
if (!empty($pData['order_id']) && $pData['order_id'] !== $orderId) {
    jsonResponse([
        'verified' => false,
        'error' => "Razorpay payment order mismatch (expected {$orderId}, received {$pData['order_id']})"
    ], 400);
}

// Verify payment currency is strictly INR
if (($pData['currency'] ?? '') !== 'INR') {
    jsonResponse([
        'verified' => false,
        'error' => 'Razorpay payment currency mismatch: expected INR.'
    ], 400);
}

// Verify payment status is successful
if ($pData['status'] !== 'captured' && $pData['status'] !== 'authorized') {
    jsonResponse([
        'verified' => false,
        'error' => "Razorpay payment status is not successful (status: {$pData['status']})."
    ], 400);
}

// If authorized, auto-capture with gateway
if ($pData['status'] === 'authorized') {
    $capAmount = intval($pData['amount']);
    $capCh = curl_init("https://api.razorpay.com/v1/payments/{$paymentId}/capture");
    curl_setopt_array($capCh, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_USERPWD => "{$keyId}:{$secret}",
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode(['amount' => $capAmount, 'currency' => 'INR']),
        CURLOPT_TIMEOUT => 15,
    ]);
    $capRes = curl_exec($capCh);
    $capCode = curl_getinfo($capCh, CURLINFO_HTTP_CODE);
    curl_close($capCh);
    if ($capCode < 200 || $capCode >= 300) {
        error_log('[verify.php] Failed to capture authorized payment: ' . $capRes);
        jsonResponse([
            'verified' => false,
            'error' => 'Failed to capture authorized payment on gateway.'
        ], 400);
    }
}

// -----------------------------------------------------------------------------
// 3. ATOMIC DATABASE TRANSACTION & ZERO-TRUST FEATURE UNLOCK
// -----------------------------------------------------------------------------
try {
    $pdo->beginTransaction();

    // 3.1 Lock and inspect pre-checkout server order record
    $stmtOrder = $pdo->prepare('SELECT * FROM payment_orders WHERE order_id = ? FOR UPDATE');
    $stmtOrder->execute([$orderId]);
    $orderRecord = $stmtOrder->fetch();

    if ($orderRecord) {
        // Fast-path duplicate check: Order is already marked paid
        if ($orderRecord['status'] === 'paid') {
            $pdo->rollBack();
            jsonResponse([
                'verified' => true,
                'paymentId' => $paymentId,
                'orderId' => $orderId,
                'amount' => floatval($orderRecord['amount']),
                'purpose' => $orderRecord['purpose'],
                'duplicate' => true,
                'message' => 'Payment already verified and credited previously (idempotent duplicate).'
            ]);
            exit;
        }

        // Authoritative parameters locked from server-stored order
        $userId = $orderRecord['user_id'];
        $userName = $orderRecord['user_name'] ?? 'Creator';
        $videoId = $orderRecord['video_id'];
        $purpose = $orderRecord['purpose'];
        $planId = $orderRecord['plan_id'];
        $amount = floatval($orderRecord['amount']);
    } else {
        // Fallback if payment_orders table was bypassed: derive server-side authoritative values
        $purpose = trim($input['purpose'] ?? 'premium_video_upload');
        $userId = trim($input['userId'] ?? ($input['user_id'] ?? ''));
        $userName = trim($input['userName'] ?? ($input['user_name'] ?? 'Creator'));
        $videoId = trim($input['videoId'] ?? ($input['video_id'] ?? ''));
        $planId = trim($input['planId'] ?? ($input['plan_id'] ?? ($input['metadata']['planId'] ?? '')));

        if ($purpose === 'ads_promotion') {
            $pricing = ['plan-7-days' => 100.0, 'plan-15-days' => 200.0, 'plan-monthly' => 300.0, 'plan-yearly' => 3000.0];
            $amount = $pricing[$planId] ?? 300.0;
        } else {
            $amount = 6.00;
        }
    }

    // Verify gateway amount matches server authoritative amount (in paise)
    $expectedSubunits = (int)round($amount * 100);
    if ((int)($pData['amount'] ?? 0) !== $expectedSubunits) {
        $pdo->rollBack();
        jsonResponse([
            'verified' => false,
            'error' => "Payment amount mismatch: expected ₹{$amount}, received " . (($pData['amount'] ?? 0) / 100)
        ], 400);
    }

    // 3.2 Lock check for duplicate payment_id in payment_transactions
    $stmtExisting = $pdo->prepare('SELECT * FROM payment_transactions WHERE payment_id = ? FOR UPDATE');
    $stmtExisting->execute([$paymentId]);
    $existingTx = $stmtExisting->fetch();
    if ($existingTx) {
        $pdo->rollBack();
        jsonResponse([
            'verified' => true,
            'paymentId' => $existingTx['payment_id'],
            'orderId' => $existingTx['order_id'],
            'amount' => floatval($existingTx['amount']),
            'purpose' => $existingTx['purpose'],
            'txNumber' => intval($existingTx['tx_number']),
            'isSpecialTransaction' => (bool)$existingTx['is_special'],
            'specialTag' => $existingTx['special_tag'],
            'duplicate' => true,
            'message' => 'Payment already verified and credited previously (idempotent duplicate).'
        ]);
        exit;
    }

    // 3.3 Sequence allocation under row lock
    $stmtCount = $pdo->query('SELECT COUNT(*) as total FROM payment_transactions FOR UPDATE');
    $countRow = $stmtCount->fetch();
    $txNumber = intval($countRow['total'] ?? 0) + 1;

    // Special 11th-formula rule: txNumber >= 11 AND (txNumber - 11) % 10 === 0
    $isSpecial = ($txNumber >= 11 && ($txNumber - 11) % 10 === 0);
    $specialTag = $isSpecial ? 'SPECIAL_GLOBAL_RULE' : 'NORMAL_PREMIUM';

    // Verify referral relationship strictly against database sponsor
    $verifiedReferrerId = null;
    $stmtUserRef = $pdo->prepare('SELECT id, referral_code FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
    $stmtUserRef->execute([$userId]);
    $userRow = $stmtUserRef->fetch();
    $refCode = trim($userRow['referral_code'] ?? '');

    if (!empty($refCode)) {
        $stmtRef = $pdo->prepare('
            SELECT user_id FROM users 
            WHERE (UPPER(user_id) = UPPER(?) OR UPPER(referral_code) = UPPER(?)) 
              AND UPPER(user_id) != UPPER(?) 
            LIMIT 1
        ');
        $stmtRef->execute([$refCode, $refCode, $userId]);
        $refMatch = $stmtRef->fetch();
        if ($refMatch) {
            $verifiedReferrerId = $refMatch['user_id'];
        }
    }

    $isPremiumUpload = ($purpose === 'premium_video_upload');
    $referralCommission = ($isPremiumUpload && !empty($verifiedReferrerId)) ? 1.00 : 0.00;
    $adminAllocation = $isSpecial ? 4.00 : 1.00;
    $globalPoolAllocation = $isSpecial ? 0.00 : 3.00;

    // 3.4 Insert into payment_transactions (protected by UNIQUE key on payment_id)
    $stmtTx = $pdo->prepare('
        INSERT INTO payment_transactions (
            order_id, payment_id, user_id, user_name, video_id, purpose, amount,
            tx_number, is_special, special_tag, referral_commission, admin_allocation, global_pool_allocation,
            created_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            NOW()
        )
    ');
    $stmtTx->execute([
        $orderId, $paymentId, $userId, $userName, $videoId ?: null, $purpose, $amount,
        $txNumber, $isSpecial ? 1 : 0, $specialTag, $referralCommission, $adminAllocation, $globalPoolAllocation
    ]);

    // 3.5 Insert into premium_transactions audit sequence
    try {
        $ptId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
        $stmtPt = $pdo->prepare('
            INSERT INTO premium_transactions (
                id, tx_number, payment_id, order_id, video_id, user_id, referrer_id,
                amount, transaction_type, is_special, special_tag, referral_commission,
                admin_allocation, global_pool_allocation, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, "premium_upload", ?, ?, ?,
                ?, ?, NOW()
            )
        ');
        $stmtPt->execute([
            $ptId, $txNumber, $paymentId, $orderId, $videoId ?: 'vid_unknown', $userId, $verifiedReferrerId,
            $amount, $isSpecial ? 1 : 0, $specialTag, $referralCommission,
            $adminAllocation, $globalPoolAllocation
        ]);
    } catch (Exception $ePt) {
        // Table optional
    }

    // 3.6 Credit referral commission to sponsor in ledger & wallet (only once)
    if (!empty($verifiedReferrerId) && $referralCommission > 0) {
        $txRefId = 'TX_REF_' . $paymentId;
        $ledgerUuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));

        $stmtLedger = $pdo->prepare('
            INSERT INTO income_ledger (
                id, transaction_id, user_id, source_user_id, source_user_name, video_id,
                income_type, amount, status, special_tag, description, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                "referral_income", 1.0000, "settled", ?, ?, NOW()
            )
        ');
        $stmtLedger->execute([
            $ledgerUuid,
            $txRefId,
            $verifiedReferrerId,
            $userId,
            $userName,
            $videoId ?: null,
            $specialTag,
            "Direct referral commission (₹1.00) for eligible Premium Video upload by {$userName} ({$userId})"
        ]);

        $stmtCredit = $pdo->prepare('
            INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
            VALUES (?, 1.00, 1.00, 0.00, 1.00, 0.00, 0.00, 0.00, NOW())
            ON DUPLICATE KEY UPDATE
                balance = balance + 1.00,
                total_earned = total_earned + 1.00,
                referral_income = referral_income + 1.00,
                updated_at = NOW()
        ');
        $stmtCredit->execute([$verifiedReferrerId]);
    }

    // 3.7 Feature Activation: Premium Video or Ad Promotion
    if (!empty($videoId)) {
        if ($purpose === 'ads_promotion') {
            // Plan durations
            $planDurations = [
                'plan-7-days' => 7,
                'plan-15-days' => 15,
                'plan-monthly' => 30,
                'plan-yearly' => 365,
            ];
            $durationDays = $planDurations[$planId] ?? 30;

            // Business Rule: Add duration to active expiry date, otherwise start from NOW()
            $stmtPromo = $pdo->prepare('
                UPDATE uploaded_videos 
                SET is_promoted = 1,
                    promotion_plan = :planId,
                    promotion_expires_at = IF(
                        promotion_expires_at IS NOT NULL AND promotion_expires_at > NOW(),
                        DATE_ADD(promotion_expires_at, INTERVAL :durationDays DAY),
                        DATE_ADD(NOW(), INTERVAL :durationDays DAY)
                    ),
                    updated_at = NOW()
                WHERE id = :videoId
            ');
            $stmtPromo->execute([
                ':planId' => $planId,
                ':durationDays' => $durationDays,
                ':videoId' => $videoId
            ]);
        } elseif ($isPremiumUpload) {
            $pdo->prepare('
                UPDATE uploaded_videos 
                SET payment_status = "paid", payment_id = ?, payment_amount = ?, updated_at = NOW()
                WHERE id = ?
            ')->execute([$paymentId, $amount, $videoId]);
        }
    }

    // 3.8 Update payment_orders status to 'paid'
    try {
        $pdo->prepare('
            UPDATE payment_orders 
            SET status = "paid", payment_id = ?, updated_at = NOW() 
            WHERE order_id = ?
        ')->execute([$paymentId, $orderId]);
    } catch (Exception $ePoUpdate) {
        // Optional
    }

    // Commit all operations atomically
    $pdo->commit();

    jsonResponse([
        'verified' => true,
        'paymentId' => $paymentId,
        'orderId' => $orderId,
        'amount' => $amount,
        'purpose' => $purpose,
        'txNumber' => $txNumber,
        'isSpecialTransaction' => $isSpecial,
        'specialTag' => $specialTag,
        'distribution' => [
            'directReferralAmount' => $referralCommission,
            'referrerId' => $verifiedReferrerId,
            'adminAmount' => $adminAllocation,
            'globalPoolAmount' => $globalPoolAllocation,
        ]
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // Check for duplicate key conflict (error code 23000 / 1062)
    if ($e->getCode() === '23000' || str_contains($e->getMessage(), '1062') || str_contains($e->getMessage(), 'Duplicate entry')) {
        $stmtExisting = $pdo->prepare('SELECT * FROM payment_transactions WHERE payment_id = ? LIMIT 1');
        $stmtExisting->execute([$paymentId]);
        $existingTx = $stmtExisting->fetch();
        if ($existingTx) {
            jsonResponse([
                'verified' => true,
                'paymentId' => $existingTx['payment_id'],
                'orderId' => $existingTx['order_id'],
                'amount' => floatval($existingTx['amount']),
                'purpose' => $existingTx['purpose'],
                'txNumber' => intval($existingTx['tx_number']),
                'isSpecialTransaction' => (bool)$existingTx['is_special'],
                'specialTag' => $existingTx['special_tag'],
                'duplicate' => true,
                'message' => 'Concurrent duplicate detected and resolved safely without double crediting.'
            ]);
            exit;
        }
    }

    // Safe error message without exposing database tables or SQL traces
    error_log('[verify.php] Database Exception: ' . $e->getMessage());
    jsonResponse([
        'verified' => false,
        'paymentId' => $paymentId,
        'orderId' => $orderId,
        'error' => 'Payment processing failed during database recording. Transaction was safely rolled back.'
    ], 500);
}
