import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { expandQuery, buildOrFilter } from '../lib/banglish'
import { logAudit } from '../lib/auditLog'

const SHOP_FIELDS = '*, categories(id,name,icon,slug), profiles(full_name,avatar_url,phone)'
const PAGE_SIZE   = 12

/* ── All approved shops (paginated) ── */
export function useShops({ categoryId, search, sortBy = 'newest', featured } = {}) {
  return useInfiniteQuery({
    queryKey: ['shops', { categoryId, search, sortBy, featured }],
    queryFn: async ({ pageParam = 0 }) => {
      let q = supabase.from('shops')
        .select(SHOP_FIELDS, { count: 'exact' })
        .eq('status', 'approved')
        .eq('is_active', true)
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)

      if (categoryId) q = q.eq('category_id', categoryId)
      if (featured)   q = q.eq('is_featured', true)
      if (search) {
        const terms = expandQuery(search)
        q = q.or(buildOrFilter(terms, ['shop_name', 'description']))
      }

      if (sortBy === 'newest')     q = q.order('created_at', { ascending: false })
      if (sortBy === 'rating')     q = q.order('avg_rating', { ascending: false })
      if (sortBy === 'popular')    q = q.order('view_count', { ascending: false })
      if (sortBy === 'featured')   q = q.order('is_featured', { ascending: false }).order('created_at', { ascending: false })

      const { data, error, count } = await q
      if (error) throw error
      return { data: data || [], count, nextPage: (pageParam + 1) * PAGE_SIZE < count ? pageParam + 1 : undefined }
    },
    getNextPageParam: (last) => last.nextPage,
    initialPageParam: 0,
  })
}

/* ── Single shop by id or slug ── */
export function useShop(idOrSlug) {
  return useQuery({
    queryKey: ['shop', idOrSlug],
    queryFn: async () => {
      const isUUID = /^[0-9a-f-]{36}$/.test(idOrSlug)
      const q = supabase.from('shops')
        .select(`${SHOP_FIELDS}, shop_images(url,alt_text,sort_order)`)
      const { data, error } = isUUID
        ? await q.eq('id', idOrSlug).single()
        : await q.eq('slug', idOrSlug).single()
      if (error) throw error
      return data
    },
    enabled: !!idOrSlug,
  })
}

/* ── Featured shops ── */
export function useFeaturedShops(limit = 6) {
  return useQuery({
    queryKey: ['shops', 'featured', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('shops')
        .select(SHOP_FIELDS)
        .eq('status', 'approved').eq('is_featured', true).eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    },
  })
}

/* ── Latest shops ── */
export function useLatestShops(limit = 8) {
  return useQuery({
    queryKey: ['shops', 'latest', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('shops')
        .select(SHOP_FIELDS)
        .eq('status', 'approved').eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    },
  })
}

/* ── Stats ── */
export function useMarketStats() {
  return useQuery({
    queryKey: ['market-stats'],
    queryFn: async () => {
      const [shopsRes, catsRes, usersRes, productsRes] = await Promise.all([
        supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ])
      return {
        totalShops: shopsRes.count || 0,
        totalCategories: catsRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalProducts: productsRes.count || 0,
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}

/* ── Global Search (Shops, Products, Categories) ── */
export function useGlobalSearch(query) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query?.trim()) return { shops: [], products: [], categories: [] }
      
      const searchTerm = query.trim()
      const terms = expandQuery(searchTerm)

      const [shopsRes, productsRes, categoriesRes] = await Promise.all([
        // Search shops (name + description)
        supabase
          .from('shops')
          .select('id, shop_name, slug, logo, address, avg_rating')
          .eq('status', 'approved')
          .eq('is_active', true)
          .or(buildOrFilter(terms, ['shop_name', 'description']))
          .limit(5),
        // Search products (name + description)
        supabase
          .from('products')
          .select('id, name, price, image_url, shop_id, shops(id, shop_name, slug)')
          .eq('is_active', true)
          .or(buildOrFilter(terms, ['name', 'description']))
          .limit(5),
        // Search categories (name)
        supabase
          .from('categories')
          .select('id, name, slug, icon')
          .eq('is_active', true)
          .or(buildOrFilter(terms, ['name']))
          .limit(5),
      ])

      return {
        shops: shopsRes.data || [],
        products: productsRes.data || [],
        categories: categoriesRes.data || [],
      }
    },
    enabled: !!query?.trim(),
    staleTime: 1000 * 30, // 30 seconds
  })
}

/* ── Owner's shops ── */
export function useMyShops() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-shops', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('shops')
        .select(SHOP_FIELDS)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

/* ── Create shop ── */
export function useCreateShop() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (shopData) => {
      const { data, error } = await supabase.from('shops')
        .insert({ ...shopData, owner_id: user.id, status: 'pending_approval', is_active: true })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-shops'] })
      qc.invalidateQueries({ queryKey: ['shops'] })
      qc.invalidateQueries({ queryKey: ['pending-shops-count'] })
    },
  })
}

/* ── Update shop ── */
export function useUpdateShop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase.from('shops')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['shop', data.id] })
      qc.invalidateQueries({ queryKey: ['my-shops'] })
    },
  })
}

/* ── Reviews ── */
export function useReviews(shopId) {
  return useQuery({
    queryKey: ['reviews', shopId],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews')
        .select('*, profiles(full_name,avatar_url)')
        .eq('shop_id', shopId).eq('is_visible', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!shopId,
  })
}

export function useAddReview() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ shopId, rating, comment }) => {
      const { data, error } = await supabase.from('reviews')
        .upsert({ shop_id: shopId, user_id: user.id, rating, comment }, { onConflict: 'shop_id,user_id' })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: ['reviews', shopId] })
      qc.invalidateQueries({ queryKey: ['shop', shopId] })
    },
  })
}

/* ── Favorites ── */
export function useFavorites() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('favorites')
        .select('*, shops(*,categories(name,icon,slug))')
        .eq('user_id', user.id)
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ shopId, isFav }) => {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('shop_id', shopId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: user.id, shop_id: shopId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })
}

/* ── Admin ── */
export function useAdminShops(filter = 'all') {
  return useQuery({
    queryKey: ['admin-shops', filter],
    queryFn: async () => {
      let q = supabase.from('shops').select(SHOP_FIELDS).order('created_at', { ascending: false })
      if (filter === 'pending')  q = q.eq('status', 'pending_approval')
      if (filter === 'approved') q = q.eq('status', 'approved')
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
  })
}

export function useApproveShop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, approve, shopName, rejectionReason }) => {
      const newStatus = approve ? 'approved' : 'rejected'
      const updates = { status: newStatus }
      if (!approve && rejectionReason) updates.rejection_reason = rejectionReason
      const { error } = await supabase.from('shops').update(updates).eq('id', id)
      if (error) throw error
      logAudit({
        action: approve ? 'shop_approved' : 'shop_rejected',
        entityType: 'shop',
        entityId: id,
        entityName: shopName,
        details: { status: newStatus, rejection_reason: rejectionReason || null },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
      qc.invalidateQueries({ queryKey: ['pending-shops-count'] })
      qc.invalidateQueries({ queryKey: ['shops'] })
      qc.invalidateQueries({ queryKey: ['market-stats'] })
    },
  })
}

export function useToggleFeatured() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, featured }) => {
      const { error } = await supabase.from('shops').update({ is_featured: featured }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shops'] }),
  })
}

export function useUpdateFeaturedMeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, featured_priority, featured_until }) => {
      const { error } = await supabase
        .from('shops')
        .update({ featured_priority: featured_priority ?? 0, featured_until: featured_until || null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
      qc.invalidateQueries({ queryKey: ['featured-shops'] })
    },
  })
}

export function useUpdateShopPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, plan, plan_expires_at }) => {
      const updates = { plan }
      updates.plan_expires_at = plan === 'free' ? null : (plan_expires_at || null)
      const { error } = await supabase.from('shops').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
      qc.invalidateQueries({ queryKey: ['my-shops'] })
    },
  })
}

export function useToggleVerified() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, verified }) => {
      const { error } = await supabase.from('shops').update({ is_verified: verified }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
      qc.invalidateQueries({ queryKey: ['shops'] })
    },
  })
}

export function useDeleteShop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // Delete child records first so nothing is orphaned (products tab stays clean)
      await supabase.from('products').delete().eq('shop_id', id)
      await supabase.from('favorites').delete().eq('shop_id', id)
      await supabase.from('reviews').delete().eq('shop_id', id)
      await supabase.from('shop_images').delete().eq('shop_id', id)
      const { error } = await supabase.from('shops').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
      qc.invalidateQueries({ queryKey: ['my-shops'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['my-products'] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })
}
