-- Fix: job_listings admin policy was using JWT claims (user_role)
-- but this project checks profiles.role table instead.
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run

DROP POLICY IF EXISTS "job_listings_admin_all" ON job_listings;

CREATE POLICY "job_listings_admin_all"
  ON job_listings FOR ALL
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

SELECT 'job_listings RLS fixed — admin can now insert/update/delete' AS status;
