import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const GREEN = 'var(--primary)'

const ROLES = [
  { value: 'user',           label: 'কাস্টমার',       icon: '🛒', color: 'bg-purple-100 text-purple-700' },
  { value: 'shop_owner',     label: 'দোকানদার',        icon: '🏪', color: 'bg-green-100 text-green-700' },
  { value: 'market_manager', label: 'Market Manager',  icon: '🟠', color: 'bg-orange-100 text-orange-700' },
  { value: 'super_admin',    label: 'Super Admin',      icon: '🔴', color: 'bg-red-100 text-red-700' },
]

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]))

function useAllUsers(search = '') {
  return useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('id, full_name, phone, role, is_active, created_at')
        .order('created_at', { ascending: false })
      if (search) {
        q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
  })
}

function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export default function ManageRoles() {
  const { user: currentUser, isSuperAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data: users = [], isLoading } = useAllUsers(search)
  const updateRole = useUpdateRole()

  const filtered = roleFilter ? users.filter(u => u.role === roleFilter) : users

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?.id) {
      toast.error('নিজের রোল পরিবর্তন করা যাবে না')
      return
    }
    if (newRole === 'super_admin' && !isSuperAdmin) {
      toast.error('শুধুমাত্র Super Admin অন্যকে Super Admin বানাতে পারেন')
      return
    }
    try {
      await updateRole.mutateAsync({ id: userId, role: newRole })
      toast.success(`রোল পরিবর্তন হয়েছে → ${ROLE_MAP[newRole]?.label}`)
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  // Count by role
  const counts = ROLES.reduce((acc, r) => {
    acc[r.value] = users.filter(u => u.role === r.value).length
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🛡️ Role ব্যবস্থাপনা</h1>
        <p className="text-sm text-gray-400 mt-0.5">ব্যবহারকারীদের ভূমিকা পরিবর্তন করুন</p>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {ROLES.map(r => (
          <button key={r.value}
            onClick={() => setRoleFilter(f => f === r.value ? '' : r.value)}
            className={`rounded-xl p-4 text-left border-2 transition-all ${
              roleFilter === r.value ? 'border-purple-400 shadow-sm' : 'border-transparent'
            } bg-white`}>
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${r.color}`}>
              {r.icon} {r.label}
            </div>
            <p className="text-2xl font-bold text-gray-800">{counts[r.value] || 0}</p>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
          className="input flex-1"
        />
        {roleFilter && (
          <button onClick={() => setRoleFilter('')}
            className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100">
            ✕ ফিল্টার সরান
          </button>
        )}
      </div>

      {/* Users table */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-5xl mb-3">👥</p>
          <p className="text-gray-500">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_160px_200px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span>ব্যবহারকারী</span>
            <span>বর্তমান রোল</span>
            <span>রোল পরিবর্তন</span>
          </div>

          <div className="divide-y divide-gray-50">
            {filtered.map(user => {
              const roleInfo = ROLE_MAP[user.role] || ROLE_MAP.user
              const isSelf   = user.id === currentUser?.id

              return (
                <div key={user.id}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_160px_200px] gap-3 sm:gap-4 px-5 py-4 items-center ${
                    isSelf ? 'bg-purple-50/40' : 'hover:bg-gray-50'
                  }`}>

                  {/* User info */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                         style={{ background: GREEN }}>
                      {(user.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {user.full_name || 'নাম নেই'}
                        {isSelf && <span className="ml-1.5 text-xs text-purple-600">(আপনি)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{user.phone || 'ফোন নেই'}</p>
                    </div>
                  </div>

                  {/* Current role badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${roleInfo.color}`}>
                      {roleInfo.icon} {roleInfo.label}
                    </span>
                  </div>

                  {/* Role dropdown */}
                  <div>
                    {isSelf ? (
                      <span className="text-xs text-gray-400 italic">নিজের রোল পরিবর্তন করা যাবে না</span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        disabled={updateRole.isPending}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-300 cursor-pointer w-full sm:w-auto">
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>
                            {r.icon} {r.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>⚠️ সতর্কতা:</strong> রোল পরিবর্তন তাৎক্ষণিকভাবে কার্যকর হয়।
          Super Admin রোল শুধুমাত্র বিশ্বস্ত ব্যক্তিকে দিন।
          নিজের রোল পরিবর্তন করা যাবে না।
        </p>
      </div>
    </div>
  )
}
