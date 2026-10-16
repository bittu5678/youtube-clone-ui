-- ==============================================================================
-- FaceTube - Database Migration: Normalize Media URLs
-- Migration File: 20261015_normalize_media_urls.sql
-- Description: Updates legacy relative media storage paths (/uploads/...)
--              to absolute URLs on the production media host (https://api.facetube.online)
-- Safe & Idempotent: Only alters rows that start with '/uploads/' and are not yet absolute.
-- ==============================================================================

-- 1. Normalize uploaded_videos video_url
UPDATE `uploaded_videos`
SET `video_url` = CONCAT('https://api.facetube.online', `video_url`)
WHERE `video_url` LIKE '/uploads/%' AND `video_url` NOT LIKE 'http%';

-- 2. Normalize uploaded_videos thumbnail_url
UPDATE `uploaded_videos`
SET `thumbnail_url` = CONCAT('https://api.facetube.online', `thumbnail_url`)
WHERE `thumbnail_url` LIKE '/uploads/%' AND `thumbnail_url` NOT LIKE 'http%';

-- 3. Normalize uploaded_images image_url
UPDATE `uploaded_images`
SET `image_url` = CONCAT('https://api.facetube.online', `image_url`)
WHERE `image_url` LIKE '/uploads/%' AND `image_url` NOT LIKE 'http%';

-- 4. Normalize uploaded_images thumbnail_url
UPDATE `uploaded_images`
SET `thumbnail_url` = CONCAT('https://api.facetube.online', `thumbnail_url`)
WHERE `thumbnail_url` LIKE '/uploads/%' AND `thumbnail_url` NOT LIKE 'http%';
