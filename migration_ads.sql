-- ============================================================
-- Advertisements table — run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS advertisements (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  image_url   TEXT,
  target_url  TEXT,
  ad_type     TEXT        NOT NULL DEFAULT 'banner',  -- 'banner' | 'sidebar' | 'popup'
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add description column if table already exists but description is missing
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS end_date DATE;

-- RLS
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Public can read active ads
CREATE POLICY "ads_public_read" ON advertisements
  FOR SELECT USING (is_active = true);

-- Admins can do everything
CREATE POLICY "ads_admin_all" ON advertisements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'market_manager')
    )
  );

-- Storage bucket for ads images (run once)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "ads_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads');

CREATE POLICY "ads_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ads' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'market_manager')
    )
  );
