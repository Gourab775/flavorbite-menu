-- =============================================
-- QUICK FIX - Run in Supabase SQL Editor
-- =============================================
-- This will fix the 400 error

-- Step 1: Check current table structure first
-- (don't run if you already have a working table)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'live_orders';

-- =============================================
-- Run this to SETUP correctly:
-- =============================================

-- Enable RLS and create policies (MINIMUM needed)
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert" ON live_orders;
CREATE POLICY "Allow insert" ON live_orders FOR INSERT WITH CHECK (true);

GRANT ALL ON live_orders TO anon, authenticated;

-- Now create the table if needed (delete old one first)
DROP TABLE IF EXISTS live_orders;

CREATE TABLE live_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  order_code VARCHAR(50),
  total_price DECIMAL(10,2),
  payment_mode VARCHAR(50),
  items JSONB DEFAULT '[]'::jsonb,
  table_ref VARCHAR(100),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-enable after table creation
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON live_orders FOR ALL USING (true);
GRANT ALL ON live_orders TO anon, authenticated;

-- Create payment_tokens table
DROP TABLE IF EXISTS payment_tokens;

CREATE TABLE payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  token VARCHAR(255),
  table_ref VARCHAR(100),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all tokens" ON payment_tokens FOR ALL USING (true);
GRANT ALL ON payment_tokens TO anon, authenticated;

-- =============================================
-- After running this SQL, test by clicking Pay Online button
-- Check browser console for exact error if still failing
-- =============================================