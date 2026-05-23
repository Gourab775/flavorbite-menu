-- =============================================
-- RESTAURANT TABLES + ORDERING FLOW
-- Run in Supabase SQL Editor
-- =============================================

-- =============================================
-- Step 1: Create restaurant_tables table
-- =============================================
DROP TABLE IF EXISTS restaurant_tables CASCADE;
DROP TABLE IF EXISTS live_orders CASCADE;
DROP TABLE IF EXISTS payment_tokens CASCADE;

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

-- =============================================
-- Step 2: Create live_orders with FK to restaurant_tables
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
-- Step 3: Create payment_tokens table
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
-- Step 4: Enable RLS on all tables
-- =============================================
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Step 5: Create RLS policies
-- =============================================

-- restaurant_tables: allow all for now
CREATE POLICY "tables_all" ON restaurant_tables FOR ALL USING (true);
GRANT ALL ON restaurant_tables TO anon, authenticated;

-- live_orders: allow all
CREATE POLICY "orders_all" ON live_orders FOR ALL USING (true);
GRANT ALL ON live_orders TO anon, authenticated;

-- payment_tokens: allow all  
CREATE POLICY "tokens_all" ON payment_tokens FOR ALL USING (true);
GRANT ALL ON payment_tokens TO anon, authenticated;

-- =============================================
-- Step 6: Create function to get table by QR token
-- =============================================
CREATE OR REPLACE FUNCTION get_table_by_token(p_token TEXT)
RETURNS TABLE(
  id UUID,
  restaurant_id UUID,
  table_number VARCHAR,
  table_token VARCHAR,
  capacity INT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id,
    rt.restaurant_id,
    rt.table_number,
    rt.table_token,
    rt.capacity,
    rt.is_active
  FROM restaurant_tables rt
  WHERE rt.table_token = p_token AND rt.is_active = true;
END;
$$;

-- =============================================
-- Step 7: Create trigger function to generate table token
-- =============================================
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
-- Step 8: Grant execute permission
-- =============================================
GRANT EXECUTE ON FUNCTION get_table_by_token TO anon, authenticated;

-- =============================================
-- Step 9: Sample data - insert tables for a restaurant
-- =============================================
INSERT INTO restaurant_tables (restaurant_id, table_number, capacity) VALUES
('00000000-0000-0000-0000-000000000001', 'T1', 4),
('00000000-0000-0000-0000-000000000001', 'T2', 4),
('00000000-0000-0000-0000-000000000001', 'T3', 6),
('00000000-0000-0000-0000-000000000001', 'T4', 2),
('00000000-0000-0000-0000-000000000001', 'T5', 8)
RETURNING id, table_number, table_token;

-- Note: Copy the table_token values for your QR codes!
-- Example QR URL: https://yourapp.com/restaurant-slug/t/YOUR_TOKEN_HERE
-- =============================================