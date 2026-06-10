import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useShops } from '../hooks/useShops'
import { useSearchProducts } from '../hooks/useProducts'
import { ShopCard } from '../components/shop/ShopCard'
import { ShopCardSkeleton } from '../components/ui/Skeleton'
import { whatsappUrl } from '../lib/utils'
import { getBengaliMatch } from '../lib/banglish'

const BLUE = '#2563EB'
const GREEN = '#16a34a'

function ProductCard({ product }) {
  const shop = product.shops
  const navigate = useNavigate()

  function orderThis() {
    const params = new URLSearchParams({ shop: shop?.shop_name || '' })
    params.set('product', product.name)
    navigate(`/order/${shop?.id}?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-md transition-shadow">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name}
          className="w-full h-40 object-cover"
          onError={e => { e.target.style.display = 'none' }} />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-4xl">📦</div>
      )}
      <div className="p-3">
        <p className="font-semibold text-gray-800 text-sm leading-tight mb-1">{product.name}</p>
        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{product.description}</p>
        )}
        {product.price && (
          <p className="text-base font-bold mb-2" style={{ color: GREEN }}>
            ৳{Number(product.price).toLocaleString('bn-BD')}
          </p>
        )}

        {/* Shop info */}
        {shop && (
          <Link to={`/shop/${shop.slug || shop.id}`}
            className="flex items-center gap-1.5 mb-3 group">
            {shop.logo_url
              ? <img src={shop.logo_url} alt="" className="w-5 h-5 rounded object-cover" />
              : <span className="text-xs">🏪</span>
            }
            <span className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors truncate">
              {shop.shop_name}
            </span>
          </Link>
        )}

        <div className="flex gap-2">
          <button onClick={orderThis}
            className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg"
            style={{ background: GREEN }}>
            🛒 অর্ডার করুন
          </button>
          {(shop?.whatsapp || shop?.phone) && (
            <a href={whatsappUrl(shop.whatsapp || shop.phone, `"${product.name}" পণ্যটি অর্ডার করতে চাই`)}
              target="_blank" rel="noreferrer"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-200">
              💬
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="w-full h-40 bg-gray-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
        <div className="h-5 bg-gray-100 rounded animate-pulse w-1/3" />
      </div>
    </div>
  )
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputVal, setInputVal]   = useState(searchParams.get('q') || '')
  const [query, setQuery]         = useState(searchParams.get('q') || '')
  const [tab, setTab]             = useState(searchParams.get('tab') || 'shops')

  // debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(inputVal)
      const p = new URLSearchParams(searchParams)
      if (inputVal) p.set('q', inputVal); else p.delete('q')
      p.set('tab', tab)
      setSearchParams(p, { replace: true })
    }, 400)
    return () => clearTimeout(t)
  }, [inputVal]) // eslint-disable-line

  // sync tab to URL
  useEffect(() => {
    const p = new URLSearchParams(searchParams)
    p.set('tab', tab)
    setSearchParams(p, { replace: true })
  }, [tab]) // eslint-disable-line

  const { data: shopData, isLoading: shopsLoading } = useShops({ search: query || undefined })
  const shops = shopData?.pages?.flatMap(p => p.data) ?? []

  const { data: products = [], isLoading: productsLoading } = useSearchProducts(query)

  const isLoading = tab === 'shops' ? shopsLoading : productsLoading
  const totalShops    = shops.length
  const totalProducts = products.length

  // Banglish match hint (e.g. user typed "murgi" → matched "মুরগি")
  const bengaliMatch = query ? getBengaliMatch(query) : null

  return (
    <div>
      {/* ── Search hero ── */}
      <section style={{ background: 'linear-gradient(135deg, #2563EB 0%, #60a5fa 100%)' }} className="py-8 sm:py-10">
        <div className="container-app">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">🔍 খুঁজুন</h1>
          <div className="max-w-2xl mx-auto">
            <div className="flex rounded-xl overflow-hidden shadow-lg bg-white">
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder={tab === 'shops' ? 'দোকান খুঁজুন — বাংলা বা Banglish (murgi, chal, alu)...' : 'পণ্য খুঁজুন — বাংলা বা Banglish (rice, kapor, dim)...'}
                autoFocus
                className="flex-1 px-4 py-3 text-gray-700 placeholder:text-gray-400 text-sm focus:outline-none"
              />
              {inputVal && (
                <button onClick={() => setInputVal('')}
                  className="px-3 text-gray-400 hover:text-gray-600 text-lg">✕</button>
              )}
              <button className="px-5 py-3 text-white font-semibold text-sm flex-shrink-0" style={{ background: '#1d4ed8' }}>
                🔍
              </button>
            </div>
            {/* Banglish support hint */}
            <p className="text-center text-white/70 text-xs mt-2">
              💡 Banglish সাপোর্ট: <span className="text-white font-medium">murgi, chal, alu, sabji</span> — সরাসরি লিখুন
            </p>

            {/* Tabs */}
            <div className="flex gap-2 mt-4 justify-center">
              {[
                { key: 'shops',    label: '🏪 দোকান',  count: query ? totalShops    : null },
                { key: 'products', label: '📦 পণ্য',   count: query ? totalProducts : null },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    tab === t.key
                      ? 'bg-white text-blue-700 shadow'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}>
                  {t.label}
                  {t.count !== null && (
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                      tab === t.key ? 'bg-blue-100 text-blue-600' : 'bg-white/30 text-white'
                    }`}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      <div className="container-app py-6">
        {query && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <p className="text-sm text-gray-500">
              "<span className="font-semibold text-gray-800">{query}</span>"
              {bengaliMatch && (
                <> → <span className="font-semibold text-blue-700">{bengaliMatch}</span></>
              )}
              {' — '}
              {tab === 'shops'
                ? `${isLoading ? '...' : totalShops}টি দোকান`
                : `${isLoading ? '...' : totalProducts}টি পণ্য`
              } পাওয়া গেছে
            </p>
            {bengaliMatch && (
              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                🔤 Banglish → বাংলা
              </span>
            )}
          </div>
        )}

        {/* No query state */}
        {!query && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">{tab === 'shops' ? '🏪' : '📦'}</p>
            <p className="text-gray-500 text-base font-medium mb-3">
              {tab === 'shops' ? 'দোকান খুঁজতে নাম বা বিভাগ লিখুন' : 'পণ্যের নাম লিখুন'}
            </p>
            {/* Banglish example chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
              {(tab === 'shops'
                ? ['মুদি দোকান', 'pharmacy', 'kapor', 'jewellery', 'salon']
                : ['chal', 'murgi', 'alu', 'dim', 'sabji', 'tel']
              ).map(ex => (
                <button key={ex} onClick={() => setInputVal(ex)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all">
                  {ex}
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-3">বাংলা ও Banglish — দুটোই চলবে</p>
          </div>
        )}

        {/* Loading */}
        {query && isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <ShopCardSkeleton key={i} />)}
          </div>
        )}

        {/* Shops tab */}
        {query && !isLoading && tab === 'shops' && (
          shops.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
              <p className="text-4xl mb-3">😕</p>
              <p className="text-gray-500 mb-2">"<strong>{query}</strong>" নামে কোনো দোকান পাওয়া যায়নি</p>
              <button onClick={() => setTab('products')}
                className="text-sm font-medium mt-2" style={{ color: BLUE }}>
                পণ্যে খুঁজুন →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
            </div>
          )
        )}

        {/* Products tab */}
        {query && !isLoading && tab === 'products' && (
          products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
              <p className="text-4xl mb-3">😕</p>
              <p className="text-gray-500 mb-2">"<strong>{query}</strong>" নামে কোনো পণ্য পাওয়া যায়নি</p>
              <button onClick={() => setTab('shops')}
                className="text-sm font-medium mt-2" style={{ color: BLUE }}>
                দোকানে খুঁজুন →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )
        )}
      </div>
    </div>
  )
}
