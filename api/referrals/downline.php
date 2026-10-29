<?php
/**
 * FaceTube - Multi-Level Downline Calculation Helper
 * Levels 1–10 Downline Traversal for PHP / MySQL
 *
 * Guarantees:
 * 1. Strictly limits traversal depth to 10 levels.
 * 2. Cycle-safe: Uses $visitedUserIds hash map to detect and break loops.
 * 3. Prevents self-referral anomalies.
 * 4. Deduplicates members across levels so each member is counted exactly once.
 * 5. Excludes the root user from downline counts.
 * 6. Sponsor-relationship correctness: Direct children are matched strictly by the parent's
 *    user_id (plus verified promotional aliases for established seed accounts).
 *    A registered user's own referral_code (their upline sponsor) is NEVER treated as
 *    their personal referral code, preventing sibling leakage.
 */

if (!function_exists('getKnownPromotionalAliases')) {
    /**
     * Verified promotional referral aliases established in the database schema.
     * Only these accounts have verified promotional codes that differ from their user_id.
     * For all normal users, their personal referral identifier is strictly their own user_id.
     */
    function getKnownPromotionalAliases() {
        return [
            'FT102857' => ['FTVIP'],      // FaceTube Administrator
            'FT483921' => ['CREATOR50'],  // Alex Rivera
        ];
    }
}

if (!function_exists('calculateDownlineLevels')) {
    function calculateDownlineLevels($pdo, $rootUserId, $maxLevels = 10) {
        $rootNorm = strtoupper(trim((string)$rootUserId));

        // Guard against empty root ID
        if (empty($rootNorm)) {
            $emptyLevels = [];
            for ($i = 1; $i <= $maxLevels; $i++) {
                $emptyLevels[$i] = 0;
            }
            return [
                'directCount' => 0,
                'totalTeamCount' => 0,
                'levelCounts' => $emptyLevels,
                'membersByLevel' => array_fill(1, $maxLevels, []),
                'allMembers' => [],
                'sanitizedMembers' => [],
            ];
        }

        // Track visited user IDs to prevent loops, cycles, duplicate counting, and self-referrals
        $visitedUserIds = [$rootNorm => true];

        $membersByLevel = [];
        $allMembers = [];
        $levelCounts = [];
        for ($i = 1; $i <= $maxLevels; $i++) {
            $levelCounts[$i] = 0;
            $membersByLevel[$i] = [];
        }

        $knownAliases = getKnownPromotionalAliases();

        // Determine root user's valid sponsor codes (their own user_id + any verified promotional alias)
        $rootSponsorCodes = [$rootNorm];
        if (isset($knownAliases[$rootNorm])) {
            foreach ($knownAliases[$rootNorm] as $alias) {
                $rootSponsorCodes[] = strtoupper(trim($alias));
            }
        }
        $rootSponsorCodes = array_values(array_unique($rootSponsorCodes));

        // -------------------------------------------------------------
        // Level 1: Direct referrals of root user
        // -------------------------------------------------------------
        $l1Placeholders = implode(',', array_fill(0, count($rootSponsorCodes), '?'));
        $stmtLevel1 = $pdo->prepare("
            SELECT id, user_id, name, email, mobile, created_at, role, referral_code
            FROM users
            WHERE UPPER(referral_code) IN ($l1Placeholders)
              AND UPPER(user_id) != ?
            ORDER BY created_at DESC
        ");
        $l1Params = array_merge($rootSponsorCodes, [$rootNorm]);
        $stmtLevel1->execute($l1Params);
        $l1Rows = $stmtLevel1->fetchAll(PDO::FETCH_ASSOC);

        foreach ($l1Rows as $row) {
            $uId = strtoupper(trim((string)$row['user_id']));
            if (empty($uId) || isset($visitedUserIds[$uId])) {
                continue;
            }
            $visitedUserIds[$uId] = true;

            $memberData = [
                'id' => $row['id'] ?? ('mem_' . $uId),
                'userId' => $row['user_id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'mobile' => $row['mobile'],
                'joinedAt' => $row['created_at'],
                'role' => $row['role'] ?? 'user',
                'rank' => (($row['role'] ?? 'user') === 'admin') ? 'Admin' : 'Creator',
                'level' => 1,
                'sponsor' => 'You',
                'sponsorUserId' => $rootUserId,
                'status' => 'Active',
                'access' => 'Granted',
            ];

            $membersByLevel[1][] = $memberData;
            $allMembers[] = $memberData;
        }

        $levelCounts[1] = count($membersByLevel[1]);
        $directCount = $levelCounts[1];

        // -------------------------------------------------------------
        // Levels 2 to $maxLevels: Hierarchical Breadth-First Traversal
        // -------------------------------------------------------------
        for ($level = 2; $level <= $maxLevels; $level++) {
            $previousLevelMembers = $membersByLevel[$level - 1];
            if (empty($previousLevelMembers)) {
                break;
            }

            // Map each parent's valid sponsor codes to their sponsor metadata
            // ONLY parent's user_id and verified promotional aliases are valid sponsor codes.
            // Parent's own referral_code (their upline) is NEVER registered as a sponsor code!
            $parentCodeToSponsor = [];
            $searchCodes = [];

            foreach ($previousLevelMembers as $pm) {
                $pUserId = trim((string)$pm['userId']);
                $pUserIdUpper = strtoupper($pUserId);
                if (empty($pUserIdUpper)) continue;

                $parentCodeToSponsor[$pUserIdUpper] = [
                    'userId' => $pUserId,
                    'name' => $pm['name']
                ];
                $searchCodes[] = $pUserIdUpper;

                // Support verified promotional alias ONLY if parent is a verified promotional account
                if (isset($knownAliases[$pUserIdUpper])) {
                    foreach ($knownAliases[$pUserIdUpper] as $alias) {
                        $aliasUpper = strtoupper(trim($alias));
                        if (!empty($aliasUpper) && !isset($parentCodeToSponsor[$aliasUpper])) {
                            $parentCodeToSponsor[$aliasUpper] = [
                                'userId' => $pUserId,
                                'name' => $pm['name']
                            ];
                            $searchCodes[] = $aliasUpper;
                        }
                    }
                }
            }

            $searchCodes = array_values(array_unique($searchCodes));
            if (empty($searchCodes)) {
                break;
            }

            // Execute in batches to respect database query parameter limits
            $chunks = array_chunk($searchCodes, 50);
            foreach ($chunks as $chunk) {
                $inPlaceholders = implode(',', array_fill(0, count($chunk), '?'));
                $stmt = $pdo->prepare("
                    SELECT id, user_id, name, email, mobile, created_at, role, referral_code
                    FROM users
                    WHERE UPPER(referral_code) IN ($inPlaceholders)
                    ORDER BY created_at DESC
                ");
                $stmt->execute($chunk);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($rows as $row) {
                    $uId = strtoupper(trim((string)$row['user_id']));
                    if (empty($uId) || isset($visitedUserIds[$uId])) {
                        // Skip duplicates, circular references, and already discovered members
                        continue;
                    }
                    $visitedUserIds[$uId] = true;

                    $refCodeUpper = strtoupper(trim((string)($row['referral_code'] ?? '')));
                    $sponsorInfo = $parentCodeToSponsor[$refCodeUpper] ?? null;
                    $sponsorName = $sponsorInfo ? ($sponsorInfo['name'] . ' (' . $sponsorInfo['userId'] . ')') : 'Downline Sponsor';
                    $sponsorUserId = $sponsorInfo ? $sponsorInfo['userId'] : '';

                    $memberData = [
                        'id' => $row['id'] ?? ('mem_' . $uId),
                        'userId' => $row['user_id'],
                        'name' => $row['name'],
                        'email' => $row['email'],
                        'mobile' => $row['mobile'],
                        'joinedAt' => $row['created_at'],
                        'role' => $row['role'] ?? 'user',
                        'rank' => (($row['role'] ?? 'user') === 'admin') ? 'Admin' : 'Creator',
                        'level' => $level,
                        'sponsor' => $sponsorName,
                        'sponsorUserId' => $sponsorUserId,
                        'status' => 'Active',
                        'access' => 'Granted',
                    ];

                    $membersByLevel[$level][] = $memberData;
                    $allMembers[] = $memberData;
                }
            }

            $levelCounts[$level] = count($membersByLevel[$level]);
        }

        // Calculate each member's personal direct downline count (teamSize)
        $sponsorCounts = [];
        foreach ($allMembers as $m) {
            $sId = strtoupper(trim((string)$m['sponsorUserId']));
            if (!empty($sId)) {
                $sponsorCounts[$sId] = ($sponsorCounts[$sId] ?? 0) + 1;
            }
        }

        // Sanitize members for output (strictly exclude password, hashes, tokens, kyc, bank info)
        $sanitizedMembers = [];
        foreach ($allMembers as $m) {
            $mNorm = strtoupper(trim((string)$m['userId']));
            $sanitizedMembers[] = [
                'id' => $m['id'],
                'userId' => $m['userId'],
                'name' => $m['name'],
                'level' => $m['level'],
                'sponsor' => $m['sponsor'],
                'sponsorUserId' => $m['sponsorUserId'],
                'joinedAt' => $m['joinedAt'],
                'role' => $m['role'],
                'rank' => $m['rank'],
                'teamSize' => $sponsorCounts[$mNorm] ?? 0,
                'status' => $m['status'],
                'access' => $m['access'],
            ];
        }

        return [
            'directCount' => $directCount,
            'totalTeamCount' => count($allMembers),
            'levelCounts' => $levelCounts,
            'membersByLevel' => $membersByLevel,
            'allMembers' => $allMembers,
            'sanitizedMembers' => $sanitizedMembers,
        ];
    }
}
