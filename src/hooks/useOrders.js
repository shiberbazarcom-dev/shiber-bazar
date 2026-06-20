import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/auditLog'

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

/* ── Customer: track orders by phone (uses RPC to avoid unrestricted table read) ── */
export function useTrackOrder(phone) {
  return useQuery({
    queryKey: ['track-order', phone],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('track_orders_by_phone', { p_phone: phone.trim() })
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
      // ── Ownership verification (defense-in-depth on top of RLS) ──────────
      const { data: { user: caller } } = await supabase.auth.getUser()
      if (!caller) throw new Error('অনুমতি নেই')

      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', caller.id)
        .single()
      const isAdmin = ['super_admin', 'market_manager'].includes(callerProfile?.role)

      if (!isAdmin) {
        // Fetch the order's current shop_id (use the incoming shop_id override if provided,
        // otherwise read the existing value from the database)
        const targetShopId = shop_id ?? (await supabase
          .from('orders')
          .select('shop_id')
          .eq('id', id)
          .single()
          .then(r => r.data?.shop_id))

        if (!targetShopId) throw new Error('অর্ডারটি পাওয়া যায়নি')

        const { data: ownedShop } = await supabase
          .from('shops')
          .select('id')
          .eq('id', targetShopId)
          .eq('owner_id', caller.id)
          .maybeSingle()

        if (!ownedShop) throw new Error('আপনি এই অর্ডার পরিবর্তন করতে পারবেন না')
      }
      // ── End ownership verification ────────────────────────────────────────

      const updates = { status }
      if (shop_id !== undefined) updates.shop_id = shop_id
      const { data: order, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select('customer_id, order_number, shop_id, shops(shop_name, owner_id)')
        .single()
      if (error) throw error

      // Audit log
      logAudit({
        action: 'order_status_changed',
        entityType: 'order',
        entityId: id,
        entityName: order?.order_number,
        details: { status, shop_id },
      })

      // Insert in-app notification when order is confirmed
      if (status === 'confirmed' && order?.customer_id) {
        await supabase.from('notifications').insert({
          user_id: order.customer_id,
          type:    'order_confirmed',
          title:   'অর্ডার নিশ্চিত হয়েছে ✅',
          message: `${order.shops?.shop_name || 'দোকান'} আপনার অর্ডার গ্রহণ করেছে।`,
          data:    { order_id: id },
        })
      }

      // Send order status notification in chat conversation
      const STATUS_MSG = {
        accepted:  `আপনার অর্ডার (${order?.order_number || ''}) গ্রহণ করা হয়েছে। শীঘ্রই ডেলিভারি দেওয়া হবে।`,
        rejected:  `দুঃখিত, আপনার অর্ডার (${order?.order_number || ''}) বাতিল করা হয়েছে। বিস্তারিত জানতে যোগাযোগ করুন।`,
        delivered: `আপনার অর্ডার (${order?.order_number || ''}) সফলভাবে ডেলিভারি দেওয়া হয়েছে। ধন্যবাদ!`,
      }
      const chatMsg = STATUS_MSG[status]
      if (chatMsg && order?.customer_id && order?.shops?.owner_id) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('customer_id', order.customer_id)
          .eq('shop_id', order.shop_id || shop_id)
          .maybeSingle()
        if (conv?.id) {
          await supabase.from('messages').insert({
            conversation_id: conv.id,
            sender_id: order.shops.owner_id,
            content: chatMsg,
            is_ai: false,
          })
          await supabase.from('conversations')
            .update({ last_message: chatMsg, last_message_at: new Date().toISOString() })
            .eq('id', conv.id)
        }
      }
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
