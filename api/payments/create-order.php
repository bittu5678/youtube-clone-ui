<?php
/**
 * FaceTube - Razorpay Order Creation API
 * POST /api/payments/create-order.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$input = getRequestPayload();

$purpose = trim($input['purpose'] ?? 'premium_video_upload');
$userId = trim($input['userId'] ?? ($input['user_id'] ?? ''));
$userName = trim($input['userName'] ?? ($input['user_name'] ?? 'Creator'));
$videoId = trim($input['videoId'] ?? ($input['video_id'] ?? ''));
$contentType = trim($input['contentType'] ?? ($input['content_type'] ?? 'long'));
$planId = trim($input['planId'] ?? ($input['plan_id'] ?? ''));

// Authoritative pricing lookup (server-side, never trusting client amounts)
$amount = 6.00; // Default ₹6 for premium video
if ($purpose === 'ads_promotion') {
    $pricing = [
        'plan-7-days' => 100.00,
        'plan-15-days' => 200.00,
        'plan-monthly' => 300.00,
        'plan-yearly' => 30000.00,
    ];
    $amount = $pricing[$planId] ?? 300.00;
}

$keyId = getenv('RAZORPAY_KEY_ID') ?: ($_ENV['RAZORPAY_KEY_ID'] ?? ($_SERVER['RAZORPAY_KEY_ID'] ?? ''));
$keySecret = getenv('RAZORPAY_KEY_SECRET') ?: ($_ENV['RAZORPAY_KEY_SECRET'] ?? ($_SERVER['RAZORPAY_KEY_SECRET'] ?? ''));

if (empty($keyId) || empty($keySecret)) {
    jsonResponse([
        'success' => false,
        'error' => 'Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured on the server. Real payments cannot be initiated until credentials are configured.'
    ], 503);
}

$amountInSubunits = (int)round($amount * 100);

// Call real Razorpay Orders API
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
            'userId' => $userId,
            'userName' => $userName,
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
    jsonResponse([
        'success' => false,
        'error' => 'Failed to create real Razorpay order with gateway API: ' . ($curlErr ?: $response),
    ], 502);
}

$orderData = json_decode($response, true);
if (empty($orderData['id'])) {
    jsonResponse([
        'success' => false,
        'error' => 'Invalid order response returned by Razorpay API'
    ], 502);
}

$result = [
    'orderId' => $orderData['id'],
    'amount' => $amount,
    'amountInSubunits' => (int)($orderData['amount'] ?? $amountInSubunits),
    'currency' => 'INR',
    'purpose' => $purpose,
    'keyId' => $keyId,
    'metadata' => [
        'userId' => $userId,
        'userName' => $userName,
        'videoId' => $videoId,
        'contentType' => $contentType,
        'planId' => $planId,
        'createdAt' => date('c'),
    ],
];

jsonResponse($result);
