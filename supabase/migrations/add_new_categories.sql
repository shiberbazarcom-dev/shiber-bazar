-- ═══════════════════════════════════════════════════════════════
-- Shiber Bazar — Category Migration
-- 1. Update existing categories to Bengali names
-- 2. Add 3 new categories: প্রসাধনী, স্যানিটারি, বৈদ্যুতিক
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── Update existing categories to Bengali names ────────────────
UPDATE categories SET name = 'মুদি দোকান',   icon = '🛒'  WHERE slug = 'grocery';
UPDATE categories SET name = 'পোশাক',         icon = '👗'  WHERE slug = 'clothing';
UPDATE categories SET name = 'ফার্মেসি',      icon = '💊'  WHERE slug = 'pharmacy';
UPDATE categories SET name = 'ইলেকট্রনিক্স', icon = '📱'  WHERE slug = 'electronics';
UPDATE categories SET name = 'রেস্টুরেন্ট',   icon = '🍽️' WHERE slug = 'restaurant';
UPDATE categories SET name = 'প্রসাধনী',      icon = '💄'  WHERE slug = 'cosmetics';
UPDATE categories SET name = 'স্টেশনারি',     icon = '✏️'  WHERE slug = 'stationery';
UPDATE categories SET name = 'হার্ডওয়্যার',   icon = '🔧'  WHERE slug = 'hardware';

-- ─── Insert 3 new categories (upsert — safe to re-run) ──────────
INSERT INTO categories (name, slug, icon, description, sort_order, is_active)
VALUES
  ('প্রসাধনী',   'cosmetics',  '💄', 'মেকআপ, স্কিনকেয়ার ও সৌন্দর্য পণ্য',      9,  true),
  ('স্যানিটারি', 'sanitary',   '🚿', 'বাথরুম, পাইপ ও স্যানিটারি সামগ্রী',      10, true),
  ('বৈদ্যুতিক',  'electrical', '⚡', 'বৈদ্যুতিক তার, সুইচ ও আনুষাঙ্গিক সরঞ্জাম', 11, true)
ON CONFLICT (slug) DO UPDATE
  SET name        = EXCLUDED.name,
      icon        = EXCLUDED.icon,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order,
      is_active   = true;
