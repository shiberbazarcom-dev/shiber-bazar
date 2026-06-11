/**
 * useServices.js — React Query hooks for the Services module
 * All reads/writes go through Supabase.
 * Zero dependency on the existing shop / product tables.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/* ─────────────────────────────────────────────────────────────────
   QUERY KEYS
───────────────────────────────────────────────────────────────── */
const KEYS = {
  categories:    ['service-categories'],
  list:          (slug, q) => ['services', slug, q],
  detail:        (id) => ['service', id],
  mine:          ['my-services'],
  adminPending:  ['admin-services'],
}

/* ─────────────────────────────────────────────────────────────────
   PUBLIC — fetch all active categories
───────────────────────────────────────────────────────────────── */
export function useServiceCategories() {
  return useQuery({
    queryKey: KEYS.categories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 10, // 10 min — categories rarely change
  })
}

/* ─────────────────────────────────────────────────────────────────
   PUBLIC — list approved services (optionally filtered by category slug)
───────────────────────────────────────────────────────────────── */
export function useServices(categorySlug = null, searchQuery = '') {
  return useQuery({
    queryKey: KEYS.list(categorySlug, searchQuery),
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`
          *,
          service_categories ( id, name_bn, icon, slug )
        `)
        .eq('status', 'approved')
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })

      if (categorySlug) {
        // join via category slug
        const { data: cat } = await supabase
          .from('service_categories')
          .select('id')
          .eq('slug', categorySlug)
          .single()
        if (cat) query = query.eq('category_id', cat.id)
      }

      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
        )
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  })
}

/* ─────────────────────────────────────────────────────────────────
   PUBLIC — single service detail + increment view count
───────────────────────────────────────────────────────────────── */
export function useServiceDetail(id) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      // increment views (fire-and-forget, ignore error)
      supabase.rpc('increment_service_views', { service_id: id }).catch(() => {})

      const { data, error } = await supabase
        .from('services')
        .select(`*, service_categories ( id, name_bn, icon, slug )`)
        .eq('id', id)
        .eq('status', 'approved')
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

/* ─────────────────────────────────────────────────────────────────
   AUTHENTICATED — my own services (all statuses)
───────────────────────────────────────────────────────────────── */
export function useMyServices() {
  return useQuery({
    queryKey: KEYS.mine,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('services')
        .select(`*, service_categories ( id, name_bn, icon, slug )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

/* ─────────────────────────────────────────────────────────────────
   SUBMIT a new service listing
───────────────────────────────────────────────────────────────── */
export function useSubmitService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('লগইন করুন')
      const { data, error } = await supabase
        .from('services')
        .insert({ ...payload, user_id: user.id, status: 'pending' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.mine }),
  })
}

/* ─────────────────────────────────────────────────────────────────
   UPDATE own service listing
───────────────────────────────────────────────────────────────── */
export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase
        .from('services')
        .update({ ...updates, status: 'pending' }) // re-queue for approval after edit
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.mine }),
  })
}

/* ─────────────────────────────────────────────────────────────────
   DELETE own service listing
───────────────────────────────────────────────────────────────── */
export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.mine }),
  })
}

/* ─────────────────────────────────────────────────────────────────
   ADMIN — list all services (pending/approved/rejected)
───────────────────────────────────────────────────────────────── */
export function useAdminServices(statusFilter = 'pending') {
  return useQuery({
    queryKey: [...KEYS.adminPending, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`*, service_categories ( id, name_bn, icon, slug )`)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  })
}

/* ─────────────────────────────────────────────────────────────────
   PUBLIC — service provider profile (all approved services by user)
───────────────────────────────────────────────────────────────── */
export function useProviderProfile(userId) {
  return useQuery({
    queryKey: ['provider-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`*, service_categories ( id, name_bn, icon, slug )`)
        .eq('user_id', userId)
        .eq('status', 'approved')
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}

/* ─────────────────────────────────────────────────────────────────
   ADMIN — update service status (approve / reject / verify)
───────────────────────────────────────────────────────────────── */
export function useAdminUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, is_verified }) => {
      const updates = {}
      if (status     !== undefined) updates.status      = status
      if (is_verified !== undefined) updates.is_verified = is_verified
      const { error } = await supabase.from('services').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.adminPending })
      qc.invalidateQueries({ queryKey: ['services'] })
    },
  })
}
