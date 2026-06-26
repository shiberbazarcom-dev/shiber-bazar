import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTrackOrder } from '../../hooks/useOrders'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const BLUE = '#2563EB'

const STATUS_CONFIG = {
  pending:   { label: 'অপেক্ষমান',      color: 'bg-amber-50 text-amber-700 border border-amber-200',   dot: 'bg-amber-400',   icon: '⏳' },
  forwarded: { label: 'দোকানে পাঠানো',  color: 'bg-blue-50 text-blue-700 border border-blue-200',      dot: 'bg-blue-400',    icon: '📤' },
  accepted:  { label: 'গ্রহণ হয়েছে',    color: 'bg-green-50 text-green-700 border border-green-200',   dot: 'bg-green-400',   icon: '✅' },
  shipped:   { label: 'শিপ হয়েছে',      color: 'bg-indigo-50 text-indigo-700 border border-indigo-200',dot: 'bg-indigo-400',  icon: '🚚' },
  rejected:  { label: 'বাতিল',           color: 'bg-red-50 text-red-700 border border-red-200',         dot: 'bg-red-400',     icon: '❌' },
  delivered: { label: 'ডেলিভারি সম্পন্ন',color: 'bg-purple-50 text-purple-700 border border-purple-200',dot:'bg-purple-400',  icon: '🎉' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-50 text-gray-600 border border-gray-200', dot: 'bg-gray-400', icon: '📦' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.icon} {cfg.label}
    </span>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-all"
      style={copied
        ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }
        : { background: '#f8fafc', color: '#6b7280', borderColor: '#e5e7eb' }
      }
    >
      {copied ? '✓ কপি হয়েছে' : '📋 কপি'}
    </button>
  )
}

function OrderCard({ order }) {
  const [open, setOpen] = useState(false)
  const date = new Date(order.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-blue-100 transition-colors">
      {/* Card header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
             style={{ background: '#eff6ff' }}>
          📦
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-800 text-sm">{order.order_number}</p>
            <CopyButton text={order.order_number} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={order.status} />
          <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      {/* Expandable details */}
      {open && (
        <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50">
          <div className="space-y-2.5">
            <Row label="পণ্য" value={order.product_name} />
            <Row label="পরিমাণ" value={`${order.quantity}টি`} />
            {order.total_amount > 0 && (
              <Row label="মোট" value={`৳${Number(order.total_amount).toLocaleString('bn-BD')}`} bold />
            )}
            {order.shops?.shop_name && (
              <Row label="দোকান" value={order.shops.shop_name} />
            )}
            {order.customer_address && (
              <Row label="ঠিকানা" value={order.customer_address} />
            )}
            {order.notes && (
              <Row label="নোট" value={order.notes} />
            )}
          </div>

          {order.shops?.slug && (
            <Link
              to={`/shop/${order.shops.slug}`}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              দোকানে যান →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-xs text-right ${bold ? 'font-bold text-gray-800' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

export default function MyOrders() {
  const { profile } = useAuth()
  const profilePhone = profile?.phone || ''
  const [manualPhone, setManualPhone] = useState('')
  const [searched, setSearched] = useState(profilePhone)
  const activePhone = searched
  const { data: orders = [], isLoading } = useTrackOrder(activePhone)
  const qc = useQueryClient()

  // Realtime: যখনই কোনো order এর status update হয়, refetch করো
  useEffect(() => {
    if (!activePhone) return
    const ch = supabase
      .channel(`my-orders-realtime-${activePhone}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new?.customer_phone === activePhone) {
            qc.invalidateQueries({ queryKey: ['track-order', activePhone] })
          }
        }
      )
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [activePhone, qc])

  function handleSearch(e) {
    e.preventDefault()
    if (manualPhone.trim().length >= 10) setSearched(manualPhone.trim())
  }

  const delivered = orders.filter(o => o.status === 'delivered').length
  const active    = orders.filter(o => !['delivered','rejected'].includes(o.status)).length

  return (
    <div className="max-w-2xl mx-auto pb-10">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">আমার অর্ডার</h1>
        <p className="text-sm text-gray-400 mt-0.5">সব অর্ডারের তালিকা ও সর্বশেষ অবস্থা</p>
      </div>

      {/* Phone search (no profile phone) */}
      {!profilePhone && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-1">অর্ডারে দেওয়া ফোন নম্বর দিন</p>
          <p className="text-xs text-gray-400 mb-3">যে নম্বর দিয়ে অর্ডার করেছিলেন সেটা লিখুন</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input value={manualPhone} onChange={e => setManualPhone(e.target.value)}
              placeholder="01XXXXXXXXX" type="tel" className="input flex-1" />
            <button type="submit"
              className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl flex-shrink-0 hover:opacity-90"
              style={{ background: BLUE }}>
              খুঁজুন
            </button>
          </form>
          <Link to="/dashboard/profile" className="inline-block mt-2 text-xs text-blue-500 hover:underline">
            প্রোফাইলে ফোন যোগ করুন →
          </Link>
        </div>
      )}

      {/* Summary stats */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">মোট অর্ডার</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{active}</p>
            <p className="text-xs text-gray-400 mt-0.5">চলমান</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-purple-600">{delivered}</p>
            <p className="text-xs text-gray-400 mt-0.5">ডেলিভারি</p>
          </div>
        </div>
      )}

      {/* Phone indicator */}
      {profilePhone && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">📱 {profilePhone}</p>
          <Link to="/track-order" className="text-xs font-medium text-blue-500 hover:underline">
            অন্য নম্বরে খুঁজুন →
          </Link>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">লোড হচ্ছে...</p>
        </div>
      )}

      {/* No orders */}
      {!isLoading && activePhone && orders.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-dashed border-gray-200">
          <p className="text-5xl mb-4">🛒</p>
          <p className="font-semibold text-gray-700 mb-1">কোনো অর্ডার পাওয়া যায়নি</p>
          <p className="text-sm text-gray-400 mb-5">{activePhone} নম্বরে কোনো অর্ডার নেই</p>
          <Link to="/shops"
            className="inline-block px-6 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90"
            style={{ background: BLUE }}>
            দোকান দেখুন
          </Link>
        </div>
      )}

      {/* Empty state — no phone entered */}
      {!isLoading && !activePhone && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-dashed border-gray-200">
          <p className="text-4xl mb-3">📱</p>
          <p className="text-sm text-gray-400">ফোন নম্বর দিয়ে আপনার অর্ডার খুঁজুন</p>
        </div>
      )}

      {/* Orders */}
      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  )
}
