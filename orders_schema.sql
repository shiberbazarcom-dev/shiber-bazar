-- ═══════════════════════════════════════════════════════
--  শিবের বাজার — Orders Schema
--  Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Order number sequence
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001 INCREMENT BY 1;

-- 2. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number     TEXT        UNIQUE,
  shop_id          UUID        REFERENCES shops(id) ON DELETE SET NULL,

  -- Customer info (no registration needed)
  customer_name    TEXT        NOT NULL,
  customer_phone   TEXT        NOT NULL,
  customer_address TEXT        NOT NULL,

  -- Product info
  product_name     TEXT        NOT NULL,
  quantity         INTEGER     NOT NULL DEFAULT 1,
  notes            TEXT,

  -- Status
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','forwarded','accepted','rejected','delivered')),

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auto-generate order number before insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'SB' || TO_CHAR(NOW(), 'YYYYMMDD') ||
                        LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_order_number ON orders;
CREATE TRIGGER tr_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- 4. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_orders_updated_at ON orders;
CREATE TRIGGER tr_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id        ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders(created_at DESC);

-- 6. Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can place an order
CREATE POLICY "orders_public_insert"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Anyone can view orders (customers need to track by phone)
CREATE POLICY "orders_public_select"
  ON orders FOR SELECT
  USING (true);

-- Shop owners can update their shop's orders (accept / reject / deliver)
CREATE POLICY "orders_owner_update"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'market_manager')
    )
  );

-- Admins can delete orders
CREATE POLICY "orders_admin_delete"
  ON orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'market_manager')
    )
  );
