<?php
/**
 * FaceTube - User Ledger Transactions API
 * GET /api/wallet/transactions.php?userId={userId}
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$userId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

if (empty($userId)) {
    $authUser = getAuthUser($pdo);
    if ($authUser) {
        $userId = $authUser['user_id'];
    }
}

if (empty($userId)) {
    jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
}

$limit = max(1, min(100, intval($_GET['limit'] ?? 50)));

$stmt = $pdo->prepare('
    SELECT id, transaction_id, user_id, source_user_id, source_user_name, video_id, income_type, amount, status, special_tag, description, created_at
    FROM income_ledger
    WHERE UPPER(user_id) = UPPER(?)
    ORDER BY created_at DESC
    LIMIT ?
');
$stmt->bindValue(1, $userId, PDO::PARAM_STR);
$stmt->bindValue(2, $limit, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll();

$transactions = array_map(function ($r) {
    return [
        'id' => $r['id'],
        'transactionId' => $r['transaction_id'],
        'transaction_id' => $r['transaction_id'],
        'userId' => $r['user_id'],
        'user_id' => $r['user_id'],
        'sourceUserId' => $r['source_user_id'],
        'sourceUserName' => $r['source_user_name'],
        'videoId' => $r['video_id'],
        'incomeType' => $r['income_type'],
        'income_type' => $r['income_type'],
        'amount' => (float)$r['amount'],
        'status' => $r['status'],
        'specialTag' => $r['special_tag'],
        'description' => $r['description'],
        'createdAt' => $r['created_at'],
        'created_at' => $r['created_at'],
    ];
}, $rows);

jsonResponse(['success' => true, 'transactions' => $transactions, 'total' => count($transactions)]);
