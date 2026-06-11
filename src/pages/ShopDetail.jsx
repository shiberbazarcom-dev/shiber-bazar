import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useShop, useReviews, useAddReview, useToggleFavorite, useFavorites } from '../hooks/useShops'
import { useShopProducts } from '../hooks/useProducts'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { whatsappUrl, getAvatarUrl, formatDate } from '../lib/utils'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'

const BLUE  = '#2563EB'
const GREEN = '#16a34a'

/* ─────────────────────────────────────────────────────────
   BANGLISH → BENGALI keyword map
   Keys = romanized (lowercase), values = Bengali equivalents
   One romanized key can match multiple Bengali words
───────────────────────────────────────────────────────── */
const BANGLISH_MAP = {
  // Clothing
  shirt: ['শার্ট','সার্ট'], jama: ['জামা'], panjabi: ['পাঞ্জাবি'], punjabi: ['পাঞ্জাবি'],
  lungi: ['লুঙ্গি'], saree: ['শাড়ি'], sari: ['শাড়ি'], salwar: ['সালোয়ার'],
  kamiz: ['কামিজ'], kameez: ['কামিজ'], pant: ['প্যান্ট'], trouser: ['ট্রাউজার'],
  jacket: ['জ্যাকেট'], sweater: ['সোয়েটার','সুয়েটার'], coat: ['কোট'],
  cap: ['টুপি'], topi: ['টুপি'], jutiur: ['জুতা'], juta: ['জুতা'], shoe: ['জুতা','স্যান্ডেল'],
  sandal: ['স্যান্ডেল'], belt: ['বেল্ট'], bag: ['ব্যাগ'], moja: ['মোজা'], socks: ['মোজা'],
  // Food & grocery
  rice: ['চাল','ভাত'], chal: ['চাল'], dal: ['ডাল'], daal: ['ডাল'],
  tel: ['তেল'], oil: ['তেল'], shorisha: ['সরিষা'], mustard: ['সরিষা'],
  fish: ['মাছ'], maach: ['মাছ'], murgi: ['মুরগি'], chicken: ['মুরগি'],
  gosht: ['গোশত','মাংস'], meat: ['মাংস','গোশত'], beef: ['গরুর মাংস'],
  egg: ['ডিম'], dim: ['ডিম'], milk: ['দুধ'], dudh: ['দুধ'],
  alu: ['আলু'], potato: ['আলু'], onion: ['পেঁয়াজ'], peyaj: ['পেঁয়াজ'],
  tomato: ['টমেটো'], begun: ['বেগুন'], lau: ['লাউ'],
  sugar: ['চিনি'], chini: ['চিনি'], salt: ['লবণ'], lobon: ['লবণ'],
  atta: ['আটা'], flour: ['আটা','ময়দা'], maida: ['ময়দা'],
  // Electronics
  phone: ['ফোন','মোবাইল'], mobile: ['মোবাইল','ফোন'], tv: ['টিভি','টেলিভিশন'],
  fan: ['ফ্যান'], ac: ['এসি'], fridge: ['ফ্রিজ'], freeze: ['ফ্রিজ'],
  laptop: ['ল্যাপটপ'], computer: ['কম্পিউটার'], charger: ['চার্জার'],
  headphone: ['হেডফোন'], earphone: ['ইয়ারফোন'],
  // Personal care
  sabun: ['সাবান'], soap: ['সাবান'], shampoo: ['শ্যাম্পু'],
  toothbrush: ['টুথব্রাশ','দাঁতের ব্রাশ'], toothpaste: ['টুথপেস্ট','পেস্ট'],
  cream: ['ক্রিম'], lotion: ['লোশন'], powder: ['পাউডার'], talcum: ['পাউডার'],
  // Furniture / home
  chair: ['চেয়ার'], table: ['টেবিল'], bed: ['বিছানা','বেড'], sofa: ['সোফা'],
  almirah: ['আলমারি'], almari: ['আলমারি'], mat: ['মাদুর','মাট'],
  // Medicines / health
  medicine: ['ওষুধ'], oshud: ['ওষুধ'], tablet: ['ট্যাবলেট'], capsule: ['ক্যাপসুল'],
  // Stationery
  pen: ['কলম','পেন'], pencil: ['পেন্সিল'], khata: ['খাতা'], notebook: ['খাতা','নোটবুক'],
  book: ['বই'], boi: ['বই'],
  // Misc
  clock: ['ঘড়ি'], ghori: ['ঘড়ি'], watch: ['ঘড়ি'], toy: ['খেলনা'], khelna: ['খেলনা'],
  candle: ['মোমবাতি'], torch: ['টর্চ'], lock: ['তালা'], tala: ['তালা'],
}

/**
 * Checks if a product matches the search query.
 * Supports: Bengali direct match, English/Banglish keyword map,
 * partial romanized match against product name transliteration.
 */
function productMatchesSearch(product, query) {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const name = (product.name || '').toLowerCase()
  const desc = (product.description || '').toLowerCase()

  // 1. Direct substring match (handles Bengali → Bengali)
  if (name.includes(q) || desc.includes(q)) return true

  // 2. Banglish map: look up the query (or each word) in the map
  const words = q.split(/\s+/)
  for (const word of words) {
    const mapped = BANGLISH_MAP[word]
    if (mapped) {
      for (const bn of mapped) {
        if (name.includes(bn) || desc.includes(bn)) return true
      }
    }
  }

  // 3. Partial map scan: query is a substring of any map key
  for (const [key, bns] of Object.entries(BANGLISH_MAP)) {
    if (key.includes(q) || q.includes(key)) {
      for (const bn of bns) {
        if (name.includes(bn) || desc.includes(bn)) return true
      }
    }
  }

  return false
}

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
    <div className="flex gap-3 py-4 border-b border-gray-50 last:border-0">
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

/* ─── Product Card ─── */
function ProductCard({ product, shop, onOrder }) {
  const { addItem } = useCart()
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name}
              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.parentElement.innerHTML = '<div class="w-full aspect-square bg-gray-50 flex items-center justify-center text-4xl">📦</div>' }} />
          : <div className="w-full aspect-square bg-gray-50 flex items-center justify-center text-4xl">📦</div>
        }
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-red-500 shadow-sm">
            -{discount}%
          </span>
        )}
        {product.is_new && !discount && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-blue-500 shadow-sm">
            নতুন
          </span>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <Link to={`/product/${product.id}`}>
          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-blue-600 transition-colors">
            {product.name}
          </p>
        </Link>

        <div className="flex items-baseline gap-1.5">
          {product.price
            ? <span className="text-sm font-bold" style={{ color: GREEN }}>৳{Number(product.price).toLocaleString('bn-BD')}</span>
            : <span className="text-xs text-gray-400">দাম জানতে কল করুন</span>}
          {discount > 0 && (
            <span className="text-[10px] text-gray-400 line-through">৳{Number(product.original_price).toLocaleString('bn-BD')}</span>
          )}
        </div>

        <div className="mt-auto flex gap-1.5 pt-1">
          <button
            onClick={() => { addItem({ ...product, shops: shop }); toast.success('কার্টে যোগ হয়েছে 🛒', { duration: 1500 }) }}
            className="flex-shrink-0 w-9 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            title="কার্টে যোগ করুন">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          <button
            onClick={() => onOrder(product)}
            className="flex-1 h-8 text-[11px] sm:text-xs font-bold text-white rounded-xl hover:opacity-90 active:scale-95 transition-all"
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

  const displayedProducts = useMemo(() => {
    let list = products.filter(p => productMatchesSearch(p, productSearch))
    if (chip === 'new')           list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    else if (chip === 'discount') list = list.filter(p => p.original_price && p.original_price > p.price)
    else if (chip === 'popular')  list = list.filter(p => p.is_featured)
    return list
  }, [products, chip, productSearch])

  /* ── Loading ── */
  if (isLoading) return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4 pb-28">
        <div className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-7 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
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

  const tabs = [
    { id: 'products', label: 'পণ্য',   count: products.length },
    { id: 'about',    label: 'তথ্য',   count: null },
    { id: 'reviews',  label: 'রিভিউ',  count: reviews.length },
  ]

  return (
    <div className="bg-[#f7f8fa] min-h-screen pb-28 lg:pb-10">
      <SEO
        title={shop.shop_name}
        description={shop.description || `${shop.shop_name} — শিবের বাজারের একটি দোকান।`}
        image={shop.logo || shop.logo_url}
        url={`https://shiber-bazar.vercel.app/shop/${shop.slug || shop.id}`}
      />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3">

        {/* ══════════════════════════════════
            SHOP HEADER CARD
        ══════════════════════════════════ */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cover strip */}
          <div
            className="h-16 sm:h-20 relative"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)' }}
          >
            {/* Decorative circles */}
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
            <div className="absolute -right-2 top-4 w-14 h-14 rounded-full bg-white/10" />
            {/* Share button */}
            <button onClick={handleShare}
              className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              title="শেয়ার করুন">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          <div className="px-4 pb-4">
            {/* Logo + name row */}
            <div className="flex items-end gap-3 -mt-8 mb-3">
              <div className="relative flex-shrink-0">
                <img src={logoUrl} alt={shop.shop_name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                  onError={e => { e.target.src = logoUrl }} />
                {shop.verification_status === 'verified' && (
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5l2 2 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">{shop.shop_name}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {shop.categories?.name && (
                    <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{shop.categories.name}</span>
                  )}
                  {shop.delivery_available && (
                    <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">🚚 ডেলিভারি</span>
                  )}
                </div>
              </div>

              {/* Favorite button */}
              <button onClick={handleFav}
                className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center text-lg transition-all ${
                  isFav ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                }`}>
                {isFav ? '❤️' : '🤍'}
              </button>
            </div>

            {/* Description */}
            {shop.description && (
              <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{shop.description}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              {(shop.district || shop.address) && (
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">📍</span>
                  {shop.district || shop.address?.split(',')[0]}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="text-gray-400">📦</span>
                {products.length}টি পণ্য
              </span>
              {avgRating && (
                <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                  ★ {avgRating}
                  <span className="text-gray-400 font-normal">({reviews.length})</span>
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5">
              {shop.phone && (
                <a href={`tel:${shop.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95">
                  📞 <span>কল করুন</span>
                </a>
              )}
              {phone && (
                <a href={whatsappUrl(phone, `আমি "${shop.shop_name}" সম্পর্কে জানতে চাই`)}
                  target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  style={{ background: '#25d366' }}>
                  💬 <span>WhatsApp</span>
                </a>
              )}
              <button
                onClick={() => goOrder(null)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all shadow-sm"
                style={{ background: BLUE }}>
                🛒 <span>অর্ডার</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════
            TABS
        ══════════════════════════════════ */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-all relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }`}>
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                  }`}>{tab.count}</span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: BLUE }} />
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50 transition-all" />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                {productSearch && (
                  <button onClick={() => setProductSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                )}
              </div>

              {/* Filter chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
                {[
                  { id: 'all',      label: '🗂️ সব' },
                  { id: 'new',      label: '✨ নতুন' },
                  { id: 'discount', label: '🏷️ ছাড়' },
                  { id: 'popular',  label: '🔥 জনপ্রিয়' },
                ].map(c => (
                  <button key={c.id} onClick={() => setChip(c.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      chip === c.id
                        ? 'text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={chip === c.id ? { background: BLUE } : {}}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Products grid */}
              {displayedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">📦</div>
                  <p className="text-gray-500 font-medium mb-1">
                    {productSearch ? `"${productSearch}" পাওয়া যায়নি` : 'এই বিভাগে কোনো পণ্য নেই'}
                  </p>
                  {productSearch && (
                    <button onClick={() => setProductSearch('')} className="text-sm font-medium mt-2" style={{ color: BLUE }}>
                      সব পণ্য দেখুন
                    </button>
                  )}
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
            <div className="p-5 space-y-4">
              {shop.description && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">দোকান সম্পর্কে</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{shop.description}</p>
                </div>
              )}

              <div className="space-y-2">
                {[
                  { show: shop.phone, icon: '📞', bg: 'bg-blue-50', label: 'ফোন নম্বর',
                    content: <a href={`tel:${shop.phone}`} className="font-semibold text-gray-800 hover:text-blue-600">{shop.phone}</a> },
                  { show: shop.whatsapp && shop.whatsapp !== shop.phone, icon: '💬', bg: 'bg-green-50', label: 'WhatsApp',
                    content: <a href={whatsappUrl(shop.whatsapp)} target="_blank" rel="noreferrer" className="font-semibold text-gray-800">{shop.whatsapp}</a> },
                  { show: shop.address, icon: '📍', bg: 'bg-red-50', label: 'ঠিকানা',
                    content: <p className="font-semibold text-gray-800">{shop.address}{shop.district ? `, ${shop.district}` : ''}</p> },
                  { show: shop.opening_time && shop.closing_time, icon: '🕐', bg: 'bg-yellow-50', label: 'খোলার সময়',
                    content: <p className="font-semibold text-gray-800">{shop.opening_time} — {shop.closing_time}</p> },
                  { show: shop.facebook_url, icon: '📘', bg: 'bg-blue-50', label: 'Facebook',
                    content: <a href={shop.facebook_url} target="_blank" rel="noreferrer" className="font-semibold text-blue-600">Facebook পেইজ দেখুন →</a> },
                ].filter(r => r.show).map((row, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-100">
                    <span className={`w-10 h-10 rounded-xl ${row.bg} flex items-center justify-center text-base flex-shrink-0`}>{row.icon}</span>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-0.5">{row.label}</p>
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

          {/* ── Reviews tab ── */}
          {activeTab === 'reviews' && (
            <div className="p-5">
              {avgRating && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-50 border border-yellow-100 mb-5">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{avgRating}</p>
                    <p className="text-xs text-gray-500 mt-0.5">/5</p>
                  </div>
                  <div>
                    <div className="flex mb-1">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-lg ${Number(avgRating) >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">{reviews.length}টি রিভিউের উপর ভিত্তি করে</p>
                  </div>
                </div>
              )}

              {user ? (
                <form onSubmit={handleReview} className="mb-5 pb-5 border-b border-gray-100 space-y-3">
                  <p className="text-sm font-bold text-gray-700">আপনার রিভিউ</p>
                  <StarInput value={rating} onChange={setRating} />
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none bg-gray-50"
                    placeholder="আপনার অভিজ্ঞতা লিখুন..." />
                  <button type="submit" disabled={addReview.isPending}
                    className="px-5 py-2.5 text-white text-sm font-bold rounded-2xl disabled:opacity-60 hover:opacity-90 transition-opacity shadow-sm"
                    style={{ background: BLUE }}>
                    {addReview.isPending ? 'সংরক্ষণ হচ্ছে...' : '✓ রিভিউ দিন'}
                  </button>
                </form>
              ) : (
                <div className="mb-5 pb-5 border-b border-gray-100 text-center py-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-3">রিভিউ দিতে লগইন করুন</p>
                  <Link to="/login" className="inline-block px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm" style={{ background: BLUE }}>লগইন করুন →</Link>
                </div>
              )}

              {reviews.length === 0
                ? (
                  <div className="text-center py-10">
                    <p className="text-3xl mb-2">💬</p>
                    <p className="text-sm text-gray-400">এখনো কোনো রিভিউ নেই।</p>
                    <p className="text-xs text-gray-300 mt-1">প্রথম রিভিউটি আপনি লিখুন!</p>
                  </div>
                )
                : <div>{reviews.map(r => <ReviewCard key={r.id} review={r} />)}</div>
              }
            </div>
          )}
        </div>
      </div>

      {/* ══ STICKY BOTTOM BAR — mobile ══ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {shop.phone ? (
            <a href={`tel:${shop.phone}`}
              className="flex flex-col items-center justify-center gap-0.5 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <span className="text-xl">📞</span>
              কল করুন
            </a>
          ) : <div />}
          {phone ? (
            <a href={whatsappUrl(phone, `আমি "${shop.shop_name}" সম্পর্কে জানতে চাই`)}
              target="_blank" rel="noreferrer"
              className="flex flex-col items-center justify-center gap-0.5 py-3 text-xs font-bold text-white active:opacity-90 transition-opacity"
              style={{ background: '#25d366' }}>
              <span className="text-xl">💬</span>
              WhatsApp
            </a>
          ) : <div />}
          <button onClick={handleShare}
            className="flex flex-col items-center justify-center gap-0.5 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <span className="text-xl">🔗</span>
            শেয়ার
          </button>
        </div>
      </div>
    </div>
  )
}
