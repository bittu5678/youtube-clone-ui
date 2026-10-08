<?php
/**
 * FaceTube - User Video Counts API
 * GET /api/videos/counts.php?userId={userId}
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$userId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

$where = [];
$params = [];
if (!empty($userId)) {
    $where[] = 'UPPER(user_id) = UPPER(?)';
    $params[] = $userId;
}

$whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $pdo->prepare("
    SELECT 
        SUM(CASE WHEN video_type = 'free' AND content_type = 'short' THEN 1 ELSE 0 END) AS free_short,
        SUM(CASE WHEN video_type = 'free' AND content_type = 'long' THEN 1 ELSE 0 END) AS free_long,
        SUM(CASE WHEN video_type = 'premium' AND content_type = 'short' AND (payment_status = 'paid' OR payment_status = 'not_required') THEN 1 ELSE 0 END) AS premium_short,
        SUM(CASE WHEN video_type = 'premium' AND content_type = 'long' AND (payment_status = 'paid' OR payment_status = 'not_required') THEN 1 ELSE 0 END) AS premium_long
    FROM uploaded_videos
    {$whereSql}
");
$stmt->execute($params);
$res = $stmt->fetch();

$freeShort = (int)($res['free_short'] ?? 0);
$freeLong = (int)($res['free_long'] ?? 0);
$premiumShort = (int)($res['premium_short'] ?? 0);
$premiumLong = (int)($res['premium_long'] ?? 0);

$totalFree = $freeShort + $freeLong;
$totalPremium = $premiumShort + $premiumLong;
$totalUploaded = $totalFree + $totalPremium;

jsonResponse([
    'success' => true,
    'counts' => [
        'freeShort' => $freeShort,
        'freeLong' => $freeLong,
        'premiumShort' => $premiumShort,
        'premiumLong' => $premiumLong,
        'totalFree' => $totalFree,
        'totalPremium' => $totalPremium,
        'totalUploaded' => $totalUploaded,
    ]
]);
