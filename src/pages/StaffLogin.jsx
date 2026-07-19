import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import toast from 'react-hot-toast'

export default function StaffLogin() {
  const { loginWithPin, loginWithInvite, staffSession } = useStaffAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { shopSlug } = useParams()
  const inviteToken = searchParams.get('invite')

  const [pin, setPin]               = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading]       = useState(false)
  const isInviteFlow = !!inviteToken

  useEffect(() => {
    if (staffSession) navigate('/staff/orders', { replace: true })
  }, [staffSession, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (pin.length < 4) { toast.error('PIN কমপক্ষে ৪ সংখ্যার হতে হবে'); return }
    if (isInviteFlow && pin !== confirmPin) { toast.error('PIN দুটো মিলছে না'); return }
    if (!isInviteFlow && !shopSlug) { toast.error('দোকানের লিংক সঠিক নয়, মালিকের কাছ থেকে আবার লিংক নিন'); return }
    setLoading(true)
    try {
      if (isInviteFlow) {
        await loginWithInvite(inviteToken, pin)
        toast.success('স্বাগতম! PIN সেট হয়েছে')
      } else {
        await loginWithPin(shopSlug, pin)
        toast.success('লগইন সফল!')
      }
      navigate('/staff/orders', { replace: true })
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('shop_not_found'))      toast.error('দোকান পাওয়া যায়নি')
      else if (msg.includes('invalid_credentials')) toast.error('PIN ভুল, আবার চেষ্টা করুন')
      else if (msg.includes('invalid_token'))  toast.error('লিংক মেয়াদ উত্তীর্ণ')
      else toast.error('লগইন হয়নি')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        {/* Top gradient band */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-center">
          <div className="text-3xl mb-1">🏪</div>
          <h1 className="text-white font-bold text-lg">শিবের বাজার</h1>
          <p className="text-blue-100 text-xs mt-0.5">
            {isInviteFlow ? 'আপনাকে যোগ দেওয়া হয়েছে — PIN সেট করুন' : 'প্যানেল লগইন'}
          </p>
        </div>

        <div className="px-6 py-6 space-y-5">
          {isInviteFlow && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-green-700 text-sm font-medium">আপনার জন্য অ্যাকাউন্ট তৈরি হয়েছে!</p>
              <p className="text-green-600 text-xs mt-0.5">একটি নতুন PIN বেছে নিন — এটি দিয়ে পরে লগইন করবেন</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 block">
                {isInviteFlow ? 'নতুন PIN (৪–৬ সংখ্যা)' : 'আপনার PIN'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • •"
                required
                autoFocus
                maxLength={6}
                className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono outline-none transition-colors"
              />
            </div>

            {isInviteFlow && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 block">PIN নিশ্চিত করুন</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • •"
                  required
                  maxLength={6}
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono outline-none transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm"
            >
              {loading ? '⏳ লগইন হচ্ছে...' : isInviteFlow ? '✅ PIN সেট করে যোগ দিন' : 'লগইন করুন →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 pt-1">
            সমস্যা হলে দোকানের মালিকের সাথে যোগাযোগ করুন
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-5">শিবের বাজার — Staff Panel</p>
    </div>
  )
}
