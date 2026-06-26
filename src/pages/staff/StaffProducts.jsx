import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import toast from 'react-hot-toast'
import { Edit2, Plus, Eye, EyeOff, X } from 'lucide-react'

export default function StaffProducts() {
  const { staffSession } = useStaffAuth()
  const qc = useQueryClient()
  const [editProduct, setEditProduct] = useState(null)
  const [addOpen, setAddOpen] = useState(false)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['staff-products', staffSession?.shop_id],
    queryFn: async () => {
      if (!staffSession?.shop_id) return []
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, original_price, stock, is_active, image_url, description')
        .eq('shop_id', staffSession.shop_id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!staffSession?.shop_id,
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('products').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-products'] })
      toast.success('প্রোডাক্ট আপডেট হয়েছে')
      setEditProduct(null)
    },
    onError: () => toast.error('আপডেট হয়নি'),
  })

  const addProduct = useMutation({
    mutationFn: async (fields) => {
      const { error } = await supabase.from('products').insert({
        ...fields,
        shop_id: staffSession.shop_id,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-products'] })
      toast.success('প্রোডাক্ট যোগ হয়েছে')
      setAddOpen(false)
    },
    onError: () => toast.error('যোগ করা যায়নি'),
  })

  function toggleActive(product) {
    updateProduct.mutate({ id: product.id, is_active: !product.is_active })
  }

  if (isLoading) return <div className="text-center py-16 text-gray-400">লোড হচ্ছে...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">প্রোডাক্ট তালিকা</h1>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> নতুন প্রোডাক্ট
        </Button>
      </div>

      {products.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">কোনো প্রোডাক্ট নেই</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-xl border shadow-sm p-4 flex gap-3">
            {p.image_url && (
              <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <p className="font-semibold text-gray-800 text-sm line-clamp-1">{p.name}</p>
                <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                  {p.is_active ? 'চালু' : 'বন্ধ'}
                </Badge>
              </div>
              <p className="text-blue-700 font-bold text-sm mt-0.5">৳{(p.price || 0).toLocaleString()}</p>
              {p.stock != null && <p className="text-xs text-gray-500">স্টক: {p.stock}</p>}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setEditProduct({ ...p })}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" /> এডিট
                </button>
                <button
                  onClick={() => toggleActive(p)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {p.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {p.is_active ? 'বন্ধ করুন' : 'চালু করুন'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <ProductModal
          title="প্রোডাক্ট এডিট করুন"
          initial={editProduct}
          loading={updateProduct.isPending}
          onSave={fields => updateProduct.mutate({ id: editProduct.id, ...fields })}
          onClose={() => setEditProduct(null)}
        />
      )}

      {/* Add Modal */}
      {addOpen && (
        <ProductModal
          title="নতুন প্রোডাক্ট যোগ করুন"
          initial={{}}
          loading={addProduct.isPending}
          onSave={fields => addProduct.mutate(fields)}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  )
}

function ProductModal({ title, initial, loading, onSave, onClose }) {
  const [form, setForm] = useState({
    name:           initial.name || '',
    price:          initial.price || '',
    original_price: initial.original_price || '',
    stock:          initial.stock ?? '',
    description:    initial.description || '',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.price) { return }
    onSave({
      name:           form.name,
      price:          Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      stock:          form.stock !== '' ? Number(form.stock) : null,
      description:    form.description || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="প্রোডাক্টের নাম *">
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="দাম (৳) *">
              <input required type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Field>
            <Field label="আগের দাম (৳)">
              <input type="number" min="0" value={form.original_price} onChange={e => set('original_price', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Field>
          </div>
          <Field label="স্টক">
            <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </Field>
          <Field label="বিবরণ">
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </Button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}
