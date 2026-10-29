<?php
/**
 * FaceTube - Admin Bulk Withdrawal Payouts API
 * POST /api/admin/bulk-payout.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$authUser = getAuthUser($pdo);

if (!$authUser || strtolower($authUser['role'] ?? '') !== 'admin') {
    jsonResponse(['success' => false, 'error' => 'Admin authorization required'], 403);
}

$input = getRequestPayload();
$payouts = $input['payouts'] ?? [];
$notes = trim($input['notes'] ?? 'Batch disbursement approved by admin');

if (!is_array($payouts) || empty($payouts)) {
    jsonResponse(['success' => false, 'error' => 'No payouts specified for bulk execution'], 400);
}

$batchId = 'batch_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(6)), 0, 5);
$totalProcessed = 0;
$totalAmount = 0.0;
$processedItems = [];

try {
    $pdo->beginTransaction();

    foreach ($payouts as $item) {
        $userId = trim($item['user_id'] ?? ($item['userId'] ?? ''));
        $amount = floatval($item['amount'] ?? 0);
        $txId = trim($item['transaction_id'] ?? ($item['id'] ?? ''));

        if (empty($userId) || $amount <= 0) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'error' => 'Each payout item must specify a valid user_id and an amount greater than zero.'], 400);
        }

        if (!empty($txId)) {
            // Case 1: Settling an existing withdrawal request already debited at request time in withdraw.php
            // Check that the transaction actually exists and verify ownership & status
            $existingTx = null;
            $tableName = 'wallet_transactions';
            try {
                $stmtCheck = $pdo->prepare('SELECT id, user_id, amount, status FROM wallet_transactions WHERE id = ? FOR UPDATE');
                $stmtCheck->execute([$txId]);
                $existingTx = $stmtCheck->fetch();
            } catch (PDOException $eCheck) {
                // Table might not exist or error, attempt income_ledger
            }

            if (!$existingTx) {
                try {
                    $stmtCheckLedger = $pdo->prepare('SELECT id, transaction_id, user_id, amount, status FROM income_ledger WHERE transaction_id = ? OR id = ? FOR UPDATE');
                    $stmtCheckLedger->execute([$txId, $txId]);
                    $existingTx = $stmtCheckLedger->fetch();
                    if ($existingTx) {
                        $tableName = 'income_ledger';
                    }
                } catch (PDOException $eLedger) {
                    // Ignore
                }
            }

            if (!$existingTx) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'error' => "Invalid transaction ID '{$txId}': Transaction not found."], 404);
            }

            // Ownership / Authorization check
            if (strcasecmp($existingTx['user_id'], $userId) !== 0) {
                $pdo->rollBack();
                jsonResponse([
                    'success' => false,
                    'error' => "Authorization mismatch: Transaction '{$txId}' belongs to user '{$existingTx['user_id']}', not requested user '{$userId}'."
                ], 403);
            }

            // Status check: reject already completed/disbursed transactions to prevent replay
            if (strtolower($existingTx['status'] ?? '') === 'completed') {
                $pdo->rollBack();
                jsonResponse([
                    'success' => false,
                    'error' => "Transaction '{$txId}' has already been marked as completed."
                ], 400);
            }

            // Update transaction status to completed and assign batch_id
            if ($tableName === 'wallet_transactions') {
                $stmtUpdate = $pdo->prepare('
                    UPDATE wallet_transactions
                    SET status = "completed", batch_id = ?, updated_at = NOW()
                    WHERE id = ?
                ');
                $stmtUpdate->execute([$batchId, $txId]);
            } else {
                $stmtUpdate = $pdo->prepare('
                    UPDATE income_ledger
                    SET status = "settled"
                    WHERE transaction_id = ? OR id = ?
                ');
                $stmtUpdate->execute([$txId, $txId]);
            }

            // NOTE: Do NOT deduct from wallet_balances here!
            // The creator's wallet balance was already debited when the withdrawal request was created in withdraw.php.
            $payoutAmount = floatval($existingTx['amount'] ?? $amount);
            $totalProcessed++;
            $totalAmount += $payoutAmount;
            $processedItems[] = [
                'transaction_id' => $txId,
                'user_id' => $userId,
                'amount' => $payoutAmount,
                'status' => 'completed',
                'deduction_type' => 'settled_existing_request',
            ];
        } else {
            // Case 2: Legitimate new direct bulk payout created directly by admin without prior withdrawal request
            // Check balance under row lock
            $stmtBal = $pdo->prepare('SELECT balance FROM wallet_balances WHERE UPPER(user_id) = UPPER(?) FOR UPDATE');
            $stmtBal->execute([$userId]);
            $balRow = $stmtBal->fetch();
            $currentBal = floatval($balRow['balance'] ?? 0);

            if ($currentBal < $amount) {
                $pdo->rollBack();
                jsonResponse([
                    'success' => false,
                    'error' => "Insufficient balance for direct payout to user '{$userId}'. Available: ₹" . number_format($currentBal, 2) . ", requested: ₹" . number_format($amount, 2) . '.'
                ], 400);
            }

            $txId = 'tx_wdr_bulk_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(4)), 0, 4);
            try {
                $stmtInsert = $pdo->prepare('
                    INSERT INTO wallet_transactions (id, user_id, batch_id, type, amount, status, payout_method, created_at)
                    VALUES (?, ?, ?, "withdrawal", ?, "completed", "bulk_bank_transfer", NOW())
                ');
                $stmtInsert->execute([$txId, $userId, $batchId, $amount]);
            } catch (PDOException $eIns) {
                $stmtLedger = $pdo->prepare('
                    INSERT INTO income_ledger (id, transaction_id, user_id, income_type, amount, status, description, created_at)
                    VALUES (?, ?, ?, "withdrawal", ?, "settled", ?, NOW())
                ');
                $stmtLedger->execute([$txId, $txId, $userId, $amount, "Direct bulk payout disbursement (Batch {$batchId})"]);
            }

            // Deduct exactly once for new direct payout
            $stmtWallet = $pdo->prepare('
                UPDATE wallet_balances
                SET balance = balance - ?,
                    total_withdrawn = total_withdrawn + ?,
                    updated_at = NOW()
                WHERE UPPER(user_id) = UPPER(?)
            ');
            $stmtWallet->execute([$amount, $amount, $userId]);

            $totalProcessed++;
            $totalAmount += $amount;
            $processedItems[] = [
                'transaction_id' => $txId,
                'user_id' => $userId,
                'amount' => $amount,
                'status' => 'completed',
                'deduction_type' => 'new_direct_disbursement',
            ];
        }
    }

    // Insert payout batch record
    try {
        $stmtBatch = $pdo->prepare('
            INSERT INTO payout_batches (id, admin_user_id, total_recipients, total_amount, status, notes, created_at)
            VALUES (?, ?, ?, ?, "completed", ?, NOW())
        ');
        $stmtBatch->execute([$batchId, $authUser['user_id'] ?? 'ADMIN', $totalProcessed, $totalAmount, $notes]);
    } catch (PDOException $eBatch) {
        // Table optional if migration pending
        error_log('[bulk-payout.php] payout_batches record note: ' . $eBatch->getMessage());
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => "Bulk payout completed for {$totalProcessed} recipients totaling ₹" . number_format($totalAmount, 2),
        'batch_id' => $batchId,
        'total_recipients' => $totalProcessed,
        'total_amount' => $totalAmount,
        'processed' => $processedItems,
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => 'Bulk payout failed: ' . $e->getMessage()], 500);
}
