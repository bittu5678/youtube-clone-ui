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
            continue;
        }

        if (empty($txId)) {
            $txId = 'tx_wdr_bulk_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(4)), 0, 4);
            $stmtInsert = $pdo->prepare('
                INSERT INTO wallet_transactions (id, user_id, batch_id, type, amount, status, payout_method, created_at)
                VALUES (?, ?, ?, "withdrawal", ?, "completed", "bulk_bank_transfer", NOW())
            ');
            $stmtInsert->execute([$txId, $userId, $batchId, $amount]);
        } else {
            $stmtUpdate = $pdo->prepare('
                UPDATE wallet_transactions
                SET status = "completed", batch_id = ?, updated_at = NOW()
                WHERE id = ?
            ');
            $stmtUpdate->execute([$batchId, $txId]);
        }

        // Deduct from wallet balance & record total withdrawn
        $stmtWallet = $pdo->prepare('
            UPDATE wallet_balances
            SET balance = GREATEST(0, balance - ?),
                total_withdrawn = total_withdrawn + ?,
                updated_at = NOW()
            WHERE user_id = ?
        ');
        $stmtWallet->execute([$amount, $amount, $userId]);

        $totalProcessed++;
        $totalAmount += $amount;
        $processedItems[] = [
            'transaction_id' => $txId,
            'user_id' => $userId,
            'amount' => $amount,
            'status' => 'completed',
        ];
    }

    // Insert payout batch record
    $stmtBatch = $pdo->prepare('
        INSERT INTO payout_batches (id, admin_user_id, total_recipients, total_amount, status, notes, created_at)
        VALUES (?, ?, ?, ?, "completed", ?, NOW())
    ');
    $stmtBatch->execute([$batchId, $authUser['user_id'] ?? 'ADMIN', $totalProcessed, $totalAmount, $notes]);

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
