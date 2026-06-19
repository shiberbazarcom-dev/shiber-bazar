import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useMyShopRequest, useSubmitShopRequest } from '../../hooks/useShopRequests'
import { useAdminWhatsapp } from '../../hooks/useSettings'
import { whatsappUrl } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const BLUE = 'var(--primary)'

/* ─── Pending orders count for shop owner ─── */
function usePendingOrderCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['pending-order-count', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Get shop IDs owned by this user
      const { data: shops } = await supabase
        .from('shops').select('id').eq('owner_id', userId!)
      const ids = (shops ?? []).map((s: any) => s.id)
      if (!ids.length) return 0
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('shop_id', ids)
        .eq('status', 'pending')
      return count ?? 0
    },
  })
}

/* ─── Shop Request Form Modal ─── */
function ShopRequestModal({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth() as any
  const submit     = useSubmitShopRequest()
  const adminPhone = useAdminWhatsapp()

  const [form, setForm] = useState({
    full_name:     profile?.full_name || '',
    phone:         profile?.phone     || '',
    business_type: '',
    shop_name:     '',
    location:      '',
    notes:         '',
  })

  // Re-fill if profile arrives after modal mounts
  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        full_name: f.full_name || profile.full_name || '',
        phone:     f.phone     || profile.phone     || '',
      }))
    }
  }, [profile])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) return toast.error('পূর্ণ নাম দিন')
    if (!form.phone.trim())     return toast.error('মোবাইল নম্বর দিন')

    try {
      await submit.mutateAsync(form as any)
      if (adminPhone) {
        const msg =
          `নতুন দোকান খোলার আবেদন।\n` +
          `নাম: ${form.full_name}\n` +
          `মোবাইল: ${form.phone}\n` +
          (form.business_type ? `ব্যবসার ধরন: ${form.business_type}\n` : '') +
          (form.shop_name     ? `দোকানের নাম: ${form.shop_name}\n`     : '') +
          (form.location      ? `এলাকা: ${form.location}\n`             : '') +
          `অনুগ্রহ করে ব্যবহারকারীর সাথে যোগাযোগ করুন।`
        window.open(whatsappUrl(adminPhone, msg), '_blank', 'noopener')
      }
      toast.success('আবেদন সফলভাবে জমা হয়েছে!')
      onClose()
    } catch {
      toast.error('কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">দোকান খোলার আবেদন</h2>
            <p className="text-xs text-gray-400 mt-0.5">আমাদের টিম যোগাযোগ করবে</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">

          {/* Name — required, auto-filled */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">পূর্ণ নাম *</label>
            <input
              required
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="আপনার পুরো নাম"
            />
          </div>

          {/* Phone — required, auto-filled */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">মোবাইল নম্বর *</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="01XXXXXXXXX"
            />
          </div>

          {/* Business type — optional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              ব্যবসার ধরন <span className="font-normal text-gray-400">(ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={form.business_type}
              onChange={e => set('business_type', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="যেমন: কাপড়, মুদিখানা, ইলেকট্রনিক্স..."
            />
          </div>

          {/* Shop name — optional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              দোকানের নাম <span className="font-normal text-gray-400">(ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={form.shop_name}
              onChange={e => set('shop_name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="দোকানের নাম থাকলে লিখুন"
            />
          </div>

          {/* Location — optional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              এলাকা / জেলা <span className="font-normal text-gray-400">(ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="যেমন: সিলেট, রাজশাহী..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submit.isPending}
              className="w-full py-4 text-white font-bold rounded-xl text-sm disabled:opacity-60"
              style={{ background: BLUE }}>
              {submit.isPending ? '⏳ জমা হচ্ছে...' : '📩 আবেদন জমা করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─── */
export default function DashboardOverview() {
  const { profile, user, role } = useAuth() as any
  const { data: myRequest, isLoading: requestLoading } = useMyShopRequest()
  const { data: pendingOrders = 0 } = usePendingOrderCount(user?.id)
  const [showForm, setShowForm] = useState(false)

  const isShopOwner = ['shop_owner', 'super_admin', 'market_manager'].includes(role)
  const firstName   = profile?.full_name?.split(' ')[0] || 'ব্যবহারকারী'

  return (
    <div className="space-y-4 pb-28 md:pb-6">

      {/* Welcome */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
             style={{ background: BLUE }}>
          {profile?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">স্বাগতম, {firstName} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* ── SHOP OWNER view ── */}
      {isShopOwner && (
        <>
          {/* Single stat card — অর্ডার */}
          <Link to="/dashboard/orders">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-orange-100">
                📦
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">অর্ডার</p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">{pendingOrders}</p>
                <p className="text-xs text-gray-400">নতুন অর্ডার অপেক্ষমান</p>
              </div>
              {(pendingOrders as number) > 0 && (
                <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-1 animate-pulse">
                  {pendingOrders as number > 99 ? '99+' : String(pendingOrders)} নতুন
                </span>
              )}
            </div>
          </Link>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/dashboard/shops',    icon: '🏪', label: 'আমার দোকান' },
              { to: '/dashboard/products', icon: '🛍️', label: 'পণ্য আপলোড' },
              { to: '/dashboard/orders',   icon: '📦', label: 'অর্ডার ম্যানেজ' },
              { to: '/dashboard/qr-code',  icon: '🔲', label: 'QR কোড' },
            ].map(item => (
              <Link key={item.to} to={item.to}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── REGULAR USER view ── */}
      {!isShopOwner && !requestLoading && (
        <>
          {!myRequest && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 pt-5 pb-1">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ background: '#eff6ff' }}>🏪</div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">আপনি কি দোকান খুলতে চান?</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  আপনার দোকান শিবের বাজারে যুক্ত করতে আবেদন করুন। আমাদের টিম আপনার সাথে যোগাযোগ করবে।
                </p>
              </div>
              <div className="px-5 pb-5 pt-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-3.5 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
                  style={{ background: BLUE }}>
                  দোকান খোলার আবেদন করুন
                </button>
              </div>
            </div>
          )}

          {myRequest?.status === 'pending' && (
            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 px-5 py-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl flex-shrink-0">⏳</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="font-bold text-gray-800">আবেদন গ্রহণ হয়েছে</h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">🟡 যাচাই চলছে</span>
                </div>
                <p className="text-sm text-gray-500">আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।</p>
                {myRequest.shop_name && (
                  <p className="text-xs text-gray-400 mt-1">দোকান: <span className="font-medium text-gray-600">{myRequest.shop_name}</span></p>
                )}
              </div>
            </div>
          )}

          {myRequest?.status === 'approved' && (
            <div className="bg-green-50 rounded-2xl border border-green-200 px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">✅</div>
              <div>
                <p className="font-bold text-green-800">আবেদন অনুমোদিত!</p>
                <p className="text-sm text-green-700 mt-0.5">পেজ রিফ্রেশ করুন — আপনার অ্যাকাউন্ট আপগ্রেড হয়েছে।</p>
              </div>
            </div>
          )}

          {myRequest?.status === 'rejected' && (
            <div className="bg-white rounded-2xl border border-red-200 px-5 py-4">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-2xl flex-shrink-0">❌</div>
                <div>
                  <p className="font-bold text-red-700">আবেদন গ্রহণ হয়নি</p>
                  {myRequest.admin_note && <p className="text-sm text-gray-500 mt-1">{myRequest.admin_note}</p>}
                </div>
              </div>
              <button onClick={() => setShowForm(true)}
                className="w-full py-3 font-bold text-sm rounded-xl border-2 border-purple-600 text-purple-600 hover:bg-purple-50 transition-colors">
                আবার আবেদন করুন
              </button>
            </div>
          )}
        </>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-700 mb-4">আমার প্রোফাইল</h2>
        <div className="space-y-2 text-sm">
          {[
            ['নাম',    profile?.full_name || '—'],
            ['মোবাইল', profile?.phone || 'দেওয়া নেই'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-400">{label}</span>
              <span className="font-medium text-gray-700">{value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-400">একাউন্ট</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">সক্রিয়</span>
          </div>
        </div>
        <Link to="/dashboard/profile"
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          ✏️ প্রোফাইল সম্পাদনা
        </Link>
      </div>

      {showForm && <ShopRequestModal onClose={() => setShowForm(false)} />}
    </div>
  )
}
