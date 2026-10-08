<?php
/**
 * FaceTube - Bank KYC API
 * GET / POST /api/kyc/bank.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = strtoupper(trim($_GET['userId'] ?? ($_GET['user_id'] ?? '')));
    if (empty($userId)) {
        $authUser = getAuthUser($pdo);
        if ($authUser) {
            $userId = strtoupper($authUser['user_id']);
        }
    }

    if (empty($userId)) {
        jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
    }

    $stmt = $pdo->prepare('
        SELECT id, user_id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, account_type, upi_id, upi_qr_code, status, created_at, updated_at
        FROM bank_kyc
        WHERE UPPER(user_id) = ?
        LIMIT 1
    ');
    $stmt->execute([$userId]);
    $kyc = $stmt->fetch();

    if (!$kyc) {
        $kyc = [
            'userId' => $userId,
            'user_id' => $userId,
            'accountHolderName' => '',
            'account_holder_name' => '',
            'bankName' => '',
            'bank_name' => '',
            'accountNumber' => '',
            'account_number' => '',
            'ifscCode' => '',
            'ifsc_code' => '',
            'branchName' => '',
            'branch_name' => '',
            'accountType' => 'Saving',
            'account_type' => 'Saving',
            'upiId' => '',
            'upi_id' => '',
            'upiQrCode' => '',
            'upi_qr_code' => '',
            'status' => 'Draft',
        ];
    } else {
        $kyc = [
            'id' => $kyc['id'],
            'userId' => $kyc['user_id'],
            'user_id' => $kyc['user_id'],
            'accountHolderName' => $kyc['account_holder_name'],
            'account_holder_name' => $kyc['account_holder_name'],
            'bankName' => $kyc['bank_name'],
            'bank_name' => $kyc['bank_name'],
            'accountNumber' => $kyc['account_number'],
            'account_number' => $kyc['account_number'],
            'ifscCode' => $kyc['ifsc_code'],
            'ifsc_code' => $kyc['ifsc_code'],
            'branchName' => $kyc['branch_name'] ?? '',
            'branch_name' => $kyc['branch_name'] ?? '',
            'accountType' => $kyc['account_type'] ?? 'Saving',
            'account_type' => $kyc['account_type'] ?? 'Saving',
            'upiId' => $kyc['upi_id'] ?? '',
            'upi_id' => $kyc['upi_id'] ?? '',
            'upiQrCode' => $kyc['upi_qr_code'] ?? '',
            'upi_qr_code' => $kyc['upi_qr_code'] ?? '',
            'status' => $kyc['status'],
            'createdAt' => $kyc['created_at'],
            'updatedAt' => $kyc['updated_at'],
        ];
    }

    jsonResponse(['success' => true, 'kyc' => $kyc]);
}

if ($method === 'POST') {
    $input = getRequestPayload();
    $userId = strtoupper(trim($input['userId'] ?? ($input['user_id'] ?? '')));
    $accountHolderName = trim($input['accountHolderName'] ?? ($input['account_holder_name'] ?? ''));
    $bankName = trim($input['bankName'] ?? ($input['bank_name'] ?? ''));
    $accountNumber = trim($input['accountNumber'] ?? ($input['account_number'] ?? ''));
    $ifscCode = strtoupper(trim($input['ifscCode'] ?? ($input['ifsc_code'] ?? '')));
    $branchName = trim($input['branchName'] ?? ($input['branch_name'] ?? ''));
    $accountType = trim($input['accountType'] ?? ($input['account_type'] ?? 'Saving'));
    $upiId = trim($input['upiId'] ?? ($input['upi_id'] ?? ''));
    $upiQrCode = trim($input['upiQrCode'] ?? ($input['upi_qr_code'] ?? ''));
    $status = trim($input['status'] ?? 'Submitted');

    if (empty($userId)) {
        jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
    }
    if (empty($accountHolderName)) {
        jsonResponse(['success' => false, 'error' => 'Account holder name is required.'], 400);
    }
    if (empty($bankName)) {
        jsonResponse(['success' => false, 'error' => 'Bank name is required.'], 400);
    }
    if (empty($accountNumber)) {
        jsonResponse(['success' => false, 'error' => 'Account number is required.'], 400);
    }
    if (empty($ifscCode)) {
        jsonResponse(['success' => false, 'error' => 'IFSC Code is required.'], 400);
    }

    $uuid = generateUuid();
    $stmt = $pdo->prepare('
        INSERT INTO bank_kyc (
            id, user_id, account_holder_name, bank_name, account_number, ifsc_code,
            branch_name, account_type, upi_id, upi_qr_code, status, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, NOW(), NOW()
        )
        ON DUPLICATE KEY UPDATE
            account_holder_name = VALUES(account_holder_name),
            bank_name = VALUES(bank_name),
            account_number = VALUES(account_number),
            ifsc_code = VALUES(ifsc_code),
            branch_name = VALUES(branch_name),
            account_type = VALUES(account_type),
            upi_id = VALUES(upi_id),
            upi_qr_code = VALUES(upi_qr_code),
            status = VALUES(status),
            updated_at = NOW()
    ');

    $stmt->execute([
        $uuid, $userId, $accountHolderName, $bankName, $accountNumber, $ifscCode,
        $branchName, $accountType, $upiId, $upiQrCode, $status
    ]);

    jsonResponse(['success' => true, 'message' => 'Bank KYC submitted successfully.']);
}

jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
