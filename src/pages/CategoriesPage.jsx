import { Link } from 'react-router-dom'
import { useCategoryWithCount } from '../hooks/useCategories'
import SEO from '../components/SEO'

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategoryWithCount()

  return (
    <div>
      <SEO
        title="সব ক্যাটাগরি"
        description="শিবের বাজারের সকল দোকানের ক্যাটাগরি। খাবার, পোশাক, ইলেকট্রনিক্স, ফার্মেসি, কসমেটিক্স সহ বিভিন্ন ধরনের দোকান বিভাগ অনুযায়ী খুঁজুন।"
      />
      {/* Header */}
      <section style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #60a5fa 100%)' }} className="py-8">
        <div className="container-app text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">📋 সব ক্যাটাগরি</h1>
          <p className="text-purple-100 text-sm">
            {categories.length > 0 ? `${categories.length}টি ক্যাটাগরিতে দোকান খুঁজুন` : 'দোকানের ক্যাটাগরিসমূহ'}
          </p>
        </div>
      </section>

      <div className="container-app py-6 pb-24 md:pb-10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array(15).fill(0).map((_, i) => <Skeleton key={i} className="h-28 sm:h-32" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400">কোনো ক্যাটাগরি নেই</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.slug}`}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col items-center gap-2.5 sm:gap-3 text-center hover:shadow-md hover:border-purple-200 border border-gray-100 transition-all group active:scale-95 min-h-[110px] sm:min-h-[120px] justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-transform group-hover:scale-110"
                  style={{ background: '#eff6ff' }}>
                  {cat.icon}
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-gray-700 group-hover:text-purple-700 transition-colors leading-tight">
                    {cat.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{cat.shop_count || 0} দোকান</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
