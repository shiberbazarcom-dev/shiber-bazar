import { useState, useRef } from 'react'
import { useAllAds, useCreateAd, useUpdateAd, useDeleteAd } from '../../hooks/useAds'
import { uploadImage } from '../../lib/supabase'
import { compressImage, validateFileSize } from '../../lib/compressImage'
import toast from 'react-hot-toast'

const GREEN = '#2563EB'

const EMPTY_FORM = {
  title:       '',
  description: '',
  image_url:   '',
  target_url:  '',
  ad_type:     'banner',
  is_active:   true,
  sort_order:  0,
  start_date:  '',
  end_date:    '',
}

const AD_TYPE_LABELS = { banner: '🖼️ ব্যানার', sidebar: '📌 সাইডবার', popup: '🪟 পপআপ' }

/* ── Recommended size & height per type ── */
const AD_TYPE_SPECS = {
  banner:  { label: '🖼️ ব্যানার',  size: '1200 × 300 px',  height: 'h-28',  hint: 'প্রশস্ত আনুভূমিক ব্যানার' },
  sidebar: { label: '📌 সাইডবার', size: '300 × 600 px',   height: 'h-48',  hint: 'লম্বা পার্শ্ব বিজ্ঞাপন' },
  popup:   { label: '🪟 পপআপ',    size: '600 × 400 px',   height: 'h-40',  hint: 'মাঝারি পপআপ উইন্ডো' },
}

export default function ManageAds() {
  const { data: ads = [], isLoading } = useAllAds()
  const createAd  = useCreateAd()
  const updateAd  = useUpdateAd()
  const deleteAd  = useDeleteAd()

  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [uploading, setUploading]   = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const fileRef = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const spec = AD_TYPE_SPECS[form.ad_type] || AD_TYPE_SPECS.banner

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setPreviewUrl('')
    setShowForm(true)
  }

  const openEdit = (ad) => {
    setEditing(ad.id)
    setForm({
      title:       ad.title,
      description: ad.description || '',
      image_url:   ad.image_url || '',
      target_url:  ad.target_url || '',
      ad_type:     ad.ad_type,
      is_active:   ad.is_active,
      sort_order:  ad.sort_order,
      start_date:  ad.start_date || '',
      end_date:    ad.end_date || '',
    })
    setPreviewUrl(ad.image_url || '')
    setShowForm(true)
  }

  /* ── Image file upload — tries 'ads' bucket, falls back to 'shops' ── */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const check = validateFileSize(file, 5)
    if (!check.ok) return toast.error(check.message)
    const compressed = await compressImage(file)

    setPreviewUrl(URL.createObjectURL(compressed))
    setUploading(true)
    try {
      let url
      try {
        url = await uploadImage(compressed, 'ads')
      } catch {
        // 'ads' bucket not created yet — use 'shops' bucket as fallback
        url = await uploadImage(compressed, 'shops')
      }
      set('image_url', url)
      toast.success('ছবি আপলোড হয়েছে ✅')
    } catch (err) {
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে: ' + (err.message || ''))
      setPreviewUrl('')
      set('image_url', '')
    } finally {
      setUploading(false)
    }
  }

  /* ── Sanitise form before sending to Supabase ── */
  function buildPayload() {
    return {
      title:       form.title.trim(),
      description: form.description.trim() || null,
      image_url:   form.image_url   || null,
      target_url:  form.target_url.trim() || null,
      ad_type:     form.ad_type,
      is_active:   form.is_active,
      sort_order:  Number(form.sort_order) || 0,
      start_date:  form.start_date || null,
      end_date:    form.end_date   || null,
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('বিজ্ঞাপনের শিরোনাম দিন')
    try {
      const payload = buildPayload()
      if (editing) {
        await updateAd.mutateAsync({ id: editing, ...payload })
        toast.success('বিজ্ঞাপন আপডেট হয়েছে ✅')
      } else {
        await createAd.mutateAsync(payload)
        toast.success('নতুন বিজ্ঞাপন তৈরি হয়েছে ✅')
      }
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      setPreviewUrl('')
    } catch (err) {
      console.error('Ad save error:', err)
      const msg = err?.message || ''
      if (msg.includes('column') && msg.includes('does not exist')) {
        toast.error('Supabase এ migration_ads.sql রান করুন — নতুন column নেই')
      } else if (msg.includes('violates') || msg.includes('policy')) {
        toast.error('Permission নেই — RLS policy চেক করুন')
      } else if (msg.includes('invalid input') && msg.includes('date')) {
        toast.error('তারিখ ফরম্যাট ভুল')
      } else {
        toast.error('সমস্যা হয়েছে: ' + (msg || 'অজানা ত্রুটি'))
      }
    }
  }

  const toggleActive = async (ad) => {
    try {
      await updateAd.mutateAsync({ id: ad.id, is_active: !ad.is_active })
      toast.success(ad.is_active ? 'বিজ্ঞাপন বন্ধ করা হয়েছে' : 'বিজ্ঞাপন চালু করা হয়েছে ✅')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('এই বিজ্ঞাপন মুছে ফেলবেন?')) return
    try {
      await deleteAd.mutateAsync(id)
      toast.success('বিজ্ঞাপন মুছে ফেলা হয়েছে')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  const isPending = createAd.isPending || updateAd.isPending

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📢 বিজ্ঞাপন ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-400 mt-0.5">মোট {ads.length} টি বিজ্ঞাপন</p>
        </div>
        <button onClick={openNew}
          className="text-sm px-4 py-2 text-white rounded-xl font-medium"
          style={{ background: GREEN }}>
          ➕ নতুন বিজ্ঞাপন
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
            {/* Sticky header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-gray-800 text-base">
                {editing ? '✏️ বিজ্ঞাপন সম্পাদনা' : '➕ নতুন বিজ্ঞাপন'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">✕</button>
            </div>

            <form id="ad-form" onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="form-label">শিরোনাম *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)}
                  className="input" placeholder="বিজ্ঞাপনের নাম" />
              </div>

              {/* Description */}
              <div>
                <label className="form-label">বিবরণ <span className="text-gray-400 font-normal">(ঐচ্ছিক)</span></label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  className="input resize-none" rows={2}
                  placeholder="বিজ্ঞাপনের সংক্ষিপ্ত বিবরণ (ব্যানারে দেখাবে)" />
              </div>

              {/* Ad Type — pick FIRST so size hint shows before upload */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">ধরন</label>
                  <select value={form.ad_type}
                    onChange={e => { set('ad_type', e.target.value); setPreviewUrl(''); set('image_url', '') }}
                    className="input">
                    {Object.entries(AD_TYPE_SPECS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">ক্রম নম্বর</label>
                  <input type="number" value={form.sort_order}
                    onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
                    className="input" min="0" />
                </div>
              </div>

              {/* Size hint */}
              <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-xl text-xs text-blue-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>{spec.label}</strong> — প্রস্তাবিত আকার: <strong>{spec.size}</strong> ({spec.hint})
                </span>
              </div>

              {/* Image upload */}
              <div>
                <label className="form-label">বিজ্ঞাপনের ছবি</label>

                {/* Upload zone */}
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className={`relative w-full ${spec.height} border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden flex items-center justify-center
                    ${uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-blue-50'}`}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      {uploading ? (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                          <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center transition-all group z-10">
                          <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 bg-black/60 px-3 py-1.5 rounded-lg">
                            ✏️ ছবি পরিবর্তন করুন
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-400 pointer-events-none">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">ছবি আপলোড করুন</p>
                      <p className="text-xs text-gray-400">{spec.size} · JPG, PNG, WebP · সর্বোচ্চ ৫ MB</p>
                    </div>
                  )}
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {uploading && (
                  <p className="text-xs text-blue-600 mt-1.5 text-center">⏳ ছবি আপলোড হচ্ছে...</p>
                )}
              </div>

              {/* Target URL */}
              <div>
                <label className="form-label">টার্গেট URL (ক্লিক করলে যাবে)</label>
                <input value={form.target_url} onChange={e => set('target_url', e.target.value)}
                  className="input" placeholder="https://example.com" />
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">শুরুর তারিখ</label>
                  <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                    className="input" />
                </div>
                <div>
                  <label className="form-label">শেষের তারিখ</label>
                  <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                    className="input" />
                </div>
              </div>
              <p className="text-xs text-gray-400">তারিখ খালি রাখলে মেয়াদ অসীম থাকবে</p>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => set('is_active', e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">সক্রিয় রাখুন</span>
              </label>

            </form>

            {/* Sticky footer buttons */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                বাতিল
              </button>
              <button
                type="submit"
                form="ad-form"
                disabled={isPending}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ background: GREEN }}>
                {isPending ? '⏳...' : editing ? 'আপডেট করুন' : 'তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ads list */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-5xl mb-3">📢</p>
          <p className="text-gray-500 mb-4">কোনো বিজ্ঞাপন নেই</p>
          <button onClick={openNew} className="text-sm px-5 py-2.5 text-white rounded-xl"
            style={{ background: GREEN }}>
            প্রথম বিজ্ঞাপন তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <div key={ad.id} className={`bg-white rounded-2xl border overflow-hidden flex items-center gap-4 p-4 ${
              ad.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'
            }`}>
              {/* Preview */}
              <div className="w-20 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {ad.image_url
                  ? <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📢</div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{ad.title}</p>
                {ad.description && <p className="text-xs text-gray-500 truncate mt-0.5">{ad.description}</p>}
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400">{AD_TYPE_LABELS[ad.ad_type]}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">ক্রম: {ad.sort_order}</span>
                  {ad.start_date && <span className="text-xs text-gray-400">📅 {ad.start_date} → {ad.end_date || '∞'}</span>}
                  {ad.target_url && (
                    <>
                      <span className="text-gray-200">·</span>
                      <a href={ad.target_url} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-500 truncate max-w-[120px] hover:underline">{ad.target_url}</a>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle active */}
                <button onClick={() => toggleActive(ad)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    ad.is_active
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {ad.is_active ? '✅ চালু' : '⏸ বন্ধ'}
                </button>
                <button onClick={() => openEdit(ad)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium">
                  ✏️ সম্পাদনা
                </button>
                <button onClick={() => handleDelete(ad.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium">
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
