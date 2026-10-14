-- ==============================================================================
-- FaceTube Migration: Server-Side Pre-Checkout Payment Orders Table
-- Migration Date: 2026-10-14
-- Target: Hostinger MySQL / phpMyAdmin (MySQL 5.7+ / 8.0+ / MariaDB)
-- Safe & Non-Destructive: Creates table IF NOT EXISTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `payment_orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(100) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(255) DEFAULT 'Creator',
  `video_id` VARCHAR(100) DEFAULT NULL,
  `purpose` VARCHAR(50) NOT NULL,
  `plan_id` VARCHAR(50) DEFAULT NULL,
  `content_type` VARCHAR(20) DEFAULT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `status` ENUM('created', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'created',
  `payment_id` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_po_order_id` (`order_id`),
  KEY `idx_po_user_id` (`user_id`),
  KEY `idx_po_video_id` (`video_id`),
  KEY `idx_po_status` (`status`),
  KEY `idx_po_created_at` (`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
