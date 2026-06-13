import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '../../lib/utils'
import { useOrderStats, useShopOrderStats } from '../../hooks/useOrders'
import { useUnreadMessageCount } from '../../hooks/useChat'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

/* ── Sidebar link with optional badge ── */
function SidebarLink({ to, icon, label, end, badge, onClose }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      <span className="text-lg w-6 text-center flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="ml-auto flex-shrink-0 bg-red-500 text-white text-[10px] font-bold
          rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-tight animate-pulse">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  )
}

function SidebarSection({ label }) {
  return (
    <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 select-none">
      {label}
    </p>
  )
}

/* ── Notification sound ── */
function playBeep(freq1 = 880, freq2 = 660) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(freq1, ctx.currentTime)
    osc.frequency.setValueAtTime(freq2, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.45)
  } catch (_) { /* audio blocked */ }
}

/* ── Service notification sound — 3-note chime (different feel) ── */
function playServiceChime() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    // Three ascending notes: C5 → E5 → G5
    const notes = [523, 659, 784]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.connect(gain)
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18)
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.35)
    })
  } catch (_) { /* audio blocked */ }
}

/* ── Admin: new order toast ── */
function NewOrderToast({ t, order }) {
  return (
    <div className={cn(
      'flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-green-200 p-4 max-w-sm w-full',
      t.visible ? 'opacity-100' : 'opacity-0'
    )}>
      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl flex-shrink-0">🛒</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm">নতুন অর্ডার!</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {order.order_number} — {order.product_name}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {order.customer_name} · {order.customer_phone}
        </p>
        <a href="/admin/orders"
          className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline"
          onClick={() => toast.dismiss(t.id)}>
          অর্ডার দেখুন →
        </a>
      </div>
      <button onClick={() => toast.dismiss(t.id)}
        className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0">✕</button>
    </div>
  )
}

/* ── Shop owner: forwarded order toast ── */
function ForwardedOrderToast({ t, order }) {
  return (
    <div className={cn(
      'flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-blue-200 p-4 max-w-sm w-full',
      t.visible ? 'opacity-100' : 'opacity-0'
    )}>
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">📤</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm">🎉 নতুন অর্ডার এসেছে!</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {order.order_number}
        </p>
        <p className="text-xs text-blue-600 mt-0.5">Admin আপনার দোকানে অর্ডার পাঠিয়েছেন</p>
        <a href="/dashboard/orders"
          className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline"
          onClick={() => toast.dismiss(t.id)}>
          অর্ডার দেখুন →
        </a>
      </div>
      <button onClick={() => toast.dismiss(t.id)}
        className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0">✕</button>
    </div>
  )
}

/* ── Admin: new service toast ── */
function NewServiceToast({ t, service }) {
  return (
    <div className={cn(
      'flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-purple-200 p-4 max-w-sm w-full',
      t.visible ? 'opacity-100' : 'opacity-0'
    )}>
      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">🛠️</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm">নতুন সেবা আবেদন!</p>
        <p className="text-xs text-gray-700 font-medium mt-0.5 truncate">{service.name}</p>
        <p className="text-xs text-gray-400 truncate">{service.phone}</p>
        <a href="/admin/services"
          className="inline-block mt-2 text-xs font-semibold text-purple-600 hover:underline"
          onClick={() => toast.dismiss(t.id)}>
          সেবা অনুমোদন করুন →
        </a>
      </div>
      <button onClick={() => toast.dismiss(t.id)}
        className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0">✕</button>
    </div>
  )
}

/* ── Admin: new shop toast ── */
function NewShopToast({ t, shop }) {
  return (
    <div className={cn(
      'flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-blue-200 p-4 max-w-sm w-full',
      t.visible ? 'opacity-100' : 'opacity-0'
    )}>
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">🏪</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm">নতুন দোকান আবেদন!</p>
        <p className="text-xs text-gray-700 font-medium mt-0.5 truncate">{shop.shop_name}</p>
        <p className="text-xs text-gray-400 truncate">{shop.address || 'ঠিকানা নেই'}</p>
        <a href="/admin/shops"
          className="inline-block mt-2 text-xs font-semibold text-blue-600 hover:underline"
          onClick={() => toast.dismiss(t.id)}>
          দোকান দেখুন →
        </a>
      </div>
      <button onClick={() => toast.dismiss(t.id)}
        className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0">✕</button>
    </div>
  )
}

export default function DashboardLayout({ type = 'user' }) {
  const { user, profile, isAdmin, loading, role, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const qc        = useQueryClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const isShopOwner = ['shop_owner', 'market_manager', 'super_admin'].includes(role)

  /* ── Badge counts ── */
  const { data: adminStats }     = useOrderStats()        // admin pending count
  const { data: shopOwnerStats } = useShopOrderStats()    // shop owner forwarded count
  const { data: unreadMessages = 0 } = useUnreadMessageCount()

  const adminBadge     = type === 'admin'               ? (adminStats?.pending    || 0) : 0
  const ownerBadge     = type !== 'admin' && isShopOwner ? (shopOwnerStats?.confirmed || 0) : 0

  /* ── Pending shops count (admin only) ── */
  const { data: pendingShopsCount = 0 } = useQuery({
    queryKey: ['pending-shops-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('shops')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_approval')
      return count || 0
    },
    enabled: type === 'admin',
    refetchInterval: 60000,
  })

  /* ── Pending shop owner requests count (admin only) ── */
  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ['pending-shop-requests-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('shop_owner_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      return count || 0
    },
    enabled: type === 'admin',
    refetchInterval: 30000,
  })

  /* ── Pending services count (admin only) ── */
  const { data: pendingServicesCount = 0 } = useQuery({
    queryKey: ['pending-services-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      return count || 0
    },
    enabled: type === 'admin',
    refetchInterval: 30000,
  })

  /* ── Shop IDs ref (for filtering owner realtime events) ── */
  const shopIdsRef = useRef([])
  useEffect(() => {
    if (!user || type === 'admin') return
    supabase.from('shops').select('id').eq('owner_id', user.id)
      .then(({ data }) => { shopIdsRef.current = (data || []).map(s => s.id) })
  }, [user, type])

  /* ── Realtime: admin listens for new orders (INSERT) ── */
  useEffect(() => {
    if (type !== 'admin' || !user) return
    const ch = supabase
      .channel(`admin-new-orders-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          toast.custom(t => <NewOrderToast t={t} order={payload.new} />, {
            duration: 10000, position: 'top-right',
          })
          playBeep(880, 660)
          qc.invalidateQueries({ queryKey: ['order-stats'] })
          qc.invalidateQueries({ queryKey: ['admin-orders'] })
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [type, user]) // eslint-disable-line

  /* ── Realtime: admin listens for new shop submissions (INSERT) ── */
  useEffect(() => {
    if (type !== 'admin' || !user) return
    const ch = supabase
      .channel(`admin-new-shops-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shops' },
        (payload) => {
          toast.custom(t => <NewShopToast t={t} shop={payload.new} />, {
            duration: 12000, position: 'top-right',
          })
          playBeep(520, 780)
          qc.invalidateQueries({ queryKey: ['pending-shops-count'] })
          qc.invalidateQueries({ queryKey: ['admin-shops'] })
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [type, user]) // eslint-disable-line

  /* ── Realtime: admin listens for new service submissions (INSERT) ── */
  useEffect(() => {
    if (type !== 'admin' || !user) return
    const ch = supabase
      .channel(`admin-new-services-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'services' },
        (payload) => {
          toast.custom(t => <NewServiceToast t={t} service={payload.new} />, {
            duration: 12000, position: 'top-right',
          })
          playServiceChime()
          qc.invalidateQueries({ queryKey: ['pending-services-count'] })
          qc.invalidateQueries({ queryKey: ['admin-services'] })
        })
      .subscribe((status) => {
        // If subscription fails, refetch count as fallback
        if (status === 'CHANNEL_ERROR') {
          qc.invalidateQueries({ queryKey: ['pending-services-count'] })
        }
      })
    return () => supabase.removeChannel(ch)
  }, [type, user?.id]) // eslint-disable-line

  /* ── Realtime: shop owner listens for confirmed orders (UPDATE) ── */
  // ManageOrders.tsx sets status='confirmed' when admin assigns order to a shop
  useEffect(() => {
    if (type === 'admin' || !isShopOwner || !user) return
    const ch = supabase
      .channel(`shopowner-confirmed-orders-${user.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders',
          filter: 'status=eq.confirmed' },
        (payload) => {
          const order = payload.new
          // Only notify if it belongs to this owner's shop
          if (shopIdsRef.current.length && !shopIdsRef.current.includes(order.shop_id)) return
          toast.custom(t => <ForwardedOrderToast t={t} order={order} />, {
            duration: 10000, position: 'top-right',
          })
          playBeep(660, 880)
          qc.invalidateQueries({ queryKey: ['shop-order-stats'] })
          qc.invalidateQueries({ queryKey: ['shop-orders'] })
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [type, isShopOwner, user]) // eslint-disable-line

  useEffect(() => {
    if (!loading && !user) navigate('/login')
    if (!loading && user && type === 'admin' && !isAdmin) navigate('/dashboard')
  }, [user, loading, isAdmin, type])

  if (loading || !user) return null

  /* ── Sidebar link definitions ── */
  const userLinks = [
    { to: '/dashboard',              icon: '📊', label: 'ওভারভিউ',        end: true },
    { to: '/dashboard/favorites',    icon: '❤️', label: 'পছন্দের দোকান' },
    { to: '/dashboard/chat',         icon: '💬', label: 'বার্তা' },
    { to: '/dashboard/my-services',  icon: '🛠️', label: 'আমার সেবা' },
    { to: '/dashboard/profile',      icon: '👤', label: 'প্রোফাইল' },
  ]

  const ownerLinks = [
    { to: '/dashboard',              icon: '📊', label: 'ওভারভিউ',        end: true },
    { to: '/dashboard/shops',        icon: '🏪', label: 'আমার দোকান' },
    { to: '/dashboard/add-shop',     icon: '➕', label: 'নতুন দোকান' },
    { to: '/dashboard/products',     icon: '🛍️', label: 'পণ্য আপলোড' },
    { to: '/dashboard/orders',       icon: '📦', label: 'অর্ডার' },
    { to: '/dashboard/analytics',    icon: '📈', label: 'অ্যানালিটিক্স' },
    { to: '/dashboard/chat',         icon: '💬', label: 'বার্তা' },
    { to: '/dashboard/qr-code',      icon: '🔲', label: 'QR কোড' },
    { to: '/dashboard/my-services',  icon: '🛠️', label: 'আমার সেবা' },
    { to: '/dashboard/profile',      icon: '👤', label: 'প্রোফাইল' },
  ]

  const adminLinks = [
    { section: 'ওভারভিউ' },
    { to: '/admin',                   icon: '📊', label: 'ড্যাশবোর্ড',     end: true },
    { to: '/admin/analytics',         icon: '📈', label: 'অ্যানালিটিক্স' },
    { section: 'দোকান ও পণ্য' },
    { to: '/admin/shop-requests',     icon: '🏪', label: 'দোকান আবেদন' },
    { to: '/admin/shops',             icon: '🏬', label: 'দোকান' },
    { to: '/admin/categories',        icon: '📋', label: 'বিভাগ' },
    { to: '/admin/products',          icon: '🛍️', label: 'পণ্য' },
    { section: 'ব্যবহারকারী' },
    { to: '/admin/users',             icon: '👥', label: 'ব্যবহারকারী' },
    { to: '/admin/roles',             icon: '🛡️', label: 'Role' },
    { to: '/admin/verifications',     icon: '🔏', label: 'যাচাইকরণ' },
    { section: 'অপারেশন' },
    { to: '/admin/orders',            icon: '📦', label: 'অর্ডার' },
    { to: '/admin/services',          icon: '🛠️', label: 'সেবা অনুমোদন' },
    { to: '/admin/service-directory', icon: '📒', label: 'সেবা ডিরেক্টরি' },
    { to: '/admin/ads',               icon: '📢', label: 'বিজ্ঞাপন' },
    { section: 'সিস্টেম' },
    { to: '/admin/audit-log',         icon: '🗂️', label: 'Audit Log' },
    { to: '/admin/error-logs',        icon: '🐛', label: 'Error Logs' },
    { to: '/admin/settings',          icon: '⚙️', label: 'সেটিংস' },
  ]

  let links
  if (type === 'admin')      links = adminLinks
  else if (isShopOwner)      links = ownerLinks
  else                       links = userLinks

  const roleBadge = {
    super_admin:    '🔴 Super Admin',
    market_manager: '🟠 Market Manager',
    shop_owner:     '🟢 Shop Owner',
    user:           '🔵 User',
  }[role] || '🔵 User'

  /* badge for each link */
  const getBadge = (to) => {
    if (to === '/admin/orders')         return adminBadge
    if (to === '/admin/shops')          return pendingShopsCount
    if (to === '/admin/shop-requests')  return pendingRequestsCount
    if (to === '/admin/services')       return pendingServicesCount
    if (to === '/dashboard/orders')     return ownerBadge
    if (to === '/dashboard/chat')       return unreadMessages
    return 0
  }

  /* mobile notification label */
  const mobileBadge = adminBadge || ownerBadge

  const sidebar = (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300',
      'lg:translate-x-0 lg:static lg:z-auto',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    )}>
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {profile?.full_name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{roleBadge}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {links.map((link, i) =>
          link.section ? (
            <SidebarSection key={`section-${i}`} label={link.section} />
          ) : (
            <SidebarLink
              key={link.to}
              {...link}
              badge={getBadge(link.to)}
              onClose={() => setSidebarOpen(false)}
            />
          )
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 space-y-1">
        {type === 'admin' && (
          <SidebarLink to="/dashboard" icon="👤" label="User Dashboard" onClose={() => setSidebarOpen(false)} />
        )}
        {type !== 'admin' && isAdmin && (
          <SidebarLink to="/admin" icon="⚙️" label="অ্যাডমিন প্যানেল" onClose={() => setSidebarOpen(false)} />
        )}
        <NavLink to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all">
          <span className="text-lg w-6 text-center">🏠</span>
          <span>মূল সাইট</span>
        </NavLink>
        <button
          onClick={() => { setSidebarOpen(false); signOut() }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
          <span className="text-lg w-6 text-center">🚪</span>
          <span>লগআউট</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {sidebar}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="text-xl p-1">☰</button>
          <span className="font-semibold text-gray-800">
            {type === 'admin' ? '⚙️ Admin' : '👤 Dashboard'}
          </span>
          {mobileBadge > 0 && (
            <NavLink
              to={type === 'admin' ? '/admin/orders' : '/dashboard/orders'}
              className="ml-auto flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold rounded-full px-3 py-1">
              📦 {mobileBadge} নতুন
            </NavLink>
          )}
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
