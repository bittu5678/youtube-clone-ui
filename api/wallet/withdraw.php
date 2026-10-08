<?php
/**
 * FaceTube - Wallet Payout Withdrawal API
 * POST /api/wallet/withdraw.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$userId = strtoupper(trim($input['userId'] ?? ($input['user_id'] ?? '')));
$amount = (float)($input['amount'] ?? 0);
$bankDetails = $input['bankDetails'] ?? ($input['bank_details'] ?? []);

if (empty($userId)) {
    jsonResponse(['success' => false, 'error' => 'User identity required.'], 400);
}

if ($amount < 1000) {
    jsonResponse([
        'success' => false,
        'error' => 'Minimum withdrawal amount is ₹1,000. You cannot withdraw less than ₹1,000.'
    ], 400);
}

if ($amount > 10000) {
    jsonResponse([
        'success' => false,
        'error' => 'Maximum daily withdrawal limit is ₹10,000. You cannot withdraw more than ₹10,000 per day.'
    ], 400);
}

try {
    $pdo->beginTransaction();

    // 1. Fetch wallet with row lock (FOR UPDATE)
    $stmtWallet = $pdo->prepare('
        SELECT user_id, balance, total_earned, total_withdrawn, referral_income, global_income, adsense_income, affiliate_income
        FROM wallet_balances
        WHERE UPPER(user_id) = ?
        FOR UPDATE
    ');
    $stmtWallet->execute([$userId]);
    $wallet = $stmtWallet->fetch();

    if (!$wallet) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'error' => 'Wallet not found for this user.'], 404);
    }

    $currentBalance = (float)$wallet['balance'];
    if ($currentBalance < $amount) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'error' => "Insufficient wallet balance. Available balance is ₹" . number_format($currentBalance, 2) . ", requested ₹" . number_format($amount, 2) . "."
        ], 400);
    }

    // 2. Calculate daily withdrawals today
    $today = date('Y-m-d');
    $stmtDaily = $pdo->prepare('
        SELECT COALESCE(SUM(ABS(amount)), 0) AS daily_total
        FROM income_ledger
        WHERE UPPER(user_id) = ?
          AND income_type = "withdrawal"
          AND status != "failed"
          AND DATE(created_at) = ?
    ');
    $stmtDaily->execute([$userId, $today]);
    $alreadyWithdrawnToday = (float)$stmtDaily->fetchColumn();

    if ($alreadyWithdrawnToday >= 10000) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'error' => 'Daily withdrawal limit of ₹10,000 reached. Further withdrawals are blocked until tomorrow.'
        ], 400);
    }

    if ($alreadyWithdrawnToday + $amount > 10000) {
        $remainingLimit = max(0, 10000 - $alreadyWithdrawnToday);
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'error' => "Daily limit exceeded. You have already withdrawn ₹" . number_format($alreadyWithdrawnToday, 2) . " today. You can withdraw at most ₹" . number_format($remainingLimit, 2) . " more today."
        ], 400);
    }

    // 3. Process withdrawal
    $newBalance = max(0, $currentBalance - $amount);
    $newTotalWithdrawn = (float)$wallet['total_withdrawn'] + $amount;

    $upWallet = $pdo->prepare('
        UPDATE wallet_balances
        SET balance = ?, total_withdrawn = ?, updated_at = NOW()
        WHERE UPPER(user_id) = ?
    ');
    $upWallet->execute([$newBalance, $newTotalWithdrawn, $userId]);

    // 4. Create ledger entry
    $txId = 'TX_WD_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(8)), 0, 4);
    $destDesc = !empty($bankDetails['upiId'])
        ? "UPI: " . $bankDetails['upiId']
        : (!empty($bankDetails['accountNumber'])
            ? "Bank: " . ($bankDetails['bankName'] ?? 'Account') . " (****" . substr($bankDetails['accountNumber'], -4) . ")"
            : "Direct Bank Settlement");

    $description = "Withdrawal payout to {$destDesc} - ₹" . number_format($amount, 2);
    $uuid = generateUuid();

    $insLedger = $pdo->prepare('
        INSERT INTO income_ledger (id, transaction_id, user_id, income_type, amount, status, description, created_at)
        VALUES (?, ?, ?, "withdrawal", ?, "settled", ?, NOW())
    ');
    $insLedger->execute([$uuid, $txId, $userId, -$amount, $description]);

    $pdo->commit();

    $transaction = [
        'id' => $uuid,
        'transactionId' => $txId,
        'userId' => $userId,
        'incomeType' => 'withdrawal',
        'amount' => -$amount,
        'status' => 'settled',
        'description' => $description,
        'createdAt' => date('c'),
    ];

    $updatedWallet = [
        'userId' => $userId,
        'balance' => $newBalance,
        'totalEarned' => (float)$wallet['total_earned'],
        'totalWithdrawn' => $newTotalWithdrawn,
        'referralIncome' => (float)$wallet['referral_income'],
        'globalIncome' => (float)$wallet['global_income'],
        'adsenseIncome' => (float)$wallet['adsense_income'],
        'affiliateIncome' => (float)$wallet['affiliate_income'],
        'updatedAt' => date('c'),
    ];

    jsonResponse([
        'success' => true,
        'message' => 'Withdrawal request processed successfully.',
        'transaction' => $transaction,
        'updatedWallet' => $updatedWallet,
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => 'Withdrawal processing failed. ' . $e->getMessage()], 500);
}
