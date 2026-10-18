-- ==============================================================================
-- FaceTube - Database Migration: Password Reset Tokens Table
-- Hostinger MySQL 5.7+ / 8.0+ / MariaDB compatible
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prt_email` (`email`),
  KEY `idx_prt_token_hash` (`token_hash`),
  KEY `idx_prt_expires` (`expires_at`),
  KEY `idx_prt_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
