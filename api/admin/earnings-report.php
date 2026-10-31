<?php
/**
 * FaceTube - Admin User-Wise Earnings & Payouts Report API
 * GET /api/admin/earnings-report.php
 *
 * Provides a comprehensive, paginated user-wise earnings and withdrawal report
 * strictly restricted to authenticated administrators.
 *
 * Query Parameters:
 * - search / q: Search string for user_id, name, email, referral_code
 * - start_date: Filter from date (YYYY-MM-DD)
 * - end_date: Filter to date (YYYY-MM-DD)
 * - date_mode: 'joined' (default) | 'activity'
 * - page: 1-indexed page number (default: 1)
 * - limit: Number of users per page (default: 20, max: 100)
 * - export: 'csv' for raw CSV file download
 * - action: 'withdrawals' (user-specific withdrawal transaction history drill-down)
 * - user_id / userId: Target user ID when action='withdrawals'
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$authUser = getAuthUser($pdo);

if (!$authUser) {
    jsonResponse([
        'success' => false,
        'error' => 'Authentication required. Please provide a valid Bearer session token.'
    ], 401);
}

if (strtolower($authUser['role'] ?? '') !== 'admin') {
    jsonResponse([
        'success' => false,
        'error' => 'Admin authorization required. Only verified administrators can access the earnings report.'
    ], 403);
}

$action = trim(strtolower($_GET['action'] ?? ''));

// -----------------------------------------------------------------------------
// Sub-Action: Specific User Withdrawal Transaction History Drill-Down
// -----------------------------------------------------------------------------
if ($action === 'withdrawals') {
    $targetUserId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));
    if (empty($targetUserId)) {
        jsonResponse(['success' => false, 'error' => 'user_id is required for withdrawal history'], 400);
    }

    $startDate = trim($_GET['start_date'] ?? ($_GET['startDate'] ?? ''));
    $endDate = trim($_GET['end_date'] ?? ($_GET['endDate'] ?? ''));

    $sql = "
        SELECT id, transaction_id, user_id, amount, status, description, created_at
        FROM income_ledger
        WHERE UPPER(user_id) = UPPER(?) AND income_type = 'withdrawal'
    ";
    $params = [$targetUserId];

    if (!empty($startDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
        $sql .= " AND created_at >= ?";
        $params[] = $startDate . ' 00:00:00';
    }
    if (!empty($endDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
        $sql .= " AND created_at <= ?";
        $params[] = $endDate . ' 23:59:59';
    }

    $sql .= " ORDER BY created_at DESC LIMIT 200";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $mapped = array_map(function ($tx) {
            return [
                'id' => $tx['id'],
                'transactionId' => $tx['transaction_id'],
                'userId' => $tx['user_id'],
                'amount' => floatval($tx['amount']),
                'status' => $tx['status'],
                'description' => $tx['description'],
                'createdAt' => $tx['created_at'],
            ];
        }, $rows);

        $totalAmount = array_reduce($mapped, function ($sum, $item) {
            return $sum + $item['amount'];
        }, 0.0);

        jsonResponse([
            'success' => true,
            'userId' => $targetUserId,
            'total' => count($mapped),
            'totalAmount' => $totalAmount,
            'withdrawals' => $mapped,
        ]);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// -----------------------------------------------------------------------------
// Main Report Query: Filtered & Paginated User Earnings
// -----------------------------------------------------------------------------
$search = trim($_GET['search'] ?? ($_GET['q'] ?? ''));
$startDate = trim($_GET['start_date'] ?? ($_GET['startDate'] ?? ''));
$endDate = trim($_GET['end_date'] ?? ($_GET['endDate'] ?? ''));
$dateMode = trim(strtolower($_GET['date_mode'] ?? 'joined'));
$export = trim(strtolower($_GET['export'] ?? ($_GET['format'] ?? '')));

$page = max(1, intval($_GET['page'] ?? 1));
$limit = max(1, min(100, intval($_GET['limit'] ?? 20)));
if ($export === 'csv') {
    $limit = 5000;
    $page = 1;
}
$offset = ($page - 1) * $limit;

$whereClauses = [];
$params = [];

if (!empty($search)) {
    $whereClauses[] = "(u.user_id LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.referral_code LIKE ?)";
    $like = '%' . $search . '%';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}

$hasStartDate = !empty($startDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate);
$hasEndDate = !empty($endDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate);

if ($dateMode === 'activity') {
    // Filter users who had income or withdrawal transactions within the date window
    if ($hasStartDate && $hasEndDate) {
        $whereClauses[] = "u.user_id IN (SELECT DISTINCT user_id FROM income_ledger WHERE created_at >= ? AND created_at <= ?)";
        $params[] = $startDate . ' 00:00:00';
        $params[] = $endDate . ' 23:59:59';
    } elseif ($hasStartDate) {
        $whereClauses[] = "u.user_id IN (SELECT DISTINCT user_id FROM income_ledger WHERE created_at >= ?)";
        $params[] = $startDate . ' 00:00:00';
    } elseif ($hasEndDate) {
        $whereClauses[] = "u.user_id IN (SELECT DISTINCT user_id FROM income_ledger WHERE created_at <= ?)";
        $params[] = $endDate . ' 23:59:59';
    }
} else {
    // Default: Filter by user registration / joined date
    if ($hasStartDate) {
        $whereClauses[] = "u.created_at >= ?";
        $params[] = $startDate . ' 00:00:00';
    }
    if ($hasEndDate) {
        $whereClauses[] = "u.created_at <= ?";
        $params[] = $endDate . ' 23:59:59';
    }
}

$whereSql = !empty($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

try {
    // 1. Count total matching users
    $countSql = "SELECT COUNT(*) FROM users u {$whereSql}";
    $stmtCount = $pdo->prepare($countSql);
    $stmtCount->execute($params);
    $totalUsers = intval($stmtCount->fetchColumn() ?: 0);

    // 2. Compute aggregate summary metrics across all matching users
    $summarySql = "
        SELECT 
            COUNT(u.id) AS total_count,
            COALESCE(SUM(wb.balance), 0) AS total_wallet_balance,
            COALESCE(SUM(wb.total_earned), 0) AS total_earned,
            COALESCE(SUM(wb.total_withdrawn), 0) AS total_withdrawn,
            COALESCE(SUM(wb.referral_income), 0) AS total_referral_income,
            COALESCE(SUM(wb.global_income), 0) AS total_global_income,
            COALESCE(SUM(wb.adsense_income), 0) AS total_adsense_income,
            COALESCE(SUM(wb.affiliate_income), 0) AS total_affiliate_income
        FROM users u
        LEFT JOIN wallet_balances wb ON UPPER(wb.user_id) = UPPER(u.user_id)
        {$whereSql}
    ";
    $stmtSummary = $pdo->prepare($summarySql);
    $stmtSummary->execute($params);
    $summaryRow = $stmtSummary->fetch() ?: [];

    $summary = [
        'totalUsers' => intval($summaryRow['total_count'] ?? $totalUsers),
        'totalWalletBalance' => round(floatval($summaryRow['total_wallet_balance'] ?? 0), 2),
        'totalEarned' => round(floatval($summaryRow['total_earned'] ?? 0), 2),
        'totalWithdrawn' => round(floatval($summaryRow['total_withdrawn'] ?? 0), 2),
        'totalReferralIncome' => round(floatval($summaryRow['total_referral_income'] ?? 0), 2),
        'totalGlobalIncome' => round(floatval($summaryRow['total_global_income'] ?? 0), 2),
        'totalAdsenseIncome' => round(floatval($summaryRow['total_adsense_income'] ?? 0), 2),
        'totalAffiliateIncome' => round(floatval($summaryRow['total_affiliate_income'] ?? 0), 2),
    ];

    // 3. Fetch paginated user records
    $dataSql = "
        SELECT 
            u.id,
            u.user_id,
            u.name,
            u.email,
            u.role,
            u.referral_code,
            u.created_at,
            COALESCE(wb.balance, 0.00) AS balance,
            COALESCE(wb.total_earned, 0.00) AS total_earned,
            COALESCE(wb.total_withdrawn, 0.00) AS total_withdrawn,
            COALESCE(wb.referral_income, 0.00) AS referral_income,
            COALESCE(wb.global_income, 0.00) AS global_income,
            COALESCE(wb.adsense_income, 0.00) AS adsense_income,
            COALESCE(wb.affiliate_income, 0.00) AS affiliate_income
        FROM users u
        LEFT JOIN wallet_balances wb ON UPPER(wb.user_id) = UPPER(u.user_id)
        {$whereSql}
        ORDER BY u.created_at DESC
        LIMIT " . intval($limit) . " OFFSET " . intval($offset) . "
    ";
    $stmtData = $pdo->prepare($dataSql);
    $stmtData->execute($params);
    $rows = $stmtData->fetchAll();

    // 4. Handle CSV Export
    if ($export === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="facetube_earnings_report_' . date('Y-m-d') . '.csv"');
        header('Pragma: no-cache');
        header('Expires: 0');

        $out = fopen('php://output', 'w');
        // Emit UTF-8 Byte Order Mark (BOM) for correct character display in Microsoft Excel
        fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));

        fputcsv($out, [
            'User ID',
            'Full Name',
            'Email Address',
            'Role',
            'Referral Code',
            'Available Balance (INR)',
            'Total Earned (INR)',
            'Referral Income (INR)',
            'Global Income (INR)',
            'AdSense Income (INR)',
            'Affiliate Income (INR)',
            'Total Withdrawn (INR)',
            'Joined Date'
        ]);

        foreach ($rows as $r) {
            fputcsv($out, [
                $r['user_id'],
                $r['name'],
                $r['email'],
                $r['role'],
                $r['referral_code'] ?: 'N/A',
                number_format(floatval($r['balance']), 2, '.', ''),
                number_format(floatval($r['total_earned']), 2, '.', ''),
                number_format(floatval($r['referral_income']), 2, '.', ''),
                number_format(floatval($r['global_income']), 2, '.', ''),
                number_format(floatval($r['adsense_income']), 2, '.', ''),
                number_format(floatval($r['affiliate_income']), 2, '.', ''),
                number_format(floatval($r['total_withdrawn']), 2, '.', ''),
                $r['created_at'],
            ]);
        }
        fclose($out);
        exit;
    }

    // 5. Build structured JSON response
    $users = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'userId' => $r['user_id'],
            'name' => $r['name'],
            'email' => $r['email'],
            'role' => $r['role'],
            'referralCode' => $r['referral_code'],
            'createdAt' => $r['created_at'],
            'balance' => round(floatval($r['balance']), 2),
            'totalEarned' => round(floatval($r['total_earned']), 2),
            'totalWithdrawn' => round(floatval($r['total_withdrawn']), 2),
            'referralIncome' => round(floatval($r['referral_income']), 2),
            'globalIncome' => round(floatval($r['global_income']), 2),
            'adsenseIncome' => round(floatval($r['adsense_income']), 2),
            'affiliateIncome' => round(floatval($r['affiliate_income']), 2),
        ];
    }, $rows);

    $totalPages = $totalUsers > 0 ? (int)ceil($totalUsers / $limit) : 1;

    jsonResponse([
        'success' => true,
        'users' => $users,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalUsers,
            'totalPages' => $totalPages,
        ],
        'summary' => $summary,
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database query error: ' . $e->getMessage()], 500);
}
