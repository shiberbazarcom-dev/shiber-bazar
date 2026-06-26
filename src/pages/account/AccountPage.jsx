import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTrackOrder } from '../../hooks/useOrders'

const GREEN = '#2563EB'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  forwarded: 'bg-blue-100 text-blue-700',
  accepted:  'bg-green-100 text-green-700',
  shipped:   'bg-indigo-100 text-indigo-700',
  rejected:  'bg-red-100 text-red-700',
  delivered: 'bg-purple-100 text-purple-700',
}
const STATUS_LABELS = {
  pending:   '⏳ অপেক্ষমান',
  forwarded: '📤 দোকানে পাঠানো',
  accepted:  '✅ গ্রহণ হয়েছে',
  shipped:   '🚚 শিপ হয়েছে',
  rejected:  '❌ বাতিল',
  delivered: '🎉 ডেলিভারি সম্পন্ন',
}

function OrderHistory({ profile }) {
  const phone = profile?.phone || ''
  const { data: orders = [], isLoading } = useTrackOrder(phone)

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
        <h3 className="font-bold text-gray-800">📦 আমার অর্ডার</h3>
        {orders.length > 0 && (
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
            {orders.length}টি
          </span>
        )}
      </div>

      {!phone && (
        <div className="px-5 py-8 text-center">
          <p className="text-gray-400 text-sm">প্রোফাইলে ফোন নম্বর যোগ করলে অর্ডার দেখা যাবে</p>
          <Link to="/dashboard/profile"
            className="inline-block mt-3 text-sm font-medium px-4 py-2 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50">
            ফোন নম্বর যোগ করুন →
          </Link>
        </div>
      )}

      {phone && isLoading && (
        <div className="py-8 text-center">
          <div className="w-6 h-6 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto" />
        </div>
      )}

      {phone && !isLoading && orders.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-3xl mb-2">🛒</p>
          <p className="text-gray-500 text-sm font-medium">এখনো কোনো অর্ডার নেই</p>
          <Link to="/shops"
            className="inline-block mt-3 text-sm font-medium px-4 py-2 rounded-xl text-white"
            style={{ background: GREEN }}>
            দোকান দেখুন
          </Link>
        </div>
      )}

      {orders.length > 0 && (
        <div className="divide-y divide-gray-50">
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50">
                <span className="text-lg">📦</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm">{order.order_number}</p>
                <p className="text-xs text-gray-400 truncate">
                  {order.product_name} × {order.quantity}
                  {order.shops?.shop_name ? ` · ${order.shops.shop_name}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
                {order.total_amount > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">৳{Number(order.total_amount).toLocaleString('bn-BD')}</p>
                )}
              </div>
            </div>
          ))}
          {orders.length > 0 && (
            <div className="px-4 py-3 bg-gray-50">
              <Link to={`/track-order?phone=${encodeURIComponent(phone)}`}
                className="block text-center text-sm font-medium" style={{ color: GREEN }}>
                সব অর্ডার দেখুন ({orders.length}টি) →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AccountPage() {
  const { user, profile, logout } = useAuth()

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-4">
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
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-100" />
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
            <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
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
            className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:border-blue-200 hover:shadow-sm transition-all">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xs font-medium text-gray-700">{label}</p>
          </Link>
        ))}
      </div>

      <OrderHistory profile={profile} />

      {/* Logout */}
      <button onClick={logout}
        className="w-full py-3 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
        🚪 লগ আউট
      </button>
    </div>
  )
}
