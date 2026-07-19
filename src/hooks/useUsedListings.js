import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { compressImage, validateFileSize } from '../lib/compressImage'

const QK_PUBLIC = ['used-public']
const QK_MINE   = ['used-mine']
const QK_ADMIN  = ['used-admin']

export const USED_CATEGORIES = [
  '📱 মোবাইল', '💻 কম্পিউটার/ল্যাপটপ', '📺 ইলেকট্রনিক্স', '🛋️ ফার্নিচার',
  '🏍️ বাইক/সাইকেল', '👕 পোশাক', '📚 বই', '⚽ খেলাধুলা',
  '🚜 কৃষি সরঞ্জাম', '🏠 গৃহস্থালি', '📦 অন্যান্য',
]

export const CONDITION_LABELS = {
  new:      'নতুন',
  like_new: 'প্রায় নতুন',
  used:     'ব্যবহৃত',
  parts:    'পার্টসের জন্য',
}

/* ── Public: approved listings with filters ── */
export function usePublicListings({ category, search, condition } = {}) {
  return useQuery({
    queryKey: [...QK_PUBLIC, category, search, condition],
    queryFn: async () => {
      let q = supabase
        .from('used_listings')
        .select('*')
        .in('status', ['approved', 'sold'])
        .order('created_at', { ascending: false })

      if (category && category !== 'all') q = q.eq('category', category)
      if (condition && condition !== 'all') q = q.eq('condition', condition)
      if (search) q = q.ilike('title', `%${search}%`)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })
}

/* ── Public: single listing (with seller name) ── */
export function useListing(id) {
  return useQuery({
    queryKey: ['used-listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('used_listings')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

/* ── Fire-and-forget view counter ── */
export function trackListingView(id) {
  supabase.rpc('increment_used_listing_views', { p_id: id }).then(() => {})
}

/* ── Seller: my listings ── */
export function useMyListings(userId) {
  return useQuery({
    queryKey: [...QK_MINE, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('used_listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })
}

/* ── Admin: all listings ── */
export function useAdminListings() {
  return useQuery({
    queryKey: QK_ADMIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('used_listings')
        .select('*, profiles:seller_id(full_name, phone)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

function invalidate(qc) {
  qc.invalidateQueries({ queryKey: QK_PUBLIC })
  qc.invalidateQueries({ queryKey: QK_MINE })
  qc.invalidateQueries({ queryKey: QK_ADMIN })
  qc.invalidateQueries({ queryKey: ['used-listing'] })
}

/* ── Upload listing images (compressed, shop-images bucket) ── */
export async function uploadListingImages(files, userId) {
  const urls = []
  for (const file of files) {
    const check = validateFileSize(file, 5)
    if (!check.ok) throw new Error(check.message)
    const compressed = await compressImage(file)
    const path = `used-listings/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const { error } = await supabase.storage.from('shop-images').upload(path, compressed, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(path)
    urls.push(publicUrl)
  }
  return urls
}

export function useCreateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('used_listings')
        .insert({ ...payload, status: 'pending' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('used_listings').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('used_listings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}
