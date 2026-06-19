import { useState, useMemo } from 'react'
import {
  useDirectoryCategories, useDirectoryEntries,
  useSaveDirectoryEntry, useDeleteDirectoryEntry, entryMatches,
} from '../../hooks/useServiceDirectory'
import { uploadImage } from '../../lib/supabase'
import toast from 'react-hot-toast'

const BLUE = 'var(--primary)'

const EMPTY = {
  full_name: '', phone_number: '', address: '',
  description: '', additional_info: '', photo_url: '', is_active: true, is_verified: false,
}

/* ═══════════════════════════════════════════════════════
   ADMIN — সেবা ডিরেক্টরি (Local Services Directory CRUD)
   Super admin only. Independent of shop/product/order admin.
═══════════════════════════════════════════════════════ */
export default function ServiceDirectory() {
  const { data: categories = [] } = useDirectoryCategories()
  const [catId, setCatId] = useState(null)
  const activeCat = categories.find(c => c.id === (catId ?? categories[0]?.id))

  const { data: entries = [], isLoading } = useDirectoryEntries(activeCat?.id, { includeInactive: true })
  const saveEntry = useSaveDirectoryEntry()
  const deleteEntry = useDeleteDirectoryEntry()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [uploading, setUploading] = useState(false)

  const filtered = useMemo(() => entries.filter(e => entryMatches(e, search)), [entries, search])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function openAdd() {
    setForm(EMPTY); setEditId(null); setModalOpen(true)
  }
  function openEdit(e) {
    setForm({
      full_name: e.full_name || '', phone_number: e.phone_number || '',
      address: e.address || '', description: e.description || '',
      additional_info: e.additional_info || '', photo_url: e.photo_url || '',
      is_active: e.is_active, is_verified: !!e.is_verified,
    })
    setEditId(e.id); setModalOpen(true)
  }

  async function handlePhoto(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('ছবি সর্বোচ্চ ২ MB হতে পারবে')
    setUploading(true)
    try {
      const url = await uploadImage(file)
      set('photo_url', url)
    } catch {
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে')
    } finally {
      setUploading(false)
      ev.target.value = ''
    }
  }

  async function handleSave(ev) {
    ev.preventDefault()
    if (!form.full_name.trim()) return toast.error('নাম দিন')
    if (!form.phone_number.trim()) return toast.error('মোবাইল নম্বর দিন')
    try {
      await saveEntry.mutateAsync({
        ...(editId ? { id: editId } : {}),
        ...form,
        category_id: activeCat.id,
      })
      toast.success(editId ? 'আপডেট হয়েছে' : 'যোগ হয়েছে')
      setModalOpen(false)
    } catch {
      toast.error('সংরক্ষণ ব্যর্থ হয়েছে')
    }
  }

  async function toggleActive(e) {
    try {
      await saveEntry.mutateAsync({ id: e.id, is_active: !e.is_active })
      toast.success(e.is_active ? 'নিষ্ক্রিয় করা হয়েছে' : 'সক্রিয় করা হয়েছে')
    } catch { toast.error('সমস্যা হয়েছে') }
  }

  async function handleDelete(e) {
    if (!window.confirm(`"${e.full_name}" মুছে ফেলবেন?`)) return
    try {
      await deleteEntry.mutateAsync(e.id)
      toast.success('মুছে ফেলা হয়েছে')
    } catch { toast.error('মুছতে সমস্যা হয়েছে') }
  }

  const inputCls = 'w-full h-11 px-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400'

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">📒 সেবা ডিরেক্টরি</h1>
          <p className="text-xs text-gray-400 mt-0.5">স্থানীয় সেবাসমূহ — শুধুমাত্র অ্যাডমিন পরিচালিত</p>
        </div>
        <button onClick={openAdd} disabled={!activeCat}
          className="px-4 h-10 rounded-xl text-sm font-bold text-white disabled:opacity-50 active:scale-95 transition-all"
          style={{ background: BLUE }}>
          + নতুন যোগ করুন
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
        {categories.map(c => (
          <button key={c.id} onClick={() => setCatId(c.id)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
              activeCat?.id === c.id ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={activeCat?.id === c.id ? { background: BLUE } : {}}>
            {c.icon} {c.name_bn}
          </button>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ আগে Supabase-এ <b>service_categories</b> ও <b>service_directory</b> টেবিল তৈরি করুন (SQL দেওয়া হয়েছে)।
        </div>
      )}

      {/* Search */}
      {activeCat && (
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="নাম বা নম্বর খুঁজুন..."
          className="w-full sm:w-72 h-10 px-3.5 mb-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400" />
      )}

      {/* Entries list */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(e => (
            <div key={e.id}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                e.is_active ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
              }`}>
              {e.photo_url
                ? <img src={e.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                : <span className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 font-bold flex items-center justify-center flex-shrink-0">{(e.full_name || '?')[0]}</span>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">
                  {e.full_name}
                  {e.is_verified && <span className="ml-1 text-purple-500 text-xs">✔</span>}
                  {!e.is_active && <span className="ml-2 text-[10px] font-bold text-gray-400">(নিষ্ক্রিয়)</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {e.phone_number}{e.additional_info ? ` • ${e.additional_info}` : ''}{e.address ? ` • ${e.address}` : ''}
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => toggleActive(e)} title={e.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                  className={`w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-colors ${
                    e.is_active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}>
                  {e.is_active ? '👁️' : '🚫'}
                </button>
                <button onClick={() => openEdit(e)} title="সম্পাদনা"
                  className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm flex items-center justify-center transition-colors">✏️</button>
                <button onClick={() => handleDelete(e)} title="মুছুন"
                  className="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm flex items-center justify-center transition-colors">🗑️</button>
              </div>
            </div>
          ))}
          {activeCat && filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">কোনো তথ্য নেই — "+ নতুন যোগ করুন" চাপুন</p>
          )}
        </div>
      )}

      {/* ══════════ ADD / EDIT MODAL ══════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <form onSubmit={handleSave}
            className="relative w-full sm:max-w-md bg-white rounded-t-[20px] sm:rounded-[20px] shadow-2xl max-h-[92vh] overflow-y-auto p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900">
                {editId ? 'সম্পাদনা' : 'নতুন যোগ'} — {activeCat?.icon} {activeCat?.name_bn}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100">✕</button>
            </div>

            {/* Photo */}
            <div className="flex items-center gap-3">
              {form.photo_url
                ? <img src={form.photo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                : <span className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl">👤</span>
              }
              <label className="px-3.5 h-9 inline-flex items-center rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-50">
                {uploading ? 'আপলোড হচ্ছে...' : '📷 ছবি আপলোড'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
              </label>
              {form.photo_url && (
                <button type="button" onClick={() => set('photo_url', '')}
                  className="text-xs text-red-400 hover:text-red-600">মুছুন</button>
              )}
            </div>

            <input className={inputCls} placeholder="পুরো নাম *"
              value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            <input className={inputCls} type="tel" placeholder="মোবাইল নম্বর * (01XXXXXXXXX)"
              value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />
            <input className={inputCls} placeholder="ঠিকানা"
              value={form.address} onChange={e => set('address', e.target.value)} />
            <input className={inputCls}
              placeholder={activeCat?.display_type === 'profile' ? 'পদবি / বিশেষত্ব (যেমন: মেডিসিন বিশেষজ্ঞ)' : 'অতিরিক্ত তথ্য (যেমন: রক্তের গ্রুপ, বিষয়)'}
              value={form.additional_info} onChange={e => set('additional_info', e.target.value)} />
            <textarea rows={2} placeholder="বিবরণ (ঐচ্ছিক)"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 resize-none"
              value={form.description} onChange={e => set('description', e.target.value)} />

            <div className="flex items-center gap-5 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-purple-600" />
                সক্রিয়
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_verified} onChange={e => set('is_verified', e.target.checked)} className="w-4 h-4 accent-purple-600" />
                ভেরিফাইড ব্যাজ
              </label>
            </div>

            <button type="submit" disabled={saveEntry.isPending || uploading}
              className="w-full h-12 rounded-2xl text-sm font-bold text-white disabled:opacity-60 active:scale-[0.98] transition-all"
              style={{ background: BLUE }}>
              {saveEntry.isPending ? 'সংরক্ষণ হচ্ছে...' : editId ? '✓ আপডেট করুন' : '✓ যোগ করুন'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
