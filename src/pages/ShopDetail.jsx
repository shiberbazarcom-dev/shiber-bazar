import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useShop, useReviews, useAddReview, useToggleFavorite, useFavorites } from '../hooks/useShops'
import { useShopProducts } from '../hooks/useProducts'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useStartConversation } from '../hooks/useChat'
import { whatsappUrl, getAvatarUrl, formatDate } from '../lib/utils'
import { productMatchesSearch } from '../lib/banglishSearch'
import { getShopTier, getTierProgress } from '../lib/shopTier'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'
import OrderModal from '../components/order/OrderModal'

const BLUE = '#2563EB'
const GREEN = '#16a34a'

/* ─── Verified seal (rosette) icon ─── */
function VerifiedSeal({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-label="যাচাইকৃত">
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
    </svg>
  )
}

/* ─── Star input ─── */
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none">
          <span className={(hover || value) >= s ? 'text-yellow-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  )
}

/* ─── Review card ─── */
function ReviewCard({ review }) {
  const avatar = review.profiles?.avatar_url || getAvatarUrl(review.profiles?.full_name || 'U', '1a9e3f')
  return (
    <div className="flex gap-3 py-4 border-b border-gray-50 last:border-0">
      <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        onError={e => { e.target.src = getAvatarUrl('U') }} />
      <div className="flex-1 min-w-0">
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

/* ═══════════════════════════════════════════════════════
   PRODUCT CARD — premium storefront style
═══════════════════════════════════════════════════════ */
const BLUE_GRADIENT = 'linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)'

function ProductCard({ product, shop, onOrder }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0

  return (
    <div
      className="h-full flex flex-col bg-white rounded-2xl overflow-hidden cursor-pointer group border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Square image */}
      <div className="relative w-full overflow-hidden bg-gray-50" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0">
          <img src={product.image_url || '/product-placeholder.svg'} alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.onerror = null; e.target.src = '/product-placeholder.svg' }}
          />
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {discount > 0 && (
            <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full shadow-sm">
              🏷️ -{discount}% ছাড়
            </span>
          )}
          {product.is_new && (
            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm" style={{ background: BLUE_GRADIENT }}>
              🔥 নতুন
            </span>
          )}
        </div>

        {/* Quick add to cart */}
        <button
          onClick={e => {
            e.stopPropagation()
            addItem({ ...product, shops: shop })
            toast.success('কার্টে যোগ হয়েছে', { duration: 1500 })
          }}
          className="absolute bottom-2 right-2 w-8 h-8 bg-white/95 backdrop-blur rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-blue-600 hover:text-white active:scale-90 transition-all duration-200"
          title="কার্টে যোগ করুন"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col flex-1">
        <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[2rem]">{product.name}</p>
        <div className="flex items-baseline gap-1.5 mt-1.5 mb-2">
          {product.price
            ? <span className="text-base font-bold" style={{ color: BLUE }}>৳{Number(product.price).toLocaleString('bn-BD')}</span>
            : <span className="text-xs text-gray-400">দাম জানতে যোগাযোগ</span>
          }
          {discount > 0 && (
            <span className="text-[10px] text-gray-400 line-through">৳{Number(product.original_price).toLocaleString('bn-BD')}</span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onOrder(product) }}
          className="mt-auto w-full h-9 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
          style={{ background: BLUE_GRADIENT }}
        >
          অর্ডার করুন
        </button>
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
  const addReview         = useAddReview()
  const toggleFavorite    = useToggleFavorite()
  const startConversation = useStartConversation()

  async function handleStartChat() {
    if (!user) { navigate('/login'); return }
    if (shop.owner_id === user.id) { toast('নিজের দোকানে বার্তা পাঠানো যাবে না'); return }
    try {
      const conv = await startConversation.mutateAsync({ shopId: shop.id, ownerId: shop.owner_id })
      navigate(`/dashboard/chat/${conv.id}`)
    } catch { toast.error('বার্তা শুরু করা যায়নি') }
  }

  const [rating, setRating]       = useState(5)
  const [comment, setComment]     = useState('')
  const [activeTab, setActiveTab] = useState('products')
  const [chip, setChip]           = useState('all')
  const [productSearch, setProductSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [orderProduct, setOrderProduct] = useState(null)

  /* Opens the in-page order modal (no redirect) — order logic unchanged */
  function goOrder(product) {
    setOrderProduct(product || null)
    setOrderOpen(true)
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

  const displayedProducts = useMemo(() => {
    let list = products.filter(p => productMatchesSearch(p, productSearch))
    if (chip === 'new')           list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    else if (chip === 'discount') list = list.filter(p => p.original_price && p.original_price > p.price)
    else if (chip === 'popular')  list = list.filter(p => p.is_featured)
    return list
  }, [products, chip, productSearch])

  const featuredProducts = useMemo(() => products.filter(p => p.is_featured).slice(0, 10), [products])

  /* ── Loading skeleton ── */
  if (isLoading) return (
    <div className="min-h-screen bg-white">
      <div className="animate-pulse">
        <div className="h-36 sm:h-48 bg-gray-100" />
        <div className="px-4 pb-3 flex gap-3 items-end -mt-10">
          <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-white flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pt-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="bg-gray-100" style={{ paddingBottom: '125%' }} />
              <div className="pt-2 space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (error || !shop) return (
    <div className="py-24 text-center px-4 bg-white min-h-screen">
      <div className="text-6xl mb-4">🏪</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">দোকান পাওয়া যায়নি</h2>
      <Link to="/shops" className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl"
        style={{ background: BLUE }}>← সব দোকান</Link>
    </div>
  )

  const logoUrl = shop.logo || shop.logo_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent((shop.shop_name || 'দ')[0])}&size=200&background=2563eb&color=fff&bold=true`
  const avgRating = shop.avg_rating ? Number(shop.avg_rating).toFixed(1) : null
  const phone = shop.whatsapp || shop.phone

  const CHIPS = [
    { id: 'all',      label: 'সব' },
    { id: 'new',      label: 'নতুন' },
    { id: 'discount', label: 'ছাড়' },
    { id: 'popular',  label: 'জনপ্রিয়' },
  ]

  const TABS = [
    { id: 'products', label: 'পণ্য',  count: products.length },
    { id: 'about',    label: 'তথ্য',  count: null },
    { id: 'reviews',  label: 'রিভিউ', count: reviews.length },
  ]

  return (
    <div className="bg-white min-h-screen pb-36 md:pb-24 lg:pb-6">
      <SEO
        title={shop.shop_name}
        description={shop.description || `${shop.shop_name} — শিবের বাজারের একটি দোকান।`}
        image={shop.logo || shop.logo_url}
        url={`https://shiber-bazar.vercel.app/shop/${shop.slug || shop.id}`}
      />

      {/* ══════════════════════════════
          STICKY HEADER
      ══════════════════════════════ */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {searchOpen ? (
            <input autoFocus type="text" placeholder="এই দোকানে খুঁজুন..."
              value={productSearch} onChange={e => setProductSearch(e.target.value)}
              className="flex-1 text-sm py-2 px-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400"
            />
          ) : (
            <h1 className="flex-1 font-bold text-gray-900 text-base truncate">{shop.shop_name}</h1>
          )}

          <button onClick={() => { setSearchOpen(v => !v); if (searchOpen) setProductSearch('') }}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
            {searchOpen
              ? <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
            }
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">

        {/* ══════════════════════════════
            COVER BANNER + SHOP PROFILE
        ══════════════════════════════ */}
        <div className="relative">
          <div className="h-36 sm:h-48 w-full overflow-hidden"
            style={{ background: BLUE_GRADIENT }}>
            {(shop.cover_image || shop.cover_image_url) && (
              <img src={shop.cover_image || shop.cover_image_url} alt=""
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }} />
            )}
          </div>

          {/* Overlay actions — favorite & share */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={handleFav} aria-label="পছন্দ করুন"
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm active:scale-90 transition-all">
              {isFav
                ? <svg className="w-4.5 h-4.5 text-red-500 fill-red-500" width="18" height="18" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                : <svg className="w-4.5 h-4.5 text-gray-600" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              }
            </button>
            <button onClick={handleShare} aria-label="শেয়ার করুন"
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm active:scale-90 transition-all">
              <svg className="text-gray-600" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="px-4 pb-5 border-b border-gray-50">
          {/* Circular logo overlapping banner + trust badge */}
          <div className="flex items-end justify-between relative z-10 -mt-10">
            <div className="relative flex-shrink-0">
              <img src={logoUrl} alt={shop.shop_name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-white"
                onError={e => { e.target.src = logoUrl }} />
            </div>
            {shop.verification_status === 'verified' && (
              <span className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 px-3 py-1.5 rounded-full shadow-sm border border-blue-200"
                style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
                <VerifiedSeal className="w-4 h-4 text-blue-600" />
                যাচাইকৃত দোকান
              </span>
            )}
          </div>

          {/* Shop info */}
          <div className="mt-2.5">
            <h2 className="font-bold text-xl text-gray-900 leading-tight flex items-center gap-1.5 flex-wrap">
              {shop.shop_name}
              {shop.verification_status === 'verified' && (
                <span className="relative inline-flex flex-shrink-0" title="যাচাইকৃত দোকান">
                  <span className="absolute inset-0 rounded-full bg-blue-400/50 animate-ping" style={{ animationDuration: '2.5s' }} />
                  <VerifiedSeal className="w-5 h-5 text-blue-500 relative" />
                </span>
              )}
              {(() => {
                const tierShop = { ...shop, is_verified: shop.verification_status === 'verified' }
                const tier = getShopTier(tierShop)
                if (!tier) return null
                return (
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color} ${tier.border}`}>
                    {tier.emoji} {tier.label}
                  </span>
                )
              })()}
            </h2>
            {(shop.categories?.name || shop.district || shop.address) && (
              <p className="text-xs text-gray-500 font-medium mt-1">
                {[shop.categories?.name, shop.district || shop.address?.split(',')[0]].filter(Boolean).join(' • ')}
              </p>
            )}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
              <span><b className="text-gray-800 text-sm">{products.length}</b> পণ্য</span>
              {shop.delivery_available && (
                <span className="text-green-600 font-medium">🚚 ডেলিভারি</span>
              )}
              {avgRating && (
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  <b className="text-gray-800">{avgRating}</b>
                  <span className="text-gray-400">({reviews.length} রিভিউ)</span>
                </span>
              )}
            </div>
            {(shop.tagline || shop.description) && (
              <p className="text-[13px] text-gray-400 italic mt-2 line-clamp-1">
                "{(shop.tagline || shop.description).split('\n')[0]}"
              </p>
            )}
          </div>

          {/* Primary actions — desktop only (mobile uses the sticky bottom bar) */}
          <div className="hidden lg:flex gap-2.5 mt-4">
            <button onClick={() => goOrder(null)}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold text-white shadow-md shadow-blue-200 hover:opacity-90 active:scale-95 transition-all"
              style={{ background: BLUE_GRADIENT }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              🛒 অর্ডার করুন
            </button>
            {phone && (
              <a href={whatsappUrl(phone, `আমি "${shop.shop_name}" সম্পর্কে জানতে চাই`)}
                target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold text-white shadow-md shadow-green-200 hover:opacity-90 active:scale-95 transition-all"
                style={{ background: '#25d366' }}>
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
            {/* In-app chat button */}
            {shop.owner_id !== user?.id && (
              <button
                onClick={handleStartChat}
                disabled={startConversation.isPending}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-60"
              >
                💬 বার্তা পাঠান
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════
            TABS
        ══════════════════════════════ */}
        <div className="flex border-b border-gray-100 sticky top-14 z-30 bg-white">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-colors relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {tab.label}
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>{tab.count}</span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-8 right-8 h-0.5 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════
            PRODUCTS TAB
        ══════════════════════════════ */}
        {activeTab === 'products' && (
          <div className="px-4 pb-4">
            {/* Filter chips — sticky on mobile */}
            <div className="sticky top-[104px] z-20 bg-white/95 backdrop-blur -mx-4 px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
              {CHIPS.map(c => (
                <button key={c.id} onClick={() => setChip(c.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    chip === c.id
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={chip === c.id ? { background: BLUE_GRADIENT } : {}}>
                  {c.label}
                </button>
              ))}
            </div>

            {/* 🔥 Featured products */}
            {chip === 'all' && !productSearch && featuredProducts.length > 0 && (
              <div className="mt-3 mb-5">
                <h3 className="text-sm font-bold text-gray-900 mb-2.5">🔥 ফিচার্ড পণ্য</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {featuredProducts.map(p => (
                    <div key={p.id} className="w-36 flex-shrink-0">
                      <ProductCard product={p} shop={shop} onOrder={goOrder} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayedProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-gray-500 font-medium">
                  {productSearch ? `"${productSearch}" পাওয়া যায়নি` : 'কোনো পণ্য নেই'}
                </p>
                {productSearch && (
                  <button onClick={() => { setProductSearch(''); setSearchOpen(false) }}
                    className="text-sm font-semibold mt-3" style={{ color: BLUE }}>
                    সব পণ্য দেখুন
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Result count when searching */}
                {productSearch && (
                  <p className="text-xs text-gray-400 mb-3 font-medium">
                    "{productSearch}" — {displayedProducts.length}টি পণ্য পাওয়া গেছে
                  </p>
                )}
                {/* 2-column portrait grid */}
                {chip === 'all' && !productSearch && featuredProducts.length > 0 && (
                  <h3 className="text-sm font-bold text-gray-900 mt-1 mb-2.5">সব পণ্য</h3>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mt-3">
                  {displayedProducts.map(p => (
                    <ProductCard key={p.id} product={p} shop={shop} onOrder={goOrder} />
                  ))}
                </div>
              </>
            )}

            {/* 📸 Shop gallery — optional, shows only if shop has gallery images */}
            {Array.isArray(shop.gallery_images) && shop.gallery_images.length > 0 && (
              <div className="mt-7">
                <h3 className="text-sm font-bold text-gray-900 mb-2.5">📸 গ্যালারি</h3>
                <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {shop.gallery_images.map((img, i) => (
                    <img key={i} src={img} alt="" loading="lazy"
                      className="h-32 w-44 object-cover rounded-2xl flex-shrink-0 border border-gray-100" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════
            ABOUT TAB
        ══════════════════════════════ */}
        {activeTab === 'about' && (
          <div className="px-4 py-5 space-y-3">
            {shop.description && (
              <div className="p-4 rounded-2xl bg-gray-50">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">দোকান সম্পর্কে</p>
                <p className="text-sm text-gray-700 leading-relaxed">{shop.description}</p>
              </div>
            )}

            <div className="space-y-2">
              {[
                { show: shop.phone, icon: '📞', bg: 'bg-blue-50', label: 'ফোন',
                  content: <a href={`tel:${shop.phone}`} className="font-semibold text-sm text-gray-800">{shop.phone}</a> },
                { show: shop.whatsapp && shop.whatsapp !== shop.phone, icon: '💬', bg: 'bg-green-50', label: 'WhatsApp',
                  content: <span className="font-semibold text-sm text-gray-800">{shop.whatsapp}</span> },
                { show: shop.address, icon: '📍', bg: 'bg-red-50', label: 'ঠিকানা',
                  content: <p className="font-semibold text-sm text-gray-800">{shop.address}{shop.district ? `, ${shop.district}` : ''}</p> },
                { show: shop.opening_time && shop.closing_time, icon: '🕐', bg: 'bg-yellow-50', label: 'সময়',
                  content: <p className="font-semibold text-sm text-gray-800">{shop.opening_time} — {shop.closing_time}</p> },
                { show: shop.facebook_url, icon: '📘', bg: 'bg-blue-50', label: 'Facebook',
                  content: <a href={shop.facebook_url} target="_blank" rel="noreferrer" className="font-semibold text-sm text-blue-600">পেইজ দেখুন →</a> },
              ].filter(r => r.show).map((row, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-100">
                  <span className={`w-10 h-10 rounded-xl ${row.bg} flex items-center justify-center text-base flex-shrink-0`}>{row.icon}</span>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">{row.label}</p>
                    {row.content}
                  </div>
                </div>
              ))}
            </div>

            {shop.delivery_available && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="font-bold text-green-800 text-sm">হোম ডেলিভারি সুবিধা আছে</p>
                  {shop.min_order && <p className="text-xs text-green-600 mt-0.5">সর্বনিম্ন অর্ডার: {shop.min_order}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════
            REVIEWS TAB
        ══════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div className="px-4 py-5">
            {avgRating && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-50 border border-yellow-100 mb-5">
                <div className="text-center min-w-[52px]">
                  <p className="text-3xl font-black text-gray-900">{avgRating}</p>
                  <p className="text-[10px] text-gray-400">/ 5</p>
                </div>
                <div>
                  <div className="flex mb-1">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-lg ${Number(avgRating) >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{reviews.length}টি রিভিউ</p>
                </div>
              </div>
            )}

            {user ? (
              <form onSubmit={handleReview} className="mb-5 pb-5 border-b border-gray-100 space-y-3">
                <p className="text-sm font-bold text-gray-700">আপনার রিভিউ লিখুন</p>
                <StarInput value={rating} onChange={setRating} />
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none bg-gray-50"
                  placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..." />
                <button type="submit" disabled={addReview.isPending}
                  className="px-5 py-2.5 text-white text-sm font-bold rounded-2xl disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: BLUE }}>
                  {addReview.isPending ? 'সংরক্ষণ হচ্ছে...' : 'রিভিউ দিন'}
                </button>
              </form>
            ) : (
              <div className="mb-5 pb-5 border-b border-gray-100 text-center py-5 rounded-2xl bg-gray-50">
                <p className="text-sm text-gray-500 mb-3">রিভিউ দিতে লগইন করুন</p>
                <Link to="/login" className="inline-block px-5 py-2 text-sm font-bold text-white rounded-xl"
                  style={{ background: BLUE }}>লগইন করুন</Link>
              </div>
            )}

            {reviews.length === 0
              ? <div className="text-center py-12">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-sm text-gray-400">এখনো কোনো রিভিউ নেই।</p>
                </div>
              : <div>{reviews.map(r => <ReviewCard key={r.id} review={r} />)}</div>
            }
          </div>
        )}
      </div>

      {/* ══ MOBILE STICKY BOTTOM BAR ══ */}
      <div className="lg:hidden fixed bottom-[60px] md:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-2.5">
        <div className="flex gap-2.5 max-w-2xl mx-auto">
          <button onClick={() => goOrder(null)}
            className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white active:scale-95 transition-all"
            style={{ background: BLUE_GRADIENT }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            🛒 অর্ডার করুন
          </button>
          {phone ? (
            <a href={whatsappUrl(phone, `আমি "${shop.shop_name}" সম্পর্কে জানতে চাই`)}
              target="_blank" rel="noreferrer"
              className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white active:scale-95 transition-all"
              style={{ background: '#25d366' }}>
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          ) : <div />}
          {shop.owner_id !== user?.id && (
            <button onClick={handleStartChat} disabled={startConversation.isPending}
              className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 active:scale-95 transition-all disabled:opacity-60">
              💬 বার্তা পাঠান
            </button>
          )}
        </div>
      </div>

      {/* ══ ORDER MODAL (bottom sheet) ══ */}
      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        shop={shop}
        product={orderProduct}
      />
    </div>
  )
}
