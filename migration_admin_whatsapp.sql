-- ═══════════════════════════════════════════════════════
--  শিবের বাজার — Admin WhatsApp Migration
--  Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- Set admin WhatsApp number (used on order success screen)
INSERT INTO site_settings (key, value, label, type)
VALUES ('whatsapp_number', '01310012276', 'Admin WhatsApp নম্বর', 'text')
ON CONFLICT (key) DO UPDATE
  SET value      = '01310012276',
      label      = 'Admin WhatsApp নম্বর',
      updated_at = NOW();

-- Verify
SELECT key, value, label FROM site_settings WHERE key = 'whatsapp_number';
