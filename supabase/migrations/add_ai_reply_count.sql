-- Tamper-proof AI reply counter per shop
-- Stored server-side, incremented only by the Edge Function (service role)
-- Client users cannot update this column via RLS

ALTER TABLE shops ADD COLUMN IF NOT EXISTS ai_reply_count integer NOT NULL DEFAULT 0;

-- Only service role (Edge Function) can update ai_reply_count
-- Regular authenticated users cannot modify it
CREATE POLICY "No client update on ai_reply_count"
  ON shops
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Prevent clients from changing ai_reply_count
    ai_reply_count = (SELECT ai_reply_count FROM shops WHERE id = shops.id)
  );
