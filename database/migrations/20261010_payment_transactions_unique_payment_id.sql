<?php
/**
 * Safe Migration: Ensure UNIQUE constraint on payment_transactions.payment_id
 * Run once in Hostinger MySQL / phpMyAdmin.
 * 
 * Safety features:
 * 1. Checks for NULL or duplicate payment_id records before creating the UNIQUE index.
 * 2. Does NOT delete or truncate any existing data.
 * 3. Idempotently adds index only if it does not already exist.
 */

-- Step 1: Ensure table exists
CREATE TABLE IF NOT EXISTS `payment_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(100) DEFAULT NULL,
  `payment_id` VARCHAR(100) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(255) DEFAULT 'Creator',
  `video_id` VARCHAR(100) DEFAULT NULL,
  `purpose` VARCHAR(50) NOT NULL DEFAULT 'premium_video_upload',
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 6.00,
  `tx_number` BIGINT NOT NULL,
  `is_special` TINYINT(1) NOT NULL DEFAULT 0,
  `special_tag` VARCHAR(50) NOT NULL DEFAULT 'NORMAL_PREMIUM',
  `referral_commission` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `admin_allocation` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  `global_pool_allocation` DECIMAL(10, 2) NOT NULL DEFAULT 3.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pt_tx_number` (`tx_number`),
  KEY `idx_pt_user_id` (`user_id`),
  KEY `idx_pt_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Diagnostic Check for Duplicates (Run this query first in phpMyAdmin)
-- If this returns rows, inspect them manually before adding the UNIQUE index:
SELECT `payment_id`, COUNT(*) as `cnt`
FROM `payment_transactions`
WHERE `payment_id` IS NOT NULL AND `payment_id` != ''
GROUP BY `payment_id`
HAVING `cnt` > 1;

-- Step 3: Add UNIQUE constraint on payment_id if not already present
-- In MySQL 8.0+ / MariaDB:
SET @dbname = DATABASE();
SET @tablename = "payment_transactions";
SET @indexname = "uniq_pt_payment_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND INDEX_NAME = @indexname
  ) > 0,
  "SELECT 'Unique index uniq_pt_payment_id already exists' AS status;",
  "ALTER TABLE `payment_transactions` ADD UNIQUE INDEX `uniq_pt_payment_id` (`payment_id`);"
));
PREPARE addIndexIfNotExists FROM @preparedStatement;
EXECUTE addIndexIfNotExists;
DEALLOCATE PREPARE addIndexIfNotExists;
