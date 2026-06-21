-- ══════════════════════════════════════════════════════════════
-- Advanced Handoff State — adds handoff_state to conversations
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS handoff_state text NOT NULL DEFAULT 'none';

-- Backfill: existing ai_paused=true rows were 'requested' (no owner reply yet)
UPDATE conversations
  SET handoff_state = 'requested'
  WHERE ai_paused = true AND handoff_state = 'none';

-- Values:
--   'none'      → normal AI chat
--   'requested' → customer asked for human, owner has not replied yet
--   'active'    → owner replied as human, AI stays silent until owner re-enables

COMMENT ON COLUMN conversations.handoff_state IS
  'none | requested | active — tracks human handoff lifecycle. Visible to owner/admin only.';

SELECT 'handoff_state column added' AS status;
