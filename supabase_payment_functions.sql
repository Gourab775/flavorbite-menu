-- IMPORTANT: Execute this SQL in your Supabase SQL Editor
-- https://app.supabase.com/project/YOUR_PROJECT/sql

-- Step 1: Create payment_tokens table
CREATE TABLE IF NOT EXISTS payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES live_orders(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  table_ref VARCHAR(50),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_payment_tokens_token ON payment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_order ON payment_tokens(order_id);

-- Step 2: Create function to create order with token
CREATE OR REPLACE FUNCTION create_order_with_token(
  p_restaurant_id UUID,
  p_table VARCHAR(50),
  p_item_ids TEXT[],  -- Changed from UUID[] to TEXT[]
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_order_code TEXT;
  v_token TEXT;
  v_total DECIMAL(10,2);
  v_item RECORD;
  v_items JSONB;
  v_payload JSONB;
  v_item_id UUID;
BEGIN
  -- Generate order code
  v_order_code := 'ORD-' || (1000 + floor(random() * 9000)::INT)::TEXT;
  
  -- Calculate total and get item details
  v_items := '[]'::JSONB;
  v_total := 0;
  
  FOREACH v_item_id IN ARRAY p_item_ids
  LOOP
    SELECT mi.id, mi.name, mi.price, mi.is_veg
    INTO v_item
    FROM menu_items mi
    WHERE mi.id = v_item_id::UUID AND mi.restaurant_id = p_restaurant_id;
    
    IF FOUND THEN
      v_total := v_total + v_item.price;
      v_items := v_items || jsonb_build_object(
        'id', v_item.id,
        'name', v_item.name,
        'price', v_item.price,
        'is_veg', v_item.is_veg
      )::JSONB;
    END IF;
  END LOOP;
  
  -- Add tax (5%)
  v_total := v_total * 1.05;
  
  -- Create order
  INSERT INTO live_orders (
    restaurant_id,
    table_ref,
    items,
    status,
    payment_mode,
    order_code,
    total_price,
    note
  ) VALUES (
    p_restaurant_id,
    p_table,
    v_items,
    'pending',
    'online',
    v_order_code,
    v_total,
    p_note
  )
  RETURNING id INTO v_order_id;
  
  -- Generate secure token
  v_token := encode(gen_random_bytes(16), 'hex');
  
  -- Insert payment token with 2-hour expiry
  INSERT INTO payment_tokens (order_id, token, table_ref, expires_at)
  VALUES (v_order_id, v_token, p_table, NOW() + INTERVAL '2 hours');
  
  -- Return token info
  v_payload := jsonb_build_object(
    'order_id', v_order_id,
    'order_code', v_order_code,
    'payment_token', v_token,
    'total_amount', v_total,
    'table', p_table,
    'expires_at', (NOW() + INTERVAL '2 hours')::TIMESTAMPTZ
  );
  
  RETURN v_payload;
END;
$$;

-- Step 3: Create function to validate payment token
CREATE OR REPLACE FUNCTION validate_payment_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_row payment_tokens%ROWTYPE;
  v_order live_orders%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Find token
  SELECT * INTO v_token_row
  FROM payment_tokens
  WHERE token = p_token AND (used_at IS NULL OR used_at > NOW() - INTERVAL '1 minute');

  IF NOT FOUND THEN
    -- Also check if token exists regardless of used_at
    SELECT * INTO v_token_row
    FROM payment_tokens
    WHERE token = p_token
    LIMIT 1;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'valid', false,
        'invalid', true,
        'expired', false,
        'error', 'Token not found'
      );
    END IF;
    
    -- Token exists but was used or expired
    RETURN jsonb_build_object(
      'valid', false,
      'invalid', false,
      'expired', true,
      'error', 'Token expired or already used'
    );
  END IF;
  
  -- Check expiry
  IF v_token_row.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'invalid', false,
      'expired', true,
      'error', 'Token expired'
    );
  END IF;
  
  -- Get order details
  SELECT * INTO v_order
  FROM live_orders
  WHERE id = v_token_row.order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'invalid', true,
      'expired', false,
      'error', 'Order not found'
    );
  END IF;
  
  -- Return valid order data
  v_result := jsonb_build_object(
    'valid', true,
    'invalid', false,
    'expired', false,
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'total_amount', v_order.total_price,
    'table', v_token_row.table_ref,
    'items', v_order.items
  );
  
  RETURN v_result;
END;
$$;

-- Step 4: Enable RLS and create policies
ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert tokens (for now)
DROP POLICY IF EXISTS "Allow insert on payment_tokens" ON payment_tokens;
CREATE POLICY "Allow insert on payment_tokens" ON payment_tokens FOR INSERT WITH CHECK (true);

-- Allow anyone to validate tokens
DROP POLICY IF EXISTS "Allow select on payment_tokens" ON payment_tokens;
CREATE POLICY "Allow select on payment_tokens" ON payment_tokens FOR SELECT USING (true);

-- Allow anyone to update tokens
DROP POLICY IF EXISTS "Allow update on payment_tokens" ON payment_tokens;
CREATE POLICY "Allow update on payment_tokens" ON payment_tokens FOR UPDATE USING (true);

-- Step 5: Grant execute permissions (if needed)
GRANT EXECUTE ON FUNCTION create_order_with_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_payment_token TO anon, authenticated;

-- Test by uncommenting and running:
-- SELECT create_order_with_token('00000000-0000-0000-0000-000000000001'::UUID, 'T1', ARRAY['item-id-1', 'item-id-2'], 'Test order');