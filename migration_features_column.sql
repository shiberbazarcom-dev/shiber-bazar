-- Add features/specifications column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
