import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useServices, useServiceCategories } from '../../hooks/useServices'
import { SERVICE_CATEGORIES } from '../../data/serviceCategories'
import ServiceCard from '../../components/services/ServiceCard'
import ServiceCategoryCard from '../../components/services/ServiceCategoryCard'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="h-20 bg-gray-100 rounded-xl mb-3" />
      <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-full mb-3" />
      <div className="flex gap-2">
        <div className="flex-1 h-8 bg-gray-100 rounded-xl" />
        <div className="flex-1 h-8 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const { slug } = useParams()          // undefined = all categories
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [inputVal, setInputVal] = useState(query)

  const { data: categories = [] } = useServiceCategories()
  const cats = categories.length ? categories : SERVICE_CATEGORIES

  const activeCat = cats.find(c => c.slug === slug)

  const { data: services = [], isLoading } = useServices(slug || null, query)

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(inputVal.trim())
    if (inputVal.trim()) setSearchParams({ q: inputVal.trim() })
    else setSearchParams({})
  }

  const clearSearch = () => {
    setQuery('')
    setInputVal('')
    setSearchParams({})
  }

  return (
    <div className="container-app py-6 pb-28 md:pb-10">
      <SEO
        title={activeCat ? `${activeCat.icon} ${activeCat.name_bn} — স্থানীয় সেবা` : 'স্থানীয় সেবাসমূহ'}
        description="শিবের বাজারের স্থানীয় সেবা — সিএনজি, ডাক্তার, শিক্ষক, ইলেকট্রিশিয়ান, রক্তদাতা ও আরও অনেক কিছু।"
      />

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Link to="/services" className="text-sm text-blue-600 hover:underline">স্থানীয় সেবাসমূহ</Link>
          {activeCat && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-gray-600">{activeCat.icon} {activeCat.name_bn}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {activeCat ? `${activeCat.icon} ${activeCat.name_bn}` : '🛠️ স্থানীয় সেবাসমূহ'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">শিবের বাজার এলাকার বিশ্বস্ত সেবা প্রদানকারী</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="flex-1 flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 bg-gray-50">
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="সেবা বা নাম খুঁজুন..."
            className="flex-1 px-4 py-2.5 text-sm bg-transparent focus:outline-none text-gray-700"
          />
          {inputVal && (
            <button type="button" onClick={clearSearch} className="px-3 text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 text-white text-sm font-bold rounded-xl"
          style={{ background: BLUE }}>
          🔍
        </button>
      </form>

      {/* Category grid — show only when not filtered */}
      {!slug && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700 text-base">সেবার ধরন বেছে নিন</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {cats.map(cat => (
              <ServiceCategoryCard key={cat.slug} category={cat} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-700">
          {slug ? `${activeCat?.name_bn || ''} সেবা` : 'সকল সেবা'}
          {query && <span className="font-normal text-gray-400 ml-2 text-sm">— "{query}"</span>}
        </h2>
        <Link
          to="/services/submit"
          className="text-xs font-bold text-white px-4 py-2 rounded-xl"
          style={{ background: BLUE }}>
          + সেবা যোগ করুন
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} />)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-600 font-semibold mb-1">কোনো সেবা পাওয়া যায়নি</p>
          <p className="text-sm text-gray-400 mb-5">এই এলাকায় আপনার সেবা যোগ করুন</p>
          <Link
            to="/services/submit"
            className="inline-block text-sm font-bold text-white px-6 py-2.5 rounded-xl"
            style={{ background: BLUE }}>
            সেবা যোগ করুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => <ServiceCard key={s.id} service={s} />)}
        </div>
      )}
    </div>
  )
}
