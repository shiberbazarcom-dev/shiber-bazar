import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const QK_PUBLIC = ['jobs-public']
const QK_ALL    = ['jobs-all']

/* ── Public: active, open, non-expired jobs ── */
export function usePublicJobs({ category, search } = {}) {
  return useQuery({
    queryKey: [...QK_PUBLIC, category, search],
    queryFn: async () => {
      let q = supabase
        .from('job_listings')
        .select('*')
        .eq('is_active', true)
        .eq('status', 'open')
        .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().slice(0,10)}`)
        .order('is_featured', { ascending: false })
        .order('created_at',  { ascending: false })

      if (category && category !== 'all') q = q.eq('category', category)
      if (search) q = q.ilike('title', `%${search}%`)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })
}

/* ── Public: single job ── */
export function useJob(id) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

/* ── Admin: all jobs ── */
export function useAllJobs() {
  return useQuery({
    queryKey: QK_ALL,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

function invalidate(qc) {
  qc.invalidateQueries({ queryKey: QK_PUBLIC })
  qc.invalidateQueries({ queryKey: QK_ALL })
  qc.invalidateQueries({ queryKey: ['job'] })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from('job_listings').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('job_listings').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('job_listings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}
