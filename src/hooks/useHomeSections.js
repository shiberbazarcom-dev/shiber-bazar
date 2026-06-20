import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const QK = ['homepage_sections']

export function useHomeSections() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })
}

export function useUpdateSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase
        .from('homepage_sections')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useReorderSections() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderedIds) => {
      // orderedIds: array of ids in new display order
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase
          .from('homepage_sections')
          .update({ display_order: (i + 1) * 10 })
          .eq('id', orderedIds[i])
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}
