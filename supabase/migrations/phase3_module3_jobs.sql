-- ══════════════════════════════════════════════════════════════
-- Phase 3 — Module 3: Jobs Board
-- Run in Supabase SQL Editor
-- Safe: CREATE TABLE IF NOT EXISTS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS job_listings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  category         text NOT NULL,
  company_name     text,
  salary           text,
  location         text,
  description      text,
  contact_phone    text,
  whatsapp_number  text,
  expiry_date      date,
  is_featured      boolean NOT NULL DEFAULT false,
  is_active        boolean NOT NULL DEFAULT true,
  status           text    NOT NULL DEFAULT 'open',  -- open | closed | expired
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- Public: read open, active, non-expired jobs
DROP POLICY IF EXISTS "job_listings_public_read" ON job_listings;
CREATE POLICY "job_listings_public_read"
  ON job_listings FOR SELECT
  USING (
    is_active = true
    AND status = 'open'
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
  );

-- Admin write
DROP POLICY IF EXISTS "job_listings_admin_all" ON job_listings;
CREATE POLICY "job_listings_admin_all"
  ON job_listings FOR ALL
  USING (
    (auth.jwt() ->> 'user_role') IN ('super_admin', 'market_manager')
    OR (auth.jwt() ->> 'role')   IN ('super_admin', 'market_manager')
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_job_listings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_job_listings_updated_at ON job_listings;
CREATE TRIGGER trg_job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW EXECUTE FUNCTION update_job_listings_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_listings_category
  ON job_listings (category, is_active, status);

CREATE INDEX IF NOT EXISTS idx_job_listings_expiry
  ON job_listings (expiry_date) WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_listings_featured
  ON job_listings (is_featured, is_active);

-- ── ROLLBACK ──────────────────────────────────────────────────
-- DROP TABLE IF EXISTS job_listings;
