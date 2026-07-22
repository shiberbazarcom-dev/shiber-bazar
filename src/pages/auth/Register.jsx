import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'

export default function Register() {
  const { signUp, signInPhone, signInGoogle, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ fullName: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user]) // eslint-disable-line

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const phone = form.phone.trim()
    const name  = form.fullName.trim()

    if (!name)   return toast.error('পুরো নাম দিন')
    if (!phone)  return toast.error('মোবাইল নম্বর দিন')
    if (!/^01[3-9]\d{8}$/.test(phone)) return toast.error('সঠিক বাংলাদেশি মোবাইল নম্বর দিন')
    if (!form.password) return toast.error('পাসওয়ার্ড দিন')
    if (form.password.length < 6) return toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে')
    if (form.password !== form.confirm) return toast.error('পাসওয়ার্ড মিলছে না')

    setLoading(true)
    try {
      const { error } = await signUp({
        fullName: name,
        phone,
        password: form.password,
      })
      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
          toast.error('এই মোবাইল নম্বরে আগেই একাউন্ট আছে')
        } else {
          toast.error(error.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে')
        }
      } else {
        // Auto sign-in after successful registration
        toast.success('রেজিস্ট্রেশন সফল! 🎉')
        const { error: loginErr } = await signInPhone(phone, form.password)
        if (loginErr) {
          // Sign-in failed — show success screen with login button as fallback
          setDone(true)
        }
        // If sign-in succeeded, AuthContext will update `user` and the
        // useEffect above will redirect to /dashboard automatically
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

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
                 style={{ background: '#eff6ff' }}>🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">রেজিস্ট্রেশন সফল!</h2>
            <p className="text-gray-500 text-sm mb-6">
              আপনার একাউন্ট তৈরি হয়েছে। এখন লগইন করুন।
            </p>
            <Link to="/login"
              className="block w-full py-3 text-white font-bold rounded-xl text-sm"
              style={{ background: BLUE }}>
              লগইন করুন →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Register form ── */
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 pb-28 md:pb-10">
      <SEO title="রেজিস্ট্রেশন" description="শিবের বাজারে বিনামূল্যে অ্যাকাউন্ট খুলুন ও আপনার দোকান যোগ করুন।" noindex />
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                 style={{ background: BLUE }}>শ</div>
            <span className="font-bold text-gray-800 text-lg">শিবের বাজার</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">একাউন্ট খুলুন</h1>
          <p className="text-gray-400 text-sm mt-1">বিনামূল্যে রেজিস্ট্রেশন করুন</p>
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
            Google দিয়ে রেজিস্ট্রেশন
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">অথবা মোবাইল দিয়ে</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">পুরো নাম *</label>
              <input
                required
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="আপনার নাম লিখুন"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">মোবাইল নম্বর *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="01XXXXXXXXX"
                maxLength={11}
              />
              <p className="text-xs text-gray-400 mt-1">এই নম্বর দিয়ে পরে লগইন করবেন</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">পাসওয়ার্ড *</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="কমপক্ষে ৬ অক্ষর"
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">পাসওয়ার্ড নিশ্চিত করুন *</label>
              <input
                required
                type="password"
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="পাসওয়ার্ড আবার লিখুন"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-opacity mt-2"
              style={{ background: BLUE }}>
              {loading ? '⏳ রেজিস্ট্রেশন হচ্ছে...' : 'রেজিস্ট্রেশন করুন'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            একাউন্ট আছে?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: BLUE }}>
              লগইন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
