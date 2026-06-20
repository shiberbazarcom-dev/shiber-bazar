-- Quick replies metadata for AI messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS quick_replies jsonb;
