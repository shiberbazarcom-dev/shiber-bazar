-- ============================================================
-- Audit Log — track admin actions (shop approvals, role changes, order updates)
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,   -- e.g. 'shop_approved', 'shop_rejected', 'order_status_changed', 'role_changed'
  entity_type TEXT        NOT NULL,   -- 'shop', 'order', 'user'
  entity_id   UUID,
  entity_name TEXT,
  details     JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and market managers can read audit logs
CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'market_manager')
    )
  );

-- Any authenticated user can insert (the app writes logs)
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
