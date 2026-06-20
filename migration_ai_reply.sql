-- Add is_ai flag to messages (to mark AI-generated replies)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ai boolean DEFAULT false;

-- Add ai_persona to shops (optional custom instructions for the AI)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS ai_persona text;
