import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatDate, getAvatarUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

const ROLES = ['user', 'shop_owner', 'market_manager', 'super_admin']
const ROLE_LABELS = {
  user: 'ব্যবহারকারী',
  shop_owner: 'দোকানদার',
  market_manager: 'ম্যানেজার',
  super_admin: 'সুপার অ্যাডমিন',
}
const ROLE_VARIANTS = {
  user: 'gray',
  shop_owner: 'green',
  market_manager: 'blue',
  super_admin: 'red',
}

export default function ManageUsers() {
  const qc = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles')
        .select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  const updateRole = useMutation({
    mutationFn: async ({ id, role }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('ভূমিকা আপডেট হয়েছে')
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">👥 ব্যবহারকারী ব্যবস্থাপনা</h1>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="table-cell text-left">ব্যবহারকারী</th>
                  <th className="table-cell text-left hidden md:table-cell">ফোন</th>
                  <th className="table-cell text-center">ভূমিকা</th>
                  <th className="table-cell text-center">স্ট্যাটাস</th>
                  <th className="table-cell text-center hidden sm:table-cell">যোগদান</th>
                  <th className="table-cell text-center">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const avatar = user.avatar_url || getAvatarUrl(user.full_name || 'U', '94a3b8')
                  return (
                    <tr key={user.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            onError={e => { e.target.src = getAvatarUrl('U', '94a3b8') }} />
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{user.full_name || 'নামহীন'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell hidden md:table-cell text-slate-500">{user.phone || '—'}</td>
                      <td className="table-cell text-center">
                        <select
                          value={user.role}
                          onChange={e => updateRole.mutate({ id: user.id, role: e.target.value })}
                          className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      </td>
                      <td className="table-cell text-center">
                        <button onClick={() => toggleActive.mutate({ id: user.id, is_active: !user.is_active })}>
                          <Badge variant={user.is_active ? 'green' : 'red'} dot className="cursor-pointer">
                            {user.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </Badge>
                        </button>
                      </td>
                      <td className="table-cell text-center hidden sm:table-cell text-slate-400 text-xs">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="table-cell text-center">
                        <Button size="xs" variant="secondary"
                          onClick={() => toggleActive.mutate({ id: user.id, is_active: !user.is_active })}>
                          {user.is_active ? '🚫 নিষ্ক্রিয়' : '✅ সক্রিয়'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
