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
