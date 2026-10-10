<?php
/**
 * FaceTube - Referral Dashboard API
 * GET /api/referrals/dashboard.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$requestedUserId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

// Strictly derive identity from session token and restrict cross-user access to admins
list($authUser, $userId) = requireAuthUser($pdo, $requestedUserId ?: null);


try {
    // 1. Get user profile
    $stmtUser = $pdo->prepare('SELECT id, user_id, name, referral_code, mobile FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();

    if (!$user) {
        jsonResponse([
            'success' => true,
            'dashboard' => [
                'userId' => $userId,
                'referralCode' => $userId,
                'referralNumber' => '',
                'referralLink' => 'https://facetube.online/register?ref=' . urlencode($userId),
                'directReferralsCount' => 0,
                'teamMembersCount' => 0,
                'referralIncome' => 0.00,
                'directReferralIncome' => 0.00,
                'totalReferralIncome' => 0.00,
                'members' => [],
                'referralMembers' => [],
            ]
        ]);
        exit;
    }

    $referralCode = !empty($user['referral_code']) ? $user['referral_code'] : $user['user_id'];
    $userNormId = $user['user_id'];

    // 2. Direct referrals (users registered with this user referral code or user_id)
    $stmtDirect = $pdo->prepare('
        SELECT id, user_id, name, email, mobile, created_at, role
        FROM users
        WHERE (UPPER(referral_code) = UPPER(?) OR UPPER(referral_code) = UPPER(?))
          AND UPPER(user_id) != UPPER(?)
        ORDER BY created_at DESC
    ');
    $stmtDirect->execute([$referralCode, $userNormId, $userNormId]);
    $directReferrals = $stmtDirect->fetchAll();

    $directCount = count($directReferrals);
    $teamCount = $directCount;

    // 3. Fetch actual earned referral income from wallet_balances
    $stmtWallet = $pdo->prepare('SELECT referral_income FROM wallet_balances WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
    $stmtWallet->execute([$userNormId]);
    $walletRow = $stmtWallet->fetch();
    $referralIncome = floatval($walletRow['referral_income'] ?? 0.00);

    // 4. Calculate member details from actual uploaded video records
    $members = [];
    $stmtVideos = $pdo->prepare('
        SELECT video_type, payment_status, COUNT(*) as cnt
        FROM uploaded_videos
        WHERE UPPER(user_id) = UPPER(?)
        GROUP BY video_type, payment_status
    ');

    foreach ($directReferrals as $r) {
        $mUserId = $r['user_id'];
        $stmtVideos->execute([$mUserId]);
        $vRows = $stmtVideos->fetchAll();

        $freeCount = 0;
        $premiumPaidCount = 0;
        foreach ($vRows as $vr) {
            $vt = strtolower($vr['video_type'] ?? 'free');
            $ps = strtolower($vr['payment_status'] ?? '');
            $cnt = intval($vr['cnt'] ?? 0);
            if ($vt === 'free') {
                $freeCount += $cnt;
            } elseif ($vt === 'premium' && ($ps === 'paid' || $ps === 'completed' || $ps === 'not_required')) {
                $premiumPaidCount += $cnt;
            }
        }

        // Each eligible paid premium video uploaded by direct referral earns ₹1.00
        $memberComm = floatval($premiumPaidCount * 1.00);

        $members[] = [
            'id' => $r['id'] ?? ('mem_' . $mUserId),
            'userId' => $mUserId,
            'name' => $r['name'],
            'email' => $r['email'],
            'mobile' => $r['mobile'],
            'joinedAt' => $r['created_at'],
            'status' => 'Active',
            'tier' => ($r['role'] === 'admin') ? 'Admin' : 'Creator',
            'freeVideosCount' => $freeCount,
            'premiumVideosCount' => $premiumPaidCount,
            'totalVideosCount' => $freeCount + $premiumPaidCount,
            'directCommissionEarned' => $memberComm,
            'contribution' => $memberComm,
            'access' => 'Granted',
        ];
    }

    jsonResponse([
        'success' => true,
        'dashboard' => [
            'userId' => $userNormId,
            'referralCode' => $referralCode,
            'referralNumber' => $user['mobile'] ?? '',
            'referralLink' => 'https://facetube.online/register?ref=' . urlencode($referralCode),
            'directReferralsCount' => $directCount,
            'teamMembersCount' => $teamCount,
            'referralIncome' => $referralIncome,
            'directReferralIncome' => $referralIncome,
            'totalReferralIncome' => $referralIncome,
            'members' => $members,
            'referralMembers' => $members,
        ]
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
