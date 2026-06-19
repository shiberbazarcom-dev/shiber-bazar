import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, MoreHorizontal, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
// @ts-ignore
import { useAuth } from '@/context/AuthContext'

type RoleFilter = 'all' | 'user' | 'shop_owner' | 'market_manager' | 'super_admin'

const ROLE_CONFIG: Record<string, { label: string; variant: any; icon: string }> = {
  user:           { label: 'Customer',       variant: 'info',      icon: '🛒' },
  shop_owner:     { label: 'Shop Owner',     variant: 'success',   icon: '🏪' },
  market_manager: { label: 'Market Manager', variant: 'warning',   icon: '🟠' },
  super_admin:    { label: 'Super Admin',    variant: 'destructive', icon: '🔴' },
}

const ROLES = ['user', 'shop_owner', 'market_manager', 'super_admin'] as const

function useUsers(roleFilter: RoleFilter) {
  return useQuery({
    queryKey: ['admin-users-full', roleFilter],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (roleFilter !== 'all') q = q.eq('role', roleFilter)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Profile[]
    },
  })
}

function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Profile> & { id: string }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users-full'] }),
  })
}

export default function ManageUsers() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const { user: currentUser, isSuperAdmin } = useAuth()

  const { data: users = [], isLoading } = useUsers(roleFilter)
  const update = useUpdateUser()

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.id) { toast.error('Cannot change your own role'); return }
    if (newRole === 'super_admin' && !isSuperAdmin) { toast.error('Only Super Admin can assign this role'); return }
    try {
      await update.mutateAsync({ id: userId, role: newRole as any })
      toast.success(`Role → ${ROLE_CONFIG[newRole]?.label}`)
    } catch { toast.error('Failed') }
  }

  const handleToggleActive = async (user: Profile) => {
    try {
      await update.mutateAsync({ id: user.id, is_active: !user.is_active })
      toast.success(user.is_active ? 'User deactivated' : 'User activated ✅')
    } catch { toast.error('Failed') }
  }

  const columns: ColumnDef<Profile>[] = [
    {
      accessorKey: 'full_name',
      header: 'User',
      cell: ({ row }) => {
        const u = row.original
        const isSelf = u.id === currentUser?.id
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {u.avatar_url
                ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                : (u.full_name || '?')[0].toUpperCase()
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-gray-900 text-sm truncate">{u.full_name || 'No name'}</p>
                {isSelf && <span className="text-xs text-purple-600">(You)</span>}
              </div>
              <p className="text-xs text-gray-400">{u.phone || 'No phone'}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const r = ROLE_CONFIG[row.original.role] ?? ROLE_CONFIG.user
        return (
          <Badge variant={r.variant} className="gap-1">
            {r.icon} {r.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">{new Date(row.original.created_at).toLocaleDateString('bn-BD')}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const u = row.original
        const isSelf = u.id === currentUser?.id
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Role change */}
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-400">Change Role</div>
              {ROLES.map(role => (
                <DropdownMenuItem
                  key={role}
                  disabled={isSelf || (role === 'super_admin' && !isSuperAdmin) || u.role === role}
                  onClick={() => handleRoleChange(u.id, role)}
                  className={u.role === role ? 'bg-purple-50 text-purple-700' : ''}
                >
                  {ROLE_CONFIG[role].icon} {ROLE_CONFIG[role].label}
                  {u.role === role && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isSelf}
                className={u.is_active ? 'text-orange-600' : 'text-green-600'}
                onClick={() => handleToggleActive(u)}
              >
                {u.is_active ? '⏸ Deactivate' : '▶ Activate'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Role counts
  const counts = ROLES.reduce((acc, r) => { acc[r] = users.filter(u => u.role === r).length; return acc }, {} as Record<string, number>)
  const totalAll = users.length

  const tabs = [
    { value: 'all', label: `All (${totalAll})` },
    ...ROLES.map(r => ({ value: r, label: `${ROLE_CONFIG[r].icon} ${ROLE_CONFIG[r].label} (${counts[r] ?? 0})` })),
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="h-6 w-6" /> Manage Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage roles and access for all users</p>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map(role => {
          const r = ROLE_CONFIG[role]
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(f => f === role ? 'all' : role)}
              className={`rounded-xl border-2 p-4 text-left transition-all bg-white ${roleFilter === role ? 'border-purple-400' : 'border-transparent'}`}
            >
              <p className="text-2xl font-bold text-gray-900">{counts[role] ?? 0}</p>
              <Badge variant={r.variant} className="mt-1 text-xs">{r.icon} {r.label}</Badge>
            </button>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All</TabsTrigger>
          {ROLES.map(r => <TabsTrigger key={r} value={r}>{ROLE_CONFIG[r].icon} {ROLE_CONFIG[r].label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {isSuperAdmin && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          Super Admin role changes take effect immediately. Only assign to trusted users.
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchPlaceholder="Search by name or phone..."
      />
    </div>
  )
}
