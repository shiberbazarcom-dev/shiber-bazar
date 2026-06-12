import { Link } from 'react-router-dom'
import { useDirectoryCategories } from '../../hooks/useServiceDirectory'
import SEO from '../../components/SEO'

/* ═══════════════════════════════════════════════════════
   স্থানীয় সেবাসমূহ — category cards (public landing)
═══════════════════════════════════════════════════════ */
export default function LocalServices() {
  const { data: categories = [], isLoading } = useDirectoryCategories()

  return (
    <div className="bg-white min-h-screen">
      <SEO
        title="স্থানীয় সেবাসমূহ"
        description="শিবের বাজারের স্থানীয় সেবা ডিরেক্টরি — সিএনজি চালক, ডাক্তার, ইলেকট্রিশিয়ান, প্লাম্বার, রক্তদাতা, জরুরি নম্বর সহ প্রয়োজনীয় সব যোগাযোগ এক জায়গায়।"
      />
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="text-center mb-7">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">স্থানীয় সেবাসমূহ</h1>
          <p className="text-sm text-gray-400 mt-1.5">
            শিবের বাজারের প্রয়োজনীয় সেবা — এক ক্লিকে যোগাযোগ করুন
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📒</div>
            <p className="text-gray-500 font-medium">সেবা ডিরেক্টরি শীঘ্রই আসছে</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map(cat => (
              <Link key={cat.id} to={`/services/${cat.slug}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:border-blue-200 hover:shadow-md active:scale-95 transition-all">
                <div className="text-4xl mb-2.5">{cat.icon}</div>
                <p className="text-sm font-semibold text-gray-800 leading-snug">{cat.name_bn}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
