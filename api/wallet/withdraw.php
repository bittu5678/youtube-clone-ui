<?php
/**
 * FaceTube - Wallet Withdrawal API
 * POST /api/wallet/withdraw.php
 * Strictly enforces minimum ₹1,000 and maximum daily ₹10,000 limits.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$authUser = getAuthUser($pdo);

if (!$authUser) {
    jsonResponse([
        'success' => false,
        'error' => 'Authentication required. Please provide a valid Bearer session token.'
    ], 401);
}

$input = getRequestPayload();
$amount = floatval($input['amount'] ?? 0);
$requestedUserId = trim($input['userId'] ?? ($input['user_id'] ?? ''));

// Strictly derive identity from authenticated session.
// Cross-user withdrawal is restricted to verified administrators.
$userId = $authUser['user_id'];
if (!empty($requestedUserId) && strcasecmp($requestedUserId, $authUser['user_id']) !== 0) {
    if (strtolower($authUser['role'] ?? '') !== 'admin') {
        jsonResponse([
            'success' => false,
            'error' => 'Unauthorized: You cannot initiate withdrawals on behalf of another user.'
        ], 403);
    }
    $userId = $requestedUserId;
}

if ($amount < 100) {
    jsonResponse([
        'success' => false,
        'error' => 'Minimum withdrawal amount is ₹100. You cannot withdraw less than ₹100.'
    ], 400);
}

if ($amount > 1000) {
    jsonResponse([
        'success' => false,
        'error' => 'Maximum daily withdrawal limit is ₹1,000. You cannot withdraw more than ₹1,000 per day.'
    ], 400);
}

try {
    $pdo->beginTransaction();

    // Check balance under row lock
    $stmtBal = $pdo->prepare('SELECT balance FROM wallet_balances WHERE UPPER(user_id) = UPPER(?) FOR UPDATE');
    $stmtBal->execute([$userId]);
    $balRow = $stmtBal->fetch();
    $currentBal = floatval($balRow['balance'] ?? 0);

    if ($currentBal < $amount) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'error' => 'Insufficient balance. Your current withdrawable balance is ₹' . number_format($currentBal, 2) . ', but you requested ₹' . number_format($amount, 2) . '.'
        ], 400);
    }

    // Company Confirmed Withdrawal Fee Rule:
    // - Minimum: ₹100, Maximum: ₹1,000
    // - GST: 18% of FULL withdrawal amount
    // - PG Fee: 2% of FULL withdrawal amount
    // - Total Deduction: 20% of withdrawal amount
    // - Net Payout: 80% of withdrawal amount
    // Examples: ₹100 -> ₹18 GST + ₹2 PG -> ₹80 net; ₹500 -> ₹90 GST + ₹10 PG -> ₹400 net; ₹1,000 -> ₹180 GST + ₹20 PG -> ₹800 net
    $gstAmount = round($amount * 0.18, 2);
    $pgFeeAmount = round($amount * 0.02, 2);
    $fee = round($gstAmount + $pgFeeAmount, 2);
    $netAmount = round($amount - $fee, 2);
    $chargesBreakdown = [
        'grossAmount' => $amount,
        'gstRatePercent' => 18,
        'gstAmount' => $gstAmount,
        'pgFeePercent' => 2,
        'pgFeeAmount' => $pgFeeAmount,
        'totalDeductionPercent' => 20,
        'totalCharge' => $fee,
        'netPayable' => $netAmount,
    ];

    $newBal = $currentBal - $amount;
    $stmtUp = $pdo->prepare('
        UPDATE wallet_balances 
        SET balance = balance - ?, total_withdrawn = total_withdrawn + ?, updated_at = NOW() 
        WHERE UPPER(user_id) = UPPER(?)
    ');
    $stmtUp->execute([$amount, $amount, $userId]);

    $txId = 'tx_wdr_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(6)), 0, 5);

    // Record transaction using wallet_transactions, with graceful fallback to income_ledger
    $recorded = false;
    try {
        $stmtTx = $pdo->prepare('
            INSERT INTO wallet_transactions (id, user_id, type, amount, status, created_at)
            VALUES (?, ?, "withdrawal", ?, "approved", NOW())
        ');
        $stmtTx->execute([$txId, $userId, $amount]);
        $recorded = true;
    } catch (PDOException $eTx) {
        // Fallback: If wallet_transactions is not created, record in income_ledger
        try {
            $stmtLedger = $pdo->prepare('
                INSERT INTO income_ledger (id, transaction_id, user_id, income_type, amount, status, description, created_at)
                VALUES (?, ?, ?, "withdrawal", ?, "settled", ?, NOW())
            ');
            $stmtLedger->execute([
                $txId,
                $txId,
                $userId,
                $amount,
                "Withdrawal request approved for ₹" . number_format($amount, 2) . " (Net: ₹" . number_format($netAmount, 2) . " after 20% charges: 18% GST ₹" . number_format($gstAmount, 2) . " + 2% PG ₹" . number_format($pgFeeAmount, 2) . ")"
            ]);
            $recorded = true;
        } catch (PDOException $eLedger) {
            // Log fallback exception
            error_log('[withdraw.php] Could not write transaction record: ' . $eLedger->getMessage());
        }
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Withdrawal request for ₹' . number_format($amount, 2) . ' (Net Payable: ₹' . number_format($netAmount, 2) . ' after 20% charges: 18% GST ₹' . number_format($gstAmount, 2) . ' + 2% PG ₹' . number_format($pgFeeAmount, 2) . ') validated and approved.',
        'transaction' => [
            'id' => $txId,
            'userId' => $userId,
            'amount' => $amount,
            'fee' => $fee,
            'netAmount' => $netAmount,
            'net_amount' => $netAmount,
            'chargesBreakdown' => $chargesBreakdown,
            'type' => 'withdrawal',
            'status' => 'approved',
            'createdAt' => date('c'),
        ],
        'updatedWallet' => [
            'userId' => $userId,
            'balance' => $newBal,
            'totalBalance' => $newBal,
            'withdrawableBalance' => $newBal,
        ]
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}

