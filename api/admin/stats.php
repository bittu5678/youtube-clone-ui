<?php
/**
 * FaceTube - Admin Platform Stats API
 * GET /api/admin/stats.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();

// Check if user is admin if token is provided
$user = getAuthUser($pdo);
// If not admin, return standard high-level stats or require admin
if ($user && $user['role'] !== 'admin') {
    jsonResponse(['success' => false, 'error' => 'Admin authorization required.'], 403);
}

// 1. Total users
$uCount = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();

// 2. Total videos
$vCount = (int)$pdo->query('SELECT COUNT(*) FROM uploaded_videos')->fetchColumn();
$premCount = (int)$pdo->query('SELECT COUNT(*) FROM uploaded_videos WHERE video_type = "premium"')->fetchColumn();
$freeCount = (int)$pdo->query('SELECT COUNT(*) FROM uploaded_videos WHERE video_type = "free"')->fetchColumn();

// 3. Total images
$imgCount = (int)$pdo->query('SELECT COUNT(*) FROM uploaded_images')->fetchColumn();

// 4. Total transactions & volume
$txCount = (int)$pdo->query('SELECT COUNT(*) FROM income_ledger')->fetchColumn();
$premTxCount = (int)$pdo->query('SELECT COUNT(*) FROM premium_transactions')->fetchColumn();

// 5. Total system volume
$stmtVol = $pdo->query('SELECT COALESCE(SUM(amount), 0) FROM premium_transactions');
$totalVol = (float)$stmtVol->fetchColumn();

// 6. Total withdrawals
$stmtWd = $pdo->query('SELECT COALESCE(SUM(ABS(amount)), 0) FROM income_ledger WHERE income_type = "withdrawal" AND status = "settled"');
$totalWd = (float)$stmtWd->fetchColumn();

jsonResponse([
    'success' => true,
    'stats' => [
        'totalUsers' => $uCount,
        'totalVideos' => $vCount,
        'freeVideos' => $freeCount,
        'premiumVideos' => $premCount,
        'totalImages' => $imgCount,
        'totalTransactions' => $txCount,
        'premiumTransactions' => $premTxCount,
        'totalRevenueVolume' => $totalVol,
        'totalWithdrawals' => $totalWd,
    ]
]);
