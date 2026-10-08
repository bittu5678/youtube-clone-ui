<?php
/**
 * FaceTube - Production Database Configuration
 * Hostinger MySQL Connection with PDO & Prepared Statements
 */

// Load .env variables if present in project root or /api/.env
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
            if (!getenv($key)) {
                putenv("{$key}={$val}");
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
            }
        }
    }
}

// Attempt loading from common .env locations
loadEnvFile(__DIR__ . '/../../.env');
loadEnvFile(__DIR__ . '/../../.env.local');
loadEnvFile(__DIR__ . '/../.env');

function getDatabaseConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: (getenv('MYSQL_HOST') ?: '127.0.0.1');
    $port = getenv('DB_PORT') ?: (getenv('MYSQL_PORT') ?: '3306');
    $dbName = getenv('DB_NAME') ?: (getenv('MYSQL_DATABASE') ?: 'facetube');
    $user = getenv('DB_USER') ?: (getenv('MYSQL_USER') ?: 'root');
    $pass = getenv('DB_PASSWORD') ?: (getenv('MYSQL_PASSWORD') ?: '');

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed. Check DB credentials in Hostinger configuration.'
        ]);
        exit;
    }
}
