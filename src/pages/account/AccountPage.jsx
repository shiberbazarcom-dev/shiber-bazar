import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTrackOrder } from '../../hooks/useOrders'
import { useState } from 'react'

const GREEN = 'var(--primary)'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  forwarded: 'bg-purple-100 text-purple-700',
  accepted:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  delivered: 'bg-purple-100 text-purple-700',
}
const STATUS_LABELS = {
  pending:   '⏳ অপেক্ষমান',
  forwarded: '📤 দোকানে পাঠানো',
  accepted:  '✅ গ্রহণ করা হয়েছে',
  rejected:  '❌ বাতিল',
  delivered: '🎉 ডেলিভারি সম্পন্ন',
}

export default function AccountPage() {
  const { user, profile, logout } = useAuth()
  const [phone, setPhone] = useState('')
  const [searched, setSearched] = useState('')
  const { data: orders = [], isLoading } = useTrackOrder(searched)

  const handleSearch = (e) => {
    e.preventDefault()
    if (phone.trim().length >= 10) setSearched(phone.trim())
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-3xl mx-auto mb-4">
            👤
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">লগইন করুন</h2>
          <p className="text-gray-400 text-sm mb-6">
            অ্যাকাউন্ট পেজ দেখতে লগইন করতে হবে
          </p>
          <Link to="/login"
            className="block w-full py-3 text-white font-semibold rounded-xl text-sm text-center"
            style={{ background: GREEN }}>
            লগইন করুন
          </Link>
          <Link to="/register" className="block mt-3 text-sm text-center" style={{ color: GREEN }}>
            নতুন অ্যাকাউন্ট তৈরি করুন
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-8 px-4 max-w-2xl">
      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
        <div className="flex items-center gap-4">
          {user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-100" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                 style={{ background: GREEN }}>
              {(profile?.full_name || user.email || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-800 text-lg leading-tight">
              {profile?.full_name || user.email?.split('@')[0] || 'ব্যবহারকারী'}
            </h2>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
            <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
              {profile?.role === 'shop_owner' ? '🏪 দোকানদার' : '🛒 কাস্টমার'}
            </span>
          </div>
          <Link to="/dashboard/profile"
            className="text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            সম্পাদনা
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: '🛒', label: 'অর্ডার করুন', to: '/order' },
          { icon: '📦', label: 'অর্ডার ট্র্যাক', to: '/track-order' },
          { icon: '❤️', label: 'পছন্দের দোকান', to: '/dashboard/favorites' },
          { icon: '🏪', label: 'দোকান খুঁজুন', to: '/shops' },
        ].map(({ icon, label, to }) => (
          <Link key={to} to={to}
            className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:border-purple-200 hover:shadow-sm transition-all">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xs font-medium text-gray-700">{label}</p>
          </Link>
        ))}
      </div>

      {/* Order tracker */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
        <h3 className="font-bold text-gray-800 mb-3">📦 অর্ডার খুঁজুন</h3>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="ফোন নম্বর দিয়ে খুঁজুন"
            type="tel"
            className="input flex-1"
          />
          <button type="submit" disabled={isLoading}
            className="px-4 py-2.5 text-white font-semibold rounded-xl text-sm disabled:opacity-60"
            style={{ background: GREEN }}>
            খুঁজুন
          </button>
        </form>

        {isLoading && (
          <div className="py-6 text-center">
            <div className="w-6 h-6 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!isLoading && searched && orders.length === 0 && (
          <p className="text-sm text-center text-gray-400 py-4">
            এই নম্বরে কোনো অর্ডার পাওয়া যায়নি
          </p>
        )}

        {orders.length > 0 && (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{order.order_number}</p>
                  <p className="text-xs text-gray-400">
                    {order.product_name} × {order.quantity}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || ''}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
            ))}
            <Link to={`/track-order?phone=${encodeURIComponent(searched)}`}
              className="block text-center text-xs mt-2 font-medium" style={{ color: GREEN }}>
              বিস্তারিত দেখুন →
            </Link>
          </div>
        )}
      </div>

      {/* Logout */}
      <button onClick={logout}
        className="w-full py-3 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
        🚪 লগ আউট
      </button>
    </div>
  )
}
