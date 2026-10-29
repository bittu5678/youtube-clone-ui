<?php
/**
 * FaceTube - Referral Dashboard API
 * GET /api/referrals/dashboard.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';
require_once __DIR__ . '/downline.php';

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
        $emptyLevels = [];
        for ($i = 1; $i <= 10; $i++) {
            $emptyLevels[$i] = 0;
        }
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
                'levelCounts' => $emptyLevels,
            ]
        ]);
        exit;
    }

    $userNormId = $user['user_id'];
    $knownAliases = getKnownPromotionalAliases();
    $shareCode = (isset($knownAliases[strtoupper($userNormId)]) && !empty($knownAliases[strtoupper($userNormId)][0]))
        ? $knownAliases[strtoupper($userNormId)][0]
        : $userNormId;

    // 2. Real cycle-safe multi-level downline calculation across Levels 1–10
    // Uses user_id and verified promotional aliases to match genuine direct referrals
    $downline = calculateDownlineLevels($pdo, $userNormId, 10);
    $directCount = $downline['directCount'];
    $totalTeamCount = $downline['totalTeamCount'];

    // Direct referrals list for video earnings calculation
    $directReferrals = $downline['membersByLevel'][1] ?? [];

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
        $mUserId = $r['user_id'] ?? ($r['userId'] ?? '');
        if (empty($mUserId)) continue;
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
            'email' => $r['email'] ?? '',
            'mobile' => $r['mobile'] ?? '',
            'joinedAt' => $r['created_at'] ?? ($r['joinedAt'] ?? 'Recent'),
            'status' => 'Active',
            'tier' => (($r['role'] ?? 'user') === 'admin') ? 'Admin' : 'Creator',
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
            'referralCode' => $shareCode,
            'referralNumber' => $user['mobile'] ?? '',
            'referralLink' => 'https://facetube.online/register?ref=' . urlencode($shareCode),
            'directReferralsCount' => $directCount,
            'teamMembersCount' => $totalTeamCount,
            'referralIncome' => $referralIncome,
            'directReferralIncome' => $referralIncome,
            'totalReferralIncome' => $referralIncome,
            'levelCounts' => $downline['levelCounts'],
            'members' => $members,
            'referralMembers' => $members,
        ]
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
