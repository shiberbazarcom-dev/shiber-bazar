import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const GREEN = '#2563EB'

function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const [shops, users, orders, categories, recentOrders, recentShops] = await Promise.all([
        supabase.from('shops').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),

        // Recent orders
        supabase.from('orders')
          .select('order_number, customer_name, status, created_at, product_name')
          .order('created_at', { ascending: false })
          .limit(8),

        // Recent approved shops
        supabase.from('shops')
          .select('shop_name, status, created_at, categories(name, icon)')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      // Orders by status
      const statusCounts = await Promise.all(
        ['pending','forwarded','accepted','rejected','delivered'].map(s =>
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', s)
        )
      )

      // Approved vs pending shops
      const [approvedShops, pendingShops] = await Promise.all([
        supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
      ])

      // Users by role
      const roleCounts = await Promise.all(
        ['user','shop_owner','market_manager','super_admin'].map(r =>
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', r)
        )
      )

      return {
        totals: {
          shops:      shops.count || 0,
          users:      users.count || 0,
          orders:     orders.count || 0,
          categories: categories.count || 0,
        },
        orders: {
          pending:   statusCounts[0].count || 0,
          forwarded: statusCounts[1].count || 0,
          accepted:  statusCounts[2].count || 0,
          rejected:  statusCounts[3].count || 0,
          delivered: statusCounts[4].count || 0,
        },
        shops: {
          approved: approvedShops.count || 0,
          pending:  pendingShops.count  || 0,
        },
        roles: {
          user:          roleCounts[0].count || 0,
          shop_owner:    roleCounts[1].count || 0,
          market_manager:roleCounts[2].count || 0,
          super_admin:   roleCounts[3].count || 0,
        },
        recentOrders: recentOrders.data || [],
        recentShops:  recentShops.data  || [],
      }
    },
    refetchInterval: 60_000, // auto-refresh every minute
  })
}

const ORDER_STATUS_COLORS = {
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ অপেক্ষমান' },
  forwarded: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: '📤 ফরওয়ার্ড' },
  accepted:  { bg: 'bg-green-100',  text: 'text-green-700',  label: '✅ গ্রহণ' },
  rejected:  { bg: 'bg-red-100',    text: 'text-red-700',    label: '❌ বাতিল' },
  delivered: { bg: 'bg-purple-100', text: 'text-purple-700', label: '🎉 ডেলিভারি' },
}

function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'from-blue-500 to-blue-600',
    green:  'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

function BarChart({ data, max, colorClass }) {
  return (
    <div className="space-y-2.5">
      {data.map(({ label, value, icon }) => (
        <div key={label} className="flex items-center gap-3 text-sm">
          <span className="w-28 text-gray-500 text-xs flex-shrink-0">{icon} {label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${colorClass}`}
              style={{ width: max ? `${(value / max) * 100}%` : '0%' }}
            />
          </div>
          <span className="w-8 text-right font-bold text-gray-700 text-xs">{value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { data, isLoading, refetch } = useAnalytics()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  const orderTotal = Object.values(data.orders).reduce((a, b) => a + b, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📈 অ্যানালিটিক্স</h1>
          <p className="text-sm text-gray-400 mt-0.5">সাইটের সামগ্রিক পরিসংখ্যান</p>
        </div>
        <button onClick={() => refetch()}
          className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          🔄 রিফ্রেশ
        </button>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon="🏪" label="মোট দোকান"       value={data.totals.shops}      sub={`${data.shops.approved} অনুমোদিত`} color="blue" />
        <StatCard icon="👥" label="মোট ব্যবহারকারী" value={data.totals.users}      sub={`${data.roles.shop_owner} দোকানদার`}    color="green" />
        <StatCard icon="📦" label="মোট অর্ডার"      value={data.totals.orders}     sub={`${data.orders.pending} অপেক্ষমান`}     color="purple" />
        <StatCard icon="📋" label="বিভাগ"           value={data.totals.categories} sub="সক্রিয় বিভাগ"                          color="orange" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Orders by status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-700 mb-4">📦 অর্ডারের অবস্থা</h3>
          <BarChart
            max={orderTotal || 1}
            colorClass="bg-blue-500"
            data={[
              { icon: '⏳', label: 'অপেক্ষমান',  value: data.orders.pending   },
              { icon: '📤', label: 'ফরওয়ার্ড',    value: data.orders.forwarded },
              { icon: '✅', label: 'গ্রহণ',       value: data.orders.accepted  },
              { icon: '🎉', label: 'ডেলিভারি',    value: data.orders.delivered },
              { icon: '❌', label: 'বাতিল',       value: data.orders.rejected  },
            ]}
          />
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
            <span>মোট অর্ডার</span>
            <span className="font-bold text-gray-700">{orderTotal}</span>
          </div>
        </div>

        {/* Shops */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-700 mb-4">🏪 দোকানের অবস্থা</h3>
          <BarChart
            max={data.totals.shops || 1}
            colorClass="bg-green-500"
            data={[
              { icon: '✅', label: 'অনুমোদিত',  value: data.shops.approved },
              { icon: '⏳', label: 'অপেক্ষমান', value: data.shops.pending  },
            ]}
          />
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">অনুমোদনের হার</span>
              <span className="font-bold text-green-600">
                {data.totals.shops
                  ? Math.round((data.shops.approved / data.totals.shops) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Users by role */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-700 mb-4">👥 ব্যবহারকারীর ভূমিকা</h3>
          <BarChart
            max={data.totals.users || 1}
            colorClass="bg-purple-500"
            data={[
              { icon: '🛒', label: 'কাস্টমার',       value: data.roles.user           },
              { icon: '🏪', label: 'দোকানদার',        value: data.roles.shop_owner     },
              { icon: '🟠', label: 'Market Mgr',      value: data.roles.market_manager },
              { icon: '🔴', label: 'Super Admin',      value: data.roles.super_admin    },
            ]}
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-700 mb-4">🕐 সাম্প্রতিক অর্ডার</h3>
          {data.recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">কোনো অর্ডার নেই</p>
          ) : (
            <div className="space-y-2">
              {data.recentOrders.map(order => {
                const s = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending
                return (
                  <div key={order.order_number} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{order.order_number}</p>
                      <p className="text-xs text-gray-400">{order.customer_name} · {order.product_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent shops */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-700 mb-4">🆕 নতুন দোকান</h3>
          {data.recentShops.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">কোনো দোকান নেই</p>
          ) : (
            <div className="space-y-2">
              {data.recentShops.map((shop, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{shop.categories?.icon || '🏪'}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{shop.shop_name}</p>
                      <p className="text-xs text-gray-400">{shop.categories?.name || 'অন্যান্য'}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    shop.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {shop.status === 'approved' ? '✅ অনুমোদিত' : '⏳ অপেক্ষমান'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
