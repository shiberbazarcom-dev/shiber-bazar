import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCategory } from '../hooks/useCategories'
import { useShops } from '../hooks/useShops'
import { ShopCard } from '../components/shop/ShopCard'
import { ShopCardSkeleton } from '../components/ui/Skeleton'
import SEO from '../components/SEO'

const BLUE = '#2563EB'

export default function CategoryPage() {
  const { slug } = useParams()
  const [sortBy, setSortBy] = useState('newest')

  const { data: category, isLoading: loadingCat } = useCategory(slug)
  const {
    data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage,
  } = useShops({ categoryId: category?.id, sortBy })

  const shops = data?.pages?.flatMap(p => p.data) ?? []
  const total = data?.pages?.[0]?.count ?? 0

  // Infinite scroll
  const sentinel = useRef(null)
  const onIntersect = useCallback(([entry]) => {
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const obs = new IntersectionObserver(onIntersect, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [onIntersect])

  const coverBg = `linear-gradient(135deg, #2563EB 0%, #60a5fa 100%)`

  return (
    <div>
      <SEO
        title={category ? `${category.icon || ''} ${category.name}` : 'ক্যাটাগরি'}
        description={category?.description || `শিবের বাজারে ${category?.name || ''} ক্যাটাগরির সকল দোকান দেখুন এবং পছন্দের দোকানে যোগাযোগ করুন।`}
      />
      {/* Header */}
      <section style={{ background: coverBg }} className="py-8 sm:py-10">
        <div className="container-app">
          <Link to="/categories" className="text-blue-200 hover:text-white text-sm mb-4 inline-block transition-colors">
            ← সব বিভাগ
          </Link>
          {loadingCat ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-40 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
              </div>
            </div>
          ) : category ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                {category.icon}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{category.name}</h1>
                {category.description && (
                  <p className="text-blue-100 text-sm mt-0.5">{category.description}</p>
                )}
                <p className="text-blue-200 text-sm mt-1">{total} টি দোকান</p>
              </div>
            </div>
          ) : (
            <p className="text-blue-100">বিভাগ পাওয়া যায়নি</p>
          )}
        </div>
      </section>

      <div className="container-app py-4 sm:py-6 pb-24 md:pb-10">
        {/* Filter bar — sticky on mobile */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm -mx-4 px-4 py-3 mb-4 border-b border-gray-100 sm:static sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0 sm:py-0 sm:mb-5 sm:border-0 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {isLoading ? 'লোড হচ্ছে...' : `${shops.length} টি দোকান`}
          </p>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="input text-sm w-32 sm:w-40">
            <option value="newest">নতুন আগে</option>
            <option value="rating">রেটিং</option>
            <option value="popular">জনপ্রিয়</option>
          </select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {Array(8).fill(0).map((_, i) => <ShopCardSkeleton key={i} />)}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">🏪</p>
            <p className="text-gray-500 mb-4">এই ক্যাটাগরিতে এখনো কোনো দোকান নেই</p>
            <Link to="/register"
              className="px-5 py-2 text-white text-sm font-medium rounded-lg inline-block"
              style={{ background: BLUE }}>
              প্রথম দোকান যোগ করুন
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
          </div>
        )}

        {/* Infinite scroll */}
        {isFetchingNextPage && (
          <div className="flex justify-center mt-6">
            <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
        <div ref={sentinel} className="h-4" />
      </div>
    </div>
  )
}
