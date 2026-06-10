import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const GREEN = '#2563EB'

function useSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key')
      if (error) throw error
      // Return as {key: value} map
      return (data || []).reduce((acc, row) => {
        acc[row.key] = row
        return acc
      }, {})
    },
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site-settings'] }),
  })
}

function SettingField({ row, onChange }) {
  if (!row) return null
  if (row.type === 'boolean') {
    const checked = row.value === 'true'
    return (
      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
        <div>
          <p className="text-sm font-medium text-gray-800">{row.label}</p>
          <p className="text-xs text-gray-400">{row.key}</p>
        </div>
        <div className={`relative w-11 h-6 rounded-full transition-colors ${checked ? '' : 'bg-gray-300'}`}
             style={checked ? { background: GREEN } : {}}>
          <input type="checkbox" className="sr-only" checked={checked}
            onChange={e => onChange(row.key, e.target.checked ? 'true' : 'false')} />
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`} onClick={() => onChange(row.key, checked ? 'false' : 'true')} />
        </div>
      </label>
    )
  }
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{row.label}</label>
      <input
        type={row.type === 'url' ? 'url' : 'text'}
        value={row.value || ''}
        onChange={e => onChange(row.key, e.target.value)}
        className="input"
        placeholder={`${row.label} লিখুন`}
      />
    </div>
  )
}

export default function Settings() {
  const { data: settings = {}, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()

  // Local state for batch editing
  const [local, setLocal] = useState({})
  const [dirty, setDirty] = useState(new Set())

  useEffect(() => {
    if (!isLoading) {
      const vals = {}
      Object.entries(settings).forEach(([k, row]) => {
        vals[k] = { ...row }
      })
      setLocal(vals)
      setDirty(new Set())
    }
  }, [isLoading])

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  const groups = [
    {
      title: '🌐 সাইটের তথ্য',
      keys: ['site_name', 'site_tagline'],
    },
    {
      title: '📞 যোগাযোগ',
      keys: ['contact_phone', 'contact_email', 'contact_address', 'whatsapp_number'],
    },
    {
      title: '⚙️ ফিচার নিয়ন্ত্রণ',
      keys: ['allow_registration', 'allow_shop_request'],
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">⚙️ সাইট সেটিংস</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {dirty.size > 0
              ? <span className="text-orange-500 font-medium">⚠️ {dirty.size} টি পরিবর্তন সংরক্ষণের অপেক্ষায়</span>
              : 'সব পরিবর্তন সংরক্ষিত'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateSetting.isPending || dirty.size === 0}
          className="text-sm px-5 py-2.5 text-white rounded-xl font-semibold disabled:opacity-50 transition-opacity"
          style={{ background: GREEN }}>
          {updateSetting.isPending ? '⏳ সংরক্ষণ...' : '💾 সংরক্ষণ করুন'}
        </button>
      </div>

      <div className="space-y-5">
        {groups.map(group => (
          <div key={group.title} className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-700 mb-4">{group.title}</h3>
            <div className="space-y-4">
              {group.keys.map(key => (
                <SettingField
                  key={key}
                  row={local[key]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </div>
        ))}

        {/* DB Status */}
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
          <h3 className="font-bold text-blue-800 mb-2">💡 তথ্য</h3>
          <p className="text-sm text-blue-700">
            সেটিংস পরিবর্তন করার পরে <strong>সংরক্ষণ করুন</strong> বাটনে ক্লিক করুন।
            নতুন সেটিং যোগ করতে Supabase SQL Editor-এ{' '}
            <code className="bg-blue-100 px-1 rounded text-xs">site_settings</code> টেবিলে ইনসার্ট করুন।
          </p>
        </div>
      </div>
    </div>
  )
}
