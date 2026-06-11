import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useServiceCategories, useSubmitService } from '../../hooks/useServices'
import { SERVICE_CATEGORIES, CATEGORY_EXTRA_FIELDS } from '../../data/serviceCategories'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'

export default function SubmitService() {
  const navigate = useNavigate()
  const { data: dbCats = [] } = useServiceCategories()
  const cats = dbCats.length ? dbCats : SERVICE_CATEGORIES

  const submitService = useSubmitService()

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    phone: '',
    description: '',
    location: '',
  })
  const [extra, setExtra] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setEx = (k, v) => setExtra(e => ({ ...e, [k]: v }))

  const selectedCat = cats.find(c => c.id === form.category_id || c.slug === form.category_id)
  const extraFields = selectedCat ? (CATEGORY_EXTRA_FIELDS[selectedCat.slug] || []) : []

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category_id) return toast.error('সেবার ধরন বেছে নিন')
    if (!form.name.trim()) return toast.error('নাম লিখুন')
    if (!form.phone.trim()) return toast.error('মোবাইল নম্বর লিখুন')
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) return toast.error('সঠিক মোবাইল নম্বর দিন')

    setUploading(true)
    let image_url = null

    try {
      // Upload image if provided
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `services/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('shop-images')
          .upload(path, imageFile, { upsert: true })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('shop-images').getPublicUrl(path)
          image_url = urlData.publicUrl
        }
      }

      // Find category_id from DB or use selected cat id
      let category_id = form.category_id
      if (dbCats.length && !category_id.includes('-')) {
        // It's a slug, find the DB id
        const match = dbCats.find(c => c.slug === category_id || c.id === category_id)
        category_id = match?.id || category_id
      }

      await submitService.mutateAsync({
        category_id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        image_url,
        extra: Object.fromEntries(Object.entries(extra).filter(([, v]) => v)),
      })

      toast.success('সেবা জমা দেওয়া হয়েছে! অনুমোদনের পরে প্রকাশিত হবে।')
      navigate('/dashboard/my-services')
    } catch (err) {
      toast.error(err.message || 'সমস্যা হয়েছে')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container-app py-6 pb-28 md:pb-10 max-w-xl mx-auto">
      <SEO title="সেবা যোগ করুন" noindex />

      {/* Header */}
      <div className="mb-6">
        <Link to="/services" className="text-sm text-blue-600 hover:underline">← স্থানীয় সেবাসমূহ</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">সেবা যোগ করুন</h1>
        <p className="text-sm text-gray-500 mt-1">আপনার সেবা লিস্ট করুন — অনুমোদনের পরে প্রকাশিত হবে</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">সেবার ধরন *</label>
          <select
            value={form.category_id}
            onChange={e => { set('category_id', e.target.value); setExtra({}) }}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
            required>
            <option value="">বেছে নিন...</option>
            {cats.map(c => (
              <option key={c.slug} value={c.id || c.slug}>
                {c.icon} {c.name_bn}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">আপনার নাম *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="আপনার পুরো নাম"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">মোবাইল নম্বর *</label>
          <input
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="01XXXXXXXXX"
            type="tel"
            maxLength={11}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">এলাকা / ঠিকানা</label>
          <input
            value={form.location}
            onChange={e => set('location', e.target.value)}
            placeholder="শিবের বাজার, সিলেট"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">বিস্তারিত বিবরণ</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="আপনার সেবা সম্পর্কে কিছু লিখুন..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>

        {/* Category-specific extra fields */}
        {extraFields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={extra[field.key] || ''}
                onChange={e => setEx(field.key, e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white">
                <option value="">বেছে নিন...</option>
                {field.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                value={extra[field.key] || ''}
                onChange={e => setEx(field.key, e.target.value)}
                placeholder={field.placeholder || ''}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            )}
          </div>
        ))}

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">ছবি (ঐচ্ছিক)</label>
          {imagePreview && (
            <img src={imagePreview} alt="preview" className="w-full h-32 object-cover rounded-xl mb-2" />
          )}
          <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 cursor-pointer hover:border-blue-300 hover:text-blue-500 transition-colors">
            📷 ছবি আপলোড করুন
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading || submitService.isPending}
          className="w-full py-3.5 text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-opacity"
          style={{ background: BLUE }}>
          {uploading || submitService.isPending ? '⏳ জমা দেওয়া হচ্ছে...' : '✅ সেবা জমা দিন'}
        </button>

        <p className="text-center text-xs text-gray-400">
          অনুমোদনের পরে আপনার সেবা সবার কাছে দৃশ্যমান হবে
        </p>
      </form>
    </div>
  )
}
