-- ══════════════════════════════════════════════════════
-- Fix: Orders table RLS policies
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- Ensure RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop all existing order policies to avoid conflicts
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON orders';
  END LOOP;
END $$;

-- 1. Anyone (even unauthenticated) can place an order
CREATE POLICY "Anyone can place orders"
ON orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Anyone can read orders (for order tracking by phone)
CREATE POLICY "Anyone can read orders"
ON orders FOR SELECT
TO anon, authenticated
USING (true);

-- 3. Admins & market managers can update ANY order
CREATE POLICY "Admin can update any order"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'market_manager')
  )
)
WITH CHECK (true);

-- 4. Shop owners can update orders for their own shops
CREATE POLICY "Shop owner can update own shop orders"
ON orders FOR UPDATE
TO authenticated
USING (
  shop_id IN (
    SELECT id FROM shops WHERE owner_id = auth.uid()
  )
)
WITH CHECK (true);

-- Add missing columns if not present
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS product_name  TEXT,
  ADD COLUMN IF NOT EXISTS quantity      INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS notes         TEXT,
  ADD COLUMN IF NOT EXISTS total_amount  NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
