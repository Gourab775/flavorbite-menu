-- ============================================================
-- MINIMAL FIX: Add RLS Policies to Enable Data Access
-- Run this in Supabase SQL Editor NOW
-- ============================================================

-- 1. Add RLS Policy to restaurants table (CRITICAL)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read restaurants" ON public.restaurants;
CREATE POLICY "public read restaurants" ON public.restaurants
    FOR SELECT USING (true);

-- 2. Add RLS Policy to categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read categories" ON public.categories;
CREATE POLICY "public read categories" ON public.categories
    FOR SELECT USING (true);

-- 3. Add RLS Policy to menu_items table
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read menu_items" ON public.menu_items;
CREATE POLICY "public read menu_items" ON public.menu_items
    FOR SELECT USING (true);

-- 4. Add RLS Policy to featured_items table
ALTER TABLE public.featured_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read featured_items" ON public.featured_items;
CREATE POLICY "public read featured_items" ON public.featured_items
    FOR SELECT USING (true);

-- 5. Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;