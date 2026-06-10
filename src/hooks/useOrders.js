import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/* ── Place order (public, no auth needed) ── */
export function usePlaceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderData) => {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

/* ── Customer: track orders by phone ── */
export function useTrackOrder(phone) {
  return useQuery({
    queryKey: ['track-order', phone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, shops(shop_name, phone)')
        .eq('customer_phone', phone.trim())
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!phone && phone.trim().length >= 10,
  })
}

/* ── Admin: all orders (optionally filtered by status) ── */
export function useAdminOrders(status = '') {
  return useQuery({
    queryKey: ['admin-orders', status],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('*, shops(id, shop_name, phone)')
        .order('created_at', { ascending: false })
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
  })
}

/* ── Shop owner: orders assigned to my shops ── */
export function useShopOrders() {
  return useQuery({
    queryKey: ['shop-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: myShops } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)

      if (!myShops?.length) return []

      const shopIds = myShops.map(s => s.id)
      const { data, error } = await supabase
        .from('orders')
        .select('*, shops(shop_name)')
        .in('shop_id', shopIds)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

/* ── Update order status (and optionally assign shop) ── */
export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, shop_id }) => {
      const updates = { status }
      if (shop_id !== undefined) updates.shop_id = shop_id
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['shop-orders'] })
    },
  })
}

/* ── Shops list for admin assignment dropdown ── */
export function useShopsForAssignment() {
  return useQuery({
    queryKey: ['shops-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, phone, categories(name, icon)')
        .eq('status', 'approved')
        .order('shop_name')
      if (error) throw error
      return data || []
    },
  })
}

/* ── Shop owner: new confirmed orders count (for sidebar badge) ── */
// Admin assigns order → status becomes 'confirmed' (ManageOrders.tsx)
export function useShopOrderStats() {
  return useQuery({
    queryKey: ['shop-order-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { confirmed: 0 }

      const { data: myShops } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)

      if (!myShops?.length) return { confirmed: 0 }
      const shopIds = myShops.map(s => s.id)

      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('shop_id', shopIds)
        .eq('status', 'confirmed')

      return { confirmed: count || 0 }
    },
  })
}

/* ── Admin: order stats for dashboard ── */
export function useOrderStats() {
  return useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const statuses = ['pending', 'forwarded', 'accepted', 'rejected', 'delivered']
      const results = await Promise.all(
        statuses.map(s =>
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', s)
        )
      )
      const total = await supabase.from('orders').select('*', { count: 'exact', head: true })
      return {
        total:     total.count || 0,
        pending:   results[0].count || 0,
        forwarded: results[1].count || 0,
        accepted:  results[2].count || 0,
        rejected:  results[3].count || 0,
        delivered: results[4].count || 0,
      }
    },
  })
}
