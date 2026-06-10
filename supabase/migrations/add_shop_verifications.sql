-- ══════════════════════════════════════════════════════════════════════
-- Shiber Bazar — Shop Verification System
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. shop_verifications table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_verifications (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id          UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL CHECK (document_type IN (
                     'nid_front', 'nid_back', 'trade_license',
                     'driving_license', 'passport', 'other'
                   )),
  document_url     TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending_review'
                     CHECK (status IN ('pending_review', 'verified', 'rejected')),
  rejection_reason TEXT,
  verified_by      UUID REFERENCES auth.users(id),
  verified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_shop_verifications_shop_id ON shop_verifications(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_verifications_user_id ON shop_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_verifications_status  ON shop_verifications(status);

-- ── 2. Add verification_status column to shops ─────────────────────────
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending_review', 'verified', 'rejected'));

-- ── 3. Enable Row Level Security ──────────────────────────────────────
ALTER TABLE shop_verifications ENABLE ROW LEVEL SECURITY;

-- Shop owner can INSERT their own verification documents
CREATE POLICY "owner_insert_verification"
  ON shop_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Shop owner can SELECT their own documents
CREATE POLICY "owner_select_verification"
  ON shop_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can SELECT all documents
-- (assumes admins have role 'admin' in profiles table)
CREATE POLICY "admin_select_all_verifications"
  ON shop_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Admin can UPDATE (approve/reject)
CREATE POLICY "admin_update_verifications"
  ON shop_verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── 4. Private Storage Bucket for verification documents ─────────────
-- Run this AFTER creating the bucket manually in Supabase Storage UI:
--   Name: verification-docs
--   Public: OFF (private)
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/png, application/pdf

-- Storage RLS: owner can upload to their own folder
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-docs',
  'verification-docs',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: owner can upload
CREATE POLICY "owner_upload_verification_docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: owner can read their own docs
CREATE POLICY "owner_read_verification_docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: admin can read all docs
CREATE POLICY "admin_read_all_verification_docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── 5. Verify setup ───────────────────────────────────────────────────
SELECT 'shop_verifications table created' AS status;
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'shop_verifications' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'shops' AND column_name = 'verification_status';
