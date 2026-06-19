import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePlaceOrder } from '../../hooks/useOrders'
import { useShopProducts } from '../../hooks/useProducts'
import { useAdminWhatsapp } from '../../hooks/useSettings'
import { useAuth } from '../../context/AuthContext'
import { whatsappUrl } from '../../lib/utils'
import { productMatchesSearch } from '../../lib/banglishSearch'
import toast from 'react-hot-toast'

const BLUE = '#2563EB'
const BLUE_GRADIENT = 'linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)'
const DRAFT_KEY = 'sb_order_draft'

function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {} } catch { return {} }
}

const WA_ICON = (
  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

/* ═══════════════════════════════════════════════════════
   ORDER MODAL — bottom sheet (mobile) / centered (desktop)
   Multi-item cart-style ordering inside the modal.
   Uses the exact same order logic as OrderPage (usePlaceOrder):
   items are flattened to product_name / quantity / total_amount,
   identical to how CartPage orders are submitted.
═══════════════════════════════════════════════════════ */
export default function OrderModal({ open, onClose, shop, product = null }) {
  const { profile } = useAuth()
  const placeOrder = usePlaceOrder()
  const adminWhatsapp = useAdminWhatsapp()

  /* Shop's products for the picker (fetched only while open) */
  const { data: shopProducts = [] } = useShopProducts(open ? shop?.id : null)

  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState(() => {
    const d = loadDraft()
    return {
      customer_name:    d.customer_name || profile?.full_name || '',
      customer_phone:   d.customer_phone || profile?.phone || '',
      customer_address: d.customer_address || '',
      notes:            '',
    }
  })

  /* When opened from a product page, make sure that product is in the list */
  useEffect(() => {
    if (open) {
      setSuccess(null)
      setSuggestOpen(false)
      setQuery('')
      if (product) {
        setItems(arr => arr.some(x => x.key === product.id) ? arr : [
          ...arr,
          { key: product.id, name: product.name, price: product.price ?? '', image_url: product.image_url, qty: 1 },
        ])
      }
    }
  }, [open, product])

  /* Fill name/phone from profile when it loads */
  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        customer_name:  f.customer_name  || profile.full_name || '',
        customer_phone: f.customer_phone || profile.phone     || '',
      }))
    }
  }, [profile])

  /* Preserve entered data (survives accidental close / reload) */
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        customer_name:    form.customer_name,
        customer_phone:   form.customer_phone,
        customer_address: form.customer_address,
      }))
    } catch { /* ignore */ }
  }, [form.customer_name, form.customer_phone, form.customer_address])

  /* Lock body scroll while open */
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  if (!open) return null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  /* ── Items helpers ── */
  const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.qty, 0)
  const totalQty = items.reduce((s, i) => s + i.qty, 0)
  const shopPhone = shop?.whatsapp || shop?.phone

  const suggestions = shopProducts
    .filter(p => productMatchesSearch(p, query))
    .slice(0, 8)

  function addProduct(p) {
    setItems(arr => {
      const i = arr.findIndex(x => x.key === p.id)
      if (i >= 0) return arr.map((x, idx) => idx === i ? { ...x, qty: x.qty + 1 } : x)
      return [...arr, { key: p.id, name: p.name, price: p.price ?? '', image_url: p.image_url, qty: 1 }]
    })
    setQuery('')
  }

  function addCustom(name) {
    const n = name.trim()
    if (!n) return
    setItems(arr => [...arr, { key: `c-${Date.now()}`, name: n, price: '', image_url: null, qty: 1, custom: true }])
    setQuery('')
    setSuggestOpen(false)
  }

  const updateItem = (key, patch) => setItems(arr => arr.map(x => x.key === key ? { ...x, ...patch } : x))
  const removeItem = (key) => setItems(arr => arr.filter(x => x.key !== key))

  const itemsSummary = items.map(i => `${i.name} ×${i.qty}`).join(', ')

  function handleClose() {
    if (success) { setItems([]); setSuccess(null) }
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    let list = items
    if (list.length === 0 && query.trim()) {
      list = [{ key: 'q', name: query.trim(), price: '', qty: 1 }]
      setItems(list)
    }
    if (list.length === 0)                 return toast.error('অন্তত একটি পণ্য যোগ করুন')
    if (!form.customer_name.trim())        return toast.error('নাম দিন')
    if (!form.customer_phone.trim())       return toast.error('ফোন নম্বর দিন')
    if (!form.customer_address.trim())     return toast.error('ঠিকানা দিন')
    try {
      const listTotal = list.reduce((s, i) => s + (parseFloat(i.price) || 0) * i.qty, 0)
      const data = await placeOrder.mutateAsync({
        customer_name:    form.customer_name,
        customer_phone:   form.customer_phone,
        customer_address: form.customer_address,
        product_name:     list.map(i => `${i.name} ×${i.qty}`).join(', '),
        quantity:         list.reduce((s, i) => s + i.qty, 0),
        notes:            form.notes,
        shop_id:          shop?.id || null,
        total_amount:     listTotal,
      })
      setSuccess(data)
    } catch {
      toast.error('অর্ডার দিতে সমস্যা হয়েছে, আবার চেষ্টা করুন')
    }
  }

  const waMessage =
    `অর্ডার করতে চাই:\n` +
    (items.length ? items.map(i => `• ${i.name} ×${i.qty}`).join('\n') : `• ${query || 'পণ্য'}`) +
    (total > 0 ? `\nমোট: ৳${total.toLocaleString('bn-BD')}` : '')

  const inputCls = 'w-full h-12 px-4 text-[15px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <style>{`
        @keyframes sbSheetUp { from { transform: translateY(48px); opacity: .5 } to { transform: translateY(0); opacity: 1 } }
        @keyframes sbFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @media (min-width: 640px) { .sb-order-panel { border-radius: 20px !important } }
      `}</style>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" style={{ animation: 'sbFadeIn .2s ease' }} onClick={handleClose} />

      {/* Panel */}
      <div
        className="sb-order-panel relative w-full sm:max-w-md bg-white shadow-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto"
        style={{ animation: 'sbSheetUp .25s ease', borderRadius: '20px 20px 0 0' }}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden pt-2.5 flex justify-center">
          <span className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {success ? (
          /* ══════════ SUCCESS ══════════ */
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3" style={{ background: '#eff6ff' }}>🎉</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">অর্ডার সফল!</h3>
            <p className="text-xs text-gray-400 mb-4">আপনার অর্ডার নম্বর সংরক্ষণ করুন</p>

            <div className="rounded-2xl px-6 py-4 mb-4 border-2 border-dashed border-blue-300" style={{ background: '#eff6ff' }}>
              <p className="text-xs text-gray-400 mb-1">অর্ডার নম্বর</p>
              <p className="text-3xl font-bold tracking-widest" style={{ color: BLUE }}>{success.order_number}</p>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              আমরা <strong className="text-gray-600">{form.customer_phone}</strong> নম্বরে যোগাযোগ করব।
            </p>

            <div className="space-y-2.5">
              {adminWhatsapp && (
                <a
                  href={whatsappUrl(
                    adminWhatsapp,
                    `🛒 নতুন অর্ডার\n` +
                    `অর্ডার নম্বর: ${success.order_number}\n` +
                    `পণ্য: ${itemsSummary}\n` +
                    `নাম: ${form.customer_name}\n` +
                    `ফোন: ${form.customer_phone}\n` +
                    `ঠিকানা: ${form.customer_address}` +
                    (form.notes ? `\nনোট: ${form.notes}` : '')
                  )}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 font-bold rounded-2xl text-sm text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
                  style={{ background: '#25D366' }}>
                  {WA_ICON} WhatsApp-এ অর্ডার পাঠান
                </a>
              )}
              <Link to={`/track-order?phone=${encodeURIComponent(form.customer_phone)}`}
                className="flex items-center justify-center gap-2 w-full h-11 text-white font-semibold rounded-2xl text-sm active:scale-95 transition-all"
                style={{ background: BLUE_GRADIENT }}>
                📦 অর্ডার ট্র্যাক করুন
              </Link>
              <button onClick={handleClose}
                className="w-full h-11 text-gray-500 font-semibold rounded-2xl text-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all">
                বন্ধ করুন
              </button>
            </div>
          </div>
        ) : (
          /* ══════════ ORDER FORM ══════════ */
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-gray-50 sticky top-0 bg-white z-30" style={{ borderRadius: '20px 20px 0 0' }}>
              <div>
                <h3 className="font-bold text-gray-900 text-base">অর্ডার করুন</h3>
                {shop?.shop_name && <p className="text-[11px] text-gray-400">দোকান: {shop.shop_name}</p>}
              </div>
              <button type="button" onClick={handleClose} aria-label="বন্ধ করুন"
                className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 active:scale-90 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">

              {/* ── Section 1: Products ── */}
              <div className="space-y-3">
                {/* Search / add — Banglish auto-suggest */}
                <div className="relative">
                  <input value={query}
                    onChange={e => { setQuery(e.target.value); setSuggestOpen(true) }}
                    onFocus={() => setSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                    className={inputCls}
                    placeholder={items.length ? 'আরও পণ্য যোগ করুন...' : 'পণ্য খুঁজুন বা লিখুন... *'} />
                  <svg className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
                  </svg>

                  {suggestOpen && (suggestions.length > 0 || query.trim()) && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto">
                      {suggestions.length > 0 && (
                        <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          {query.trim() ? 'মিলে যাওয়া পণ্য' : 'এই দোকানের পণ্য'}
                        </p>
                      )}
                      {suggestions.map(p => {
                        const added = items.find(x => x.key === p.id)
                        return (
                          <button key={p.id} type="button"
                            onMouseDown={e => { e.preventDefault(); addProduct(p) }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-blue-50/60 active:bg-blue-50 text-left transition-colors">
                            <img src={p.image_url || '/product-placeholder.svg'} alt=""
                              onError={e => { e.target.onerror = null; e.target.src = '/product-placeholder.svg' }}
                              className="w-9 h-9 rounded-lg object-cover bg-gray-50 flex-shrink-0 border border-gray-100" />
                            <span className="flex-1 min-w-0 text-xs font-semibold text-gray-700 truncate">{p.name}</span>
                            {p.price != null && p.price !== '' && (
                              <span className="text-xs font-bold flex-shrink-0" style={{ color: BLUE }}>৳{Number(p.price).toLocaleString('bn-BD')}</span>
                            )}
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                              added ? 'bg-green-100 text-green-600' : 'text-white'
                            }`} style={added ? {} : { background: BLUE }}>
                              {added ? '✓' : '+'}
                            </span>
                          </button>
                        )
                      })}
                      {query.trim() && (
                        <button type="button"
                          onMouseDown={e => { e.preventDefault(); addCustom(query) }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-gray-50 text-left border-t border-gray-50 transition-colors">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white" style={{ background: BLUE }}>+</span>
                          <span className="text-xs font-semibold text-gray-600">"{query.trim()}" নিজে লিখে যোগ করুন</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected items */}
                {items.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100 overflow-hidden">
                    {items.map(it => (
                      <div key={it.key} className="flex items-center gap-2.5 p-2.5">
                        <img src={it.image_url || '/product-placeholder.svg'} alt=""
                          onError={e => { e.target.onerror = null; e.target.src = '/product-placeholder.svg' }}
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0 bg-white border border-gray-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-1">{it.name}</p>
                          {it.custom ? (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-gray-400">দাম (৳):</span>
                              <input type="number" min="0" value={it.price}
                                onChange={e => updateItem(it.key, { price: e.target.value })}
                                className="w-20 h-7 px-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                                placeholder="০" />
                            </div>
                          ) : (
                            parseFloat(it.price) > 0 && (
                              <p className="text-xs font-bold mt-0.5" style={{ color: BLUE }}>
                                ৳{(parseFloat(it.price) * it.qty).toLocaleString('bn-BD')}
                                {it.qty > 1 && <span className="text-[10px] text-gray-400 font-medium"> (৳{Number(it.price).toLocaleString('bn-BD')} × {it.qty})</span>}
                              </p>
                            )
                          )}
                        </div>
                        {/* Qty stepper */}
                        <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg p-0.5 flex-shrink-0">
                          <button type="button" onClick={() => it.qty > 1 ? updateItem(it.key, { qty: it.qty - 1 }) : removeItem(it.key)} aria-label="কমান"
                            className="w-7 h-7 rounded-md text-gray-600 font-bold hover:bg-gray-50 active:scale-90 transition-all">−</button>
                          <span className="w-6 text-center font-bold text-gray-900 text-sm">{it.qty}</span>
                          <button type="button" onClick={() => updateItem(it.key, { qty: it.qty + 1 })} aria-label="বাড়ান"
                            className="w-7 h-7 rounded-md font-bold text-white active:scale-90 transition-all" style={{ background: BLUE }}>+</button>
                        </div>
                        <button type="button" onClick={() => removeItem(it.key)} aria-label="বাদ দিন"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0 active:scale-90 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    {/* Total */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-white">
                      <span className="text-xs font-semibold text-gray-500">মোট ({totalQty}টি পণ্য)</span>
                      <span className="text-lg font-black" style={{ color: BLUE }}>
                        {total > 0 ? `৳${total.toLocaleString('bn-BD')}` : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section 2: Customer info ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">আপনার তথ্য</p>
                <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)}
                  className={inputCls} placeholder="আপনার নাম *" autoComplete="name" />
                <div>
                  <input type="tel" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)}
                    className={inputCls} placeholder="ফোন নম্বর (01XXXXXXXXX) *" autoComplete="tel" />
                  <p className="text-[10px] text-gray-400 mt-1 px-1">এই নম্বরে অর্ডার ট্র্যাক করতে পারবেন</p>
                </div>
                <textarea value={form.customer_address} onChange={e => set('customer_address', e.target.value)} rows={2}
                  className="w-full px-4 py-3 text-[15px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  placeholder="ডেলিভারি ঠিকানা (গ্রাম/মহল্লা, উপজেলা, জেলা) *" />
              </div>

              {/* ── Section 3: Optional note ── */}
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full px-4 py-3 text-[15px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                placeholder="রং, সাইজ বা বিশেষ নির্দেশনা লিখুন" />
            </div>

            {/* ── Section 4: Actions (sticky) ── */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-50 px-5 py-3.5 space-y-2.5"
              style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom))' }}>
              <button type="submit" disabled={placeOrder.isPending}
                className="w-full h-[52px] text-white font-bold rounded-2xl text-[15px] shadow-md shadow-blue-200 disabled:opacity-60 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{ background: BLUE_GRADIENT }}>
                {placeOrder.isPending
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> অর্ডার দেওয়া হচ্ছে...</>
                  : <>🛒 অর্ডার নিশ্চিত করুন {total > 0 && `— ৳${total.toLocaleString('bn-BD')}`}</>
                }
              </button>
              {shopPhone && (
                <a href={whatsappUrl(shopPhone, waMessage)} target="_blank" rel="noreferrer"
                  className="w-full h-11 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border-2 border-green-500 text-green-600 hover:bg-green-50 active:scale-[0.98] transition-all">
                  {WA_ICON} WhatsApp এ অর্ডার করুন
                </a>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
