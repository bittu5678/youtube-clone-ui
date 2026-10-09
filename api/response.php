<?php
/**
 * FaceTube - Universal JSON Response & Helper Functions
 * Standardized response envelope, CORS handling, and Bearer token parsing
 */

// Enable CORS for web, mobile apps, and APK access
function handleCors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

handleCors();

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getRequestPayload() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
            return $json;
        }
    }
    return $_POST ?: [];
}

function getBearerToken() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(
            array_map('ucwords', array_keys($requestHeaders)),
            array_values($requestHeaders)
        );
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/i', $headers, $matches)) {
            return $matches[1];
        }
    }

    return null;
}

function getAuthUser($pdo) {
    $token = getBearerToken();
    if (!$token) {
        return null;
    }

    try {
        $stmt = $pdo->prepare('
            SELECT u.id, u.user_id, u.name, u.mobile, u.email, u.role, u.referral_code, u.avatar_url, u.created_at
            FROM sessions s
            INNER JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > NOW()
            LIMIT 1
        ');
        $stmt->execute([$token]);
        return $stmt->fetch() ?: null;
    } catch (Exception $e) {
        return null;
    }
}
