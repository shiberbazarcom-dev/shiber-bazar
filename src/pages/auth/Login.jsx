import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const GREEN = '#2563EB'

export default function Login() {
  const { signInEmail, signInGoogle, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user]) // eslint-disable-line

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('সব তথ্য দিন')
    setLoading(true)
    try {
      const { error } = await signInEmail(form.email, form.password)
      if (error) {
        if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
          setShowInfo(true)
          toast.error('ইমেইল যাচাই করা হয়নি। নিচের নির্দেশনা দেখুন।')
        } else if (error.message?.includes('Invalid login credentials')) {
          toast.error('ইমেইল বা পাসওয়ার্ড ভুল')
        } else {
          toast.error(error.message || 'লগইন ব্যর্থ হয়েছে')
        }
      } else {
        toast.success('লগইন সফল! 🎉')
        navigate(from, { replace: true })
      }
    } catch (err) {
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
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                 style={{ background: GREEN }}>শ</div>
            <span className="font-bold text-gray-800 text-lg">শিবের বাজার</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">লগইন করুন</h1>
          <p className="text-gray-400 text-sm mt-1">আপনার একাউন্টে প্রবেশ করুন</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">

          {/* Email not confirmed info */}
          {showInfo && (
            <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
              <p className="font-semibold text-yellow-800 mb-2">⚠️ ইমেইল যাচাই প্রয়োজন</p>
              <p className="text-yellow-700 mb-2">
                আপনার ইমেইলে একটি যাচাই লিংক পাঠানো হয়েছে। যাচাই করার পর আবার লগইন করুন।
              </p>
              <p className="text-yellow-700 text-xs">
                অথবা, যদি সরাসরি লগইন করতে চান, Supabase Dashboard → Authentication → Email Settings থেকে
                "Confirm email" অপশনটি বন্ধ করুন।
              </p>
            </div>
          )}

          {/* Google OAuth */}
          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5 disabled:opacity-60">
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
            <span className="text-xs text-gray-400">অথবা</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">ইমেইল</label>
              <input type="email" required
                value={form.email} onChange={e => set('email', e.target.value)}
                className="input" placeholder="example@gmail.com" />
            </div>
            <div>
              <label className="form-label">পাসওয়ার্ড</label>
              <input type="password" required
                value={form.password} onChange={e => set('password', e.target.value)}
                className="input" placeholder="পাসওয়ার্ড" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 text-white font-semibold rounded-xl text-sm disabled:opacity-60 transition-opacity"
              style={{ background: GREEN }}>
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            একাউন্ট নেই?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: GREEN }}>
              রেজিস্ট্রেশন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
