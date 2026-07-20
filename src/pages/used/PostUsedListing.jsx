import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  useCreateListing, useUpdateListing, uploadListingImages,
  USED_CATEGORIES, CONDITION_LABELS,
} from '../../hooks/useUsedListings'
import toast from 'react-hot-toast'

const MAX_IMAGES = 4

export default function PostUsedListing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const createListing = useCreateListing()
  const updateListing = useUpdateListing()

  const [form, setForm] = useState({
    title: '', description: '', price: '', negotiable: false,
    category: USED_CATEGORIES[0], condition: 'used',
    location: '', contact_phone: '', whatsapp_number: '',
  })
  const [existingImages, setExistingImages] = useState([])
  const [newFiles, setNewFiles] = useState([])   // File objects (not yet uploaded)
  const [previews, setPreviews] = useState([])   // object URLs for newFiles
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(!!editId)

  // Prefill contact numbers from profile so most users never type them
  useEffect(() => {
    if (editId || !profile?.phone) return
    setForm(f => ({
      ...f,
      contact_phone:   f.contact_phone   || profile.phone,
      whatsapp_number: f.whatsapp_number || profile.phone,
    }))
  }, [profile?.phone, editId])

  // Edit mode: load own listing
  useEffect(() => {
    if (!editId || !user) return
    supabase
      .from('used_listings')
      .select('*')
      .eq('id', editId)
      .eq('seller_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('বিজ্ঞাপনটি পাওয়া যায়নি')
          navigate('/dashboard/my-listings', { replace: true })
          return
        }
        setForm({
          title: data.title || '',
          description: data.description || '',
          price: data.price ?? '',
          negotiable: !!data.negotiable,
          category: data.category || USED_CATEGORIES[0],
          condition: data.condition || 'used',
          location: data.location || '',
          contact_phone: data.contact_phone || '',
          whatsapp_number: data.whatsapp_number || '',
        })
        setExistingImages(Array.isArray(data.images) ? data.images : [])
        setLoadingEdit(false)
      })
  }, [editId, user])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    const room = MAX_IMAGES - existingImages.length - newFiles.length
    const accepted = files.slice(0, room)
    if (files.length > room) toast.error(`সর্বোচ্চ ${MAX_IMAGES}টি ছবি দেওয়া যাবে`)
    setNewFiles(prev => [...prev, ...accepted])
    setPreviews(prev => [...prev, ...accepted.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removeNewFile(i) {
    URL.revokeObjectURL(previews[i])
    setNewFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function removeExisting(i) {
    setExistingImages(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim())        { toast.error('শিরোনাম দিন'); return }
    if (!form.price || Number(form.price) < 0) { toast.error('দাম দিন'); return }
    if (!/^01\d{9}$/.test(form.contact_phone.trim())) { toast.error('সঠিক ফোন নম্বর দিন (01XXXXXXXXX)'); return }
    if (existingImages.length + newFiles.length === 0) { toast.error('কমপক্ষে ১টি ছবি দিন'); return }

    setSaving(true)
    try {
      const uploaded = newFiles.length > 0 ? await uploadListingImages(newFiles, user.id) : []
      const payload = {
        title:           form.title.trim(),
        description:     form.description.trim() || null,
        price:           Number(form.price),
        negotiable:      form.negotiable,
        category:        form.category,
        condition:       form.condition,
        location:        form.location.trim() || null,
        contact_phone:   form.contact_phone.trim(),
        whatsapp_number: form.whatsapp_number.trim() || null,
        images:          [...existingImages, ...uploaded],
      }

      if (editId) {
        // Edits go back to review
        await updateListing.mutateAsync({ id: editId, ...payload, status: 'pending', reject_reason: null })
        toast.success('বিজ্ঞাপন আপডেট হয়েছে — আবার রিভিউয়ের পর প্রকাশ হবে')
      } else {
        await createListing.mutateAsync({ ...payload, seller_id: user.id })
        toast.success('বিজ্ঞাপন জমা হয়েছে! অ্যাডমিন অনুমোদনের পর প্রকাশ হবে')
      }
      navigate('/dashboard/my-listings')
    } catch (err) {
      console.error('[PostUsedListing]', err)
      if (err?.message?.includes('daily_limit_reached')) {
        toast.error('একদিনে সর্বোচ্চ ৫টি বিজ্ঞাপন দেওয়া যায়')
      } else {
        toast.error('জমা দেওয়া যায়নি: ' + (err?.message || ''))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingEdit) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">লোড হচ্ছে...</div>
  }

  const totalImages = existingImages.length + newFiles.length

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Link to="/used" className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">← পুরাতন বাজার</Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-3">
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            {editId ? '✏️ বিজ্ঞাপন এডিট করুন' : '♻️ বিজ্ঞাপন দিন'}
          </h1>
          <p className="text-sm text-gray-400 mb-5">
            {editId ? 'পরিবর্তনের পর আবার অ্যাডমিন রিভিউ হবে' : 'অ্যাডমিন অনুমোদনের পর বিজ্ঞাপন প্রকাশ হবে — সম্পূর্ণ ফ্রি'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="শিরোনাম *">
              <input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={80}
                placeholder="যেমন: HP ল্যাপটপ Core i5, ৮ জিবি র‍্যাম"
                className="input w-full" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="ক্যাটাগরি *">
                <select value={form.category} onChange={e => set('category', e.target.value)} className="input w-full">
                  {USED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="কন্ডিশন *">
                <select value={form.condition} onChange={e => set('condition', e.target.value)} className="input w-full">
                  {Object.entries(CONDITION_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <Field label="দাম (৳) *">
                <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} required
                  placeholder="15000" className="input w-full" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-gray-600 pb-2.5 cursor-pointer">
                <input type="checkbox" checked={form.negotiable} onChange={e => set('negotiable', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600" />
                দাম আলোচনা সাপেক্ষ
              </label>
            </div>

            <Field label="বিবরণ">
              <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                maxLength={1000}
                placeholder="পণ্যের অবস্থা, কতদিন ব্যবহার হয়েছে, বিক্রির কারণ ইত্যাদি লিখুন..."
                className="input w-full resize-none" />
            </Field>

            <Field label="এলাকা">
              <input value={form.location} onChange={e => set('location', e.target.value)} maxLength={60}
                placeholder="যেমন: শিবের বাজার, হাটখোলা"
                className="input w-full" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="ফোন নম্বর *">
                <input type="tel" value={form.contact_phone}
                  onChange={e => set('contact_phone', e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                  required placeholder="01XXXXXXXXX" className="input w-full" />
              </Field>
              <Field label="WhatsApp (ঐচ্ছিক)">
                <input type="tel" value={form.whatsapp_number}
                  onChange={e => set('whatsapp_number', e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                  placeholder="01XXXXXXXXX" className="input w-full" />
              </Field>
            </div>

            {/* Images */}
            <Field label={`ছবি * (সর্বোচ্চ ${MAX_IMAGES}টি)`}>
              <div className="flex flex-wrap gap-2">
                {existingImages.map((url, i) => (
                  <div key={`ex-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExisting(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs leading-none">✕</button>
                  </div>
                ))}
                {previews.map((url, i) => (
                  <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeNewFile(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs leading-none">✕</button>
                  </div>
                ))}
                {totalImages < MAX_IMAGES && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-emerald-400 hover:text-emerald-500 transition-colors">
                    <span className="text-xl">📷</span>
                    <span className="text-[10px]">যোগ করুন</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
                  </label>
                )}
              </div>
            </Field>

            <button type="submit" disabled={saving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors">
              {saving ? '⏳ জমা হচ্ছে...' : editId ? '✅ আপডেট করুন' : '✅ বিজ্ঞাপন জমা দিন'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 block">{label}</label>
      {children}
    </div>
  )
}
