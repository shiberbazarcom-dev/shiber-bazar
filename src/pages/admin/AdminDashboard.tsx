import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Store, ShoppingCart, Users, Package, TrendingUp,
  Clock, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'

// ── Analytics fetch ──────────────────────────────────────────
async function fetchDashboardStats() {
  const [shops, orders, users, products, recentOrders, recentShops] = await Promise.all([
    supabase.from('shops').select('status', { count: 'exact' }),
    supabase.from('orders').select('status, total_amount', { count: 'exact' }),
    supabase.from('profiles').select('role', { count: 'exact' }),
    supabase.from('products').select('id', { count: 'exact' }),
    supabase.from('orders').select('order_number, customer_name, customer_phone, total_amount, status, created_at, shops(shop_name)').order('created_at', { ascending: false }).limit(6),
    supabase.from('shops').select('id, shop_name, status, profiles(full_name), created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const orderRows = orders.data ?? []
  const totalRevenue = orderRows
    .filter((o: any) => o.status === 'delivered')
    .reduce((acc: number, o: any) => acc + (o.total_amount ?? 0), 0)

  const orderStatusCounts = orderRows.reduce((acc: Record<string, number>, o: any) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const shopStatusCounts = (shops.data ?? []).reduce((acc: Record<string, number>, s: any) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {})

  return {
    totalShops:    shops.count ?? 0,
    totalOrders:   orders.count ?? 0,
    totalUsers:    users.count ?? 0,
    totalProducts: products.count ?? 0,
    totalRevenue,
    orderStatusCounts,
    shopStatusCounts,
    recentOrders: recentOrders.data ?? [],
    recentShops:  recentShops.data ?? [],
  }
}

// ── Status colour helpers ─────────────────────────────────────
const ORDER_STATUS: Record<string, { label: string; variant: any }> = {
  pending:    { label: 'Pending',    variant: 'warning' },
  confirmed:  { label: 'Confirmed',  variant: 'info' },
  processing: { label: 'Processing', variant: 'info' },
  shipped:    { label: 'Shipped',    variant: 'purple' },
  delivered:  { label: 'Delivered',  variant: 'success' },
  cancelled:  { label: 'Cancelled',  variant: 'destructive' },
  rejected:   { label: 'Rejected',   variant: 'destructive' },
}

const SHOP_STATUS: Record<string, { label: string; variant: any }> = {
  pending_approval: { label: 'Pending', variant: 'warning' },
  approved:         { label: 'Approved', variant: 'success' },
  rejected:         { label: 'Rejected', variant: 'destructive' },
  suspended:        { label: 'Suspended', variant: 'secondary' },
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: fetchDashboardStats, refetchInterval: 60_000 })

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )

  const d = data!
  const pendingShops = d.shopStatusCounts['pending_approval'] ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">শিবের বাজার – সামগ্রিক পরিসংখ্যান</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Store}        label="মোট দোকান"     value={d.totalShops}    sub={pendingShops ? `${pendingShops} pending` : undefined} color="bg-blue-600" />
        <StatCard icon={ShoppingCart} label="মোট অর্ডার"    value={d.totalOrders}   sub={`${d.orderStatusCounts['pending'] ?? 0} pending`}    color="bg-orange-500" />
        <StatCard icon={Users}        label="মোট ব্যবহারকারী" value={d.totalUsers}  color="bg-purple-600" />
        <StatCard icon={Package}      label="মোট পণ্য"      value={d.totalProducts} color="bg-green-600" />
      </div>

      {/* Revenue + Order status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-green-600" /> Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">৳{d.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Delivered orders only</p>
            {/* Mini bar chart */}
            <div className="mt-4 space-y-2">
              {[
                { key: 'delivered', label: 'Delivered', color: 'bg-green-500' },
                { key: 'pending',   label: 'Pending',   color: 'bg-amber-400' },
                { key: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
              ].map(({ key, label, color }) => {
                const count = d.orderStatusCounts[key] ?? 0
                const pct = d.totalOrders ? Math.round((count / d.totalOrders) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{label}</span><span>{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order status cards */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(ORDER_STATUS).map(([status, { label, variant }]) => (
                <div key={status} className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xl font-bold text-gray-800">{d.orderStatusCounts[status] ?? 0}</p>
                  <Badge variant={variant} className="mt-1 text-xs">{label}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {d.recentOrders.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
              )}
              {d.recentOrders.map((o: any) => {
                const s = ORDER_STATUS[o.status] ?? { label: o.status, variant: 'secondary' }
                return (
                  <div key={o.id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{o.customer_name}</p>
                      <p className="text-xs text-gray-400">{o.order_number} · {(o.shops as any)?.shop_name}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-sm font-semibold text-gray-700">৳{(o.total_amount ?? 0).toLocaleString()}</span>
                      <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Shops */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" /> Recent Shops</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {d.recentShops.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No shops yet</p>
              )}
              {d.recentShops.map((s: any) => {
                const st = SHOP_STATUS[s.status] ?? { label: s.status, variant: 'secondary' }
                return (
                  <div key={s.id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.shop_name}</p>
                      <p className="text-xs text-gray-400">{(s.profiles as any)?.full_name}</p>
                    </div>
                    <Badge variant={st.variant} className="text-xs flex-shrink-0">{st.label}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shop status breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Shop Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(SHOP_STATUS).map(([status, { label, variant }]) => (
              <div key={status} className="text-center p-4 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-2xl font-bold text-gray-800">{d.shopStatusCounts[status] ?? 0}</p>
                <Badge variant={variant} className="mt-1.5 text-xs">{label}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
