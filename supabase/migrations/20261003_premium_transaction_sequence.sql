-- ==============================================================================
-- FaceTube - Persistent Premium Transaction Sequence & Special Rules Migration
-- Migration: 20261003_premium_transaction_sequence.sql
-- ==============================================================================

-- 1. Sequential Global Premium Transaction Counter Sequence
CREATE SEQUENCE IF NOT EXISTS public.premium_tx_seq START WITH 1 INCREMENT BY 1;

-- 2. Persistent Premium Transactions Table
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

-- Unique indexes guaranteeing persistent uniqueness and strict idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_premium_tx_payment_id ON public.premium_transactions (payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_premium_tx_number ON public.premium_transactions (tx_number);
CREATE INDEX IF NOT EXISTS idx_premium_tx_user_id ON public.premium_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_premium_tx_special ON public.premium_transactions (is_special, special_tag);

-- 3. Row Level Security (RLS)
ALTER TABLE public.premium_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view audit summary of premium transactions"
  ON public.premium_transactions
  FOR SELECT
  USING (true);

-- Insert restricted to backend service or authenticated uploads
CREATE POLICY "Users can insert own premium transaction record"
  ON public.premium_transactions
  FOR INSERT
  WITH CHECK (
    user_id = coalesce(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub')
    OR auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  );

-- 4. Stored Procedure for Atomic Transaction Number Allocation
CREATE OR REPLACE FUNCTION public.get_next_premium_tx_number()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next BIGINT;
BEGIN
  SELECT nextval('public.premium_tx_seq') INTO v_next;
  RETURN v_next;
END;
$$;
