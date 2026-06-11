-- ══════════════════════════════════════════════════════════════════
-- Fix: Admin can read/update ALL services regardless of status
-- Run this in Supabase SQL Editor after add_services_module.sql
-- ══════════════════════════════════════════════════════════════════

-- Admin full read access (super_admin + market_manager)
DROP POLICY IF EXISTS "admin_services_all" ON services;
CREATE POLICY "admin_services_all"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'market_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'market_manager')
    )
  );

-- Admin full access to service_categories (manage categories)
DROP POLICY IF EXISTS "admin_service_cats_all" ON service_categories;
CREATE POLICY "admin_service_cats_all"
  ON service_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'market_manager')
    )
  );

-- Optional helper function to increment views safely
CREATE OR REPLACE FUNCTION increment_service_views(service_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE services SET views = views + 1 WHERE id = service_id;
$$;
