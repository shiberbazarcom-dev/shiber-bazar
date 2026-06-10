import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useMyShops } from '../../hooks/useShops'
import { useFavorites } from '../../hooks/useShops'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

function StatCard({ icon, label, value, color, to }) {
  const content = (
    <div className={`stat-card hover:shadow-card-hover transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function DashboardOverview() {
  const { profile, user } = useAuth()
  const { data: myShops  = [] } = useMyShops()
  const { data: favorites = [] } = useFavorites()

  const approvedShops = myShops.filter(s => s.is_approved)
  const pendingShops  = myShops.filter(s => !s.is_approved)

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
          স্বাগতম, {profile?.full_name?.split(' ')[0] || 'ব্যবহারকারী'} 👋
        </h1>
        <p className="text-slate-500">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🏪" label="আমার দোকান" value={myShops.length} color="bg-brand-100 dark:bg-brand-900/30 text-brand-600" to="/dashboard/shops" />
        <StatCard icon="✅" label="অনুমোদিত" value={approvedShops.length} color="bg-green-100 dark:bg-green-900/30 text-green-600" to="/dashboard/shops" />
        <StatCard icon="⏳" label="অপেক্ষমান" value={pendingShops.length} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600" to="/dashboard/shops" />
        <StatCard icon="❤️" label="পছন্দের দোকান" value={favorites.length} color="bg-red-100 dark:bg-red-900/30 text-red-500" to="/dashboard/favorites" />
      </div>

      {/* Recent shops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/50">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">আমার সর্বশেষ দোকান</h2>
            <Link to="/dashboard/shops" className="text-brand-600 text-sm font-medium hover:underline">সব দেখুন →</Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {myShops.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 mb-4">কোনো দোকান নেই</p>
                <Link to="/dashboard/add-shop"><Button size="sm">+ নতুন দোকান যোগ করুন</Button></Link>
              </div>
            ) : myShops.slice(0, 4).map(shop => (
              <div key={shop.id} className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                  {shop.cover_image && <img src={shop.cover_image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{shop.shop_name}</p>
                  <p className="text-xs text-slate-400 truncate">{shop.categories?.name}</p>
                </div>
                <Badge variant={shop.is_approved ? 'green' : 'gold'} dot>
                  {shop.is_approved ? 'অনুমোদিত' : 'অপেক্ষমান'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Profile summary */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-5">প্রোফাইল</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {profile?.full_name?.[0] || 'U'}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">{profile?.full_name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <Badge variant="blue" className="mt-1">{profile?.phone || 'ফোন নেই'}</Badge>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">ভূমিকা</span>
              <Badge variant="green">{profile?.role || 'user'}</Badge>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-500">একাউন্ট স্ট্যাটাস</span>
              <Badge variant={profile?.is_active ? 'green' : 'red'} dot>{profile?.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge>
            </div>
          </div>
          <Link to="/dashboard/profile">
            <Button variant="secondary" size="sm" className="mt-4 w-full">✏️ প্রোফাইল সম্পাদনা</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
