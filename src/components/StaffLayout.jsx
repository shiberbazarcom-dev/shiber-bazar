import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { ShoppingBag, Package, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function StaffLayout() {
  const { staffSession, logout } = useStaffAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/staff-login', { replace: true })
  }

  const navItems = [
    { to: '/staff/orders',   label: 'অর্ডার',   icon: ShoppingBag },
    { to: '/staff/products', label: 'প্রোডাক্ট', icon: Package },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-700">🏪 Staff</span>
            {staffSession?.shop_name && (
              <span className="text-sm text-gray-500 hidden sm:block">— {staffSession.shop_name}</span>
            )}
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">{staffSession?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">লগআউট</span>
            </button>
            {/* Mobile menu toggle */}
            <button className="sm:hidden p-1.5" onClick={() => setMenuOpen(v => !v)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="sm:hidden border-t bg-white px-4 py-2 flex gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
