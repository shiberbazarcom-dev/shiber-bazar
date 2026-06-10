-- Create notifications table for shop approval workflow and general notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL, -- 'shop_approved', 'shop_rejected', 'new_shop_request', 'order_received', etc.
  is_read     BOOLEAN DEFAULT FALSE,
  metadata    JSONB DEFAULT '{}', -- { shop_id, shop_name, order_id, etc. }
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() 
    AND role IN ('super_admin', 'market_manager')));

-- Service role can create notifications (for triggers/functions)
CREATE POLICY "Service can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create function to auto-create notification when shop status changes
CREATE OR REPLACE FUNCTION notify_shop_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (user_id, title, message, type, metadata)
      VALUES (
        NEW.owner_id,
        'আপনার দোকান অনুমোদিত হয়েছে',
        NEW.shop_name || ' অনুমোদিত হয়েছে। এখন আপনি পণ্য যোগ করতে পারবেন।',
        'shop_approved',
        jsonb_build_object('shop_id', NEW.id, 'shop_name', NEW.shop_name)
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, title, message, type, metadata)
      VALUES (
        NEW.owner_id,
        'আপনার দোকান অনুমোদিত হয়নি',
        NEW.shop_name || ' অনুমোদিত হয়নি। অনুগ্রহ করে তথ্য সংশোধন করে পুনরায় জমা দিন।',
        'shop_rejected',
        jsonb_build_object('shop_id', NEW.id, 'shop_name', NEW.shop_name)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shop status changes
DROP TRIGGER IF EXISTS shop_status_change_trigger ON shops;
CREATE TRIGGER shop_status_change_trigger
  AFTER UPDATE OF status ON shops
  FOR EACH ROW
  EXECUTE FUNCTION notify_shop_status_change();
