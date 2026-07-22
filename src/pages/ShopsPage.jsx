import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useShops } from '../hooks/useShops'
import { useCategories } from '../hooks/useCategories'
import { ShopCard, ShopListItem } from '../components/shop/ShopCard'
import { ShopCardSkeleton } from '../components/ui/Skeleton'
import SEO from '../components/SEO'

const GREEN = '#2563EB'

export default function ShopsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState('grid')

  const categoryId = searchParams.get('category') || ''
  const search     = searchParams.get('q') || ''
  const sortBy     = searchParams.get('sort') || 'newest'

  const { data: categories = [] } = useCategories()

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useShops({ categoryId, search, sortBy })

  const shops = data?.pages?.flatMap(p => p.data) ?? []

  // Infinite scroll sentinel
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

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value)
    else p.delete(key)
    setSearchParams(p)
  }

  const hasFilters = !!(categoryId || search)

  return (
    <div className="container-app py-6 pb-28 md:pb-6">
      <SEO
        title="সব দোকান"
        description="শিবের বাজারের সকল দোকান এখানে। খাবার, পোশাক, ইলেকট্রনিক্স, ফার্মেসি সহ সব ধরনের দোকান ব্রাউজ করুন। ক্যাটাগরি অনুযায়ী ফিল্টার করে সহজেই খুঁজে নিন।"
      />

      {/* ── Page header ── */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">সব দোকান</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {shops.length > 0 ? `${shops.length}টি দোকান পাওয়া গেছে` : 'দোকান খুঁজুন'}
        </p>
      </div>

      {/* ── Filters bar ── */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-5 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <input
          defaultValue={search}
          onKeyDown={e => e.key === 'Enter' && setParam('q', e.target.value)}
          onBlur={e => setParam('q', e.target.value)}
          placeholder="দোকান খুঁজুন..."
          className="input flex-1"
        />

        {/* Category */}
        <select value={categoryId} onChange={e => setParam('category', e.target.value)}
          className="input sm:w-44">
          <option value="">সব ক্যাটাগরি</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={e => setParam('sort', e.target.value)}
          className="input sm:w-40">
          <option value="newest">নতুন আগে</option>
          <option value="rating">রেটিং</option>
          <option value="popular">জনপ্রিয়</option>
        </select>

        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setView('grid')}
            className={`px-3 py-2 text-sm transition-colors ${view === 'grid' ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            style={view === 'grid' ? { background: GREEN } : {}}>
            ⊞
          </button>
          <button onClick={() => setView('list')}
            className={`px-3 py-2 text-sm transition-colors ${view === 'list' ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            style={view === 'list' ? { background: GREEN } : {}}>
            ☰
          </button>
        </div>

        {hasFilters && (
          <button onClick={() => setSearchParams({})}
            className="text-sm text-red-500 hover:text-red-700 font-medium whitespace-nowrap">
            ✕ ফিল্টার মুছুন
          </button>
        )}
      </div>

      {/* ── Category pills ── */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <button onClick={() => setParam('category', '')}
            className={`cat-pill ${!categoryId ? 'cat-pill-active' : ''}`}>
            সব
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setParam('category', cat.id)}
              className={`cat-pill ${categoryId === cat.id ? 'cat-pill-active' : ''}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Results ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <ShopCardSkeleton key={i} />)}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 mb-2">কোনো দোকান পাওয়া যায়নি</p>
          {hasFilters && (
            <button onClick={() => setSearchParams({})}
              className="text-sm font-medium" style={{ color: GREEN }}>
              ফিল্টার মুছুন
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map(shop => <ShopListItem key={shop.id} shop={shop} />)}
        </div>
      )}

      {/* Load more spinner */}
      {isFetchingNextPage && (
        <div className="flex justify-center mt-6">
          <div className="w-7 h-7 border-3 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinel} className="h-4" />
    </div>
  )
}
