-- =============================================
-- FINAL CLEAN TABLE MANAGEMENT SYSTEM
-- Run in Supabase SQL Editor
-- Drops old tables and creates new clean schema
-- =============================================

-- Step 1: Drop old tables if they exist
DROP TABLE IF EXISTS payment_tokens CASCADE;
DROP TABLE IF EXISTS live_orders CASCADE;
DROP TABLE IF EXISTS restaurant_tables CASCADE;

-- =============================================
-- Step 2: Create restaurant_tables (source of truth)
-- =============================================
CREATE TABLE restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  table_number VARCHAR(20),
  table_token VARCHAR(255) UNIQUE NOT NULL,
  capacity INT DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  position_x REAL,
  position_y REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate table_token on insert
CREATE OR REPLACE FUNCTION set_table_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.table_token IS NULL OR NEW.table_token = '' THEN
    NEW.table_token := encode(gen_random_bytes(24), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER table_token_trigger
  BEFORE INSERT ON restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION set_table_token();

-- =============================================
-- Step 3: Create live_orders (only table_id FK)
-- =============================================
CREATE TABLE live_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  table_id UUID REFERENCES restaurant_tables(id),
  status VARCHAR(50) DEFAULT 'pending',
  order_code VARCHAR(50),
  total_price DECIMAL(10,2),
  items JSONB DEFAULT '[]'::jsonb,
  note TEXT,
  customer_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Step 4: Create payment_tokens (only table_id FK)
-- =============================================
CREATE TABLE payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES live_orders(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  table_id UUID REFERENCES restaurant_tables(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Step 5: Enable RLS and create policies
-- =============================================
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;

-- Allow all operations for development
CREATE POLICY "all_restaurant_tables" ON restaurant_tables FOR ALL USING (true);
CREATE POLICY "all_live_orders" ON live_orders FOR ALL USING (true);
CREATE POLICY "all_payment_tokens" ON payment_tokens FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON restaurant_tables TO anon, authenticated;
GRANT ALL ON live_orders TO anon, authenticated;
GRANT ALL ON payment_tokens TO anon, authenticated;

-- =============================================
-- Step 6: Insert sample tables for your restaurant
-- =============================================
-- Replace 'YOUR-RESTAURANT-ID-HERE' with actual restaurant UUID
INSERT INTO restaurant_tables (restaurant_id, table_number, capacity) VALUES
('YOUR-RESTAURANT-ID-HERE', 'T1', 4),
('YOUR-RESTAURANT-ID-HERE', 'T2', 4),
('YOUR-RESTAURANT-ID-HERE', 'T3', 6),
('YOUR-RESTAURANT-ID-HERE', 'T4', 2),
('YOUR-RESTAURANT-ID-HERE', 'T5', 8)
RETURNING id, table_number, table_token;

-- =============================================
-- Test queries:
-- =============================================
-- SELECT * FROM restaurant_tables;
-- SELECT * FROM live_orders;
-- SELECT * FROM payment_tokens;