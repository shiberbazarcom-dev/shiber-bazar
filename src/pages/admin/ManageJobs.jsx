import { useState } from 'react'
import { useAllJobs, useCreateJob, useUpdateJob, useDeleteJob } from '../../hooks/useJobs'
import toast from 'react-hot-toast'

const JOB_CATEGORIES = [
  'দোকান কর্মী', 'ডেলিভারি রাইডার', 'শিক্ষক', 'ইলেকট্রিশিয়ান',
  'প্লাম্বার', 'ড্রাইভার', 'ফ্রিল্যান্সার', 'নিরাপত্তা রক্ষী',
  'গৃহকর্মী', 'রান্নার কাজ', 'অন্যান্য',
]

const STATUS_LABELS = {
  open:    { label: 'খোলা',   color: 'green' },
  closed:  { label: 'বন্ধ',   color: 'gray'  },
  expired: { label: 'মেয়াদ শেষ', color: 'red' },
}

const EMPTY_FORM = {
  title:           '',
  category:        JOB_CATEGORIES[0],
  company_name:    '',
  salary:          '',
  location:        '',
  description:     '',
  contact_phone:   '',
  whatsapp_number: '',
  expiry_date:     '',
  is_featured:     false,
  is_active:       true,
  status:          'open',
}

export default function ManageJobs() {
  const { data: jobs = [], isLoading } = useAllJobs()
  const createJob = useCreateJob()
  const updateJob = useUpdateJob()
  const deleteJob = useDeleteJob()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [filter, setFilter]     = useState('all') // all | open | closed | expired

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(job) {
    setEditing(job.id)
    setForm({
      title:           job.title,
      category:        job.category,
      company_name:    job.company_name || '',
      salary:          job.salary || '',
      location:        job.location || '',
      description:     job.description || '',
      contact_phone:   job.contact_phone || '',
      whatsapp_number: job.whatsapp_number || '',
      expiry_date:     job.expiry_date || '',
      is_featured:     job.is_featured,
      is_active:       job.is_active,
      status:          job.status,
    })
    setShowForm(true)
  }

  function buildPayload() {
    return {
      title:           form.title.trim(),
      category:        form.category,
      company_name:    form.company_name.trim()    || null,
      salary:          form.salary.trim()          || null,
      location:        form.location.trim()        || null,
      description:     form.description.trim()     || null,
      contact_phone:   form.contact_phone.trim()   || null,
      whatsapp_number: form.whatsapp_number.trim() || null,
      expiry_date:     form.expiry_date            || null,
      is_featured:     form.is_featured,
      is_active:       form.is_active,
      status:          form.status,
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('চাকরির পদবি দিন')
    setSaving(true)
    try {
      const payload = buildPayload()
      if (editing) {
        await updateJob.mutateAsync({ id: editing, ...payload })
        toast.success('চাকরি আপডেট হয়েছে ✅')
      } else {
        await createJob.mutateAsync(payload)
        toast.success('নতুন চাকরি যোগ হয়েছে ✅')
      }
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY_FORM)
    } catch (err) {
      toast.error('সমস্যা হয়েছে: ' + (err?.message || 'অজানা ত্রুটি'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('এই চাকরির পোস্ট মুছে ফেলবেন?')) return
    try {
      await deleteJob.mutateAsync(id)
      toast.success('মুছে ফেলা হয়েছে')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  async function quickStatus(job, status) {
    try {
      await updateJob.mutateAsync({ id: job.id, status, is_active: status === 'open' })
      toast.success('স্ট্যাটাস আপডেট হয়েছে')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  async function toggleFeatured(job) {
    try {
      await updateJob.mutateAsync({ id: job.id, is_featured: !job.is_featured })
      toast.success(job.is_featured ? 'ফিচার্ড সরানো হয়েছে' : 'ফিচার্ড করা হয়েছে ✅')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)
  const counts   = { all: jobs.length, open: jobs.filter(j => j.status==='open').length, closed: jobs.filter(j=>j.status==='closed').length, expired: jobs.filter(j=>j.status==='expired').length }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💼 চাকরির বোর্ড</h1>
          <p className="text-sm text-gray-400 mt-0.5">স্থানীয় চাকরির বিজ্ঞাপন পরিচালনা করুন</p>
        </div>
        <button onClick={openNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
          ➕ নতুন চাকরি
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[['all','সব'],['open','খোলা'],['closed','বন্ধ'],['expired','মেয়াদ শেষ']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {label} <span className="ml-1 opacity-70">({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-gray-800">{editing ? '✏️ চাকরি সম্পাদনা' : '➕ নতুন চাকরি'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-xl">✕</button>
            </div>

            <form id="job-form" onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Title + Category */}
              <div>
                <label className="form-label">পদবি / চাকরির নাম *</label>
                <input required value={form.title} onChange={e => set('title', e.target.value)}
                  className="input" placeholder="যেমন: সেলস ম্যান, ক্যাশিয়ার" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">ক্যাটাগরি *</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
                    {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">বেতন</label>
                  <input value={form.salary} onChange={e => set('salary', e.target.value)}
                    className="input" placeholder="যেমন: ৳ ১৫,০০০" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">প্রতিষ্ঠান / দোকানের নাম</label>
                  <input value={form.company_name} onChange={e => set('company_name', e.target.value)}
                    className="input" placeholder="প্রতিষ্ঠানের নাম" />
                </div>
                <div>
                  <label className="form-label">অবস্থান</label>
                  <input value={form.location} onChange={e => set('location', e.target.value)}
                    className="input" placeholder="এলাকা / ঠিকানা" />
                </div>
              </div>

              <div>
                <label className="form-label">বিবরণ</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  className="input resize-none" rows={3} placeholder="চাকরির বিস্তারিত তথ্য লিখুন" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">যোগাযোগ নম্বর</label>
                  <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                    className="input" placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="form-label">WhatsApp নম্বর</label>
                  <input value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)}
                    className="input" placeholder="8801XXXXXXXXX" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">মেয়াদ শেষ</label>
                  <input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}
                    className="input" />
                </div>
                <div>
                  <label className="form-label">স্ট্যাটাস</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                    <option value="open">খোলা</option>
                    <option value="closed">বন্ধ</option>
                    <option value="expired">মেয়াদ শেষ</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)}
                    className="w-4 h-4 rounded accent-yellow-500" />
                  <span className="text-sm text-gray-700">⭐ ফিচার্ড করুন</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">সক্রিয় রাখুন</span>
                </label>
              </div>
            </form>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0 bg-white">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                বাতিল
              </button>
              <button type="submit" form="job-form" disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                {saving ? '⏳...' : editing ? 'আপডেট করুন' : 'তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job list */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">লোড হচ্ছে...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-5xl mb-3">💼</p>
          <p className="text-gray-500 mb-4">কোনো চাকরি নেই</p>
          <button onClick={openNew} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
            প্রথম চাকরি যোগ করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => {
            const st = STATUS_LABELS[job.status] || STATUS_LABELS.open
            const statusColor = { green: 'bg-green-50 text-green-700', gray: 'bg-gray-100 text-gray-500', red: 'bg-red-50 text-red-600' }[st.color]
            return (
              <div key={job.id} className={`bg-white rounded-xl border p-4 ${job.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${job.is_featured ? 'bg-amber-50' : 'bg-blue-50'}`}>
                    {job.is_featured ? '⭐' : '💼'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm">{job.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{st.label}</span>
                      {job.is_featured && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">ফিচার্ড</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-400">
                      <span>📋 {job.category}</span>
                      {job.company_name && <><span>·</span><span>🏢 {job.company_name}</span></>}
                      {job.salary       && <><span>·</span><span>💰 {job.salary}</span></>}
                      {job.location     && <><span>·</span><span>📍 {job.location}</span></>}
                      {job.expiry_date  && <><span>·</span><span>📅 {job.expiry_date}</span></>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleFeatured(job)} title="ফিচার্ড টগল"
                      className={`p-1.5 rounded-lg transition-colors text-sm ${job.is_featured ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:bg-gray-50'}`}>
                      ⭐
                    </button>
                    {job.status === 'open'
                      ? <button onClick={() => quickStatus(job, 'closed')}
                          className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">
                          বন্ধ
                        </button>
                      : <button onClick={() => quickStatus(job, 'open')}
                          className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium">
                          খুলুন
                        </button>
                    }
                    <button onClick={() => openEdit(job)}
                      className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(job.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
