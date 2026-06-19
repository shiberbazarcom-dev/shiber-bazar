import { useState } from 'react'
import { useShopOrders, useUpdateOrderStatus } from '../../hooks/useOrders'
import toast from 'react-hot-toast'

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
  forwarded: '📤 ফরওয়ার্ড',
  accepted:  '✅ গ্রহণ',
  rejected:  '❌ বাতিল',
  delivered: '🎉 ডেলিভারি',
}

// 'pending' orders are not shown to shop owners — admin forwards them first
const FILTERS = ['forwarded', 'accepted', 'delivered', 'rejected']
const FILTER_LABELS = { ...STATUS_LABELS }

export default function ShopOrders() {
  const [filter, setFilter] = useState('forwarded')
  const { data: allOrders = [], isLoading, refetch } = useShopOrders()

  // Shop owners only see orders that admin has forwarded (not raw pending)
  const orders = allOrders.filter(o => o.status !== 'pending')
  const updateStatus = useUpdateOrderStatus()

  const filtered = orders.filter(o => o.status === filter)

  const handle = async (id, status) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      const msgs = {
        accepted:  'অর্ডার গ্রহণ করা হয়েছে ✅',
        rejected:  'অর্ডার বাতিল করা হয়েছে',
        delivered: 'ডেলিভারি সম্পন্ন হয়েছে 🎉',
      }
      toast.success(msgs[status] || 'আপডেট হয়েছে')
    } catch {
      toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন')
    }
  }

  const callCustomer = (phone) => {
    window.location.href = `tel:${phone}`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🧾 আমার অর্ডার</h1>
          <p className="text-sm text-gray-400 mt-0.5">মোট {orders.length} টি অর্ডার (admin forwarded)</p>
        </div>
        <button onClick={() => refetch()}
          className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          🔄 রিফ্রেশ
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
            style={filter === s ? { background: GREEN } : {}}>
            {FILTER_LABELS[s]}
            <span className="ml-1.5 text-[10px] opacity-80">
              ({orders.filter(o => o.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-gray-500 mb-1">কোনো অর্ডার নেই</p>
          <p className="text-sm text-gray-400">
            {filter === 'forwarded'
              ? 'Admin এখনো কোনো অর্ডার আপনার দোকানে forward করেননি'
              : 'এই ক্যাটাগরিতে কোনো অর্ডার নেই'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm">{order.order_number}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || ''}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('bn-BD', {
                    day: 'numeric', month: 'short',
                  })}
                </span>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {/* Customer */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">কাস্টমার</p>
                    <p className="font-semibold text-gray-800">👤 {order.customer_name}</p>
                    <p className="text-gray-600">📞 {order.customer_phone}</p>
                    <p className="text-gray-500 text-xs">📍 {order.customer_address}</p>
                  </div>

                  {/* Product */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">পণ্য</p>
                    <p className="font-semibold text-gray-800">🛒 {order.product_name}</p>
                    <p className="text-gray-600">পরিমাণ: {order.quantity}</p>
                    {order.notes && (
                      <p className="text-gray-500 text-xs">📝 {order.notes}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {(order.status === 'forwarded' || order.status === 'accepted') && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
                  {order.status === 'forwarded' && (
                    <>
                      <button
                        onClick={() => handle(order.id, 'accepted')}
                        disabled={updateStatus.isPending}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60">
                        ✅ গ্রহণ করুন
                      </button>
                      <button
                        onClick={() => handle(order.id, 'rejected')}
                        disabled={updateStatus.isPending}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold border border-red-200 transition-colors disabled:opacity-60">
                        ❌ বাতিল করুন
                      </button>
                    </>
                  )}
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => handle(order.id, 'delivered')}
                      disabled={updateStatus.isPending}
                      className="flex-1 sm:flex-none px-4 py-2 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
                      style={{ background: GREEN }}>
                      🚚 ডেলিভারি সম্পন্ন
                    </button>
                  )}
                  <button
                    onClick={() => callCustomer(order.customer_phone)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                    📞 কল করুন
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
