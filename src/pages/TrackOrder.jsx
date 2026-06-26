import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTrackOrder, useTrackByOrderNumber } from '../hooks/useOrders'

const PURPLE = '#7c3aed'

const STATUS_CONFIG = {
  pending:   { label: 'অপেক্ষমান',           step: 1 },
  forwarded: { label: 'দোকানে পাঠানো হয়েছে', step: 2 },
  accepted:  { label: 'প্রক্রিয়াধীন',         step: 2 },
  rejected:  { label: 'বাতিল',               step: -1 },
  shipped:   { label: 'ডেলিভারিতে আছে',       step: 3 },
  delivered: { label: 'ডেলিভারি সম্পন্ন',     step: 4 },
}

const TIMELINE_STEPS = [
  { key: 'placed',   label: 'অর্ডার গৃহীত',         icon: '📋' },
  { key: 'accepted', label: 'দোকান নিশ্চিত করেছে',   icon: '✅' },
  { key: 'shipped',  label: 'ডেলিভারিতে পাঠানো',     icon: '🚚' },
  { key: 'done',     label: 'ডেলিভারি সম্পন্ন',      icon: '🎉' },
]

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('bn-BD', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const isRejected = status === 'rejected'
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
      isRejected
        ? 'bg-red-50 text-red-700 border border-red-200'
        : 'bg-purple-50 text-purple-700 border border-purple-200'
    }`}>
      {cfg.label}
    </span>
  )
}

function Timeline({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const currentStep = cfg.step
  const rejected = status === 'rejected'

  if (rejected) {
    return (
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <span>❌</span>
          <span className="font-medium">এই অর্ডারটি বাতিল করা হয়েছে</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">অর্ডারের অবস্থা</p>
      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, i) => {
          const done = currentStep > i + 1
          const active = currentStep === i + 1
          const pending = currentStep < i + 1
          const isLast = i === TIMELINE_STEPS.length - 1
          return (
            <div key={step.key} className="flex gap-3">
              {/* Left: dot + line */}
              <div className="flex flex-col items-center" style={{ width: 24 }}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  done
                    ? 'text-white'
                    : active
                    ? 'border-2 bg-purple-50'
                    : 'bg-gray-100'
                }`}
                style={
                  done ? { background: PURPLE }
                  : active ? { borderColor: PURPLE }
                  : {}
                }>
                  {done
                    ? <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    : active
                    ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: PURPLE, display: 'block' }} />
                    : null
                  }
                </div>
                {!isLast && (
                  <div className="flex-1 w-0.5 my-1" style={{ background: done ? PURPLE : '#e5e7eb', minHeight: 16 }} />
                )}
              </div>
              {/* Right: label */}
              <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                <p className={`text-sm font-medium ${pending ? 'text-gray-400' : 'text-gray-800'}`}>
                  {step.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrderCard({ order }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: PURPLE }}>
        <div>
          <p className="text-white font-semibold text-sm">{order.order_number}</p>
          <p className="text-purple-200 text-xs mt-0.5">{order.shops?.shop_name || 'শিবের বাজার'}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-2.5 border-b border-gray-100">
        <Row icon="📦" label="পণ্য" value={`${order.product_name} × ${order.quantity}`} />
        {order.total_amount > 0 && (
          <Row icon="💰" label="মোট মূল্য" value={`৳ ${order.total_amount.toLocaleString('bn-BD')}`} purple />
        )}
        <Row icon="👤" label="নাম" value={order.customer_name} />
        <Row icon="📍" label="ঠিকানা" value={order.customer_address} />
        <Row icon="🗓️" label="তারিখ" value={formatDate(order.created_at)} />
      </div>

      {/* Timeline */}
      <Timeline status={order.status} />

      {/* Footer */}
      {order.shops?.slug && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">সমস্যা হলে দোকানে যোগাযোগ করুন</span>
          <Link
            to={`/shop/${order.shops.slug}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: PURPLE }}
          >
            চ্যাট করুন →
          </Link>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, value, purple }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-400 flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <span>{icon}</span>{label}
      </span>
      <span className={`text-sm font-medium text-right ${purple ? 'text-purple-700' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  )
}

/* ── Phone search tab ── */
function PhoneSearch() {
  const [searchParams] = useSearchParams()
  const initialPhone = searchParams.get('phone') || ''
  const [phone, setPhone] = useState(initialPhone)
  const [searched, setSearched] = useState(initialPhone)
  const { data: orders = [], isLoading, isFetching } = useTrackOrder(searched)

  return (
    <>
      <form onSubmit={e => { e.preventDefault(); setSearched(phone.trim()) }} className="flex gap-2 mb-5">
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          className="input flex-1"
          type="tel"
        />
        <button
          type="submit"
          disabled={isFetching}
          className="px-4 py-2 text-white text-sm font-semibold rounded-xl disabled:opacity-60 flex-shrink-0"
          style={{ background: PURPLE }}
        >
          {isFetching ? '...' : 'খুঁজুন'}
        </button>
      </form>

      {isLoading && <Spinner />}

      {!isLoading && searched && orders.length === 0 && (
        <Empty text={`${searched} নম্বরে কোনো অর্ডার নেই`} />
      )}

      {orders.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">{orders.length}টি অর্ডার পাওয়া গেছে</p>
          {orders.map(o => <OrderCard key={o.id} order={o} />)}
        </div>
      )}

      {!searched && <Hint text="ফোন নম্বর দিয়ে আপনার সব অর্ডার একসাথে দেখুন" />}
    </>
  )
}

/* ── Order number search tab ── */
function OrderNumberSearch() {
  const [searchParams] = useSearchParams()
  const initialOrder = searchParams.get('order') || ''
  const [orderNum, setOrderNum] = useState(initialOrder)
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data: order, isLoading, isFetching } = useTrackByOrderNumber(
    submitted ? orderNum : '',
    submitted ? phone : ''
  )

  function handleSearch(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  const notFound = submitted && !isLoading && !isFetching && !order

  return (
    <>
      <form onSubmit={handleSearch} className="space-y-2 mb-5">
        <input
          value={orderNum}
          onChange={e => { setOrderNum(e.target.value); setSubmitted(false) }}
          placeholder="অর্ডার নম্বর (যেমন: SB202506001)"
          className="input w-full"
        />
        <input
          value={phone}
          onChange={e => { setPhone(e.target.value); setSubmitted(false) }}
          placeholder="ফোন নম্বর (01XXXXXXXXX)"
          className="input w-full"
          type="tel"
        />
        <button
          type="submit"
          disabled={isFetching}
          className="w-full py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-60"
          style={{ background: PURPLE }}
        >
          {isFetching ? 'খোঁজা হচ্ছে...' : 'অর্ডার খুঁজুন'}
        </button>
      </form>

      {isLoading && <Spinner />}
      {notFound && <Empty text="অর্ডার নম্বর বা ফোন নম্বর সঠিক নয়" />}
      {order && <OrderCard order={order} />}
      {!submitted && <Hint text="অর্ডার নম্বর ও ফোন নম্বর দিয়ে নির্দিষ্ট অর্ডার ট্র্যাক করুন" />}
    </>
  )
}

function Spinner() {
  return (
    <div className="flex flex-col items-center py-12 gap-3">
      <div className="w-8 h-8 border-4 border-purple-100 rounded-full animate-spin" style={{ borderTopColor: PURPLE }} />
      <p className="text-sm text-gray-400">খোঁজা হচ্ছে...</p>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-gray-500 text-sm font-medium">কোনো অর্ডার পাওয়া যায়নি</p>
      <p className="text-gray-400 text-xs mt-1">{text}</p>
      <Link to="/order"
        className="inline-block mt-4 px-4 py-2 text-white text-sm font-semibold rounded-xl"
        style={{ background: PURPLE }}>
        নতুন অর্ডার দিন
      </Link>
    </div>
  )
}

function Hint({ text }) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  )
}

/* ── Main page ── */
export default function TrackOrder() {
  const [tab, setTab] = useState('phone')

  return (
    <div className="container-app py-8 pb-28 md:pb-10 px-4" style={{ maxWidth: 560 }}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
             style={{ background: '#ede9fe' }}>📦</div>
        <h1 className="text-2xl font-bold text-gray-800">অর্ডার ট্র্যাক করুন</h1>
        <p className="text-sm text-gray-400 mt-1">আপনার অর্ডারের সর্বশেষ অবস্থান জানুন</p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 rounded-xl p-1 flex gap-1 mb-5">
        <button
          onClick={() => setTab('phone')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'phone'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📱 ফোন নম্বর দিয়ে
        </button>
        <button
          onClick={() => setTab('order')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'order'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔢 অর্ডার নম্বর দিয়ে
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        {tab === 'phone' ? <PhoneSearch /> : <OrderNumberSearch />}
      </div>
    </div>
  )
}
