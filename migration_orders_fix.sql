-- ══════════════════════════════════════════════════════════════
--  শিবের বাজার — Orders Table Fix
--  Run in: Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Add total_amount column (fixes ৳0 / INSERT failure)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0;

-- 2. Fix status CHECK constraint — old one only had 5 statuses,
--    new UI uses: confirmed, processing, shipped, cancelled too.
--    Drop old constraint first, then add the new one.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'rejected'
  ));

-- 3. Ensure RLS policies exist (idempotent — safe to re-run)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public insert (anon + logged-in users can place orders)
DROP POLICY IF EXISTS "orders_public_insert" ON orders;
CREATE POLICY "orders_public_insert"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public select (order tracking by phone)
DROP POLICY IF EXISTS "orders_public_select" ON orders;
CREATE POLICY "orders_public_select"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Owner + admin update
DROP POLICY IF EXISTS "orders_owner_update" ON orders;
CREATE POLICY "orders_owner_update"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'market_manager')
    )
  )
  WITH CHECK (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
