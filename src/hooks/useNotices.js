import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/* ── Public: active, non-expired notices ── */
export function usePublicNotices() {
  return useQuery({
    queryKey: ['union-notices-public'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('union_notices')
        .select('*')
        .eq('is_active', true)
        .or(`expiry_date.is.null,expiry_date.gte.${today}`)
        .order('is_featured', { ascending: false })
        .order('publish_date',  { ascending: false })
      if (error) throw error
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })
}

/* ── Admin: all notices ── */
export function useAllNotices() {
  return useQuery({
    queryKey: ['union-notices-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('union_notices')
        .select('*')
        .order('publish_date', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

/* ── Admin: create ── */
export function useCreateNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('union_notices')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['union-notices-all'] })
      qc.invalidateQueries({ queryKey: ['union-notices-public'] })
    },
  })
}

/* ── Admin: update ── */
export function useUpdateNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('union_notices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['union-notices-all'] })
      qc.invalidateQueries({ queryKey: ['union-notices-public'] })
    },
  })
}

/* ── Admin: delete ── */
export function useDeleteNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('union_notices')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['union-notices-all'] })
      qc.invalidateQueries({ queryKey: ['union-notices-public'] })
    },
  })
}
