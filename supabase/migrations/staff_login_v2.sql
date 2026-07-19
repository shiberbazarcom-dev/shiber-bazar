-- ══════════════════════════════════════════════════════════════════
--  STAFF LOGIN V2 — shop-scoped PIN login via RPC (fixes PIN collision)
--  Run in: Supabase Dashboard → SQL Editor → Run
--
--  Problems this fixes:
--   1. Client queried shop_staff globally by pin_hash → two staff in
--      different shops with the same PIN broke login for both.
--   2. PINs were stored as unsalted SHA-256 (trivially reversible for
--      4-6 digit PINs). New logins/PINs use bcrypt; legacy SHA-256
--      hashes are auto-upgraded to bcrypt on first successful login.
--   3. Login required anon SELECT/UPDATE on shop_staff and anon INSERT
--      on staff_sessions. All auth now goes through SECURITY DEFINER
--      RPCs, so those anon policies are dropped here.
--
--  Safe to re-run (all statements are idempotent).
-- ══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Step 1: Lock down shop_staff & staff_sessions RLS ──────────────
-- Drop ALL existing policies (including any permissive anon policies
-- added from the dashboard), then recreate least-privilege ones.
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'shop_staff') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.shop_staff';
  END LOOP;
  FOR r IN (SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'staff_sessions') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.staff_sessions';
  END LOOP;
END $$;

ALTER TABLE public.shop_staff     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;

-- Shop owner manages their own staff (list, deactivate, edit)
CREATE POLICY shop_staff_owner ON public.shop_staff
  FOR ALL TO authenticated
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Service role full access (Edge Functions)
CREATE POLICY shop_staff_service ON public.shop_staff
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY staff_sessions_service ON public.staff_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Step 2: RPC — staff login with shop code + PIN ─────────────────
-- Shop-scoped, so the same PIN in two different shops never collides.
-- Supports legacy unsalted SHA-256 hashes and upgrades them to bcrypt.
CREATE OR REPLACE FUNCTION public.staff_login_pin(p_shop_code text, p_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop    public.shops%ROWTYPE;
  v_staff   public.shop_staff%ROWTYPE;
  v_token   text;
  v_sha256  text;
BEGIN
  SELECT * INTO v_shop FROM public.shops
  WHERE (LOWER(slug) = LOWER(TRIM(p_shop_code)) OR id::text = TRIM(p_shop_code))
    AND status = 'approved'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop_not_found';
  END IF;

  v_sha256 := encode(digest(TRIM(p_pin), 'sha256'), 'hex');

  SELECT * INTO v_staff FROM public.shop_staff
  WHERE shop_id = v_shop.id
    AND is_active = true
    AND pin_hash IS NOT NULL
    AND (
      pin_hash = v_sha256                                   -- legacy SHA-256
      OR (pin_hash LIKE '$2%' AND pin_hash = crypt(TRIM(p_pin), pin_hash))  -- bcrypt
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_credentials';
  END IF;

  -- Upgrade legacy SHA-256 hash to bcrypt
  IF v_staff.pin_hash = v_sha256 THEN
    UPDATE public.shop_staff
    SET pin_hash = crypt(TRIM(p_pin), gen_salt('bf'))
    WHERE id = v_staff.id;
  END IF;

  INSERT INTO public.staff_sessions (staff_id)
  VALUES (v_staff.id)
  RETURNING token INTO v_token;

  UPDATE public.shop_staff SET last_login_at = now() WHERE id = v_staff.id;

  RETURN json_build_object(
    'token',     v_token,
    'staff_id',  v_staff.id,
    'name',      v_staff.name,
    'role',      v_staff.role,
    'shop_id',   v_shop.id,
    'shop_name', v_shop.shop_name,
    'shop_slug', v_shop.slug
  );
END;
$$;

-- ── Step 3: RPC — first login via invite link (sets PIN) ──────────
CREATE OR REPLACE FUNCTION public.staff_login_invite(p_token text, p_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff   public.shop_staff%ROWTYPE;
  v_shop    public.shops%ROWTYPE;
  v_session_token text;
BEGIN
  SELECT * INTO v_staff FROM public.shop_staff
  WHERE invite_token = TRIM(p_token) AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  SELECT * INTO v_shop FROM public.shops WHERE id = v_staff.shop_id LIMIT 1;

  UPDATE public.shop_staff
  SET pin_hash = crypt(TRIM(p_pin), gen_salt('bf')),
      invite_token = NULL,
      last_login_at = now()
  WHERE id = v_staff.id;

  INSERT INTO public.staff_sessions (staff_id)
  VALUES (v_staff.id)
  RETURNING token INTO v_session_token;

  RETURN json_build_object(
    'token',     v_session_token,
    'staff_id',  v_staff.id,
    'name',      v_staff.name,
    'role',      v_staff.role,
    'shop_id',   v_shop.id,
    'shop_name', v_shop.shop_name,
    'shop_slug', v_shop.slug
  );
END;
$$;

-- ── Step 4: RPC — validate a session token ─────────────────────────
CREATE OR REPLACE FUNCTION public.staff_verify_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff   public.shop_staff%ROWTYPE;
  v_shop    public.shops%ROWTYPE;
BEGIN
  SELECT ss.* INTO v_staff
  FROM public.staff_sessions s
  JOIN public.shop_staff ss ON ss.id = s.staff_id
  WHERE s.token = p_token
    AND s.expires_at > now()
    AND ss.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_shop FROM public.shops WHERE id = v_staff.shop_id LIMIT 1;

  RETURN json_build_object(
    'staff_id',  v_staff.id,
    'name',      v_staff.name,
    'role',      v_staff.role,
    'shop_id',   v_shop.id,
    'shop_name', v_shop.shop_name,
    'shop_slug', v_shop.slug
  );
END;
$$;

-- ── Step 5: RPC — logout (delete session server-side) ─────────────
CREATE OR REPLACE FUNCTION public.staff_logout(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.staff_sessions WHERE token = p_token;
$$;

-- ── Step 6: RPC — owner adds staff with a PIN (bcrypt) ─────────────
CREATE OR REPLACE FUNCTION public.add_staff_with_pin(
  p_shop_id uuid, p_name text, p_pin text, p_role text DEFAULT 'staff', p_phone text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Prevent duplicate PIN within the same shop (would make login ambiguous)
  IF EXISTS (
    SELECT 1 FROM public.shop_staff
    WHERE shop_id = p_shop_id AND is_active = true AND pin_hash IS NOT NULL
      AND (pin_hash = encode(digest(TRIM(p_pin), 'sha256'), 'hex')
           OR (pin_hash LIKE '$2%' AND pin_hash = crypt(TRIM(p_pin), pin_hash)))
  ) THEN
    RAISE EXCEPTION 'pin_taken';
  END IF;

  INSERT INTO public.shop_staff (shop_id, name, phone, pin_hash, role, added_by)
  VALUES (p_shop_id, TRIM(p_name), p_phone, crypt(TRIM(p_pin), gen_salt('bf')), p_role, auth.uid())
  RETURNING id INTO v_staff_id;

  RETURN json_build_object('id', v_staff_id, 'name', p_name);
END;
$$;

-- ── Step 7: RPC — owner adds staff via invite link ─────────────────
CREATE OR REPLACE FUNCTION public.add_staff_invite(
  p_shop_id uuid, p_name text, p_role text DEFAULT 'staff', p_phone text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token    text;
  v_staff_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO public.shop_staff (shop_id, name, phone, invite_token, role, added_by)
  VALUES (p_shop_id, TRIM(p_name), p_phone, v_token, p_role, auth.uid())
  RETURNING id INTO v_staff_id;

  RETURN json_build_object('id', v_staff_id, 'name', p_name, 'invite_token', v_token);
END;
$$;

-- ── Step 8: RPC — team list for logged-in staff (manager page) ────
-- shop_staff now has no anon policy, so the staff panel reads the
-- team through its session token instead.
CREATE OR REPLACE FUNCTION public.staff_get_team(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
BEGIN
  SELECT ss.shop_id INTO v_shop_id
  FROM public.staff_sessions s
  JOIN public.shop_staff ss ON ss.id = s.staff_id
  WHERE s.token = p_token
    AND s.expires_at > now()
    AND ss.is_active = true
  LIMIT 1;

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', t.id, 'name', t.name, 'phone', t.phone, 'role', t.role,
      'is_active', t.is_active, 'last_login_at', t.last_login_at
    ) ORDER BY t.created_at)
    FROM public.shop_staff t
    WHERE t.shop_id = v_shop_id AND t.is_active = true
  ), '[]'::json);
END;
$$;

-- ── Step 9: Grants ─────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.staff_login_pin     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_login_invite  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_verify_token  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_logout        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_get_team      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_staff_with_pin  TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_staff_invite    TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
