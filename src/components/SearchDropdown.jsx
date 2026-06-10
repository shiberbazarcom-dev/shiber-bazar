import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGlobalSearch } from '../hooks/useShops'

export default function SearchDropdown({ query, onClose, searchTab }) {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  // Debounce query
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])
  
  const { data: results, isLoading } = useGlobalSearch(debouncedQuery)
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!results) return
      
      const allItems = [
        ...results.shops.map(s => ({ ...s, type: 'shop' })),
        ...results.products.map(p => ({ ...p, type: 'product' })),
        ...results.categories.map(c => ({ ...c, type: 'category' })),
      ]
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : prev))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        const item = allItems[selectedIndex]
        if (item) {
          if (item.type === 'shop') navigate(`/shop/${item.slug || item.id}`)
          else if (item.type === 'product') navigate(`/product/${item.id}`)
          else if (item.type === 'category') navigate(`/category/${item.slug}`)
          onClose()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [results, selectedIndex, navigate, onClose])
  
  if (!query.trim()) return null
  
  const hasResults = results && (
    results.shops.length > 0 ||
    results.products.length > 0 ||
    results.categories.length > 0
  )
  
  let itemIndex = -1
  const getItemIndex = () => {
    itemIndex++
    return itemIndex
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[500px] overflow-y-auto"
    >
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">খোঁজা হচ্ছে...</p>
        </div>
      ) : !hasResults ? (
        <div className="p-8 text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-gray-500">"{query}" এর কোনো ফলাফল পাওয়া যায়নি</p>
          <p className="text-gray-400 text-sm mt-1">অন্য কিছু খুঁজুন</p>
        </div>
      ) : (
        <div className="py-2">
          {/* Shops Section */}
          {results.shops.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <span>🏪</span> দোকান
              </div>
              {results.shops.map((shop) => {
                const idx = getItemIndex()
                return (
                  <Link
                    key={shop.id}
                    to={`/shop/${shop.slug || shop.id}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedIndex === idx ? 'bg-blue-50 border-l-4 border-brand-600' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-lg flex-shrink-0">
                      {shop.logo ? (
                        <img src={shop.logo} alt="" className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        '🏪'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{shop.shop_name}</p>
                      <p className="text-xs text-gray-500 truncate">{shop.address || 'শিবের বাজার'}</p>
                    </div>
                    {shop.avg_rating > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        ⭐ {shop.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
          
          {/* Products Section */}
          {results.products.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-t border-gray-100">
                <span>📦</span> পণ্য
              </div>
              {results.products.map((product) => {
                const idx = getItemIndex()
                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedIndex === idx ? 'bg-blue-50 border-l-4 border-brand-600' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        '📦'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 truncate">{product.shops?.shop_name || 'দোকান'}</p>
                    </div>
                    {product.price && (
                      <span className="text-sm font-semibold text-green-600">
                        ৳{Number(product.price).toLocaleString('bn-BD')}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
          
          {/* Categories Section */}
          {results.categories.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-t border-gray-100">
                <span>📋</span> ক্যাটাগরি
              </div>
              {results.categories.map((cat) => {
                const idx = getItemIndex()
                return (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedIndex === idx ? 'bg-blue-50 border-l-4 border-brand-600' : ''
                    }`}
                  >
                    <span className="text-2xl">{cat.icon || '📋'}</span>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}
          
          {/* View All Results */}
          <div className="border-t border-gray-100 mt-2 pt-2 px-4 pb-2">
            <Link
              to={`/search?q=${encodeURIComponent(query)}&tab=${searchTab}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 text-brand-600 font-medium text-sm py-2 hover:bg-brand-50 rounded-lg transition-colors"
            >
              সব ফলাফল দেখুন
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
