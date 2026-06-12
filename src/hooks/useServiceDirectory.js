import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

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

/* ── Search helper: matches name or phone ── */
export function entryMatches(entry, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return true
  const digits = q.replace(/[^0-9]/g, '')
  if ((entry.full_name || '').toLowerCase().includes(q)) return true
  if (digits && (entry.phone_number || '').replace(/[^0-9]/g, '').includes(digits)) return true
  return false
}
