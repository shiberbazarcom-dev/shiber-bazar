CREATE OR REPLACE TRIGGER new_order_push
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://cqcuostianzgxfxainzn.supabase.co/functions/v1/send-push',
  'POST',
  '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxY3Vvc3RpYW56Z3hmeGFpbnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4OTIyMDQsImV4cCI6MjA5NjQ2ODIwNH0.fZ0P7Uc6yn9P1wOadyQNyIHcwPDsGaSrc2A-E_MhWi4"}',
  '{}',
  '5000'
);
