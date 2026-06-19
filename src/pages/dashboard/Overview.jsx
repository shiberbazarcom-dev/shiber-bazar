import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useMyShopRequest, useSubmitShopRequest } from '../../hooks/useShopRequests'
import { useAdminWhatsapp } from '../../hooks/useSettings'
import { whatsappUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

const BLUE = '#2563EB'

/* ─────────────────────────────────────────────
   Shop Request Form Modal
───────────────────────────────────────────── */
function ShopRequestModal({ onClose, onSuccess }) {
  const { profile } = useAuth()
  const submit      = useSubmitShopRequest()
  const adminPhone  = useAdminWhatsapp()

  const [form, setForm] = useState({
    full_name:     profile?.full_name || '',
    phone:         profile?.phone || '',
    business_type: '',
    shop_name:     '',
    location:      '',
    notes:         '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim())     return toast.error('পূর্ণ নাম দিন')
    if (!form.phone.trim())         return toast.error('মোবাইল নম্বর দিন')
    if (!form.business_type.trim()) return toast.error('ব্যবসার ধরন দিন')
    if (!form.location.trim())      return toast.error('এলাকা / জেলা দিন')

    try {
      await submit.mutateAsync(form)

      // WhatsApp redirect to admin
      if (adminPhone) {
        const msg =
          `নতুন দোকান খোলার আবেদন।\n` +
          `নাম: ${form.full_name}\n` +
          `মোবাইল: ${form.phone}\n` +
          `ব্যবসার ধরন: ${form.business_type}\n` +
          `দোকানের নাম: ${form.shop_name || 'উল্লেখ নেই'}\n` +
          `এলাকা: ${form.location}\n` +
          `অনুগ্রহ করে ব্যবহারকারীর সাথে যোগাযোগ করুন।`
        window.open(whatsappUrl(adminPhone, msg), '_blank', 'noopener')
      }

      toast.success('আবেদন সফলভাবে জমা হয়েছে!')
      onSuccess()
    } catch {
      toast.error('কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">দোকান খোলার আবেদন</h2>
            <p className="text-xs text-gray-400 mt-0.5">আমাদের টিম যোগাযোগ করবে</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">পূর্ণ নাম *</label>
            <input
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="আপনার পুরো নাম লিখুন"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">মোবাইল নম্বর *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ব্যবসার ধরন *</label>
            <input
              value={form.business_type}
              onChange={e => set('business_type', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="যেমন: কাপড়, মুদিখানা, ইলেকট্রনিক্স..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              দোকানের নাম <span className="font-normal text-gray-400">(ঐচ্ছিক)</span>
            </label>
            <input
              value={form.shop_name}
              onChange={e => set('shop_name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="দোকানের নাম থাকলে লিখুন"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">এলাকা / জেলা *</label>
            <input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="যেমন: সিলেট, শিবগঞ্জ, রাজশাহী..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              অতিরিক্ত তথ্য <span className="font-normal text-gray-400">(ঐচ্ছিক)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              placeholder="যেকোনো অতিরিক্ত তথ্য..."
            />
          </div>

          <div className="pt-2 pb-safe">
            <button
              type="submit"
              disabled={submit.isPending}
              className="w-full py-4 text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-opacity"
              style={{ background: BLUE }}>
              {submit.isPending ? '⏳ জমা হচ্ছে...' : '📩 আবেদন জমা করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main Dashboard Overview
───────────────────────────────────────────── */
export default function DashboardOverview() {
  const { profile, user, role } = useAuth()
  const { data: myRequest, isLoading: requestLoading } = useMyShopRequest()
  const [showForm, setShowForm] = useState(false)

  const isShopOwner = ['shop_owner', 'super_admin', 'market_manager'].includes(role)
  const firstName   = profile?.full_name?.split(' ')[0] || 'ব্যবহারকারী'

  return (
    <div className="space-y-5 pb-28 md:pb-6">

      {/* ── Welcome card ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
               style={{ background: BLUE }}>
            {profile?.full_name?.[0] || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              স্বাগতম, {firstName} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* ── Shop owner status strip ── */}
      {isShopOwner && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-2xl">🏪</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">শপ ওনার অ্যাকাউন্ট</p>
            <p className="text-xs text-green-600">আপনার দোকান ও পণ্য পরিচালনা করুন</p>
          </div>
        </div>
      )}

      {/* ── Shop request card (only for plain users) ── */}
      {!isShopOwner && !requestLoading && (
        <>
          {/* No request yet → show CTA */}
          {!myRequest && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                     style={{ background: '#eff6ff' }}>🏪</div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  আপনি কি দোকান খুলতে চান?
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  আপনার দোকান শিবের বাজারে যুক্ত করতে আবেদন করুন।
                  আমাদের টিম আপনার সাথে যোগাযোগ করবে।
                </p>
              </div>
              <div className="px-5 pb-5 pt-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-3.5 text-white font-bold rounded-xl text-sm transition-opacity hover:opacity-90"
                  style={{ background: BLUE }}>
                  দোকান খোলার আবেদন করুন
                </button>
              </div>
            </div>
          )}

          {/* Pending request → show status */}
          {myRequest?.status === 'pending' && (
            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl flex-shrink-0">
                  ⏳
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-gray-800">আবেদন গ্রহণ হয়েছে</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      🟡 যাচাই চলছে
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।
                  </p>
                  {myRequest.shop_name && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      দোকান: <span className="font-medium text-gray-600">{myRequest.shop_name}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Approved → will soon be shop_owner, but just in case role hasn't updated */}
          {myRequest?.status === 'approved' && (
            <div className="bg-green-50 rounded-2xl border border-green-200 px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">✅</div>
              <div>
                <p className="font-bold text-green-800">আবেদন অনুমোদিত!</p>
                <p className="text-sm text-green-700 mt-0.5">আপনার অ্যাকাউন্ট শপ ওনার হিসেবে আপগ্রেড করা হয়েছে।</p>
              </div>
            </div>
          )}

          {/* Rejected */}
          {myRequest?.status === 'rejected' && (
            <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-2xl flex-shrink-0">❌</div>
                  <div>
                    <p className="font-bold text-red-700">আবেদন গ্রহণ হয়নি</p>
                    {myRequest.admin_note && (
                      <p className="text-sm text-gray-500 mt-1">{myRequest.admin_note}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-3 font-bold text-sm rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors">
                  আবার আবেদন করুন
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Profile summary card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-700 mb-4">আমার প্রোফাইল</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-500">নাম</span>
            <span className="font-medium text-gray-700">{profile?.full_name || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-500">মোবাইল</span>
            <span className="font-medium text-gray-700">{profile?.phone || 'দেওয়া নেই'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">অ্যাকাউন্ট</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              সক্রিয়
            </span>
          </div>
        </div>
        <Link to="/dashboard/profile"
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          ✏️ প্রোফাইল সম্পাদনা
        </Link>
      </div>

      {/* Modal */}
      {showForm && (
        <ShopRequestModal
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
