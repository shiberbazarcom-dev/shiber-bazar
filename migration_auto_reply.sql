-- Add auto_reply_enabled to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS auto_reply_enabled boolean DEFAULT false;
