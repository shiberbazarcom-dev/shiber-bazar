-- ══════════════════════════════════════════════════════════════════════
-- Shiber Bazar — সব Category বাংলায় আপডেট
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════════

-- মুদি দোকান
UPDATE categories SET name = 'মুদি দোকান', icon = '🛒'
  WHERE slug IN ('grocery', 'mudi-dokan', 'mudi_dokan')
     OR name ILIKE '%grocery%' OR name ILIKE '%mudi%';

-- পোশাক
UPDATE categories SET name = 'পোশাক', icon = '👗'
  WHERE slug IN ('clothing', 'kapor-dokan', 'kapor_dokan', 'clothes')
     OR name ILIKE '%clothing%' OR name ILIKE '%kapor%';

-- ফার্মেসি
UPDATE categories SET name = 'ফার্মেসি', icon = '💊'
  WHERE slug IN ('pharmacy', 'oshudher-dokan', 'medicine', 'drug')
     OR name ILIKE '%pharmacy%' OR name ILIKE '%oshudh%';

-- সবজি
UPDATE categories SET name = 'সবজি', icon = '🥬'
  WHERE slug IN ('vegetables', 'sobji-dokan', 'sobji', 'vegetable')
     OR name ILIKE '%vegetable%' OR name ILIKE '%sobji%';

-- মাছ
UPDATE categories SET name = 'মাছ', icon = '🐟'
  WHERE slug IN ('fish', 'macher-dokan', 'mach')
     OR name ILIKE '%fish%' OR name ILIKE '%mach%';

-- মাংস
UPDATE categories SET name = 'মাংস', icon = '🥩'
  WHERE slug IN ('meat', 'mangsher-dokan', 'mangso')
     OR name ILIKE '%meat%' OR name ILIKE '%mangs%';

-- চায়ের দোকান
UPDATE categories SET name = 'চায়ের দোকান', icon = '☕'
  WHERE slug IN ('tea-shop', 'tea_shop', 'teashop', 'chayer-dokan', 'tea')
     OR name ILIKE '%tea shop%' OR name ILIKE '%chay%';

-- ইলেকট্রনিক্স
UPDATE categories SET name = 'ইলেকট্রনিক্স', icon = '📱'
  WHERE slug IN ('electronics', 'electronic')
     OR name ILIKE '%electronic%' OR name ILIKE '%ইলেক%';

-- হার্ডওয়্যার
UPDATE categories SET name = 'হার্ডওয়্যার', icon = '🔧'
  WHERE slug IN ('hardware', 'kamar-dokan', 'hardware-shop')
     OR name ILIKE '%hardware%' OR name ILIKE '%kamar%';

-- আসবাবপত্র
UPDATE categories SET name = 'আসবাবপত্র', icon = '🪑'
  WHERE slug IN ('furniture', 'kather-dokan', 'furniture-shop')
     OR name ILIKE '%furniture%' OR name ILIKE '%kath%';

-- গহনা
UPDATE categories SET name = 'গহনা', icon = '💍'
  WHERE slug IN ('jewelry', 'jewellery', 'sonar-dokan', 'gold')
     OR name ILIKE '%jewelry%' OR name ILIKE '%jewel%' OR name ILIKE '%sonar%';

-- সেলুন
UPDATE categories SET name = 'সেলুন', icon = '✂️'
  WHERE slug IN ('salon', 'saloon', 'beauty')
     OR name ILIKE '%salon%' OR name ILIKE '%saloon%';

-- মোবাইল সেবা
UPDATE categories SET name = 'মোবাইল সেবা', icon = '🔌'
  WHERE slug IN ('mobile-service', 'mobile_service', 'mobile', 'mobileservice')
     OR name ILIKE '%mobile service%' OR name ILIKE '%mobile serv%';

-- বইয়ের দোকান
UPDATE categories SET name = 'বইয়ের দোকান', icon = '📚'
  WHERE slug IN ('books', 'book', 'boier-dokan', 'stationery')
     OR name ILIKE '%book%' OR name ILIKE '%boi%';

-- মিষ্টির দোকান
UPDATE categories SET name = 'মিষ্টির দোকান', icon = '🍬'
  WHERE slug IN ('sweets', 'sweet', 'mishtir-dokan', 'bakery', 'confectionery')
     OR name ILIKE '%sweet%' OR name ILIKE '%mishti%';

-- রেস্টুরেন্ট
UPDATE categories SET name = 'রেস্টুরেন্ট', icon = '🍽️'
  WHERE slug IN ('restaurant', 'food', 'dining')
     OR name ILIKE '%restaurant%';

-- স্টেশনারি
UPDATE categories SET name = 'স্টেশনারি', icon = '✏️'
  WHERE slug IN ('stationery', 'stationary')
     OR name ILIKE '%stationer%';

-- অন্যান্য
UPDATE categories SET name = 'অন্যান্য', icon = '🏪'
  WHERE slug IN ('other', 'others', 'misc', 'miscellaneous')
     OR name ILIKE '%other%';

-- নতুন ৩টি category (upsert — আগে থেকে থাকলেও safe)
INSERT INTO categories (name, slug, icon, description, sort_order, is_active)
VALUES
  ('প্রসাধনী',   'cosmetics',  '💄', 'মেকআপ, স্কিনকেয়ার ও সৌন্দর্য পণ্য',           9,  true),
  ('স্যানিটারি', 'sanitary',   '🚿', 'বাথরুম, পাইপ ও স্যানিটারি সামগ্রী',           10, true),
  ('বৈদ্যুতিক',  'electrical', '⚡', 'বৈদ্যুতিক তার, সুইচ ও আনুষাঙ্গিক সরঞ্জাম',   11, true)
ON CONFLICT (slug) DO UPDATE
  SET name        = EXCLUDED.name,
      icon        = EXCLUDED.icon,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order,
      is_active   = true;

-- ── ফলাফল যাচাই করুন ─────────────────────────────────────────────
SELECT id, name, slug, icon, sort_order FROM categories ORDER BY sort_order;
