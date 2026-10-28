<?php
/**
 * FaceTube - Earnings Time-Series History API
 * GET /api/wallet/earnings-history.php
 * Returns daily aggregated income ledger events for the creator growth charts.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$authUser = getAuthUser($pdo);

if (!$authUser) {
    jsonResponse(['success' => false, 'error' => 'Authentication required'], 401);
}

$requestedUserId = trim($_GET['user_id'] ?? ($authUser['user_id'] ?? ''));
$days = max(7, min(90, intval($_GET['days'] ?? 14)));

try {
    $stmt = $pdo->prepare('
        SELECT DATE(created_at) as date,
               income_type,
               SUM(amount) as total_amount,
               COUNT(*) as tx_count
        FROM income_ledger
        WHERE user_id = ?
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at), income_type
        ORDER BY date ASC
    ');
    $stmt->execute([$requestedUserId, $days]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group by date
    $timeline = [];
    $today = new DateTime();
    for ($i = $days - 1; $i >= 0; $i--) {
        $dt = (clone $today)->modify("-{$i} days")->format('Y-m-d');
        $dayLabel = (clone $today)->modify("-{$i} days")->format('D');
        $timeline[$dt] = [
            'date' => $dt,
            'day' => $dayLabel,
            'revenue' => 0.0,
            'referral_income' => 0.0,
            'global_income' => 0.0,
            'adsense_income' => 0.0,
            'affiliate_income' => 0.0,
            'tx_count' => 0,
        ];
    }

    foreach ($rows as $r) {
        $d = $r['date'];
        if (isset($timeline[$d])) {
            $amt = floatval($r['total_amount']);
            $type = $r['income_type'];
            $timeline[$d]['revenue'] += $amt;
            $timeline[$d]['tx_count'] += intval($r['tx_count']);
            if (isset($timeline[$d][$type])) {
                $timeline[$d][$type] += $amt;
            }
        }
    }

    jsonResponse([
        'success' => true,
        'user_id' => $requestedUserId,
        'days' => $days,
        'history' => array_values($timeline),
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
