-- ══════════════════════════════════════════════════════════════
-- Homepage section row for পুরাতন বাজার (used marketplace)
-- Run in Supabase SQL Editor — optional but recommended:
-- without this row the section still shows (frontend fallback);
-- with it, admins can toggle/reorder it from the Section Builder.
-- Safe to re-run (ON CONFLICT DO NOTHING).
-- ══════════════════════════════════════════════════════════════

INSERT INTO homepage_sections (section_slug, section_name, title, subtitle, is_active, display_order) VALUES
  ('used_market', 'পুরাতন বাজার', 'পুরাতন বাজার',
   'পুরাতন জিনিস কিনুন-বিক্রি করুন — সরাসরি এলাকার মানুষের সাথে',
   true, 55)
ON CONFLICT (section_slug) DO NOTHING;
