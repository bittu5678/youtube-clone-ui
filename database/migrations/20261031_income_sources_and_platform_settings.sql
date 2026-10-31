-- ==============================================================================
-- FaceTube - Database Migration: Separate Income Sources & Platform Settings
-- Migration: 20261031_income_sources_and_platform_settings.sql
-- Status: PENDING USER APPROVAL - DO NOT EXECUTE ON PRODUCTION WITHOUT SIGN-OFF
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: platform_settings
-- Stores administrative settings such as marketing commission percentages,
-- withdrawal limits, and global pool parameters.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_by` VARCHAR(50) DEFAULT 'SYSTEM',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Idempotent initial baseline settings
INSERT IGNORE INTO `platform_settings` (`setting_key`, `setting_value`, `description`, `updated_by`) VALUES
  ('marketing_income_percentage', '10', 'Default marketing & referral commission percentage for ad promotions', 'SYSTEM'),
  ('ads_referral_rate_l1', '15', 'Level 1 Ads Promotion commission percentage', 'SYSTEM'),
  ('ads_referral_rate_l2', '10', 'Level 2 Ads Promotion commission percentage', 'SYSTEM'),
  ('ads_referral_rate_l3', '5', 'Level 3 Ads Promotion commission percentage', 'SYSTEM'),
  ('ads_referral_rate_l4', '4', 'Level 4 Ads Promotion commission percentage', 'SYSTEM'),
  ('ads_referral_rate_l5', '3', 'Level 5 Ads Promotion commission percentage', 'SYSTEM'),
  ('ads_referral_rate_l6', '2', 'Level 6 Ads Promotion commission percentage', 'SYSTEM'),
  ('ads_referral_rate_l7', '1', 'Level 7 Ads Promotion commission percentage', 'SYSTEM');

-- ------------------------------------------------------------------------------
-- 2. Modify income_ledger: Expand income_type ENUM to support separate genuine income types:
-- - adsense_income: In-stream video player ad monetization
-- - ad_boost_income: Ad promotion and featured video boost income
-- - affiliate_income: E-commerce and affiliate product referral earnings
-- - marketing_income: Custom marketing campaign payouts
-- ------------------------------------------------------------------------------
ALTER TABLE `income_ledger`
  MODIFY COLUMN `income_type` ENUM(
    'referral_income',
    'direct_commission',
    'global_income',
    'admin_allocation',
    'withdrawal',
    'ads_promotion_fee',
    'adsense_income',
    'ad_boost_income',
    'affiliate_income',
    'marketing_income'
  ) NOT NULL;
