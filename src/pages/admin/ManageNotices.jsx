import { useState } from 'react'
import {
  useAllNotices, useCreateNotice, useUpdateNotice, useDeleteNotice,
} from '../../hooks/useNotices'
import toast from 'react-hot-toast'

const BLUE = '#2563EB'

const EMPTY = {
  title:          '',
  description:    '',
  publish_date:   new Date().toISOString().slice(0, 10),
  expiry_date:    '',
  attachment_url: '',
  is_featured:    false,
  is_active:      true,
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ManageNotices() {
  const { data: notices = [], isLoading } = useAllNotices()
  const createNotice = useCreateNotice()
  const updateNotice = useUpdateNotice()
  const deleteNotice = useDeleteNotice()

  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState(EMPTY)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function openNew() {
    setEditId(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(n) {
    setEditId(n.id)
    setForm({
      title:          n.title,
      description:    n.description || '',
      publish_date:   n.publish_date || '',
      expiry_date:    n.expiry_date  || '',
      attachment_url: n.attachment_url || '',
      is_featured:    n.is_featured,
      is_active:      n.is_active,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('শিরোনাম দিন')
    const payload = {
      ...form,
      expiry_date:    form.expiry_date   || null,
      attachment_url: form.attachment_url || null,
    }
    try {
      if (editId) {
        await updateNotice.mutateAsync({ id: editId, ...payload })
        toast.success('নোটিস আপডেট হয়েছে')
      } else {
        await createNotice.mutateAsync(payload)
        toast.success('নোটিস যোগ হয়েছে')
      }
      closeForm()
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  async function toggleActive(n) {
    try {
      await updateNotice.mutateAsync({ id: n.id, is_active: !n.is_active })
      toast.success(n.is_active ? 'নিষ্ক্রিয় করা হয়েছে' : 'সক্রিয় করা হয়েছে')
    } catch { toast.error('সমস্যা হয়েছে') }
  }

  async function handleDelete(n) {
    if (!window.confirm(`"${n.title}" মুছে ফেলবেন?`)) return
    try {
      await deleteNotice.mutateAsync(n.id)
      toast.success('মুছে ফেলা হয়েছে')
    } catch { toast.error('মুছতে সমস্যা হয়েছে') }
  }

  const inp = 'w-full h-11 px-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400'
  const pending = createNotice.isPending || updateNotice.isPending

  const today = new Date().toISOString().slice(0, 10)
  const expired = (n) => n.expiry_date && n.expiry_date < today

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">📋 ইউনিয়ন নোটিস বোর্ড</h1>
          <p className="text-xs text-gray-400 mt-0.5">হাটখোলা ইউনিয়ন পরিষদের সরকারি নোটিস</p>
        </div>
        <button onClick={openNew}
          className="px-4 h-10 rounded-xl text-sm font-bold text-white active:scale-95 transition-all"
          style={{ background: BLUE }}>
          + নতুন নোটিস
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <p className="text-4xl mb-3">📋</p>
          কোনো নোটিস নেই — "+ নতুন নোটিস" চাপুন
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id}
              className={`flex gap-3 p-4 rounded-2xl border transition-all ${
                !n.is_active || expired(n)
                  ? 'border-gray-100 bg-gray-50 opacity-60'
                  : n.is_featured
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-gray-100 bg-white'
              }`}>
              {/* Badge column */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                {n.is_featured && <span className="text-xs bg-amber-400 text-white font-bold px-1.5 py-0.5 rounded-full">⭐</span>}
                {expired(n) && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">মেয়াদ শেষ</span>}
                {!n.is_active && <span className="text-[10px] bg-gray-200 text-gray-500 font-bold px-1.5 py-0.5 rounded-full">বন্ধ</span>}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                {n.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1.5">
                  <span className="text-[11px] text-gray-400">প্রকাশ: {fmtDate(n.publish_date)}</span>
                  {n.expiry_date && (
                    <span className={`text-[11px] ${expired(n) ? 'text-red-500' : 'text-gray-400'}`}>
                      মেয়াদ: {fmtDate(n.expiry_date)}
                    </span>
                  )}
                  {n.attachment_url && (
                    <a href={n.attachment_url} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline">📎 সংযুক্তি</a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => toggleActive(n)} title={n.is_active ? 'বন্ধ করুন' : 'চালু করুন'}
                  className={`w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors ${
                    n.is_active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}>
                  {n.is_active ? '👁️' : '🚫'}
                </button>
                <button onClick={() => openEdit(n)}
                  className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm flex items-center justify-center transition-colors">
                  ✏️
                </button>
                <button onClick={() => handleDelete(n)}
                  className="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm flex items-center justify-center transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ FORM MODAL ══ */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
          <form onSubmit={handleSubmit}
            className="relative w-full sm:max-w-lg bg-white rounded-t-[20px] sm:rounded-[20px] shadow-2xl max-h-[92vh] overflow-y-auto p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900">
                {editId ? 'নোটিস সম্পাদনা' : 'নতুন নোটিস যোগ'}
              </h3>
              <button type="button" onClick={closeForm}
                className="w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100">✕</button>
            </div>

            <input className={inp} placeholder="নোটিসের শিরোনাম *"
              value={form.title} onChange={e => set('title', e.target.value)} />

            <textarea rows={3} placeholder="বিস্তারিত বিবরণ (ঐচ্ছিক)"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 resize-none"
              value={form.description} onChange={e => set('description', e.target.value)} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">প্রকাশের তারিখ *</label>
                <input type="date" className={inp}
                  value={form.publish_date} onChange={e => set('publish_date', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">মেয়াদ শেষ (ঐচ্ছিক)</label>
                <input type="date" className={inp}
                  value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
              </div>
            </div>

            <input className={inp} placeholder="সংযুক্তির লিংক (PDF URL ঐচ্ছিক)"
              value={form.attachment_url} onChange={e => set('attachment_url', e.target.value)} />

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => set('is_active', e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                সক্রিয়
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_featured}
                  onChange={e => set('is_featured', e.target.checked)}
                  className="w-4 h-4 accent-amber-500" />
                ⭐ বিশেষ নোটিস
              </label>
            </div>

            <button type="submit" disabled={pending}
              className="w-full h-12 rounded-2xl text-sm font-bold text-white disabled:opacity-60 active:scale-[0.98] transition-all"
              style={{ background: BLUE }}>
              {pending ? 'সংরক্ষণ হচ্ছে...' : editId ? '✓ আপডেট করুন' : '✓ নোটিস যোগ করুন'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
