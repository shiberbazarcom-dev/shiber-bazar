-- ══════════════════════════════════════════════════════════════
-- Phase 3 — Module 1: Homepage Section Builder
-- Run in Supabase SQL Editor
-- Safe: CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS homepage_sections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_slug   text UNIQUE NOT NULL,
  section_name   text NOT NULL,
  title          text,
  subtitle       text,
  is_active      boolean NOT NULL DEFAULT true,
  display_order  int     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

-- Public can read all rows (frontend filters is_active)
DROP POLICY IF EXISTS "homepage_sections_public_read" ON homepage_sections;
CREATE POLICY "homepage_sections_public_read"
  ON homepage_sections FOR SELECT
  USING (true);

-- Admins can do everything
DROP POLICY IF EXISTS "homepage_sections_admin_all" ON homepage_sections;
CREATE POLICY "homepage_sections_admin_all"
  ON homepage_sections FOR ALL
  USING (
    (auth.jwt() ->> 'user_role') IN ('super_admin', 'market_manager')
    OR (auth.jwt() ->> 'role')   IN ('super_admin', 'market_manager')
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_homepage_sections_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_homepage_sections_updated_at ON homepage_sections;
CREATE TRIGGER trg_homepage_sections_updated_at
  BEFORE UPDATE ON homepage_sections
  FOR EACH ROW EXECUTE FUNCTION update_homepage_sections_updated_at();

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_homepage_sections_order
  ON homepage_sections (display_order ASC);

-- ── Seed default sections matching current Home.jsx layout ─────────
INSERT INTO homepage_sections (section_slug, section_name, title, subtitle, is_active, display_order) VALUES
  ('hero',           'হিরো ব্যানার',          'শিবের বাজার',            'আপনার এলাকার সকল দোকান এক জায়গায় — সহজে খুঁজুন, যোগাযোগ করুন', true, 10),
  ('categories',     'ক্যাটাগরিসমূহ',          'ক্যাটাগরিসমূহ',          'আপনার পছন্দের ক্যাটাগরি বেছে নিন',                               true, 20),
  ('banner_ads',     'ব্যানার বিজ্ঞাপন',      NULL,                     NULL,                                                               true, 30),
  ('featured_shops', 'ফিচার্ড দোকান',          'ফিচার্ড দোকান',          'আমাদের বিশেষায়িত দোকানসমূহ',                                    true, 40),
  ('latest_shops',   'নতুন দোকান',             'নতুন দোকান',             'সম্প্রতি যুক্ত হওয়া দোকানসমূহ',                                 true, 50),
  ('services',       'প্রয়োজনীয় সেবাসমূহ',  'প্রয়োজনীয় সেবাসমূহ',  'শিবের বাজারের বিশ্বস্ত স্থানীয় সেবা প্রদানকারী',               true, 60),
  ('cta',            'রেজিস্ট্রেশন CTA',      'আপনার দোকান যোগ করুন', 'বিনামূল্যে আপনার দোকানের তথ্য দিন',                              true, 70)
ON CONFLICT (section_slug) DO NOTHING;

-- ── ROLLBACK (keep as comment) ─────────────────────────────────────
-- DROP TABLE IF EXISTS homepage_sections;
