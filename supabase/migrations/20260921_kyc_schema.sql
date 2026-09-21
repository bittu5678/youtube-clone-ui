-- ==============================================================================
-- FaceTube - KYC (Personal KYC & Bank KYC) Database Tables
-- Supabase PostgreSQL Schema
-- ==============================================================================

-- 1. Create personal_kyc table
CREATE TABLE IF NOT EXISTS public.personal_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(10) UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  mobile VARCHAR(25) NOT NULL,
  dob VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  nominee_name VARCHAR(150),
  nominee_relation VARCHAR(100),
  nominee_mobile VARCHAR(25),
  status VARCHAR(20) DEFAULT 'Submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast user lookup
CREATE UNIQUE INDEX IF NOT EXISTS personal_kyc_user_id_idx ON public.personal_kyc (user_id);

-- Enable RLS
ALTER TABLE public.personal_kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to personal_kyc"
  ON public.personal_kyc
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Create bank_kyc table
CREATE TABLE IF NOT EXISTS public.bank_kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(10) UNIQUE NOT NULL,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(30) NOT NULL,
  branch_name TEXT,
  account_type VARCHAR(20) DEFAULT 'Saving',
  upi_id VARCHAR(100),
  upi_qr_code TEXT,
  status VARCHAR(20) DEFAULT 'Submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast user lookup
CREATE UNIQUE INDEX IF NOT EXISTS bank_kyc_user_id_idx ON public.bank_kyc (user_id);

-- Enable RLS
ALTER TABLE public.bank_kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to bank_kyc"
  ON public.bank_kyc
  FOR ALL
  USING (true)
  WITH CHECK (true);
