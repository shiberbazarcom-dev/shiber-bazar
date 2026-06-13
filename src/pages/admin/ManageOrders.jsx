import { useState } from 'react'
import { useAdminOrders, useUpdateOrderStatus, useShopsForAssignment } from '../../hooks/useOrders'
import toast from 'react-hot-toast'

const GREEN = '#2563EB'

const STATUSES = ['', 'pending', 'forwarded', 'accepted', 'rejected', 'delivered']
const STATUS_LABELS = {
  '':         'সব',
  pending:    '⏳ অপেক্ষমান',
  forwarded:  '📤 ফরওয়ার্ড',
  accepted:   '✅ গ্রহণ',
  rejected:   '❌ বাতিল',
  delivered:  '🎉 ডেলিভারি',
}
const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  forwarded: 'bg-blue-100 text-blue-700',
  accepted:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  delivered: 'bg-purple-100 text-purple-700',
}

function buildWhatsAppMsg(order) {
  const lines = [
    '*নতুন অর্ডার — শিবের বাজার* 🛒',
    '',
    `📋 অর্ডার: *${order.order_number}*`,
    `👤 নাম: ${order.customer_name}`,
    `📞 ফোন: ${order.customer_phone}`,
    `📍 ঠিকানা: ${order.customer_address}`,
    '',
    `🛒 পণ্য: *${order.product_name}* × ${order.quantity}`,
  ]
  if (order.notes) lines.push(`📝 নোট: ${order.notes}`)
  lines.push('', '_শিবের বাজার থেকে পাঠানো হয়েছে_')
  return lines.join('\n')
}

export default function ManageOrders() {
  const [filter, setFilter]   = useState('')
  const [search, setSearch]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const { data: orders = [], isLoading, refetch } = useAdminOrders(filter)
  const { data: shops  = [] } = useShopsForAssignment()
  const updateStatus = useUpdateOrderStatus()

  const singleShop = shops.length === 1 ? shops[0] : null

  const filtered = orders.filter(o => {
    if (search && !(
      o.order_number?.includes(search) ||
      o.customer_name?.includes(search) ||
      o.customer_phone?.includes(search) ||
      o.product_name?.includes(search)
    )) return false
    if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false
    if (dateTo   && new Date(o.created_at) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const allSelected = filtered.length > 0 && filtered.every(o => selectedIds.has(o.id))

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)))
    }
  }

  async function bulkAction(status) {
    const ids = [...selectedIds]
    if (!ids.length) return
    setBulkLoading(true)
    try {
      await Promise.all(ids.map(id => updateStatus.mutateAsync({ id, status })))
      toast.success(`${ids.length}টি অর্ডার আপডেট হয়েছে ✅`)
      setSelectedIds(new Set())
    } catch {
      toast.error('সমস্যা হয়েছে')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleAssign = async (orderId, shopId) => {
    if (!shopId) return
    try {
      await updateStatus.mutateAsync({ id: orderId, status: 'forwarded', shop_id: shopId })
      toast.success('দোকানে ফরওয়ার্ড করা হয়েছে ✅')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  const handleStatus = async (orderId, status) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status })
      toast.success('স্ট্যাটাস আপডেট হয়েছে')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  const sendWhatsApp = (order) => {
    const msg  = buildWhatsAppMsg(order)
    const phone = order.shops?.phone?.replace(/\D/g, '') || ''
    if (!phone) { toast.error('দোকানের ফোন নম্বর নেই'); return }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Stat counts
  const counts = STATUSES.slice(1).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📦 অর্ডার ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-400 mt-0.5">মোট {orders.length} টি অর্ডার</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {singleShop && orders.filter(o => o.status === 'pending' && !o.shop_id).length > 0 && (
            <button
              onClick={async () => {
                const pending = orders.filter(o => o.status === 'pending' && !o.shop_id)
                setBulkLoading(true)
                try {
                  await Promise.all(pending.map(o => updateStatus.mutateAsync({ id: o.id, status: 'forwarded', shop_id: singleShop.id })))
                  toast.success(`${pending.length}টি অর্ডার "${singleShop.shop_name}" এ Auto-Assign হয়েছে ⚡`)
                } catch { toast.error('সমস্যা হয়েছে') } finally { setBulkLoading(false) }
              }}
              disabled={bulkLoading}
              className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-1.5">
              ⚡ Auto-Assign সব
            </button>
          )}
          <button onClick={() => refetch()}
            className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            🔄 রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {[
          { key: 'pending',   label: 'অপেক্ষমান',   color: 'bg-yellow-50 text-yellow-700', icon: '⏳' },
          { key: 'forwarded', label: 'ফরওয়ার্ড',     color: 'bg-blue-50 text-blue-700',    icon: '📤' },
          { key: 'accepted',  label: 'গ্রহণ',         color: 'bg-green-50 text-green-700',  icon: '✅' },
          { key: 'delivered', label: 'ডেলিভারি',      color: 'bg-purple-50 text-purple-700',icon: '🎉' },
          { key: 'rejected',  label: 'বাতিল',         color: 'bg-red-50 text-red-700',      icon: '❌' },
        ].map(({ key, label, color, icon }) => (
          <button key={key} onClick={() => setFilter(f => f === key ? '' : key)}
            className={`rounded-xl p-3 text-center border-2 transition-all ${
              filter === key ? 'border-blue-400 shadow-sm' : 'border-transparent'
            } ${color}`}>
            <p className="text-xl">{icon}</p>
            <p className="text-lg font-bold">{counts[key] || 0}</p>
            <p className="text-xs">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="অর্ডার নম্বর, নাম বা ফোন দিয়ে খুঁজুন..."
            className="input flex-1"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">তারিখ থেকে</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="input text-sm py-1.5 w-36" />
            <label className="text-xs text-gray-500 whitespace-nowrap">পর্যন্ত</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="input text-sm py-1.5 w-36" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50">
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? 'text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
              style={filter === s ? { background: GREEN } : {}}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 ? (
        <div className="bg-blue-600 text-white rounded-xl px-4 py-3 mb-3 flex items-center gap-3 flex-wrap animate-fadeIn">
          <span className="text-sm font-semibold">{selectedIds.size}টি নির্বাচিত</span>
          <div className="flex gap-2 flex-wrap ml-auto">
            <button onClick={() => bulkAction('accepted')} disabled={bulkLoading}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg text-xs font-semibold disabled:opacity-60">
              ✅ সব গ্রহণ
            </button>
            <button onClick={() => bulkAction('delivered')} disabled={bulkLoading}
              className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 rounded-lg text-xs font-semibold disabled:opacity-60">
              🎉 সব ডেলিভারি
            </button>
            <button onClick={() => bulkAction('rejected')} disabled={bulkLoading}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-400 rounded-lg text-xs font-semibold disabled:opacity-60">
              ❌ সব বাতিল
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold">
              বাতিল
            </button>
          </div>
        </div>
      ) : (
        filtered.length > 0 && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
              <input type="checkbox" checked={allSelected} onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
              সব নির্বাচন করুন ({filtered.length}টি)
            </label>
          </div>
        )
      )}

      {/* Orders list */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-gray-500">কোনো অর্ডার পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${selectedIds.has(order.id) ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-100'}`}>
              {/* Order card header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer flex-shrink-0" />
                  <span className="font-bold text-gray-800">{order.order_number}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('bn-BD')}
                </span>
              </div>

              {/* Order body */}
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer */}
                <div className="space-y-1.5 text-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">কাস্টমার</p>
                  <p className="font-semibold text-gray-800">👤 {order.customer_name}</p>
                  <p className="text-gray-600">📞 {order.customer_phone}</p>
                  <p className="text-gray-600">📍 {order.customer_address}</p>
                </div>

                {/* Product */}
                <div className="space-y-1.5 text-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">পণ্য</p>
                  <p className="font-semibold text-gray-800">🛒 {order.product_name} × {order.quantity}</p>
                  {order.shops?.shop_name && (
                    <p className="text-gray-600">🏪 {order.shops.shop_name}</p>
                  )}
                  {order.notes && (
                    <p className="text-gray-500">📝 {order.notes}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-2">
                {/* Assign to shop */}
                <select
                  defaultValue={order.shop_id || ''}
                  onChange={e => handleAssign(order.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer">
                  <option value="">🏪 দোকান নির্বাচন করুন</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.categories?.icon} {shop.shop_name}
                    </option>
                  ))}
                </select>

                {/* Status dropdown */}
                <select
                  value={order.status}
                  onChange={e => handleStatus(order.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer">
                  {STATUSES.filter(Boolean).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>

                {/* Auto-assign if single shop */}
                {singleShop && order.status === 'pending' && !order.shop_id && (
                  <button
                    onClick={() => handleAssign(order.id, singleShop.id)}
                    className="text-xs px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5">
                    ⚡ {singleShop.shop_name} এ Assign
                  </button>
                )}

                {/* WhatsApp */}
                <button
                  onClick={() => sendWhatsApp(order)}
                  className="text-xs px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
                  </svg>
                  WhatsApp
                </button>

                {/* Call button */}
                <a href={`tel:${order.customer_phone}`}
                  className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors">
                  📞 কল করুন
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
