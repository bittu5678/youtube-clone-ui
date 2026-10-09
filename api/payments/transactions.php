<?php
/**
 * FaceTube - List Payment Transactions API
 * GET /api/payments/transactions.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query('
        SELECT * FROM payment_transactions
        ORDER BY tx_number DESC
        LIMIT 50
    ');
    $rows = $stmt->fetchAll();

    $lastTxNumber = !empty($rows) ? intval($rows[0]['tx_number']) : 10;

    jsonResponse([
        'status' => 'ok',
        'lastTxNumber' => $lastTxNumber,
        'totalTransactions' => count($rows),
        'transactions' => $rows,
    ]);
} catch (PDOException $e) {
    jsonResponse([
        'status' => 'ok',
        'lastTxNumber' => 10,
        'totalTransactions' => 0,
        'transactions' => [],
    ]);
}
