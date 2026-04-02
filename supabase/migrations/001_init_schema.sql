-- Schema for restaurants table
-- Run this in Supabase SQL editor to set up the restaurants table

-- Create restaurants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    payment_id TEXT,
    created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on restaurants table
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for testing)
DROP POLICY IF EXISTS "public read restaurants" ON public.restaurants;
CREATE POLICY "public read restaurants" ON public.restaurants
    FOR SELECT USING (true);

-- Insert demo restaurant if it doesn't exist
INSERT INTO public.restaurants (id, name, slug, logo, payment_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Restaurant',
    'demo-restaurant',
    'https://example.com/logo.png',
    'demo-payment-id'
)
ON CONFLICT (slug) DO NOTHING;

-- Also insert the restaurant from env vars for completeness
INSERT INTO public.restaurants (id, name, slug, logo, payment_id)
VALUES (
    'f9324acc-ea1e-47ae-9ebc-9a66c61cd53b',
    'Desi Spice Kitchen',
    'desi-spice-kitchen',
    'https://example.com/logo2.png',
    'real-payment-id'
)
ON CONFLICT (slug) DO NOTHING;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);