<?php
/**
 * FaceTube - Get Digital Certificate API
 * GET /api/certificates/get.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

$pdo = getDatabaseConnection();
$userId = trim($_GET['userId'] ?? ($_GET['user_id'] ?? ''));

if (empty($userId)) {
    $authUser = getAuthUser($pdo);
    $userId = $authUser ? $authUser['user_id'] : 'FT102857';
}

try {
    $stmt = $pdo->prepare('SELECT * FROM certificates WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
    $stmt->execute([$userId]);
    $cert = $stmt->fetch();

    if ($cert) {
        jsonResponse([
            'success' => true,
            'certificate' => [
                'certificateId' => $cert['certificate_id'],
                'userId' => $cert['user_id'],
                'name' => $cert['name'],
                'issueDate' => $cert['issue_date'],
                'verified' => (bool)$cert['verified'],
                'pdfUrl' => $cert['pdf_url'],
            ]
        ]);
    }

    // Default verified certificate response
    $stmtUser = $pdo->prepare('SELECT name FROM users WHERE UPPER(user_id) = UPPER(?) LIMIT 1');
    $stmtUser->execute([$userId]);
    $u = $stmtUser->fetch();
    $name = $u ? $u['name'] : 'FaceTube Creator';

    jsonResponse([
        'success' => true,
        'certificate' => [
            'certificateId' => 'FT-CERT-' . strtoupper($userId),
            'userId' => $userId,
            'name' => $name,
            'issueDate' => date('Y-m-d'),
            'verified' => true,
        ]
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
