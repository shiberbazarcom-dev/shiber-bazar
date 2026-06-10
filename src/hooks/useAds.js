import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/* ── Public: active ads only ── */
export function useActiveAds() {
  return useQuery({
    queryKey: ['ads-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data || []
    },
  })
}

/* ── Admin: all ads ── */
export function useAllAds() {
  return useQuery({
    queryKey: ['ads-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data || []
    },
  })
}

/* ── Admin: create ad ── */
export function useCreateAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (adData) => {
      const { data, error } = await supabase
        .from('advertisements')
        .insert(adData)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads-active'] })
      qc.invalidateQueries({ queryKey: ['ads-all'] })
    },
  })
}

/* ── Admin: update ad ── */
export function useUpdateAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('advertisements')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads-active'] })
      qc.invalidateQueries({ queryKey: ['ads-all'] })
    },
  })
}

/* ── Admin: delete ad ── */
export function useDeleteAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads-active'] })
      qc.invalidateQueries({ queryKey: ['ads-all'] })
    },
  })
}
