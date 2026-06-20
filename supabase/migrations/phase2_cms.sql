-- ══════════════════════════════════════════════════════════════
-- Phase 2 CMS Migration
-- Run in Supabase SQL Editor
-- Safe: ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- MODULE 1: Services Directory — extra fields
-- ──────────────────────────────────────────────────────────────
ALTER TABLE local_service_directory
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS experience      text,
  ADD COLUMN IF NOT EXISTS is_featured     boolean NOT NULL DEFAULT false;

-- ──────────────────────────────────────────────────────────────
-- MODULE 2: Featured Shops — priority + expiry
-- ──────────────────────────────────────────────────────────────
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS featured_priority int  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured_until    date;

-- ──────────────────────────────────────────────────────────────
-- MODULE 4: Union Notice Board
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS union_notices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  description    text,
  publish_date   date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date    date,
  attachment_url text,
  is_featured    boolean NOT NULL DEFAULT false,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE union_notices ENABLE ROW LEVEL SECURITY;

-- Public can read active, non-expired notices
DROP POLICY IF EXISTS "union_notices_public_read" ON union_notices;
CREATE POLICY "union_notices_public_read"
  ON union_notices FOR SELECT
  USING (
    is_active = true
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
  );

-- Admin write
DROP POLICY IF EXISTS "union_notices_admin_all" ON union_notices;
CREATE POLICY "union_notices_admin_all"
  ON union_notices FOR ALL
  USING (
    (auth.jwt() ->> 'user_role') IN ('super_admin', 'market_manager')
    OR (auth.jwt() ->> 'role') IN ('super_admin', 'market_manager')
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_union_notices_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_union_notices_updated_at ON union_notices;
CREATE TRIGGER trg_union_notices_updated_at
  BEFORE UPDATE ON union_notices
  FOR EACH ROW EXECUTE FUNCTION update_union_notices_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_union_notices_publish_date
  ON union_notices (publish_date DESC);

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (keep as comment for reference)
-- ──────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS union_notices;
-- ALTER TABLE local_service_directory
--   DROP COLUMN IF EXISTS whatsapp_number,
--   DROP COLUMN IF EXISTS experience,
--   DROP COLUMN IF EXISTS is_featured;
-- ALTER TABLE shops
--   DROP COLUMN IF EXISTS featured_priority,
--   DROP COLUMN IF EXISTS featured_until;
