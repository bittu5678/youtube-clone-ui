<?php
/**
 * FaceTube - Save Digital Certificate API
 * POST /api/certificates/save.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$input = getRequestPayload();
$userId = trim($input['userId'] ?? ($input['user_id'] ?? ''));
$name = trim($input['name'] ?? '');
$certificateId = trim($input['certificateId'] ?? ('FT-CERT-' . strtoupper($userId)));
$issueDate = trim($input['issueDate'] ?? date('Y-m-d'));
$pdfUrl = trim($input['pdfUrl'] ?? '');

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->prepare('
        INSERT INTO certificates (certificate_id, user_id, name, issue_date, verified, pdf_url, created_at)
        VALUES (?, ?, ?, ?, 1, ?, NOW())
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            issue_date = VALUES(issue_date),
            pdf_url = VALUES(pdf_url)
    ');
    $stmt->execute([$certificateId, $userId, $name, $issueDate, $pdfUrl]);

    jsonResponse([
        'success' => true,
        'message' => 'Certificate saved successfully.',
        'certificateId' => $certificateId,
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}
