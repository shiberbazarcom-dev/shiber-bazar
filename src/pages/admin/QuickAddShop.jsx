import { useState, useRef, useCallback } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

function useProfiles() {
  return useQuery({
    queryKey: ['all-profiles-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .order('full_name')
      if (error) throw error
      return data || []
    },
  })
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .slice(0, 60) + '-' + Math.random().toString(36).slice(2, 6)
}

const EMPTY_PRODUCT = () => ({ name: '', price: '' })

export default function QuickAddShop() {
  const { user } = useAuth()
  const { data: categories = [] } = useCategories()
  const { data: profiles = [] } = useProfiles()

  const [form, setForm] = useState({
    shop_name: '', category_id: '', phone: '', address: '',
    district: '', whatsapp: '', description: '', owner_id: '',
  })
  const [products, setProducts] = useState([EMPTY_PRODUCT()])
  const [loading, setLoading] = useState(false)
  const productRefs = useRef([])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  /* ── Product rows ── */
  function addProductRow() {
    setProducts(p => [...p, EMPTY_PRODUCT()])
    setTimeout(() => productRefs.current[products.length]?.focus(), 50)
  }

  function setProduct(i, k, v) {
    setProducts(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r))
  }

  function removeProduct(i) {
    setProducts(p => p.filter((_, idx) => idx !== i))
  }

  function handleProductKeyDown(e, i) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (i === products.length - 1) addProductRow()
      else productRefs.current[i + 1]?.focus()
    }
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.shop_name.trim()) return toast.error('দোকানের নাম দিন')
    if (!form.category_id)      return toast.error('ক্যাটাগরি বেছে নিন')
    if (!form.phone.trim())     return toast.error('ফোন নম্বর দিন')
    if (!form.address.trim())   return toast.error('ঠিকানা দিন')

    setLoading(true)
    try {
      const ownerId = form.owner_id || user.id
      const slug    = generateSlug(form.shop_name)

      const { data: shop, error: shopErr } = await supabase
        .from('shops')
        .insert({
          shop_name:   form.shop_name.trim(),
          slug,
          category_id: form.category_id,
          phone:       form.phone.trim(),
          address:     form.address.trim(),
          district:    form.district.trim() || null,
          whatsapp:    form.whatsapp.trim() || form.phone.trim(),
          description: form.description.trim() || null,
          owner_id:    ownerId,
          status:      'approved',
          is_verified: false,
        })
        .select('id')
        .single()

      if (shopErr) throw shopErr

      const validProducts = products.filter(p => p.name.trim())
      if (validProducts.length > 0) {
        const rows = validProducts.map(p => ({
          shop_id:   shop.id,
          name:      p.name.trim(),
          price:     p.price ? parseFloat(p.price) : null,
          is_active: true,
          in_stock:  true,
        }))
        const { error: prodErr } = await supabase.from('products').insert(rows)
        if (prodErr) throw prodErr
      }

      toast.success(`✅ "${form.shop_name}" যোগ হয়েছে${validProducts.length > 0 ? ` (${validProducts.length}টি পণ্য সহ)` : ''}`)

      setForm({ shop_name: '', category_id: '', phone: '', address: '', district: '', whatsapp: '', description: '', owner_id: '' })
      setProducts([EMPTY_PRODUCT()])
      productRefs.current = []
    } catch (err) {
      toast.error('সমস্যা হয়েছে: ' + (err.message || 'আবার চেষ্টা করুন'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">⚡ দ্রুত দোকান যোগ</h1>
        <p className="text-sm text-gray-400 mt-0.5">সব তথ্য এক পাতায় — wizard ছাড়া</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Shop Info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">দোকানের তথ্য</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">দোকানের নাম *</label>
              <input
                value={form.shop_name} onChange={e => set('shop_name', e.target.value)}
                placeholder="যেমন: করিম স্টোর"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ক্যাটাগরি *</label>
              <select
                value={form.category_id} onChange={e => set('category_id', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">বেছে নিন</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ফোন নম্বর *</label>
              <input
                type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">ঠিকানা *</label>
              <input
                value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="বিস্তারিত ঠিকানা"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">জেলা</label>
              <input
                value={form.district} onChange={e => set('district', e.target.value)}
                placeholder="যেমন: চাঁপাইনবাবগঞ্জ"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp</label>
              <input
                type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                placeholder="খালি রাখলে phone ব্যবহার হবে"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">বিবরণ</label>
              <textarea
                value={form.description} onChange={e => set('description', e.target.value)}
                rows={2} placeholder="দোকান সম্পর্কে সংক্ষিপ্ত বিবরণ"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">মালিক (দোকানদার)</label>
              <select
                value={form.owner_id} onChange={e => set('owner_id', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">নিজের অ্যাকাউন্টে (Admin)</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || '(নাম নেই)'} — {p.phone || p.role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Products ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">পণ্য তালিকা (ঐচ্ছিক)</h2>
            <span className="text-xs text-gray-400">Enter চাপলে পরের পণ্য</span>
          </div>

          <div className="space-y-2">
            {products.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}.</span>
                <input
                  ref={el => productRefs.current[i] = el}
                  value={p.name}
                  onChange={e => setProduct(i, 'name', e.target.value)}
                  onKeyDown={e => handleProductKeyDown(e, i)}
                  placeholder="পণ্যের নাম"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
                <input
                  value={p.price}
                  onChange={e => setProduct(i, 'price', e.target.value)}
                  onKeyDown={e => handleProductKeyDown(e, i)}
                  placeholder="দাম ৳"
                  type="number" min="0" step="0.5"
                  className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
                {products.length > 1 && (
                  <button type="button" onClick={() => removeProduct(i)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addProductRow}
            className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            ➕ আরেকটি পণ্য
          </button>
        </div>

        {/* ── Submit ── */}
        <button
          type="submit" disabled={loading}
          className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-2xl text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
          {loading ? '⏳ যোগ হচ্ছে...' : '✅ দোকান যোগ করুন'}
        </button>
      </form>
    </div>
  )
}
