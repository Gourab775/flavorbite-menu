-- =============================================
-- NON-DESTRUCTIVE FIX - Run in Supabase SQL Editor
-- =============================================
-- This ensures live_orders has the correct columns
-- Does NOT drop or delete any existing data

-- Step 1: Show current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'live_orders'
ORDER BY ordinal_position;

-- Step 2: Add table_ref column if missing (safe to run even if exists)
ALTER TABLE live_orders ADD COLUMN IF NOT EXISTS table_ref VARCHAR(100);

-- Step 3: Drop table_id column if it exists (the code now auto-detects but prefers table_ref)
-- If you want to keep table_id AND add table_ref, comment the next line out
-- ALTER TABLE live_orders DROP COLUMN IF EXISTS table_id;

-- Step 4: Ensure RLS allows inserts
ALTER TABLE live_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert" ON live_orders;
CREATE POLICY "Allow insert" ON live_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select" ON live_orders;
CREATE POLICY "Allow select" ON live_orders FOR SELECT USING (true);

GRANT ALL ON live_orders TO anon, authenticated;

-- Step 5: Verify column was added
SELECT 'table_ref column ready' AS result
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'live_orders'
    AND column_name = 'table_ref'
);

-- =============================================
-- After running, test Confirm Order in the app
-- Check browser console for exact payload and errors
-- =============================================
