<?php
/**
 * FaceTube - Video Counts API
 * GET /api/videos/counts.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$userId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

try {
    $where = '';
    $params = [];
    if (!empty($userId)) {
        $where = 'WHERE UPPER(user_id) = UPPER(?)';
        $params[] = $userId;
    }

    $sql = "
        SELECT 
            SUM(CASE WHEN video_type = 'free' AND content_type = 'short' THEN 1 ELSE 0 END) AS freeShort,
            SUM(CASE WHEN video_type = 'free' AND content_type = 'long' THEN 1 ELSE 0 END) AS freeLong,
            SUM(CASE WHEN video_type = 'premium' AND content_type = 'short' AND (payment_status = 'paid' OR payment_status = 'not_required') THEN 1 ELSE 0 END) AS premiumShort,
            SUM(CASE WHEN video_type = 'premium' AND content_type = 'long' AND (payment_status = 'paid' OR payment_status = 'not_required') THEN 1 ELSE 0 END) AS premiumLong,
            COUNT(*) as totalUploaded
        FROM uploaded_videos
        {$where}
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $counts = $stmt->fetch();

    $freeShort = intval($counts['freeShort'] ?? 0);
    $freeLong = intval($counts['freeLong'] ?? 0);
    $premiumShort = intval($counts['premiumShort'] ?? 0);
    $premiumLong = intval($counts['premiumLong'] ?? 0);

    jsonResponse([
        'success' => true,
        'counts' => [
            'freeShort' => $freeShort,
            'freeLong' => $freeLong,
            'premiumShort' => $premiumShort,
            'premiumLong' => $premiumLong,
            'totalFree' => $freeShort + $freeLong,
            'totalPremium' => $premiumShort + $premiumLong,
            'totalUploaded' => $freeShort + $freeLong + $premiumShort + $premiumLong,
        ]
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
