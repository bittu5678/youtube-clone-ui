<?php
/**
 * FaceTube - Production Database Configuration
 * Hostinger MySQL Connection with PDO & Prepared Statements
 * Compatible with Hostinger phpMyAdmin (MySQL 5.7+ / 8.0+ / MariaDB)
 */

// Load .env variables if present in project root, parent directory, or /api/.env
function loadEnvFile($path) {
    if (!file_exists($path) || !is_readable($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            // Strip surrounding quotes
            if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                $val = substr($val, 1, -1);
            }
            putenv("{$key}={$val}");
            $_ENV[$key] = $val;
            $_SERVER[$key] = $val;
        }
    }
}

// Attempt loading from common Hostinger and project .env locations
loadEnvFile(__DIR__ . '/../../.env');
loadEnvFile(__DIR__ . '/../../.env.local');
loadEnvFile(__DIR__ . '/../../.env.production');
loadEnvFile(__DIR__ . '/../.env');
loadEnvFile(__DIR__ . '/.env');
if (!empty($_SERVER['DOCUMENT_ROOT'])) {
    loadEnvFile($_SERVER['DOCUMENT_ROOT'] . '/.env');
    loadEnvFile(dirname($_SERVER['DOCUMENT_ROOT']) . '/.env');
}

function getDatabaseConfig() {
    $host = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? ($_SERVER['DB_HOST'] ?? (getenv('MYSQL_HOST') ?: ($_ENV['MYSQL_HOST'] ?? ($_SERVER['MYSQL_HOST'] ?? '')))));
    $port = getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? ($_SERVER['DB_PORT'] ?? (getenv('MYSQL_PORT') ?: ($_ENV['MYSQL_PORT'] ?? ($_SERVER['MYSQL_PORT'] ?? '3306')))));
    $dbName = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? ($_SERVER['DB_NAME'] ?? (getenv('MYSQL_DATABASE') ?: ($_ENV['MYSQL_DATABASE'] ?? ($_SERVER['MYSQL_DATABASE'] ?? '')))));
    $user = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? ($_SERVER['DB_USER'] ?? (getenv('MYSQL_USER') ?: ($_ENV['MYSQL_USER'] ?? ($_SERVER['MYSQL_USER'] ?? '')))));
    $pass = getenv('DB_PASSWORD') ?: ($_ENV['DB_PASSWORD'] ?? ($_SERVER['DB_PASSWORD'] ?? (getenv('MYSQL_PASSWORD') ?: ($_ENV['MYSQL_PASSWORD'] ?? ($_SERVER['MYSQL_PASSWORD'] ?? '')))));

    // Optional Hostinger direct configuration file for users who prefer PHP array over .env
    $customConfigPath = __DIR__ . '/db_credentials.php';
    if (file_exists($customConfigPath) && is_readable($customConfigPath)) {
        $custom = include $customConfigPath;
        if (is_array($custom)) {
            $host = $custom['DB_HOST'] ?? ($custom['MYSQL_HOST'] ?? $host);
            $port = $custom['DB_PORT'] ?? ($custom['MYSQL_PORT'] ?? $port);
            $dbName = $custom['DB_NAME'] ?? ($custom['MYSQL_DATABASE'] ?? $dbName);
            $user = $custom['DB_USER'] ?? ($custom['MYSQL_USER'] ?? $user);
            $pass = $custom['DB_PASSWORD'] ?? ($custom['MYSQL_PASSWORD'] ?? $pass);
        }
    }

    return [
        'host' => trim((string)$host),
        'port' => trim((string)$port),
        'dbName' => trim((string)$dbName),
        'user' => trim((string)$user),
        'pass' => (string)$pass,
        'isConfigured' => !empty($host) && !empty($dbName) && !empty($user)
    ];
}

function getDatabaseConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $conf = getDatabaseConfig();

    if (!$conf['isConfigured']) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => 'Database configuration missing: DB_HOST, DB_NAME, and DB_USER must be defined in your Hostinger .env file or database configuration.'
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $host = $conf['host'];
    $port = $conf['port'];
    $dbName = $conf['dbName'];
    $user = $conf['user'];
    $pass = $conf['pass'];

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed. Please verify DB credentials in Hostinger configuration (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD).'
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
