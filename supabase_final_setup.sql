-- =============================================
-- Execute this in Supabase SQL Editor
-- https://app.supabase.com/project/YOUR_PROJECT/sql
-- =============================================

-- Step 1: Create live_orders table (if not exists)
-- Adjust column names based on your actual schema
CREATE TABLE IF NOT EXISTS live_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  table_ref VARCHAR(50),
  items JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'pending',
  payment_mode VARCHAR(50),
  order_code VARCHAR(50),
  total_price DECIMAL(10,2),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add columns if they don't exist (for existing tables)
-- ALTER TABLE live_orders ADD COLUMN IF NOT EXISTS table_ref VARCHAR(50);
-- ALTER TABLE live_orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Step 3: Enable RLS
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies
DROP POLICY IF EXISTS "Allow insert live_orders" ON live_orders;
CREATE POLICY "Allow insert live_orders" ON live_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select live_orders" ON live_orders;
CREATE POLICY "Allow select live_orders" ON live_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update live_orders" ON live_orders;
CREATE POLICY "Allow update live_orders" ON live_orders FOR UPDATE USING (true);

-- Step 5: Grant permissions
GRANT ALL ON live_orders TO anon, authenticated;
GRANT ALL ON live_orders TO service_role;

-- =============================================
-- If you already have live_orders table, check its structure:
-- Run this to see columns:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'live_orders';
-- =============================================

-- =============================================
-- Test insertion (run after setup):
-- INSERT INTO live_orders (
--   restaurant_id, 
--   table_ref, 
--   items, 
--   status, 
--   payment_mode, 
--   order_code, 
--   total_price
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'T1',
--   '[{"name":"Test Item","price":100,"quantity":1}]'::jsonb,
--   'pending',
--   'counter',
--   'ORD-1234',
--   105
-- ) RETURNING id, order_code;
-- =============================================