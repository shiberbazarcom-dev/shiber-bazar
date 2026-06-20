-- Phase 1 CMS: seed site_settings with all CMS-managed content
-- Safe: ON CONFLICT DO NOTHING — will NOT overwrite whatsapp_number, contact_email, etc.
-- Fixed: removed "group" column (table only has key, value, type, label)

INSERT INTO site_settings (key, value, type, label) VALUES

-- ── SITE / MARKET ──────────────────────────────────────────────────
('site_name',              'শিবের বাজার',                                         'text',     'মার্কেটের নাম'),
('site_tagline',           'আপনার স্থানীয় বাজারের ডিজিটাল ঠিকানা',            'text',     'স্লোগান'),
('site_logo_url',          '/logo.png',                                           'url',      'লোগো URL'),
('site_favicon_url',       '/logo.png',                                           'url',      'Favicon URL'),
('site_url',               'https://shiberbazar.vercel.app',                      'url',      'সাইটের URL'),
('site_footer_copyright',  'শিবের বাজার। সর্বস্বত্ব সংরক্ষিত।',                'text',     'Copyright লেখা'),

-- ── SEO ────────────────────────────────────────────────────────────
('meta_description',  'সিলেটের শিবের বাজারের সকল দোকান এক জায়গায়। খাবার, পোশাক, ইলেকট্রনিক্স, মুদিপণ্য সহ শতাধিক দোকান খুঁজুন, পণ্য দেখুন ও সরাসরি যোগাযোগ করুন।', 'textarea', 'Meta Description'),
('og_image_url',      '/logo.png',                                                'url',      'OG Share Image'),
('meta_keywords',     'শিবের বাজার, সিলেট, দোকান, বাজার, অনলাইন',             'text',     'Keywords'),

-- ── HERO ───────────────────────────────────────────────────────────
('hero_title',                      'শিবের বাজার',                               'text',     'Hero শিরোনাম'),
('hero_subtitle',                   'আপনার এলাকার সকল দোকান এক জায়গায় — সহজে খুঁজুন, যোগাযোগ করুন', 'textarea', 'Hero সাবটাইটেল'),
('hero_search_placeholder_shop',    'দোকানের নাম বা ক্যাটাগরি লিখুন...',       'text',     'Search placeholder (দোকান)'),
('hero_search_placeholder_product', 'পণ্যের নাম লিখুন...',                      'text',     'Search placeholder (পণ্য)'),

-- ── CTA SECTION ────────────────────────────────────────────────────
('cta_badge',         'ফ্রি রেজিস্ট্রেশন',                                      'text',     'CTA Badge লেখা'),
('cta_title',         'আপনার দোকান যোগ করুন',                                   'text',     'CTA শিরোনাম'),
('cta_subtitle',      'বিনামূল্যে আপনার দোকানের তথ্য দিন এবং লক্ষাধিক মানুষের কাছে পৌঁছান। আমাদের প্ল্যাটফর্মে আজই যোগ দিন।', 'textarea', 'CTA বিবরণ'),
('cta_btn_primary',   'বিনামূল্যে রেজিস্ট্রেশন করুন',                           'text',     'Primary বাটন'),
('cta_btn_secondary', 'দোকান ব্রাউজ করুন',                                       'text',     'Secondary বাটন'),

-- ── CONTACT ────────────────────────────────────────────────────────
('contact_phone',         '01310012276',                                          'text',     'ফোন নম্বর (tel: link)'),
('contact_phone_display', '০১৩১০-০১২২৭৬',                                       'text',     'ফোন (দেখানোর জন্য)'),
('contact_address',       'শিবের বাজার, সিলেট সদর, সিলেট',                     'textarea', 'ঠিকানা'),
('map_embed_url',         'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3618.8937088394444!2d91.8673!3d24.8949!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3751ab29c1e6c4b1%3A0x4e4e4e4e4e4e4e4e!2sSylhet!5e0!3m2!1sen!2sbd!4v1234567890', 'url', 'Google Maps Embed URL'),

-- ── FOOTER ─────────────────────────────────────────────────────────
('footer_about',  'আপনার এলাকার সকল দোকানের তথ্য এক জায়গায়। সহজে খুঁজুন, যোগাযোগ করুন।', 'textarea', 'Footer বিবরণ'),

-- ── UNION ──────────────────────────────────────────────────────────
('union_name',           '২নং হাটখোলা ইউনিয়ন পরিষদ',                           'text',     'ইউনিয়নের নাম'),
('union_area',           'সিলেট সদর উপজেলা, সিলেট জেলা',                       'text',     'এলাকা'),
('union_email',          'hatkhulaunion@gmail.com',                               'text',     'ইউনিয়ন ইমেইল'),
('union_chairman_name',  'মাওলানা কে এম রফিকুজ্জামান',                          'text',     'চেয়ারম্যানের নাম'),
('union_chairman_phone', '01714508159',                                           'text',     'চেয়ারম্যানের ফোন'),
('union_chairman_title', 'ইউপি চেয়ারম্যান',                                     'text',     'চেয়ারম্যানের পদবি'),
('union_secretary_name', 'মকসুদ আলী',                                            'text',     'সচিবের নাম'),
('union_secretary_phone','01712964794',                                           'text',     'সচিবের ফোন'),
('union_krishi_name',    'নমিতা পুরকায়স্থ',                                      'text',     'কৃষি কর্মকর্তার নাম'),
('union_krishi_phone',   '01728456787',                                           'text',     'কৃষি কর্মকর্তার ফোন'),
('union_police_name',    'জালালাবাদ থানা',                                        'text',     'থানার নাম'),
('union_police_phone',   '01320067594',                                           'text',     'থানার ফোন')

ON CONFLICT (key) DO NOTHING;
