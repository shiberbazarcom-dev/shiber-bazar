-- Error logs table for admin monitoring
CREATE TABLE IF NOT EXISTS error_logs (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  severity    text        DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'crash')),
  message     text        NOT NULL,
  stack       text,
  url         text,
  component   text,
  user_agent  text,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  extra       jsonb
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS error_logs_created_at_idx ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_severity_idx   ON error_logs(severity);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (errors happen on public pages too)
CREATE POLICY "allow_insert_error_logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Only super_admin and market_manager can read
CREATE POLICY "admins_read_error_logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'market_manager')
    )
  );

-- Only super_admin and market_manager can delete
CREATE POLICY "admins_delete_error_logs" ON error_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'market_manager')
    )
  );
