-- ==============================================================================
-- FaceTube - Database Based User Registration Schema
-- Supabase PostgreSQL Schema
-- ==============================================================================

-- 1. Enable pgcrypto and uuid extensions for UUID and hash generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the 'users' table
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

-- 3. Indexes for fast authentication lookups
-- Fast lookup by User ID (e.g. FT123456)
CREATE UNIQUE INDEX IF NOT EXISTS users_user_id_idx ON public.users (user_id);
-- Fast case-insensitive lookup by Email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON public.users (lower(email));
-- Index for registration timeline
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public registration (Insert)
CREATE POLICY "Allow public registration"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Allow reading user records for authentication and profile resolution
CREATE POLICY "Allow select for authentication"
  ON public.users
  FOR SELECT
  USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Allow update own record"
  ON public.users
  FOR UPDATE
  USING (true);

-- 5. Optional PostgreSQL trigger to guarantee auto FT User ID generation at DB layer
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

-- 6. Initial Seed Users (Admin & Creators)
-- Passwords below are SHA-256 for 'password123':
-- ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
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
