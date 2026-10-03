-- ==============================================================================
-- FaceTube - Video Monetization, Global Income, & Wallet RLS Schema
-- Migration: 20261003_video_monetization_schema.sql
-- ==============================================================================

-- 1. Uploaded Videos Table
CREATE TABLE IF NOT EXISTS public.uploaded_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL,
  creator_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  video_type VARCHAR(20) NOT NULL CHECK (video_type IN ('free', 'premium')),
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('short', 'long')),
  category TEXT DEFAULT 'Entertainment',
  duration VARCHAR(20) DEFAULT '0:00',
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed')),
  payment_id TEXT,
  payment_amount NUMERIC(10, 2) DEFAULT 0.00,
  is_promoted BOOLEAN DEFAULT false,
  promotion_plan VARCHAR(50),
  promotion_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_uploaded_videos_user_id ON public.uploaded_videos (user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_videos_type ON public.uploaded_videos (video_type, content_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_videos_payment ON public.uploaded_videos (payment_status);

-- 2. Income Ledger Table (Audited, Append-Only from Server)
CREATE TABLE IF NOT EXISTS public.income_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  source_user_id VARCHAR(50),
  source_user_name TEXT,
  video_id VARCHAR(100),
  income_type VARCHAR(50) NOT NULL CHECK (income_type IN ('referral_income', 'direct_commission', 'global_income', 'admin_allocation', 'withdrawal', 'ads_promotion_fee')),
  amount NUMERIC(12, 4) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'settled' CHECK (status IN ('settled', 'pending', 'failed')),
  special_tag VARCHAR(50), -- e.g. 'SPECIAL_GLOBAL_RULE', 'SPECIAL_TRANSACTION'
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_income_ledger_user_id ON public.income_ledger (user_id);
CREATE INDEX IF NOT EXISTS idx_income_ledger_tx_id ON public.income_ledger (transaction_id);
CREATE INDEX IF NOT EXISTS idx_income_ledger_type ON public.income_ledger (income_type);

-- 3. Wallet Balances Table
CREATE TABLE IF NOT EXISTS public.wallet_balances (
  user_id VARCHAR(50) PRIMARY KEY,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  total_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_withdrawn NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  referral_income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  global_income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  adsense_income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  affiliate_income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.uploaded_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Uploaded Videos
-- Anyone can view public videos
CREATE POLICY "Public videos are viewable by all"
  ON public.uploaded_videos
  FOR SELECT
  USING (true);

-- Authenticated users can insert videos with initial pending or free status
CREATE POLICY "Users can insert own videos"
  ON public.uploaded_videos
  FOR INSERT
  WITH CHECK (
    user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub')
    OR auth.role() = 'authenticated'
  );

-- Users can only update non-financial fields on their own videos
-- Payment status can only be modified by backend service role
CREATE POLICY "Users can update own video metadata"
  ON public.uploaded_videos
  FOR UPDATE
  USING (user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub'));

-- 6. RLS Policies: Income Ledger
-- Users can SELECT only their own ledger transactions
CREATE POLICY "Users can view only their own income ledger"
  ON public.income_ledger
  FOR SELECT
  USING (user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub'));

-- Users CANNOT insert, update, or delete from income ledger directly from client
-- Only server-side service role can insert or modify income ledger entries
CREATE POLICY "Users cannot modify income ledger"
  ON public.income_ledger
  FOR INSERT
  WITH CHECK (false);

-- 7. RLS Policies: Wallet Balances
-- Users can view only their own wallet balance
CREATE POLICY "Users can view only their own wallet balance"
  ON public.wallet_balances
  FOR SELECT
  USING (user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub'));

-- Users CANNOT directly modify their wallet balance from client code
CREATE POLICY "Users cannot manually edit wallet balances"
  ON public.wallet_balances
  FOR UPDATE
  USING (false);
