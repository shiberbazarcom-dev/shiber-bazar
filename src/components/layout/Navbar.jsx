import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCategories } from '../../hooks/useCategories'
import { useMarketStats } from '../../hooks/useShops'
import { getAvatarUrl } from '../../lib/utils'
import SearchDropdown from '../SearchDropdown'

function TickerStrip({ stats }) {
  const items = [
    stats?.totalShops    ? `🏪 ${stats.totalShops}+ দোকান এখন অনলাইনে` : null,
    `🚀 শিবের বাজার — এখন AI-চালিত স্মার্ট বাজার`,
    stats?.totalProducts ? `🛍️ ${stats.totalProducts}+ পণ্য এক জায়গায়` : null,
    `💬 AI চ্যাটবট — দোকানদার ঘুমালেও অর্ডার নেয়`,
    stats?.totalUsers    ? `👥 ${stats.totalUsers}+ ক্রেতা-বিক্রেতা যুক্ত হয়েছেন` : null,
    `📲 অ্যাপ ইন্সটল করুন, হাতের মুঠোয় রাখুন বাজার`,
    `⚡ সরাসরি চ্যাট করুন — তাৎক্ষণিক যোগাযোগ`,
    `🎯 আপনার দোকান যোগ করুন — সম্পূর্ণ বিনামূল্যে`,
  ].filter(Boolean)

  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % items.length)
        setVisible(true)
      }, 400)
    }, 3500)
    return () => clearInterval(interval)
  }, [items.length])

  return (
    <div className="hidden sm:flex items-center justify-center text-white text-xs py-1.5 overflow-hidden h-7"
      style={{ background: 'linear-gradient(90deg, #1e3a8a, #1d4ed8, #2563eb, #1d4ed8, #1e3a8a)' }}>
      <span
        style={{
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-6px)',
          display: 'block',
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
        {items[idx]}
      </span>
    </div>
  )
}

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const { totalCount: cartCount } = useCart()
  const { data: categories = [] } = useCategories()
  const { data: stats } = useMarketStats()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [query, setQuery]             = useState('')
  const [showSuggest, setShowSuggest] = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [announceBannerDismissed, setAnnounceBannerDismissed] = useState(false)
  const [catOpen, setCatOpen]         = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // PWA Install banner — check UA immediately on first render (before any effect)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(() => {
    try {
      const ua = navigator.userAgent || ''
      const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches
        || window.navigator.standalone === true
      if (isStandalone || window.__pwaInstalled) return false
      return /iphone|ipad|ipod/i.test(ua) || /android/i.test(ua)
    } catch { return false }
  })
  const [isIOS, setIsIOS] = useState(() => {
    try {
      const ua = navigator.userAgent || ''
      return /iphone|ipad|ipod/i.test(ua) && !window.MSStream
    } catch { return false }
  })

  const catRef     = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (catRef.current     && !catRef.current.contains(e.target))     setCatOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close overlays on route change
  useEffect(() => { setMenuOpen(false); setShowSuggest(false) }, [location.pathname])

  // PWA install prompt — UA already checked in useState above
  // This effect only handles: standalone check, beforeinstallprompt, appinstalled
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    if (isStandalone || window.__pwaInstalled) {
      setShowInstall(false)
      return
    }

    // Pick up beforeinstallprompt captured in index.html before React mounted
    if (window.__pwaInstallPrompt) {
      setInstallPrompt(window.__pwaInstallPrompt)
    }

    // Listen for future beforeinstallprompt fires
    const handler = (e) => {
      e.preventDefault()
      window.__pwaInstallPrompt = e
      setInstallPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Hide banner once installed
    const onInstalled = () => {
      window.__pwaInstalled = true
      window.__pwaInstallPrompt = null
      setShowInstall(false)
      setInstallPrompt(null)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    const prompt = installPrompt || window.__pwaInstallPrompt
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setShowInstall(false)
      setInstallPrompt(null)
      window.__pwaInstallPrompt = null
    }
  }, [installPrompt])

  const dismissInstall = useCallback(() => {
    setShowInstall(false)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    setShowSuggest(false)
  }

  const avatar = profile?.avatar_url || getAvatarUrl(profile?.full_name || user?.email || 'U', '1a9e3f')

  const pathActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* ══════════════════════════════════════════════
          TOP NAVBAR
      ══════════════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">

        {/* 🎉 Launch Announcement Banner */}
        {!announceBannerDismissed && (
          <div className="relative flex items-center justify-center gap-2 px-4 py-2 text-white text-xs font-medium" style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 50%, #0891b2 100%)' }}>
            <span className="animate-pulse">🎉</span>
            <span>শিবের বাজার অ্যাপ খুব শীঘ্রই পূর্ণরূপে চালু হতে যাচ্ছে — আপনার দোকান এখনই যোগ করুন!</span>
            <button
              onClick={() => setAnnounceBannerDismissed(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              aria-label="বন্ধ করুন"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* PWA Install Banner — mobile only */}
        {showInstall && (
          <div className="md:hidden flex items-center gap-2 px-3 py-2" style={{ background: '#1d4ed8' }}>
            <span className="text-xl flex-shrink-0">📲</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold leading-tight">শিবের বাজার অ্যাপ ইন্সটল করুন</p>
              {isIOS
                ? <p className="text-blue-200 text-[10px] leading-tight">Safari: Share ⬆️ → "Add to Home Screen"</p>
                : installPrompt
                  ? <p className="text-blue-200 text-[10px] leading-tight">হোমস্ক্রিনে রাখুন — দ্রুত অ্যাক্সেস</p>
                  : <p className="text-blue-200 text-[10px] leading-tight">Menu ⋮ → "Add to Home Screen" চাপুন</p>
              }
            </div>
            {!isIOS && installPrompt && (
              <button
                onClick={handleInstall}
                className="bg-white text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 active:opacity-80">
                ইন্সটল
              </button>
            )}
            <button onClick={dismissInstall} className="text-blue-200 hover:text-white text-base leading-none flex-shrink-0 p-1">
              ✕
            </button>
          </div>
        )}

        {/* Announcement ticker — only shown after banner is dismissed */}
        {announceBannerDismissed && <TickerStrip stats={stats} />}

        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2">
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Logo — icon + brand + slogan */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <img src="/logo.png" alt="শিবের বাজার"
                className="w-9 h-9 object-contain flex-shrink-0" />
              <span className="hidden sm:flex flex-col leading-tight whitespace-nowrap">
                <span className="font-semibold text-gray-800 text-[15px]">শিবের বাজার</span>
                <span className="text-[10px] font-medium text-blue-600 tracking-widest uppercase">Digital Bazar</span>
              </span>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[90px] sm:min-w-[160px] mx-1 sm:mx-2 relative">
              <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-gray-50">
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggest(true) }}
                  onFocus={() => setShowSuggest(true)}
                  placeholder="দোকান বা পণ্য খুঁজুন..."
                  className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(''); setShowSuggest(false) }}
                    className="px-2 text-gray-400 hover:text-gray-600 flex-shrink-0">
                    ✕
                  </button>
                )}
                <button type="submit"
                  className="flex px-3 sm:px-4 text-white text-sm flex-shrink-0 items-center justify-center"
                  style={{ background: '#2563EB' }}>
                  🔍
                </button>
              </div>
              {/* Autocomplete dropdown — shows on all screen sizes */}
              {showSuggest && query.trim().length > 1 && (
                <SearchDropdown
                  query={query}
                  onClose={() => { setShowSuggest(false); setQuery('') }}
                  searchTab="shops"
                />
              )}
            </form>

            {/* ── Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-1.5 min-w-0">
              {/* Categories dropdown — must stay OUTSIDE the scrollable strip,
                  otherwise overflow-x-auto clips the absolutely-positioned menu */}
              <div className="relative flex-shrink-0" ref={catRef}>
                <button onClick={() => setCatOpen(o => !o)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-gray-50 transition-colors whitespace-nowrap">
                  ক্যাটাগরি <span className="text-xs">{catOpen ? '▲' : '▼'}</span>
                </button>
                {catOpen && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {categories.slice(0, 12).map(cat => (
                      <Link key={cat.id} to={`/category/${cat.slug}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors">
                        <span className="text-lg">{cat.icon}</span>
                        {cat.name}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <Link to="/categories" onClick={() => setCatOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors">
                        সব বিভাগ দেখুন →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable link strip: overflows internally instead of
                  squeezing the search bar down to nothing */}
              <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto">

              <NavLink to="/services" className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'}`}>
                সেবাসমূহ
              </NavLink>

              <NavLink to="/shops" className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'}`}>
                সব দোকান
              </NavLink>

              <NavLink to="/used" className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'}`}>
                পুরাতন
              </NavLink>

              <NavLink to="/track-order" className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'}`}>
                অর্ডার ট্র্যাক
              </NavLink>

<NavLink to="/pricing" className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'}`}>
                প্যাকেজ
              </NavLink>

<NavLink to="/contact" className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'}`}>
                যোগাযোগ
              </NavLink>

              <NavLink to="/hatkhula-union" className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive ? 'text-emerald-700 bg-emerald-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}>
                ইউনিয়ন
              </NavLink>
              </div>
            </nav>

            {/* Cart icon — desktop */}
            <Link to="/cart" className="relative flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: '#2563EB' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Auth / Profile */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {user ? (
                <>
                  {/* Mobile: avatar → direct link to dashboard */}
                  <Link to="/dashboard"
                    className="md:hidden flex items-center p-1 rounded-full active:bg-gray-100 transition-colors">
                    <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                      onError={e => { e.target.src = getAvatarUrl('U', '1a9e3f') }} />
                  </Link>

                  {/* Desktop: avatar → dropdown */}
                  <div className="hidden md:block relative" ref={profileRef}>
                    <button onClick={() => setProfileOpen(o => !o)}
                      className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
                      <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                        onError={e => { e.target.src = getAvatarUrl('U', '1a9e3f') }} />
                      <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate">
                        {profile?.full_name || 'প্রোফাইল'}
                      </span>
                    </button>
                    {profileOpen && (
                      <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100 mb-1">
                          <p className="text-sm font-semibold text-gray-800 truncate">{profile?.full_name || 'ব্যবহারকারী'}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">📊 ড্যাশবোর্ড</Link>
                        <Link to="/dashboard/add-shop" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">➕ দোকান যোগ করুন</Link>
                        <Link to="/account" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">👤 আমার অ্যাকাউন্ট</Link>
                        <Link to="/track-order" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">📦 অর্ডার ট্র্যাক</Link>
                        <Link to="/dashboard/favorites" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">❤️ পছন্দের দোকান</Link>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">⚙️ অ্যাডমিন প্যানেল</Link>
                        )}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={() => { signOut(); setProfileOpen(false) }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            🚪 লগআউট
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                    লগইন
                  </Link>
                  <Link to="/register"
                    className="text-sm font-medium text-white px-3.5 py-1.5 rounded-lg whitespace-nowrap hover:opacity-90 transition-opacity"
                    style={{ background: '#2563EB' }}>
                    রেজিস্ট্রেশন
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(o => !o)} aria-label="মেনু"
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-100 transition-colors flex-shrink-0">
              {menuOpen
                ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="max-w-6xl mx-auto px-4 py-1 flex flex-col">
              {[
                { to: '/categories',  label: 'ক্যাটাগরি' },
                { to: '/services',       label: 'সেবাসমূহ' },
                { to: '/shops',          label: 'সব দোকান' },
                { to: '/used',           label: 'পুরাতন' },
                { to: '/track-order', label: 'অর্ডার ট্র্যাক' },
                { to: '/pricing',     label: 'প্যাকেজ' },
                { to: '/contact',     label: 'যোগাযোগ' },
                { to: '/hatkhula-union', label: 'ইউনিয়ন', color: 'emerald' },
              ].map(item => (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) =>
                    `py-3.5 px-1 text-sm font-medium border-b border-gray-50 transition-colors ${
                      item.color === 'emerald'
                        ? isActive ? 'text-emerald-700' : 'text-emerald-600 active:text-emerald-700'
                        : isActive ? 'text-blue-700' : 'text-gray-700 active:text-blue-700'
                    }`}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════
          MOBILE STICKY BOTTOM NAVIGATION BAR
      ══════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-stretch" style={{ height: '60px' }}>

          {/* হোম */}
          <Link to="/"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              pathActive('/') ? 'text-blue-600' : 'text-gray-500'
            }`}>
            <svg className="w-5 h-5 flex-shrink-0" fill={pathActive('/') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-semibold leading-none">হোম</span>
            {pathActive('/') && <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-blue-600" />}
          </Link>

          {/* দোকান */}
          <Link to="/shops"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
              pathActive('/shops') || pathActive('/shop/') ? 'text-blue-600' : 'text-gray-500'
            }`}>
            <svg className="w-5 h-5 flex-shrink-0" fill={pathActive('/shops') || pathActive('/shop/') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-[10px] font-semibold leading-none">দোকান</span>
            {(pathActive('/shops') || pathActive('/shop/')) && <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-blue-600" />}
          </Link>

          {/* সেবা — স্থানীয় সেবা ডিরেক্টরি */}
          <Link to="/services"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
              pathActive('/services') ? 'text-blue-600' : 'text-gray-500'
            }`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-[10px] font-semibold leading-none">সেবা</span>
            {pathActive('/services') && <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-blue-600" />}
          </Link>

          {/* কার্ট */}
          <Link to="/cart"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
              pathActive('/cart') ? 'text-blue-600' : 'text-gray-500'
            }`}>
            <div className="relative">
              <svg className="w-5 h-5 flex-shrink-0" fill={pathActive('/cart') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold text-white flex items-center justify-center bg-blue-600">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold leading-none">কার্ট</span>
            {pathActive('/cart') && <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-blue-600" />}
          </Link>

          {/* আমার / লগইন — direct link, no popup */}
          <Link
            to={user ? '/dashboard' : '/login'}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
              pathActive('/dashboard') || pathActive('/account') || pathActive('/admin')
                ? 'text-blue-600' : 'text-gray-500'
            }`}>
            {user
              ? <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover ring-2 ring-current flex-shrink-0"
                  onError={e => { e.target.src = getAvatarUrl('U', '1a9e3f') }} />
              : <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            }
            <span className="text-[10px] font-semibold leading-none">{user ? 'প্রোফাইল' : 'লগইন'}</span>
            {(pathActive('/dashboard') || pathActive('/account') || pathActive('/admin')) && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-blue-600" />
            )}
          </Link>

        </div>
      </nav>

      {/* Spacer removed — now handled in PublicLayout (App.jsx) */}
    </>
  )
}
