<?php
/**
 * FaceTube - Referral Dashboard API
 * GET /api/referrals/dashboard.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$userId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

if (empty($userId)) {
    $authUser = getAuthUser($pdo);
    $userId = $authUser ? $authUser['user_id'] : 'FT102857';
}

try {
    // 1. Get user profile
    $stmtUser = $pdo->prepare('SELECT id, user_id, referral_code FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();

    $referralCode = $user['referral_code'] ?? 'FTVIP';

    // 2. Direct referrals (users registered with this user referral code or user_id)
    $stmtDirect = $pdo->prepare('
        SELECT user_id, name, created_at, role
        FROM users
        WHERE referral_code = ? OR referral_code = ?
        ORDER BY created_at DESC
    ');
    $stmtDirect->execute([$referralCode, $userId]);
    $directReferrals = $stmtDirect->fetchAll();

    $directCount = count($directReferrals);
    $teamCount = $directCount * 4; // Simulated multi-tier matrix

    $directIncome = $directCount * 500.00;
    $teamIncome = $teamCount * 150.00;
    $totalReferralIncome = $directIncome + $teamIncome;

    $members = array_map(function ($r, $idx) {
        return [
            'userId' => $r['user_id'],
            'name' => $r['name'],
            'joinedAt' => $r['created_at'],
            'level' => 1,
            'status' => 'active',
            'contribution' => 500,
        ];
    }, $directReferrals, array_keys($directReferrals));

    jsonResponse([
        'success' => true,
        'dashboard' => [
            'userId' => $userId,
            'referralCode' => $referralCode,
            'directReferralsCount' => $directCount,
            'teamMembersCount' => $teamCount,
            'directReferralIncome' => $directIncome,
            'teamIncome' => $teamIncome,
            'totalReferralIncome' => $totalReferralIncome,
            'referralMembers' => $members,
        ]
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
