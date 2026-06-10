import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTrackOrder } from '../hooks/useOrders'

const GREEN = '#2563EB'

const STATUS_MAP = {
  pending:   { label: '⏳ অপেক্ষমান',             bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200', step: 1 },
  forwarded: { label: '📤 দোকানে পাঠানো হয়েছে',  bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   step: 2 },
  accepted:  { label: '✅ দোকান গ্রহণ করেছে',     bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',  step: 3 },
  rejected:  { label: '❌ বাতিল করা হয়েছে',       bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',    step: 0 },
  delivered: { label: '🎉 ডেলিভারি সম্পন্ন',      bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200', step: 4 },
}

const STEPS = ['অর্ডার দেওয়া', 'দোকানে পাঠানো', 'গ্রহণ করা', 'ডেলিভারি']

function OrderCard({ order }) {
  const s = STATUS_MAP[order.status] || STATUS_MAP.pending
  const rejected = order.status === 'rejected'

  return (
    <div className={`bg-white rounded-2xl border ${s.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${s.bg} px-5 py-3 flex items-center justify-between`}>
        <div>
          <p className="font-bold text-gray-800 text-sm">{order.order_number}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('bn-BD', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${s.bg} ${s.text} border ${s.border}`}>
          {s.label}
        </span>
      </div>

      {/* Progress steps (skip if rejected) */}
      {!rejected && (
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done = s.step > i
              const active = s.step === i + 1
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done || active
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    style={done || active ? { background: GREEN } : {}}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs text-center leading-tight ${active || done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}
                          style={{ fontSize: '10px', maxWidth: 60 }}>
                      {step}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? '' : 'bg-gray-100'}`}
                         style={done ? { background: GREEN } : {}} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Order details */}
      <div className="px-5 py-4 space-y-2 text-sm text-gray-600">
        <div className="flex gap-2">
          <span className="text-base">🛒</span>
          <div>
            <span className="font-semibold text-gray-800">{order.product_name}</span>
            <span className="text-gray-400"> × {order.quantity}</span>
          </div>
        </div>
        {order.shops?.shop_name && (
          <div className="flex gap-2">
            <span className="text-base">🏪</span>
            <span>{order.shops.shop_name}</span>
          </div>
        )}
        {order.notes && (
          <div className="flex gap-2">
            <span className="text-base">📝</span>
            <span className="text-gray-500">{order.notes}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams()
  const initialPhone = searchParams.get('phone') || ''

  const [phone, setPhone]     = useState(initialPhone)
  const [searched, setSearched] = useState(initialPhone)

  const { data: orders = [], isLoading, isFetching } = useTrackOrder(searched)

  const handleSearch = (e) => {
    e.preventDefault()
    setSearched(phone.trim())
  }

  return (
    <div className="container-app py-8 pb-28 md:pb-10 px-4" style={{ maxWidth: 600 }}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
             style={{ background: '#eff6ff' }}>📦</div>
        <h1 className="text-2xl font-bold text-gray-800">অর্ডার ট্র্যাক করুন</h1>
        <p className="text-sm text-gray-400 mt-1">আপনার ফোন নম্বর দিয়ে সব অর্ডার দেখুন</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="আপনার ফোন নম্বর (01XXXXXXXXX)"
            className="input flex-1"
            type="tel"
          />
          <button
            type="submit"
            disabled={isFetching}
            className="px-5 py-2.5 text-white font-semibold rounded-xl text-sm disabled:opacity-60 flex-shrink-0"
            style={{ background: GREEN }}>
            {isFetching ? '...' : '🔍 খুঁজুন'}
          </button>
        </form>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">অর্ডার খোঁজা হচ্ছে...</p>
        </div>
      )}

      {!isLoading && searched && orders.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-5xl mb-3">🔍</p>
          <p className="text-gray-600 font-medium mb-1">কোনো অর্ডার পাওয়া যায়নি</p>
          <p className="text-gray-400 text-sm">
            <strong>{searched}</strong> নম্বরে কোনো অর্ডার নেই
          </p>
          <Link to="/order"
            className="inline-block mt-5 px-5 py-2.5 text-white font-semibold rounded-xl text-sm"
            style={{ background: GREEN }}>
            নতুন অর্ডার দিন
          </Link>
        </div>
      )}

      {orders.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-3">{orders.length} টি অর্ডার পাওয়া গেছে</p>
          <div className="space-y-4">
            {orders.map(order => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>
      )}

      {!searched && (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">
            উপরে আপনার ফোন নম্বর দিয়ে অর্ডারের অবস্থান জানুন
          </p>
        </div>
      )}
    </div>
  )
}
