-- Shop staff table
CREATE TABLE IF NOT EXISTS public.shop_staff (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name          text NOT NULL,
  phone         text,
  pin_hash      text,                     -- bcrypt hash of 4-digit PIN
  invite_token  text UNIQUE,              -- for invite-link flow
  role          text NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
  is_active     boolean NOT NULL DEFAULT true,
  added_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Staff session tokens (lightweight custom auth)
CREATE TABLE IF NOT EXISTS public.staff_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    uuid NOT NULL REFERENCES public.shop_staff(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '30 days',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shop_staff_shop_id    ON public.shop_staff(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_staff_phone      ON public.shop_staff(phone);
CREATE INDEX IF NOT EXISTS idx_shop_staff_invite     ON public.shop_staff(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token  ON public.staff_sessions(token);

-- RLS
ALTER TABLE public.shop_staff    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;

-- Shop owner can manage their own staff
CREATE POLICY shop_staff_owner ON public.shop_staff
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Service role reads all (for Edge Functions / RPC)
CREATE POLICY shop_staff_service ON public.shop_staff FOR SELECT
  TO service_role USING (true);

CREATE POLICY staff_sessions_service ON public.staff_sessions FOR ALL
  TO service_role USING (true);

-- RPC: staff login with PIN
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
BEGIN
  -- Find shop by slug/id
  SELECT * INTO v_shop FROM public.shops
  WHERE (LOWER(slug) = LOWER(p_shop_code) OR id::text = p_shop_code)
    AND status = 'approved'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop_not_found';
  END IF;

  -- Find active staff with matching PIN
  SELECT * INTO v_staff FROM public.shop_staff
  WHERE shop_id = v_shop.id
    AND is_active = true
    AND pin_hash = crypt(p_pin, pin_hash)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_credentials';
  END IF;

  -- Create session
  INSERT INTO public.staff_sessions (staff_id)
  VALUES (v_staff.id)
  RETURNING token INTO v_token;

  -- Update last login
  UPDATE public.shop_staff SET last_login_at = now() WHERE id = v_staff.id;

  RETURN json_build_object(
    'token',    v_token,
    'staff_id', v_staff.id,
    'name',     v_staff.name,
    'role',     v_staff.role,
    'shop_id',  v_shop.id,
    'shop_name', v_shop.shop_name
  );
END;
$$;

-- RPC: staff login with invite token (first-time, set PIN)
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
  WHERE invite_token = p_token AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  SELECT * INTO v_shop FROM public.shops WHERE id = v_staff.shop_id LIMIT 1;

  -- Set PIN and clear invite token
  UPDATE public.shop_staff
  SET pin_hash = crypt(p_pin, gen_salt('bf')),
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
    'shop_name', v_shop.shop_name
  );
END;
$$;

-- RPC: validate staff session token
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
    'shop_name', v_shop.shop_name
  );
END;
$$;

-- RPC: add staff with PIN (owner action)
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
  -- Verify caller owns the shop
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  INSERT INTO public.shop_staff (shop_id, name, phone, pin_hash, role, added_by)
  VALUES (p_shop_id, p_name, p_phone, crypt(p_pin, gen_salt('bf')), p_role, auth.uid())
  RETURNING id INTO v_staff_id;

  RETURN json_build_object('id', v_staff_id, 'name', p_name);
END;
$$;

-- RPC: generate invite link token (owner action)
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
  VALUES (p_shop_id, p_name, p_phone, v_token, p_role, auth.uid())
  RETURNING id INTO v_staff_id;

  RETURN json_build_object('id', v_staff_id, 'name', p_name, 'invite_token', v_token);
END;
$$;

-- RPC: add staff by phone (links existing user's phone)
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
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Generate invite token so they can set a PIN on first login
  INSERT INTO public.shop_staff (shop_id, name, phone, invite_token, role, added_by)
  VALUES (p_shop_id, p_name, p_phone, encode(gen_random_bytes(16), 'hex'), p_role, auth.uid())
  RETURNING id INTO v_staff_id;

  RETURN json_build_object('id', v_staff_id, 'name', p_name);
END;
$$;

-- Grant RPC access
GRANT EXECUTE ON FUNCTION public.staff_login_pin      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_login_invite   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_verify_token   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_staff_with_pin   TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_staff_invite     TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_staff_by_phone   TO authenticated;

-- Need pgcrypto for crypt/gen_salt
CREATE EXTENSION IF NOT EXISTS pgcrypto;
