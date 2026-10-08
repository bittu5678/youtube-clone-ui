<?php
/**
 * FaceTube - User Wallet Balance API
 * GET /api/wallet/balance.php?userId={userId}
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$userId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

if (empty($userId)) {
    $authUser = getAuthUser($pdo);
    if ($authUser) {
        $userId = $authUser['user_id'];
    }
}

if (empty($userId)) {
    jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
}

$stmt = $pdo->prepare('
    SELECT user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income, updated_at
    FROM wallet_balances
    WHERE UPPER(user_id) = UPPER(?)
    LIMIT 1
');
$stmt->execute([$userId]);
$wallet = $stmt->fetch();

if (!$wallet) {
    // Return empty wallet structure initialized
    $wallet = [
        'userId' => $userId,
        'user_id' => $userId,
        'balance' => 0.00,
        'totalEarned' => 0.00,
        'total_earned' => 0.00,
        'totalWithdrawn' => 0.00,
        'total_withdrawn' => 0.00,
        'referralIncome' => 0.00,
        'referral_income' => 0.00,
        'globalIncome' => 0.00,
        'global_income' => 0.00,
        'adsenseIncome' => 0.00,
        'adsense_income' => 0.00,
        'affiliateIncome' => 0.00,
        'affiliate_income' => 0.00,
        'updatedAt' => date('c'),
    ];
} else {
    $wallet = [
        'userId' => $wallet['user_id'],
        'user_id' => $wallet['user_id'],
        'balance' => (float)$wallet['balance'],
        'totalEarned' => (float)$wallet['total_earned'],
        'total_earned' => (float)$wallet['total_earned'],
        'totalWithdrawn' => (float)$wallet['total_withdrawn'],
        'total_withdrawn' => (float)$wallet['total_withdrawn'],
        'referralIncome' => (float)$wallet['referral_income'],
        'referral_income' => (float)$wallet['referral_income'],
        'globalIncome' => (float)$wallet['global_income'],
        'global_income' => (float)$wallet['global_income'],
        'adsenseIncome' => (float)$wallet['adsense_income'],
        'adsense_income' => (float)$wallet['adsense_income'],
        'affiliateIncome' => (float)$wallet['affiliate_income'],
        'affiliate_income' => (float)$wallet['affiliate_income'],
        'updatedAt' => $wallet['updated_at'],
    ];
}

jsonResponse(['success' => true, 'wallet' => $wallet]);
