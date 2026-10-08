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

$orderId = 'order_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(6)), 0, 7);
$keyId = getenv('RAZORPAY_KEY_ID') ?: 'rzp_test_facetube_demo_key';

$result = [
    'orderId' => $orderId,
    'amount' => $amount,
    'amountInSubunits' => (int)round($amount * 100),
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
