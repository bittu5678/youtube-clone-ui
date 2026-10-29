-- ==============================================================================
-- FaceTube - Database Migration: Admin Category Management
-- Migration: 20261030_create_categories_table.sql
-- Status: PENDING USER APPROVAL - DO NOT EXECUTE ON PRODUCTION WITHOUT SIGN-OFF
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Collation & Duplicate-Name Risk Analysis:
-- 1. The database default collation is `utf8mb4_unicode_ci` (case-insensitive).
-- 2. Under `utf8mb4_unicode_ci`, names such as 'Comedy', 'comedy', and 'COMEDY'
--    are treated as identical by MySQL unique indexes.
-- 3. A UNIQUE index on `name` prevents case-insensitive duplicates at the database level.
-- 4. To prevent slug collisions, `slug` is also enforced with a UNIQUE index.
-- 5. Existing production data in `uploaded_videos` and `uploaded_images` has freeform
--    categories (e.g., 'Entertainment', 'Coding', 'Motivational', 'Share Market', etc.).
-- 6. The initial INSERT below uses `INSERT IGNORE` to guarantee idempotency and prevent
--    fatal errors if any category already exists or collides during execution.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `created_by` VARCHAR(50) DEFAULT 'SYSTEM',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_categories_name` (`name`),
  UNIQUE KEY `uniq_categories_slug` (`slug`),
  KEY `idx_categories_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Idempotent baseline category seeding:
-- Uses INSERT IGNORE so re-running this migration is completely safe and non-destructive.
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO `categories` (`name`, `slug`, `created_by`) VALUES
  ('Cartoon', 'cartoon', 'SYSTEM'),
  ('Agriculture', 'agriculture', 'SYSTEM'),
  ('Motivational', 'motivational', 'SYSTEM'),
  ('Comedy', 'comedy', 'SYSTEM'),
  ('Blog', 'blog', 'SYSTEM'),
  ('Movie', 'movie', 'SYSTEM'),
  ('Entertainment', 'entertainment', 'SYSTEM'),
  ('Cooking', 'cooking', 'SYSTEM'),
  ('Finance', 'finance', 'SYSTEM'),
  ('Share Market', 'share-market', 'SYSTEM'),
  ('Business', 'business', 'SYSTEM'),
  ('Crypto', 'crypto', 'SYSTEM'),
  ('Coding', 'coding', 'SYSTEM');

-- ------------------------------------------------------------------------------
-- Optional: Import distinct legacy categories currently used by creators in uploaded_videos
-- (Uncomment below if migrating legacy video categories into the managed categories table)
-- ------------------------------------------------------------------------------
-- INSERT IGNORE INTO `categories` (`name`, `slug`, `created_by`)
-- SELECT DISTINCT
--   TRIM(category) AS name,
--   LOWER(REPLACE(REPLACE(TRIM(category), ' ', '-'), '&', 'and')) AS slug,
--   'LEGACY_IMPORT' AS created_by
-- FROM `uploaded_videos`
-- WHERE category IS NOT NULL AND TRIM(category) != '';
