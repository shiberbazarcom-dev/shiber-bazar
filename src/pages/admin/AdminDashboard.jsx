import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useApproveShop, useAdminShops } from '../../hooks/useShops'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl`}>{icon}</div>
        <span className="text-3xl font-bold text-slate-800 dark:text-white">{value}</span>
      </div>
      <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { data: pending = [] } = useAdminShops('pending')
  const approve = useApproveShop()

  const queryClient = useQueryClient()

  const { data: stats, dataUpdatedAt } = useQuery({
    queryKey: ['admin-full-stats'],
    queryFn: async () => {
      const [total, approved, users, cats, reviews, orders] = await Promise.all([
        supabase.from('shops').select('*', { count: 'exact', head: true }),
        supabase.from('shops').select('*', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ])
      return {
        total: total.count || 0,
        approved: approved.count || 0,
        pending: (total.count || 0) - (approved.count || 0),
        users: users.count || 0,
        categories: cats.count || 0,
        reviews: reviews.count || 0,
        orders: orders.count || 0,
      }
    },
    refetchInterval: 30_000, // auto-refresh every 30s
  })

  // Realtime: invalidate stats on new orders or shops
  useEffect(() => {
    const channel = supabase.channel('admin-dashboard-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-full-stats'] })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shops' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-full-stats'] })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shops' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-full-stats'] })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [queryClient])

  const handleApprove = async (id) => {
    await approve.mutateAsync({ id, approve: true })
    toast.success('দোকান অনুমোদন করা হয়েছে ✅')
  }
  const handleReject = async (id) => {
    if (!confirm('এই দোকানটি প্রত্যাখ্যান করবেন?')) return
    await approve.mutateAsync({ id, approve: false })
    toast.success('প্রত্যাখ্যান করা হয়েছে')
  }

  const statCards = [
    { icon: '🏪', label: 'মোট দোকান',    value: stats?.total || 0,      color: 'bg-blue-100 dark:bg-blue-900/30'   },
    { icon: '✅', label: 'অনুমোদিত',     value: stats?.approved || 0,   color: 'bg-green-100 dark:bg-green-900/30' },
    { icon: '⏳', label: 'অপেক্ষমান',    value: stats?.pending || 0,    color: 'bg-amber-100 dark:bg-amber-900/30' },
    { icon: '📦', label: 'মোট অর্ডার',   value: stats?.orders || 0,     color: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { icon: '👥', label: 'ব্যবহারকারী',  value: stats?.users || 0,      color: 'bg-purple-100 dark:bg-purple-900/30'},
    { icon: '⭐', label: 'রিভিউ',         value: stats?.reviews || 0,    color: 'bg-rose-100 dark:bg-rose-900/30'   },
  ]

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('bn-BD') : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">📊 অ্যাডমিন ড্যাশবোর্ড</h1>
          {lastUpdated && <p className="text-xs text-slate-400 mt-0.5">সর্বশেষ আপডেট: {lastUpdated} · প্রতি ৩০ সেকেন্ডে স্বয়ংক্রিয় রিফ্রেশ</p>}
        </div>
        <Badge variant="gold">শিবের বাজার অ্যাডমিন</Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Pending approvals */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50">
          <div>
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">⏳ অনুমোদনের অপেক্ষায়</h2>
            <p className="text-xs text-slate-400 mt-0.5">{pending.length} টি নতুন আবেদন</p>
          </div>
          <Link to="/admin/shops">
            <Button size="sm" variant="secondary">সব দেখুন</Button>
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-slate-400">সব দোকান যাচাই করা হয়েছে!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {pending.slice(0, 8).map(shop => (
              <div key={shop.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{shop.shop_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {shop.categories?.icon} {shop.categories?.name} •{' '}
                    {shop.phone || 'ফোন নেই'} •{' '}
                    {shop.address || 'ঠিকানা নেই'}
                  </p>
                  <p className="text-xs text-slate-400">মালিক: {shop.profiles?.full_name}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="xs" onClick={() => handleApprove(shop.id)} loading={approve.isPending}>✅ অনুমোদন</Button>
                  <Button size="xs" variant="danger" onClick={() => handleReject(shop.id)}>❌</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
