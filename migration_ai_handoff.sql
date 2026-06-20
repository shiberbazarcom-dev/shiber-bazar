-- When customer requests human agent, AI is paused for that conversation
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_paused boolean DEFAULT false;
