-- ══════════════════════════════════════════════════════════════════
-- Services Module Migration — স্থানীয় সেবাসমূহ
-- Run this in Supabase SQL Editor
-- Does NOT touch any existing tables
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. service_categories
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn     text NOT NULL,
  icon        text NOT NULL DEFAULT '🔧',
  slug        text UNIQUE NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- 2. services
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id  uuid REFERENCES service_categories(id) ON DELETE CASCADE,
  name         text NOT NULL,
  phone        text NOT NULL,
  description  text,
  location     text,
  image_url    text,
  is_verified  boolean NOT NULL DEFAULT false,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  views        int NOT NULL DEFAULT 0,
  extra        jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_services_status        ON services (status);
CREATE INDEX IF NOT EXISTS idx_services_category_id   ON services (category_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id       ON services (user_id);

-- ─────────────────────────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;

-- service_categories: anyone can read active
DROP POLICY IF EXISTS "service_cats_public_read" ON service_categories;
CREATE POLICY "service_cats_public_read"
  ON service_categories FOR SELECT
  USING (is_active = true);

-- services: anyone can read approved
DROP POLICY IF EXISTS "services_public_read"  ON services;
CREATE POLICY "services_public_read"
  ON services FOR SELECT
  USING (status = 'approved');

-- services: owner can read own (including pending/rejected)
DROP POLICY IF EXISTS "services_owner_read" ON services;
CREATE POLICY "services_owner_read"
  ON services FOR SELECT
  USING (auth.uid() = user_id);

-- services: any authenticated user can insert (their own)
DROP POLICY IF EXISTS "services_owner_insert" ON services;
CREATE POLICY "services_owner_insert"
  ON services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- services: owner can update own
DROP POLICY IF EXISTS "services_owner_update" ON services;
CREATE POLICY "services_owner_update"
  ON services FOR UPDATE
  USING (auth.uid() = user_id);

-- services: owner can delete own
DROP POLICY IF EXISTS "services_owner_delete" ON services;
CREATE POLICY "services_owner_delete"
  ON services FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. Seed — 10 service categories
-- ─────────────────────────────────────────────────────────────────
INSERT INTO service_categories (name_bn, icon, slug, sort_order) VALUES
  ('সিএনজি / অটোরিকশা',    '🚕', 'cng',         1),
  ('সেলুন ও নাপিত',          '✂️', 'salon',        2),
  ('প্রাইভেট শিক্ষক',        '📚', 'tutor',        3),
  ('ডাক্তার ও চেম্বার',      '👨‍⚕️', 'doctor',       4),
  ('ইলেকট্রিশিয়ান',          '⚡', 'electrician',  5),
  ('প্লাম্বার',               '🚿', 'plumber',      6),
  ('পিকআপ ভ্যান',            '🚛', 'pickup',       7),
  ('রক্তদাতা',               '🩸', 'blood-donor',  8),
  ('বাসা / দোকান ভাড়া',     '🏠', 'rental',       9),
  ('জরুরি নম্বর',            '📞', 'emergency',   10)
ON CONFLICT (slug) DO NOTHING;
