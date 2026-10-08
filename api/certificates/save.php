<?php
/**
 * FaceTube - Save Certificate API
 * POST /api/certificates/save.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$input = getRequestPayload();

$certificateId = trim($input['certificateId'] ?? ($input['certificate_id'] ?? ''));
$userId = strtoupper(trim($input['userId'] ?? ($input['user_id'] ?? '')));
$creatorName = trim($input['creatorName'] ?? ($input['creator_name'] ?? ''));
$channelName = trim($input['channelName'] ?? ($input['channel_name'] ?? ''));
$rankId = trim($input['rankId'] ?? ($input['rank_id'] ?? 'level-4'));
$awardName = trim($input['awardName'] ?? ($input['award_name'] ?? 'Gold Creator Award'));
$subscribers = max(0, intval($input['subscribers'] ?? 100000));
$badge = trim($input['badge'] ?? '🥇');
$issueDate = trim($input['issueDate'] ?? ($input['issue_date'] ?? date('F d, Y')));

if (empty($certificateId) || empty($userId)) {
    jsonResponse(['success' => false, 'error' => 'Certificate ID and User ID are required.'], 400);
}

$uuid = generateUuid();
$stmt = $pdo->prepare('
    INSERT INTO certificates (
        id, certificate_id, user_id, creator_name, channel_name, rank_id, award_name,
        subscribers, badge, issue_date, created_at
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, NOW()
    )
    ON DUPLICATE KEY UPDATE
        creator_name = VALUES(creator_name),
        channel_name = VALUES(channel_name),
        subscribers = VALUES(subscribers),
        issue_date = VALUES(issue_date)
');

$stmt->execute([
    $uuid, $certificateId, $userId, $creatorName, $channelName, $rankId, $awardName,
    $subscribers, $badge, $issueDate
]);

jsonResponse(['success' => true, 'message' => 'Certificate saved successfully.', 'certificateId' => $certificateId]);
