<?php
/**
 * FaceTube - Bank KYC API
 * GET/POST /api/kyc/bank.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));
    if (empty($userId)) {
        $user = getAuthUser($pdo);
        $userId = $user ? $user['user_id'] : '';
    }

    if (empty($userId)) {
        jsonResponse(['success' => false, 'error' => 'User ID required.'], 400);
    }

    try {
        $stmt = $pdo->prepare('SELECT * FROM kyc_bank_details WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if ($row) {
            jsonResponse([
                'success' => true,
                'kyc' => [
                    'accountHolderName' => $row['account_holder_name'],
                    'bankName' => $row['bank_name'],
                    'accountNumber' => $row['account_number'],
                    'ifscCode' => $row['ifsc_code'],
                    'branchName' => $row['branch_name'],
                    'accountType' => $row['account_type'],
                    'upiId' => $row['upi_id'],
                    'status' => $row['status'],
                    'submittedAt' => $row['created_at'],
                ]
            ]);
        }

        jsonResponse(['success' => true, 'kyc' => null]);
    } catch (PDOException $e) {
        jsonResponse(['success' => true, 'kyc' => null]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getRequestPayload();
    $userId = trim($input['userId'] ?? ($input['user_id'] ?? ''));

    if (empty($userId)) {
        $user = getAuthUser($pdo);
        $userId = $user ? $user['user_id'] : '';
    }

    if (empty($userId)) {
        jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
    }

    $accountHolderName = trim($input['accountHolderName'] ?? ($input['account_holder_name'] ?? ''));
    $bankName = trim($input['bankName'] ?? ($input['bank_name'] ?? ''));
    $accountNumber = trim($input['accountNumber'] ?? ($input['account_number'] ?? ''));
    $ifscCode = trim($input['ifscCode'] ?? ($input['ifsc_code'] ?? ''));
    $branchName = trim($input['branchName'] ?? ($input['branch_name'] ?? ''));
    $accountType = trim($input['accountType'] ?? ($input['account_type'] ?? 'Savings'));
    $upiId = trim($input['upiId'] ?? ($input['upi_id'] ?? ''));

    try {
        $stmt = $pdo->prepare('
            INSERT INTO kyc_bank_details (
                user_id, account_holder_name, bank_name, account_number, ifsc_code,
                branch_name, account_type, upi_id, status, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, "Submitted", NOW(), NOW()
            )
            ON DUPLICATE KEY UPDATE
                account_holder_name = VALUES(account_holder_name),
                bank_name = VALUES(bank_name),
                account_number = VALUES(account_number),
                ifsc_code = VALUES(ifsc_code),
                branch_name = VALUES(branch_name),
                account_type = VALUES(account_type),
                upi_id = VALUES(upi_id),
                status = "Submitted",
                updated_at = NOW()
        ');

        $stmt->execute([
            $userId, $accountHolderName, $bankName, $accountNumber, $ifscCode,
            $branchName, $accountType, $upiId
        ]);

        jsonResponse(['success' => true, 'message' => 'Bank KYC submitted successfully.']);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}
