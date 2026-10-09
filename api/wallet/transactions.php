<?php
/**
 * FaceTube - Wallet Transactions API
 * GET /api/wallet/transactions.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$userId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

try {
    $where = '';
    $params = [];
    if (!empty($userId)) {
        $where = 'WHERE UPPER(user_id) = UPPER(?)';
        $params[] = $userId;
    }

    $stmt = $pdo->prepare("SELECT * FROM wallet_transactions {$where} ORDER BY created_at DESC LIMIT 50");
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'transactions' => $transactions,
        'total' => count($transactions)
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => true, 'transactions' => [], 'total' => 0]);
}
