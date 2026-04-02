-- ============================================================
-- Schema Migration: Complete restaurant menu system
-- IMPORTANT: This preserves existing restaurant data
-- Run this in Supabase SQL editor to set up all tables
-- ============================================================

-- ============================================================
-- 1. Ensure restaurants table has all required columns
-- ============================================================
-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    payment_id TEXT,
    created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW()
);

-- Add any missing columns (safe - won't fail if they exist)
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);

-- ============================================================
-- 2. Create categories table if it doesn't exist
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON public.categories(restaurant_id);

-- ============================================================
-- 3. Create menu_items table if it doesn't exist
-- ============================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_veg BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);

-- ============================================================
-- 4. Create featured_items table if it doesn't exist
-- ============================================================
CREATE TABLE IF NOT EXISTS public.featured_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    redirect_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_items_restaurant_id ON public.featured_items(restaurant_id);

-- ============================================================
-- 5. Enable RLS on all tables
-- ============================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. Drop existing policies (safe - won't fail if they don't exist)
-- ============================================================
DROP POLICY IF EXISTS "public read restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "public read categories" ON public.categories;
DROP POLICY IF EXISTS "public read menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "public read featured_items" ON public.featured_items;

-- ============================================================
-- 7. Create RLS policies for public read access
-- ============================================================
-- Restaurants: Allow public read (required for app to fetch restaurant data)
CREATE POLICY "public read restaurants" ON public.restaurants
    FOR SELECT USING (true);

-- Categories: Allow public read
CREATE POLICY "public read categories" ON public.categories
    FOR SELECT USING (true);

-- Menu Items: Allow public read
CREATE POLICY "public read menu_items" ON public.menu_items
    FOR SELECT USING (true);

-- Featured Items: Allow public read
CREATE POLICY "public read featured_items" ON public.featured_items
    FOR SELECT USING (true);

-- ============================================================
-- 8. Verify existing restaurant data
-- ============================================================
-- This displays your existing restaurants without modifying them
SELECT 'Current restaurants in database:' AS info;
SELECT id, name, slug, payment_id FROM public.restaurants ORDER BY created_at DESC;