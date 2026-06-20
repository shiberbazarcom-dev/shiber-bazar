-- ══════════════════════════════════════════════════════════════
-- Phase 3 — Module 2: Advertisement CMS Enhancements
-- Adds: ad_placement, click_count, priority
-- Safe: ADD COLUMN IF NOT EXISTS
-- ══════════════════════════════════════════════════════════════

ALTER TABLE advertisements
  ADD COLUMN IF NOT EXISTS ad_placement text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS click_count  int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority     int     NOT NULL DEFAULT 0;

-- Index for fast placement queries
CREATE INDEX IF NOT EXISTS idx_ads_placement
  ON advertisements (ad_placement, is_active);

-- RPC for atomic click count increment (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_ad_click(ad_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE advertisements SET click_count = click_count + 1 WHERE id = ad_id;
$$;

-- ── ROLLBACK ──────────────────────────────────────────────────
-- ALTER TABLE advertisements
--   DROP COLUMN IF EXISTS ad_placement,
--   DROP COLUMN IF EXISTS click_count,
--   DROP COLUMN IF EXISTS priority;
