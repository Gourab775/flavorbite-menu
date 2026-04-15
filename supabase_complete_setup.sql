-- =============================================
-- COMPLETE SUPABASE SETUP
-- Run ALL of this in your Supabase SQL Editor
-- https://app.supabase.com/project/YOUR_PROJECT/sql
-- =============================================

-- Step 1: Drop and recreate live_orders with correct schema
DROP TABLE IF EXISTS live_orders CASCADE;
DROP TABLE IF EXISTS payment_tokens CASCADE;

CREATE TABLE live_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  order_code VARCHAR(50) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  payment_mode VARCHAR(50),
  items JSONB DEFAULT '[]'::jsonb,
  table_ref VARCHAR(100),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create payment_tokens table  
CREATE TABLE payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  table_ref VARCHAR(100),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (allow all for development)
CREATE POLICY "live_orders_insert" ON live_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "live_orders_select" ON live_orders FOR SELECT USING (true);
CREATE POLICY "live_orders_update" ON live_orders FOR UPDATE USING (true);

CREATE POLICY "payment_tokens_insert" ON payment_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "payment_tokens_select" ON payment_tokens FOR SELECT USING (true);
CREATE POLICY "payment_tokens_update" ON payment_tokens FOR UPDATE USING (true);
CREATE POLICY "payment_tokens_delete" ON payment_tokens FOR DELETE USING (true);

-- Step 5: Grant permissions
GRANT ALL ON live_orders TO anon, authenticated;
GRANT ALL ON live_orders TO service_role;
GRANT ALL ON payment_tokens TO anon, authenticated;
GRANT ALL ON payment_tokens TO service_role;

-- Step 6: Test insert (run this to verify it works)
INSERT INTO live_orders (restaurant_id, order_code, total_price, payment_mode, items)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'TEST-001',
  199.00,
  'online',
  '[{"name":"Test Item","price":199}]'::jsonb
)
RETURNING id, order_code;

-- If you see a row with TEST-001, the table is working!
-- =============================================