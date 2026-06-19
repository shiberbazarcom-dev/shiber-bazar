import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { SiteSetting } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Settings2, Save, RefreshCw, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function useSettings() {
  return useQuery({
    queryKey: ['site-settings-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').order('group').order('key')
      if (error) throw error
      return (data ?? []) as SiteSetting[]
    },
  })
}

function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Pick<SiteSetting, 'key' | 'value'>[]) => {
      const promises = settings.map(s =>
        supabase.from('site_settings').update({ value: s.value }).eq('key', s.key)
      )
      const results = await Promise.all(promises)
      const err = results.find(r => r.error)?.error
      if (err) throw err
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-settings-admin'] })
      qc.invalidateQueries({ queryKey: ['site-settings'] })
    },
  })
}

const GROUP_LABELS: Record<string, { label: string; icon: string }> = {
  site:     { label: 'Site Info',       icon: '🌐' },
  contact:  { label: 'Contact',         icon: '📞' },
  features: { label: 'Feature Toggles', icon: '⚙️' },
  social:   { label: 'Social Links',    icon: '🔗' },
}

export default function Settings() {
  const { data: settings = [], isLoading, refetch } = useSettings()
  const updateSettings = useUpdateSettings()

  // Local edits — track dirty values per key
  const [values, setValues]   = useState<Record<string, string>>({})
  const [dirty,  setDirty]    = useState<Set<string>>(new Set())
  const [saved,  setSaved]    = useState<Set<string>>(new Set())

  // Sync initial values from DB
  useEffect(() => {
    const initial: Record<string, string> = {}
    settings.forEach(s => { initial[s.key] = s.value ?? '' })
    setValues(initial)
    setDirty(new Set())
  }, [settings])

  const handleChange = (key: string, val: string) => {
    setValues(v => ({ ...v, [key]: val }))
    setDirty(d => new Set([...d, key]))
    setSaved(s => { const ns = new Set(s); ns.delete(key); return ns })
  }

  const handleSaveGroup = async (group: string) => {
    const groupKeys = settings.filter(s => s.group === group).map(s => s.key)
    const toSave = groupKeys.filter(k => dirty.has(k)).map(k => ({ key: k, value: values[k] ?? '' }))
    if (toSave.length === 0) { toast('No changes to save'); return }
    try {
      await updateSettings.mutateAsync(toSave)
      setSaved(s => new Set([...s, ...toSave.map(t => t.key)]))
      setDirty(d => { const nd = new Set(d); toSave.forEach(t => nd.delete(t.key)); return nd })
      toast.success(`${GROUP_LABELS[group]?.label ?? group} saved ✅`)
    } catch (err: any) { toast.error(err.message || 'Save failed') }
  }

  const handleSaveAll = async () => {
    const toSave = [...dirty].map(k => ({ key: k, value: values[k] ?? '' }))
    if (toSave.length === 0) { toast('No changes to save'); return }
    try {
      await updateSettings.mutateAsync(toSave)
      setSaved(new Set([...saved, ...dirty]))
      setDirty(new Set())
      toast.success('All settings saved ✅')
    } catch (err: any) { toast.error(err.message || 'Save failed') }
  }

  // Group settings
  const groups = [...new Set(settings.map(s => s.group))]

  const renderInput = (s: SiteSetting) => {
    const val = values[s.key] ?? s.value ?? ''
    const isBool = s.type === 'boolean'
    const isDirty = dirty.has(s.key)
    const isSaved = saved.has(s.key)

    if (isBool) {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleChange(s.key, val === 'true' ? 'false' : 'true')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              val === 'true' ? 'bg-purple-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              val === 'true' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className={`text-sm font-medium ${val === 'true' ? 'text-green-700' : 'text-gray-500'}`}>
            {val === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      )
    }

    if (s.type === 'textarea') {
      return (
        <Textarea
          value={val}
          onChange={e => handleChange(s.key, e.target.value)}
          rows={3}
          placeholder={s.label}
        />
      )
    }

    return (
      <Input
        type={s.type === 'url' ? 'url' : s.type === 'number' ? 'number' : 'text'}
        value={val}
        onChange={e => handleChange(s.key, e.target.value)}
        placeholder={s.label}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}><CardContent className="p-6"><div className="h-32 animate-pulse bg-gray-100 rounded-lg" /></CardContent></Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Settings2 className="h-6 w-6" /> Site Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure your marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {dirty.size > 0 && (
            <Button size="sm" onClick={handleSaveAll} disabled={updateSettings.isPending}>
              <Save className="h-4 w-4" />
              Save All ({dirty.size})
            </Button>
          )}
        </div>
      </div>

      {/* Settings groups */}
      {groups.map(group => {
        const groupSettings = settings.filter(s => s.group === group)
        const groupDirty = groupSettings.filter(s => dirty.has(s.key)).length
        const gMeta = GROUP_LABELS[group] ?? { label: group, icon: '⚙️' }

        return (
          <Card key={group}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{gMeta.icon}</span> {gMeta.label}
                  {groupDirty > 0 && <Badge variant="warning">{groupDirty} unsaved</Badge>}
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => handleSaveGroup(group)} disabled={groupDirty === 0 || updateSettings.isPending}>
                  <Save className="h-4 w-4" /> Save
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6 space-y-5">
              {groupSettings.map((s, idx) => (
                <div key={s.key}>
                  {idx > 0 && <Separator className="mb-5" />}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={s.key}>{s.label}</Label>
                      {saved.has(s.key) && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                      {dirty.has(s.key) && <span className="text-xs text-amber-600 font-medium">● unsaved</span>}
                    </div>
                    <div id={s.key}>{renderInput(s)}</div>
                    <p className="text-xs text-gray-400 font-mono">{s.key}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      {settings.length === 0 && (
        <Card>
          <CardContent className="text-center py-16 text-gray-400">
            <Settings2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>No settings found. Run the database schema to populate site_settings.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
