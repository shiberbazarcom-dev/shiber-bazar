-- =====================================================
-- শিবের বাজার — Full Production Schema
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  role        TEXT DEFAULT 'user'
              CHECK (role IN ('user','shop_owner','market_manager','super_admin')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT DEFAULT '🏪',
  cover_image TEXT,
  description TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 3. SUBCATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subcategories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 4. SHOPS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name       TEXT NOT NULL,
  slug            TEXT UNIQUE,
  description     TEXT,
  phone           TEXT,
  whatsapp        TEXT,
  email           TEXT,
  website         TEXT,
  address         TEXT,
  google_map_link TEXT,
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  logo            TEXT,
  cover_image     TEXT,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id  UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  owner_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opening_time    TEXT DEFAULT '৮:০০ AM',
  closing_time    TEXT DEFAULT '১০:০০ PM',
  open_days       TEXT[] DEFAULT ARRAY['শনি','রবি','সোম','মঙ্গল','বুধ','বৃহস্পতি'],
  is_approved     BOOLEAN DEFAULT FALSE,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_verified     BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  view_count      INT DEFAULT 0,
  avg_rating      DECIMAL(3,2) DEFAULT 0,
  review_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 5. SHOP IMAGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_images (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id    UUID REFERENCES shops(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt_text   TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 6. REVIEWS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id    UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (shop_id, user_id)
);

-- ─────────────────────────────────────────
-- 7. FAVORITES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id    UUID REFERENCES shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, shop_id)
);

-- ─────────────────────────────────────────
-- 8. ADVERTISEMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advertisements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  image_url   TEXT,
  link_url    TEXT,
  position    TEXT DEFAULT 'banner' CHECK (position IN ('banner','sidebar','popup')),
  is_active   BOOLEAN DEFAULT TRUE,
  starts_at   TIMESTAMPTZ DEFAULT NOW(),
  ends_at     TIMESTAMPTZ,
  click_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 9. SHOP VIEWS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_views (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id    UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 10. CONTACT REQUESTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_requests (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id    UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name       TEXT,
  phone      TEXT,
  message    TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category_id);
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_approved ON shops(is_approved) WHERE is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_shops_featured ON shops(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_shops_search ON shops USING gin(to_tsvector('simple', shop_name || ' ' || COALESCE(address,'') || ' ' || COALESCE(description,'')));
CREATE INDEX IF NOT EXISTS idx_reviews_shop ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_views_shop ON shop_views(shop_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops            ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_views       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Categories & Subcategories: public read
CREATE POLICY "public_read_categories"    ON categories    FOR SELECT USING (TRUE);
CREATE POLICY "public_read_subcategories" ON subcategories FOR SELECT USING (TRUE);
CREATE POLICY "admin_manage_categories"   ON categories    FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager')));
CREATE POLICY "admin_manage_subcategories" ON subcategories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager')));

-- Profiles
CREATE POLICY "profiles_read_own"    ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "admin_read_profiles"  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager')));

-- Shops: approved are public, owners manage their own
CREATE POLICY "public_read_approved_shops" ON shops FOR SELECT USING (is_approved = TRUE AND is_active = TRUE);
CREATE POLICY "owner_read_own_shops"       ON shops FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "owner_insert_shop"          ON shops FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());
CREATE POLICY "owner_update_own_shop"      ON shops FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "admin_manage_shops"         ON shops FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager')));

-- Shop Images
CREATE POLICY "public_read_shop_images" ON shop_images FOR SELECT USING (TRUE);
CREATE POLICY "owner_manage_shop_images" ON shop_images FOR ALL
  USING (EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid()));

-- Reviews
CREATE POLICY "public_read_reviews"  ON reviews FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "auth_insert_review"   ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth_update_own_review" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admin_manage_reviews" ON reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager')));

-- Favorites
CREATE POLICY "own_favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Advertisements
CREATE POLICY "public_read_ads"  ON advertisements FOR SELECT USING (is_active = TRUE);
CREATE POLICY "admin_manage_ads" ON advertisements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager')));

-- Shop Views
CREATE POLICY "insert_view"      ON shop_views FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "admin_read_views" ON shop_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager')));

-- Contact Requests
CREATE POLICY "auth_insert_contact"  ON contact_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "owner_read_contacts"  ON contact_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND owner_id = auth.uid()));
CREATE POLICY "admin_manage_contacts" ON contact_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin','market_manager')));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update shop avg_rating when review changes
CREATE OR REPLACE FUNCTION update_shop_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shops SET
    avg_rating   = (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id) AND is_visible = TRUE),
    review_count = (SELECT COUNT(*) FROM reviews WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id) AND is_visible = TRUE)
  WHERE id = COALESCE(NEW.shop_id, OLD.shop_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_shop_rating();

-- Auto-generate slug for shop
CREATE OR REPLACE FUNCTION generate_shop_slug()
RETURNS TRIGGER AS $$
DECLARE base_slug TEXT; final_slug TEXT; counter INT := 0;
BEGIN
  base_slug := LOWER(regexp_replace(NEW.shop_name, '[^a-zA-Z0-9ঀ-৿]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'shop'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM shops WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_shop_slug ON shops;
CREATE TRIGGER auto_shop_slug
  BEFORE INSERT ON shops
  FOR EACH ROW EXECUTE FUNCTION generate_shop_slug();

-- =====================================================
-- SEED DATA — Categories
-- =====================================================
INSERT INTO categories (name, slug, icon, description, sort_order) VALUES
  ('মুদি দোকান',      'mudi-dokan',       '🛒', 'চাল, ডাল, তেল, মশলা, নিত্যপ্রয়োজনীয় পণ্য', 1),
  ('কাপড়ের দোকান',   'kapor-dokan',      '👕', 'শাড়ি, পাঞ্জাবি, লুঙ্গি, শার্ট, পোশাক',      2),
  ('ওষুধের দোকান',   'oshudher-dokan',   '💊', 'ফার্মেসি, ওষুধ ও স্বাস্থ্যসামগ্রী',          3),
  ('সবজির দোকান',    'sobji-dokan',      '🥬', 'তাজা শাকসবজি ও ফলমূল',                      4),
  ('মাছের দোকান',    'macher-dokan',     '🐟', 'তাজা মাছ ও শুঁটকি',                         5),
  ('মাংসের দোকান',   'mangsher-dokan',   '🥩', 'গরু, খাসি, মুরগি ও অন্যান্য মাংস',          6),
  ('চায়ের দোকান',   'chayer-dokan',     '☕', 'চা, নাস্তা, মিষ্টি ও হালকা খাবার',          7),
  ('ইলেকট্রনিক্স',   'electronics',      '📱', 'মোবাইল, টিভি, ফ্রিজ ও ইলেকট্রিক পণ্য',      8),
  ('কামারের দোকান',  'kamar-dokan',      '🔧', 'লোহার সরঞ্জাম, হার্ডওয়্যার ও মেরামত',       9),
  ('কাঠের দোকান',    'kather-dokan',     '🪵', 'আসবাবপত্র, দরজা-জানালা ও কাঠের কাজ',        10),
  ('সোনার দোকান',    'sonar-dokan',      '💍', 'গহনা, জুয়েলারি ও মূল্যবান ধাতু',            11),
  ('সেলুন',          'salon',            '✂️', 'চুল কাটা, দাড়ি, বিউটি পার্লার',             12),
  ('মোবাইল সার্ভিস', 'mobile-service',   '🔌', 'মোবাইল মেরামত, আনুষাঙ্গিক ও সার্ভিস',        13),
  ('লাইব্রেরি',   'boier-dokan',      '📚', 'বই, স্টেশনারি ও শিক্ষা উপকরণ',              14),
  ('মিষ্টির দোকান',  'mishtir-dokan',   '🍬', 'মিষ্টি, বেকারি ও কনফেকশনারি',               15),
  ('অন্যান্য',       'other',            '🏪', 'অন্যান্য ধরনের দোকান ও সেবা',               99)
ON CONFLICT (slug) DO NOTHING;
