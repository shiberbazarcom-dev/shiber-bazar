import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { expandQuery, buildOrFilter } from '../lib/banglish'

/* ── Public: search products across all shops (Banglish + Bengali) ── */
export function useSearchProducts(query) {
  return useQuery({
    queryKey: ['products-search', query],
    queryFn: async () => {
      if (!query?.trim()) return []
      const terms = expandQuery(query)
      const orFilter = buildOrFilter(terms, ['name', 'description'])
      const { data, error } = await supabase
        .from('products')
        .select('*, shops(id, shop_name, slug, phone, whatsapp, logo_url)')
        .eq('is_active', true)
        .or(orFilter)
        .limit(40)
      if (error) throw error
      return data || []
    },
    enabled: !!query?.trim(),
  })
}

/* ── Public: single product by id ── */
export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, shops(id, shop_name, slug, phone, whatsapp, logo, address, cover_image)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

/* ── Public: products for a shop ── */
export function useShopProducts(shopId) {
  return useQuery({
    queryKey: ['products', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!shopId,
  })
}

/* ── Shop owner: my products (all shops I own) ── */
export function useMyProducts() {
  return useQuery({
    queryKey: ['my-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: myShops } = await supabase
        .from('shops')
        .select('id, shop_name')
        .eq('owner_id', user.id)

      if (!myShops?.length) return []

      const shopIds = myShops.map(s => s.id)
      const { data, error } = await supabase
        .from('products')
        .select('*, shops(shop_name)')
        .in('shop_id', shopIds)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

/* ── Create product ── */
export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (productData) => {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['my-products'] })
    },
  })
}

/* ── Update product ── */
export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['my-products'] })
    },
  })
}

/* ── Delete product ── */
export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['my-products'] })
    },
  })
}

/* ── Upload product image to Supabase Storage ── */
export async function uploadProductImage(file) {
  const ext  = file.name.split('.').pop()
  const name = `product_${Date.now()}.${ext}`
  const path = `products/${name}`

  const { error } = await supabase.storage
    .from('shop-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from('shop-images').getPublicUrl(path)
  return data.publicUrl
}
