-- Allow shop owners to delete their own shops
CREATE POLICY "Owner can delete their own shop"
ON public.shops
FOR DELETE
USING (owner_id = auth.uid());

-- Allow shop owners to delete their own shop's related records
-- (favorites, reviews, shop_images, products referencing their shop)

CREATE POLICY "Owner can delete their shop favorites"
ON public.favorites
FOR DELETE
USING (
  shop_id IN (
    SELECT id FROM public.shops WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Owner can delete their shop reviews"
ON public.reviews
FOR DELETE
USING (
  shop_id IN (
    SELECT id FROM public.shops WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Owner can delete their shop images"
ON public.shop_images
FOR DELETE
USING (
  shop_id IN (
    SELECT id FROM public.shops WHERE owner_id = auth.uid()
  )
);

-- Products already have owner delete policy usually, but ensure:
CREATE POLICY "Owner can delete their shop products"
ON public.products
FOR DELETE
USING (
  shop_id IN (
    SELECT id FROM public.shops WHERE owner_id = auth.uid()
  )
);
