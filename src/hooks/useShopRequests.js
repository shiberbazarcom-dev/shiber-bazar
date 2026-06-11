import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TABLE = 'shop_owner_requests'

/* ── Current user's own request(s) ── */
export function useMyShopRequest() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [TABLE, 'mine', user?.id],
    enabled:  !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data   // null if none
    },
  })
}

/* ── Submit a new shop opening request ── */
export function useSubmitShopRequest() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (formData) => {
      // Ensure location is never null (DB constraint)
      const payload = { location: '', ...formData, user_id: user.id, status: 'pending' }
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE, 'mine', user?.id] })
      qc.invalidateQueries({ queryKey: [TABLE, 'all'] })
    },
  })
}

/* ── Admin: all requests ── */
export function useAllShopRequests(status = 'all') {
  return useQuery({
    queryKey: [TABLE, 'all', status],
    queryFn: async () => {
      let q = supabase
        .from(TABLE)
        .select('*, profiles(full_name, email, role, avatar_url)')
        .order('created_at', { ascending: false })
      if (status !== 'all') q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
  })
}

/* ── Admin: update a request (approve / reject) ── */
export function useUpdateShopRequest() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, admin_note, user_id }) => {
      // 1. Update the request row
      const { data, error } = await supabase
        .from(TABLE)
        .update({ status, admin_note, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      // 2. If approved → promote user to shop_owner
      if (status === 'approved' && user_id) {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'shop_owner' })
          .eq('id', user_id)
        if (roleError) throw roleError
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}
