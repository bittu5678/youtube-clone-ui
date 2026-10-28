-- ==============================================================================
-- FaceTube - Database Migration: Company Audit Upgrades
-- Migration: 20261027_company_audit_updates.sql
-- Supports:
-- 1. Channel Logo support on users table
-- 2. Video Moderation (blocking Shorts and Long videos) on uploaded_videos
-- 3. Live Streaming and Live Chat persistence (live_streams, live_chat_messages)
-- 4. Bulk Withdrawal Payout Batches (payout_batches and batch_id in wallet_transactions)
-- 5. Video Ad Earnings tracking for weighted global pool allocation
-- ==============================================================================

-- 1. Channel Logo column on users table
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `channel_logo_url` VARCHAR(500) DEFAULT NULL AFTER `avatar_url`,
  ADD COLUMN IF NOT EXISTS `channel_name` VARCHAR(255) DEFAULT NULL AFTER `name`,
  ADD COLUMN IF NOT EXISTS `channel_banner_url` VARCHAR(500) DEFAULT NULL AFTER `channel_logo_url`;

-- 2. Video Moderation columns on uploaded_videos
ALTER TABLE `uploaded_videos`
  ADD COLUMN IF NOT EXISTS `is_blocked` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_promoted`,
  ADD COLUMN IF NOT EXISTS `block_reason` VARCHAR(255) DEFAULT NULL AFTER `is_blocked`,
  ADD COLUMN IF NOT EXISTS `blocked_at` DATETIME DEFAULT NULL AFTER `block_reason`,
  ADD COLUMN IF NOT EXISTS `ad_earnings` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `payment_amount`;

CREATE INDEX IF NOT EXISTS `idx_videos_blocked` ON `uploaded_videos` (`is_blocked`);

-- 3. Live Streaming Tables
CREATE TABLE IF NOT EXISTS `live_streams` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) DEFAULT 'General',
  `stream_key` VARCHAR(128) NOT NULL,
  `playback_url` TEXT,
  `thumbnail_url` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('upcoming', 'live', 'ended') NOT NULL DEFAULT 'upcoming',
  `viewers_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `started_at` DATETIME DEFAULT NULL,
  `ended_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_live_streams_user` (`user_id`),
  KEY `idx_live_streams_status` (`status`),
  KEY `idx_live_streams_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `live_chat_messages` (
  `id` VARCHAR(64) NOT NULL,
  `stream_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `is_superchat` TINYINT(1) NOT NULL DEFAULT 0,
  `superchat_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_live_chat_stream` (`stream_id`),
  KEY `idx_live_chat_created` (`created_at` ASC),
  CONSTRAINT `fk_live_chat_stream` FOREIGN KEY (`stream_id`) REFERENCES `live_streams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bulk Withdrawal Payout Batches
CREATE TABLE IF NOT EXISTS `payout_batches` (
  `id` VARCHAR(64) NOT NULL,
  `admin_user_id` VARCHAR(50) NOT NULL,
  `total_recipients` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'completed',
  `notes` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payout_batches_admin` (`admin_user_id`),
  KEY `idx_payout_batches_created` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `wallet_transactions`
  ADD COLUMN IF NOT EXISTS `batch_id` VARCHAR(64) DEFAULT NULL AFTER `user_id`,
  ADD COLUMN IF NOT EXISTS `payout_method` VARCHAR(50) DEFAULT 'bank_transfer' AFTER `type`,
  ADD COLUMN IF NOT EXISTS `beneficiary_details` TEXT DEFAULT NULL AFTER `status`;

CREATE INDEX IF NOT EXISTS `idx_wallet_transactions_batch` ON `wallet_transactions` (`batch_id`);
