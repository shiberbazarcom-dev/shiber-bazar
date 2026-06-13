import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { expandQuery, buildOrFilter } from '../lib/banglish'

/* ═══════════════════════════════════════════════════════
   স্থানীয় সেবাসমূহ (Local Services Directory)
   Independent module — does not touch shops/products/orders.
   Tables: local_service_categories, local_service_directory
   (named "local_*" to avoid clashing with the older services module)
═══════════════════════════════════════════════════════ */

/* ── Public: active categories ── */
export function useDirectoryCategories() {
  return useQuery({
    queryKey: ['sd-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_service_categories')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true })
      if (error) throw error
      return data || []
    },
  })
}

/* ── Public: single category by slug ── */
export function useDirectoryCategory(slug) {
  return useQuery({
    queryKey: ['sd-category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_service_categories')
        .select('*')
        .eq('slug', slug)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!slug,
  })
}

/* ── Entries of a category (public: active only; admin: all) ── */
export function useDirectoryEntries(categoryId, { includeInactive = false } = {}) {
  return useQuery({
    queryKey: ['sd-entries', categoryId, includeInactive],
    queryFn: async () => {
      let q = supabase
        .from('local_service_directory')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false })
      if (!includeInactive) q = q.eq('is_active', true)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
    enabled: !!categoryId,
  })
}

/* ── Admin: create / update entry ── */
export function useSaveDirectoryEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entry) => {
      const { id, ...fields } = entry
      if (id) {
        const { data, error } = await supabase
          .from('local_service_directory')
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data
      }
      const { data, error } = await supabase
        .from('local_service_directory')
        .insert(fields)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sd-entries'] }),
  })
}

/* ── Admin: delete entry ── */
export function useDeleteDirectoryEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('local_service_directory').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sd-entries'] }),
  })
}

/* ── Public: ALL active entries (for the সেবাসমূহ landing list) ── */
export function useAllDirectoryEntries() {
  return useQuery({
    queryKey: ['sd-entries-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('local_service_directory')
        .select('*, local_service_categories(id, name_bn, icon, slug, display_type)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

/* ── Public: search directory entries (Banglish-aware) ── */
export function useSearchDirectory(query) {
  return useQuery({
    queryKey: ['sd-search', query],
    queryFn: async () => {
      if (!query?.trim()) return []
      const terms = expandQuery(query)
      const orFilter = buildOrFilter(terms, ['full_name', 'phone_number', 'address', 'additional_info', 'description'])

      /* Entries matching name/phone/address/info */
      const { data: byFields, error } = await supabase
        .from('local_service_directory')
        .select('*, local_service_categories(name_bn, icon, slug)')
        .eq('is_active', true)
        .or(orFilter)
        .limit(40)
      if (error) throw error

      /* Entries whose CATEGORY name matches (e.g. "ডাক্তার" খুঁজলে সব ডাক্তার) */
      const catOr = terms.map(t => `name_bn.ilike.%${t}%`).join(',')
      const { data: cats } = await supabase
        .from('local_service_categories')
        .select('id')
        .eq('is_active', true)
        .or(catOr)
      let byCategory = []
      if (cats?.length) {
        const { data } = await supabase
          .from('local_service_directory')
          .select('*, local_service_categories(name_bn, icon, slug)')
          .eq('is_active', true)
          .in('category_id', cats.map(c => c.id))
          .limit(40)
        byCategory = data || []
      }

      /* Merge unique */
      const seen = new Set()
      return [...(byFields || []), ...byCategory].filter(e => {
        if (seen.has(e.id)) return false
        seen.add(e.id)
        return true
      })
    },
    enabled: !!query?.trim(),
  })
}

/* ── Search helper: matches name or phone ── */
export function entryMatches(entry, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return true
  const digits = q.replace(/[^0-9]/g, '')
  if ((entry.full_name || '').toLowerCase().includes(q)) return true
  if (digits && (entry.phone_number || '').replace(/[^0-9]/g, '').includes(digits)) return true
  return false
}
