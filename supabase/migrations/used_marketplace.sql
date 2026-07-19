-- ══════════════════════════════════════════════════════════════
-- পুরাতন বাজার — Used Marketplace (C2C classifieds)
-- Run in Supabase SQL Editor
-- Safe to re-run (idempotent).
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS used_listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_name     text,   -- filled by trigger from profiles (public pages can't read profiles)
  title           text NOT NULL,
  description     text,
  price           numeric(12,2) NOT NULL DEFAULT 0,
  negotiable      boolean NOT NULL DEFAULT false,
  category        text NOT NULL,
  condition       text NOT NULL DEFAULT 'used'
                  CHECK (condition IN ('new', 'like_new', 'used', 'parts')),
  location        text,
  contact_phone   text NOT NULL,
  whatsapp_number text,
  images          jsonb NOT NULL DEFAULT '[]',
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'sold')),
  reject_reason   text,
  views           integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_used_listings_status_cat
  ON used_listings (status, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_used_listings_seller
  ON used_listings (seller_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_used_listings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_used_listings_updated_at ON used_listings;
CREATE TRIGGER trg_used_listings_updated_at
  BEFORE UPDATE ON used_listings
  FOR EACH ROW EXECUTE FUNCTION update_used_listings_updated_at();

-- Spam guard: max 5 new listings per seller per day
CREATE OR REPLACE FUNCTION check_used_listing_daily_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM used_listings
      WHERE seller_id = NEW.seller_id
        AND created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'daily_limit_reached';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_used_listings_daily_limit ON used_listings;
CREATE TRIGGER trg_used_listings_daily_limit
  BEFORE INSERT ON used_listings
  FOR EACH ROW EXECUTE FUNCTION check_used_listing_daily_limit();

-- Fill seller_name from profiles (server-side, client can't spoof it)
CREATE OR REPLACE FUNCTION set_used_listing_seller_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT full_name INTO NEW.seller_name FROM profiles WHERE id = NEW.seller_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_used_listings_seller_name ON used_listings;
CREATE TRIGGER trg_used_listings_seller_name
  BEFORE INSERT ON used_listings
  FOR EACH ROW EXECUTE FUNCTION set_used_listing_seller_name();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE used_listings ENABLE ROW LEVEL SECURITY;

-- Public: read approved & sold listings only
DROP POLICY IF EXISTS "used_listings_public_read" ON used_listings;
CREATE POLICY "used_listings_public_read"
  ON used_listings FOR SELECT
  USING (status IN ('approved', 'sold'));

-- Seller: read own listings (any status)
DROP POLICY IF EXISTS "used_listings_own_read" ON used_listings;
CREATE POLICY "used_listings_own_read"
  ON used_listings FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Seller: insert own, always starts as pending
DROP POLICY IF EXISTS "used_listings_own_insert" ON used_listings;
CREATE POLICY "used_listings_own_insert"
  ON used_listings FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid() AND status = 'pending');

-- Seller: update own, but cannot self-approve
-- (edits go back to pending; marking sold is allowed)
DROP POLICY IF EXISTS "used_listings_own_update" ON used_listings;
CREATE POLICY "used_listings_own_update"
  ON used_listings FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid() AND status IN ('pending', 'sold'));

-- Seller: delete own
DROP POLICY IF EXISTS "used_listings_own_delete" ON used_listings;
CREATE POLICY "used_listings_own_delete"
  ON used_listings FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid());

-- Admin: full access
DROP POLICY IF EXISTS "used_listings_admin_all" ON used_listings;
CREATE POLICY "used_listings_admin_all"
  ON used_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'market_manager')
    )
  );

-- ── View counter (anon-safe, bypasses RLS for the update only) ─
CREATE OR REPLACE FUNCTION increment_used_listing_views(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE used_listings SET views = views + 1
  WHERE id = p_id AND status IN ('approved', 'sold');
$$;

GRANT EXECUTE ON FUNCTION increment_used_listing_views(uuid) TO anon, authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ── ROLLBACK ──────────────────────────────────────────────────
-- DROP TABLE IF EXISTS used_listings;
-- DROP FUNCTION IF EXISTS increment_used_listing_views(uuid);
