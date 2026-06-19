import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useServices, useServiceCategories } from '../../hooks/useServices'
import { SERVICE_CATEGORIES } from '../../data/serviceCategories'
import ServiceCard from '../../components/services/ServiceCard'
import ServiceCategoryCard from '../../components/services/ServiceCategoryCard'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="flex flex-col items-center pt-2 pb-3 gap-3">
        <div className="w-20 h-20 rounded-full bg-gray-100" />
        <div className="h-4 bg-gray-100 rounded w-24" />
        <div className="h-3 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-px bg-gray-50 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="flex gap-2 mt-3">
        <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
        <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '')
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const { data: categories = [] } = useServiceCategories()
  const cats = categories.length ? categories : SERVICE_CATEGORIES
  const activeCat = cats.find(c => c.slug === slug)

  const { data: services = [], isLoading } = useServices(slug || null, query)

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(inputVal.trim())
      const p = new URLSearchParams()
      if (inputVal.trim()) p.set('q', inputVal.trim())
      setSearchParams(p, { replace: true })
    }, 350)
    return () => clearTimeout(t)
  }, [inputVal]) // eslint-disable-line

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={activeCat ? `${activeCat.icon} ${activeCat.name_bn} — স্থানীয় সেবা` : 'স্থানীয় সেবাসমূহ'}
        description="শিবের বাজারের স্থানীয় সেবা — সিএনজি, ডাক্তার, শিক্ষক, ইলেকট্রিশিয়ান, রক্তদাতা ও আরও অনেক কিছু।"
      />

      {/* ── Hero banner ── */}
      <div style={{ background: 'linear-gradient(135deg, #2563EB 0%, #60a5fa 100%)' }} className="pt-6 pb-8 px-4">
        {/* Breadcrumb */}
        {activeCat && (
          <div className="flex items-center gap-1.5 text-white/70 text-xs mb-3">
            <Link to="/services" className="hover:text-white transition-colors">সব সেবা</Link>
            <span>/</span>
            <span className="text-white font-medium">{activeCat.name_bn}</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {activeCat ? `${activeCat.icon} ${activeCat.name_bn}` : '🛠️ স্থানীয় সেবা'}
            </h1>
            <p className="text-white/70 text-xs mt-1">শিবের বাজার এলাকার বিশ্বস্ত সেবা প্রদানকারী</p>
          </div>
          <Link
            to="/services/submit"
            className="flex-shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors whitespace-nowrap"
          >
            + সেবা যোগ করুন
          </Link>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 flex rounded-xl overflow-hidden bg-white shadow-sm">
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="সেবা বা নাম খুঁজুন..."
              className="flex-1 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
            {inputVal && (
              <button type="button" onClick={() => setInputVal('')} className="px-3 text-gray-400 hover:text-gray-600 text-lg">✕</button>
            )}
          </div>
          <button
            className="px-4 py-3 text-white font-bold rounded-xl text-base flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)' }}
          >
            🔍
          </button>
        </div>
      </div>

      <div className="px-4 pb-28 md:pb-10">

        {/* ── Category pills (when filtered) ── */}
        {slug && (
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide -mx-4 px-4">
            <Link
              to="/services"
              className="flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-blue-300 whitespace-nowrap"
            >
              সব সেবা
            </Link>
            {cats.map(cat => (
              <Link
                key={cat.slug}
                to={`/services/${cat.slug}`}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full whitespace-nowrap transition-all ${
                  cat.slug === slug
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name_bn}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Category grid (home view) ── */}
        {!slug && !query && (
          <div className="pt-5 mb-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">সেবার ধরন</h2>
            <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
              {cats.map(cat => (
                <ServiceCategoryCard key={cat.slug} category={cat} />
              ))}
            </div>
          </div>
        )}

        {/* ── Results header ── */}
        {(slug || query) && (
          <div className="pt-4 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {isLoading ? 'লোড হচ্ছে...' : `${services.length}টি সেবা পাওয়া গেছে`}
              {query && <span className="text-gray-400 font-normal ml-1">— "{query}"</span>}
            </h2>
          </div>
        )}

        {/* ── All services label (home) ── */}
        {!slug && (
          <div className="pt-3 pb-2">
            <h2 className="text-sm font-bold text-gray-700">
              {query ? `"${query}" — ${services.length}টি ফলাফল` : 'সকল সেবা'}
            </h2>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
            {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && services.length === 0 && (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 mt-3">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-gray-600 font-semibold mb-1">কোনো সেবা পাওয়া যায়নি</p>
            <p className="text-xs text-gray-400 mb-5">
              {query ? `"${query}" সম্পর্কিত সেবা নেই` : 'এই এলাকায় এখনো সেবা যোগ হয়নি'}
            </p>
            <Link
              to="/services/submit"
              className="inline-block text-sm font-bold text-white px-6 py-2.5 rounded-xl"
              style={{ background: BLUE }}
            >
              + আপনার সেবা যোগ করুন
            </Link>
          </div>
        )}

        {/* ── Service cards ── */}
        {!isLoading && services.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
            {services.map(s => <ServiceCard key={s.id} service={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}
