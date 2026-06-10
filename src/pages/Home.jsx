import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFeaturedShops, useLatestShops, useMarketStats } from '../hooks/useShops'
import { useCategoryWithCount } from '../hooks/useCategories'
import { useActiveAds } from '../hooks/useAds'
import { ShopCard } from '../components/shop/ShopCard'
import { ShopCardSkeleton } from '../components/ui/Skeleton'
import SearchDropdown from '../components/SearchDropdown'
import { supabase } from '../lib/supabase'

// Animated counter component
function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!value) return
    const duration = 1500
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  
  return <span>{count.toLocaleString('bn-BD')}{suffix}</span>
}

// Premium Banner Component
function PremiumBanner({ ads }) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (ads.length <= 1 || isPaused) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ads.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [ads.length, isPaused])

  if (!ads.length) return null

  const currentAd = ads[current]

  return (
    <section 
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container-app">
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          {/* Gradient Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 animate-gradient" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          
          {/* Content */}
          <div className="relative z-10 px-6 sm:px-10 py-10 sm:py-14">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  প্রিমিয়াম বিজ্ঞাপন
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                  {currentAd.title}
                </h3>
                <p className="text-white/80 text-sm sm:text-base mb-4 max-w-lg">
                  {currentAd.description || 'সেরা অফার এবং ডিল পেতে এখনই ক্লিক করুন'}
                </p>
                {currentAd.target_url ? (
                  <a 
                    href={currentAd.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-5 py-2.5 rounded-lg hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-lg"
                  >
                    বিস্তারিত দেখুন
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                ) : (
                  <Link 
                    to="/shops"
                    className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all hover:scale-105 active:scale-95"
                  >
                    দোকান ব্রাউজ করুন
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                )}
              </div>
              
              {/* Decorative Element */}
              <div className="hidden md:flex items-center justify-center w-32 h-32 relative">
                <div className="absolute inset-0 bg-white/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-4 bg-white/20 rounded-full" />
                <span className="text-5xl relative z-10">🎯</span>
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          {ads.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {ads.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === current ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent" />
        </div>
      </div>
    </section>
  )
}

// Category Card Component with Enhanced Hover
function CategoryPill({ category }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-95 min-w-[76px] sm:min-w-0 flex-shrink-0 sm:flex-shrink"
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />

      <div className="relative z-10 flex flex-col items-center">
        <span className="text-2xl sm:text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          {category.icon}
        </span>
        <span className="text-[11px] sm:text-xs font-medium text-gray-700 group-hover:text-brand-600 transition-colors mt-1.5 sm:mt-2 text-center leading-tight">
          {category.name}
        </span>
        <span className="text-[10px] text-gray-400 group-hover:text-brand-400 transition-colors mt-0.5">
          {category.shop_count || 0} দোকান
        </span>
      </div>
    </Link>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchTab, setSearchTab] = useState('shops')
  const [isLoaded, setIsLoaded] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const { data: stats, refetch: refetchStats } = useMarketStats()
  const { data: featuredShops = [], isLoading: isFeaturedLoading, refetch: refetchFeatured } = useFeaturedShops(8)
  const { data: latestShops = [], isLoading: isLatestLoading, refetch: refetchLatest } = useLatestShops(12)
  const { data: categories = [], refetch: refetchCategories } = useCategoryWithCount()
  const { data: ads = [] } = useActiveAds()

  const bannerAds = ads.filter(a => a.ad_type === 'banner')

  // Real-time subscriptions for auto-updates
  useEffect(() => {
    setIsLoaded(true)

    // Subscribe to shops changes
    const shopsChannel = supabase
      .channel('shops-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, () => {
        refetchStats()
        refetchFeatured()
        refetchLatest()
      })
      .subscribe()

    // Subscribe to products changes
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        refetchStats()
      })
      .subscribe()

    // Subscribe to categories changes
    const categoriesChannel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        refetchStats()
        refetchCategories()
      })
      .subscribe()

    // Subscribe to profiles changes
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refetchStats()
      })
      .subscribe()

    return () => {
      shopsChannel.unsubscribe()
      productsChannel.unsubscribe()
      categoriesChannel.unsubscribe()
      profilesChannel.unsubscribe()
    }
  }, [refetchStats, refetchFeatured, refetchLatest, refetchCategories])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}&tab=${searchTab}`)
    else navigate(`/search?tab=${searchTab}`)
  }

  const scrollToFeatured = () => {
    const element = document.getElementById('featured-shops')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* ── Hero Section (Reduced Height) ── */}
      <section className="relative min-h-[320px] sm:min-h-[380px] flex items-center overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        
        {/* Animated Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl" />
        </div>

        <div className="container-app relative z-10 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
              শিবের বাজার
            </h1>
            <p className="text-white/90 text-sm sm:text-base mb-8 max-w-xl mx-auto">
              আপনার এলাকার সকল দোকান এক জায়গায় — সহজে খুঁজুন, যোগাযোগ করুন
            </p>

            {/* Modern Search Bar */}
            <div className="max-w-xl mx-auto relative">
              {/* Tab Toggle */}
              <div className="flex justify-center gap-2 mb-3">
                {[
                  { key: 'shops', label: 'দোকান', icon: '🏪' },
                  { key: 'products', label: 'পণ্য', icon: '📦' },
                ].map(t => (
                  <button 
                    key={t.key} 
                    onClick={() => setSearchTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      searchTab === t.key
                        ? 'bg-white text-brand-600 shadow-lg'
                        : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Search Input with Dropdown */}
              <form onSubmit={handleSearch} className="relative group">
                <div className="flex rounded-2xl overflow-hidden shadow-2xl bg-white transform transition-transform duration-200 focus-within:scale-[1.02]">
                  <input
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={searchTab === 'shops' ? 'দোকানের নাম বা ক্যাটাগরি লিখুন...' : 'পণ্যের নাম লিখুন...'}
                    className="flex-1 px-5 py-4 text-gray-700 placeholder:text-gray-400 text-sm focus:outline-none"
                  />
                  {query && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setQuery('')
                        setShowDropdown(false)
                      }}
                      className="px-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex-shrink-0 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="hidden sm:inline">খুঁজুন</span>
                  </button>
                </div>
                
                {/* Live Search Dropdown */}
                {showDropdown && query.trim().length > 0 && (
                  <SearchDropdown 
                    query={query} 
                    onClose={() => setShowDropdown(false)}
                    searchTab={searchTab}
                  />
                )}
              </form>
            </div>

            {/* Animated Stats */}
            {stats && (
              <div className="flex items-center justify-center gap-4 sm:gap-8 mt-8 flex-wrap">
                {[
                  { value: stats.totalShops, icon: '🏪', label: 'দোকান' },
                  { value: stats.totalProducts, icon: '📦', label: 'পণ্য' },
                  { value: stats.totalCategories, icon: '📋', label: 'ক্যাটাগরি' },
                  { value: stats.totalUsers, icon: '👥', label: 'সদস্য' },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center group cursor-default px-2">
                    <div className="flex items-center gap-1.5 text-white/90 text-sm sm:text-base">
                      <span className="group-hover:scale-110 transition-transform">{stat.icon}</span>
                      <span className="font-bold"><AnimatedCounter value={stat.value} suffix="+" /></span>
                    </div>
                    <span className="text-white/60 text-xs">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <button 
          onClick={scrollToFeatured}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors animate-bounce"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </section>

      {/* ── Categories Section ── */}
      <section className="py-10 sm:py-14 bg-gray-50/50">
        <div className="container-app">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">ক্যাটাগরিসমূহ</h2>
              <p className="text-sm text-gray-500 mt-1">আপনার পছন্দের ক্যাটাগরি বেছে নিন</p>
            </div>
            <Link 
              to="/categories" 
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              সব দেখুন
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="flex overflow-x-auto -mx-4 px-4 pb-2 gap-2.5 sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 sm:overflow-visible sm:pb-0 sm:gap-4 sm:mx-0 sm:px-0">
            {categories.map(cat => (
              <CategoryPill key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Premium Banner Ads ── */}
      {bannerAds.length > 0 && (
        <section className="py-8 bg-white">
          <PremiumBanner ads={bannerAds} />
        </section>
      )}

      {/* ── Featured Shops Section ── */}
      {featuredShops.length > 0 && (
        <section id="featured-shops" className="py-10 sm:py-14 bg-gradient-to-b from-brand-50/50 to-white">
          <div className="container-app">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">ফিচার্ড দোকান</h2>
                  <p className="text-sm text-gray-500 mt-0.5">আমাদের বিশেষায়িত দোকানসমূহ</p>
                </div>
              </div>
              <Link 
                to="/shops?featured=true" 
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
              >
                সব দেখুন
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {isFeaturedLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <ShopCardSkeleton key={i} />
                ))
              ) : (
                featuredShops.map((shop, idx) => (
                  <ShopCard key={shop.id} shop={shop} featured index={idx} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Latest Shops Section ── */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="container-app">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">নতুন দোকান</h2>
              <p className="text-sm text-gray-500 mt-1">সম্প্রতি যুক্ত হওয়া দোকানসমূহ</p>
            </div>
            <Link 
              to="/shops" 
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              সব দেখুন
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {latestShops.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-20 h-20 mx-auto mb-4 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🏪</span>
              </div>
              <p className="text-gray-500 mb-4">এখনো কোনো দোকান নেই</p>
              <Link 
                to="/dashboard/add-shop"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                প্রথম দোকান যোগ করুন
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {isLatestLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <ShopCardSkeleton key={i} />
                ))
              ) : (
                latestShops.map((shop, idx) => (
                  <ShopCard key={shop.id} shop={shop} index={idx} />
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Improved CTA Section ── */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="container-app relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 bg-brand-800/50 rounded-full px-3 py-1 mb-4 border border-brand-700">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              ফ্রি রেজিস্ট্রেশন
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              আপনার দোকান যোগ করুন
            </h2>
            <p className="text-brand-200 text-sm sm:text-base mb-8 max-w-xl mx-auto">
              বিনামূল্যে আপনার দোকানের তথ্য দিন এবং লক্ষাধিক মানুষের কাছে পৌঁছান। 
              আমাদের প্ল্যাটফর্মে আজই যোগ দিন।
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand-900/20"
              >
                বিনামূল্যে রেজিস্ট্রেশন করুন
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link 
                to="/shops"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-white font-semibold px-8 py-3.5 rounded-xl border-2 border-brand-600 hover:bg-brand-800/50 transition-all"
              >
                দোকান ব্রাউজ করুন
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
