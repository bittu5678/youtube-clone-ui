<?php
/**
 * FaceTube - Team Members API (Levels 1–10)
 * GET /api/referrals/team.php
 *
 * Parameters:
 *   - userId / user_id: string (optional, admin only for cross-user)
 *   - level: string / int ('all' or 1..10, optional)
 *
 * Security:
 *   - Bearer session authentication enforced via requireAuthUser
 *   - Never exposes password hashes, session tokens, reset tokens, KYC, or bank info
 *   - Cycle-safe multi-level downline traversal
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';
require_once __DIR__ . '/downline.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$requestedUserId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

// Strictly derive identity from session token and restrict cross-user access to admins
list($authUser, $userId) = requireAuthUser($pdo, $requestedUserId ?: null);

try {
    $stmtUser = $pdo->prepare('SELECT id, user_id, name, referral_code, mobile FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();

    $emptyLevels = [];
    for ($i = 1; $i <= 10; $i++) {
        $emptyLevels[$i] = 0;
    }

    if (!$user) {
        jsonResponse([
            'success' => true,
            'userId' => $userId,
            'totalTeamCount' => 0,
            'directCount' => 0,
            'levelCounts' => $emptyLevels,
            'members' => [],
        ]);
        exit;
    }

    $userNormId = $user['user_id'];

    $downline = calculateDownlineLevels($pdo, $userNormId, 10);

    // Filter by level if specified
    $rawLevel = trim($_GET['level'] ?? 'all');
    $membersToReturn = $downline['sanitizedMembers'];

    if (!empty($rawLevel) && strtolower($rawLevel) !== 'all') {
        $filterLevel = intval($rawLevel);
        if ($filterLevel >= 1 && $filterLevel <= 10) {
            $membersToReturn = array_values(array_filter($membersToReturn, function ($m) use ($filterLevel) {
                return intval($m['level']) === $filterLevel;
            }));
        }
    }

    jsonResponse([
        'success' => true,
        'userId' => $userNormId,
        'totalTeamCount' => $downline['totalTeamCount'],
        'directCount' => $downline['directCount'],
        'levelCounts' => $downline['levelCounts'],
        'members' => $membersToReturn,
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
