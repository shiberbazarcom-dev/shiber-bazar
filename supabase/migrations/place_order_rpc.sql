-- RPC function so anon users can place orders and get back the inserted row.
-- Needed because anon has no SELECT policy on orders, so INSERT...RETURNING
-- returns 0 rows and PostgREST raises 42501.
CREATE OR REPLACE FUNCTION public.place_order_public(
  p_customer_name    text,
  p_customer_phone   text,
  p_customer_address text,
  p_product_name     text,
  p_quantity         int,
  p_total_amount     numeric,
  p_shop_id          uuid    DEFAULT NULL,
  p_notes            text    DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  INSERT INTO public.orders (
    customer_name, customer_phone, customer_address,
    product_name, quantity, total_amount, shop_id, notes
  ) VALUES (
    p_customer_name, p_customer_phone, p_customer_address,
    p_product_name, p_quantity, p_total_amount, p_shop_id, p_notes
  ) RETURNING * INTO v_order;

  RETURN row_to_json(v_order);
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order_public TO anon, authenticated;
