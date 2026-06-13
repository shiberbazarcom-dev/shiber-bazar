import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { compressImage, validateFileSize } from '../../lib/compressImage'
import { requestChatNotificationPermission } from '../../lib/chatSound'
import PushNotificationToggle from '../../components/PushNotificationToggle'
import toast from 'react-hot-toast'

const GREEN = '#2563EB'

const ROLE_LABELS = {
  user:           { icon: '🛒', label: 'কাস্টমার',       color: 'bg-blue-100 text-blue-700' },
  shop_owner:     { icon: '🏪', label: 'দোকানদার',        color: 'bg-green-100 text-green-700' },
  market_manager: { icon: '🟠', label: 'Market Manager',  color: 'bg-orange-100 text-orange-700' },
  super_admin:    { icon: '🔴', label: 'Super Admin',      color: 'bg-red-100 text-red-700' },
}

export default function Profile() {
  const { user, profile, updateProfile, loadProfile } = useAuth()
  const fileRef = useRef(null)

  // Auto request notification permission when profile page loads
  useEffect(() => { requestChatNotificationPermission() }, [])

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone     || '',
    bio:       profile?.bio       || '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [pwForm, setPwForm]       = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const set     = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setPw   = (k, v) => setPwForm(f => ({ ...f, [k]: v }))

  const roleInfo = ROLE_LABELS[profile?.role] || ROLE_LABELS.user

  /* ── Avatar upload ── */
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const check = validateFileSize(file, 5)
    if (!check.ok) { toast.error(check.message); return }
    const compressed = await compressImage(file)

    setUploading(true)
    try {
      const ext  = compressed.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('shop-images')
        .upload(path, compressed, { cacheControl: '3600', upsert: true })
      if (upErr) throw upErr

      const { data } = supabase.storage.from('shop-images').getPublicUrl(path)
      await updateProfile({ avatar_url: data.publicUrl })
      toast.success('প্রোফাইল ছবি আপডেট হয়েছে ✅')
    } catch (err) {
      toast.error('আপলোড ব্যর্থ: ' + (err.message || ''))
    } finally {
      setUploading(false)
    }
  }

  /* ── Save profile info ── */
  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) return toast.error('নাম দিন')
    setSaving(true)
    try {
      await updateProfile({ full_name: form.full_name.trim(), phone: form.phone.trim(), bio: form.bio.trim() })
      toast.success('প্রোফাইল সংরক্ষিত হয়েছে ✅')
    } catch (err) {
      toast.error('সমস্যা হয়েছে: ' + (err.message || ''))
    } finally {
      setSaving(false)
    }
  }

  /* ── Change password ── */
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.next.length < 6) return toast.error('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
    if (pwForm.next !== pwForm.confirm) return toast.error('পাসওয়ার্ড মিলছে না')
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) throw error
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে ✅')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast.error(err.message || 'সমস্যা হয়েছে')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👤 প্রোফাইল সম্পাদনা</h1>
        <p className="text-sm text-gray-400 mt-0.5">আপনার তথ্য আপডেট করুন</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <h3 className="font-bold text-gray-700 mb-4">🖼️ প্রোফাইল ছবি</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt=""
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-100" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                   style={{ background: GREEN }}>
                {(form.full_name || user?.email || '?')[0].toUpperCase()}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div>
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium mb-2 ${roleInfo.color}`}>
              {roleInfo.icon} {roleInfo.label}
            </span>
            <div>
              <button onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-xs px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                {uploading ? 'আপলোড হচ্ছে...' : '📁 ছবি পরিবর্তন করুন'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG — সর্বোচ্চ ২MB</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <h3 className="font-bold text-gray-700 mb-4">📝 ব্যক্তিগত তথ্য</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="form-label">পুরো নাম *</label>
            <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className="input" placeholder="আপনার নাম" />
          </div>
          <div>
            <label className="form-label">ফোন নম্বর</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              className="input" placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <label className="form-label">ইমেইল</label>
            <input value={user?.email || ''} disabled className="input bg-gray-50 text-gray-400" />
            <p className="text-xs text-gray-400 mt-1">ইমেইল পরিবর্তন করা যাবে না</p>
          </div>
          <div>
            <label className="form-label">বায়ো (ঐচ্ছিক)</label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
              className="input" rows={2} placeholder="নিজের সম্পর্কে কিছু লিখুন..." />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 text-white font-semibold rounded-xl text-sm disabled:opacity-60"
            style={{ background: GREEN }}>
            {saving ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 সংরক্ষণ করুন'}
          </button>
        </form>
      </div>

      {/* Password change — only for email/password users (not Google OAuth) */}
      {!user?.app_metadata?.provider?.includes('google') && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-700 mb-4">🔐 পাসওয়ার্ড পরিবর্তন</h3>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="form-label">নতুন পাসওয়ার্ড</label>
              <input type="password" value={pwForm.next} onChange={e => setPw('next', e.target.value)}
                className="input" placeholder="কমপক্ষে ৬ অক্ষর" minLength={6} />
            </div>
            <div>
              <label className="form-label">পাসওয়ার্ড নিশ্চিত করুন</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPw('confirm', e.target.value)}
                className="input" placeholder="আবার টাইপ করুন" />
            </div>
            <button type="submit" disabled={pwLoading || !pwForm.next}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl text-sm disabled:opacity-60 transition-colors">
              {pwLoading ? '⏳...' : '🔒 পাসওয়ার্ড পরিবর্তন করুন'}
            </button>
          </form>
        </div>
      )}

      {/* Push Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🔔 নোটিফিকেশন সেটিংস</h3>
        <PushNotificationToggle />
        <p className="text-xs text-gray-400 mt-2">
          চালু করলে অর্ডার আপডেট, নতুন বার্তা ও অফারের notification পাবেন।
          PWA হিসেবে install করলে mobile এও notification আসবে।
        </p>
      </div>
    </div>
  )
}
