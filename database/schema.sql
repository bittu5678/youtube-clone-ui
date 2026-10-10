-- ==============================================================================
-- FaceTube - MySQL Database Schema
-- Production Schema for Hostinger phpMyAdmin (MySQL 5.7+ / 8.0+ / MariaDB)
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ------------------------------------------------------------------------------
-- 1. Table: users
-- Core user accounts with unique FT User ID (e.g. FT102857)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `referral_code` VARCHAR(50) DEFAULT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_user_id` (`user_id`),
  UNIQUE KEY `uniq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_referral_code` (`referral_code`),
  KEY `idx_users_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: sessions
-- State-managed Bearer tokens for PHP authentication
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sessions_token` (`token`),
  KEY `idx_sessions_user_id` (`user_id`),
  KEY `idx_sessions_expires_at` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: uploaded_videos
-- Free and Premium video uploads (Short and Long formats)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `uploaded_videos` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `creator_name` VARCHAR(255) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `video_url` TEXT NOT NULL,
  `thumbnail_url` TEXT,
  `video_type` ENUM('free', 'premium') NOT NULL DEFAULT 'free',
  `content_type` ENUM('short', 'long') NOT NULL DEFAULT 'long',
  `category` VARCHAR(100) DEFAULT 'Entertainment',
  `duration` VARCHAR(50) DEFAULT '0:00',
  `views` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `likes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `payment_status` ENUM('not_required', 'pending', 'paid', 'failed') NOT NULL DEFAULT 'not_required',
  `payment_id` VARCHAR(100) DEFAULT NULL,
  `payment_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `is_promoted` TINYINT(1) NOT NULL DEFAULT 0,
  `promotion_plan` VARCHAR(50) DEFAULT NULL,
  `promotion_expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_videos_user_id` (`user_id`),
  KEY `idx_videos_type_content` (`video_type`, `content_type`),
  KEY `idx_videos_payment_status` (`payment_status`),
  KEY `idx_videos_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: video_likes
-- User likes tracking on videos
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `video_likes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `video_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_video_user_like` (`video_id`, `user_id`),
  KEY `idx_video_likes_video_id` (`video_id`),
  KEY `idx_video_likes_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: video_comments
-- Community comments on videos
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `video_comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `video_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `comment` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_video_comments_video_id` (`video_id`),
  KEY `idx_video_comments_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: uploaded_images
-- Media library for uploaded creator images / community posts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `uploaded_images` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `creator_name` VARCHAR(255) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `image_url` TEXT NOT NULL,
  `format` VARCHAR(20) NOT NULL DEFAULT 'png',
  `file_size` VARCHAR(50) DEFAULT '1.0 MB',
  `category` VARCHAR(100) DEFAULT 'Entertainment',
  `views` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `likes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_images_user_id` (`user_id`),
  KEY `idx_images_category` (`category`),
  KEY `idx_images_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: wallet_balances
-- User wallet accounts with breakdown of income types
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_balances` (
  `user_id` VARCHAR(50) NOT NULL,
  `balance` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `total_earned` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `total_withdrawn` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `referral_income` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `global_income` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `adsense_income` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `affiliate_income` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: income_ledger
-- Double-entry audit ledger for all income and withdrawal transactions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `income_ledger` (
  `id` VARCHAR(64) NOT NULL,
  `transaction_id` VARCHAR(100) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `source_user_id` VARCHAR(50) DEFAULT NULL,
  `source_user_name` VARCHAR(255) DEFAULT NULL,
  `video_id` VARCHAR(100) DEFAULT NULL,
  `income_type` ENUM(
    'referral_income',
    'direct_commission',
    'global_income',
    'admin_allocation',
    'withdrawal',
    'ads_promotion_fee'
  ) NOT NULL,
  `amount` DECIMAL(14, 4) NOT NULL,
  `status` ENUM('settled', 'pending', 'failed') NOT NULL DEFAULT 'settled',
  `special_tag` VARCHAR(50) DEFAULT NULL,
  `description` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_income_ledger_tx_id` (`transaction_id`),
  KEY `idx_income_ledger_user_id` (`user_id`),
  KEY `idx_income_ledger_income_type` (`income_type`),
  KEY `idx_income_ledger_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: premium_transactions
-- Persistent audit sequence for Premium Video upload payments (₹6)
-- Enforces special transaction rule on #11, #21, #31, etc.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `premium_transactions` (
  `id` VARCHAR(64) NOT NULL,
  `tx_number` BIGINT NOT NULL,
  `payment_id` VARCHAR(100) NOT NULL,
  `order_id` VARCHAR(100) DEFAULT NULL,
  `video_id` VARCHAR(100) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `referrer_id` VARCHAR(50) DEFAULT NULL,
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 6.00,
  `transaction_type` VARCHAR(50) NOT NULL DEFAULT 'premium_upload',
  `is_special` TINYINT(1) NOT NULL DEFAULT 0,
  `special_tag` VARCHAR(50) NOT NULL DEFAULT 'NORMAL_PREMIUM',
  `referral_commission` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `admin_allocation` DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  `global_pool_allocation` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_premium_tx_number` (`tx_number`),
  UNIQUE KEY `uniq_premium_tx_payment_id` (`payment_id`),
  KEY `idx_premium_tx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9b. Table: payment_transactions
-- General payment record tracking for Razorpay payments and allocations
-- ------------------------------------------------------------------------------
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
  UNIQUE KEY `uniq_pt_payment_id` (`payment_id`),
  KEY `idx_pt_tx_number` (`tx_number`),
  KEY `idx_pt_user_id` (`user_id`),
  KEY `idx_pt_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------------------------
-- 10. Table: personal_kyc
-- Personal identification details and nominee information
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `personal_kyc` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(50) NOT NULL,
  `dob` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `pincode` VARCHAR(50) DEFAULT NULL,
  `nominee_name` VARCHAR(255) DEFAULT NULL,
  `nominee_relation` VARCHAR(100) DEFAULT NULL,
  `nominee_mobile` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('Draft', 'Submitted', 'Verified', 'Rejected') NOT NULL DEFAULT 'Submitted',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_personal_kyc_user_id` (`user_id`),
  KEY `idx_personal_kyc_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table: bank_kyc
-- Bank account and UPI payout details
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bank_kyc` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `account_holder_name` VARCHAR(255) NOT NULL,
  `bank_name` VARCHAR(255) NOT NULL,
  `account_number` VARCHAR(100) NOT NULL,
  `ifsc_code` VARCHAR(50) NOT NULL,
  `branch_name` VARCHAR(255) DEFAULT NULL,
  `account_type` VARCHAR(50) DEFAULT 'Saving',
  `upi_id` VARCHAR(100) DEFAULT NULL,
  `upi_qr_code` TEXT DEFAULT NULL,
  `status` ENUM('Draft', 'Submitted', 'Verified', 'Rejected') NOT NULL DEFAULT 'Submitted',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_bank_kyc_user_id` (`user_id`),
  KEY `idx_bank_kyc_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Table: certificates
-- Creator Rank and Milestone Certificates (10 Levels)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `certificates` (
  `id` VARCHAR(64) NOT NULL,
  `certificate_id` VARCHAR(100) NOT NULL,
  `user_id` VARCHAR(20) NOT NULL,
  `creator_name` VARCHAR(255) NOT NULL,
  `channel_name` VARCHAR(255) NOT NULL,
  `rank_id` VARCHAR(50) NOT NULL,
  `award_name` VARCHAR(255) NOT NULL,
  `subscribers` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `badge` VARCHAR(50) DEFAULT NULL,
  `issue_date` VARCHAR(50) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_cert_certificate_id` (`certificate_id`),
  KEY `idx_cert_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INITIAL PLATFORM SEED DATA
-- Pre-populates the core Administrator, Creator, and Platform state
-- Passwords: 'password123' (stored as standard PHP password_hash bcrypt)
-- Also accepted: sha256 hash 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
-- ==============================================================================

-- 1. Users
INSERT INTO `users` (`id`, `user_id`, `name`, `mobile`, `email`, `password_hash`, `role`, `referral_code`, `created_at`) VALUES
('a0000000-0000-0000-0000-000000000001', 'FT102857', 'FaceTube Administrator', '+1 555-019-2834', 'admin@facetube.com', '$2y$10$wT5gQW/4lq4mK9RZZaWJSeVqS2c8m1A3c7qj9gN2Y5k4L8mP0o6re', 'admin', 'FTVIP', DATE_SUB(NOW(), INTERVAL 30 DAY)),
('a0000000-0000-0000-0000-000000000002', 'FT483921', 'Alex Rivera', '+1 555-014-8392', 'alex@facetube.com', '$2y$10$wT5gQW/4lq4mK9RZZaWJSeVqS2c8m1A3c7qj9gN2Y5k4L8mP0o6re', 'user', 'CREATOR50', DATE_SUB(NOW(), INTERVAL 15 DAY)),
('a0000000-0000-0000-0000-000000000003', 'FT900431', 'Maya Lin', '+1 555-019-0043', 'maya@facetube.com', '$2y$10$wT5gQW/4lq4mK9RZZaWJSeVqS2c8m1A3c7qj9gN2Y5k4L8mP0o6re', 'user', 'FT483921', DATE_SUB(NOW(), INTERVAL 7 DAY))
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Wallets
INSERT INTO `wallet_balances` (`user_id`, `balance`, `total_earned`, `total_withdrawn`, `referral_income`, `global_income`, `adsense_income`, `affiliate_income`, `updated_at`) VALUES
('FT102857', 15400.00, 22000.00, 6600.00, 3400.00, 8200.00, 4500.00, 1300.00, NOW()),
('FT483921', 4280.50, 7430.50, 3150.00, 1079.50, 2450.00, 1890.20, 940.80, NOW()),
('FT900431', 850.00, 850.00, 0.00, 120.00, 450.00, 280.00, 0.00, NOW())
ON DUPLICATE KEY UPDATE `balance`=VALUES(`balance`);

-- 3. Historical Premium Transactions (1 to 10 sequence baseline)
INSERT INTO `premium_transactions` (`id`, `tx_number`, `payment_id`, `order_id`, `video_id`, `user_id`, `referrer_id`, `amount`, `transaction_type`, `is_special`, `special_tag`, `referral_commission`, `admin_allocation`, `global_pool_allocation`, `created_at`) VALUES
('ptx-seed-001', 1, 'pay_seed_hist_1001', 'order_seed_hist_1001', 'vid_seed_1', 'FT900431', 'FT483921', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, DATE_SUB(NOW(), INTERVAL 9 HOUR)),
('ptx-seed-002', 2, 'pay_seed_hist_1002', 'order_seed_hist_1002', 'vid_seed_2', 'FT483921', 'FT102857', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
('ptx-seed-003', 3, 'pay_seed_hist_1003', 'order_seed_hist_1003', 'vid_seed_3', 'FT900431', 'FT483921', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, DATE_SUB(NOW(), INTERVAL 7 HOUR)),
('ptx-seed-004', 4, 'pay_seed_hist_1004', 'order_seed_hist_1004', 'vid_seed_4', 'FT483921', 'FT102857', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
('ptx-seed-005', 5, 'pay_seed_hist_1005', 'order_seed_hist_1005', 'vid_seed_5', 'FT900431', 'FT483921', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('ptx-seed-006', 6, 'pay_seed_hist_1006', 'order_seed_hist_1006', 'vid_seed_6', 'FT483921', 'FT102857', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
('ptx-seed-007', 7, 'pay_seed_hist_1007', 'order_seed_hist_1007', 'vid_seed_7', 'FT900431', 'FT483921', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('ptx-seed-008', 8, 'pay_seed_hist_1008', 'order_seed_hist_1008', 'vid_seed_8', 'FT483921', 'FT102857', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('ptx-seed-009', 9, 'pay_seed_hist_1009', 'order_seed_hist_1009', 'vid_seed_9', 'FT900431', 'FT483921', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('ptx-seed-010', 10, 'pay_seed_hist_1010', 'order_seed_hist_1010', 'vid_seed_10', 'FT483921', 'FT102857', 6.00, 'premium_upload', 0, 'NORMAL_PREMIUM', 1.00, 1.00, 3.00, NOW())
ON DUPLICATE KEY UPDATE `tx_number`=VALUES(`tx_number`);

-- 4. Uploaded Videos Seed
INSERT INTO `uploaded_videos` (`id`, `user_id`, `creator_name`, `title`, `description`, `video_url`, `thumbnail_url`, `video_type`, `content_type`, `category`, `duration`, `views`, `likes`, `payment_status`, `payment_id`, `payment_amount`, `is_promoted`, `created_at`) VALUES
('vid-seed-001', 'FT483921', 'Alex Rivera', '10 Coding Shortcuts Every React Dev Must Know #Shorts', 'Lightning-fast developer workflow hacks in under 45 seconds.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60', 'free', 'short', 'Coding', '0:42', 45200, 3120, 'not_required', NULL, 0.00, 0, DATE_SUB(NOW(), INTERVAL 12 DAY)),
('vid-seed-002', 'FT483921', 'Alex Rivera', 'Full Stack App Architecture from Scratch: Zero to Production', 'Deep-dive 45-minute comprehensive architectural masterclass covering scalable backend and modern UI.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60', 'free', 'long', 'Education', '42:15', 98400, 8400, 'not_required', NULL, 0.00, 0, DATE_SUB(NOW(), INTERVAL 10 DAY)),
('vid-seed-003', 'FT483921', 'Alex Rivera', 'Pro Monetization Hack: Unlocking High-CPM Niches #Shorts', 'Exclusive creator strategy breakdown for maximum algorithmic engagement and monetization yield.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=60', 'premium', 'short', 'Business', '0:58', 62100, 5490, 'paid', 'pay_rzp_seed_001', 6.00, 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('vid-seed-004', 'FT483921', 'Alex Rivera', 'Executive Masterclass: Building $10K/Month Video Funnels', 'Full 1-hour verified premium course with step-by-step case studies and downloadable resources.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60', 'premium', 'long', 'Masterclass', '58:30', 114200, 12600, 'paid', 'pay_rzp_seed_002', 6.00, 0, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('vid-seed-005', 'FT900431', 'Maya Lin', 'Daily Morning Yoga Routine for Creators #Shorts', 'Energizing 60-second routine to boost focus and reduce stress.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=60', 'free', 'short', 'Motivational', '0:55', 38900, 2900, 'not_required', NULL, 0.00, 0, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('vid-seed-006', 'FT900431', 'Maya Lin', 'Complete Creative Storytelling & Cinematic Editing Masterclass', 'How to film and edit cinematic videos with any camera.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=60', 'premium', 'long', 'Entertainment', '34:20', 78400, 6800, 'paid', 'pay_rzp_seed_003', 6.00, 0, DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 5. Uploaded Images Seed
INSERT INTO `uploaded_images` (`id`, `user_id`, `creator_name`, `title`, `description`, `image_url`, `format`, `file_size`, `category`, `views`, `likes`, `created_at`) VALUES
('img-seed-001', 'FT483921', 'Alex Rivera', 'Mastering React 19 & Next-Gen Streaming UI', 'Official cover artwork and key takeaways for our latest masterclass.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80', 'png', '1.4 MB', 'Coding', 14200, 1890, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('img-seed-002', 'FT900431', 'Maya Lin', 'Daily Motivation & Mindset Roadmap', 'Visual roadmap for consistent creators scaling their audience in 2026.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80', 'jpg', '980 KB', 'Motivational', 28400, 3410, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('img-seed-003', 'FT102857', 'FaceTube Admin', 'Share Market & Crypto Macro Analysis', 'Infographic breakdown of high-frequency liquidity and fintech market trends.', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80', 'webp', '840 KB', 'Share Market', 19500, 2130, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('img-seed-004', 'FT483921', 'Alex Rivera', 'Creative Studio Lighting & Setup Showcase', 'Behind the scenes look at the multi-camera podcast and video rig.', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80', 'jpeg', '2.1 MB', 'Entertainment', 9300, 1240, DATE_SUB(NOW(), INTERVAL 8 DAY))
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 6. KYC Seed Records
INSERT INTO `personal_kyc` (`id`, `user_id`, `full_name`, `mobile`, `dob`, `address`, `city`, `state`, `pincode`, `nominee_name`, `nominee_relation`, `nominee_mobile`, `status`) VALUES
('pkyc-001', 'FT102857', 'FaceTube Administrator', '+1 555-019-2834', '1990-05-12', '742 Evergreen Terrace, Tech Park', 'San Jose', 'California', '95110', 'Sarah Administrator', 'Spouse', '+1 555-019-8821', 'Verified'),
('pkyc-002', 'FT483921', 'Alex Rivera', '+1 555-014-8392', '1994-08-15', '402 Skyline Boulevard, Suite 120', 'San Francisco', 'California', '94107', 'Elena Rivera', 'Spouse', '+1 555-014-9921', 'Verified'),
('pkyc-003', 'FT900431', 'Maya Lin', '+1 555-019-0043', '1996-11-20', '18 Orchard St, Creator Row', 'New York', 'New York', '10002', 'David Lin', 'Father', '+1 555-019-4411', 'Submitted')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

INSERT INTO `bank_kyc` (`id`, `user_id`, `account_holder_name`, `bank_name`, `account_number`, `ifsc_code`, `branch_name`, `account_type`, `upi_id`, `status`) VALUES
('bkyc-001', 'FT102857', 'FaceTube Administrator', 'Silicon Valley Bank (First Citizens)', '918239019201', 'SVBL0001048', 'Santa Clara Tech Hub', 'Current', 'facetube.admin@okaxis', 'Verified'),
('bkyc-002', 'FT483921', 'Alex Rivera', 'Chase Bank (JPMorgan Chase)', '849201948201', 'CHAS0002914', 'Market St Financial Center', 'Saving', 'alexrivera@okhdfcbank', 'Verified'),
('bkyc-003', 'FT900431', 'Maya Lin', 'Bank of America', '482019482910', 'BOFA0008412', 'Midtown Manhattan', 'Saving', 'mayalin@okicici', 'Submitted')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

-- 7. Income Ledger Seed
INSERT INTO `income_ledger` (`id`, `transaction_id`, `user_id`, `source_user_id`, `source_user_name`, `video_id`, `income_type`, `amount`, `status`, `description`, `created_at`) VALUES
('tx-init-001', 'TX_REF_91028341', 'FT483921', 'FT900431', 'Maya Lin', 'vid-seed-006', 'referral_income', 1.0000, 'settled', 'Direct Commission (₹1) for Premium Video upload by Maya Lin (FT900431)', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('tx-init-002', 'TX_GLB_84729103', 'FT483921', NULL, NULL, NULL, 'global_income', 1.5000, 'settled', 'Global Income Pool distribution share (1 of 2 eligible creators)', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('tx-init-003', 'TX_GLB_84729104', 'FT900431', NULL, NULL, NULL, 'global_income', 1.5000, 'settled', 'Global Income Pool distribution share (1 of 2 eligible creators)', DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);

SET FOREIGN_KEY_CHECKS = 1;
