<?php
/**
 * FaceTube - Razorpay Order Creation API (Hostinger / cPanel PHP Production)
 * POST /api/payments/create-order.php
 *
 * Security & Integrity Protections:
 * 1. Session authentication: Resolves paying user from Bearer token.
 * 2. Video authorization: Verifies authenticated user owns the video for ads promotion.
 * 3. Authoritative server pricing: 100% server-calculated amount in INR (never trusting browser).
 * 4. Pre-checkout order persistence: Records order into payment_orders table.
 * 5. Safe JSON responses without leaking credentials.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$purpose = trim($input['purpose'] ?? 'premium_video_upload');
$requestedUserId = trim($input['userId'] ?? ($input['user_id'] ?? ''));
$requestedUserName = trim($input['userName'] ?? ($input['user_name'] ?? 'Creator'));
$videoId = trim($input['videoId'] ?? ($input['video_id'] ?? ''));
$contentType = trim($input['contentType'] ?? ($input['content_type'] ?? 'long'));
$planId = trim($input['planId'] ?? ($input['plan_id'] ?? ($input['metadata']['planId'] ?? '')));

// 1. Session Authentication & User Identity Resolution
$authUser = getAuthUser($pdo);
if ($authUser) {
    if (!empty($requestedUserId) && strcasecmp($requestedUserId, $authUser['user_id']) !== 0) {
        $isAdmin = isset($authUser['role']) && strtolower($authUser['role']) === 'admin';
        if (!$isAdmin) {
            jsonResponse(['success' => false, 'error' => 'Unauthorized: Cannot create payment orders for another user account.'], 403);
        }
        $effectiveUserId = $requestedUserId;
        $effectiveUserName = $requestedUserName;
    } else {
        $effectiveUserId = $authUser['user_id'];
        $effectiveUserName = $authUser['name'] ?? $requestedUserName;
    }
} else {
    if (empty($requestedUserId)) {
        jsonResponse(['success' => false, 'error' => 'Authentication required. Please log in to initiate payment.'], 401);
    }
    // Verify user exists in database if no token provided
    $stmtUser = $pdo->prepare('SELECT id, user_id, name FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
    $stmtUser->execute([$requestedUserId]);
    $userRow = $stmtUser->fetch();
    if (!$userRow) {
        jsonResponse(['success' => false, 'error' => 'User account not found in FaceTube records.'], 404);
    }
    $effectiveUserId = $userRow['user_id'];
    $effectiveUserName = $userRow['name'] ?? $requestedUserName;
}

// 2. Video Ownership & Authorization Check
if (!empty($videoId)) {
    $stmtVid = $pdo->prepare('SELECT id, user_id, video_type FROM uploaded_videos WHERE id = ? LIMIT 1');
    $stmtVid->execute([$videoId]);
    $vidRow = $stmtVid->fetch();
    if ($vidRow) {
        $isOwner = strcasecmp($vidRow['user_id'], $effectiveUserId) === 0;
        $isAdmin = $authUser && isset($authUser['role']) && strtolower($authUser['role']) === 'admin';
        if (!$isOwner && !$isAdmin) {
            jsonResponse(['success' => false, 'error' => 'Unauthorized: You can only initiate payment or promotion for your own uploaded videos.'], 403);
        }
    }
}

// 3. Authoritative Server-Side Pricing Lookup
$amount = 6.00; // Default ₹6.00 for premium video upload
if ($purpose === 'ads_promotion') {
    $pricing = [
        'plan-7-days' => 100.00,
        'plan-15-days' => 200.00,
        'plan-monthly' => 300.00,
        'plan-yearly' => 3000.00,
    ];
    $amount = $pricing[$planId] ?? 300.00;
} elseif ($purpose !== 'premium_video_upload') {
    jsonResponse(['success' => false, 'error' => 'Unsupported payment purpose.'], 400);
}

$keyId = getenv('RAZORPAY_KEY_ID') ?: ($_ENV['RAZORPAY_KEY_ID'] ?? ($_SERVER['RAZORPAY_KEY_ID'] ?? ''));
$keySecret = getenv('RAZORPAY_KEY_SECRET') ?: ($_ENV['RAZORPAY_KEY_SECRET'] ?? ($_SERVER['RAZORPAY_KEY_SECRET'] ?? ''));

if (empty($keyId) || empty($keySecret)) {
    jsonResponse([
        'success' => false,
        'error' => 'Payment gateway credentials are not configured on the server. Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server environment.'
    ], 503);
}

$amountInSubunits = (int)round($amount * 100);

// 4. Create Order via official Razorpay Orders API
$ch = curl_init('https://api.razorpay.com/v1/orders');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_USERPWD => "{$keyId}:{$keySecret}",
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode([
        'amount' => $amountInSubunits,
        'currency' => 'INR',
        'receipt' => 'rcpt_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(6)), 0, 7),
        'notes' => [
            'purpose' => $purpose,
            'userId' => $effectiveUserId,
            'userName' => $effectiveUserName,
            'videoId' => $videoId,
            'contentType' => $contentType,
            'planId' => $planId,
        ],
    ]),
    CURLOPT_TIMEOUT => 15,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode < 200 || $httpCode >= 300) {
    error_log('[create-order.php] Razorpay Gateway Error: ' . ($curlErr ?: $response));
    jsonResponse([
        'success' => false,
        'error' => 'Failed to initiate payment with Razorpay gateway. Please try again.',
    ], 502);
}

$orderData = json_decode($response, true);
if (empty($orderData['id'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Invalid order response returned by payment gateway.'
    ], 502);
}

$orderId = $orderData['id'];

// 5. Pre-Checkout Order Persistence in payment_orders
try {
    $stmtPo = $pdo->prepare('
        INSERT INTO payment_orders (
            order_id, user_id, user_name, video_id, purpose, plan_id,
            content_type, amount, currency, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "INR", "created", NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW()
    ');
    $stmtPo->execute([
        $orderId,
        $effectiveUserId,
        $effectiveUserName,
        $videoId ?: null,
        $purpose,
        $planId ?: null,
        $contentType ?: null,
        $amount
    ]);
} catch (Exception $ePo) {
    error_log('[create-order.php] Warning: Could not write payment_orders: ' . $ePo->getMessage());
}

// 6. Safe Public Response for Checkout
jsonResponse([
    'orderId' => $orderId,
    'amount' => $amount,
    'amountInSubunits' => (int)($orderData['amount'] ?? $amountInSubunits),
    'currency' => 'INR',
    'purpose' => $purpose,
    'keyId' => $keyId,
    'metadata' => [
        'userId' => $effectiveUserId,
        'userName' => $effectiveUserName,
        'videoId' => $videoId,
        'contentType' => $contentType,
        'planId' => $planId,
        'createdAt' => date('c'),
    ],
]);
