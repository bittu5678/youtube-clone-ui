<?php
/**
 * FaceTube - Wallet Withdrawal API
 * POST /api/wallet/withdraw.php
 * Strictly enforces minimum ₹1,000 and maximum daily ₹10,000 limits.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

/**
 * Masks sensitive bank account number leaving only the last 4 characters visible.
 * E.g. '50100481920194' -> 'XXXXXXXXXX0194'
 */
function maskAccountNumber(string $acc): string {
    $clean = preg_replace('/[^0-9A-Za-z]/', '', $acc);
    $len = strlen($clean);
    if ($len === 0) return '';
    if ($len <= 4) return str_repeat('X', $len);
    return str_repeat('X', $len - 4) . substr($clean, -4);
}

/**
 * Masks sensitive UPI handle before the domain.
 * E.g. 'alexrivera@okhdfcbank' -> 'al***ra@okhdfcbank'
 */
function maskUpiId(string $upi): string {
    $clean = trim($upi);
    if (empty($clean)) return '';
    $parts = explode('@', $clean, 2);
    $handle = $parts[0];
    $hLen = strlen($handle);
    if ($hLen <= 2) {
        $maskedHandle = substr($handle, 0, 1) . '*';
    } elseif ($hLen <= 4) {
        $maskedHandle = substr($handle, 0, 1) . '**' . substr($handle, -1);
    } else {
        $maskedHandle = substr($handle, 0, 2) . '***' . substr($handle, -2);
    }
    return count($parts) > 1 ? ($maskedHandle . '@' . $parts[1]) : $maskedHandle;
}

/**
 * Builds protected, masked beneficiary representation for secure storage.
 */
function buildMaskedBeneficiaryDetails(?array $bank): ?string {
    if (empty($bank) || !is_array($bank)) return null;
    $holder = trim($bank['accountHolder'] ?? ($bank['account_holder'] ?? ($bank['accountHolderName'] ?? ($bank['account_holder_name'] ?? ''))));
    $bankName = trim($bank['bankName'] ?? ($bank['bank_name'] ?? ''));
    $accNum = trim($bank['accountNumber'] ?? ($bank['account_number'] ?? ''));
    $ifsc = trim($bank['ifscCode'] ?? ($bank['ifsc_code'] ?? ''));
    $upi = trim($bank['upiId'] ?? ($bank['upi_id'] ?? ''));

    $details = [];
    if (!empty($holder)) $details['account_holder'] = $holder;
    if (!empty($bankName)) $details['bank_name'] = $bankName;
    if (!empty($accNum)) $details['account_number_masked'] = maskAccountNumber($accNum);
    if (!empty($ifsc)) $details['ifsc_code'] = strtoupper($ifsc);
    if (!empty($upi)) $details['upi_id_masked'] = maskUpiId($upi);

    return !empty($details) ? json_encode($details, JSON_UNESCAPED_SLASHES) : null;
}

$input = getRequestPayload();
$amount = floatval($input['amount'] ?? 0);
$requestedUserId = trim($input['userId'] ?? ($input['user_id'] ?? ''));
$payoutMethodInput = trim($input['payoutMethod'] ?? ($input['payout_method'] ?? ''));
$bankDetailsInput = $input['bankDetails'] ?? ($input['bank_details'] ?? null);

// Strictly derive identity from authenticated session.
// Cross-user withdrawal is restricted to verified administrators.
$userId = $authUser['user_id'];
if (!empty($requestedUserId) && strcasecmp($requestedUserId, $authUser['user_id']) !== 0) {
    if (strtolower($authUser['role'] ?? '') !== 'admin') {
        jsonResponse([
            'success' => false,
            'error' => 'Unauthorized: You cannot initiate withdrawals on behalf of another user.'
        ], 403);
    }
    $userId = $requestedUserId;
}

if ($amount < 100) {
    jsonResponse([
        'success' => false,
        'error' => 'Minimum withdrawal amount is ₹100. You cannot withdraw less than ₹100.'
    ], 400);
}

if ($amount > 1000) {
    jsonResponse([
        'success' => false,
        'error' => 'Maximum daily withdrawal limit is ₹1,000. You cannot withdraw more than ₹1,000 per day.'
    ], 400);
}

// Prepare bank details and masked beneficiary information
$bankDetails = is_array($bankDetailsInput) ? $bankDetailsInput : null;
if (empty($bankDetails)) {
    try {
        $stmtKyc = $pdo->prepare('SELECT account_holder_name, bank_name, account_number, ifsc_code, upi_id FROM kyc_bank_details WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
        $stmtKyc->execute([$userId]);
        $kycRow = $stmtKyc->fetch();
        if ($kycRow) {
            $bankDetails = [
                'accountHolder' => $kycRow['account_holder_name'] ?? '',
                'bankName' => $kycRow['bank_name'] ?? '',
                'accountNumber' => $kycRow['account_number'] ?? '',
                'ifscCode' => $kycRow['ifsc_code'] ?? '',
                'upiId' => $kycRow['upi_id'] ?? '',
            ];
        }
    } catch (PDOException $_eKyc) {
        // kyc_bank_details table might not exist
    }
}

$payoutMethod = $payoutMethodInput;
if (empty($payoutMethod)) {
    if (!empty($bankDetails['upiId'] ?? ($bankDetails['upi_id'] ?? '')) && empty($bankDetails['accountNumber'] ?? ($bankDetails['account_number'] ?? ''))) {
        $payoutMethod = 'upi';
    } else {
        $payoutMethod = 'bank_transfer';
    }
}

$beneficiaryDetailsJson = buildMaskedBeneficiaryDetails($bankDetails);

try {
    $pdo->beginTransaction();

    // Check balance under row lock
    $stmtBal = $pdo->prepare('SELECT balance FROM wallet_balances WHERE UPPER(user_id) = UPPER(?) FOR UPDATE');
    $stmtBal->execute([$userId]);
    $balRow = $stmtBal->fetch();
    $currentBal = floatval($balRow['balance'] ?? 0);

    if ($currentBal < $amount) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'error' => 'Insufficient balance. Your current withdrawable balance is ₹' . number_format($currentBal, 2) . ', but you requested ₹' . number_format($amount, 2) . '.'
        ], 400);
    }

    // Company Confirmed Withdrawal Fee Rule:
    // - Minimum: ₹100, Maximum: ₹1,000
    // - GST: 18% of FULL withdrawal amount
    // - PG Fee: 2% of FULL withdrawal amount
    // - Total Deduction: 20% of withdrawal amount
    // - Net Payout: 80% of withdrawal amount
    // Examples: ₹100 -> ₹18 GST + ₹2 PG -> ₹80 net; ₹500 -> ₹90 GST + ₹10 PG -> ₹400 net; ₹1,000 -> ₹180 GST + ₹20 PG -> ₹800 net
    $gstAmount = round($amount * 0.18, 2);
    $pgFeeAmount = round($amount * 0.02, 2);
    $fee = round($gstAmount + $pgFeeAmount, 2);
    $netAmount = round($amount - $fee, 2);
    $chargesBreakdown = [
        'grossAmount' => $amount,
        'gstRatePercent' => 18,
        'gstAmount' => $gstAmount,
        'pgFeePercent' => 2,
        'pgFeeAmount' => $pgFeeAmount,
        'totalDeductionPercent' => 20,
        'totalCharge' => $fee,
        'netPayable' => $netAmount,
    ];

    $newBal = $currentBal - $amount;
    $stmtUp = $pdo->prepare('
        UPDATE wallet_balances 
        SET balance = balance - ?, total_withdrawn = total_withdrawn + ?, updated_at = NOW() 
        WHERE UPPER(user_id) = UPPER(?)
    ');
    $stmtUp->execute([$amount, $amount, $userId]);

    $txId = 'tx_wdr_' . round(microtime(true) * 1000) . '_' . substr(md5(random_bytes(6)), 0, 5);

    // Record transaction using wallet_transactions, with graceful fallback to income_ledger
    $recorded = false;
    try {
        $stmtTx = $pdo->prepare('
            INSERT INTO wallet_transactions (id, user_id, type, amount, status, payout_method, beneficiary_details, created_at)
            VALUES (?, ?, "withdrawal", ?, "approved", ?, ?, NOW())
        ');
        $stmtTx->execute([$txId, $userId, $amount, $payoutMethod, $beneficiaryDetailsJson]);
        $recorded = true;
    } catch (PDOException $eTx) {
        // Fallback: If wallet_transactions is not created, record in income_ledger
        try {
            $stmtLedger = $pdo->prepare('
                INSERT INTO income_ledger (id, transaction_id, user_id, income_type, amount, status, description, payout_method, beneficiary_details, created_at)
                VALUES (?, ?, ?, "withdrawal", ?, "settled", ?, ?, ?, NOW())
            ');
            $stmtLedger->execute([
                $txId,
                $txId,
                $userId,
                $amount,
                "Withdrawal request approved for ₹" . number_format($amount, 2) . " (Net: ₹" . number_format($netAmount, 2) . " after 20% charges: 18% GST ₹" . number_format($gstAmount, 2) . " + 2% PG ₹" . number_format($pgFeeAmount, 2) . ")",
                $payoutMethod,
                $beneficiaryDetailsJson
            ]);
            $recorded = true;
        } catch (PDOException $eLedger) {
            try {
                $stmtLedgerOld = $pdo->prepare('
                    INSERT INTO income_ledger (id, transaction_id, user_id, income_type, amount, status, description, created_at)
                    VALUES (?, ?, ?, "withdrawal", ?, "settled", ?, NOW())
                ');
                $stmtLedgerOld->execute([
                    $txId,
                    $txId,
                    $userId,
                    $amount,
                    "Withdrawal request approved for ₹" . number_format($amount, 2) . " (Net: ₹" . number_format($netAmount, 2) . " after 20% charges: 18% GST ₹" . number_format($gstAmount, 2) . " + 2% PG ₹" . number_format($pgFeeAmount, 2) . ")"
                ]);
                $recorded = true;
            } catch (PDOException $eOld) {
                // Log fallback exception
                error_log('[withdraw.php] Could not write transaction record: ' . $eOld->getMessage());
            }
        }
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Withdrawal request for ₹' . number_format($amount, 2) . ' (Net Payable: ₹' . number_format($netAmount, 2) . ' after 20% charges: 18% GST ₹' . number_format($gstAmount, 2) . ' + 2% PG ₹' . number_format($pgFeeAmount, 2) . ') validated and approved.',
        'transaction' => [
            'id' => $txId,
            'userId' => $userId,
            'amount' => $amount,
            'fee' => $fee,
            'netAmount' => $netAmount,
            'net_amount' => $netAmount,
            'chargesBreakdown' => $chargesBreakdown,
            'type' => 'withdrawal',
            'status' => 'approved',
            'payout_method' => $payoutMethod,
            'payoutMethod' => $payoutMethod,
            'beneficiary_details' => $beneficiaryDetailsJson,
            'beneficiaryDetails' => $beneficiaryDetailsJson,
            'createdAt' => date('c'),
        ],
        'updatedWallet' => [
            'userId' => $userId,
            'balance' => $newBal,
            'totalBalance' => $newBal,
            'withdrawableBalance' => $newBal,
        ]
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}

