-- ══════════════════════════════════════════════════════════════
-- Phase 3: Announcement Bar CMS
-- Adds two keys to site_settings
-- Safe: ON CONFLICT DO NOTHING
-- ══════════════════════════════════════════════════════════════

INSERT INTO site_settings (key, value, type, label) VALUES
  ('announcement_active', 'false', 'boolean', 'ঘোষণা বার সক্রিয়'),
  ('announcement_text',   '📢 শিবের বাজারে আপনাকে স্বাগতম!', 'text', 'ঘোষণার বার্তা')
ON CONFLICT (key) DO NOTHING;

-- ROLLBACK:
-- DELETE FROM site_settings WHERE key IN ('announcement_active','announcement_text');
