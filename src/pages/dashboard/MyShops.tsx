import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Store, Plus, Edit2, Trash2, Upload, Phone, MapPin, Package, AlertCircle } from 'lucide-react'
import ShopStatusBadge from '@/components/shop/ShopStatusBadge'
import toast from 'react-hot-toast'

const MAX_SHOPS = 3

// @ts-ignore
const useAuthHook = useAuth

const SHOP_STATUS: Record<string, { label: string; variant: any; desc: string }> = {
  pending_approval: { label: 'অনুমোদনের অপেক্ষায়', variant: 'warning',     desc: 'অ্যাডমিন অনুমোদনের অপেক্ষায়' },
  approved:         { label: 'অনুমোদিত',          variant: 'success',     desc: 'দোকান সক্রিয়' },
  rejected:         { label: 'প্রত্যাখ্যাত',       variant: 'destructive', desc: 'তথ্য সংশোধন করে পুনরায় জমা দিন' },
  suspended:        { label: 'স্থগিত',             variant: 'secondary',   desc: 'সাময়িকভাবে বন্ধ' },
}

async function fetchMyShops(userId: string) {
  const { data, error } = await supabase
    .from('shops')
    .select('*, categories(name, icon), subcategories(name)')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as any[]
}

async function fetchCategories() {
  const { data } = await supabase.from('categories').select('id, name').order('name')
  return (data ?? []) as any[]
}

async function uploadShopImage(file: File, shopId: string, type: 'logo' | 'cover') {
  const ext = file.name.split('.').pop()
  const path = `${shopId}/${type}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('shop-images').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(path)
  return publicUrl
}

export default function MyShops() {
  const { user } = useAuthHook()
  const qc = useQueryClient()
  const [editShop, setEditShop] = useState<any>(null)
  const [deleteShop, setDeleteShop] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['my-shops', user?.id],
    queryFn: () => fetchMyShops(user!.id),
    enabled: !!user,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const deleteMutation = useMutation({
    mutationFn: async (shopId: string) => {
      // Delete child records first to avoid FK constraint errors
      await supabase.from('favorites').delete().eq('shop_id', shopId)
      await supabase.from('reviews').delete().eq('shop_id', shopId)
      await supabase.from('shop_images').delete().eq('shop_id', shopId)
      await supabase.from('products').delete().eq('shop_id', shopId)
      // Finally delete the shop
      const { error } = await supabase.from('shops').delete().eq('id', shopId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-shops'] })
      qc.invalidateQueries({ queryKey: ['owner-stats'] })
      setDeleteShop(null)
      toast.success('দোকান মুছে ফেলা হয়েছে')
    },
    onError: (err: any) => {
      toast.error(err?.message?.includes('policy')
        ? 'অনুমতি নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।'
        : 'মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      setDeleteShop(null)
    },
  })

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !editShop) return
    setUploadingLogo(true)
    try {
      const url = await uploadShopImage(file, editShop.id, 'logo')
      setEditShop((s: any) => ({ ...s, logo: url }))
    } finally { setUploadingLogo(false) }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !editShop) return
    setUploadingCover(true)
    try {
      const url = await uploadShopImage(file, editShop.id, 'cover')
      setEditShop((s: any) => ({ ...s, cover_image: url }))
    } finally { setUploadingCover(false) }
  }

  async function handleSave() {
    if (!editShop) return
    setSaving(true)
    try {
      const { id, categories: _, subcategories: __, owner_id: ___, ...fields } = editShop
      const { error } = await supabase.from('shops').update(fields).eq('id', id)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['my-shops'] })
      qc.invalidateQueries({ queryKey: ['owner-stats'] })
      setEditShop(null)
    } finally { setSaving(false) }
  }

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🏪 আমার দোকান</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {shops.length}/{MAX_SHOPS}টি দোকান ব্যবহার হয়েছে
          </p>
        </div>
        {shops.length < MAX_SHOPS ? (
          <Link to="/dashboard/add-shop">
            <Button size="sm"><Plus className="h-4 w-4" /> নতুন দোকান</Button>
          </Link>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium">সর্বোচ্চ {MAX_SHOPS}টি দোকান তৈরি করা যাবে</p>
          </div>
        )}
      </div>

      {shops.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Store className="h-16 w-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">এখনো কোনো দোকান নেই</p>
            <p className="text-gray-400 text-sm mt-1">নতুন দোকান তৈরি করুন</p>
            <Link to="/dashboard/add-shop" className="mt-4 inline-block">
              <Button><Plus className="h-4 w-4" /> দোকান যোগ করুন</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {shops.map((shop: any) => {
            const st = SHOP_STATUS[shop.status] ?? { label: shop.status, variant: 'secondary', desc: '' }
            return (
              <Card key={shop.id} className="overflow-hidden group">
                {/* Cover */}
                <div className="relative h-28 bg-gradient-to-br from-blue-100 to-indigo-100">
                  {(shop.cover_image || shop.cover_url) && (
                    <img src={shop.cover_image || shop.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 right-2">
                    <ShopStatusBadge status={shop.status} size="sm" />
                  </div>
                  {/* Logo */}
                  <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl border-2 border-white bg-white shadow-md overflow-hidden">
                    {(shop.logo || shop.logo_url)
                      ? <img src={shop.logo || shop.logo_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-blue-50 flex items-center justify-center text-xl">{shop.categories?.icon || '🏪'}</div>
                    }
                  </div>
                </div>
                <CardContent className="pt-8 pb-4 px-4">
                  <div className="mb-2">
                    <h3 className="font-bold text-gray-900 text-base truncate">{shop.shop_name}</h3>
                    <p className="text-xs text-gray-400">{shop.categories?.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{shop.description || 'কোনো বিবরণ নেই'}</p>
                  <div className="space-y-1 mb-3">
                    {shop.phone && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="h-3 w-3" />{shop.phone}</p>}
                    {shop.address && <p className="text-xs text-gray-500 flex items-center gap-1.5"><MapPin className="h-3 w-3" /><span className="truncate">{shop.address}</span></p>}
                  </div>
                  
                  {/* Status Warning Messages */}
                  {shop.status === 'pending_approval' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                      <p className="text-xs text-amber-700 flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        অনুমোদনের অপেক্ষায়। পণ্য যোগ করা সাময়িকভাবে নিষ্ক্রিয়।
                      </p>
                    </div>
                  )}
                  {shop.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                      <p className="text-xs text-red-700 flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        প্রত্যাখ্যাত। তথ্য সংশোধন করে পুনরায় জমা দিন।
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 min-w-0" onClick={() => setEditShop({...shop})}>
                      <Edit2 className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">সম্পাদনা</span>
                    </Button>
                    <Link to="/dashboard/products" className="flex-1 min-w-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={shop.status !== 'approved'}
                        title={shop.status !== 'approved' ? 'অনুমোদনের পর পণ্য যোগ করতে পারবেন' : 'পণ্য পরিচালনা'}
                      >
                        <Package className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">পণ্য</span>
                      </Button>
                    </Link>
                    <Button size="sm" variant="destructive" className="flex-shrink-0 px-3" onClick={() => setDeleteShop(shop)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editShop} onOpenChange={open => !open && setEditShop(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✏️ দোকান সম্পাদনা</DialogTitle>
          </DialogHeader>
          {editShop && (
            <div className="space-y-4">
              {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">লোগো</Label>
                  <div
                    className="h-24 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors flex items-center justify-center bg-gray-50 relative"
                    onClick={() => logoRef.current?.click()}
                  >
                    {(editShop.logo || editShop.logo_url)
                      ? <img src={editShop.logo || editShop.logo_url} alt="" className="w-full h-full object-cover" />
                      : <div className="text-center"><Upload className="h-5 w-5 mx-auto text-gray-400" /><p className="text-xs text-gray-400 mt-1">Upload</p></div>
                    }
                    {uploadingLogo && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs">আপলোড হচ্ছে...</div>}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">কভার ছবি</Label>
                  <div
                    className="h-24 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors flex items-center justify-center bg-gray-50 relative"
                    onClick={() => coverRef.current?.click()}
                  >
                    {(editShop.cover_image || editShop.cover_url)
                      ? <img src={editShop.cover_image || editShop.cover_url} alt="" className="w-full h-full object-cover" />
                      : <div className="text-center"><Upload className="h-5 w-5 mx-auto text-gray-400" /><p className="text-xs text-gray-400 mt-1">Upload</p></div>
                    }
                    {uploadingCover && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs">আপলোড হচ্ছে...</div>}
                  </div>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">দোকানের নাম *</Label>
                <Input value={editShop.shop_name || ''} onChange={e => setEditShop((s: any) => ({...s, shop_name: e.target.value}))} />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">বিবরণ</Label>
                <Textarea rows={3} value={editShop.description || ''} onChange={e => setEditShop((s: any) => ({...s, description: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">ফোন নম্বর</Label>
                  <Input value={editShop.phone || ''} onChange={e => setEditShop((s: any) => ({...s, phone: e.target.value}))} />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">হোয়াটসঅ্যাপ</Label>
                  <Input value={editShop.whatsapp || ''} onChange={e => setEditShop((s: any) => ({...s, whatsapp: e.target.value}))} />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">ঠিকানা</Label>
                <Textarea rows={2} value={editShop.address || ''} onChange={e => setEditShop((s: any) => ({...s, address: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">ফেসবুক লিংক</Label>
                  <Input value={editShop.facebook_url || ''} onChange={e => setEditShop((s: any) => ({...s, facebook_url: e.target.value}))} placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">ওয়েবসাইট</Label>
                  <Input value={editShop.website_url || ''} onChange={e => setEditShop((s: any) => ({...s, website_url: e.target.value}))} placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">বিভাগ</Label>
                <Select value={editShop.category_id || ''} onChange={e => setEditShop((s: any) => ({...s, category_id: e.target.value}))}>
                  <option value="">বিভাগ বেছে নিন</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">খোলার সময়</Label>
                <Input value={editShop.opening_hours || ''} onChange={e => setEditShop((s: any) => ({...s, opening_hours: e.target.value}))} placeholder="সকাল ৯টা - রাত ১০টা" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditShop(null)}>বাতিল</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteShop} onOpenChange={open => !open && setDeleteShop(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>🗑️ দোকান মুছবেন?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            <strong>{deleteShop?.shop_name}</strong> দোকানটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteShop(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteShop.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'মুছছে...' : 'হ্যাঁ, মুছুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
