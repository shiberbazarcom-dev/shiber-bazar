import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCategories } from '../../hooks/useCategories'
import { getAvatarUrl } from '../../lib/utils'
import NotificationBell from '../NotificationBell'

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const { data: categories = [] } = useCategories()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const catRef     = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const avatar = profile?.avatar_url || getAvatarUrl(profile?.full_name || user?.email || 'U', '1a9e3f')

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top strip */}
      <div style={{ background: '#2563EB' }} className="text-white text-xs py-1 text-center hidden sm:block">
        📍 শিবের বাজার — আপনার পাড়ার সকল দোকান এক জায়গায়
      </div>

      <div className="container-app py-2.5">
        <div className="flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src="/logo.png" alt="শিবের বাজার" className="h-9 w-auto object-contain" />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-gray-50">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="দোকান খুঁজুন..."
                className="flex-1 bg-transparent px-3.5 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
              <button type="submit"
                className="px-4 text-white text-sm flex-shrink-0"
                style={{ background: '#2563EB' }}>
                🔍
              </button>
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              হোম
            </NavLink>

            {/* Categories dropdown */}
            <div className="relative" ref={catRef}>
              <button onClick={() => setCatOpen(o => !o)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                ক্যাটাগরি <span className="text-xs">{catOpen ? '▲' : '▼'}</span>
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-card-hover border border-gray-100 py-2 z-50">
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

            <NavLink to="/shops" className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              সব দোকান
            </NavLink>

            <NavLink to="/track-order" className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              📦 অর্ডার ট্র্যাক
            </NavLink>

            <NavLink to="/contact" className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              📞 যোগাযোগ
            </NavLink>
          </nav>

          {/* Auth / Profile */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setProfileOpen(o => !o)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                    onError={e => { e.target.src = getAvatarUrl('U', '1a9e3f') }} />
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {profile?.full_name || 'প্রোফাইল'}
                  </span>
                </button>
                {profileOpen && (
                  <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-card-hover border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{profile?.full_name || 'ব্যবহারকারী'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      📊 ড্যাশবোর্ড
                    </Link>
                    <Link to="/dashboard/add-shop" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      ➕ দোকান যোগ করুন
                    </Link>
                    <Link to="/account" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      👤 আমার অ্যাকাউন্ট
                    </Link>
                    <Link to="/track-order" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      📦 অর্ডার ট্র্যাক
                    </Link>
                    <Link to="/dashboard/favorites" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      ❤️ পছন্দের দোকান
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                        ⚙️ অ্যাডমিন প্যানেল
                      </Link>
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
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  লগইন
                </Link>
                <Link to="/register"
                  className="text-sm font-medium text-white px-3.5 py-1.5 rounded-lg"
                  style={{ background: '#2563EB' }}>
                  রেজিস্ট্রেশন
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-2 pb-2 border-t border-gray-100 pt-2 space-y-1">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              🏠 হোম
            </NavLink>
            <NavLink to="/shops" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              🏪 সব দোকান
            </NavLink>
            <NavLink to="/categories" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              📋 বিভাগসমূহ
            </NavLink>
            <NavLink to="/track-order" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              📦 অর্ডার ট্র্যাক
            </NavLink>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              📞 যোগাযোগ
            </NavLink>
            <NavLink to="/order" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              🛒 অর্ডার করুন
            </NavLink>
            {!user && (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  🔑 লগইন
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50">
                  ✍️ রেজিস্ট্রেশন
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
