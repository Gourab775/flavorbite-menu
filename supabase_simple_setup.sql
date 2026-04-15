-- =============================================
-- SIMPLE VERSION - Run in Supabase SQL Editor
-- =============================================

-- First, let's see what columns you have:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'live_orders'
-- ORDER BY ordinal_position;

-- =============================================
-- Option A: If live_orders table already exists
-- =============================================

-- Check and fix RLS
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate simple ones
DROP POLICY IF EXISTS "Insert allow" ON live_orders;
DROP POLICY IF EXISTS "Select allow" ON live_orders;
DROP POLICY IF EXISTS "Update allow" ON live_orders;

-- Allow all operations (for development)
CREATE POLICY "Insert allow" ON live_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Select allow" ON live_orders FOR SELECT USING (true);
CREATE POLICY "Update allow" ON live_orders FOR UPDATE USING (true);

-- Grant permissions  
GRANT ALL ON live_orders TO anon, authenticated;

-- =============================================
-- Option B: Create fresh table (only if doesn't exist)
-- =============================================
-- DROP TABLE IF EXISTS live_orders;
-- CREATE TABLE live_orders (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   restaurant_id UUID NOT NULL,
--   status VARCHAR(50) DEFAULT 'pending',
--   order_code VARCHAR(50),
--   total_price DECIMAL(10,2),
--   payment_mode VARCHAR(50),
--   items JSONB DEFAULT '[]'::jsonb,
--   table_ref VARCHAR(50),
--   note TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =============================================
-- Test query - run this in SQL Editor:
-- =============================================
-- This will show you the exact error if insert fails
-- SELECT 'Testing insert' as test;