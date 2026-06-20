import { useState, useRef } from 'react'
import { useHomeSections, useUpdateSection, useReorderSections } from '../../hooks/useHomeSections'
import toast from 'react-hot-toast'

const SECTION_ICONS = {
  hero:           '🏠',
  categories:     '📋',
  banner_ads:     '🖼️',
  featured_shops: '⭐',
  latest_shops:   '🆕',
  services:       '🛠️',
  cta:            '📢',
}

const DEFAULT_ICON = '📄'

export default function ManageSections() {
  const { data: sections = [], isLoading } = useHomeSections()
  const updateSection  = useUpdateSection()
  const reorderSections = useReorderSections()

  const [editing, setEditing]   = useState(null) // section id being edited
  const [form,    setForm]      = useState({})
  const [saving,  setSaving]    = useState(false)

  // drag-and-drop state
  const dragId   = useRef(null)
  const dragOver = useRef(null)
  const [dragging, setDragging] = useState(false)

  function openEdit(s) {
    setEditing(s.id)
    setForm({ title: s.title ?? '', subtitle: s.subtitle ?? '' })
  }

  function cancelEdit() {
    setEditing(null)
    setForm({})
  }

  async function saveEdit(s) {
    setSaving(true)
    try {
      await updateSection.mutateAsync({
        id:       s.id,
        title:    form.title.trim()    || null,
        subtitle: form.subtitle.trim() || null,
      })
      toast.success('সংরক্ষিত হয়েছে')
      setEditing(null)
    } catch {
      toast.error('সংরক্ষণ ব্যর্থ হয়েছে')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(s) {
    try {
      await updateSection.mutateAsync({ id: s.id, is_active: !s.is_active })
      toast.success(s.is_active ? 'সেকশন লুকানো হয়েছে' : 'সেকশন দেখানো হয়েছে')
    } catch {
      toast.error('পরিবর্তন ব্যর্থ হয়েছে')
    }
  }

  // ── Drag handlers ───────────────────────────────────────────────
  function onDragStart(e, id) {
    dragId.current = id
    setDragging(true)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, id) {
    e.preventDefault()
    dragOver.current = id
  }

  function onDragEnd() {
    setDragging(false)
    if (!dragId.current || dragOver.current === dragId.current) return

    const ids = sections.map(s => s.id)
    const fromIdx = ids.indexOf(dragId.current)
    const toIdx   = ids.indexOf(dragOver.current)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, dragId.current)

    reorderSections.mutate(reordered, {
      onSuccess: () => toast.success('ক্রম আপডেট হয়েছে'),
      onError:   () => toast.error('ক্রম আপডেট ব্যর্থ হয়েছে'),
    })

    dragId.current   = null
    dragOver.current = null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        লোড হচ্ছে...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏠 হোমপেজ সেকশন বিল্ডার</h1>
        <p className="text-sm text-gray-500 mt-1">
          সেকশন দেখান / লুকান এবং ড্র্যাগ করে ক্রম পরিবর্তন করুন।
        </p>
      </div>

      {/* Drag hint */}
      <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 mb-5">
        <span>☰</span>
        <span>বাম দিকের হ্যান্ডেল ধরে টেনে সেকশনের ক্রম পরিবর্তন করুন</span>
      </div>

      {/* Section list */}
      <div className="space-y-3">
        {sections.map((s) => {
          const isEdit = editing === s.id
          const icon   = SECTION_ICONS[s.section_slug] ?? DEFAULT_ICON

          return (
            <div
              key={s.id}
              draggable
              onDragStart={(e) => onDragStart(e, s.id)}
              onDragOver={(e)  => onDragOver(e, s.id)}
              onDragEnd={onDragEnd}
              className={`bg-white rounded-xl border transition-all duration-150 ${
                dragging && dragOver.current === s.id
                  ? 'border-blue-400 shadow-md scale-[1.01]'
                  : 'border-gray-200 shadow-sm'
              } ${!s.is_active ? 'opacity-60' : ''}`}
            >
              {/* Card header row */}
              <div className="flex items-center gap-3 p-4">
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 select-none flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                {/* Icon + name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">{icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">
                      {s.section_name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{s.section_slug}</p>
                  </div>
                </div>

                {/* Order badge */}
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  #{s.display_order}
                </span>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  s.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {s.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(s)}
                    title={s.is_active ? 'লুকান' : 'দেখান'}
                    className={`p-1.5 rounded-lg transition-colors text-sm ${
                      s.is_active
                        ? 'text-yellow-600 hover:bg-yellow-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {s.is_active ? '👁️' : '🙈'}
                  </button>
                  <button
                    onClick={() => isEdit ? cancelEdit() : openEdit(s)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors text-sm"
                    title="এডিট করুন"
                  >
                    ✏️
                  </button>
                </div>
              </div>

              {/* Edit panel */}
              {isEdit && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      সেকশন শিরোনাম
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="সেকশনের শিরোনাম লিখুন"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      সাবটাইটেল
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                      placeholder="সেকশনের সংক্ষিপ্ত বিবরণ লিখুন"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(s)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              )}

              {/* Current title/subtitle preview (when not editing) */}
              {!isEdit && (s.title || s.subtitle) && (
                <div className="px-4 pb-3 pl-14">
                  {s.title    && <p className="text-xs text-gray-600 font-medium">{s.title}</p>}
                  {s.subtitle && <p className="text-xs text-gray-400">{s.subtitle}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>কোনো সেকশন পাওয়া যায়নি।</p>
          <p className="text-sm mt-1">মাইগ্রেশন চালান: phase3_module1_sections.sql</p>
        </div>
      )}
    </div>
  )
}
