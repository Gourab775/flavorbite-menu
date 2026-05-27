-- Create main_categories table
CREATE TABLE IF NOT EXISTS main_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add main_category_id column to existing categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS main_category_id UUID REFERENCES main_categories(id) ON DELETE SET NULL;

-- Create landing_page_settings table for dynamic background video per restaurant
CREATE TABLE IF NOT EXISTS landing_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE,
  background_video_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous select access (read-only)
CREATE POLICY "Anyone can view main_categories"
  ON main_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view landing_page_settings"
  ON landing_page_settings FOR SELECT
  USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_main_categories_restaurant_id ON main_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_main_category_id ON categories(main_category_id);
