<?php
/**
 * FaceTube - Promote Video API
 * POST /api/videos/promote.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$input = getRequestPayload();
$videoId = trim($input['videoId'] ?? ($input['video_id'] ?? ''));
$planId = trim($input['planId'] ?? ($input['plan_id'] ?? 'plan-monthly'));
$durationDays = intval($input['durationDays'] ?? ($input['duration_days'] ?? 30));
$paymentId = trim($input['paymentId'] ?? ($input['payment_id'] ?? ''));

if (empty($videoId)) {
    jsonResponse(['success' => false, 'error' => 'Video ID is required.'], 400);
}

$pdo = getDatabaseConnection();

try {
    $expiresAt = date('Y-m-d H:i:s', strtotime("+{$durationDays} days"));
    $stmt = $pdo->prepare('
        UPDATE uploaded_videos 
        SET is_promoted = 1, promotion_plan = ?, promotion_expires_at = ?, updated_at = NOW()
        WHERE id = ?
    ');
    $stmt->execute([$planId, $expiresAt, $videoId]);

    jsonResponse([
        'success' => true,
        'message' => 'Video promoted successfully.',
        'promotionExpiresAt' => $expiresAt,
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
