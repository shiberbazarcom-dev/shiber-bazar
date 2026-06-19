import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const BLUE = 'var(--primary)'

export default function Login() {
  const { signInPhone, signInEmail, signInGoogle, user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const [form, setForm]           = useState({ phone: '', password: '' })
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  // Admin fallback: toggle to email login
  const [useEmail, setUseEmail]   = useState(false)
  const [emailForm, setEmailForm] = useState({ email: '', password: '' })

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user]) // eslint-disable-line

  const set      = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setEmail = (k, v) => setEmailForm(f => ({ ...f, [k]: v }))

  /* Phone login */
  const handlePhoneSubmit = async (e) => {
    e.preventDefault()
    const phone = form.phone.trim()
    if (!phone || !form.password) return toast.error('সব তথ্য দিন')
    if (!/^01[3-9]\d{8}$/.test(phone)) return toast.error('সঠিক মোবাইল নম্বর দিন')

    setLoading(true)
    try {
      const { error } = await signInPhone(phone, form.password)
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('মোবাইল নম্বর বা পাসওয়ার্ড ভুল')
        } else {
          toast.error(error.message || 'লগইন ব্যর্থ হয়েছে')
        }
      } else {
        toast.success('লগইন সফল! 🎉')
        navigate(from, { replace: true })
      }
    } catch {
      toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন')
    } finally {
      setLoading(false)
    }
  }

  /* Email login (for admins / Google users) */
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!emailForm.email || !emailForm.password) return toast.error('সব তথ্য দিন')
    setLoading(true)
    try {
      const { error } = await signInEmail(emailForm.email, emailForm.password)
      if (error) {
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('ইমেইল বা পাসওয়ার্ড ভুল')
        } else {
          toast.error(error.message || 'লগইন ব্যর্থ হয়েছে')
        }
      } else {
        toast.success('লগইন সফল! 🎉')
        navigate(from, { replace: true })
      }
    } catch {
      toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await signInGoogle()
    } catch {
      toast.error('Google লগইন ব্যর্থ হয়েছে')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 pb-28 md:pb-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                 style={{ background: BLUE }}>শ</div>
            <span className="font-bold text-gray-800 text-lg">শিবের বাজার</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">লগইন করুন</h1>
          <p className="text-gray-400 text-sm mt-1">আপনার একাউন্টে প্রবেশ করুন</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">

          {/* Google OAuth */}
          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5 disabled:opacity-60">
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Google দিয়ে লগইন
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">অথবা মোবাইল দিয়ে</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Phone login form */}
          {!useEmail && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">মোবাইল নম্বর</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">পাসওয়ার্ড</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  placeholder="পাসওয়ার্ড লিখুন"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-opacity"
                style={{ background: BLUE }}>
                {loading ? '⏳ লগইন হচ্ছে...' : 'লগইন করুন'}
              </button>
            </form>
          )}

          {/* Email login form (admin fallback) */}
          {useEmail && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ইমেইল</label>
                <input
                  required
                  type="email"
                  value={emailForm.email}
                  onChange={e => setEmail('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  placeholder="example@gmail.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">পাসওয়ার্ড</label>
                <input
                  required
                  type="password"
                  value={emailForm.password}
                  onChange={e => setEmail('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  placeholder="পাসওয়ার্ড লিখুন"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-opacity"
                style={{ background: BLUE }}>
                {loading ? '⏳ লগইন হচ্ছে...' : 'লগইন করুন'}
              </button>
            </form>
          )}

          {/* Toggle between phone / email */}
          <button
            onClick={() => setUseEmail(v => !v)}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-4 py-1 transition-colors">
            {useEmail ? '← মোবাইল নম্বর দিয়ে লগইন করুন' : 'অ্যাডমিন? ইমেইল দিয়ে লগইন করুন →'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            একাউন্ট নেই?{' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: BLUE }}>
              রেজিস্ট্রেশন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
