import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories')
        .select('*').eq('is_active', true).order('sort_order')
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useCategoryWithCount() {
  return useQuery({
    queryKey: ['categories-with-count'],
    queryFn: async () => {
      const { data: cats, error } = await supabase.from('categories')
        .select('*').eq('is_active', true).order('sort_order')
      if (error) throw error

      const counts = await Promise.all(
        (cats || []).map(async cat => {
          const { count } = await supabase.from('shops')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id).eq('status', 'approved')
          return { ...cat, shop_count: count || 0 }
        })
      )
      return counts
    },
  })
}

export function useCategory(slug) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories')
        .select('*').eq('slug', slug).single()
      if (error) throw error
      return data
    },
    enabled: !!slug,
  })
}

export function useUpsertCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cat) => {
      const { id, ...rest } = cat
      if (id) {
        const { error } = await supabase.from('categories').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert(rest)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['categories-with-count'] })
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
