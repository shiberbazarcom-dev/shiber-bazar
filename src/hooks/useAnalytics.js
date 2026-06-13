import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns'

/* ── Owner's approved shop IDs ── */
export function useMyShopIds() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-shop-ids', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('shops')
        .select('id, shop_name')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
      return data || []
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

async function getShopIds(user, shopId) {
  if (shopId) return [shopId]
  const { data } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', user.id)
    .eq('status', 'approved')
  return (data || []).map(s => s.id)
}

/* ── Overview stats ── */
export function useShopOverviewStats(shopId = null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['shop-overview-stats', user?.id, shopId],
    queryFn: async () => {
      if (!user) return {}
      const shopIds = await getShopIds(user, shopId)
      if (!shopIds.length) return { totalOrders: 0, totalRevenue: 0, totalProductViews: 0, activeProducts: 0 }

      const [ordersRes, viewsRes, productsRes] = await Promise.all([
        supabase.from('orders').select('total_amount, status').in('shop_id', shopIds).neq('status', 'cancelled').neq('status', 'rejected'),
        supabase.from('product_views').select('id', { count: 'exact', head: true }).in('shop_id', shopIds),
        supabase.from('products').select('id', { count: 'exact', head: true }).in('shop_id', shopIds).eq('is_active', true),
      ])

      const orders = ordersRes.data || []
      const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      return {
        totalOrders:       orders.length,
        totalRevenue,
        totalProductViews: viewsRes.count || 0,
        activeProducts:    productsRes.count || 0,
      }
    },
    enabled: !!user,
  })
}

/* ── Daily orders & revenue for last N days ── */
export function useDailyOrders(shopId = null, days = 30) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['daily-orders', user?.id, shopId, days],
    queryFn: async () => {
      if (!user) return []
      const shopIds = await getShopIds(user, shopId)
      if (!shopIds.length) return []

      const since = subDays(new Date(), days).toISOString()
      const { data } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .in('shop_id', shopIds)
        .gte('created_at', since)
        .neq('status', 'cancelled')
        .neq('status', 'rejected')

      const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() })
      const dayMap = {}
      interval.forEach(d => {
        dayMap[format(d, 'yyyy-MM-dd')] = { date: format(d, 'MM/dd'), orders: 0, revenue: 0 }
      })
      ;(data || []).forEach(o => {
        const key = format(startOfDay(new Date(o.created_at)), 'yyyy-MM-dd')
        if (dayMap[key]) {
          dayMap[key].orders += 1
          dayMap[key].revenue += Number(o.total_amount) || 0
        }
      })
      return Object.values(dayMap)
    },
    enabled: !!user,
  })
}

/* ── Top viewed products ── */
export function useTopProducts(shopId = null, limit = 8) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['top-products', user?.id, shopId, limit],
    queryFn: async () => {
      if (!user) return []
      const shopIds = await getShopIds(user, shopId)
      if (!shopIds.length) return []

      const { data: viewData } = await supabase
        .from('product_views')
        .select('product_id')
        .in('shop_id', shopIds)

      if (!viewData?.length) return []

      const countMap = {}
      viewData.forEach(({ product_id }) => {
        countMap[product_id] = (countMap[product_id] || 0) + 1
      })

      const topIds = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id)

      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, image_url, shop_id, shops(shop_name)')
        .in('id', topIds)

      return (products || [])
        .map(p => ({ ...p, views: countMap[p.id] || 0 }))
        .sort((a, b) => b.views - a.views)
    },
    enabled: !!user,
  })
}

/* ── Order status breakdown ── */
export function useOrderStatusBreakdown(shopId = null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['order-status-breakdown', user?.id, shopId],
    queryFn: async () => {
      if (!user) return []
      const shopIds = await getShopIds(user, shopId)
      if (!shopIds.length) return []

      const { data } = await supabase.from('orders').select('status').in('shop_id', shopIds)

      const countMap = {}
      ;(data || []).forEach(({ status }) => {
        countMap[status] = (countMap[status] || 0) + 1
      })

      const labels = { pending: 'অ্যাডমিন রিভিউ', confirmed: 'নতুন অর্ডার', processing: 'প্রক্রিয়াধীন', shipped: 'পাঠানো হয়েছে', delivered: 'পৌঁছে গেছে', cancelled: 'বাতিল', rejected: 'প্রত্যাখ্যাত' }
      const colors = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6', shipped: '#06b6d4', delivered: '#22c55e', cancelled: '#6b7280', rejected: '#ef4444' }

      return Object.entries(countMap).map(([status, count]) => ({
        status, label: labels[status] || status, count, color: colors[status] || '#6b7280',
      }))
    },
    enabled: !!user,
  })
}

/* ── Record a product view (call from ProductDetails) ── */
export async function recordProductView(productId, shopId, userId = null) {
  try {
    await supabase.from('product_views').insert({ product_id: productId, shop_id: shopId, user_id: userId || null })
  } catch { /* silently ignore */ }
}
