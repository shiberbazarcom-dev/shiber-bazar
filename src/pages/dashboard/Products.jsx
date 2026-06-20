import { useState, useCallback } from 'react'
import { useMyProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, uploadProductImage } from '../../hooks/useProducts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const GREEN = '#2563EB'

function AiDescBtn({ productName, price, onResult }) {
  const [loading, setLoading] = useState(false)
  const run = async () => {
    if (!productName?.trim()) return toast.error('আগে পণ্যের নাম দিন')
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'product_description', productName, price }),
      })
      const data = await res.json()
      if (data.description) {
        onResult(data.description)
        toast.success(`✨ AI লিখেছে! (${data.provider === 'deepseek' ? 'DeepSeek' : 'Gemini'})`)
      }
    } catch { toast.error('AI কাজ করেনি') }
    setLoading(false)
  }
  return (
    <button type="button" onClick={run} disabled={loading}
      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg text-white disabled:opacity-60"
      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
      {loading
        ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />লিখছে...</>
        : <>✨ AI দিয়ে লিখুন</>}
    </button>
  )
}

const EMPTY_FORM = {
  shop_id:     '',
  name:        '',
  description: '',
  price:       '',
  image_url:   '',
  category:    '',
  is_active:   true,
  in_stock:    true,
  sort_order:  0,
}

function useMyShops() {
  return useQuery({
    queryKey: ['my-shops-select'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase
        .from('shops')
        .select('id, shop_name')
        .eq('owner_id', user.id)
        .order('shop_name')
      return data || []
    },
  })
}

export default function Products() {
  const { data: products = [], isLoading } = useMyProducts()
  const { data: myShops = [] }             = useMyShops()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const [showForm, setShowForm]       = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState({ ...EMPTY_FORM })
  const [uploading, setUploading]     = useState(false)
  const [shopFilter, setShopFilter]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, shop_id: myShops[0]?.id || '' })
    setShowForm(true)
  }
  const openEdit = (p) => {
    setEditing(p.id)
    setForm({
      shop_id:     p.shop_id,
      name:        p.name,
      description: p.description || '',
      price:       p.price ?? '',
      image_url:   p.image_url || '',
      category:    p.category || '',
      is_active:   p.is_active,
      in_stock:    p.in_stock,
      sort_order:  p.sort_order,
    })
    setShowForm(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('ছবি ২MB-এর বেশি হওয়া যাবে না'); return }
    setUploading(true)
    try {
      const url = await uploadProductImage(file)
      set('image_url', url)
      toast.success('ছবি আপলোড হয়েছে ✅')
    } catch (err) {
      toast.error('ছবি আপলোড ব্যর্থ: ' + (err.message || ''))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('পণ্যের নাম দিন')
    if (!form.shop_id)     return toast.error('দোকান নির্বাচন করুন')
    const payload = {
      ...form,
      price:      form.price !== '' ? parseFloat(form.price) : null,
      sort_order: parseInt(form.sort_order) || 0,
    }
    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing, ...payload })
        toast.success('পণ্য আপডেট হয়েছে ✅')
      } else {
        await createProduct.mutateAsync(payload)
        toast.success('পণ্য যোগ হয়েছে ✅')
      }
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      toast.error('সমস্যা হয়েছে: ' + (err.message || ''))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('এই পণ্য মুছে ফেলবেন?')) return
    try {
      await deleteProduct.mutateAsync(id)
      toast.success('পণ্য মুছে ফেলা হয়েছে')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  const toggleActive = async (product) => {
    try {
      await updateProduct.mutateAsync({ id: product.id, is_active: !product.is_active })
      toast.success(product.is_active ? 'পণ্য বন্ধ করা হয়েছে' : 'পণ্য চালু করা হয়েছে ✅')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  const filtered = shopFilter ? products.filter(p => p.shop_id === shopFilter) : products
  const isPending = createProduct.isPending || updateProduct.isPending

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🛍️ পণ্য ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-400 mt-0.5">মোট {products.length} টি পণ্য</p>
        </div>
        <button onClick={openNew}
          className="text-sm px-4 py-2 text-white rounded-xl font-medium"
          style={{ background: GREEN }}>
          ➕ নতুন পণ্য
        </button>
      </div>

      {/* Shop filter tabs */}
      {myShops.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <button onClick={() => setShopFilter('')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !shopFilter ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
            style={!shopFilter ? { background: GREEN } : {}}>
            সব দোকান
          </button>
          {myShops.map(shop => (
            <button key={shop.id} onClick={() => setShopFilter(shop.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                shopFilter === shop.id ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              style={shopFilter === shop.id ? { background: GREEN } : {}}>
              🏪 {shop.shop_name}
            </button>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-800">
                {editing ? '✏️ পণ্য সম্পাদনা' : '➕ নতুন পণ্য যোগ করুন'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Shop */}
              <div>
                <label className="form-label">দোকান *</label>
                <select required value={form.shop_id} onChange={e => set('shop_id', e.target.value)}
                  className="input">
                  <option value="">দোকান নির্বাচন করুন</option>
                  {myShops.map(s => (
                    <option key={s.id} value={s.id}>{s.shop_name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="form-label">পণ্যের নাম *</label>
                <input required value={form.name} onChange={e => set('name', e.target.value)}
                  className="input" placeholder="পণ্যের নাম" />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label !mb-0">বিবরণ</label>
                  <AiDescBtn
                    productName={form.name}
                    price={form.price}
                    onResult={(desc) => set('description', desc)}
                  />
                </div>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  className="input" rows={2} placeholder="পণ্যের বিস্তারিত..." />
              </div>

              {/* Price + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">দাম (টাকা)</label>
                  <input type="number" min="0" step="0.01" value={form.price}
                    onChange={e => set('price', e.target.value)}
                    className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="form-label">বিভাগ</label>
                  <input value={form.category} onChange={e => set('category', e.target.value)}
                    className="input" placeholder="যেমন: ইলেকট্রনিক্স" />
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="form-label">পণ্যের ছবি</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-500">
                      {uploading
                        ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> আপলোড হচ্ছে...</>
                        : <><span>📁</span> ছবি বেছে নিন</>
                      }
                      <input type="file" accept="image/*" onChange={handleImageUpload}
                        className="hidden" disabled={uploading} />
                    </label>
                    <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
                      className="input mt-2 text-xs" placeholder="অথবা URL দিন" />
                  </div>
                  {form.image_url && (
                    <img src={form.image_url} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">সর্বোচ্চ ২MB · JPG/PNG</p>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => set('is_active', e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">সক্রিয়</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.in_stock}
                    onChange={e => set('in_stock', e.target.checked)}
                    className="w-4 h-4 rounded accent-green-600" />
                  <span className="text-sm text-gray-700">স্টকে আছে</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  বাতিল
                </button>
                <button type="submit" disabled={isPending || uploading}
                  className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                  style={{ background: GREEN }}>
                  {isPending ? '⏳...' : editing ? 'আপডেট করুন' : 'পণ্য যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-5xl mb-3">📦</p>
          <p className="text-gray-500 mb-4">কোনো পণ্য নেই</p>
          {myShops.length === 0 ? (
            <p className="text-sm text-gray-400">প্রথমে একটি দোকান তৈরি করুন</p>
          ) : (
            <button onClick={openNew} className="text-sm px-5 py-2.5 text-white rounded-xl" style={{ background: GREEN }}>
              প্রথম পণ্য যোগ করুন
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div key={product.id} className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${
              product.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'
            }`}>
              {/* Image */}
              <div className="h-36 bg-gray-100 overflow-hidden">
                {product.image_url
                  ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🛍️</div>
                }
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight">{product.name}</h3>
                  {product.price && (
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: GREEN }}>
                      ৳{parseFloat(product.price).toLocaleString()}
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-2">{product.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {product.shops?.shop_name && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      🏪 {product.shops.shop_name}
                    </span>
                  )}
                  {!product.in_stock && (
                    <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">স্টক নেই</span>
                  )}
                  {product.category && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {product.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button onClick={() => toggleActive(product)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                    product.is_active
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {product.is_active ? '✅ চালু' : '⏸ বন্ধ'}
                </button>
                <button onClick={() => openEdit(product)}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium">
                  ✏️ সম্পাদনা
                </button>
                <button onClick={() => handleDelete(product.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
