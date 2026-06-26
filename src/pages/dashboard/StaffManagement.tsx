import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProGate } from '@/components/ProGate'
import toast from 'react-hot-toast'
import { Plus, Copy, UserX, Users, Link2, Phone, Hash, X, Check } from 'lucide-react'

// @ts-ignore
const useAuthHook = useAuth as () => { user: any; [k: string]: any }

async function hashPin(pin: string, shopId: string): Promise<string> {
  const data = new TextEncoder().encode(pin + shopId)
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

type Staff = {
  id: string
  name: string
  phone: string | null
  role: string
  is_active: boolean
  last_login_at: string | null
  invite_token: string | null
  created_at: string
}

type Shop = { id: string; shop_name: string; slug: string | null }

function useMyShops() {
  const { user } = useAuthHook()
  return useQuery<Shop[]>({
    queryKey: ['my-shops-for-staff', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops').select('id, shop_name, slug').eq('owner_id', user!.id).eq('status', 'approved')
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })
}

function useShopStaff(shopId: string | null) {
  return useQuery<Staff[]>({
    queryKey: ['shop-staff', shopId],
    queryFn: async () => {
      if (!shopId) return []
      const { data, error } = await supabase
        .from('shop_staff').select('*').eq('shop_id', shopId).order('created_at')
      if (error) throw error
      return data || []
    },
    enabled: !!shopId,
  })
}

type AddMethod = 'pin' | 'invite' | 'phone'

function StaffManagementInner() {
  const { user } = useAuthHook()
  const qc = useQueryClient()
  const { data: shops = [] } = useMyShops()
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null)
  const shopId = selectedShopId || shops[0]?.id || null
  const { data: staffList = [], isLoading } = useShopStaff(shopId)
  const [addOpen, setAddOpen] = useState(false)

  // Set default shop when loaded
  if (!selectedShopId && shops.length > 0 && !shopId) setSelectedShopId(shops[0].id)

  const removeStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shop_staff').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shop-staff'] }); toast.success('Staff সরিয়ে দেওয়া হয়েছে') },
  })

  const currentShop = shops.find(s => s.id === shopId)

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Users className="h-5 w-5" /> Staff ম্যানেজমেন্ট</h1>
          <p className="text-sm text-gray-500 mt-0.5">দোকানের কর্মীদের যোগ ও পরিচালনা করুন</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5" disabled={!shopId}>
          <Plus className="h-4 w-4" /> Staff যোগ করুন
        </Button>
      </div>

      {/* Shop selector */}
      {shops.length > 1 && (
        <select
          value={shopId || ''}
          onChange={e => setSelectedShopId(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {shops.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
        </select>
      )}

      {/* Staff list */}
      {isLoading && <div className="text-center py-10 text-gray-400">লোড হচ্ছে...</div>}
      {!isLoading && staffList.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">এখনো কোনো Staff নেই</p>
          <p className="text-xs mt-1">নিচের বাটনে ক্লিক করে staff যোগ করুন</p>
        </div>
      )}

      <div className="space-y-3">
        {staffList.filter(s => s.is_active).map(staff => (
          <div key={staff.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{staff.name}</span>
                <Badge variant={staff.role === 'manager' ? 'default' : 'secondary'} className="text-xs">
                  {staff.role === 'manager' ? 'ম্যানেজার' : 'স্টাফ'}
                </Badge>
              </div>
              {staff.phone && <p className="text-xs text-gray-500">📞 {staff.phone}</p>}
              <p className="text-xs text-gray-400">
                {staff.last_login_at
                  ? `সর্বশেষ লগইন: ${new Date(staff.last_login_at).toLocaleDateString('bn-BD')}`
                  : staff.invite_token ? '⏳ এখনো join করেননি' : 'লগইন ইতিহাস নেই'
                }
              </p>
              {/* Invite link copy if pending */}
              {staff.invite_token && (
                <InviteLinkCopy token={staff.invite_token} />
              )}
            </div>
            <button
              onClick={() => { if (confirm(`${staff.name} কে সরিয়ে দেবেন?`)) removeStaff.mutate(staff.id) }}
              className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
            >
              <UserX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {addOpen && shopId && (
        <AddStaffModal
          shopId={shopId}
          shopSlug={currentShop?.slug || shopId}
          onClose={() => setAddOpen(false)}
          onDone={() => { qc.invalidateQueries({ queryKey: ['shop-staff'] }); setAddOpen(false) }}
        />
      )}
    </div>
  )
}

function InviteLinkCopy({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/staff-login?invite=${token}`
  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1">
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'কপি হয়েছে!' : 'Invite লিংক কপি করুন'}
    </button>
  )
}

function AddStaffModal({ shopId, shopSlug, onClose, onDone }: {
  shopId: string; shopSlug: string; onClose: () => void; onDone: () => void
}) {
  const [method, setMethod] = useState<AddMethod>('pin')
  const [name, setName]     = useState('')
  const [phone, setPhone]   = useState('')
  const [pin, setPin]       = useState('')
  const [role, setRole]     = useState('staff')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ invite_token?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('নাম দিন'); return }
    if (method === 'pin' && pin.length < 4) { toast.error('PIN কমপক্ষে ৪ সংখ্যার হতে হবে'); return }
    if (method === 'phone' && !phone.trim()) { toast.error('ফোন নম্বর দিন'); return }

    setLoading(true)
    try {
      let insertData: any = { shop_id: shopId, name: name.trim(), role, phone: phone || null }

      if (method === 'pin') {
        // Hash PIN in browser using Web Crypto (no RPC needed)
        insertData.pin_hash = await hashPin(pin, shopId)
      } else {
        // Invite or phone — generate a random invite token
        insertData.invite_token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0')).join('')
      }

      const { data, error } = await supabase
        .from('shop_staff')
        .insert(insertData)
        .select('id, name, invite_token')
        .single()

      if (error) throw error

      if (method === 'pin') {
        toast.success(`${name} কে Staff হিসেবে যোগ করা হয়েছে`)
        onDone()
      } else {
        // invite/phone — show the invite link
        setResult({ invite_token: data.invite_token })
      }
    } catch (err: any) {
      console.error('[AddStaff]', err)
      toast.error(err?.message?.includes('violates row') ? 'অনুমতি নেই' : 'যোগ করা যায়নি: ' + (err?.message || ''))
    } finally {
      setLoading(false)
    }
  }

  // Show invite link result
  if (result?.invite_token) {
    const link = `${window.location.origin}/staff-login?invite=${result.invite_token}`
    return (
      <ModalShell onClose={onDone} title="Staff যোগ হয়েছে ✅">
        <p className="text-sm text-gray-600">{name} কে Staff হিসেবে যোগ করা হয়েছে।</p>
        <p className="text-sm text-gray-700 font-medium mt-3">এই লিংকটি তাকে পাঠান:</p>
        <div className="bg-gray-50 rounded-xl p-3 text-xs break-all text-blue-700 border mt-1">{link}</div>
        <CopyButton text={link} label="লিংক কপি করুন" />
        <p className="text-xs text-gray-400 mt-2">প্রথমবার লিংকে ক্লিক করলে PIN সেট করতে পারবে, তারপর প্রতিবার দোকান কোড + PIN দিয়ে login করবে।</p>
        <p className="text-xs text-gray-500 mt-1">দোকান কোড: <strong className="text-gray-700 uppercase">{shopSlug}</strong></p>
        <Button className="w-full mt-4" onClick={onDone}>ঠিক আছে</Button>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose} title="নতুন Staff যোগ করুন">
      {/* Method tabs */}
      <div className="flex rounded-xl border overflow-hidden text-sm">
        {([
          { id: 'pin',    icon: Hash,   label: 'PIN তৈরি' },
          { id: 'invite', icon: Link2,  label: 'Invite লিংক' },
          { id: 'phone',  icon: Phone,  label: 'Phone নম্বর' },
        ] as { id: AddMethod; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMethod(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors
              ${method === id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mt-3">
        <Field label="নাম *">
          <input value={name} onChange={e => setName(e.target.value)} required placeholder="Staff-এর নাম"
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </Field>

        <Field label="ফোন নম্বর">
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" type="tel"
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </Field>

        <Field label="ভূমিকা">
          <select value={role} onChange={e => setRole(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
          </select>
        </Field>

        {method === 'pin' && (
          <Field label="PIN (৪-৬ সংখ্যা) *">
            <input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              type="password"
              inputMode="numeric"
              placeholder="••••"
              maxLength={6}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              দোকান কোড: <strong className="uppercase">{shopSlug}</strong> + এই PIN দিয়ে Staff login করবে
            </p>
          </Field>
        )}

        {method === 'invite' && (
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            একটি unique লিংক তৈরি হবে। সেই লিংক Staff-কে WhatsApp-এ পাঠান। প্রথমবার তারা নিজে PIN সেট করে join করবে।
          </div>
        )}

        {method === 'phone' && (
          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
            ফোন নম্বর দিয়ে যোগ করুন। একটি invite লিংক তৈরি হবে যা তাকে পাঠাতে হবে।
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'যোগ হচ্ছে...' : 'Staff যোগ করুন'}
        </Button>
      </form>
    </ModalShell>
  )
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mt-2"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'কপি হয়েছে!' : label}
    </button>
  )
}

export default function StaffManagement() {
  return (
    <ProGate
      title="Staff ম্যানেজমেন্ট — Pro Feature"
      description="দোকানে Staff ও Manager যোগ করুন, কাজ ভাগ করুন"
      features={[
        '👥 একাধিক Staff ও Manager যোগ করুন',
        '🔑 PIN বা Invite লিংকে access দিন',
        '📦 Staff অর্ডার manage করতে পারবে',
        '🛍️ Manager পণ্য delete করতে পারবে',
        '🏪 Shop owner সব নিয়ন্ত্রণ রাখবেন',
      ]}
    >
      <StaffManagementInner />
    </ProGate>
  )
}
