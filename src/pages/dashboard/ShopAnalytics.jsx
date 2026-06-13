import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMyShopIds, useShopOverviewStats, useDailyOrders, useTopProducts, useOrderStatusBreakdown } from '../../hooks/useAnalytics'

function StatCard({ icon, label, value, color = 'blue' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600' }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.dataKey === 'revenue' ? `৳${Number(p.value).toLocaleString('bn-BD')}` : p.value}
        </p>
      ))}
    </div>
  )
}

function StatusBreakdown({ data }) {
  if (!data?.length) return <p className="text-sm text-gray-400 text-center py-8">কোনো অর্ডার নেই</p>
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.status} className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
          <span className="text-sm text-gray-700 flex-1">{d.label}</span>
          <span className="text-sm font-semibold text-gray-900">{d.count}</span>
          <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-2 rounded-full" style={{ width: `${(d.count / total) * 100}%`, background: d.color }} />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">{Math.round((d.count / total) * 100)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function ShopAnalytics() {
  const [selectedShop, setSelectedShop] = useState('all')
  const [days, setDays] = useState(30)

  const { data: shops = [] }       = useMyShopIds()
  const shopId                      = selectedShop === 'all' ? null : selectedShop
  const { data: stats = {} }        = useShopOverviewStats(shopId)
  const { data: dailyData = [] }    = useDailyOrders(shopId, days)
  const { data: topProducts = [] }  = useTopProducts(shopId, 8)
  const { data: statusData = [] }   = useOrderStatusBreakdown(shopId)

  const labelInterval = days > 14 ? Math.ceil(days / 10) : 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📈 অ্যানালিটিক্স</h1>
          <p className="text-sm text-gray-500 mt-0.5">আপনার দোকানের পারফরম্যান্স</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={selectedShop} onChange={e => setSelectedShop(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">সব দোকান</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
          </select>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={7}>গত ৭ দিন</option>
            <option value={14}>গত ১৪ দিন</option>
            <option value={30}>গত ৩০ দিন</option>
            <option value={90}>গত ৯০ দিন</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📦" label="মোট অর্ডার"   color="blue"   value={stats.totalOrders?.toLocaleString('bn-BD') ?? '০'} />
        <StatCard icon="💰" label="মোট রাজস্ব"   color="green"  value={`৳${(stats.totalRevenue || 0).toLocaleString('bn-BD')}`} />
        <StatCard icon="👁️" label="পণ্য দেখেছে" color="purple" value={stats.totalProductViews?.toLocaleString('bn-BD') ?? '০'} />
        <StatCard icon="✅" label="সক্রিয় পণ্য"  color="amber"  value={stats.activeProducts?.toLocaleString('bn-BD') ?? '০'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">💰 দৈনিক রাজস্ব</h2>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={labelInterval - 1} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" name="রাজস্ব" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">এই সময়ে কোনো ডেটা নেই</div>}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">📦 দৈনিক অর্ডার</h2>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={labelInterval - 1} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={30} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" name="অর্ডার" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">এই সময়ে কোনো অর্ডার নেই</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">🔥 সর্বাধিক দেখা পণ্য</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">এখনো কোনো পণ্য দেখা হয়নি</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5 flex-shrink-0">{i + 1}</span>
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-base">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.shops?.shop_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-purple-600">{p.views} views</p>
                    {p.price && <p className="text-xs text-gray-400">৳{Number(p.price).toLocaleString('bn-BD')}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">📊 অর্ডার স্ট্যাটাস</h2>
          <StatusBreakdown data={statusData} />
        </div>
      </div>
    </div>
  )
}
