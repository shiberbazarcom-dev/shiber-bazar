-- ══════════════════════════════════════════════════════════════════
--  SECURITY PATCH C1 — Orders table least-privilege RLS
--  Run in: Supabase Dashboard → SQL Editor → Run
--
--  What this does:
--   1. Removes the unrestricted "USING (true)" SELECT policy.
--   2. Adds two targeted policies: shop owner reads own orders,
--      admin reads all orders.
--   3. Creates a SECURITY DEFINER RPC so anonymous users can still
--      track their own orders by phone number (used by TrackOrder page).
--
--  Safe to re-run (all statements are idempotent).
-- ══════════════════════════════════════════════════════════════════

-- ── Step 1: Remove all existing unrestricted SELECT policies ──────
DROP POLICY IF EXISTS "orders_public_select"  ON orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON orders;

-- ── Step 2: Shop owners read only their own shop's orders ─────────
DROP POLICY IF EXISTS "orders_owner_select" ON orders;
CREATE POLICY "orders_owner_select"
ON orders FOR SELECT
TO authenticated
USING (
  shop_id IN (
    SELECT id FROM shops WHERE owner_id = auth.uid()
  )
);

-- ── Step 3: Admins read all orders ───────────────────────────────
DROP POLICY IF EXISTS "orders_admin_select" ON orders;
CREATE POLICY "orders_admin_select"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'market_manager')
  )
);

-- ── Step 4: RPC for anonymous order tracking by phone ─────────────
--  SECURITY DEFINER means this runs as the function owner (postgres),
--  bypassing RLS — intentionally, and only for this one use case.
--  The WHERE clause limits results to only the requested phone number.
CREATE OR REPLACE FUNCTION track_orders_by_phone(p_phone text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(row_to_json(t) ORDER BY t.created_at DESC),
    '[]'::json
  )
  FROM (
    SELECT
      o.id,
      o.order_number,
      o.shop_id,
      o.customer_name,
      o.customer_phone,
      o.customer_address,
      o.product_name,
      o.quantity,
      o.notes,
      o.status,
      o.total_amount,
      o.created_at,
      o.updated_at,
      json_build_object(
        'shop_name', s.shop_name,
        'phone',     s.phone
      ) AS shops
    FROM orders o
    LEFT JOIN shops s ON s.id = o.shop_id
    WHERE o.customer_phone = p_phone
  ) t
$$;

-- Grant execute to both anonymous and authenticated callers
GRANT EXECUTE ON FUNCTION track_orders_by_phone(text) TO anon, authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
