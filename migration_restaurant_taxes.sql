-- ============================================================
-- Migration: Add multi-tax support
-- ============================================================
-- Creates restaurant_taxes table and adds tax snapshot columns
-- to live_orders for historical order preservation.
-- ============================================================

-- 1. restaurant_taxes table (one restaurant → many taxes)
CREATE TABLE IF NOT EXISTS public.restaurant_taxes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  percentage numeric(5,2) NOT NULL,
  type text NOT NULL DEFAULT 'exclusive'::text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT restaurant_taxes_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_taxes_restaurant_id_fkey
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  CONSTRAINT restaurant_taxes_type_check
    CHECK (type IN ('inclusive', 'exclusive'))
);

CREATE INDEX IF NOT EXISTS idx_restaurant_taxes_restaurant_id
  ON public.restaurant_taxes USING btree (restaurant_id);

-- 2. Add tax snapshot columns to live_orders
ALTER TABLE public.live_orders
  ADD COLUMN IF NOT EXISTS subtotal integer NULL,
  ADD COLUMN IF NOT EXISTS total_tax integer NULL,
  ADD COLUMN IF NOT EXISTS tax_breakdown jsonb NULL;
