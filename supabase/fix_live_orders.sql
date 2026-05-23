-- ============================================================
-- FIX: Supabase SQL — live_orders with items as JSONB
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create live_orders table
CREATE TABLE IF NOT EXISTS live_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add items column if table already exists (JSONB)
ALTER TABLE live_orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]';

-- 3. Drop order_items table (no longer needed)
DROP TABLE IF EXISTS order_items CASCADE;

-- 4. Disable RLS for development
ALTER TABLE live_orders DISABLE ROW LEVEL SECURITY;

-- 5. For production with RLS enabled, use this policy:
-- DROP POLICY IF EXISTS "Allow all inserts on live_orders" ON live_orders;
-- CREATE POLICY "Allow all inserts on live_orders" ON live_orders
--   FOR INSERT WITH CHECK (true);

-- 6. Verify table
SELECT 'live_orders ready' AS result
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'live_orders'
    AND column_name = 'items'
);
