<?php
/**
 * FaceTube - Personal KYC API
 * GET / POST /api/kyc/personal.php
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
        SELECT id, user_id, full_name, mobile, dob, address, city, state, pincode, nominee_name, nominee_relation, nominee_mobile, status, created_at, updated_at
        FROM personal_kyc
        WHERE UPPER(user_id) = ?
        LIMIT 1
    ');
    $stmt->execute([$userId]);
    $kyc = $stmt->fetch();

    if (!$kyc) {
        // Return default draft
        $kyc = [
            'userId' => $userId,
            'user_id' => $userId,
            'fullName' => '',
            'full_name' => '',
            'mobile' => '',
            'dob' => '',
            'address' => '',
            'city' => '',
            'state' => '',
            'pincode' => '',
            'nomineeName' => '',
            'nominee_name' => '',
            'nomineeRelation' => '',
            'nominee_relation' => '',
            'nomineeMobile' => '',
            'nominee_mobile' => '',
            'status' => 'Draft',
        ];
    } else {
        $kyc = [
            'id' => $kyc['id'],
            'userId' => $kyc['user_id'],
            'user_id' => $kyc['user_id'],
            'fullName' => $kyc['full_name'],
            'full_name' => $kyc['full_name'],
            'mobile' => $kyc['mobile'],
            'dob' => $kyc['dob'] ?? '',
            'address' => $kyc['address'] ?? '',
            'city' => $kyc['city'] ?? '',
            'state' => $kyc['state'] ?? '',
            'pincode' => $kyc['pincode'] ?? '',
            'nomineeName' => $kyc['nominee_name'] ?? '',
            'nominee_name' => $kyc['nominee_name'] ?? '',
            'nomineeRelation' => $kyc['nominee_relation'] ?? '',
            'nominee_relation' => $kyc['nominee_relation'] ?? '',
            'nomineeMobile' => $kyc['nominee_mobile'] ?? '',
            'nominee_mobile' => $kyc['nominee_mobile'] ?? '',
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
    $fullName = trim($input['fullName'] ?? ($input['full_name'] ?? ''));
    $mobile = trim($input['mobile'] ?? '');
    $dob = trim($input['dob'] ?? '');
    $address = trim($input['address'] ?? '');
    $city = trim($input['city'] ?? '');
    $state = trim($input['state'] ?? '');
    $pincode = trim($input['pincode'] ?? '');
    $nomineeName = trim($input['nomineeName'] ?? ($input['nominee_name'] ?? ''));
    $nomineeRelation = trim($input['nomineeRelation'] ?? ($input['nominee_relation'] ?? ''));
    $nomineeMobile = trim($input['nomineeMobile'] ?? ($input['nominee_mobile'] ?? ''));
    $status = trim($input['status'] ?? 'Submitted');

    if (empty($userId)) {
        jsonResponse(['success' => false, 'error' => 'User ID is required.'], 400);
    }
    if (empty($fullName)) {
        jsonResponse(['success' => false, 'error' => 'Full name is required.'], 400);
    }

    $uuid = generateUuid();
    $stmt = $pdo->prepare('
        INSERT INTO personal_kyc (
            id, user_id, full_name, mobile, dob, address, city, state, pincode,
            nominee_name, nominee_relation, nominee_mobile, status, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, NOW(), NOW()
        )
        ON DUPLICATE KEY UPDATE
            full_name = VALUES(full_name),
            mobile = VALUES(mobile),
            dob = VALUES(dob),
            address = VALUES(address),
            city = VALUES(city),
            state = VALUES(state),
            pincode = VALUES(pincode),
            nominee_name = VALUES(nominee_name),
            nominee_relation = VALUES(nominee_relation),
            nominee_mobile = VALUES(nominee_mobile),
            status = VALUES(status),
            updated_at = NOW()
    ');

    $stmt->execute([
        $uuid, $userId, $fullName, $mobile, $dob, $address, $city, $state, $pincode,
        $nomineeName, $nomineeRelation, $nomineeMobile, $status
    ]);

    jsonResponse(['success' => true, 'message' => 'Personal KYC submitted successfully.']);
}

jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
