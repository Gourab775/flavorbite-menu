-- =============================================
-- SUPABASE SQL - Execute in SQL Editor
-- https://app.supabase.com/project/YOUR_PROJECT/sql
-- =============================================

-- Step 1: Create payment_tokens table
CREATE TABLE IF NOT EXISTS payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  table_ref VARCHAR(50),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_order ON payment_tokens(order_id);

-- Step 2: Enable RLS
ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow insert on payment_tokens" ON payment_tokens;
CREATE POLICY "Allow insert on payment_tokens" ON payment_tokens FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select on payment_tokens" ON payment_tokens;
CREATE POLICY "Allow select on payment_tokens" ON payment_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update on payment_tokens" ON payment_tokens;
CREATE POLICY "Allow update on payment_tokens" ON payment_tokens FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on payment_tokens" ON payment_tokens;
CREATE POLICY "Allow delete on payment_tokens" ON payment_tokens FOR DELETE USING (true);

-- GRANT permissions
GRANT ALL ON payment_tokens TO anon, authenticated;
GRANT ALL ON payment_tokens TO service_role;

-- =============================================
-- To test manually, run this in SQL Editor:
-- =============================================
-- INSERT INTO payment_tokens (order_id, token, table_ref, expires_at)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'test-token-123', 'T1', NOW() + INTERVAL '2 hours')
-- RETURNING id, token, expires_at;
-- =============================================