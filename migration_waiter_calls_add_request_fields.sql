-- Add request_type_id, request_type_name, and custom_message columns to waiter_calls
-- Run this in your Supabase SQL editor

ALTER TABLE public.waiter_calls
  ADD COLUMN IF NOT EXISTS request_type_id uuid NULL,
  ADD COLUMN IF NOT EXISTS request_type_name text NULL,
  ADD COLUMN IF NOT EXISTS custom_message text NULL;
