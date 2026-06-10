import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-primary-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="text-2xl">🛍️</span>
            <span>শিবের বাজার</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-primary-200 transition-colors">হোম</Link>
            <Link to="/categories" className="hover:text-primary-200 transition-colors">সব ক্যাটাগরি</Link>
            <Link to="/shops" className="hover:text-primary-200 transition-colors">সব দোকান</Link>

            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link to="/admin" className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-3 py-1.5 rounded-lg text-sm transition-colors">
                    অ্যাডমিন প্যানেল
                  </Link>
                )}
                <div className="relative group">
                  <button className="flex items-center gap-2 bg-primary-800 hover:bg-primary-600 px-3 py-1.5 rounded-lg transition-colors">
                    <span className="text-lg">👤</span>
                    <span className="text-sm">{profile?.full_name || 'আমার প্রোফাইল'}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded-lg shadow-xl w-48 hidden group-hover:block">
                    <Link to="/my-shop" className="block px-4 py-2 hover:bg-gray-50 text-sm rounded-t-lg">আমার দোকান</Link>
                    <Link to="/add-shop" className="block px-4 py-2 hover:bg-gray-50 text-sm">নতুন দোকান যোগ করুন</Link>
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm rounded-b-lg">
                      লগ আউট
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hover:text-primary-200 transition-colors text-sm">লগইন</Link>
                <Link to="/register" className="bg-white text-primary-700 hover:bg-primary-50 font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors">
                  দোকান নিবন্ধন করুন
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-2xl">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-primary-600 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-primary-200">হোম</Link>
            <Link to="/categories" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-primary-200">সব বিভাগ</Link>
            <Link to="/shops" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-primary-200">সব দোকান</Link>
            {user ? (
              <>
                {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-yellow-300">অ্যাডমিন প্যানেল</Link>}
                <Link to="/add-shop" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-primary-200">নতুন দোকান যোগ করুন</Link>
                <button onClick={handleSignOut} className="block py-2 text-red-300 text-left w-full">লগ আউট</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-primary-200">লগইন</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-primary-200">দোকান নিবন্ধন করুন</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
