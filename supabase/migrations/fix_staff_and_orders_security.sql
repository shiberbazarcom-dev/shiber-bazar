-- ══════════════════════════════════════════════════════════════════
--  Fix: staff PIN login security + orders RLS/RPC gaps
--  Run in: Supabase Dashboard → SQL Editor → Run
--  Safe to re-run (idempotent).
--
--  Fixes:
--   1. orders: guarantee no anon/authenticated blanket SELECT policy
--      remains (older scripts in this repo re-add "USING (true)" —
--      this migration is the source of truth going forward).
--   2. orders: add missing columns referenced by app code but never
--      migrated (customer_id, staff_updated_by/at) — defensive,
--      no-ops if already present.
--   3. place_order_public: was missing p_user_id, so every order
--      placed by a logged-in customer never got linked to their
--      account (customer_id stayed NULL forever).
--   4. track_orders_by_user / track_order_by_number: referenced by
--      src/hooks/useOrders.js but never defined anywhere — MyOrders
--      page and "track by order number" were calling a function
--      that doesn't exist.
--   5. Staff panel (StaffOrders.jsx) queries `orders` directly as
--      anon (staff use a custom PIN/token session, not Supabase
--      Auth), which orders RLS was never scoped to allow. New
--      SECURITY DEFINER RPCs verify the staff session token
--      server-side instead of trusting client-supplied shop_id.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Orders: lock down SELECT to owner/admin only ──────────────
DROP POLICY IF EXISTS "orders_public_select"   ON orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON orders;

DROP POLICY IF EXISTS "orders_owner_select" ON orders;
CREATE POLICY "orders_owner_select"
ON orders FOR SELECT
TO authenticated
USING (
  shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "orders_admin_select" ON orders;
CREATE POLICY "orders_admin_select"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'market_manager')
  )
);

-- ── 2. Missing columns referenced by app code ─────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS staff_updated_by text,
  ADD COLUMN IF NOT EXISTS staff_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- ── 3. place_order_public: link order to the logged-in customer ──
-- Old 8-arg version (pre-p_user_id) is a DIFFERENT overload in Postgres —
-- CREATE OR REPLACE won't touch it, so drop it explicitly first or the
-- name stays ambiguous for GRANT/PostgREST.
DROP FUNCTION IF EXISTS public.place_order_public(
  text, text, text, text, int, numeric, uuid, text
);

CREATE OR REPLACE FUNCTION public.place_order_public(
  p_customer_name    text,
  p_customer_phone   text,
  p_customer_address text,
  p_product_name     text,
  p_quantity         int,
  p_total_amount     numeric,
  p_shop_id          uuid DEFAULT NULL,
  p_notes            text DEFAULT NULL,
  p_user_id          uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  INSERT INTO public.orders (
    customer_name, customer_phone, customer_address,
    product_name, quantity, total_amount, shop_id, notes, customer_id
  ) VALUES (
    p_customer_name, p_customer_phone, p_customer_address,
    p_product_name, p_quantity, p_total_amount, p_shop_id, p_notes, p_user_id
  ) RETURNING * INTO v_order;

  RETURN row_to_json(v_order);
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order_public(
  text, text, text, text, int, numeric, uuid, text, uuid
) TO anon, authenticated;

-- ── 4a. track_orders_by_phone: add missing shop slug (chat link) ─
CREATE OR REPLACE FUNCTION public.track_orders_by_phone(p_phone text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
  FROM (
    SELECT
      o.id, o.order_number, o.shop_id, o.customer_name, o.customer_phone,
      o.customer_address, o.product_name, o.quantity, o.notes, o.status,
      o.total_amount, o.created_at, o.updated_at,
      json_build_object('shop_name', s.shop_name, 'slug', s.slug, 'phone', s.phone) AS shops
    FROM orders o
    LEFT JOIN shops s ON s.id = o.shop_id
    WHERE o.customer_phone = p_phone
  ) t
$$;

GRANT EXECUTE ON FUNCTION public.track_orders_by_phone(text) TO anon, authenticated;

-- ── 4b. track_orders_by_user: logged-in customer's own orders ────
CREATE OR REPLACE FUNCTION public.track_orders_by_user(p_user_id uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
  FROM (
    SELECT
      o.id, o.order_number, o.shop_id, o.customer_name, o.customer_phone,
      o.customer_address, o.product_name, o.quantity, o.notes, o.status,
      o.total_amount, o.created_at, o.updated_at,
      json_build_object('shop_name', s.shop_name, 'slug', s.slug, 'phone', s.phone) AS shops
    FROM orders o
    LEFT JOIN shops s ON s.id = o.shop_id
    WHERE o.customer_id = p_user_id
  ) t
$$;

GRANT EXECUTE ON FUNCTION public.track_orders_by_user(uuid) TO anon, authenticated;

-- ── 4c. track_order_by_number: single order, public tracking ─────
CREATE OR REPLACE FUNCTION public.track_order_by_number(p_order_number text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(t)
  FROM (
    SELECT
      o.id, o.order_number, o.shop_id, o.customer_name, o.customer_phone,
      o.customer_address, o.product_name, o.quantity, o.notes, o.status,
      o.total_amount, o.created_at, o.updated_at,
      json_build_object('shop_name', s.shop_name, 'slug', s.slug, 'phone', s.phone) AS shops
    FROM orders o
    LEFT JOIN shops s ON s.id = o.shop_id
    WHERE o.order_number = p_order_number
    LIMIT 1
  ) t
$$;

GRANT EXECUTE ON FUNCTION public.track_order_by_number(text) TO anon, authenticated;

-- ── 5a. Staff session helper (internal — not granted to anon) ────
CREATE OR REPLACE FUNCTION public._staff_from_token(p_token text)
RETURNS public.shop_staff
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff public.shop_staff%ROWTYPE;
BEGIN
  SELECT ss.* INTO v_staff
  FROM public.staff_sessions s
  JOIN public.shop_staff ss ON ss.id = s.staff_id
  WHERE s.token = p_token
    AND s.expires_at > now()
    AND ss.is_active = true;
  RETURN v_staff;
END;
$$;

-- ── 5b. Staff: list orders for their own shop ─────────────────────
CREATE OR REPLACE FUNCTION public.staff_list_orders(p_token text)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff public.shop_staff%ROWTYPE;
BEGIN
  v_staff := public._staff_from_token(p_token);
  IF v_staff.id IS NULL THEN
    RAISE EXCEPTION 'invalid_session';
  END IF;

  RETURN QUERY
  SELECT * FROM public.orders WHERE shop_id = v_staff.shop_id ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_list_orders(text) TO anon, authenticated;

-- ── 5c. Staff: update order status (own shop only, role-checked) ─
CREATE OR REPLACE FUNCTION public.staff_update_order_status(
  p_token text, p_order_id uuid, p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff      public.shop_staff%ROWTYPE;
  v_order_shop uuid;
BEGIN
  v_staff := public._staff_from_token(p_token);
  IF v_staff.id IS NULL THEN
    RAISE EXCEPTION 'invalid_session';
  END IF;

  SELECT shop_id INTO v_order_shop FROM public.orders WHERE id = p_order_id;
  IF v_order_shop IS NULL OR v_order_shop <> v_staff.shop_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_status IN ('rejected', 'cancelled') AND v_staff.role <> 'manager' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE public.orders
  SET status = p_status,
      staff_updated_by = v_staff.name,
      staff_updated_at = now()
  WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_update_order_status(text, uuid, text) TO anon, authenticated;

-- ── 6. add_staff_by_phone: was generating an invite_token but never
--       returning it, so the frontend had no way to build the invite
--       link after this RPC — fix by returning it like add_staff_invite.
CREATE OR REPLACE FUNCTION public.add_staff_by_phone(
  p_shop_id uuid, p_name text, p_phone text, p_role text DEFAULT 'staff'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
  v_token    text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO public.shop_staff (shop_id, name, phone, invite_token, role, added_by)
  VALUES (p_shop_id, p_name, p_phone, v_token, p_role, auth.uid())
  RETURNING id INTO v_staff_id;

  RETURN json_build_object('id', v_staff_id, 'name', p_name, 'invite_token', v_token);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_staff_by_phone(uuid, text, text, text) TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
