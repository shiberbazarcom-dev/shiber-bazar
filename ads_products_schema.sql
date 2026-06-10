-- ═══════════════════════════════════════════════════════
--  শিবের বাজার — Advertisements & Products Schema
--  Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────
--  1. ADVERTISEMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advertisements (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT         NOT NULL,
  image_url   TEXT,
  target_url  TEXT,
  ad_type     TEXT         NOT NULL DEFAULT 'banner'
              CHECK (ad_type IN ('banner', 'sidebar', 'popup')),
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_active     ON advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_sort       ON advertisements(sort_order);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Public can view active ads
CREATE POLICY "ads_public_select"
  ON advertisements FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "ads_admin_insert"
  ON advertisements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager'))
  );

CREATE POLICY "ads_admin_update"
  ON advertisements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager'))
  );

CREATE POLICY "ads_admin_delete"
  ON advertisements FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager'))
  );

-- ─────────────────────────────────────────
--  2. PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id     UUID         NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        TEXT         NOT NULL,
  description TEXT,
  price       NUMERIC(10,2),
  image_url   TEXT,
  category    TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  in_stock    BOOLEAN      NOT NULL DEFAULT true,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id   ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_active     ON products(is_active);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "products_public_select"
  ON products FOR SELECT
  USING (true);

-- Shop owners can manage their own shop's products
CREATE POLICY "products_owner_insert"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager'))
  );

CREATE POLICY "products_owner_update"
  ON products FOR UPDATE
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager'))
  );

CREATE POLICY "products_owner_delete"
  ON products FOR DELETE
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager'))
  );

-- ─────────────────────────────────────────
--  3. SITE SETTINGS (key/value store)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  label       TEXT,
  type        TEXT NOT NULL DEFAULT 'text'
              CHECK (type IN ('text','boolean','number','url')),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "settings_public_select"
  ON site_settings FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "settings_admin_all"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager'))
  );

-- Seed default settings
INSERT INTO site_settings (key, value, label, type) VALUES
  ('site_name',        'শিবের বাজার',      'সাইটের নাম',          'text'),
  ('site_tagline',     'আপনার পাড়ার দোকান', 'ট্যাগলাইন',           'text'),
  ('contact_phone',    '01700000000',      'যোগাযোগ ফোন',         'text'),
  ('contact_email',    '',                 'যোগাযোগ ইমেইল',       'text'),
  ('contact_address',  '',                 'ঠিকানা',              'text'),
  ('allow_registration','true',            'নতুন রেজিস্ট্রেশন',    'boolean'),
  ('allow_shop_request','true',            'দোকান আবেদন',         'boolean'),
  ('whatsapp_number',  '',                 'WhatsApp নম্বর',      'text')
ON CONFLICT (key) DO NOTHING;
