<?php
/**
 * FaceTube - Personal KYC API
 * GET/POST /api/kyc/personal.php
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
        $stmt = $pdo->prepare('SELECT * FROM kyc_records WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if ($row) {
            jsonResponse([
                'success' => true,
                'kyc' => [
                    'fullName' => $row['full_name'],
                    'mobile' => $row['mobile'],
                    'dob' => $row['dob'],
                    'address' => $row['address'],
                    'city' => $row['city'],
                    'state' => $row['state'],
                    'pincode' => $row['pincode'],
                    'nomineeName' => $row['nominee_name'],
                    'nomineeRelation' => $row['nominee_relation'],
                    'nomineeMobile' => $row['nominee_mobile'],
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

    try {
        $stmt = $pdo->prepare('
            INSERT INTO kyc_records (
                user_id, full_name, mobile, dob, address, city, state, pincode,
                nominee_name, nominee_relation, nominee_mobile, status, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, "Submitted", NOW(), NOW()
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
                status = "Submitted",
                updated_at = NOW()
        ');

        $stmt->execute([
            $userId, $fullName, $mobile, $dob, $address, $city, $state, $pincode,
            $nomineeName, $nomineeRelation, $nomineeMobile
        ]);

        jsonResponse(['success' => true, 'message' => 'Personal KYC submitted successfully.']);
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}
