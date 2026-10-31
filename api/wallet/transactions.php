<?php
/**
 * FaceTube - Wallet Transactions API
 * GET /api/wallet/transactions.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$requestedUserId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

// Strictly derive identity from session token and restrict cross-user access to admins
list($authUser, $userId) = requireAuthUser($pdo, $requestedUserId ?: null);

try {
    $whereLedger = 'WHERE UPPER(user_id) = UPPER(?)';
    $params = [$userId];


    $transactions = [];
    try {
        $stmt = $pdo->prepare("
            SELECT id, transaction_id, user_id, source_user_id, source_user_name, video_id, 
                   income_type, amount, status, special_tag, description,
                   batch_id, payout_method, beneficiary_details, created_at
            FROM income_ledger 
            {$whereLedger} 
            ORDER BY created_at DESC 
            LIMIT 50
        ");
        $stmt->execute($params);
        $transactions = $stmt->fetchAll();
    } catch (PDOException $eLedger) {
        // Fallback to legacy income_ledger columns if new columns not yet migrated
        try {
            $stmt = $pdo->prepare("
                SELECT id, transaction_id, user_id, source_user_id, source_user_name, video_id, 
                       income_type, amount, status, special_tag, description, created_at
                FROM income_ledger 
                {$whereLedger} 
                ORDER BY created_at DESC 
                LIMIT 50
            ");
            $stmt->execute($params);
            $transactions = $stmt->fetchAll();
        } catch (PDOException $eLedgerLegacy) {
            // Fallback to wallet_transactions if income_ledger is not present
            try {
                $stmt2 = $pdo->prepare("SELECT * FROM wallet_transactions {$whereLedger} ORDER BY created_at DESC LIMIT 50");
                $stmt2->execute($params);
                $transactions = $stmt2->fetchAll();
            } catch (PDOException $e2) {
                $transactions = [];
            }
        }
    }

    $mapped = array_map(function ($tx) {
        return [
            'id' => $tx['id'] ?? ('tx_' . uniqid()),
            'transactionId' => $tx['transaction_id'] ?? ($tx['id'] ?? ''),
            'userId' => $tx['user_id'] ?? '',
            'sourceUserId' => $tx['source_user_id'] ?? null,
            'sourceUserName' => $tx['source_user_name'] ?? null,
            'videoId' => $tx['video_id'] ?? null,
            'incomeType' => $tx['income_type'] ?? ($tx['type'] ?? 'referral_income'),
            'amount' => floatval($tx['amount'] ?? 0),
            'status' => $tx['status'] ?? 'settled',
            'specialTag' => $tx['special_tag'] ?? null,
            'description' => $tx['description'] ?? 'Transaction',
            'batchId' => $tx['batch_id'] ?? null,
            'batch_id' => $tx['batch_id'] ?? null,
            'payoutMethod' => $tx['payout_method'] ?? null,
            'payout_method' => $tx['payout_method'] ?? null,
            'beneficiaryDetails' => $tx['beneficiary_details'] ?? null,
            'beneficiary_details' => $tx['beneficiary_details'] ?? null,
            'createdAt' => $tx['created_at'] ?? date('c'),
        ];
    }, $transactions);

    jsonResponse([
        'success' => true,
        'transactions' => $mapped,
        'total' => count($mapped)
    ]);
} catch (Exception $e) {
    jsonResponse(['success' => true, 'transactions' => [], 'total' => 0]);
}
