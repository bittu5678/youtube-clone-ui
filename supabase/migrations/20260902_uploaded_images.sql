-- Migration: 20260902_uploaded_images.sql
-- Adds uploaded_images table for media library and feed interleaving

CREATE TABLE IF NOT EXISTS public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL,
  creator_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  format VARCHAR(10) NOT NULL CHECK (format IN ('jpg', 'jpeg', 'png', 'webp')),
  file_size VARCHAR(20) DEFAULT '1.0 MB',
  category TEXT DEFAULT 'Entertainment',
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_uploaded_images_user_id ON public.uploaded_images (user_id);
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public images are viewable by all"
  ON public.uploaded_images FOR SELECT USING (true);

CREATE POLICY "Users can insert own images"
  ON public.uploaded_images FOR INSERT
  WITH CHECK (user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub') OR auth.role() = 'authenticated');
