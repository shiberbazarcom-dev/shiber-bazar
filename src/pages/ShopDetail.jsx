import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useShop, useReviews, useAddReview, useToggleFavorite, useFavorites } from '../hooks/useShops'
import { useShopProducts } from '../hooks/useProducts'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { whatsappUrl, getAvatarUrl, formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

const BLUE  = '#2563EB'
const GREEN = '#16a34a'

/* ─── Star input ─── */
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

/* ─── Review card ─── */
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
        <div className="flex mb-1">
          {[1,2,3,4,5].map(s => (
            <span key={s} className={`text-sm ${review.rating >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
          ))}
        </div>
        {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
      </div>
    </div>
  )
}

/* ─── Product Card ─── */
function ProductCard({ product, shop, onOrder }) {
  const { addItem } = useCart()
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
      <Link to={`/product/${product.id}`} className="relative block">
        {product.image_url
          ? <img src={product.image_url} alt={product.name}
              className="w-full aspect-square object-cover"
              onError={e => { e.target.parentElement.innerHTML = '<div class="w-full aspect-square bg-gray-100 flex items-center justify-center text-4xl">📦</div>' }} />
          : <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-4xl">📦</div>
        }
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-xs font-bold text-white px-2 py-0.5 rounded-full bg-red-500">
            -{discount}%
          </span>
        )}
      </Link>
      <div className="p-2.5 flex flex-col flex-1 gap-1.5">
        <Link to={`/product/${product.id}`}>
          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
            {product.name}
          </p>
        </Link>
        <div className="flex items-baseline gap-1.5">
          {product.price
            ? <span className="text-sm font-bold" style={{ color: GREEN }}>৳{Number(product.price).toLocaleString('bn-BD')}</span>
            : null}
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">৳{Number(product.original_price).toLocaleString('bn-BD')}</span>
          )}
        </div>
        <div className="mt-auto flex gap-1.5">
          {/* Cart icon */}
          <button
            onClick={() => { addItem({ ...product, shops: shop }); toast.success('কার্টে যোগ হয়েছে 🛒', { duration: 1500 }) }}
            className="flex-shrink-0 w-9 h-[30px] flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="কার্টে যোগ করুন">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          {/* Order button */}
          <button
            onClick={() => onOrder(product)}
            className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: GREEN }}>
            অর্ডার করুন
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
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

  const [rating, setRating]       = useState(5)
  const [comment, setComment]     = useState('')
  const [activeTab, setActiveTab] = useState('products')
  const [chip, setChip]           = useState('all')
  const [productSearch, setProductSearch] = useState('')

  function goOrder(product) {
    if (product) {
      navigate(`/order/${shop.id}`, {
        state: {
          shopName: shop.shop_name,
          cartItems: [{ ...product, shops: shop, qty: 1 }],
          totalAmount: Number(product.price || 0),
        }
      })
    } else {
      navigate(`/order/${shop.id}?shop=${encodeURIComponent(shop.shop_name)}`)
    }
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

  /* filtered products */
  const displayedProducts = useMemo(() => {
    let list = [...products]
    if (productSearch.trim()) {
      list = list.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()))
    }
    if (chip === 'new') list = list.filter(p => p.is_new || p.is_featured).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    else if (chip === 'discount') list = list.filter(p => p.original_price && p.original_price > p.price)
    else if (chip === 'popular') list = list.filter(p => p.is_featured)
    return list
  }, [products, chip, productSearch])

  /* ── Loading ── */
  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-28">
      <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  /* ── Error ── */
  if (error || !shop) return (
    <div className="py-24 text-center px-4">
      <div className="text-6xl mb-4">🏪</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">দোকান পাওয়া যায়নি</h2>
      <p className="text-gray-400 text-sm mb-6">লিংকটি ভুল বা দোকানটি বন্ধ।</p>
      <Link to="/shops" className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl"
        style={{ background: BLUE }}>← সব দোকান</Link>
    </div>
  )

  const logoUrl = shop.logo || shop.logo_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent((shop.shop_name || 'দ')[0])}&size=200&background=1a9e3f&color=fff&bold=true`
  const avgRating = shop.avg_rating ? Number(shop.avg_rating).toFixed(1) : null
  const phone = shop.whatsapp || shop.phone

  return (
    <div className="bg-gray-50 pb-28 lg:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* ══ HEADER ══ */}
        <div className="bg-white rounded-2xl p-4 space-y-4">

          {/* Logo + name + badges */}
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt={shop.shop_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
              onError={e => { e.target.src = logoUrl }} />
            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base font-bold text-gray-900 leading-tight">{shop.shop_name}</h1>
                {shop.verification_status === 'verified' && (
                  <svg title="যাচাইকৃত" width="18" height="18" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                    <circle cx="10" cy="10" r="10" fill={BLUE}/>
                    <path d="M6 10.5l2.5 2.5 5.5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              {/* Description one-line */}
              {shop.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{shop.description}</p>
              )}
              {/* Location + product count */}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                {(shop.district || shop.address) && (
                  <span>📍 {shop.district || shop.address?.split(',')[0]}</span>
                )}
                <span>📦 {products.length}টি পণ্য</span>
                {avgRating && <span>⭐ {avgRating}</span>}
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            {shop.phone && (
              <a href={`tel:${shop.phone}`}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="text-base">📞</span>
                কল করুন
              </a>
            )}
            {phone && (
              <a href={whatsappUrl(phone, `আমি "${shop.shop_name}" সম্পর্কে জানতে চাই`)}
                target="_blank" rel="noreferrer"
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: '#25d366' }}>
                <span className="text-base">💬</span>
                WhatsApp
              </a>
            )}
            <button onClick={handleFav}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                isFav ? 'bg-red-50 text-red-600 border-red-200' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
              <span className="text-base">{isFav ? '❤️' : '🤍'}</span>
              {isFav ? 'অনুসরণ করছেন' : 'অনুসরণ করুন'}
            </button>
          </div>
        </div>

        {/* ══ TABS ══ */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: 'products', label: `পণ্য (${products.length})` },
              { id: 'about',    label: 'তথ্য' },
              { id: 'reviews',  label: `রিভিউ (${reviews.length})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: BLUE }} />
                )}
              </button>
            ))}
          </div>

          {/* ── Products tab ── */}
          {activeTab === 'products' && (
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-3">
                <input type="text" placeholder="এই দোকানে খুঁজুন..."
                  value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                {productSearch && (
                  <button onClick={() => setProductSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                )}
              </div>

              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
                {[
                  { id: 'all',      label: 'সব' },
                  { id: 'new',      label: 'নতুন' },
                  { id: 'discount', label: 'ছাড়' },
                  { id: 'popular',  label: 'জনপ্রিয়' },
                ].map(c => (
                  <button key={c.id} onClick={() => setChip(c.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      chip === c.id
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={chip === c.id ? { background: BLUE } : {}}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Products grid */}
              {displayedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📦</div>
                  <p className="text-gray-400 text-sm">
                    {productSearch ? 'কোনো পণ্য পাওয়া যায়নি' : 'এই বিভাগে কোনো পণ্য নেই'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {displayedProducts.map(p => (
                    <ProductCard key={p.id} product={p} shop={shop} onOrder={goOrder} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── About tab ── */}
          {activeTab === 'about' && (
            <div className="p-5 space-y-4 text-sm">
              {shop.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">দোকান সম্পর্কে</p>
                  <p className="text-gray-700 leading-relaxed">{shop.description}</p>
                </div>
              )}
              <div className="space-y-3">
                {shop.phone && (
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">📞</span>
                    <div>
                      <p className="text-xs text-gray-400">ফোন</p>
                      <a href={`tel:${shop.phone}`} className="font-semibold text-gray-800">{shop.phone}</a>
                    </div>
                  </div>
                )}
                {shop.whatsapp && shop.whatsapp !== shop.phone && (
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-sm flex-shrink-0">💬</span>
                    <div>
                      <p className="text-xs text-gray-400">WhatsApp</p>
                      <a href={whatsappUrl(shop.whatsapp)} target="_blank" rel="noreferrer" className="font-semibold text-gray-800">{shop.whatsapp}</a>
                    </div>
                  </div>
                )}
                {shop.address && (
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-sm flex-shrink-0">📍</span>
                    <div>
                      <p className="text-xs text-gray-400">ঠিকানা</p>
                      <p className="font-semibold text-gray-800">{shop.address}{shop.district ? `, ${shop.district}` : ''}</p>
                    </div>
                  </div>
                )}
                {(shop.opening_time && shop.closing_time) && (
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-sm flex-shrink-0">🕐</span>
                    <div>
                      <p className="text-xs text-gray-400">খোলার সময়</p>
                      <p className="font-semibold text-gray-800">{shop.opening_time} — {shop.closing_time}</p>
                    </div>
                  </div>
                )}
                {shop.facebook_url && (
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm flex-shrink-0">📘</span>
                    <div>
                      <p className="text-xs text-gray-400">Facebook</p>
                      <a href={shop.facebook_url} target="_blank" rel="noreferrer" className="font-semibold text-blue-600">Facebook পেইজ</a>
                    </div>
                  </div>
                )}
              </div>
              {shop.delivery_available && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50">
                  <span className="text-xl">🚚</span>
                  <div>
                    <p className="font-semibold text-green-800 text-sm">হোম ডেলিভারি সুবিধা আছে</p>
                    {shop.min_order && <p className="text-xs text-green-600">সর্বনিম্ন অর্ডার: {shop.min_order}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Reviews tab ── */}
          {activeTab === 'reviews' && (
            <div className="p-5">
              {avgRating && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 mb-5">
                  <span className="text-4xl font-bold text-gray-900">{avgRating}</span>
                  <div>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-lg ${Number(avgRating) >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{reviews.length}টি রিভিউ</p>
                  </div>
                </div>
              )}

              {/* Add review form */}
              {user ? (
                <form onSubmit={handleReview} className="mb-6 pb-6 border-b border-gray-100 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">আপনার রিভিউ লিখুন</p>
                  <StarInput value={rating} onChange={setRating} />
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none bg-gray-50"
                    placeholder="আপনার অভিজ্ঞতা লিখুন..." />
                  <button type="submit" disabled={addReview.isPending}
                    className="px-5 py-2 text-white text-sm font-semibold rounded-xl disabled:opacity-60 hover:opacity-90 transition-opacity"
                    style={{ background: BLUE }}>
                    {addReview.isPending ? 'সংরক্ষণ হচ্ছে...' : 'রিভিউ দিন'}
                  </button>
                </form>
              ) : (
                <div className="mb-6 pb-6 border-b border-gray-100 text-center py-5 rounded-xl bg-gray-50">
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

      {/* ══ MOBILE STICKY BOTTOM BAR ══ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 grid grid-cols-3 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {shop.phone ? (
          <a href={`tel:${shop.phone}`}
            className="flex flex-col items-center justify-center gap-0.5 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <span className="text-xl">📞</span>
            কল করুন
          </a>
        ) : <div />}
        {phone ? (
          <a href={whatsappUrl(phone, `আমি "${shop.shop_name}" সম্পর্কে জানতে চাই`)}
            target="_blank" rel="noreferrer"
            className="flex flex-col items-center justify-center gap-0.5 py-3 text-xs font-bold text-white transition-colors"
            style={{ background: '#25d366' }}>
            <span className="text-xl">💬</span>
            WhatsApp
          </a>
        ) : <div />}
        <button onClick={handleShare}
          className="flex flex-col items-center justify-center gap-0.5 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <span className="text-xl">🔗</span>
          শেয়ার করুন
        </button>
      </div>
    </div>
  )
}
