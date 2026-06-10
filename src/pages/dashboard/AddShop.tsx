import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, ArrowLeft, ArrowRight, CheckCircle, Store, Phone, Image, Clock } from 'lucide-react'
// @ts-ignore
import { getTemplateProducts } from '@/data/categoryProductTemplates'

// @ts-ignore
const useAuthHook = useAuth

const STEPS = [
  { id: 1, icon: Store,  title: 'মূল তথ্য',  desc: 'দোকানের নাম ও বিভাগ' },
  { id: 2, icon: Phone,  title: 'যোগাযোগ',   desc: 'ফোন, ঠিকানা, সোশ্যাল' },
  { id: 3, icon: Image,  title: 'ছবি',        desc: 'লোগো ও কভার ছবি' },
  { id: 4, icon: Clock,  title: 'সময়সূচী',  desc: 'খোলার সময়' },
]

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')   // trim leading/trailing dashes
    .slice(0, 60)
}

async function fetchCategories() {
  const { data } = await supabase.from('categories').select('id, name, icon').order('name')
  return (data ?? []) as any[]
}

async function fetchSubcategories(categoryId: string) {
  if (!categoryId) return []
  const { data } = await supabase.from('subcategories').select('id, name').eq('category_id', categoryId).order('name')
  return (data ?? []) as any[]
}

async function uploadImage(file: File, userId: string, type: string): Promise<string> {
  // Try to create bucket if it doesn't exist (requires service role in prod)
  try {
    await supabase.storage.createBucket('shop-images', { public: true, fileSizeLimit: 5242880 })
  } catch (_) { /* bucket already exists — OK */ }

  const ext = file.name.split('.').pop()
  const path = `${userId}/${type}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('shop-images').upload(path, file, { upsert: true })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(path)
  return publicUrl
}

const MAX_SHOPS = 3

export default function AddShop() {
  const { user } = useAuthHook()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const logoRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [deliveryAvailable, setDeliveryAvailable] = useState(false)
  const [minOrder, setMinOrder] = useState('')

  const [logoUploading, setLogoUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  // slug availability
  const [slugStatus, setSlugStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')

  useEffect(() => {
    if (!slug || slug.length < 2) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('shops').select('id').eq('slug', slug).maybeSingle()
      setSlugStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(timer)
  }, [slug])

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: () => fetchSubcategories(categoryId),
    enabled: !!categoryId,
  })

  // Check existing shop count
  const { data: myShopCount = 0 } = useQuery({
    queryKey: ['my-shop-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('shops').select('*', { count: 'exact', head: true })
        .eq('owner_id', user!.id)
      return count ?? 0
    },
    enabled: !!user,
  })

  function clearError(key: string) {
    if (errors[key]) setErrors(e => { const n = {...e}; delete n[key]; return n })
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setLogoUploading(true)
    try {
      setLogoUrl(await uploadImage(file, user.id, 'logo'))
      setErrors(e => { const n = {...e}; delete n.logo; return n })
    } catch (err: any) {
      const msg = err.message?.includes('Bucket not found')
        ? 'Storage bucket নেই। migration_add_columns.sql রান করুন।'
        : 'আপলোড ব্যর্থ: ' + err.message
      setErrors(e => ({...e, logo: msg}))
    }
    finally { setLogoUploading(false) }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setCoverUploading(true)
    try {
      setCoverUrl(await uploadImage(file, user.id, 'cover'))
      setErrors(e => { const n = {...e}; delete n.cover; return n })
    } catch (err: any) {
      const msg = err.message?.includes('Bucket not found')
        ? 'Storage bucket নেই। migration_add_columns.sql রান করুন।'
        : 'আপলোড ব্যর্থ: ' + err.message
      setErrors(e => ({...e, cover: msg}))
    }
    finally { setCoverUploading(false) }
  }

  function validateStep() {
    const errs: Record<string, string> = {}
    if (step === 1) {
      if (!shopName.trim()) errs.shopName = 'দোকানের নাম দিন'
      if (!categoryId) errs.categoryId = 'বিভাগ বেছে নিন'
    }
    if (step === 2) {
      if (!phone.trim()) errs.phone = 'ফোন নম্বর দিন'
      if (!address.trim()) errs.address = 'ঠিকানা দিন'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function nextStep() {
    if (validateStep()) setStep(s => Math.min(s + 1, 4))
  }

  async function handleSubmit() {
    if (!validateStep()) return
    setSubmitting(true)
    try {
      // Base payload — only columns guaranteed to exist in schema
      const payload: Record<string, any> = {
        owner_id: user.id,
        shop_name: shopName.trim(),
        slug: slug || generateSlug(shopName),
        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        description: description.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        address: address.trim() || null,
        logo: logoUrl || null,
        cover_image: coverUrl || null,
        status: 'pending_approval',
        is_active: true,
      }
      // Extended columns — added via migration_add_columns.sql
      // These are omitted if the column doesn't exist yet (null values just won't be stored)
      if (district.trim())      payload.district          = district.trim()
      if (facebookUrl.trim())   payload.facebook_url      = facebookUrl.trim()
      if (websiteUrl.trim())    payload.website_url       = websiteUrl.trim()
      if (openingHours.trim())  payload.opening_hours     = openingHours.trim()
      if (deliveryAvailable)    payload.delivery_available = true
      if (tags.trim())          payload.tags              = tags.split(',').map(t => t.trim()).filter(Boolean)
      const { data: shopData, error } = await supabase.from('shops').insert(payload).select('id').single()
      if (error) throw error

      // Auto-add template products for the selected category
      const categoryName = categories.find((c: any) => c.id === categoryId)?.name || ''
      const templates = getTemplateProducts(categoryName)
      if (templates.length > 0 && shopData?.id) {
        const products = templates.map((t: any) => ({
          shop_id: shopData.id,
          name: t.name,
          price: t.price,
          stock: t.stock,
          is_active: true,
          is_featured: false,
        }))
        const { error: prodError } = await supabase.from('products').insert(products)
        if (!prodError) {
          toast.success(`আপনার দোকানে ${templates.length}টি পণ্য স্বয়ংক্রিয়ভাবে যোগ হয়েছে! 🎉`)
        }
      }

      navigate('/dashboard/shops', { state: { success: true } })
    } catch (err: any) {
      setErrors({ submit: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // Block if limit reached
  if (myShopCount >= MAX_SHOPS) {
    return (
      <div className="max-w-lg mx-auto py-10 text-center px-4">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">সীমা পূর্ণ হয়েছে</h2>
        <p className="text-gray-500 mb-1">আপনি সর্বোচ্চ <strong>{MAX_SHOPS}টি</strong> দোকান তৈরি করতে পারবেন।</p>
        <p className="text-sm text-gray-400 mb-6">বর্তমানে আপনার {myShopCount}টি দোকান আছে।</p>
        <button onClick={() => navigate('/dashboard/shops')}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
          ← আমার দোকান দেখুন
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-1">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/shops')} className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">➕ নতুন দোকান যোগ করুন</h1>
          <p className="text-xs text-gray-400 mt-0.5">{myShopCount}/{MAX_SHOPS}টি দোকান ব্যবহার হয়েছে</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = step === s.id
          const isDone = step > s.id
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 flex-shrink-0 ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white' : isDone ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                  {isDone ? '✓' : s.id}
                </div>
                <span className="hidden sm:block text-xs font-medium">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">ধাপ {step}: {STEPS[step-1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <>
              <div>
                <Label className="text-xs mb-1.5 block">দোকানের নাম <span className="text-red-500">*</span></Label>
                <Input
                  value={shopName}
                  onChange={e => {
                    const v = e.target.value
                    setShopName(v)
                    // auto-update slug only if user hasn't manually edited it
                    if (!slug || slug === generateSlug(shopName)) {
                      const auto = generateSlug(v)
                      setSlug(auto) // may be empty for pure Bengali — user types manually
                    }
                    clearError('shopName')
                  }}
                  placeholder="যেমন: রহিমের কাপড়ের দোকান"
                />
                {errors.shopName && <p className="text-xs text-red-500 mt-1">{errors.shopName}</p>}
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">
                  URL স্লাগ
                  <span className="text-gray-400 font-normal ml-1">(ইংরেজি হরফে লিখুন)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">/shops/</span>
                  <Input
                    value={slug}
                    onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
                    placeholder="rahim-kaporer-dokan"
                  />
                </div>
                {!slug && shopName && (
                  <p className="text-xs text-amber-500 mt-1">⚠️ নিচে ইংরেজিতে URL স্লাগ লিখুন। যেমন: rahim-kaporer-dokan</p>
                )}
                {slugStatus === 'checking' && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    চেক হচ্ছে...
                  </p>
                )}
                {slugStatus === 'available' && (
                  <p className="text-xs text-green-600 mt-1">✅ পাওয়া যাচ্ছে</p>
                )}
                {slugStatus === 'taken' && (
                  <p className="text-xs text-red-500 mt-1">❌ এই slug ইতিমধ্যে নেওয়া হয়েছে</p>
                )}
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">বিভাগ <span className="text-red-500">*</span></Label>
                <Select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId(''); clearError('categoryId') }}>
                  <option value="">বিভাগ বেছে নিন</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </Select>
                {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
              </div>

              {subcategories.length > 0 && (
                <div>
                  <Label className="text-xs mb-1.5 block">উপ-বিভাগ</Label>
                  <Select value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)}>
                    <option value="">উপ-বিভাগ বেছে নিন</option>
                    {subcategories.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-xs mb-1.5 block">দোকানের বিবরণ</Label>
                <Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="আপনার দোকান সম্পর্কে কিছু লিখুন..." />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">ট্যাগ (কমা দিয়ে আলাদা করুন)</Label>
                <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="কাপড়, শাড়ি, লুঙ্গি" />
              </div>
            </>
          )}

          {/* ── Step 2: Contact ── */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">ফোন নম্বর <span className="text-red-500">*</span></Label>
                  <Input value={phone} onChange={e => { setPhone(e.target.value); clearError('phone') }} placeholder="01XXXXXXXXX" />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">হোয়াটসঅ্যাপ</Label>
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">ঠিকানা <span className="text-red-500">*</span></Label>
                <Textarea rows={2} value={address} onChange={e => { setAddress(e.target.value); clearError('address') }} placeholder="গ্রাম/মহল্লা, উপজেলা" />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">জেলা</Label>
                <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="যেমন: ঢাকা" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1.5 block">ফেসবুক পেইজ</Label>
                  <Input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">ওয়েবসাইট</Label>
                  <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Images ── */}
          {step === 3 && (
            <>
              {/* Logo — square */}
              <div>
                <Label className="text-xs mb-1.5 block">দোকানের লোগো <span className="text-gray-400 font-normal">(বর্গাকার)</span></Label>
                <div className="flex items-start gap-4">
                  <div
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors flex items-center justify-center bg-gray-50 relative flex-shrink-0"
                    onClick={() => logoRef.current?.click()}
                  >
                    {logoUrl
                      ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                      : <div className="text-center px-2"><Upload className="h-6 w-6 mx-auto text-gray-300 mb-1" /><p className="text-xs text-gray-400 leading-tight">ক্লিক করে আপলোড করুন</p></div>
                    }
                    {logoUploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /></div>}
                  </div>
                  <div className="text-xs text-gray-400 mt-2 space-y-1">
                    <p>• PNG, JPG ফরম্যাট</p>
                    <p>• সর্বোচ্চ 5MB</p>
                    <p>• বর্গাকার ছবি ভালো দেখায়</p>
                    {logoUrl && <button onClick={() => setLogoUrl('')} className="text-red-400 hover:text-red-600 text-xs mt-1">× মুছে ফেলুন</button>}
                  </div>
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {errors.logo && <p className="text-xs text-red-500 mt-1">{errors.logo}</p>}
              </div>

              {/* Cover image — wide banner */}
              <div>
                <Label className="text-xs mb-1.5 block">কভার ছবি <span className="text-gray-400 font-normal">(ব্যানার)</span></Label>
                <div
                  className="h-32 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors flex items-center justify-center bg-gray-50 relative"
                  onClick={() => coverRef.current?.click()}
                >
                  {coverUrl
                    ? <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
                    : <div className="text-center"><Upload className="h-7 w-7 mx-auto text-gray-300 mb-1.5" /><p className="text-sm text-gray-400">ব্যানার ছবি আপলোড করুন</p><p className="text-xs text-gray-300 mt-0.5">1200×400 অনুপাত • সর্বোচ্চ 5MB</p></div>
                  }
                  {coverUploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /></div>}
                </div>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                {errors.cover && <p className="text-xs text-red-500 mt-1">{errors.cover}</p>}
                {coverUrl && <button onClick={() => setCoverUrl('')} className="text-xs text-red-400 hover:text-red-600 mt-1">× কভার মুছে ফেলুন</button>}
              </div>
            </>
          )}

          {/* ── Step 4: Schedule ── */}
          {step === 4 && (
            <>
              <div>
                <Label className="text-xs mb-1.5 block">খোলার সময়</Label>
                <Input value={openingHours} onChange={e => setOpeningHours(e.target.value)} placeholder="সকাল ৯টা - রাত ১০টা (শুক্রবার বন্ধ)" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
                <input
                  type="checkbox"
                  id="delivery"
                  checked={deliveryAvailable}
                  onChange={e => setDeliveryAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="delivery" className="text-sm font-medium text-gray-700 cursor-pointer">হোম ডেলিভারি সুবিধা আছে</label>
              </div>

              {deliveryAvailable && (
                <div>
                  <Label className="text-xs mb-1.5 block">সর্বনিম্ন অর্ডার পরিমাণ</Label>
                  <Input value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="যেমন: ৳500" />
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-4 space-y-2 border border-blue-100">
                <p className="text-sm font-semibold text-blue-800">📋 সারসংক্ষেপ</p>
                <p className="text-xs text-blue-700"><strong>নাম:</strong> {shopName}</p>
                <p className="text-xs text-blue-700"><strong>ফোন:</strong> {phone}</p>
                <p className="text-xs text-blue-700"><strong>ঠিকানা:</strong> {address}</p>
                <p className="text-xs text-blue-600 mt-2 italic">দোকান জমা দেওয়ার পর অ্যাডমিন অনুমোদন করলে এটি সক্রিয় হবে।</p>
              </div>

              {errors.submit && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errors.submit}</p>}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        {step > 1
          ? <Button variant="outline" onClick={() => setStep(s => s - 1)}><ArrowLeft className="h-4 w-4" /> আগে</Button>
          : <div />
        }
        {step < 4
          ? <Button onClick={nextStep}>পরবর্তী <ArrowRight className="h-4 w-4" /></Button>
          : <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'জমা হচ্ছে...' : <><CheckCircle className="h-4 w-4" /> দোকান জমা দিন</>}
            </Button>
        }
      </div>
    </div>
  )
}
