import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Store, Package, ShoppingCart, TrendingUp,
  Plus, ArrowRight, Clock, CheckCircle, XCircle,
} from 'lucide-react'

// @ts-ignore
const useAuthHook = useAuth

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
  pending_approval: { label: 'Pending',   variant: 'warning' },
  approved:         { label: 'Approved',  variant: 'success' },
  rejected:         { label: 'Rejected',  variant: 'destructive' },
  suspended:        { label: 'Suspended', variant: 'secondary' },
}

async function fetchOwnerStats(userId: string) {
  // 1. own shops
  const { data: shops } = await supabase
    .from('shops')
    .select('id, shop_name, status, logo, categories(name)')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  const shopIds = (shops ?? []).map((s: any) => s.id)

  // 2. orders + products for own shops
  const [ordersRes, productsRes] = await Promise.all([
    shopIds.length
      ? supabase.from('orders').select('id, status, total_amount, customer_name, order_number, created_at, shops(shop_name)').in('shop_id', shopIds).order('created_at', { ascending: false })
      : { data: [] },
    shopIds.length
      ? supabase.from('products').select('id', { count: 'exact' }).in('shop_id', shopIds)
      : { count: 0 },
  ])

  const orders = (ordersRes.data ?? []) as any[]
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum: number, o: any) => sum + (o.total_amount ?? 0), 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length

  return {
    shops: shops ?? [],
    totalOrders: orders.length,
    pendingOrders,
    totalRevenue,
    recentOrders: orders.slice(0, 5),
    totalProducts: productsRes.count ?? 0,
  }
}

function StatCard({ icon: Icon, label, value, sub, color, to }: {
  icon: any; label: string; value: string | number; sub?: string; color: string; to?: string
}) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function DashboardOverview() {
  const { user, profile, role } = useAuthHook()
  const isOwner = ['shop_owner', 'super_admin', 'market_manager'].includes(role)

  const { data, isLoading } = useQuery({
    queryKey: ['owner-stats', user?.id],
    queryFn: () => fetchOwnerStats(user!.id),
    enabled: !!user,
    refetchInterval: 30_000,
  })

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1,2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    </div>
  )

  const d = data!

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            স্বাগতম, {profile?.full_name?.split(' ')[0] || 'ব্যবহারকারী'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
        </div>
        {isOwner && (
          <Link to="/dashboard/add-shop">
            <Button size="sm"><Plus className="h-4 w-4" /> নতুন দোকান</Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Store}        label="আমার দোকান"    value={d.shops.length}  color="bg-blue-600"   to="/dashboard/shops" />
        <StatCard icon={Package}      label="মোট পণ্য"      value={d.totalProducts} color="bg-purple-600" to="/dashboard/products" />
        <StatCard icon={ShoppingCart} label="মোট অর্ডার"   value={d.totalOrders}   sub={d.pendingOrders ? `${d.pendingOrders} pending` : undefined} color="bg-orange-500" to="/dashboard/orders" />
        <StatCard icon={TrendingUp}   label="মোট রাজস্ব"   value={`৳${d.totalRevenue.toLocaleString()}`} color="bg-green-600" />
      </div>

      {/* Pending orders alert */}
      {d.pendingOrders > 0 && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">{d.pendingOrders}টি নতুন অর্ডার অপেক্ষা করছে!</p>
              <p className="text-xs text-amber-600">Accept বা Reject করুন</p>
            </div>
          </div>
          <Link to="/dashboard/orders">
            <Button size="sm" variant="warning">দেখুন <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">📦 সাম্প্রতিক অর্ডার</CardTitle>
              <Link to="/dashboard/orders" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                সব দেখুন <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {d.recentOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">কোনো অর্ডার নেই</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {d.recentOrders.map((o: any) => {
                  const s = ORDER_STATUS[o.status] ?? { label: o.status, variant: 'secondary' }
                  return (
                    <div key={o.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{o.customer_name}</p>
                        <p className="text-xs text-gray-400">{o.order_number}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-sm font-semibold text-gray-700">৳{(o.total_amount ?? 0).toLocaleString()}</span>
                        <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Shops */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">🏪 আমার দোকান</CardTitle>
              <Link to="/dashboard/shops" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                সব দেখুন <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {d.shops.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Store className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm mb-3">কোনো দোকান নেই</p>
                <Link to="/dashboard/add-shop">
                  <Button size="sm"><Plus className="h-4 w-4" /> দোকান যোগ করুন</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {d.shops.slice(0, 5).map((shop: any) => {
                  const st = SHOP_STATUS[shop.status] ?? { label: shop.status, variant: 'secondary' }
                  return (
                    <div key={shop.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {(shop.logo || shop.logo_url)
                          ? <img src={shop.logo || shop.logo_url} alt="" className="w-full h-full object-cover" />
                          : <Store className="h-4 w-4 text-blue-400" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{shop.shop_name}</p>
                        <p className="text-xs text-gray-400">{shop.categories?.name}</p>
                      </div>
                      <Badge variant={st.variant} className="text-xs flex-shrink-0">{st.label}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile summary */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                : (profile?.full_name || 'U')[0].toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{profile?.full_name || 'নাম নেই'}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="info" className="text-xs">{profile?.phone || 'ফোন নেই'}</Badge>
                <Badge variant="success" className="text-xs capitalize">{role?.replace('_', ' ')}</Badge>
              </div>
            </div>
            <Link to="/dashboard/profile">
              <Button variant="outline" size="sm">✏️ সম্পাদনা</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
