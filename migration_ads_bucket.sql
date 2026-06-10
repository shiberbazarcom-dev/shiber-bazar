-- Create 'ads' storage bucket for advertisement images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ads',
  'ads',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow super_admin / market_manager to upload
CREATE POLICY "Admins can upload ad images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ads'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'market_manager')
  )
);

-- Allow super_admin / market_manager to update/delete
CREATE POLICY "Admins can manage ad images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ads'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'market_manager')
  )
);

-- Public read (ads are publicly visible)
CREATE POLICY "Public can view ad images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');
