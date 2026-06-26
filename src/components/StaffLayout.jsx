import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { ShoppingBag, Package, LogOut, Users } from 'lucide-react'

export default function StaffLayout() {
  const { staffSession, loading, logout } = useStaffAuth()
  const navigate = useNavigate()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="text-4xl animate-pulse">🏪</div>
        <p className="text-gray-400 text-sm">লোড হচ্ছে...</p>
      </div>
    </div>
  )
  if (!staffSession) return <Navigate to="/staff-login" replace />

  const isManager = staffSession.role === 'manager'
  const roleLabel = isManager ? 'ম্যানেজার' : 'স্টাফ'
  const roleBadgeClass = isManager
    ? 'bg-purple-100 text-purple-700 border border-purple-200'
    : 'bg-blue-100 text-blue-700 border border-blue-200'

  function handleLogout() {
    logout()
    navigate('/staff-login', { replace: true })
  }

  const navItems = [
    { to: '/staff/orders',   label: 'অর্ডার',   icon: ShoppingBag },
    { to: '/staff/products', label: 'প্রোডাক্ট', icon: Package },
    ...(isManager ? [{ to: '/staff/team', label: 'টিম', icon: Users }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Left: shop + role */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl">🏪</span>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm leading-tight truncate">
                {staffSession.shop_name || 'দোকান'}
              </p>
              <p className="text-xs text-gray-400 leading-tight">শিবের বাজার</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${roleBadgeClass}`}>
              {roleLabel}
            </span>
          </div>

          {/* Center: nav */}
          <nav className="flex items-center gap-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:block">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right: name + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700 leading-tight">{staffSession.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
              title="লগআউট"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block text-xs">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
