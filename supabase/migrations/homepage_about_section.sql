-- ══════════════════════════════════════════════════════════════
-- Homepage section row for "শিবের বাজার কী?" (about + FAQ)
-- Optional: the section renders without this row (frontend fallback);
-- adding it lets admins toggle/reorder it from the Section Builder.
-- Safe to re-run (ON CONFLICT DO NOTHING).
-- ══════════════════════════════════════════════════════════════

INSERT INTO homepage_sections (section_slug, section_name, title, subtitle, is_active, display_order) VALUES
  ('about', 'পরিচিতি ও সাধারণ জিজ্ঞাসা', 'শিবের বাজার কী?',
   'সাইট সম্পর্কে বিস্তারিত ও সাধারণ প্রশ্নের উত্তর',
   true, 65)
ON CONFLICT (section_slug) DO NOTHING;
