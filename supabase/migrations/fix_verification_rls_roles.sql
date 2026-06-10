-- ══════════════════════════════════════════════════════════════════════
-- Fix: RLS policies used role='admin' but app uses 'super_admin'/'market_manager'
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════════

-- ── Drop old wrong-role policies ─────────────────────────────────────
DROP POLICY IF EXISTS "admin_select_all_verifications"     ON shop_verifications;
DROP POLICY IF EXISTS "admin_update_verifications"          ON shop_verifications;
DROP POLICY IF EXISTS "admin_read_all_verification_docs"    ON storage.objects;

-- ── Recreate with correct roles ───────────────────────────────────────

-- Admin SELECT on shop_verifications
CREATE POLICY "admin_select_all_verifications"
  ON shop_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'market_manager')
    )
  );

-- Admin UPDATE (approve / reject)
CREATE POLICY "admin_update_verifications"
  ON shop_verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'market_manager')
    )
  );

-- Admin read verification docs from storage
CREATE POLICY "admin_read_all_verification_docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'market_manager')
    )
  );

SELECT 'RLS roles fixed — admin can now read shop_verifications' AS status;
