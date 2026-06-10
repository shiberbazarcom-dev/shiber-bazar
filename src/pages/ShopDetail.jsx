import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useShop, useReviews, useAddReview, useToggleFavorite, useFavorites } from '../hooks/useShops'
import { useShopProducts } from '../hooks/useProducts'
import { useAuth } from '../context/AuthContext'
import { whatsappUrl, getAvatarUrl, formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

const BLUE  = '#2563EB'
const GREEN = '#16a34a'

/* ─── Star input ─────────────────────────────────────────────────────────── */
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none">
          <span className={(hover || value) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  )
}

/* ─── Review card ────────────────────────────────────────────────────────── */
function ReviewCard({ review }) {
  const avatar = review.profiles?.avatar_url || getAvatarUrl(review.profiles?.full_name || 'U', '1a9e3f')
  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        onError={e => { e.target.src = getAvatarUrl('U') }} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-semibold text-sm text-gray-800">{review.profiles?.full_name || 'ব্যবহারকারী'}</p>
          <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
        </div>
        <div className="flex mb-1.5">
          {[1,2,3,4,5].map(s => (
            <span key={s} className={`text-sm ${review.rating >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
          ))}
        </div>
        {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
      </div>
    </div>
  )
}

/* ─── Product Grid Card ──────────────────────────────────────────────────── */
function ProductGridCard({ product, onOrder, shop }) {
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-100 transition-all duration-200 group flex flex-col">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name}
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.parentElement.innerHTML = '<div class="w-full h-44 bg-gray-50 flex items-center justify-center text-4xl">📦</div>' }} />
          : <div className="w-full h-44 bg-gray-50 flex items-center justify-center text-4xl">📦</div>
        }
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-xs font-bold text-white px-2 py-0.5 rounded-full"
            style={{ background: '#ef4444' }}>-{discount}%</span>
        )}
        {product.is_featured && (
          <span className="absolute top-2 right-2 text-xs font-bold text-white px-2 py-0.5 rounded-full"
            style={{ background: '#d69e2e' }}>★ ফিচার্ড</span>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/product/${product.id}`}>
          <p className="font-semibold text-sm text-gray-800 line-clamp-2 hover:text-blue-700 transition-colors leading-snug mb-1">
            {product.name}
          </p>
        </Link>
        <div className="flex items-baseline gap-2 mb-3 mt-auto">
          {product.price
            ? <span className="text-base font-bold" style={{ color: GREEN }}>৳{Number(product.price).toLocaleString('bn-BD')}</span>
            : null}
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">৳{Number(product.original_price).toLocaleString('bn-BD')}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onOrder(product.name, product.price)}
            className="flex-1 py-2 text-xs font-semibold text-white rounded-xl transition-opacity hover:opacity-90"
            style={{ background: GREEN }}>
            অর্ডার করুন
          </button>
          {(shop?.whatsapp || shop?.phone) && (
            <a href={whatsappUrl(shop.whatsapp || shop.phone, `"${product.name}" পণ্যটি অর্ডার করতে চাই${product.price ? ` — মূল্য ৳${product.price}` : ''}`)}
              target="_blank" rel="noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-sm border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors"
              title="WhatsApp">
              💬
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Product List Card ──────────────────────────────────────────────────── */
function ProductListCard({ product, onOrder, shop }) {
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-200 flex gap-4 p-3 items-center">
      <Link to={`/product/${product.id}`} className="flex-shrink-0 relative">
        {product.image_url
          ? <img src={product.image_url} alt={product.name}
              className="w-20 h-20 object-cover rounded-xl"
              onError={e => { e.target.parentElement.innerHTML = '<div class="w-20 h-20 rounded-xl bg-gray-50 flex items-center justify-center text-3xl">📦</div>' }} />
          : <div className="w-20 h-20 rounded-xl bg-gray-50 flex items-center justify-center text-3xl">📦</div>
        }
        {discount > 0 && (
          <span className="absolute -top-1 -left-1 text-xs font-bold text-white px-1.5 py-0.5 rounded-full"
            style={{ background: '#ef4444', fontSize: '10px' }}>-{discount}%</span>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${product.id}`}>
          <p className="font-semibold text-sm text-gray-800 hover:text-blue-700 transition-colors line-clamp-2 leading-snug">{product.name}</p>
        </Link>
        {product.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {product.price
            ? <span className="text-sm font-bold" style={{ color: GREEN }}>৳{Number(product.price).toLocaleString('bn-BD')}</span>
            : null}
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">৳{Number(product.original_price).toLocaleString('bn-BD')}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        <button onClick={() => onOrder(product.name, product.price)}
          className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ background: GREEN }}>
          অর্ডার
        </button>
        {(shop?.whatsapp || shop?.phone) && (
          <a href={whatsappUrl(shop.whatsapp || shop.phone, `"${product.name}" পণ্যটি অর্ডার করতে চাই`)}
            target="_blank" rel="noreferrer"
            className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-center hover:bg-green-50 hover:border-green-300 transition-colors">
            💬
          </a>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function ShopDetail() {
  const { idOrSlug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: shop, isLoading, error } = useShop(idOrSlug)
  const { data: reviews = [] }   = useReviews(shop?.id)
  const { data: favorites = [] } = useFavorites()
  const { data: products = [] }  = useShopProducts(shop?.id)
  const addReview      = useAddReview()
  const toggleFavorite = useToggleFavorite()

  /* local UI state */
  const [rating, setRating]     = useState(5)
  const [comment, setComment]   = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy]     = useState('default')
  const [activeTab, setActiveTab] = useState('products')
  const [productSearch, setProductSearch] = useState('')

  function goOrder(productName = '', price = null) {
    const params = new URLSearchParams({ shop: shop.shop_name })
    if (productName) params.set('product', productName)
    if (price) params.set('price', String(price))
    navigate(`/order/${shop.id}?${params.toString()}`)
  }

  const isFav = favorites.some(f => f.shop_id === shop?.id)

  const handleFav = () => {
    if (!user) return toast.error('পছন্দ করতে লগইন করুন')
    toggleFavorite.mutate({ shopId: shop.id, isFav })
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: shop.shop_name, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('লিংক কপি হয়েছে!')
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    if (!user) return toast.error('রিভিউ দিতে লগইন করুন')
    try {
      await addReview.mutateAsync({ shopId: shop.id, rating, comment })
      toast.success('রিভিউ যোগ হয়েছে')
      setComment('')
    } catch { toast.error('সমস্যা হয়েছে') }
  }

  /* sorted + filtered products */
  const displayedProducts = useMemo(() => {
    let list = [...products]
    if (productSearch.trim()) {
      list = list.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()))
    }
    if (sortBy === 'price_asc') list.sort((a, b) => (a.price || 0) - (b.price || 0))
    else if (sortBy === 'price_desc') list.sort((a, b) => (b.price || 0) - (a.price || 0))
    else if (sortBy === 'name') list.sort((a, b) => a.name?.localeCompare(b.name || '') || 0)
    else if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return list
  }, [products, sortBy, productSearch])

  /* ── Loading skeleton ── */
  if (isLoading) return (
    <div className="pb-16">
      <div className="h-56 sm:h-80 bg-gray-200 animate-pulse" />
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg -mt-10 p-5 mb-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 -mt-12 flex-shrink-0" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-5 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="flex gap-2">
                {[1,2,3].map(i => <div key={i} className="h-8 w-24 bg-gray-100 rounded-xl" />)}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  )

  /* ── Error state ── */
  if (error || !shop) return (
    <div className="py-24 text-center px-4">
      <div className="text-6xl mb-4">🏪</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">দোকান পাওয়া যায়নি</h2>
      <p className="text-gray-400 text-sm mb-6">এই দোকানটি হয়তো বন্ধ হয়ে গেছে বা লিংকটি ভুল।</p>
      <Link to="/shops" className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl"
        style={{ background: BLUE }}>
        ← সব দোকান দেখুন
      </Link>
    </div>
  )

  const coverUrl = shop.cover_image || shop.cover_image_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.shop_name)}&size=1200&background=1e3a5f&color=ffffff&bold=true`
  const logoUrl = shop.logo || shop.logo_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent((shop.shop_name || 'দ')[0])}&size=200&background=1a9e3f&color=fff&bold=true`

  const openDays = shop.open_days
    ? (Array.isArray(shop.open_days) ? shop.open_days : JSON.parse(shop.open_days))
    : []

  const avgRating = shop.avg_rating ? Number(shop.avg_rating).toFixed(1) : null
  const joinYear = shop.created_at ? new Date(shop.created_at).getFullYear() : null

  return (
    <div className="pb-28 lg:pb-10" style={{ background: '#f3f4f6' }}>

      {/* ══════════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════════ */}
      <div className="relative h-52 sm:h-72 lg:h-80 overflow-hidden">
        <img src={coverUrl} alt={shop.shop_name}
          className="w-full h-full object-cover scale-105"
          onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.shop_name)}&size=1200&background=1e3a5f&color=fff` }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)' }} />

        {/* Category badge on banner */}
        {shop.categories?.name && (
          <div className="absolute top-4 left-4">
            <span className="text-xs text-white font-semibold px-3 py-1 rounded-full backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
              {shop.categories.icon} {shop.categories.name}
            </span>
          </div>
        )}

        {/* Verified badge on banner */}
        {shop.is_verified && (
          <div className="absolute top-4 right-4">
            <span className="text-xs text-white font-bold px-3 py-1 rounded-full flex items-center gap-1"
              style={{ background: BLUE }}>
              ✓ যাচাইকৃত
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          SHOP INFO CARD (overlapping banner)
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="bg-white rounded-2xl shadow-xl -mt-12 relative z-10 p-4 sm:p-5 mb-4">

          {/* Logo + info row */}
          <div className="flex gap-4 items-start">
            {/* Logo */}
            <div className="relative flex-shrink-0 -mt-14">
              <img src={logoUrl} alt={shop.shop_name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                onError={e => { e.target.src = logoUrl }} />
              {shop.is_verified && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ background: BLUE }}>✓</span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{shop.shop_name}</h1>
                {shop.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex-shrink-0">
                    ✅ যাচাইকৃত
                  </span>
                )}
                {shop.is_featured && (
                  <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: '#d69e2e' }}>★ ফিচার্ড</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                {shop.address && (
                  <span className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{shop.address}{shop.district ? `, ${shop.district}` : ''}</span>
                  </span>
                )}
                {(shop.opening_time || shop.opening_hours) && (
                  <span className="flex items-center gap-1">
                    <span>🕐</span>
                    <span>{shop.opening_hours || `${shop.opening_time}—${shop.closing_time}`}</span>
                  </span>
                )}
                {joinYear && (
                  <span className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{joinYear} সালে চালু</span>
                  </span>
                )}
                {avgRating && (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-semibold text-gray-700">{avgRating}</span>
                    <span className="text-gray-400">({shop.review_count || 0} রিভিউ)</span>
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {(shop.whatsapp || shop.phone) && (
                  <a href={whatsappUrl(shop.whatsapp || shop.phone, `আমি "${shop.shop_name}" সম্পর্কে জানতে চাই`)}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-xl transition-opacity hover:opacity-90"
                    style={{ background: '#25d366' }}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    WhatsApp
                  </a>
                )}
                {shop.phone && (
                  <a href={`tel:${shop.phone}`}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white rounded-xl transition-opacity hover:opacity-90"
                    style={{ background: BLUE }}>
                    📞 কল করুন
                  </a>
                )}
                <button onClick={handleFav}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    isFav
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}>
                  {isFav ? '❤️ ফলো করা হয়েছে' : '🤍 ফলো করুন'}
                </button>
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                  🔗 শেয়ার
                </button>
              </div>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{products.length}</p>
              <p className="text-xs text-gray-500">পণ্য</p>
            </div>
            <div className="text-center border-l border-gray-100">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{(shop.view_count || 0).toLocaleString('bn-BD')}</p>
              <p className="text-xs text-gray-500">ভিজিট</p>
            </div>
            <div className="text-center border-l border-gray-100">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{shop.review_count || 0}</p>
              <p className="text-xs text-gray-500">রিভিউ</p>
            </div>
            <div className="text-center border-l border-gray-100">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{avgRating || '—'}</p>
              <p className="text-xs text-gray-500">রেটিং</p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            MAIN GRID
        ══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── LEFT: Main content ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                {[
                  { id: 'products', label: `পণ্য (${products.length})` },
                  { id: 'about',    label: 'সম্পর্কে' },
                  { id: 'reviews',  label: `রিভিউ (${reviews.length})` },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                      activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: BLUE }} />
                    )}
                  </button>
                ))}
              </div>

              {/* ── Products tab ── */}
              {activeTab === 'products' && (
                <div className="p-4">
                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    {/* Search within shop */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="দোকানের পণ্য খুঁজুন..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    </div>
                    {/* Sort */}
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                      className="py-2 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white text-gray-700">
                      <option value="default">ডিফল্ট</option>
                      <option value="newest">সর্বশেষ</option>
                      <option value="price_asc">দাম: কম থেকে বেশি</option>
                      <option value="price_desc">দাম: বেশি থেকে কম</option>
                      <option value="name">নাম অনুসারে</option>
                    </select>
                    {/* View toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      <button onClick={() => setViewMode('grid')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                          viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-500'
                        }`}>⊞</button>
                      <button onClick={() => setViewMode('list')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                          viewMode === 'list' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-500'
                        }`}>☰</button>
                    </div>
                  </div>

                  {/* Results count */}
                  {productSearch && (
                    <p className="text-xs text-gray-400 mb-3">"{productSearch}" — {displayedProducts.length}টি ফলাফল</p>
                  )}

                  {/* Products */}
                  {displayedProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">📦</div>
                      <p className="text-gray-400 text-sm">
                        {productSearch ? 'কোনো পণ্য পাওয়া যায়নি' : 'এই দোকানে এখনো পণ্য যোগ করা হয়নি'}
                      </p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {displayedProducts.map(p => (
                        <ProductGridCard key={p.id} product={p} onOrder={goOrder} shop={shop} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayedProducts.map(p => (
                        <ProductListCard key={p.id} product={p} onOrder={goOrder} shop={shop} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── About tab ── */}
              {activeTab === 'about' && (
                <div className="p-5 space-y-4">
                  {shop.description ? (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">দোকান সম্পর্কে</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{shop.description}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">এই দোকানের কোনো বিবরণ নেই।</p>
                  )}
                  {shop.tags?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">ট্যাগ</h3>
                      <div className="flex flex-wrap gap-2">
                        {shop.tags.map((tag, i) => (
                          <span key={i} className="text-xs px-3 py-1 rounded-full text-blue-700 font-medium"
                            style={{ background: '#eff6ff' }}>#{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {shop.delivery_available && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f0fdf4' }}>
                      <span className="text-2xl">🚚</span>
                      <div>
                        <p className="text-sm font-semibold text-green-800">হোম ডেলিভারি সুবিধা আছে</p>
                        {shop.min_order && <p className="text-xs text-green-600">সর্বনিম্ন অর্ডার: {shop.min_order}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Reviews tab ── */}
              {activeTab === 'reviews' && (
                <div className="p-5">
                  {/* Rating summary */}
                  {avgRating && (
                    <div className="flex items-center gap-4 p-4 rounded-xl mb-5" style={{ background: '#fffbeb' }}>
                      <div className="text-center">
                        <p className="text-4xl font-bold text-gray-900">{avgRating}</p>
                        <div className="flex justify-center my-1">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={`text-base ${Number(avgRating) >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">{reviews.length}টি রিভিউ</p>
                      </div>
                    </div>
                  )}

                  {/* Add review form */}
                  {user ? (
                    <form onSubmit={handleReview} className="mb-6 pb-6 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">আপনার রিভিউ লিখুন</p>
                      <div className="mb-3"><StarInput value={rating} onChange={setRating} /></div>
                      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none mb-3"
                        placeholder="আপনার অভিজ্ঞতা লিখুন..." />
                      <button type="submit" disabled={addReview.isPending}
                        className="px-5 py-2 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-opacity hover:opacity-90"
                        style={{ background: BLUE }}>
                        {addReview.isPending ? 'সংরক্ষণ হচ্ছে...' : 'রিভিউ দিন'}
                      </button>
                    </form>
                  ) : (
                    <div className="mb-6 pb-6 border-b border-gray-100 text-center py-5 rounded-xl" style={{ background: '#f8fafc' }}>
                      <p className="text-sm text-gray-500 mb-2">রিভিউ দিতে লগইন করুন</p>
                      <Link to="/login" className="text-sm font-semibold" style={{ color: BLUE }}>লগইন করুন →</Link>
                    </div>
                  )}

                  {reviews.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-6">এখনো কোনো রিভিউ নেই।</p>
                    : <div>{reviews.map(r => <ReviewCard key={r.id} review={r} />)}</div>
                  }
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-4">

            {/* Quick Order CTA */}
            <div className="rounded-2xl p-5 text-white text-center overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10"
                style={{ background: 'white' }} />
              <p className="text-3xl mb-2">🛒</p>
              <p className="font-bold text-lg mb-1">অর্ডার করুন</p>
              <p className="text-green-100 text-xs mb-4">লগইন ছাড়াই অর্ডার দিন</p>
              <button onClick={() => goOrder()}
                className="w-full py-2.5 bg-white font-bold rounded-xl text-sm transition-all hover:shadow-lg"
                style={{ color: GREEN }}>
                এখনই অর্ডার করুন →
              </button>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: '#eff6ff' }}>📞</span>
                যোগাযোগ
              </h3>
              <ul className="space-y-3">
                {shop.phone && (
                  <li className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>📞</span>
                    <div>
                      <p className="text-xs text-gray-400">ফোন</p>
                      <a href={`tel:${shop.phone}`} className="text-sm font-semibold text-gray-800 hover:text-blue-700 transition-colors">{shop.phone}</a>
                    </div>
                  </li>
                )}
                {shop.whatsapp && shop.whatsapp !== shop.phone && (
                  <li className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>💬</span>
                    <div>
                      <p className="text-xs text-gray-400">WhatsApp</p>
                      <a href={whatsappUrl(shop.whatsapp)} target="_blank" rel="noreferrer"
                        className="text-sm font-semibold text-gray-800 hover:text-green-700 transition-colors">{shop.whatsapp}</a>
                    </div>
                  </li>
                )}
                {shop.email && (
                  <li className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>✉️</span>
                    <div>
                      <p className="text-xs text-gray-400">ইমেইল</p>
                      <a href={`mailto:${shop.email}`} className="text-sm font-semibold text-gray-800 hover:text-blue-700 transition-colors break-all">{shop.email}</a>
                    </div>
                  </li>
                )}
                {shop.facebook_url && (
                  <li className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>📘</span>
                    <div>
                      <p className="text-xs text-gray-400">Facebook</p>
                      <a href={shop.facebook_url} target="_blank" rel="noreferrer"
                        className="text-sm font-semibold text-gray-800 hover:text-blue-700 transition-colors break-all truncate block max-w-[160px]">
                        Facebook পেইজ
                      </a>
                    </div>
                  </li>
                )}
                {shop.website_url && (
                  <li className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>🌐</span>
                    <div>
                      <p className="text-xs text-gray-400">ওয়েবসাইট</p>
                      <a href={shop.website_url} target="_blank" rel="noreferrer"
                        className="text-sm font-semibold text-gray-800 hover:text-blue-700 transition-colors break-all">{shop.website_url}</a>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {/* Business Hours */}
            {(shop.opening_time || shop.opening_hours || openDays.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: '#eff6ff' }}>🕐</span>
                  খোলার সময়
                </h3>
                {(shop.opening_time && shop.closing_time) && (
                  <p className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-green-500">●</span>
                    {shop.opening_time} — {shop.closing_time}
                  </p>
                )}
                {shop.opening_hours && !shop.opening_time && (
                  <p className="text-sm text-gray-700 mb-3">{shop.opening_hours}</p>
                )}
                {openDays.length > 0 && (
                  <div className="grid grid-cols-7 gap-1">
                    {['রবি','সোম','মঙ্গল','বুধ','বৃহঃ','শুক্র','শনি'].map((day, i) => (
                      <div key={i} className={`text-center text-xs py-1.5 rounded-lg font-medium ${
                        openDays.includes(day) ? 'text-white' : 'bg-gray-100 text-gray-400'
                      }`} style={openDays.includes(day) ? { background: BLUE } : {}}>
                        {day[0]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Address */}
            {shop.address && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: '#eff6ff' }}>📍</span>
                  ঠিকানা
                </h3>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {shop.address}{shop.district ? `, ${shop.district}` : ''}
                </p>
                <a href={shop.google_map_url || `https://maps.google.com?q=${encodeURIComponent(shop.address)}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold rounded-xl border-2 transition-colors hover:bg-blue-50"
                  style={{ borderColor: BLUE, color: BLUE }}>
                  🗺️ মানচিত্রে দেখুন
                </a>
              </div>
            )}

            {/* Delivery info */}
            {shop.delivery_available && (
              <div className="rounded-2xl p-4 border-2 border-dashed" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚚</span>
                  <div>
                    <p className="text-sm font-bold text-green-800">হোম ডেলিভারি সুবিধা আছে</p>
                    {shop.min_order && <p className="text-xs text-green-600 mt-0.5">সর্বনিম্ন অর্ডার: {shop.min_order}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE STICKY BOTTOM BAR
      ══════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 grid grid-cols-3 gap-2 shadow-2xl">
        <button onClick={handleFav}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            isFav ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}>
          <span className="text-lg">{isFav ? '❤️' : '🤍'}</span>
          <span>{isFav ? 'ফলো' : 'ফলো করুন'}</span>
        </button>
        {(shop.whatsapp || shop.phone) ? (
          <a href={whatsappUrl(shop.whatsapp || shop.phone, `আমি "${shop.shop_name}" সম্পর্কে জানতে চাই`)}
            target="_blank" rel="noreferrer"
            className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: '#25d366' }}>
            <span className="text-lg">💬</span>
            <span>WhatsApp</span>
          </a>
        ) : (
          <button onClick={() => goOrder()}
            className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: GREEN }}>
            <span className="text-lg">🛒</span>
            <span>অর্ডার</span>
          </button>
        )}
        {shop.phone ? (
          <a href={`tel:${shop.phone}`}
            className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: BLUE }}>
            <span className="text-lg">📞</span>
            <span>কল করুন</span>
          </a>
        ) : (
          <button onClick={() => goOrder()}
            className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: GREEN }}>
            <span className="text-lg">🛒</span>
            <span>অর্ডার</span>
          </button>
        )}
      </div>
    </div>
  )
}
