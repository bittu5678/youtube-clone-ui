<?php
/**
 * FaceTube - Wallet Balance API
 * GET /api/wallet/balance.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$requestedUserId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

// Strictly derive identity from session token and restrict cross-user access to admins
list($authUser, $userId) = requireAuthUser($pdo, $requestedUserId ?: null);


try {
    $stmt = $pdo->prepare('SELECT * FROM wallet_balances WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
    $stmt->execute([$userId]);
    $wallet = $stmt->fetch();

    if (!$wallet) {
        // Initialize an empty wallet record for the user if none exists yet
        try {
            $stmtInit = $pdo->prepare('
                INSERT INTO wallet_balances (user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at)
                VALUES (?, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NOW())
                ON DUPLICATE KEY UPDATE updated_at = NOW()
            ');
            $stmtInit->execute([$userId]);
        } catch (Exception $eInit) {
            // Ignore insert race
        }

        $balance = 0.00;
        $totalEarned = 0.00;
        $totalWithdrawn = 0.00;
        $referralIncome = 0.00;
        $globalIncome = 0.00;
        $adsenseIncome = 0.00;
        $affiliateIncome = 0.00;
        $updatedAt = date('c');
    } else {
        $balance = floatval($wallet['balance'] ?? 0);
        $totalEarned = floatval($wallet['total_earned'] ?? $balance);
        $totalWithdrawn = floatval($wallet['total_withdrawn'] ?? 0);
        $referralIncome = floatval($wallet['referral_income'] ?? 0);
        $globalIncome = floatval($wallet['global_income'] ?? 0);
        $adsenseIncome = floatval($wallet['adsense_income'] ?? 0);
        $affiliateIncome = floatval($wallet['affiliate_income'] ?? 0);
        $updatedAt = $wallet['updated_at'] ?? date('c');
    }

    jsonResponse([
        'success' => true,
        'wallet' => [
            'userId' => $userId,
            'user_id' => $userId,
            'balance' => $balance,
            'totalBalance' => $balance,
            'withdrawableBalance' => $balance,
            'referralIncome' => $referralIncome,
            'referral_income' => $referralIncome,
            'directReferralIncome' => $referralIncome,
            'globalIncome' => $globalIncome,
            'global_income' => $globalIncome,
            'adsenseIncome' => $adsenseIncome,
            'adsense_income' => $adsenseIncome,
            'affiliateIncome' => $affiliateIncome,
            'affiliate_income' => $affiliateIncome,
            'totalEarnings' => $totalEarned,
            'total_earned' => $totalEarned,
            'totalWithdrawn' => $totalWithdrawn,
            'total_withdrawn' => $totalWithdrawn,
            'pendingWithdrawals' => 0.00,
            'updatedAt' => $updatedAt,
            'updated_at' => $updatedAt,
        ]
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
