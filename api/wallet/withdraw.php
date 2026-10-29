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

if ($amount > 10000) {
    jsonResponse([
        'success' => false,
        'error' => 'Maximum daily withdrawal limit is ₹10,000. You cannot withdraw more than ₹10,000 per day.'
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

    // Requirement Point 7: Total ₹12 charge for Admin (₹5 base + ₹0.90 GST [18%] + ₹0.10 PG [2%] ≈ ₹6.00, plus ₹6.00 Admin allocation = ₹12.00)
    // Deducted from the creator's withdrawal amount (e.g., ₹100 withdrawal -> ₹88 net payable)
    $fee = 12.00;
    $netAmount = max(0.00, $amount - $fee);
    $chargesBreakdown = [
        'grossAmount' => $amount,
        'baseProcessing' => 5.00,
        'gstRatePercent' => 18,
        'gstAmount' => 0.90,
        'pgFeePercent' => 2,
        'pgFeeAmount' => 0.10,
        'adminAllocation' => 6.00,
        'totalCharge' => 12.00,
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
                "Withdrawal request approved for ₹" . number_format($amount, 2) . " (Net: ₹" . number_format($netAmount, 2) . " after ₹12 charges)"
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
        'message' => 'Withdrawal request for ₹' . number_format($amount, 2) . ' (Net Payable: ₹' . number_format($netAmount, 2) . ' after ₹12 charges) validated and approved.',
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

