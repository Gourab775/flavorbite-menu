-- =============================================
-- SUPABASE SQL - Run in SQL Editor
-- https://app.supabase.com/project/YOUR_PROJECT/sql
-- =============================================

-- =============================================
-- Step 1: Check live_orders table structure
-- =============================================
-- Run: SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'live_orders';

-- =============================================
-- Step 2: Add RLS policies for live_orders
-- =============================================

ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;

-- Check existing policies
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'live_orders';

-- Create INSERT policy (allow all for now - restrict in production)
DROP POLICY IF EXISTS "Allow insert on live_orders" ON live_orders;
CREATE POLICY "Allow insert on live_orders" ON live_orders FOR INSERT WITH CHECK (true);

-- Create SELECT policy
DROP POLICY IF EXISTS "Allow select on live_orders" ON live_orders;
CREATE POLICY "Allow select on live_orders" ON live_orders FOR SELECT USING (true);

-- Create UPDATE policy
DROP POLICY IF EXISTS "Allow update on live_orders" ON live_orders;
CREATE POLICY "Allow update on live_orders" ON live_orders FOR UPDATE USING (true);

-- =============================================
-- Step 3: Grant permissions
-- =============================================
GRANT ALL ON live_orders TO anon, authenticated;
GRANT ALL ON live_orders TO service_role;

-- =============================================
-- Step 4: Create payment_tokens table (if not exists)
-- =============================================
CREATE TABLE IF NOT EXISTS payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  table_ref VARCHAR(50),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_order ON payment_tokens(order_id);

ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on payment_tokens" ON payment_tokens;
CREATE POLICY "Allow all on payment_tokens" ON payment_tokens FOR ALL USING (true);

GRANT ALL ON payment_tokens TO anon, authenticated;
GRANT ALL ON payment_tokens TO service_role;

-- =============================================
-- Step 5: Test insertion
-- =============================================
-- After running above, test with:
-- INSERT INTO live_orders (restaurant_id, table_ref, items, status, payment_mode, order_code, total_price)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'T1', '[{"name":"Test","price":100}]'::jsonb, 'pending', 'online', 'ORD-9999', 105)
-- RETURNING id, order_code;