import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useMyShops } from '../../hooks/useShops'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

/* ── fetch unique customers who have ordered from this shop ── */
async function fetchShopCustomers(shopId) {
  const { data, error } = await supabase
    .from('orders')
    .select('customer_name, customer_phone')
    .eq('shop_id', shopId)
    .not('customer_phone', 'is', null)
  if (error) throw error

  // unique by phone
  const seen = new Set()
  const unique = (data || []).filter(r => {
    if (!r.customer_phone || seen.has(r.customer_phone)) return false
    seen.add(r.customer_phone)
    return true
  })

  if (unique.length === 0) return []

  // find profiles matching these phone numbers
  const phones = unique.map(r => r.customer_phone)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('phone', phones)

  // for customers without a profile, still count them (phone-only)
  const profilePhones = new Set((profiles || []).map(p => p.phone))
  const phoneOnlyCustomers = unique
    .filter(r => !profilePhones.has(r.customer_phone))
    .map(r => ({ id: null, full_name: r.customer_name, phone: r.customer_phone }))

  return [...(profiles || []), ...phoneOnlyCustomers]
}

/* ── send broadcast (insert one notification per customer) ── */
async function sendBroadcast({ shopId, shopName, title, message, customers }) {
  const withAccount = customers.filter(c => c.id)
  if (withAccount.length > 0) {
    const rows = withAccount.map(c => ({
      user_id: c.id,
      type: 'broadcast',
      title,
      message,
      data: { shop_id: shopId, shop_name: shopName },
      is_read: false,
    }))
    const { error } = await supabase.from('notifications').insert(rows)
    if (error) throw error
  }
  return customers.length
}

/* ── past broadcasts (last 10 notifications of type broadcast from this shop) ── */
async function fetchHistory(shopId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('title, message, created_at, data')
    .eq('type', 'broadcast')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error

  const seen = new Set()
  return (data || [])
    .filter(n => n.data?.shop_id === shopId)
    .filter(n => {
      const key = `${n.title}___${n.message}___${Math.floor(new Date(n.created_at) / 60000)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 10)
}

/* ── Compose Box ── */
function ComposeBox({ shop, onSent }) {
  const [title, setTitle]     = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(false)

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['shop-customers', shop.id],
    queryFn:  () => fetchShopCustomers(shop.id),
  })

  const mutation = useMutation({
    mutationFn: () => sendBroadcast({
      shopId:   shop.id,
      shopName: shop.shop_name,
      title:    title.trim(),
      message:  message.trim(),
      customers,
    }),
    onSuccess: (count) => {
      toast.success(`✅ ${count} জন গ্রাহকের কাছে বার্তা পাঠানো হয়েছে`)
      setTitle('')
      setMessage('')
      setPreview(false)
      onSent()
    },
    onError: () => toast.error('বার্তা পাঠাতে সমস্যা হয়েছে'),
  })

  const canSend = title.trim().length > 0 && message.trim().length > 0 && customers.length > 0

  if (preview) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">প্রিভিউ</h3>
          <button onClick={() => setPreview(false)} className="text-sm text-gray-400 hover:text-gray-600">সম্পাদনা করুন</button>
        </div>

        {/* Phone mockup */}
        <div className="p-6 flex justify-center">
          <div className="w-72 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-md">
            <div className="bg-purple-600 px-4 py-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {shop.shop_name[0]}
              </div>
              <span className="text-white text-xs font-semibold truncate">{shop.shop_name}</span>
              <span className="ml-auto text-white/60 text-[10px]">এখনই</span>
            </div>
            <div className="p-4">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <p className="font-bold text-gray-800 text-sm mb-1">{title || '(শিরোনাম নেই)'}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{message || '(বার্তা নেই)'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={() => setPreview(false)}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            ফিরে যান
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSend}
            className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-60 transition-colors">
            {mutation.isPending ? '⏳ পাঠানো হচ্ছে...' : `📤 ${customers.length} জনকে পাঠান`}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">নতুন ব্রডকাস্ট</h3>
            <p className="text-xs text-gray-400 mt-0.5">{shop.shop_name} থেকে</p>
          </div>
          {loadingCustomers ? (
            <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
          ) : (
            <span className="text-xs bg-purple-50 text-purple-600 font-semibold px-2.5 py-1 rounded-full">
              👥 {customers.length} গ্রাহক
            </span>
          )}
        </div>
      </div>

      {customers.length === 0 && !loadingCustomers && (
        <div className="px-5 py-4 bg-amber-50 border-b border-amber-100 flex items-start gap-3">
          <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-700">এখন পর্যন্ত কোনো অর্ডার হয়নি, তাই কোনো গ্রাহক নেই।</p>
        </div>
      )}

      {/* Form */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">শিরোনাম *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={80}
            placeholder="যেমন: ঈদ অফার! ৩০% ছাড়"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-colors"
          />
          <p className="text-right text-[10px] text-gray-300 mt-1">{title.length}/80</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">বার্তা *</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={300}
            rows={4}
            placeholder="বিস্তারিত বার্তা লিখুন..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-colors resize-none"
          />
          <p className="text-right text-[10px] text-gray-300 mt-1">{message.length}/300</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={() => setPreview(true)}
          disabled={!canSend}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
          👁️ প্রিভিউ
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !canSend}
          className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-60 transition-colors">
          {mutation.isPending ? '⏳ পাঠানো হচ্ছে...' : '📤 পাঠান'}
        </button>
      </div>
    </div>
  )
}

/* ── History Card ── */
function BroadcastHistory({ shopId }) {
  const qc = useQueryClient()
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['broadcast-history', shopId],
    queryFn:  () => fetchHistory(shopId),
  })

  if (isLoading) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="h-4 bg-gray-100 rounded animate-pulse w-32 mb-4" />
      {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl mb-2 animate-pulse" />)}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-800">পাঠানো বার্তা</h3>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['broadcast-history', shopId] })}
          className="text-xs text-gray-400 hover:text-gray-600">🔄</button>
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">এখনো কোনো বার্তা পাঠানো হয়নি</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {history.map((h, i) => (
            <div key={i} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{h.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{h.message}</p>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                  {new Date(h.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function Broadcast() {
  const { data: myShops = [], isLoading } = useMyShops()
  const [selectedShopId, setSelectedShopId] = useState(null)
  const qc = useQueryClient()

  const shops      = myShops.filter(s => s.status === 'approved')
  const activeShop = shops.find(s => s.id === selectedShopId) || shops[0] || null

  function onSent() {
    qc.invalidateQueries({ queryKey: ['broadcast-history', activeShop?.id] })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
    </div>
  )

  if (shops.length === 0) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">📢</p>
      <p className="font-bold text-gray-700 text-lg mb-2">ব্রডকাস্ট বার্তা</p>
      <p className="text-sm text-gray-400">অনুমোদিত দোকান থাকলে এখান থেকে গ্রাহকদের বার্তা পাঠাতে পারবেন।</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📢 ব্রডকাস্ট বার্তা</h1>
          <p className="text-sm text-gray-400 mt-0.5">আপনার গ্রাহকদের কাছে বার্তা পাঠান</p>
        </div>
      </div>

      {/* Shop selector (if multiple shops) */}
      {shops.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {shops.map(s => (
            <button key={s.id}
              onClick={() => setSelectedShopId(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                (activeShop?.id === s.id)
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {s.shop_name}
            </button>
          ))}
        </div>
      )}

      {activeShop && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Compose */}
          <ComposeBox shop={activeShop} onSent={onSent} />
          {/* History */}
          <BroadcastHistory shopId={activeShop.id} />
        </div>
      )}
    </div>
  )
}
