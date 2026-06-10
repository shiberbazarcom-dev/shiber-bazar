import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useShop, useReviews, useAddReview, useToggleFavorite, useFavorites } from '../hooks/useShops'
import { useShopProducts } from '../hooks/useProducts'
import { useAuth } from '../context/AuthContext'
import { whatsappUrl, getAvatarUrl, formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

/* ── StarRating input ── */
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="text-2xl transition-transform hover:scale-110">
          <span className={(hover || value) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
        </button>
      ))}
    </div>
  )
}

/* ── Review card ── */
function ReviewCard({ review }) {
  const avatar = review.profiles?.avatar_url || getAvatarUrl(review.profiles?.full_name || 'U', '1a9e3f')
  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        onError={e => { e.target.src = getAvatarUrl('U') }} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
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

  function goOrder(productName = '', price = null) {
    const params = new URLSearchParams({ shop: shop.shop_name })
    if (productName) params.set('product', productName)
    if (price) params.set('price', String(price))
    navigate(`/order/${shop.id}?${params.toString()}`)
  }

  const [rating, setRating]   = useState(5)
  const [comment, setComment] = useState('')
  const [imgIdx, setImgIdx]   = useState(0)

  const isFav = favorites.some(f => f.shop_id === shop?.id)

  const handleFav = () => {
    if (!user) return toast.error('পছন্দ করতে লগইন করুন')
    toggleFavorite.mutate({ shopId: shop.id, isFav })
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

  if (isLoading) return (
    <div className="container-app py-10">
      <div className="h-48 sm:h-64 skeleton w-full rounded-xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-32 skeleton rounded-xl" />)}
        </div>
      </div>
    </div>
  )

  if (error || !shop) return (
    <div className="container-app py-20 text-center">
      <p className="text-5xl mb-4">🏪</p>
      <p className="text-gray-500">দোকান পাওয়া যায়নি</p>
      <Link to="/shops" className="mt-4 inline-block text-sm font-medium" style={{ color: '#2563EB' }}>
        ← সব দোকান দেখুন
      </Link>
    </div>
  )

  const coverUrl = shop.cover_image || shop.cover_image_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.shop_name)}&size=800&background=1a9e3f&color=fff&bold=true`
  const logoUrl = shop.logo || shop.logo_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent((shop.shop_name || 'দ')[0])}&size=120&background=1a9e3f&color=fff&bold=true`

  const images = [coverUrl, ...(shop.shop_images?.map(i => i.image_url) || [])]

  const openDays = shop.open_days
    ? (Array.isArray(shop.open_days) ? shop.open_days : JSON.parse(shop.open_days))
    : []

  return (
    <div className="pb-10">
      {/* ── Cover ── */}
      <div className="relative h-52 sm:h-72 bg-gray-100 overflow-hidden">
        <img src={coverUrl} alt={shop.shop_name}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = coverUrl }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="container-app">
        {/* ── Shop header ── */}
        <div className="bg-white rounded-xl shadow-card -mt-8 relative z-10 p-5 mb-5">
          <div className="flex items-start gap-4">
            <img src={logoUrl} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-4 border-white shadow-md flex-shrink-0 -mt-12"
              onError={e => { e.target.src = logoUrl }} />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-800">{shop.shop_name}</h1>
                {shop.is_verified && (
                  <span className="text-xs text-white px-2 py-0.5 rounded-full font-semibold" style={{ background: '#2563EB' }}>
                    ✓ যাচাইকৃত
                  </span>
                )}
                {shop.is_featured && (
                  <span className="text-xs text-white px-2 py-0.5 rounded-full font-semibold" style={{ background: '#d69e2e' }}>
                    ★ ফিচার্ড
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                {shop.categories?.name && (
                  <span>{shop.categories.icon} {shop.categories.name}</span>
                )}
                {shop.address && (
                  <span>📍 {shop.address}</span>
                )}
                {shop.avg_rating > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium text-gray-700">{Number(shop.avg_rating).toFixed(1)}</span>
                    <span className="text-gray-300">({shop.review_count || 0} রিভিউ)</span>
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => goOrder()}
                  className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg"
                  style={{ background: '#16a34a' }}>
                  🛒 অর্ডার করুন
                </button>
                {shop.phone && (
                  <a href={`tel:${shop.phone}`}
                    className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-lg"
                    style={{ background: '#2563EB' }}>
                    📞 ফোন করুন
                  </a>
                )}
                {(shop.whatsapp || shop.phone) && (
                  <a href={whatsappUrl(shop.whatsapp || shop.phone, `আমি "${shop.shop_name}" সম্পর্কে জানতে চাই`)}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                    💬 WhatsApp
                  </a>
                )}
                <button onClick={handleFav}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    isFav ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}>
                  {isFav ? '❤️ সংরক্ষিত' : '🤍 পছন্দ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Products */}
            {products.length > 0 && (
              <div className="bg-white rounded-xl shadow-card p-5">
                <h2 className="font-bold text-gray-800 mb-4">পণ্যসমূহ ({products.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map(p => (
                    <div key={p.id} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                      <Link to={`/product/${p.id}`} className="flex-shrink-0">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name}
                              className="w-16 h-16 object-cover rounded-lg hover:opacity-90 transition-opacity"
                              onError={e => { e.target.style.display = 'none' }} />
                          : <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">📦</div>
                        }
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${p.id}`}>
                          <p className="font-semibold text-sm text-gray-800 truncate hover:text-blue-700 transition-colors">{p.name}</p>
                        </Link>
                        {p.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            {p.price ? (
                              <span className="text-sm font-bold" style={{ color: '#16a34a' }}>
                                ৳{Number(p.price).toLocaleString('bn-BD')}
                              </span>
                            ) : <span />}
                            {p.original_price && p.original_price > p.price && (
                              <span className="text-xs text-gray-400 line-through ml-1.5">
                                ৳{Number(p.original_price).toLocaleString('bn-BD')}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => goOrder(p.name, p.price)}
                            className="text-xs px-3 py-1.5 text-white font-medium rounded-lg"
                            style={{ background: '#16a34a' }}>
                            অর্ডার করুন
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            {shop.description && (
              <div className="bg-white rounded-xl shadow-card p-5">
                <h2 className="font-bold text-gray-800 mb-3">দোকান সম্পর্কে</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{shop.description}</p>
              </div>
            )}

            {/* Image gallery */}
            {images.length > 1 && (
              <div className="bg-white rounded-xl shadow-card p-5">
                <h2 className="font-bold text-gray-800 mb-3">ছবি</h2>
                <img src={images[imgIdx]} alt="" className="w-full h-44 sm:h-56 object-cover rounded-lg mb-3"
                  onError={e => { e.target.src = coverUrl }} />
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, i) => (
                    <img key={i} src={img} alt="" onClick={() => setImgIdx(i)}
                      className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                        imgIdx === i ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                      }`}
                      onError={e => { e.target.src = coverUrl }} />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-card p-5">
              <h2 className="font-bold text-gray-800 mb-4">রিভিউ ({reviews.length})</h2>

              {/* Add review form */}
              {user ? (
                <form onSubmit={handleReview} className="mb-6 pb-6 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">আপনার রিভিউ</p>
                  <div className="mb-3">
                    <StarInput value={rating} onChange={setRating} />
                  </div>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    className="input mb-3"
                    placeholder="আপনার অভিজ্ঞতা লিখুন..."
                  />
                  <button type="submit" disabled={addReview.isPending}
                    className="px-5 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-60"
                    style={{ background: '#2563EB' }}>
                    {addReview.isPending ? 'সংরক্ষণ হচ্ছে...' : 'রিভিউ দিন'}
                  </button>
                </form>
              ) : (
                <div className="mb-6 pb-6 border-b border-gray-100 text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">রিভিউ দিতে লগইন করুন</p>
                  <Link to="/login" className="text-sm font-medium" style={{ color: '#2563EB' }}>
                    লগইন করুন →
                  </Link>
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">এখনো কোনো রিভিউ নেই</p>
              ) : (
                <div>
                  {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                </div>
              )}
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-5">

            {/* Order CTA */}
            <div className="rounded-xl p-5 text-white text-center" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
              <p className="text-2xl mb-2">🛒</p>
              <p className="font-bold text-lg mb-1">অর্ডার করুন</p>
              <p className="text-green-100 text-xs mb-4">লগইন ছাড়াই অর্ডার দিন</p>
              <button
                onClick={() => goOrder()}
                className="w-full py-2.5 bg-white font-semibold rounded-lg text-sm transition-opacity hover:opacity-90"
                style={{ color: '#16a34a' }}>
                এখনই অর্ডার করুন →
              </button>
            </div>

            {/* Contact info */}
            <div className="bg-white rounded-xl shadow-card p-5">
              <h3 className="font-bold text-gray-800 mb-3">যোগাযোগের তথ্য</h3>
              <ul className="space-y-3">
                {shop.phone && (
                  <li className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: '#eff6ff' }}>📞</span>
                    <div>
                      <p className="text-xs text-gray-400">ফোন</p>
                      <a href={`tel:${shop.phone}`} className="text-sm font-medium text-gray-800 hover:text-blue-700 transition-colors">{shop.phone}</a>
                    </div>
                  </li>
                )}
                {shop.whatsapp && shop.whatsapp !== shop.phone && (
                  <li className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: '#eff6ff' }}>💬</span>
                    <div>
                      <p className="text-xs text-gray-400">WhatsApp</p>
                      <a href={whatsappUrl(shop.whatsapp)} target="_blank" rel="noreferrer"
                        className="text-sm font-medium text-gray-800 hover:text-blue-700 transition-colors">{shop.whatsapp}</a>
                    </div>
                  </li>
                )}
                {shop.email && (
                  <li className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: '#eff6ff' }}>✉️</span>
                    <div>
                      <p className="text-xs text-gray-400">ইমেইল</p>
                      <a href={`mailto:${shop.email}`} className="text-sm font-medium text-gray-800 hover:text-blue-700 transition-colors break-all">{shop.email}</a>
                    </div>
                  </li>
                )}
                {shop.website && (
                  <li className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: '#eff6ff' }}>🌐</span>
                    <div>
                      <p className="text-xs text-gray-400">ওয়েবসাইট</p>
                      <a href={shop.website} target="_blank" rel="noreferrer"
                        className="text-sm font-medium text-gray-800 hover:text-blue-700 transition-colors break-all">{shop.website}</a>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {/* Opening hours */}
            {(shop.opening_time || shop.closing_time || openDays.length > 0) && (
              <div className="bg-white rounded-xl shadow-card p-5">
                <h3 className="font-bold text-gray-800 mb-3">খোলার সময়</h3>
                {shop.opening_time && shop.closing_time && (
                  <p className="text-sm text-gray-700 mb-2">
                    🕐 {shop.opening_time} — {shop.closing_time}
                  </p>
                )}
                {openDays.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['রবি','সোম','মঙ্গল','বুধ','বৃহঃ','শুক্র','শনি'].map((day, i) => (
                      <span key={i}
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          openDays.includes(day)
                            ? 'text-white' : 'bg-gray-100 text-gray-400'
                        }`}
                        style={openDays.includes(day) ? { background: '#2563EB' } : {}}>
                        {day}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Address / Map */}
            {shop.address && (
              <div className="bg-white rounded-xl shadow-card p-5">
                <h3 className="font-bold text-gray-800 mb-3">ঠিকানা</h3>
                <p className="text-sm text-gray-600 mb-3">📍 {shop.address}</p>
                {shop.google_map_url ? (
                  <a href={shop.google_map_url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                    🗺️ Google Maps-এ দেখুন
                  </a>
                ) : (
                  <a href={`https://maps.google.com?q=${encodeURIComponent(shop.address)}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                    🗺️ মানচিত্রে খুঁজুন
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-card p-5">
              <h3 className="font-bold text-gray-800 mb-3">পরিসংখ্যান</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg" style={{ background: '#eff6ff' }}>
                  <p className="text-xl font-bold" style={{ color: '#2563EB' }}>{shop.view_count || 0}</p>
                  <p className="text-xs text-gray-500">ভিজিট</p>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ background: '#eff6ff' }}>
                  <p className="text-xl font-bold" style={{ color: '#2563EB' }}>{shop.review_count || 0}</p>
                  <p className="text-xs text-gray-500">রিভিউ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
