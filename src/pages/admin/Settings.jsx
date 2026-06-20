import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const GREEN = '#2563EB'

/* ── All built-in keys — these cannot be deleted ── */
const PROTECTED_KEYS = new Set([
  'site_name','site_tagline','site_logo_url','site_favicon_url','site_url','site_footer_copyright',
  'meta_description','og_image_url','meta_keywords',
  'hero_title','hero_subtitle','hero_search_placeholder_shop','hero_search_placeholder_product',
  'cta_badge','cta_title','cta_subtitle','cta_btn_primary','cta_btn_secondary',
  'contact_phone','contact_phone_display','contact_email','whatsapp_number','contact_address','map_embed_url',
  'office_hours_weekday','office_hours_weekday_time','office_hours_friday','office_hours_friday_time',
  'footer_about',
  'union_name','union_area','union_email',
  'union_chairman_name','union_chairman_phone','union_chairman_title',
  'union_secretary_name','union_secretary_phone',
  'union_krishi_name','union_krishi_phone',
  'union_police_name','union_police_phone',
  'allow_registration','allow_shop_request',
  'announcement_active','announcement_text',
])

/* ── Hooks ── */
function useSettings() {
  return useQuery({
    queryKey: ['site-settings-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key')
      if (error) throw error
      return (data || []).reduce((acc, row) => {
        acc[row.key] = row
        return acc
      }, {})
    },
    staleTime: 0,
  })
}

function useUpdateSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-settings-admin'] })
      qc.invalidateQueries({ queryKey: ['site-settings'] })
    },
  })
}

function useAddSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value, label, type }) => {
      const { error } = await supabase
        .from('site_settings')
        .insert({ key, value, label, type })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-settings-admin'] })
      qc.invalidateQueries({ queryKey: ['site-settings'] })
    },
  })
}

function useDeleteSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (key) => {
      const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('key', key)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-settings-admin'] })
      qc.invalidateQueries({ queryKey: ['site-settings'] })
    },
  })
}

/* ── Field renderer ── */
function SettingField({ row, onChange, onDelete }) {
  if (!row) return null
  const isProtected = PROTECTED_KEYS.has(row.key)

  const input = () => {
    if (row.type === 'boolean') {
      const checked = row.value === 'true'
      return (
        <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? '' : 'bg-gray-300'}`}
             style={checked ? { background: GREEN } : {}}>
          <input type="checkbox" className="sr-only" checked={checked}
            onChange={e => onChange(row.key, e.target.checked ? 'true' : 'false')} />
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`} onClick={() => onChange(row.key, checked ? 'false' : 'true')} />
        </div>
      )
    }
    if (row.type === 'textarea') {
      return (
        <textarea rows={3} value={row.value || ''}
          onChange={e => onChange(row.key, e.target.value)}
          className="input resize-none w-full"
          placeholder={`${row.label || row.key} লিখুন`} />
      )
    }
    return (
      <input type={row.type === 'url' ? 'url' : 'text'}
        value={row.value || ''}
        onChange={e => onChange(row.key, e.target.value)}
        className="input w-full"
        placeholder={`${row.label || row.key} লিখুন`} />
    )
  }

  if (row.type === 'boolean') {
    return (
      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
        <div>
          <p className="text-sm font-medium text-gray-800">{row.label || row.key}</p>
          <p className="text-xs text-gray-400">{row.key}</p>
        </div>
        {input()}
      </label>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{row.label || row.key}</label>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-300">{row.key}</span>
          {!isProtected && onDelete && (
            <button type="button" onClick={() => onDelete(row.key)}
              className="text-red-400 hover:text-red-600 text-xs px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors">
              🗑️ মুছুন
            </button>
          )}
        </div>
      </div>
      {input()}
    </div>
  )
}

/* ── Add Custom Field form ── */
function AddFieldForm({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ key: '', label: '', value: '', type: 'text' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.key.trim()) return toast.error('Key দিন')
    if (PROTECTED_KEYS.has(form.key.trim())) return toast.error('এই key reserved — অন্য নাম দিন')
    await onAdd(form)
    setForm({ key: '', label: '', value: '', type: 'text' })
    setOpen(false)
  }

  const inp = 'w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400'

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full h-10 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
      + নতুন Custom Field যোগ করুন
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-bold text-blue-800">নতুন Field যোগ</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Key * (ইংরেজি, underscore)</label>
          <input className={inp} placeholder="my_custom_key"
            value={form.key} onChange={e => set('key', e.target.value.replace(/\s/g, '_').toLowerCase())} />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Label (বাংলায় নাম)</label>
          <input className={inp} placeholder="আমার Custom Field"
            value={form.label} onChange={e => set('label', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Type</label>
          <select className={inp} value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="url">URL</option>
            <option value="boolean">Boolean (on/off)</option>
            <option value="number">Number</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Default Value</label>
          <input className={inp} placeholder="মান লিখুন"
            value={form.value} onChange={e => set('value', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)}
          className="flex-1 h-9 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
          বাতিল
        </button>
        <button type="submit"
          className="flex-1 h-9 rounded-xl text-sm font-bold text-white"
          style={{ background: GREEN }}>
          ✓ যোগ করুন
        </button>
      </div>
    </form>
  )
}

/* ── Main component ── */
export default function Settings() {
  const { data: settings = {}, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  const addSetting    = useAddSetting()
  const deleteSetting = useDeleteSetting()

  const [local, setLocal]   = useState({})
  const [dirty, setDirty]   = useState(new Set())

  useEffect(() => {
    if (!isLoading && Object.keys(settings).length > 0) {
      setLocal(prev => {
        // Merge: keep dirty (unsaved) edits, update everything else from DB
        const vals = {}
        Object.entries(settings).forEach(([k, row]) => {
          vals[k] = dirty.has(k) ? (prev[k] || { ...row }) : { ...row }
        })
        return vals
      })
    }
  }, [settings, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (key, value) => {
    setLocal(prev => ({ ...prev, [key]: { ...prev[key], value } }))
    setDirty(prev => new Set(prev).add(key))
  }

  const handleSave = async () => {
    if (dirty.size === 0) { toast('কোনো পরিবর্তন নেই'); return }
    try {
      await Promise.all(
        [...dirty].map(key => updateSetting.mutateAsync({ key, value: local[key]?.value || '' }))
      )
      setDirty(new Set())
      toast.success('সেটিংস সংরক্ষিত হয়েছে ✅')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  const handleAdd = async (form) => {
    try {
      await addSetting.mutateAsync(form)
      setLocal(prev => ({ ...prev, [form.key]: { key: form.key, label: form.label, value: form.value, type: form.type } }))
      toast.success('নতুন field যোগ হয়েছে ✅')
    } catch (e) {
      toast.error(e.message?.includes('duplicate') ? 'এই key আগে থেকেই আছে' : 'সমস্যা হয়েছে')
    }
  }

  const handleDelete = async (key) => {
    if (PROTECTED_KEYS.has(key)) return toast.error('Built-in field মুছা যাবে না')
    if (!window.confirm(`"${key}" মুছে ফেলবেন?`)) return
    try {
      await deleteSetting.mutateAsync(key)
      setLocal(prev => { const n = { ...prev }; delete n[key]; return n })
      toast.success('মুছে ফেলা হয়েছে')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  const groups = [
    {
      title: '📣 ঘোষণা বার',
      keys: ['announcement_active','announcement_text'],
    },
    {
      title: '🌐 সাইটের তথ্য',
      keys: ['site_name','site_tagline','site_logo_url','site_favicon_url','site_url','site_footer_copyright'],
    },
    {
      title: '🔍 SEO সেটিংস',
      keys: ['meta_description','og_image_url','meta_keywords'],
    },
    {
      title: '🏠 হোমপেজ Hero',
      keys: ['hero_title','hero_subtitle','hero_search_placeholder_shop','hero_search_placeholder_product'],
    },
    {
      title: '📢 CTA সেকশন',
      keys: ['cta_badge','cta_title','cta_subtitle','cta_btn_primary','cta_btn_secondary'],
    },
    {
      title: '📞 যোগাযোগ',
      keys: ['contact_phone','contact_phone_display','contact_email','whatsapp_number','contact_address','map_embed_url','office_hours_weekday','office_hours_weekday_time','office_hours_friday','office_hours_friday_time'],
    },
    {
      title: '🦶 Footer',
      keys: ['footer_about'],
    },
    {
      title: '🏛️ ইউনিয়ন পরিষদ',
      keys: [
        'union_name','union_area','union_email',
        'union_chairman_name','union_chairman_phone','union_chairman_title',
        'union_secretary_name','union_secretary_phone',
        'union_krishi_name','union_krishi_phone',
        'union_police_name','union_police_phone',
      ],
    },
    {
      title: '⚙️ ফিচার নিয়ন্ত্রণ',
      keys: ['allow_registration','allow_shop_request'],
    },
  ]

  /* Custom fields = everything in DB not in any group */
  const groupedKeys = new Set(groups.flatMap(g => g.keys))
  const customFields = Object.values(local).filter(row => row && !groupedKeys.has(row.key))

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">⚙️ সাইট সেটিংস</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {dirty.size > 0
              ? <span className="text-orange-500 font-medium">⚠️ {dirty.size} টি পরিবর্তন সংরক্ষণের অপেক্ষায়</span>
              : 'সব পরিবর্তন সংরক্ষিত'}
          </p>
        </div>
        <button onClick={handleSave}
          disabled={updateSetting.isPending || dirty.size === 0}
          className="text-sm px-5 py-2.5 text-white rounded-xl font-semibold disabled:opacity-50 transition-opacity"
          style={{ background: GREEN }}>
          {updateSetting.isPending ? '⏳ সংরক্ষণ...' : '💾 সংরক্ষণ করুন'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Built-in groups */}
        {groups.map(group => (
          <div key={group.title} className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-700 mb-4">{group.title}</h3>
            <div className="space-y-4">
              {group.keys.map(key => (
                <SettingField key={key} row={local[key]} onChange={handleChange} />
              ))}
            </div>
          </div>
        ))}

        {/* Custom fields */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-700">✨ Custom Fields</h3>
              <p className="text-xs text-gray-400 mt-0.5">আপনার নিজের তৈরি fields — add ও delete করা যাবে</p>
            </div>
            {dirty.size > 0 && customFields.some(r => dirty.has(r.key)) && (
              <button onClick={handleSave}
                className="text-xs px-3 py-1.5 text-white rounded-lg"
                style={{ background: GREEN }}>
                সংরক্ষণ
              </button>
            )}
          </div>

          <div className="space-y-4 mb-4">
            {customFields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">কোনো custom field নেই</p>
            ) : (
              customFields.map(row => (
                <SettingField key={row.key} row={row} onChange={handleChange} onDelete={handleDelete} />
              ))
            )}
          </div>

          <AddFieldForm onAdd={handleAdd} />
        </div>

        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
          <p className="text-xs text-amber-700">
            🔒 Built-in fields (সাইটের নাম, Hero, SEO ইত্যাদি) delete করা যাবে না।
            Custom fields যেকোনো সময় add ও delete করা যাবে।
          </p>
        </div>
      </div>
    </div>
  )
}
