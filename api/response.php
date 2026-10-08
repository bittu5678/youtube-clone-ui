<?php
/**
 * FaceTube - Common HTTP Response, CORS, and Authentication Middleware
 */

function handleCors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token');
    header('Vary: Origin');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function jsonResponse($data, int $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function getRequestPayload(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw, true);
        return is_array($json) ? $json : [];
    }
    return is_array($_POST) ? $_POST : [];
}

function getAuthToken(): ?string {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($authHeader && preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        return $matches[1];
    }
    if (!empty($_SERVER['HTTP_X_AUTH_TOKEN'])) {
        return $_SERVER['HTTP_X_AUTH_TOKEN'];
    }
    if (!empty($_COOKIE['facetube_token'])) {
        return $_COOKIE['facetube_token'];
    }
    return null;
}

function getAuthUser(PDO $pdo): ?array {
    $token = getAuthToken();
    if (!$token) {
        return null;
    }

    $stmt = $pdo->prepare('
        SELECT u.id, u.user_id, u.name, u.mobile, u.email, u.role, u.referral_code, u.avatar_url, u.created_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > NOW()
        LIMIT 1
    ');
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function requireAuthUser(PDO $pdo): array {
    $user = getAuthUser($pdo);
    if (!$user) {
        jsonResponse([
            'success' => false,
            'error' => 'Authentication required. Please log in.'
        ], 401);
    }
    return $user;
}

function requireAdminUser(PDO $pdo): array {
    $user = requireAuthUser($pdo);
    if (($user['role'] ?? '') !== 'admin') {
        jsonResponse([
            'success' => false,
            'error' => 'Forbidden: Administrator access required.'
        ], 403);
    }
    return $user;
}

function generateUuid(): string {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function generateFTUserId(PDO $pdo): string {
    for ($i = 0; $i < 20; $i++) {
        $candidate = 'FT' . str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare('SELECT id FROM users WHERE user_id = ? LIMIT 1');
        $stmt->execute([$candidate]);
        if (!$stmt->fetch()) {
            return $candidate;
        }
    }
    return 'FT' . str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
}

// Automatically apply CORS on any file including response.php
handleCors();
