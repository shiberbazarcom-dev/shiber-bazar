-- ============================================================
-- শিবের বাজার — Demo Data (Run after supabase_schema.sql)
-- ============================================================
-- Step 1: Run this in Supabase SQL Editor
-- Step 2: Also disable email confirmation:
--   Supabase Dashboard → Authentication → Providers → Email
--   → uncheck "Confirm email" → Save
-- ============================================================

-- ── Categories ── (insert if not already present)
INSERT INTO categories (name, slug, icon, description, sort_order, is_active)
VALUES
  ('মুদি দোকান',    'mudi-dokan',      '🛒', 'চাল, ডাল, তেল, মশলাসহ দৈনন্দিন প্রয়োজনীয় সামগ্রী', 1,  TRUE),
  ('কাপড়ের দোকান', 'kapor-dokan',     '👕', 'পুরুষ, মহিলা ও শিশুদের পোশাক', 2, TRUE),
  ('ওষুধের দোকান',  'oshudh-dokan',    '💊', 'ওষুধ ও স্বাস্থ্যসেবা পণ্য', 3, TRUE),
  ('সবজির দোকান',  'shobji-dokan',    '🥬', 'তাজা শাকসবজি ও ফলমূল', 4, TRUE),
  ('মাছের দোকান',  'macher-dokan',    '🐟', 'তাজা ও শুঁটকি মাছ', 5, TRUE),
  ('মাংসের দোকান', 'mangsher-dokan',  '🥩', 'গরু, খাসি ও মুরগির মাংস', 6, TRUE),
  ('চায়ের দোকান',  'chayer-dokan',    '☕', 'চা, নাস্তা ও হালকা খাবার', 7, TRUE),
  ('ইলেকট্রনিক্স', 'electronics',     '📱', 'মোবাইল, ইলেকট্রনিক পণ্য ও মেরামত', 8, TRUE),
  ('হার্ডওয়্যার',  'hardware',        '🔧', 'নির্মাণ সামগ্রী ও হার্ডওয়্যার', 9, TRUE),
  ('বেকারি',       'bakery',          '🍞', 'রুটি, কেক ও বিস্কুট', 10, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ── Demo Shops ──
-- Note: owner_id is set to NULL for demo shops (they still display publicly)
-- Replace NULL with an actual user UUID once you have a real admin user

DO $$
DECLARE
  cat_mudi       UUID;
  cat_kapor      UUID;
  cat_oshudh     UUID;
  cat_shobji     UUID;
  cat_macher     UUID;
  cat_mangsher   UUID;
  cat_chay       UUID;
  cat_elec       UUID;
  cat_hard       UUID;
  cat_bakery     UUID;
BEGIN
  SELECT id INTO cat_mudi     FROM categories WHERE slug = 'mudi-dokan';
  SELECT id INTO cat_kapor    FROM categories WHERE slug = 'kapor-dokan';
  SELECT id INTO cat_oshudh   FROM categories WHERE slug = 'oshudh-dokan';
  SELECT id INTO cat_shobji   FROM categories WHERE slug = 'shobji-dokan';
  SELECT id INTO cat_macher   FROM categories WHERE slug = 'macher-dokan';
  SELECT id INTO cat_mangsher FROM categories WHERE slug = 'mangsher-dokan';
  SELECT id INTO cat_chay     FROM categories WHERE slug = 'chayer-dokan';
  SELECT id INTO cat_elec     FROM categories WHERE slug = 'electronics';
  SELECT id INTO cat_hard     FROM categories WHERE slug = 'hardware';
  SELECT id INTO cat_bakery   FROM categories WHERE slug = 'bakery';

  -- 1. রহিম স্টোর
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone, whatsapp,
                     opening_time, closing_time, open_days, is_approved, is_verified, is_featured,
                     avg_rating, review_count, view_count)
  VALUES ('রহিম স্টোর', 'rahim-store', cat_mudi,
    'শিবের বাজারের পুরনো ও বিশ্বস্ত মুদি দোকান। চাল, ডাল, তেল, মশলাসহ সব ধরনের দৈনন্দিন পণ্য পাওয়া যায়।',
    'শিবের বাজার, প্রধান সড়ক', '01711-123456', '01711-123456',
    '08:00', '21:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, TRUE, TRUE, 4.5, 12, 245)
  ON CONFLICT (slug) DO NOTHING;

  -- 2. করিম ফ্যাশন হাউস
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone, whatsapp,
                     opening_time, closing_time, open_days, is_approved, is_verified, is_featured,
                     avg_rating, review_count, view_count)
  VALUES ('করিম ফ্যাশন হাউস', 'karim-fashion-house', cat_kapor,
    'পুরুষ ও মহিলাদের সর্বশেষ ফ্যাশনের পোশাক। শার্ট, প্যান্ট, শাড়ি, সালোয়ার কামিজ সব পাবেন এখানে।',
    'শিবের বাজার, বাজার রোড', '01812-234567', '01812-234567',
    '09:00', '20:30', '["সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, TRUE, FALSE, 4.2, 8, 189)
  ON CONFLICT (slug) DO NOTHING;

  -- 3. আল-আমিন মেডিকেল
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone, whatsapp,
                     opening_time, closing_time, open_days, is_approved, is_verified, is_featured,
                     avg_rating, review_count, view_count)
  VALUES ('আল-আমিন মেডিকেল', 'al-amin-medical', cat_oshudh,
    'সকল ধরনের ওষুধ, ভিটামিন ও স্বাস্থ্যসেবা পণ্য পাওয়া যায়। অভিজ্ঞ ফার্মাসিস্ট দ্বারা পরিচালিত।',
    'শিবের বাজার, হাসপাতাল রোড', '01913-345678', '01913-345678',
    '07:00', '22:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, TRUE, TRUE, 4.7, 20, 312)
  ON CONFLICT (slug) DO NOTHING;

  -- 4. তাজা সবজি ভাণ্ডার
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone,
                     opening_time, closing_time, open_days, is_approved, is_verified,
                     avg_rating, review_count, view_count)
  VALUES ('তাজা সবজি ভাণ্ডার', 'taja-shobji-bhandar', cat_shobji,
    'প্রতিদিন সকালে তাজা শাকসবজি আসে সরাসরি কৃষকের কাছ থেকে। সেরা মান, সঠিক দাম।',
    'শিবের বাজার, সবজি পট্টি', '01615-456789', NULL,
    '06:00', '14:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, FALSE, FALSE, 4.0, 5, 98)
  ON CONFLICT (slug) DO NOTHING;

  -- 5. মদিনা ফিশ কর্নার
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone, whatsapp,
                     opening_time, closing_time, open_days, is_approved, is_verified,
                     avg_rating, review_count, view_count)
  VALUES ('মদিনা ফিশ কর্নার', 'madina-fish-corner', cat_macher,
    'তাজা রুই, কাতলা, ইলিশ, চিংড়িসহ সব ধরনের মাছ পাওয়া যায়। শুঁটকি মাছও আছে।',
    'শিবের বাজার, মাছ বাজার', '01716-567890', '01716-567890',
    '06:30', '15:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, TRUE, FALSE, 4.3, 9, 156)
  ON CONFLICT (slug) DO NOTHING;

  -- 6. বিসমিল্লাহ মাংস ঘর
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone,
                     opening_time, closing_time, open_days, is_approved, is_verified, is_featured,
                     avg_rating, review_count, view_count)
  VALUES ('বিসমিল্লাহ মাংস ঘর', 'bismillah-mangs-ghor', cat_mangsher,
    'তাজা গরু, খাসি ও মুরগির মাংস। হালাল পদ্ধতিতে জবাই। অর্ডার করলে বাড়িতে পৌঁছে দেওয়া হয়।',
    'শিবের বাজার, মাংস পট্টি', '01817-678901', NULL,
    '07:00', '18:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, FALSE, TRUE, 4.6, 15, 203)
  ON CONFLICT (slug) DO NOTHING;

  -- 7. মামার চায়ের দোকান
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone,
                     opening_time, closing_time, open_days, is_approved, is_verified,
                     avg_rating, review_count, view_count)
  VALUES ('মামার চায়ের দোকান', 'mamar-chayer-dokan', cat_chay,
    'সেরা মালাই চা, আদা চা ও মাসালা চা। সাথে পাবেন বিস্কুট, সিঙ্গারা, সমুচা ও পুরি।',
    'শিবের বাজার, মোড়ের পাশে', '01918-789012', NULL,
    '06:00', '23:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, FALSE, FALSE, 4.8, 25, 456)
  ON CONFLICT (slug) DO NOTHING;

  -- 8. ডিজিটাল মোবাইল জোন
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone, whatsapp,
                     opening_time, closing_time, open_days, is_approved, is_verified, is_featured,
                     avg_rating, review_count, view_count)
  VALUES ('ডিজিটাল মোবাইল জোন', 'digital-mobile-zone', cat_elec,
    'নতুন ও রিকন্ডিশন মোবাইল ফোন, ট্যাবলেট, আনুষঙ্গিক পণ্য ও মেরামত সেবা।',
    'শিবের বাজার, ইলেকট্রনিক্স মার্কেট', '01619-890123', '01619-890123',
    '09:00', '21:00', '["সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, TRUE, FALSE, 4.1, 7, 167)
  ON CONFLICT (slug) DO NOTHING;

  -- 9. আনোয়ার হার্ডওয়্যার
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone,
                     opening_time, closing_time, open_days, is_approved, is_verified,
                     avg_rating, review_count, view_count)
  VALUES ('আনোয়ার হার্ডওয়্যার', 'anowar-hardware', cat_hard,
    'নির্মাণ সামগ্রী, রঙ, সিমেন্ট, রড, বালু, স্যানিটারি ও ইলেকট্রিক্যাল সামগ্রী পাওয়া যায়।',
    'শিবের বাজার, হার্ডওয়্যার পট্টি', '01720-901234', NULL,
    '08:00', '19:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র"]',
    TRUE, FALSE, FALSE, 3.9, 4, 89)
  ON CONFLICT (slug) DO NOTHING;

  -- 10. স্বপ্নের বেকারি
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone, whatsapp,
                     opening_time, closing_time, open_days, is_approved, is_verified, is_featured,
                     avg_rating, review_count, view_count)
  VALUES ('স্বপ্নের বেকারি', 'shopner-bakery', cat_bakery,
    'তাজা রুটি, কেক, পেস্ট্রি, বিস্কুট ও বিভিন্ন ধরনের মিষ্টি। জন্মদিন ও বিবাহের কেক অর্ডার নেওয়া হয়।',
    'শিবের বাজার, প্রধান রোড', '01821-012345', '01821-012345',
    '07:00', '21:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, TRUE, TRUE, 4.9, 32, 389)
  ON CONFLICT (slug) DO NOTHING;

  -- 11. নিউ লাইফ ফার্মেসি
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone,
                     opening_time, closing_time, open_days, is_approved, is_verified,
                     avg_rating, review_count, view_count)
  VALUES ('নিউ লাইফ ফার্মেসি', 'new-life-pharmacy', cat_oshudh,
    'সকল ধরনের ওষুধ, হোমিও ও আয়ুর্বেদিক পণ্য পাওয়া যায়। রাত ১২টা পর্যন্ত খোলা।',
    'শিবের বাজার, কলেজ রোড', '01922-123456', NULL,
    '08:00', '00:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, FALSE, FALSE, 4.0, 6, 112)
  ON CONFLICT (slug) DO NOTHING;

  -- 12. মা মুদি স্টোর
  INSERT INTO shops (shop_name, slug, category_id, description, address, phone,
                     opening_time, closing_time, open_days, is_approved, is_verified,
                     avg_rating, review_count, view_count)
  VALUES ('মা মুদি স্টোর', 'ma-mudi-store', cat_mudi,
    'পারিবারিক ব্যবস্থাপনায় পরিচালিত মুদি দোকান। বাকিতে পণ্য পাওয়া যায় নিয়মিত ক্রেতাদের জন্য।',
    'শিবের বাজার, পশ্চিম পাড়া', '01623-234567', NULL,
    '07:00', '22:00', '["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"]',
    TRUE, FALSE, FALSE, 4.3, 10, 134)
  ON CONFLICT (slug) DO NOTHING;

END $$;

-- ── Verification ──
SELECT
  s.shop_name,
  c.name AS category,
  s.is_approved,
  s.is_featured,
  s.avg_rating
FROM shops s
LEFT JOIN categories c ON c.id = s.category_id
ORDER BY s.created_at DESC;
