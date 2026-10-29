<?php
/**
 * FaceTube - List Video Categories API
 * GET /api/categories/list.php
 * Public / Authenticated read endpoint for active video categories.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'error' => 'Method Not Allowed'], 405);
}

// Baseline fallback categories matching client VIDEO_CATEGORIES constant
$baselineCategories = [
    'Cartoon',
    'Agriculture',
    'Motivational',
    'Comedy',
    'Blog',
    'Movie',
    'Entertainment',
    'Cooking',
    'Finance',
    'Share Market',
    'Business',
    'Crypto',
    'Coding',
];

$pdo = getDatabaseConnection();

try {
    $stmt = $pdo->query('SELECT id, name, slug, created_by, created_at FROM categories ORDER BY name ASC');
    $categories = $stmt->fetchAll();

    if (!empty($categories)) {
        jsonResponse([
            'success' => true,
            'source' => 'database',
            'categories' => $categories,
        ]);
    }
} catch (PDOException $e) {
    // If the categories table has not been migrated yet (SQLSTATE 42S02 / Error 1146),
    // gracefully fall back to baseline categories to preserve platform functionality.
    $sqlState = $e->getCode();
    if ($sqlState !== '42S02' && !str_contains($e->getMessage(), "Table") && !str_contains($e->getMessage(), "doesn't exist")) {
        // Unexpected database error other than missing table
        jsonResponse([
            'success' => false,
            'error' => 'Database error while fetching categories: ' . $e->getMessage()
        ], 500);
    }
}

// Return formatted baseline fallback categories
$formattedBaseline = array_map(function ($name, $index) {
    $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $name), '-'));
    return [
        'id' => $index + 1,
        'name' => $name,
        'slug' => $slug,
        'created_by' => 'SYSTEM',
        'created_at' => '2026-10-01 00:00:00',
    ];
}, $baselineCategories, array_keys($baselineCategories));

jsonResponse([
    'success' => true,
    'source' => 'baseline_fallback',
    'categories' => $formattedBaseline,
]);
