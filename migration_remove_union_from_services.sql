-- ইউনিয়ন পরিষদ entries সার্ভিস ডিরেক্টরি থেকে মুছুন
-- Supabase SQL Editor এ run করুন

-- ১. union-parishad ও govt-officer category র entries মুছুন
DELETE FROM local_service_directory
WHERE category_id IN (
  SELECT id FROM local_service_categories
  WHERE slug IN ('union-parishad', 'govt-officer')
);

-- ২. category দুটো মুছুন
DELETE FROM local_service_categories
WHERE slug IN ('union-parishad', 'govt-officer');
