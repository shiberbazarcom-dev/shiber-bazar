-- Add images[] column to products table for multiple product images
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Allow shop owners to update products (INSERT already exists)
-- Allow users to update storage objects they own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users update own uploads'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users update own uploads"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = ''shop-images''
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    ';
  END IF;
END $$;
