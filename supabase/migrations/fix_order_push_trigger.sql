-- Drop old broken trigger
DROP TRIGGER IF EXISTS new_order_push ON public.orders;

-- Wrapper function that includes the full order row in the HTTP body
CREATE OR REPLACE FUNCTION notify_new_order_push()
RETURNS trigger AS $$
BEGIN
  PERFORM supabase_functions.http_request(
    'https://cqcuostianzgxfxainzn.supabase.co/functions/v1/send-push',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxY3Vvc3RpYW56Z3hmeGFpbnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4OTIyMDQsImV4cCI6MjA5NjQ2ODIwNH0.fZ0P7Uc6yn9P1wOadyQNyIHcwPDsGaSrc2A-E_MhWi4"}',
    json_build_object('record', row_to_json(NEW))::text,
    '5000'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New trigger using the wrapper function
CREATE TRIGGER new_order_push
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION notify_new_order_push();
