import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { ShoppingBag, Package, Users, Clock, CheckCircle, TrendingUp } from 'lucide-react'

export default function StaffDashboard() {
  const { staffSession } = useStaffAuth()
  const isManager = staffSession?.role === 'manager'
  const shopId = staffSession?.shop_id

  const { data: stats } = useQuery({
    queryKey: ['staff-stats', shopId],
    queryFn: async () => {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('id, status').eq('shop_id', shopId),
        supabase.from('products').select('id, is_active').eq('shop_id', shopId),
      ])
      const orders = ordersRes.data || []
      const products = productsRes.data || []
      return {
        totalOrders:   orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        processingOrders: orders.filter(o => ['confirmed','processing'].includes(o.status)).length,
        deliveredOrders: orders.filter(o => o.status === 'delivered').length,
        totalProducts: products.length,
        activeProducts: products.filter(p => p.is_active).length,
      }
    },
    enabled: !!shopId,
  })

  const { data: recentOrders = [] } = useQuery({
    queryKey: ['staff-recent-orders', shopId],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, status, total_amount, created_at')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    },
    enabled: !!shopId,
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'শুভ সকাল' : hour < 17 ? 'শুভ অপরাহ্ন' : 'শুভ সন্ধ্যা'

  const STATUS = {
    pending:    { label: 'অপেক্ষায়',   color: 'bg-yellow-100 text-yellow-700' },
    confirmed:  { label: 'নিশ্চিত',    color: 'bg-blue-100 text-blue-700' },
    processing: { label: 'প্রস্তুতি',  color: 'bg-indigo-100 text-indigo-700' },
    shipped:    { label: 'পাঠানো',     color: 'bg-purple-100 text-purple-700' },
    delivered:  { label: 'ডেলিভারি',   color: 'bg-green-100 text-green-700' },
    rejected:   { label: 'বাতিল',      color: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
        <p className="text-blue-100 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold mt-0.5">{staffSession?.name} 👋</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isManager ? 'bg-purple-400/30 text-purple-100' : 'bg-blue-400/30 text-blue-100'}`}>
            {isManager ? '👑 ম্যানেজার' : '🧑‍💼 স্টাফ'}
          </span>
          <span className="text-blue-200 text-xs">— {staffSession?.shop_name}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Clock className="h-5 w-5 text-yellow-500" />} label="অপেক্ষায়" value={stats?.pendingOrders ?? '—'} bg="bg-yellow-50" />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-blue-500" />} label="চলমান" value={stats?.processingOrders ?? '—'} bg="bg-blue-50" />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-green-500" />} label="ডেলিভারি" value={stats?.deliveredOrders ?? '—'} bg="bg-green-50" />
        <StatCard icon={<Package className="h-5 w-5 text-indigo-500" />} label="পণ্য" value={stats?.activeProducts ?? '—'} bg="bg-indigo-50" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">দ্রুত যান</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickLink to="/staff/orders" icon={<ShoppingBag className="h-5 w-5" />} label="অর্ডার দেখুন" desc="সব অর্ডার ও স্ট্যাটাস" color="bg-orange-50 text-orange-600 border-orange-100" />
          <QuickLink to="/staff/products" icon={<Package className="h-5 w-5" />} label="প্রোডাক্ট" desc="পণ্য যোগ ও পরিচালনা" color="bg-indigo-50 text-indigo-600 border-indigo-100" />
          {isManager && (
            <QuickLink to="/staff/team" icon={<Users className="h-5 w-5" />} label="টিম" desc="সকল স্টাফ দেখুন" color="bg-purple-50 text-purple-600 border-purple-100" />
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">সাম্প্রতিক অর্ডার</h2>
          <Link to="/staff/orders" className="text-xs text-blue-600 hover:underline">সব দেখুন →</Link>
        </div>
        <div className="bg-white rounded-xl border divide-y overflow-hidden">
          {recentOrders.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">কোনো অর্ডার নেই</p>
          )}
          {recentOrders.map(order => {
            const cfg = STATUS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <div key={order.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{order.customer_name}</p>
                  <p className="text-xs text-gray-400">{order.order_number}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-sm font-bold text-gray-700">৳{(order.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function StatCard({ icon, label, value, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4 space-y-2 border border-white`}>
      {icon}
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function QuickLink({ to, icon, label, desc, color }) {
  return (
    <Link to={to} className={`flex items-center gap-3 p-4 rounded-xl border ${color} hover:opacity-80 transition-opacity`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs opacity-70">{desc}</p>
      </div>
    </Link>
  )
}
