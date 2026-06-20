import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'
import { usePendingShopsCount, useRealtimePendingShopsCount } from '../../hooks/useNotifications'

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const { data: pendingCount = 0 } = usePendingShopsCount()
  
  // Subscribe to real-time updates for pending shops count
  useRealtimePendingShopsCount()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/')
    }
  }, [user, isAdmin, loading])

  if (loading) return <div className="text-center py-20">লোড হচ্ছে...</div>
  if (!isAdmin) return null

  const navClass = ({ isActive }) =>
    `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-800 text-white flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <h2 className="font-bold text-lg">⚙️ অ্যাডমিন</h2>
          <p className="text-gray-400 text-xs mt-0.5">শিবের বাজার</p>
        </div>
        <nav className="p-3 space-y-1">
          <NavLink to="/admin" end className={navClass}>📊 ড্যাশবোর্ড</NavLink>
          <NavLink to="/admin/shops" className={navClass}>
            <span className="flex items-center justify-between">
              <span>🏪 দোকান ব্যবস্থাপনা</span>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink to="/admin/categories" className={navClass}>📋 বিভাগ ব্যবস্থাপনা</NavLink>

          {/* CMS group */}
          <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">CMS</p>
          <NavLink to="/admin/settings"  className={navClass}>🖊️ সাইট সেটিংস</NavLink>
          <NavLink to="/admin/sections"  className={navClass}>🏠 সেকশন বিল্ডার</NavLink>
          <NavLink to="/admin/ads"       className={navClass}>📢 বিজ্ঞাপন</NavLink>
          <NavLink to="/admin/jobs"      className={navClass}>💼 চাকরির বোর্ড</NavLink>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
