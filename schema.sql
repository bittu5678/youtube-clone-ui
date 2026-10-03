-- ==============================================================================
-- FaceTube - Database Based User Registration Schema
-- Supabase PostgreSQL Schema
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mobile VARCHAR(25) NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  referral_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS users_user_id_idx ON public.users (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON public.users (lower(email));
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users (created_at DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public registration"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow select for authentication"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow update own record"
  ON public.users
  FOR UPDATE
  USING (true);

CREATE OR REPLACE FUNCTION public.generate_ft_user_id_trigger()
RETURNS TRIGGER AS $$
DECLARE
  candidate_id TEXT;
  id_exists BOOLEAN;
BEGIN
  IF NEW.user_id IS NULL OR NEW.user_id = '' THEN
    LOOP
      candidate_id := 'FT' || lpad(floor(random() * 1000000)::text, 6, '0');
      SELECT EXISTS(SELECT 1 FROM public.users WHERE user_id = candidate_id) INTO id_exists;
      IF NOT id_exists THEN
        NEW.user_id := candidate_id;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_user_id ON public.users;
CREATE TRIGGER trg_auto_user_id
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ft_user_id_trigger();

INSERT INTO public.users (id, user_id, name, mobile, email, password_hash, referral_code, created_at)
VALUES 
  (
    'a0000000-0000-0000-0000-000000000001',
    'FT102857',
    'FaceTube Administrator',
    '+1 555-019-2834',
    'admin@facetube.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'FTVIP',
    NOW() - INTERVAL '30 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'FT483921',
    'Alex Rivera',
    '+1 555-014-8392',
    'alex@facetube.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    'CREATOR50',
    NOW() - INTERVAL '15 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'FT900431',
    'Maya Lin',
    '+1 555-019-0043',
    'maya@facetube.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    NULL,
    NOW() - INTERVAL '7 days'
  )
ON CONFLICT (email) DO NOTHING;

-- ==============================================================================
-- Video Monetization, Global Income, & Wallet RLS Schema
-- ==============================================================================

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
  special_tag VARCHAR(50),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_income_ledger_user_id ON public.income_ledger (user_id);

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

ALTER TABLE public.uploaded_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public videos are viewable by all"
  ON public.uploaded_videos FOR SELECT USING (true);

CREATE POLICY "Users can insert own videos"
  ON public.uploaded_videos FOR INSERT
  WITH CHECK (user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub') OR auth.role() = 'authenticated');

CREATE POLICY "Users can view only their own income ledger"
  ON public.income_ledger FOR SELECT
  USING (user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub'));

CREATE POLICY "Users cannot modify income ledger"
  ON public.income_ledger FOR INSERT WITH CHECK (false);

CREATE POLICY "Users can view only their own wallet balance"
  ON public.wallet_balances FOR SELECT
  USING (user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub'));

CREATE POLICY "Users cannot manually edit wallet balances"
  ON public.wallet_balances FOR UPDATE USING (false);

-- ==============================================================================
-- Uploaded Images Media Library Schema
-- ==============================================================================

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

-- ==============================================================================
-- Persistent Premium Transactions Sequence & Table
-- ==============================================================================

CREATE SEQUENCE IF NOT EXISTS public.premium_tx_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.premium_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_number BIGINT NOT NULL,
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  video_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  referrer_id VARCHAR(50),
  amount NUMERIC(10, 2) NOT NULL DEFAULT 6.00,
  transaction_type VARCHAR(50) NOT NULL DEFAULT 'premium_upload',
  is_special BOOLEAN NOT NULL DEFAULT false,
  special_tag VARCHAR(50) NOT NULL DEFAULT 'NORMAL_PREMIUM',
  referral_commission NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  admin_allocation NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
  global_pool_allocation NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_premium_tx_payment_id ON public.premium_transactions (payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_premium_tx_number ON public.premium_transactions (tx_number);
CREATE INDEX IF NOT EXISTS idx_premium_tx_user_id ON public.premium_transactions (user_id);

ALTER TABLE public.premium_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view audit summary of premium transactions"
  ON public.premium_transactions FOR SELECT USING (true);

CREATE POLICY "Users can insert own premium transaction record"
  ON public.premium_transactions FOR INSERT
  WITH CHECK (
    user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub')
    OR auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  );



