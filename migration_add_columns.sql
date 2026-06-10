-- ════════════════════════════════════════════════
-- MIGRATION: Add missing columns to shops table
-- Run this in Supabase → SQL Editor
-- ════════════════════════════════════════════════

-- 1. Add missing columns to shops table
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS status           TEXT DEFAULT 'pending_approval',
  ADD COLUMN IF NOT EXISTS district         TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url     TEXT,
  ADD COLUMN IF NOT EXISTS website_url      TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours    TEXT,
  ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tags             TEXT[] DEFAULT '{}';

-- 2. Migrate existing is_approved → status
UPDATE shops SET status = 'approved'         WHERE is_approved = TRUE  AND (status IS NULL OR status = 'pending_approval');
UPDATE shops SET status = 'pending_approval' WHERE is_approved = FALSE AND status IS NULL;

-- 3. Create shop-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-images',
  'shop-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS: allow authenticated users to upload to their own folder
CREATE POLICY IF NOT EXISTS "Users upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read
CREATE POLICY IF NOT EXISTS "Public read shop-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-images');

-- Allow users to update/delete their own uploads
CREATE POLICY IF NOT EXISTS "Users manage own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
