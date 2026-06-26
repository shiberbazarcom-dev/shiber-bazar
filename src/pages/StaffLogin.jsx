import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import toast from 'react-hot-toast'

export default function StaffLogin() {
  const { loginWithPin, loginWithInvite, staffSession } = useStaffAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [pin, setPin]             = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading]     = useState(false)
  const isInviteFlow = !!inviteToken

  useEffect(() => {
    if (staffSession) navigate('/staff/orders', { replace: true })
  }, [staffSession, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (pin.length < 4) { toast.error('PIN কমপক্ষে ৪ সংখ্যার হতে হবে'); return }
    if (isInviteFlow && pin !== confirmPin) { toast.error('PIN দুটো মিলছে না'); return }

    setLoading(true)
    try {
      if (isInviteFlow) {
        await loginWithInvite(inviteToken, pin)
        toast.success('স্বাগতম! PIN সেট হয়েছে')
      } else {
        await loginWithPin(pin)
        toast.success('লগইন সফল!')
      }
      navigate('/staff/orders', { replace: true })
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('invalid_credentials')) toast.error('PIN ভুল')
      else if (msg.includes('invalid_token'))  toast.error('লিংক মেয়াদ উত্তীর্ণ')
      else toast.error('লগইন হয়নি, আবার চেষ্টা করুন')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-6">

        <div className="text-center space-y-1">
          <div className="text-4xl">🏪</div>
          <h1 className="text-xl font-bold text-gray-800">Staff Login</h1>
          <p className="text-sm text-gray-500">
            {isInviteFlow ? 'নতুন PIN সেট করুন এবং যোগ দিন' : 'শিবের বাজার — Staff Panel'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              {isInviteFlow ? 'নতুন PIN (৪+ সংখ্যা)' : 'আপনার PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••"
              required
              autoFocus
              maxLength={6}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest font-mono text-center text-xl"
            />
          </div>

          {isInviteFlow && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">PIN নিশ্চিত করুন</label>
              <input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••"
                required
                maxLength={6}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest font-mono text-center text-xl"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'লগইন হচ্ছে...' : isInviteFlow ? 'PIN সেট করে যোগ দিন' : 'লগইন করুন'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          সমস্যা হলে দোকানের মালিকের সাথে যোগাযোগ করুন
        </p>
      </div>
    </div>
  )
}
