import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
// @ts-ignore
import { compressImage, compressForBgRemove } from '@/lib/compressImage'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Edit2, Trash2, Upload, Package, Eye, EyeOff, X, ImagePlus, LayoutList, Sparkles, CheckCircle } from 'lucide-react'

// @ts-ignore
const useAuthHook = useAuth

type Product = {
  id: string
  shop_id: string
  name: string
  description: string | null
  features: string | null
  price: number
  original_price: number | null
  image_url: string | null
  images: string[] | null
  stock: number | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  shops: { shop_name: string }
}

async function fetchMyProducts(userId: string) {
  const { data: shops } = await supabase.from('shops').select('id, shop_name, categories(name)').eq('owner_id', userId)
  const shopIds = (shops ?? []).map((s: any) => s.id)
  if (!shopIds.length) return { products: [], shops: shops ?? [] }
  const { data, error } = await supabase
    .from('products')
    .select('*, shops(shop_name)')
    .in('shop_id', shopIds)
    .order('created_at', { ascending: false })
  if (error) throw error
  return { products: (data ?? []) as Product[], shops: shops ?? [] }
}

/* ── Upload a single image — compress first, then upload ── */
async function uploadOneImage(file: File, userId: string): Promise<string> {
  // @ts-ignore
  const compressed: File = await compressImage(file)
  const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/product-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
  const { error } = await supabase.storage.from('shop-images').upload(path, compressed, { upsert: true })
  if (error) throw new Error(`আপলোড ব্যর্থ: ${error.message}`)
  const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(path)
  return publicUrl
}

const EMPTY_PRODUCT = {
  id: '',
  shop_id: '',
  name: '',
  description: '',
  features: '',
  price: '',
  original_price: '',
  image_url: '',
  images: [] as string[],
  stock: '',
  is_active: true,
  is_featured: false,
}

const emptyRow = () => ({ name: '', price: '', stock: '', image_url: '', _uploading: false, _key: String(Date.now() + Math.random()) })

export default function Products() {
  const { user } = useAuthHook()
  const qc = useQueryClient()

  const [editProduct, setEditProduct] = useState<any>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [bgRemovingIdx, setBgRemovingIdx] = useState<number | null>(null)
  const [bgRemoveError, setBgRemoveError] = useState('')
  const bgFileRefs = useRef<(HTMLInputElement | null)[]>([])

  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkShopId, setBulkShopId] = useState('')
  const [bulkRows, setBulkRows] = useState([emptyRow()])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkError, setBulkError] = useState('')

  const [shopFilter, setShopFilter] = useState('all')
  const imgRefs = useRef<(HTMLInputElement | null)[]>([])

  const [autoDescLoading, setAutoDescLoading] = useState(false)
  const [autoDescDone, setAutoDescDone] = useState(false)
  const [autoDescCount, setAutoDescCount] = useState(0)
  const [autoDescHasMore, setAutoDescHasMore] = useState(false)
  const [autoDescTotalMissing, setAutoDescTotalMissing] = useState(0)

  const { data: { products = [], shops = [] } = {}, isLoading } = useQuery({
    queryKey: ['my-products', user?.id],
    queryFn: () => fetchMyProducts(user!.id),
    enabled: !!user,
  })

  /* ─── Save single product ─── */
  const saveMutation = useMutation({
    mutationFn: async (p: any) => {
      const allImages: string[] = p.images ?? []
      const primaryImage = allImages[0] || null

      const payload: any = {
        shop_id: p.shop_id,
        name: p.name.trim(),
        description: p.description?.trim() || null,
        features: p.features?.trim() || null,
        price: parseFloat(p.price) || 0,
        original_price: p.original_price ? parseFloat(p.original_price) : null,
        image_url: primaryImage,
        images: allImages,
        stock: p.stock !== '' && p.stock !== null ? parseInt(p.stock) : null,
        is_active: p.is_active,
        is_featured: p.is_featured,
      }

      if (p.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', p.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-products'] })
      qc.invalidateQueries({ queryKey: ['owner-stats'] })
      setEditProduct(null)
      setSaveError('')
    },
    onError: (err: any) => setSaveError(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-products'] })
      setDeleteProduct(null)
    },
  })

  const toggleAvailable = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active: val }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-products'] }),
  })

  /* ─── Upload image into slot idx ─── */
  async function handleSlotUpload(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingIdx(idx)
    setSaveError('')
    try {
      const url = await uploadOneImage(file, user.id)
      setEditProduct((p: any) => {
        const imgs = [...(p.images ?? [])]
        imgs[idx] = url
        return { ...p, images: imgs, image_url: imgs[0] ?? '' }
      })
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setUploadingIdx(null)
      e.target.value = ''
    }
  }

  async function handleBgRemove(file: File, idx: number) {
    if (!user || !editProduct?.shop_id) return
    setBgRemovingIdx(idx)
    setBgRemoveError('')
    try {
      // Compress to 1024px JPEG before sending — smaller payload, faster API
      // @ts-ignore
      const base64 = await compressForBgRemove(file)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('remove-bg', {
        body: { shop_id: editProduct.shop_id, image_base64: base64 },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (res.error || res.data?.error) {
        const msg = res.data?.error
        if (msg === 'limit_reached') {
          const lim = res.data?.limit
          throw new Error(`সীমা শেষ! এই মাসে ${lim ?? '২'}টির বেশি ব্যবহার করা যাবে না। Pro plan-এ ৫০টি পাবেন।`)
        }
        throw new Error(msg || 'সার্ভার সমস্যা')
      }
      const url: string = res.data.url
      setEditProduct((p: any) => {
        const imgs = [...(p.images ?? [])]
        imgs[idx] = url
        return { ...p, images: imgs, image_url: imgs[0] ?? '' }
      })
    } catch (err: any) {
      setBgRemoveError(err.message)
    } finally {
      setBgRemovingIdx(null)
    }
  }

  function removeImage(idx: number) {
    setEditProduct((p: any) => {
      const imgs = (p.images ?? []).filter((_: any, i: number) => i !== idx)
      return { ...p, images: imgs, image_url: imgs[0] ?? '' }
    })
  }

  async function handleSave() {
    if (!editProduct?.name?.trim() || !editProduct?.shop_id) return
    setSaving(true)
    setSaveError('')
    try {
      await saveMutation.mutateAsync(editProduct)
    } catch {
      // handled by onError
    } finally {
      setSaving(false)
    }
  }

  /* ─── Bulk: upload image for a row ─── */
  async function handleBulkImageUpload(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setBulkRows(rows => rows.map((r, i) => i === idx ? { ...r, _uploading: true } : r))
    try {
      const url = await uploadOneImage(file, user.id)
      setBulkRows(rows => rows.map((r, i) => i === idx ? { ...r, image_url: url, _uploading: false } : r))
    } catch (err: any) {
      setBulkError(err.message)
      setBulkRows(rows => rows.map((r, i) => i === idx ? { ...r, _uploading: false } : r))
    }
    e.target.value = ''
  }

  async function handleBulkSave() {
    const validRows = bulkRows.filter(r => r.name.trim() && parseFloat(r.price) > 0)
    if (!validRows.length || !bulkShopId) {
      setBulkError('দোকান বেছে নিন এবং কমপক্ষে একটি পণ্যের নাম ও দাম দিন')
      return
    }
    setBulkSaving(true)
    setBulkError('')
    try {
      const inserts = validRows.map(r => ({
        shop_id: bulkShopId,
        name: r.name.trim(),
        price: parseFloat(r.price) || 0,
        stock: r.stock ? parseInt(r.stock) : null,
        image_url: r.image_url || null,
        is_active: true,
        is_featured: false,
      }))
      const { error } = await supabase.from('products').insert(inserts)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['my-products'] })
      setBulkOpen(false)
      setBulkRows([emptyRow()])
      setBulkShopId('')
    } catch (err: any) {
      setBulkError(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে')
    } finally {
      setBulkSaving(false)
    }
  }

  const generateAiContent = useCallback(async (name: string, price?: string) => {
    if (!name?.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'product_description', productName: name, price: price || '' }),
      })
      const data = await res.json()
      if (data.description || data.features) {
        setEditProduct((p: any) => ({
          ...p,
          description: data.description || p.description,
          features: data.features || p.features,
        }))
      }
    } catch { /* silent */ }
    setAiLoading(false)
  }, [])

  /* ─── Bulk AI description generation ─── */
  async function handleAutoDescribe(shopId: string) {
    setAutoDescLoading(true)
    setAutoDescDone(false)
    try {
      const shopData = shops.find((s: any) => s.id === shopId)
      const categoryName = (shopData as any)?.categories?.name || ''
      const res = await fetch('/api/auto-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, categoryName }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.limitReached) {
        setAutoDescDone(true)
        setAutoDescHasMore(true)
        setAutoDescCount(0)
      } else if (res.ok && data.count > 0) {
        setAutoDescCount(data.count)
        setAutoDescHasMore(!!data.hasMore)
        setAutoDescTotalMissing(data.totalMissing ?? 0)
        setAutoDescDone(true)
        qc.invalidateQueries({ queryKey: ['my-products'] })
      } else if (data.error) {
        alert('AI বিবরণ তৈরি ব্যর্থ: ' + data.error)
      }
    } catch (err: any) {
      alert('AI বিবরণ তৈরি ব্যর্থ: ' + err.message)
    } finally {
      setAutoDescLoading(false)
    }
  }

  /* ─── Products missing description ─── */
  const FREE_DESC_LIMIT = 5
  const missingDescProducts = products.filter((p: Product) => !p.description && !p.features)
  const shopsWithMissing = shops.map((s: any) => {
    const shopProducts = products.filter((p: Product) => p.shop_id === s.id)
    const describedCount = shopProducts.filter((p: Product) => p.description || p.features).length
    return {
      ...s,
      missingCount: missingDescProducts.filter((p: Product) => p.shop_id === s.id).length,
      describedCount,
    }
  }).filter((s: any) => s.missingCount > 0)
  const missingByShop = shopsWithMissing.filter((s: any) => s.describedCount < FREE_DESC_LIMIT)
  const limitReachedShops = shopsWithMissing.filter((s: any) => s.describedCount >= FREE_DESC_LIMIT)

  const filtered = shopFilter === 'all' ? products : products.filter((p: Product) => p.shop_id === shopFilter)

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={shopFilter} onChange={e => setShopFilter(e.target.value)} className="h-8 text-xs w-40">
        <option value="all">সব দোকান</option>
        {shops.map((s: any) => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
      </Select>
      <Button size="sm" variant="outline"
        onClick={() => { setBulkShopId(shops[0]?.id || ''); setBulkRows([emptyRow()]); setBulkOpen(true) }}>
        <LayoutList className="h-4 w-4 mr-1" /> একসাথে যোগ
      </Button>
      <Button size="sm" onClick={() => setEditProduct({ ...EMPTY_PRODUCT, shop_id: shops[0]?.id || '' })}>
        <Plus className="h-4 w-4 mr-1" /> নতুন পণ্য
      </Button>
    </div>
  )

  const columns: ColumnDef<Product>[] = [
    {
      id: 'image',
      header: '',
      cell: ({ row }) => {
        const p = row.original
        const src = p.image_url || (Array.isArray(p.images) ? p.images[0] : null)
        return (
          <div className="w-10 h-10 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center flex-shrink-0">
            {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-gray-400" />}
          </div>
        )
      },
    },
    {
      accessorKey: 'name',
      header: 'পণ্যের নাম',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{row.original.name}</p>
          {row.original.shops?.shop_name && <p className="text-xs text-gray-400">{row.original.shops.shop_name}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'মূল্য',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-bold text-blue-700">৳{row.original.price.toLocaleString()}</p>
          {row.original.original_price && (
            <p className="text-xs text-gray-400 line-through">৳{row.original.original_price.toLocaleString()}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'স্টক',
      cell: ({ getValue }) => {
        const v = getValue() as number | null
        if (v === null || v === undefined) return <span className="text-xs text-gray-400">অসীমিত</span>
        return <span className={`text-sm font-medium ${v === 0 ? 'text-red-600' : 'text-gray-700'}`}>{v}</span>
      },
    },
    {
      accessorKey: 'is_active',
      header: 'অবস্থা',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'secondary'} className="text-xs">
          {row.original.is_active ? 'সক্রিয়' : 'বন্ধ'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'কার্যক্রম',
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex gap-1">
            <Button size="xs" variant="outline"
              onClick={() => toggleAvailable.mutate({ id: p.id, val: !p.is_active })}
              title={p.is_active ? 'বন্ধ করুন' : 'সক্রিয় করুন'}>
              {p.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button size="xs" variant="outline" onClick={() => setEditProduct({
              ...p,
              price: String(p.price),
              original_price: p.original_price ? String(p.original_price) : '',
              stock: p.stock !== null ? String(p.stock) : '',
              description: p.description || '',
              features: p.features || '',
              images: Array.isArray(p.images) ? [...p.images] : p.image_url ? [p.image_url] : [],
            })}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button size="xs" variant="destructive" onClick={() => setDeleteProduct(p)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )
      },
    },
  ]

  /* ─── Image grid component (inside single-product dialog) ─── */
  function ImageGrid() {
    const imgs: string[] = editProduct?.images ?? []
    const slots = 5
    const slotArray = Array.from({ length: slots }, (_, i) => imgs[i] ?? null)

    return (
      <div>
        <Label className="text-xs mb-2 block font-medium">
          পণ্যের ছবি (সর্বোচ্চ ৫টি){' '}
          <span className="text-gray-400 font-normal">— প্রথমটি মূল ছবি</span>
        </Label>
        <div className="grid grid-cols-5 gap-2">
          {slotArray.map((src, idx) => (
            <div key={idx} className="relative flex flex-col gap-1">
              <input
                ref={el => { imgRefs.current[idx] = el }}
                type="file" accept="image/*" className="hidden"
                onChange={e => handleSlotUpload(e, idx)}
              />
              {/* hidden file input for bg-remove (reuses same file, passes to handler) */}
              <input
                ref={el => { bgFileRefs.current[idx] = el }}
                type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleBgRemove(f, idx); e.target.value = '' }}
              />
              <button
                type="button"
                className={`w-full aspect-square rounded-xl border-2 overflow-hidden flex items-center justify-center transition-all
                  ${src
                    ? 'border-blue-300 bg-gray-50'
                    : 'border-dashed border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                onClick={() => imgRefs.current[idx]?.click()}
                disabled={uploadingIdx !== null || bgRemovingIdx !== null}
              >
                {uploadingIdx === idx ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : bgRemovingIdx === idx ? (
                  <div className="flex flex-col items-center gap-1 p-1">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[8px] text-purple-500 text-center leading-tight">সরানো হচ্ছে...</p>
                  </div>
                ) : src ? (
                  <img src={src} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-1">
                    <ImagePlus className="h-5 w-5 mx-auto text-gray-300" />
                    {idx === 0 && <p className="text-[9px] text-gray-400 mt-0.5">মূল</p>}
                  </div>
                )}
              </button>
              {src && (
                <button
                  type="button"
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow hover:bg-red-600 z-10"
                  onClick={e => { e.stopPropagation(); removeImage(idx) }}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
              {idx === 0 && src && (
                <div className="absolute -bottom-5 left-0 right-0 flex justify-center">
                  <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full leading-tight">মূল</span>
                </div>
              )}
              {/* BG Remove button — only when image exists */}
              {src && (
                <button
                  type="button"
                  disabled={bgRemovingIdx !== null || uploadingIdx !== null}
                  onClick={() => bgFileRefs.current[idx]?.click()}
                  title="নতুন ছবি দিয়ে background সরান"
                  className="w-full py-0.5 rounded-lg text-[9px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-0.5"
                >
                  {bgRemovingIdx === idx ? '...' : '🪄 BG সরান'}
                </button>
              )}
            </div>
          ))}
        </div>
        {bgRemoveError && (
          <p className="text-xs text-red-500 mt-1 bg-red-50 rounded-lg px-2 py-1">{bgRemoveError}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">ছবিতে ক্লিক করলে আপলোড হবে। 🪄 BG সরান — নতুন ছবি দিয়ে background remove হবে।</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">🛍️ পণ্য ব্যবস্থাপনা</h1>
        <p className="text-sm text-gray-500">মোট {products.length}টি পণ্য</p>
      </div>

      {/* AI Auto-describe banner */}
      {!isLoading && missingByShop.length > 0 && !autoDescDone && (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-violet-900 text-sm">
                {missingDescProducts.length}টি পণ্যের বিবরণ নেই
              </p>
              <p className="text-xs text-violet-600 mt-0.5 hidden sm:block">
                Gemini AI দিয়ে স্বয়ংক্রিয়ভাবে তৈরি করুন
              </p>
            </div>
            <div className="flex-shrink-0">
              {missingByShop.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => handleAutoDescribe(s.id)}
                  disabled={autoDescLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                >
                  {autoDescLoading
                    ? <span>তৈরি হচ্ছে...</span>
                    : <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />{s.shop_name} - AI বিবরণ</span>
                  }
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Success state ── */}
      {autoDescDone && autoDescCount > 0 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-3 sm:p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-800">
            ✅ {autoDescCount}টি পণ্যের AI বিবরণ তৈরি হয়েছে!
          </p>
        </div>
      )}

      {/* ── Pro upsell: limit reached (after generate or on page load) ── */}
      {(!isLoading && (limitReachedShops.length > 0 || (autoDescDone && autoDescHasMore))) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:p-4 flex items-start gap-3">
          <span className="text-lg flex-shrink-0">🔒</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              আপনার এখনও আরও{' '}
              {limitReachedShops.length > 0
                ? limitReachedShops.map((s: any) => `${s.missingCount}টি`).join(', ')
                : `${autoDescTotalMissing - autoDescCount}টি`
              } পণ্যের description ও features বাকি
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              বাকি পণ্যগুলো AI দিয়ে সম্পন্ন করতে <strong>Pro প্ল্যান</strong> দরকার।
              যোগাযোগ করুন: <a href="tel:01310012276" className="font-bold underline">01310012276</a>
            </p>
          </div>
        </div>
      )}

      {shops.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">প্রথমে একটি দোকান তৈরি করুন</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Mobile card list ── */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center gap-2 flex-wrap justify-between">
              <Select value={shopFilter} onChange={e => setShopFilter(e.target.value)} className="h-9 text-xs flex-1">
                <option value="all">সব দোকান</option>
                {shops.map((s: any) => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
              </Select>
              <div className="flex gap-2">
                <Button size="sm" variant="outline"
                  onClick={() => { setBulkShopId(shops[0]?.id || ''); setBulkRows([emptyRow()]); setBulkOpen(true) }}>
                  <LayoutList className="h-4 w-4 mr-1" />একসাথে
                </Button>
                <Button size="sm" onClick={() => setEditProduct({ ...EMPTY_PRODUCT, shop_id: shops[0]?.id || '' })}>
                  <Plus className="h-4 w-4 mr-1" />নতুন
                </Button>
              </div>
            </div>

            {isLoading ? (
              <>{Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">কোনো পণ্য নেই</div>
            ) : filtered.map((p: Product) => {
              const imgSrc = p.image_url || (Array.isArray(p.images) ? p.images[0] : null)
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center flex-shrink-0">
                      {imgSrc ? <img src={imgSrc} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{p.name}</p>
                      {p.shops?.shop_name && <p className="text-xs text-gray-400 truncate">{p.shops.shop_name}</p>}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm font-bold text-blue-700">৳{p.price.toLocaleString()}</span>
                        {p.original_price && <span className="text-xs text-gray-400 line-through">৳{p.original_price.toLocaleString()}</span>}
                        <Badge variant={p.is_active ? 'success' : 'secondary'} className="text-xs">{p.is_active ? 'সক্রিয়' : 'বন্ধ'}</Badge>
                        {p.stock === 0 && <span className="text-xs text-red-500 font-medium">স্টক শেষ</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="xs" variant="outline"
                        onClick={() => toggleAvailable.mutate({ id: p.id, val: !p.is_active })}
                        title={p.is_active ? 'বন্ধ করুন' : 'সক্রিয় করুন'}>
                        {p.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => setEditProduct({
                        ...p,
                        price: String(p.price),
                        original_price: p.original_price ? String(p.original_price) : '',
                        stock: p.stock !== null ? String(p.stock) : '',
                        description: p.description || '',
                        features: p.features || '',
                        images: Array.isArray(p.images) ? [...p.images] : p.image_url ? [p.image_url] : [],
                      })}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="xs" variant="destructive" onClick={() => setDeleteProduct(p)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={filtered}
              searchPlaceholder="পণ্যের নাম খুঁজুন..."
              isLoading={isLoading}
              pageSize={15}
              toolbar={toolbar}
            />
          </div>
        </>
      )}

      {/* ═══ Single Product Dialog ═══ */}
      <Dialog open={!!editProduct} onOpenChange={open => { if (!open) { setEditProduct(null); setSaveError('') } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct?.id ? '✏️ পণ্য সম্পাদনা' : '➕ নতুন পণ্য যোগ'}</DialogTitle>
          </DialogHeader>

          {editProduct && (
            <div className="space-y-4">
              <ImageGrid />

              <div>
                <Label className="text-xs mb-1.5 block">দোকান *</Label>
                <Select
                  value={editProduct.shop_id}
                  onChange={e => setEditProduct((p: any) => ({ ...p, shop_id: e.target.value }))}>
                  <option value="">দোকান বেছে নিন</option>
                  {shops.map((s: any) => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
                </Select>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">পণ্যের নাম *</Label>
                <Input
                  value={editProduct.name}
                  onChange={e => setEditProduct((p: any) => ({ ...p, name: e.target.value }))}
                  onBlur={e => {
                    const name = e.target.value.trim()
                    if (name && !editProduct.description && !editProduct.features)
                      generateAiContent(name, editProduct.price)
                  }}
                  placeholder="পণ্যের নাম লিখুন"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs">বিবরণ</Label>
                  <button type="button" onClick={() => generateAiContent(editProduct.name, editProduct.price)}
                    disabled={aiLoading || !editProduct.name?.trim()}
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    {aiLoading
                      ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />লিখছে...</>
                      : <>✨ AI দিয়ে লিখুন</>}
                  </button>
                </div>
                <Textarea
                  rows={3}
                  value={editProduct.description}
                  onChange={e => setEditProduct((p: any) => ({ ...p, description: e.target.value }))}
                  placeholder="পণ্যের বিবরণ (ঐচ্ছিক)"
                />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">
                  বৈশিষ্ট্য / স্পেসিফিকেশন{' '}
                  <span className="text-gray-400 font-normal">(ঐচ্ছিক)</span>
                </Label>
                <Textarea
                  rows={4}
                  value={editProduct.features}
                  onChange={e => setEditProduct((p: any) => ({ ...p, features: e.target.value }))}
                  placeholder={"উপাদান: সুতা\nসাইজ: S, M, L, XL\nরং: লাল, নীল, সবুজ\nওজন: ৫০০ গ্রাম"}
                />
                <p className="text-xs text-gray-400 mt-1">প্রতিটি বৈশিষ্ট্য আলাদা লাইনে লিখুন</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">বিক্রয় মূল্য (৳) *</Label>
                  <Input type="number"
                    value={editProduct.price}
                    onChange={e => setEditProduct((p: any) => ({ ...p, price: e.target.value }))}
                    placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">আসল মূল্য (৳) <span className="text-gray-400">কাটা দামের জন্য</span></Label>
                  <Input type="number"
                    value={editProduct.original_price}
                    onChange={e => setEditProduct((p: any) => ({ ...p, original_price: e.target.value }))}
                    placeholder="0" />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">স্টক <span className="text-gray-400">(ফাঁকা = অসীমিত)</span></Label>
                <Input type="number"
                  value={editProduct.stock}
                  onChange={e => setEditProduct((p: any) => ({ ...p, stock: e.target.value }))}
                  placeholder="স্টক সংখ্যা" />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editProduct.is_active}
                    onChange={e => setEditProduct((p: any) => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300" />
                  <span className="text-sm text-gray-700">পণ্য সক্রিয়</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editProduct.is_featured}
                    onChange={e => setEditProduct((p: any) => ({ ...p, is_featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300" />
                  <span className="text-sm text-gray-700">ফিচার্ড</span>
                </label>
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ⚠️ {saveError}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setEditProduct(null); setSaveError('') }}>বাতিল</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !editProduct?.name?.trim() || !editProduct?.shop_id}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : '💾 পণ্য সংরক্ষণ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Bulk Add Dialog ═══ */}
      <Dialog open={bulkOpen} onOpenChange={open => { if (!open) { setBulkOpen(false); setBulkError('') } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📦 একসাথে অনেক পণ্য যোগ</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">দোকান *</Label>
              <Select value={bulkShopId} onChange={e => setBulkShopId(e.target.value)}>
                <option value="">দোকান বেছে নিন</option>
                {shops.map((s: any) => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
              </Select>
            </div>

            <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_80px_32px] gap-2 text-xs font-medium text-gray-500 px-1">
              <span>পণ্যের নাম *</span>
              <span>দাম (৳) *</span>
              <span>স্টক</span>
              <span>ছবি</span>
              <span></span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {bulkRows.map((row, idx) => (
                <div key={row._key} className="sm:grid sm:grid-cols-[2fr_1fr_1fr_80px_32px] sm:gap-2 sm:items-center space-y-2 sm:space-y-0 border sm:border-0 rounded-lg sm:rounded-none p-2 sm:p-0 bg-gray-50 sm:bg-transparent">
                  <Input
                    placeholder="পণ্যের নাম"
                    value={row.name}
                    onChange={e => setBulkRows(rows => rows.map((r, i) => i === idx ? { ...r, name: e.target.value } : r))}
                    className="h-8 text-sm"
                  />
                  <div className="flex items-center gap-2 sm:contents">
                    <Input
                      type="number"
                      placeholder="দাম"
                      value={row.price}
                      onChange={e => setBulkRows(rows => rows.map((r, i) => i === idx ? { ...r, price: e.target.value } : r))}
                      className="flex-1 sm:flex-none h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="স্টক"
                      value={row.stock}
                      onChange={e => setBulkRows(rows => rows.map((r, i) => i === idx ? { ...r, stock: e.target.value } : r))}
                      className="flex-1 sm:flex-none h-8 text-sm"
                    />
                    <div className="relative w-16 sm:w-auto flex-shrink-0">
                      <input
                        type="file" accept="image/*" className="hidden"
                        id={`bulk-img-${idx}`}
                        onChange={e => handleBulkImageUpload(e, idx)}
                      />
                      <label htmlFor={`bulk-img-${idx}`}
                        className="flex items-center justify-center w-full h-8 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-blue-400 bg-gray-50 overflow-hidden">
                        {row._uploading ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : row.image_url ? (
                          <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </label>
                    </div>
                    <button
                      type="button"
                      className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                      onClick={() => bulkRows.length > 1 && setBulkRows(rows => rows.filter((_, i) => i !== idx))}
                      disabled={bulkRows.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full border-dashed"
              onClick={() => setBulkRows(rows => [...rows, emptyRow()])}>
              <Plus className="h-4 w-4 mr-1" /> আরও একটি পণ্য যোগ করুন
            </Button>

            {bulkError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                ⚠️ {bulkError}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              💡 শুধু নাম ও দাম দিন। ছবি পরেও যোগ করতে পারবেন।
              {bulkRows.filter(r => r.name.trim() && parseFloat(r.price) > 0).length > 0 && (
                <span className="ml-2 font-bold">
                  {bulkRows.filter(r => r.name.trim() && parseFloat(r.price) > 0).length}টি পণ্য সংরক্ষণ হবে।
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setBulkOpen(false); setBulkError('') }}>বাতিল</Button>
            <Button onClick={handleBulkSave} disabled={bulkSaving || !bulkShopId}>
              {bulkSaving ? 'সংরক্ষণ হচ্ছে...' : `💾 সব পণ্য সংরক্ষণ`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirm ═══ */}
      <Dialog open={!!deleteProduct} onOpenChange={open => !open && setDeleteProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>🗑️ পণ্য মুছবেন?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            <strong>{deleteProduct?.name}</strong> পণ্যটি মুছে ফেলতে চান?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>বাতিল</Button>
            <Button variant="destructive"
              onClick={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
              disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'মুছছে...' : 'মুছুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
