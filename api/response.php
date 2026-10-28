<?php
/**
 * FaceTube - Universal JSON Response & Helper Functions
 * Standardized response envelope, CORS handling, and Bearer token parsing
 */

// Enable CORS restricted to approved FaceTube frontend origins
function handleCors() {
    $allowedOrigins = [
        'https://facetube.online',
        'https://www.facetube.online',
    ];

    // Allow local development origins only when an explicit development environment is set
    $appEnv = strtolower(trim((string)(getenv('APP_ENV') ?: ($_ENV['APP_ENV'] ?? ($_SERVER['APP_ENV'] ?? '')))));
    if (in_array($appEnv, ['development', 'dev', 'local', 'test'], true)) {
        $allowedOrigins[] = 'http://localhost:3000';
        $allowedOrigins[] = 'http://127.0.0.1:3000';
    }

    $origin = trim($_SERVER['HTTP_ORIGIN'] ?? '');
    $isOptions = isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS';

    // 1. If Origin header is present, enforce strict origin matching
    if (!empty($origin)) {
        $normalizedOrigin = strtolower($origin);
        if (in_array($normalizedOrigin, $allowedOrigins, true)) {
            // Approved origin: emit standard CORS headers
            header("Access-Control-Allow-Origin: {$origin}");
            header('Vary: Origin');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Max-Age: 86400');

            if ($isOptions) {
                http_response_code(204);
                exit;
            }
        } else {
            // Unapproved origin: cleanly omit Access-Control-Allow-Origin
            header('Vary: Origin');
            if ($isOptions) {
                http_response_code(403);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'success' => false,
                    'error' => 'CORS origin denied by policy.'
                ], JSON_UNESCAPED_SLASHES);
                exit;
            }
        }
    } else {
        // 2. Request without Origin header (server-to-server, mobile app, cURL, or same-origin)
        if ($isOptions) {
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
            http_response_code(204);
            exit;
        }
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
            SELECT u.id, u.user_id, u.name, u.mobile, u.email, u.role, u.referral_code, u.avatar_url, u.channel_logo_url, u.channel_name, u.created_at
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

/**
 * Enforces session authentication and authorization.
 * Returns authenticated user array and resolved target user_id.
 * If targetUserId is requested:
 * - If target matches the auth user, returns target.
 * - If auth user is role='admin', permits cross-user access to target.
 * - Otherwise rejects with 403 Forbidden.
 */
function requireAuthUser($pdo, $requestedUserId = null) {
    $authUser = getAuthUser($pdo);
    if (!$authUser) {
        jsonResponse([
            'success' => false,
            'error' => 'Authentication required. Please provide a valid Bearer session token.'
        ], 401);
    }

    $effectiveUserId = $authUser['user_id'];

    if (!empty($requestedUserId)) {
        $req = trim($requestedUserId);
        if (strcasecmp($req, $authUser['user_id']) === 0) {
            $effectiveUserId = $authUser['user_id'];
        } else {
            // Cross-user requested: strictly require admin role
            $isAdmin = isset($authUser['role']) && strtolower($authUser['role']) === 'admin';
            if (!$isAdmin) {
                jsonResponse([
                    'success' => false,
                    'error' => 'Unauthorized: Cross-user access is restricted to verified administrators.'
                ], 403);
            }
            $effectiveUserId = $req;
        }
    }

    return [$authUser, $effectiveUserId];
}

/**
 * Returns the public base URL for the FaceTube API / Media server.
 * Uses environment variables, incoming request headers, or falls back to production domain.
 */
function getApiBaseUrl() {
    $envBase = getenv('FACETUBE_API_BASE_URL') ?: (getenv('API_BASE_URL') ?: ($_ENV['FACETUBE_API_BASE_URL'] ?? ($_ENV['API_BASE_URL'] ?? null)));
    if (!empty($envBase)) {
        return rtrim($envBase, '/');
    }

    $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
    if (!empty($host)) {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ? 'https://' : 'http://';
        if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') {
            $protocol = 'https://';
        }
        return rtrim($protocol . $host, '/');
    }

    return 'https://api.facetube.online';
}

/**
 * Converts any relative media path (e.g. /uploads/videos/vid_123.mp4)
 * to an absolute public URL on the API / Media server domain.
 * Guards against duplicated domains, handles data URIs, and preserves external links.
 */
function toAbsoluteMediaUrl($path, $subfolder = 'videos') {
    if (empty($path) || !is_string($path)) {
        return '';
    }
    $path = trim($path);
    if ($path === '' || $path === 'null' || $path === 'undefined') {
        return '';
    }

    // Already a data URL, blob, or asset
    if (preg_match('/^(data:|blob:)/i', $path)) {
        return $path;
    }

    // Fix accidental double domain prefix: https://api.facetube.onlinehttps://api.facetube.online/...
    if (preg_match('/^(https?:\/\/[^\/]+)(https?:\/\/.+)$/i', $path, $matches)) {
        return toAbsoluteMediaUrl($matches[2], $subfolder);
    }

    // Already an absolute HTTP(S) URL
    if (preg_match('/^https?:\/\//i', $path)) {
        return $path;
    }

    $baseUrl = getApiBaseUrl();
    $cleanPath = ltrim($path, '/');

    if (str_starts_with($cleanPath, 'uploads/')) {
        return $baseUrl . '/' . $cleanPath;
    }

    return $baseUrl . '/uploads/' . $subfolder . '/' . $cleanPath;
}

/**
 * Returns an array of physical storage directories for uploaded media.
 * The first entry is the primary web-accessible location on Hostinger/cPanel.
 * Other entries serve as mirrors to keep the dev environment and docroots in sync.
 */
function getMediaStorageDirectories($subfolder = 'videos') {
    $dirs = [];

    // 1. Hostinger subdomain docroot: api/uploads/$subfolder/
    // Since __DIR__ is the api/ directory, __DIR__ . '/uploads/' . $subfolder . '/' is inside docroot.
    $apiUploadsDir = __DIR__ . '/uploads/' . $subfolder . '/';
    $dirs[] = $apiUploadsDir;

    // 2. Document root from server if defined
    if (!empty($_SERVER['DOCUMENT_ROOT'])) {
        $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
        $docUploadsDir = $docRoot . '/uploads/' . $subfolder . '/';
        if (!in_array($docUploadsDir, $dirs, true)) {
            $dirs[] = $docUploadsDir;
        }
    }

    // 3. Project root uploads/ directory (for local dev server / monorepo layout)
    $rootUploadsDir = dirname(__DIR__) . '/uploads/' . $subfolder . '/';
    if (!in_array($rootUploadsDir, $dirs, true)) {
        $dirs[] = $rootUploadsDir;
    }

    return $dirs;
}

/**
 * Ensures media storage directories exist with safe permissions (0755).
 * Returns the primary writable directory, or false if creation failed.
 */
function ensureMediaStorageDir($subfolder = 'videos') {
    $dirs = getMediaStorageDirectories($subfolder);
    $primaryDir = $dirs[0];

    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
    }

    if (!is_dir($primaryDir) || !is_writable($primaryDir)) {
        // Fallback to any writable directory in the list
        foreach ($dirs as $dir) {
            if (is_dir($dir) && is_writable($dir)) {
                return $dir;
            }
        }
        return false;
    }

    return $primaryDir;
}

