<?php
/**
 * FaceTube - Admin Category Creation API
 * POST /api/admin/categories.php
 * Strictly restricted to verified administrators.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

$pdo = getDatabaseConnection();
$authUser = getAuthUser($pdo);

if (!$authUser) {
    jsonResponse([
        'success' => false,
        'error' => 'Authentication required. Please provide a valid Bearer session token.'
    ], 401);
}

if (strtolower($authUser['role'] ?? '') !== 'admin') {
    jsonResponse([
        'success' => false,
        'error' => 'Admin authorization required. Only verified administrators can create categories.'
    ], 403);
}

$input = getRequestPayload();
$name = trim($input['name'] ?? ($input['category'] ?? ''));

if (empty($name)) {
    jsonResponse(['success' => false, 'error' => 'Category name is required.'], 400);
}

if (mb_strlen($name, 'UTF-8') < 2) {
    jsonResponse(['success' => false, 'error' => 'Category name must be at least 2 characters.'], 400);
}

if (mb_strlen($name, 'UTF-8') > 100) {
    jsonResponse(['success' => false, 'error' => 'Category name must not exceed 100 characters.'], 400);
}

// Generate URL/identifier slug
$slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $name), '-'));
if (empty($slug)) {
    $slug = 'category-' . substr(md5($name), 0, 8);
}

try {
    // Check for case-insensitive duplicate in the database
    $checkStmt = $pdo->prepare('SELECT id, name FROM categories WHERE LOWER(TRIM(name)) = LOWER(?) OR LOWER(slug) = LOWER(?) LIMIT 1');
    $checkStmt->execute([$name, $slug]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        jsonResponse([
            'success' => false,
            'error' => 'Category "' . htmlspecialchars($existing['name']) . '" already exists.'
        ], 409);
    }

    $insertStmt = $pdo->prepare('INSERT INTO categories (name, slug, created_by, created_at) VALUES (?, ?, ?, NOW())');
    $adminIdentifier = $authUser['user_id'] ?? ($authUser['id'] ?? 'ADMIN');
    $insertStmt->execute([$name, $slug, $adminIdentifier]);
    $newId = (int)$pdo->lastInsertId();

    jsonResponse([
        'success' => true,
        'message' => 'Category created successfully.',
        'category' => [
            'id' => $newId,
            'name' => $name,
            'slug' => $slug,
            'created_by' => $adminIdentifier,
            'created_at' => date('Y-m-d H:i:s'),
        ]
    ], 201);
} catch (PDOException $e) {
    // If the categories table has not been created yet in the database:
    $sqlState = $e->getCode();
    if ($sqlState === '42S02' || str_contains($e->getMessage(), "Table") || str_contains($e->getMessage(), "doesn't exist")) {
        jsonResponse([
            'success' => false,
            'error' => "Database migration pending: 'categories' table has not been created yet. Please execute the proposed database migration first."
        ], 503);
    }

    jsonResponse([
        'success' => false,
        'error' => 'Database error while creating category: ' . $e->getMessage()
    ], 500);
}
