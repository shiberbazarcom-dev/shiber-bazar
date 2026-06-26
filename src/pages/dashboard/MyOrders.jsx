import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTrackOrder } from '../../hooks/useOrders'

const BLUE = '#2563EB'

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

export default function MyOrders() {
  const { profile } = useAuth()
  const profilePhone = profile?.phone || ''

  const [manualPhone, setManualPhone] = useState('')
  const [searched, setSearched] = useState(profilePhone)
  const activePhone = searched

  const { data: orders = [], isLoading } = useTrackOrder(activePhone)

  function handleSearch(e) {
    e.preventDefault()
    if (manualPhone.trim().length >= 10) setSearched(manualPhone.trim())
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">📦 আমার অর্ডার</h1>
        <p className="text-sm text-gray-400 mt-0.5">আপনার সকল অর্ডারের তালিকা</p>
      </div>

      {/* Phone search — show if no profile phone */}
      {!profilePhone && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
          <p className="text-sm text-gray-600 font-medium mb-3">অর্ডারে দেওয়া ফোন নম্বর দিয়ে খুঁজুন</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={manualPhone}
              onChange={e => setManualPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              type="tel"
              className="input flex-1"
            />
            <button type="submit"
              className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl flex-shrink-0"
              style={{ background: BLUE }}>
              খুঁজুন
            </button>
          </form>
          <Link to="/dashboard/profile" className="inline-block mt-2 text-xs text-blue-500 hover:underline">
            প্রোফাইলে ফোন যোগ করুন (ভবিষ্যতে auto দেখাবে) →
          </Link>
        </div>
      )}

      {/* If profile has phone, show active search indicator */}
      {profilePhone && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400">
            {profilePhone} নম্বরের অর্ডার দেখা যাচ্ছে
          </p>
          <Link to="/track-order" className="text-xs font-medium" style={{ color: BLUE }}>
            অন্য নম্বরে খুঁজুন →
          </Link>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">অর্ডার লোড হচ্ছে...</p>
        </div>
      )}

      {/* No orders */}
      {!isLoading && activePhone && orders.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-dashed border-gray-200">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-semibold text-gray-700 mb-1">কোনো অর্ডার পাওয়া যায়নি</p>
          <p className="text-sm text-gray-400 mb-4">{activePhone} নম্বরে কোনো অর্ডার নেই</p>
          <Link to="/shops"
            className="inline-block px-5 py-2.5 text-white text-sm font-semibold rounded-xl"
            style={{ background: BLUE }}>
            দোকান দেখুন
          </Link>
        </div>
      )}

      {/* No phone entered yet */}
      {!isLoading && !activePhone && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-dashed border-gray-200">
          <p className="text-3xl mb-2">📱</p>
          <p className="text-sm text-gray-400">ফোন নম্বর দিয়ে আপনার অর্ডার খুঁজুন</p>
        </div>
      )}

      {/* Orders list */}
      {orders.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{orders.length}টি অর্ডার পাওয়া গেছে</p>
          {orders.map(order => (
            <div key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Order header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{order.order_number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('bn-BD', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              {/* Order details */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">পণ্য</span>
                  <span className="font-medium text-gray-800 text-right max-w-[60%]">{order.product_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">পরিমাণ</span>
                  <span className="font-medium text-gray-800">{order.quantity}টি</span>
                </div>
                {order.total_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">মোট</span>
                    <span className="font-bold text-gray-800">৳{Number(order.total_amount).toLocaleString('bn-BD')}</span>
                  </div>
                )}
                {order.shops?.shop_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">দোকান</span>
                    <span className="font-medium text-gray-800">{order.shops.shop_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
