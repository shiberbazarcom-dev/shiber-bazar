import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePublicListings, USED_CATEGORIES, CONDITION_LABELS } from '../../hooks/useUsedListings'
import { useAuth } from '../../context/AuthContext'
import SEO from '../../components/SEO'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60)   return `${mins || 1} মিনিট আগে`
  const hours = Math.floor(mins / 60)
  if (hours < 24)  return `${hours} ঘণ্টা আগে`
  const days = Math.floor(hours / 24)
  if (days < 30)   return `${days} দিন আগে`
  return new Date(iso).toLocaleDateString('bn-BD')
}

function ListingCard({ listing }) {
  const img = Array.isArray(listing.images) && listing.images[0]
  const sold = listing.status === 'sold'
  return (
    <Link to={`/used/${listing.id}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all overflow-hidden group">
      <div className="relative aspect-[4/3] bg-gray-100">
        {img ? (
          <img src={img} alt={listing.title} loading="lazy"
            className={`w-full h-full object-cover ${sold ? 'opacity-50 grayscale' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">📦</div>
        )}
        {sold && (
          <span className="absolute top-2 left-2 bg-gray-800/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            বিক্রি হয়ে গেছে
          </span>
        )}
        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
          {CONDITION_LABELS[listing.condition] || listing.condition}
        </span>
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {listing.title}
        </p>
        <p className="text-emerald-700 font-bold text-base mt-0.5">
          ৳{Number(listing.price).toLocaleString('bn-BD')}
          {listing.negotiable && <span className="text-[10px] text-gray-400 font-normal ml-1.5">(আলোচনা সাপেক্ষ)</span>}
        </p>
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-400">
          <span className="line-clamp-1">{listing.location ? `📍 ${listing.location}` : listing.category}</span>
          <span className="flex-shrink-0">{timeAgo(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}

export default function UsedMarketPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  // Deep-link support: /used?cat=📱 মোবাইল preselects that category chip
  const catFromUrl = searchParams.get('cat')
  const [category, setCategory] = useState(
    catFromUrl && USED_CATEGORIES.includes(catFromUrl) ? catFromUrl : 'all'
  )
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data: listings = [], isLoading } = usePublicListings({ category, search })

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="পুরাতন বাজার — শিবের বাজার"
        description="পুরাতন মোবাইল, ল্যাপটপ, ফার্নিচার, বাইকসহ যেকোনো জিনিস কিনুন-বিক্রি করুন। শিবের বাজার এলাকার নিজস্ব সেকেন্ড-হ্যান্ড মার্কেটপ্লেস।"
      />

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 py-10 px-4">
        <div className="container-app text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">♻️ পুরাতন বাজার</h1>
          <p className="text-emerald-100 text-sm mb-6">পুরাতন জিনিস কিনুন ও বিক্রি করুন — সরাসরি এলাকার মানুষের সাথে</p>

          <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="কী খুঁজছেন? যেমন: ল্যাপটপ, বাইক..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-700"
            />
            <button type="submit"
              className="px-5 py-2.5 bg-white text-emerald-700 font-semibold rounded-xl text-sm hover:bg-emerald-50 transition-colors flex-shrink-0">
              খুঁজুন
            </button>
          </form>

          <Link
            to={user ? '/used/post' : '/login'}
            className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold rounded-xl text-sm transition-colors shadow-md"
          >
            ➕ বিজ্ঞাপন দিন — ফ্রি
          </Link>
        </div>
      </div>

      <div className="container-app py-6">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button onClick={() => setCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
              category === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            সব
          </button>
          {USED_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                category === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400">লোড হচ্ছে...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">♻️</p>
            <p className="text-gray-500 mb-1">এই ক্যাটাগরিতে কোনো বিজ্ঞাপন নেই</p>
            <p className="text-gray-400 text-sm mb-4">আপনিই প্রথম বিজ্ঞাপন দিন!</p>
            <Link to={user ? '/used/post' : '/login'}
              className="inline-block px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
              ➕ বিজ্ঞাপন দিন
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  )
}
