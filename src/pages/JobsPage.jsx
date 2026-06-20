import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePublicJobs } from '../hooks/useJobs'
import SEO from '../components/SEO'

const CATEGORIES = [
  'সব', 'দোকান কর্মী', 'ডেলিভারি রাইডার', 'শিক্ষক', 'ইলেকট্রিশিয়ান',
  'প্লাম্বার', 'ড্রাইভার', 'ফ্রিল্যান্সার', 'নিরাপত্তা রক্ষী',
  'গৃহকর্মী', 'রান্নার কাজ', 'অন্যান্য',
]

function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-4 group">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${job.is_featured ? 'bg-amber-50' : 'bg-blue-50'}`}>
          {job.is_featured ? '⭐' : '💼'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
              {job.title}
            </p>
            {job.is_featured && (
              <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                ফিচার্ড
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
            <span>📋 {job.category}</span>
            {job.company_name && <span>🏢 {job.company_name}</span>}
            {job.salary       && <span className="text-green-600 font-medium">💰 {job.salary}</span>}
            {job.location     && <span>📍 {job.location}</span>}
          </div>

          {job.description && (
            <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{job.description}</p>
          )}

          {job.expiry_date && (
            <p className="mt-1 text-[10px] text-gray-300">মেয়াদ: {job.expiry_date}</p>
          )}
        </div>
      </div>

      {/* Quick contact */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50" onClick={e => e.preventDefault()}>
        {job.contact_phone && (
          <a href={`tel:${job.contact_phone}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
            📞 কল করুন
          </a>
        )}
        {job.whatsapp_number && (
          <a href={`https://wa.me/${job.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
            💬 WhatsApp
          </a>
        )}
      </div>
    </Link>
  )
}

export default function JobsPage() {
  const [category, setCategory] = useState('all')
  const [search, setSearch]     = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data: jobs = [], isLoading } = usePublicJobs({
    category: category === 'সব' ? 'all' : category,
    search,
  })

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const featured = jobs.filter(j => j.is_featured)
  const regular  = jobs.filter(j => !j.is_featured)

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="চাকরির বোর্ড — শিবের বাজার"
        description="শিবের বাজার ও আশপাশের এলাকার সকল চাকরির বিজ্ঞাপন। দোকান কর্মী, ডেলিভারি, শিক্ষক, ড্রাইভারসহ বিভিন্ন পদে নিয়োগ।"
      />

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 py-10 px-4">
        <div className="container-app text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">💼 চাকরির বোর্ড</h1>
          <p className="text-blue-100 text-sm mb-6">শিবের বাজার ও আশপাশের এলাকার চাকরির বিজ্ঞাপন</p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="চাকরির পদবি খুঁজুন..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
            />
            <button type="submit"
              className="px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors flex-shrink-0">
              খুঁজুন
            </button>
          </form>
        </div>
      </div>

      <div className="container-app py-6">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => {
            const key = cat === 'সব' ? 'all' : cat
            return (
              <button key={cat} onClick={() => setCategory(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  category === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                {cat}
              </button>
            )
          })}
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400">লোড হচ্ছে...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">💼</p>
            <p className="text-gray-500">এই ক্যাটাগরিতে কোনো চাকরি নেই</p>
          </div>
        ) : (
          <>
            {/* Featured jobs */}
            {featured.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-400 rounded-full" />
                  ফিচার্ড চাকরি
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {featured.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              </div>
            )}

            {/* Regular jobs */}
            {regular.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    সকল চাকরি ({regular.length})
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {regular.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
