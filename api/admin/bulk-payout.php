<?php
/**
 * FaceTube - Admin Bulk Withdrawal Payouts API
 * POST /api/admin/bulk-payout.php
 *
 * Implements safe internal chunking (batches of 50–100 users),
 * reliable progress tracking, duplicate payout prevention,
 * idempotent retry for failed items, and atomic per-chunk transactions.
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

// Configurable chunk size (50–100 users per chunk, default: 50)
$chunkSize = intval($input['chunk_size'] ?? ($input['chunkSize'] ?? 50));
if ($chunkSize < 10 || $chunkSize > 100) {
    $chunkSize = 50;
}

$inputBatchId = trim($input['batch_id'] ?? ($input['batchId'] ?? ''));
$batchId = !empty($inputBatchId) ? $inputBatchId : ('batch_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(6)), 0, 5));

$chunks = array_chunk($payouts, $chunkSize);
$totalChunks = count($chunks);
$chunksProcessed = 0;
$totalProcessed = 0;
$totalAmount = 0.0;
$processedItems = [];

// Initialize or update payout batch record as 'processing' for progress tracking
try {
    $stmtInitBatch = $pdo->prepare('
        INSERT INTO payout_batches (id, admin_user_id, total_recipients, total_amount, status, notes, created_at)
        VALUES (?, ?, ?, 0.00, "processing", ?, NOW())
        ON DUPLICATE KEY UPDATE status = "processing", notes = VALUES(notes)
    ');
    $stmtInitBatch->execute([$batchId, $authUser['user_id'] ?? 'ADMIN', count($payouts), $notes]);
} catch (PDOException $eBatchInit) {
    // Optional table
    error_log('[bulk-payout.php] Note on batch init: ' . $eBatchInit->getMessage());
}

$fatalHttpCode = 500;

foreach ($chunks as $chunkIndex => $chunk) {
    $chunkBegun = false;
    try {
        $pdo->beginTransaction();
        $chunkBegun = true;

        $chunkProcessed = [];
        $chunkAmount = 0.0;

        foreach ($chunk as $itemIndex => $item) {
            $globalIndex = ($chunkIndex * $chunkSize) + $itemIndex;
            $userId = trim($item['user_id'] ?? ($item['userId'] ?? ''));
            $amount = floatval($item['amount'] ?? 0);
            $txId = trim($item['transaction_id'] ?? ($item['id'] ?? ''));

            if (empty($userId) || $amount <= 0) {
                $fatalHttpCode = 400;
                throw new InvalidArgumentException("Each payout item must specify a valid user_id and an amount greater than zero.", 400);
            }

            if (!empty($txId)) {
                // Case 1: Settling an existing withdrawal request already debited at request time in withdraw.php
                $existingTx = null;
                $tableName = 'wallet_transactions';
                try {
                    $stmtCheck = $pdo->prepare('SELECT id, user_id, amount, status, batch_id FROM wallet_transactions WHERE id = ? FOR UPDATE');
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
                    $fatalHttpCode = 404;
                    throw new RuntimeException("Invalid transaction ID '{$txId}': Transaction not found.", 404);
                }

                // Ownership / Authorization check
                if (strcasecmp($existingTx['user_id'], $userId) !== 0) {
                    $fatalHttpCode = 403;
                    throw new RuntimeException("Authorization mismatch: Transaction '{$txId}' belongs to user '{$existingTx['user_id']}', not requested user '{$userId}'.", 403);
                }

                // Status check: reject already completed/disbursed transactions to prevent replay
                if (strtolower($existingTx['status'] ?? '') === 'completed') {
                    // Idempotent retry: check if it was already marked completed in the SAME batch
                    if (!empty($existingTx['batch_id']) && $existingTx['batch_id'] === $batchId) {
                        $payoutAmount = floatval($existingTx['amount'] ?? $amount);
                        $chunkProcessed[] = [
                            'transaction_id' => $txId,
                            'user_id' => $userId,
                            'amount' => $payoutAmount,
                            'status' => 'completed',
                            'deduction_type' => 'settled_existing_request',
                            'idempotent_replay' => true,
                        ];
                        $chunkAmount += $payoutAmount;
                        continue;
                    }

                    // Otherwise, transaction was completed in a different batch or prior event -> Duplicate/Replay rejection
                    $fatalHttpCode = 400;
                    throw new RuntimeException("Transaction '{$txId}' has already been marked as completed.", 400);
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
                $chunkProcessed[] = [
                    'transaction_id' => $txId,
                    'user_id' => $userId,
                    'amount' => $payoutAmount,
                    'status' => 'completed',
                    'deduction_type' => 'settled_existing_request',
                ];
                $chunkAmount += $payoutAmount;
            } else {
                // Case 2: Legitimate new direct bulk payout created directly by admin without prior withdrawal request
                // Deterministic ID based on batch_id and item global index for idempotent retry safety
                $deterministicTxId = 'tx_wdr_bulk_' . $batchId . '_' . $globalIndex;

                // Check for idempotent retry of this direct payout in the same batch
                try {
                    $stmtCheckDirect = $pdo->prepare('SELECT id, user_id, amount, status FROM wallet_transactions WHERE id = ? AND batch_id = ?');
                    $stmtCheckDirect->execute([$deterministicTxId, $batchId]);
                    $alreadyDirect = $stmtCheckDirect->fetch();

                    if ($alreadyDirect && strtolower($alreadyDirect['status'] ?? '') === 'completed') {
                        $payoutAmount = floatval($alreadyDirect['amount'] ?? $amount);
                        $chunkProcessed[] = [
                            'transaction_id' => $deterministicTxId,
                            'user_id' => $userId,
                            'amount' => $payoutAmount,
                            'status' => 'completed',
                            'deduction_type' => 'new_direct_disbursement',
                            'idempotent_replay' => true,
                        ];
                        $chunkAmount += $payoutAmount;
                        continue;
                    }
                } catch (PDOException $_eDirectCheck) {
                    // Ignore
                }

                // Check balance under row lock
                $stmtBal = $pdo->prepare('SELECT balance FROM wallet_balances WHERE UPPER(user_id) = UPPER(?) FOR UPDATE');
                $stmtBal->execute([$userId]);
                $balRow = $stmtBal->fetch();
                $currentBal = floatval($balRow['balance'] ?? 0);

                if ($currentBal < $amount) {
                    $fatalHttpCode = 400;
                    throw new RuntimeException("Insufficient balance for direct payout to user '{$userId}'. Available: ₹" . number_format($currentBal, 2) . ", requested: ₹" . number_format($amount, 2) . '.', 400);
                }

                $txId = $deterministicTxId;
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

                $chunkProcessed[] = [
                    'transaction_id' => $txId,
                    'user_id' => $userId,
                    'amount' => $amount,
                    'status' => 'completed',
                    'deduction_type' => 'new_direct_disbursement',
                ];
                $chunkAmount += $amount;
            }
        }

        // Commit this chunk transaction
        $pdo->commit();
        $chunkBegun = false;

        $chunksProcessed++;
        $totalProcessed += count($chunkProcessed);
        $totalAmount += $chunkAmount;
        $processedItems = array_merge($processedItems, $chunkProcessed);

    } catch (Throwable $eChunk) {
        if ($chunkBegun && $pdo->inTransaction()) {
            $pdo->rollBack();
        }

        $code = $eChunk->getCode();
        if ($code < 400 || $code > 599) {
            $code = $fatalHttpCode ?: 500;
        }

        // Update batch status in payout_batches
        $failStatus = ($totalProcessed > 0) ? 'partially_completed' : 'failed';
        try {
            $stmtFailBatch = $pdo->prepare('
                UPDATE payout_batches 
                SET total_recipients = ?, total_amount = ?, status = ?, notes = ?
                WHERE id = ?
            ');
            $stmtFailBatch->execute([$totalProcessed, $totalAmount, $failStatus, $notes . ' (Chunk failure: ' . $eChunk->getMessage() . ')', $batchId]);
        } catch (PDOException $_e) {}

        jsonResponse([
            'success' => false,
            'error' => $eChunk->getMessage(),
            'batch_id' => $batchId,
            'chunks_completed' => $chunksProcessed,
            'total_chunks' => $totalChunks,
            'chunk_size' => $chunkSize,
            'total_processed' => $totalProcessed,
            'total_amount' => $totalAmount,
            'failed_chunk_index' => $chunkIndex,
        ], $code);
        exit;
    }
}

// Complete payout batch record
try {
    $stmtBatch = $pdo->prepare('
        INSERT INTO payout_batches (id, admin_user_id, total_recipients, total_amount, status, notes, created_at)
        VALUES (?, ?, ?, ?, "completed", ?, NOW())
        ON DUPLICATE KEY UPDATE 
            total_recipients = VALUES(total_recipients),
            total_amount = VALUES(total_amount),
            status = "completed",
            notes = VALUES(notes)
    ');
    $stmtBatch->execute([$batchId, $authUser['user_id'] ?? 'ADMIN', $totalProcessed, $totalAmount, $notes]);
} catch (PDOException $eBatch) {
    error_log('[bulk-payout.php] payout_batches record note: ' . $eBatch->getMessage());
}

jsonResponse([
    'success' => true,
    'message' => "Bulk payout completed for {$totalProcessed} recipients in {$chunksProcessed} chunks totaling ₹" . number_format($totalAmount, 2),
    'batch_id' => $batchId,
    'total_recipients' => $totalProcessed,
    'total_amount' => $totalAmount,
    'total_chunks' => $totalChunks,
    'chunk_size' => $chunkSize,
    'chunks_processed' => $chunksProcessed,
    'progress' => [
        'total' => count($payouts),
        'processed' => $totalProcessed,
        'successful' => $totalProcessed,
        'failed' => 0,
    ],
    'processed' => $processedItems,
]);
