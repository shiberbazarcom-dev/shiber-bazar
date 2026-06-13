-- ═══════════════════════════════════════════════════════════
-- Migration: Chat, Analytics & Push Notifications
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── 1. CONVERSATIONS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id         UUID        REFERENCES shops(id)    ON DELETE CASCADE,
  owner_id        UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, shop_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_select" ON conversations
  FOR SELECT USING (customer_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "conversation_insert" ON conversations
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "conversation_update" ON conversations
  FOR UPDATE USING (customer_id = auth.uid() OR owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner    ON conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_shop     ON conversations(shop_id);

-- ── 2. MESSAGES TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID        REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id       UUID        REFERENCES profiles(id)      ON DELETE CASCADE NOT NULL,
  content         TEXT        NOT NULL,
  is_read         BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_select" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE customer_id = auth.uid() OR owner_id = auth.uid()
    )
  );

CREATE POLICY "message_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE customer_id = auth.uid() OR owner_id = auth.uid()
    )
  );

CREATE POLICY "message_update" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE customer_id = auth.uid() OR owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created      ON messages(created_at DESC);

-- Enable Realtime for messages & conversations
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ── 3. PRODUCT VIEWS TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS product_views (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID        REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  shop_id    UUID        REFERENCES shops(id)    ON DELETE CASCADE NOT NULL,
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_views_insert" ON product_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "product_views_select" ON product_views
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_product_views_product   ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_shop      ON product_views(shop_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at DESC);

-- ── 4. PUSH SUBSCRIPTIONS TABLE ────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint   TEXT        NOT NULL,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_sub_select" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_sub_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_sub_delete" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
