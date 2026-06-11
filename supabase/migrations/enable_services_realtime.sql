-- ══════════════════════════════════════════════════════════════════
-- Enable Realtime for services table
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- Add services table to the realtime publication so INSERT events fire
ALTER PUBLICATION supabase_realtime ADD TABLE services;

-- Also ensure service_categories is reachable (optional, low traffic)
-- ALTER PUBLICATION supabase_realtime ADD TABLE service_categories;
