-- ============================================================
-- Migration: Create waiter_calls table
-- Columns: restaurant_id, table_id, order_code, session_order_id,
--          status, created_at (no extra columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.waiter_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    table_id UUID NOT NULL,
    order_code TEXT,
    session_order_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW()
);

-- Allow anonymous inserts
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert waiter_calls" ON public.waiter_calls;
CREATE POLICY "anon insert waiter_calls" ON public.waiter_calls
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon select waiter_calls" ON public.waiter_calls;
CREATE POLICY "anon select waiter_calls" ON public.waiter_calls
    FOR SELECT USING (true);

GRANT ALL ON public.waiter_calls TO anon, authenticated;
