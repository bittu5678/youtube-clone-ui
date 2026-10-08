<?php
/**
 * FaceTube - Persistent Premium Transactions Audit Log API
 * GET /api/payments/transactions.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();

$stmtLast = $pdo->query('SELECT COALESCE(MAX(tx_number), 10) AS last_tx FROM premium_transactions');
$lastTxNumber = (int)$stmtLast->fetchColumn();

$stmt = $pdo->query('
    SELECT tx_number, payment_id, order_id, video_id, user_id, referrer_id, amount,
           transaction_type, is_special, special_tag, referral_commission,
           admin_allocation, global_pool_allocation, created_at
    FROM premium_transactions
    ORDER BY tx_number DESC
    LIMIT 100
');
$rows = $stmt->fetchAll();

$transactions = array_map(function ($r) {
    return [
        'txNumber' => (int)$r['tx_number'],
        'paymentId' => $r['payment_id'],
        'orderId' => $r['order_id'],
        'videoId' => $r['video_id'],
        'userId' => $r['user_id'],
        'referrerId' => $r['referrer_id'],
        'amount' => (float)$r['amount'],
        'transactionType' => $r['transaction_type'],
        'isSpecial' => (bool)$r['is_special'],
        'specialTag' => $r['special_tag'],
        'referralCommission' => (float)$r['referral_commission'],
        'adminAllocation' => (float)$r['admin_allocation'],
        'globalPoolAllocation' => (float)$r['global_pool_allocation'],
        'createdAt' => $r['created_at'],
    ];
}, $rows);

jsonResponse([
    'status' => 'ok',
    'lastTxNumber' => $lastTxNumber,
    'totalTransactions' => count($transactions),
    'transactions' => $transactions,
]);
