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

-- Enable Row-Level Security
ALTER TABLE main_categories ENABLE ROW LEVEL SECURITY;

-- Allow anonymous select access (read-only)
CREATE POLICY "Anyone can view main_categories"
  ON main_categories FOR SELECT
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_main_categories_restaurant_id ON main_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_main_category_id ON categories(main_category_id);
