import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProduct, useShopProducts } from '../hooks/useProducts'
import { whatsappUrl } from '../lib/utils'

const GREEN = '#16a34a'
const BLUE  = '#2563EB'

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
}

/* ─── Related product card ───────────────────────────────────────────────── */
function RelatedCard({ product }) {
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0

  return (
    <Link to={`/product/${product.id}`}
      className="group rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-md transition-all duration-200 bg-white flex flex-col">
      <div className="relative overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name}
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.parentElement.innerHTML = '<div class="w-full h-32 bg-gray-50 flex items-center justify-center text-3xl">📦</div>' }} />
          : <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-3xl">📦</div>
        }
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-xs font-bold text-white px-1.5 py-0.5 rounded-full"
            style={{ background: '#ef4444', fontSize: '10px' }}>-{discount}%</span>
        )}
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug mb-1.5">{product.name}</p>
        {product.price && (
          <p className="text-sm font-bold mt-auto" style={{ color: GREEN }}>
            ৳{Number(product.price).toLocaleString('bn-BD')}
          </p>
        )}
      </div>
    </Link>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: product, isLoading, error } = useProduct(id)
  const { data: related = [] } = useShopProducts(product?.shop_id)
  const [activeImg, setActiveImg] = useState(0)
  const [imgZoom, setImgZoom] = useState(false)

  function goOrder() {
    const shop = product.shops
    const params = new URLSearchParams({
      shop: shop?.shop_name || '',
      product: product.name,
      ...(product.price ? { price: String(product.price) } : {}),
    })
    navigate(`/order/${shop?.id}?${params.toString()}`)
  }

  /* ── Loading skeleton ── */
  if (isLoading) return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-6">
        <Skeleton className="h-96 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )

  /* ── Error state ── */
  if (error || !product) return (
    <div className="py-24 text-center px-4">
      <div className="text-6xl mb-4">📦</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">পণ্য পাওয়া যায়নি</h2>
      <p className="text-gray-400 text-sm mb-6">এই পণ্যটি হয়তো মুছে ফেলা হয়েছে।</p>
      <Link to="/shops" className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl"
        style={{ background: BLUE }}>
        ← দোকান দেখুন
      </Link>
    </div>
  )

  const shop = product.shops

  /* images */
  const rawImgs = [product.image_url, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean)
  const allImages = [...new Set(rawImgs)]
  const mainImage = allImages[activeImg] ?? allImages[0] ?? null

  /* related products */
  const relatedOthers = related.filter(p => p.id !== product.id).slice(0, 6)

  /* discount */
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0
  const savings = discount > 0 ? Number(product.original_price) - Number(product.price) : 0

  return (
    <div className="pb-32 md:pb-28 lg:pb-10" style={{ background: '#f3f4f6' }}>

      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto px-4 py-3">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <Link to="/" className="hover:text-blue-600 transition-colors">হোম</Link>
          <span>›</span>
          <Link to="/shops" className="hover:text-blue-600 transition-colors">দোকান</Link>
          {shop && (
            <>
              <span>›</span>
              <Link to={`/shop/${shop.slug || shop.id}`} className="hover:text-blue-600 transition-colors">{shop.shop_name}</Link>
            </>
          )}
          <span>›</span>
          <span className="text-gray-600 truncate max-w-[180px]">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-4">

        {/* ══════════════════════════════════════════════════════
            TOP SECTION: Image | Info | Purchase Card
        ══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-4">

          {/* ─── Image Gallery ─── */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden relative group">
              <div className="relative cursor-zoom-in" onClick={() => allImages.length > 0 && setImgZoom(true)}>
                {mainImage ? (
                  <img src={mainImage} alt={product.name} key={mainImage}
                    className="w-full h-72 sm:h-96 object-contain p-4"
                    onError={e => { e.target.style.display = 'none' }} />
                ) : (
                  <div className="w-full h-72 sm:h-96 flex items-center justify-center text-8xl bg-gray-50">📦</div>
                )}
                {discount > 0 && (
                  <span className="absolute top-3 left-3 text-sm font-bold text-white px-3 py-1 rounded-full"
                    style={{ background: '#ef4444' }}>-{discount}%</span>
                )}
                {allImages.length > 0 && (
                  <span className="absolute bottom-3 right-3 text-xs text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                    🔍 বড় দেখুন
                  </span>
                )}
              </div>
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-blue-500 shadow-md scale-105' : 'border-transparent hover:border-gray-300 bg-white'
                    }`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400">
              {allImages.length > 1 && <span>{activeImg + 1} / {allImages.length}</span>}
              <button onClick={async () => {
                const url = window.location.href
                if (navigator.share) { try { await navigator.share({ title: product.name, url }) } catch {} }
                else { await navigator.clipboard.writeText(url) }
              }} className="flex items-center gap-1 hover:text-blue-600 transition-colors ml-auto">
                🔗 শেয়ার করুন
              </button>
            </div>
          </div>

          {/* ─── Product Info ─── */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
            {/* Name + badges */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-3">{product.name}</h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-1">
                {product.price && (
                  <p className="text-3xl font-bold" style={{ color: GREEN }}>
                    ৳{Number(product.price).toLocaleString('bn-BD')}
                  </p>
                )}
                {discount > 0 && (
                  <>
                    <p className="text-base text-gray-400 line-through">
                      ৳{Number(product.original_price).toLocaleString('bn-BD')}
                    </p>
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                      style={{ background: '#ef4444' }}>{discount}% OFF</span>
                  </>
                )}
              </div>
              {savings > 0 && (
                <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>
                  আপনি সাশ্রয় করছেন ৳{savings.toLocaleString('bn-BD')}!
                </p>
              )}
            </div>

            {/* Stock badge */}
            {product.stock !== null && (
              <div>
                {product.stock > 0
                  ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                      ✓ স্টকে আছে ({product.stock}টি)
                    </span>
                  : <span className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-full">
                      ✕ স্টক শেষ
                    </span>
                }
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">বিবরণ</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Features */}
            {product.features && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">বৈশিষ্ট্য</p>
                <ul className="space-y-1.5">
                  {product.features.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5"
                        style={{ background: GREEN, fontSize: '9px' }}>✓</span>
                      {line.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust badges */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-2">
              {[
                { icon: '✅', label: 'যাচাইকৃত', sub: 'বিক্রেতা', bg: '#eff6ff', color: BLUE },
                { icon: '⚡', label: 'দ্রুত সাড়া', sub: '২ ঘণ্টায়', bg: '#f0fdf4', color: GREEN },
                { icon: '🔒', label: 'নিরাপদ', sub: 'অর্ডার', bg: '#fefce8', color: '#92400e' },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center text-center p-2.5 rounded-xl" style={{ background: b.bg }}>
                  <span className="text-lg mb-0.5">{b.icon}</span>
                  <p className="text-xs font-bold leading-tight" style={{ color: b.color }}>{b.label}</p>
                  <p className="text-xs opacity-70 leading-tight" style={{ color: b.color }}>{b.sub}</p>
                </div>
              ))}
            </div>

            {/* Mobile CTA buttons (inside info card, visible on mobile only) */}
            <div className="lg:hidden flex flex-col gap-2 border-t border-gray-100 pt-4">
              <button onClick={goOrder}
                className="w-full py-3.5 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${GREEN}, #15803d)` }}>
                🛒 এখনই অর্ডার করুন
              </button>
              {(shop?.whatsapp || shop?.phone) && (
                <a href={whatsappUrl(
                    shop.whatsapp || shop.phone,
                    `"${product.name}" পণ্যটি অর্ডার করতে চাই${product.price ? ` — মূল্য ৳${product.price}` : ''}`
                  )}
                  target="_blank" rel="noreferrer"
                  className="w-full py-3 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border-2 transition-all"
                  style={{ borderColor: '#25d366', color: '#25d366', background: '#f0fdf4' }}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp অর্ডার
                </a>
              )}
              {shop?.phone && (
                <a href={`tel:${shop.phone}`}
                  className="w-full py-2.5 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                  📞 কল করুন — {shop.phone}
                </a>
              )}
            </div>
          </div>

          {/* ─── Desktop Purchase Card ─── */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-4 space-y-3">
              <div className="pb-4 border-b border-gray-100">
                <p className="text-xs text-gray-500 mb-1">মূল্য</p>
                <div className="flex items-baseline gap-2">
                  {product.price && (
                    <p className="text-2xl font-bold" style={{ color: GREEN }}>
                      ৳{Number(product.price).toLocaleString('bn-BD')}
                    </p>
                  )}
                  {discount > 0 && (
                    <span className="text-sm text-gray-400 line-through">
                      ৳{Number(product.original_price).toLocaleString('bn-BD')}
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#dc2626' }}>
                    সাশ্রয় ৳{savings.toLocaleString('bn-BD')} ({discount}%)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 py-1 text-xs text-gray-500">
                <span>🚚</span>
                <span>হোম ডেলিভারি সুবিধা থাকতে পারে</span>
              </div>

              <button onClick={goOrder}
                className="w-full py-3.5 text-white font-bold rounded-xl text-base transition-all hover:opacity-90 hover:shadow-lg flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${GREEN}, #15803d)` }}>
                🛒 এখনই অর্ডার করুন
              </button>

              {(shop?.whatsapp || shop?.phone) && (
                <a href={whatsappUrl(
                    shop.whatsapp || shop.phone,
                    `"${product.name}" পণ্যটি অর্ডার করতে চাই${product.price ? ` — মূল্য ৳${product.price}` : ''}`
                  )}
                  target="_blank" rel="noreferrer"
                  className="w-full py-3 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border-2 transition-all hover:opacity-90"
                  style={{ borderColor: '#25d366', color: '#25d366', background: '#f0fdf4' }}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp অর্ডার
                </a>
              )}

              {shop?.phone && (
                <a href={`tel:${shop.phone}`}
                  className="w-full py-2.5 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                  📞 {shop.phone}
                </a>
              )}

              {shop && (
                <Link to={`/shop/${shop.slug || shop.id}`}
                  className="w-full py-2.5 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 border-2 transition-colors hover:bg-blue-50"
                  style={{ borderColor: BLUE, color: BLUE }}>
                  🏪 দোকান দেখুন
                </Link>
              )}

              <div className="pt-3 border-t border-gray-100 space-y-2">
                {[
                  { icon: '🔒', text: 'নিরাপদ অর্ডার প্রক্রিয়া' },
                  { icon: '✅', text: 'যাচাইকৃত বিক্রেতা' },
                  { icon: '🔄', text: 'সহজ যোগাযোগ ব্যবস্থা' },
                ].map((b, i) => (
                  <p key={i} className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{b.icon}</span>{b.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SHOP INFO CARD
        ══════════════════════════════════════════════════════ */}
        {shop && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">বিক্রেতার তথ্য</p>
            <div className="flex items-center gap-4 mb-4">
              {(shop.logo || shop.logo_url)
                ? <img src={shop.logo || shop.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-gray-100" />
                : <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: '#eff6ff' }}>🏪</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900">{shop.shop_name}</p>
                {shop.category && (
                  <span className="inline-block text-xs px-2.5 py-0.5 rounded-full mt-1 font-medium" style={{ background: '#eff6ff', color: BLUE }}>
                    {shop.category}
                  </span>
                )}
                {shop.address && <p className="text-xs text-gray-500 mt-1.5">📍 {shop.address}</p>}
              </div>
              <Link to={`/shop/${shop.slug || shop.id}`}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors hover:opacity-90 text-white"
                style={{ background: BLUE }}>
                দোকান →
              </Link>
            </div>

            {/* Contact buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 border-t border-gray-100">
              {shop.phone && (
                <a href={`tel:${shop.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>📞</span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">ফোন নম্বর</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{shop.phone}</p>
                  </div>
                </a>
              )}
              {(shop.whatsapp || shop.phone) && (
                <a href={whatsappUrl(shop.whatsapp || shop.phone, `"${product.name}" সম্পর্কে জানতে চাই`)}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/40 transition-all">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                    <svg className="w-4 h-4" fill="#25d366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">WhatsApp</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{shop.whatsapp || shop.phone}</p>
                  </div>
                </a>
              )}
              {shop && (
                <Link to={`/shop/${shop.slug || shop.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>🛍️</span>
                  <div>
                    <p className="text-xs text-gray-400">আরও পণ্য</p>
                    <p className="text-sm font-bold" style={{ color: BLUE }}>দোকান দেখুন</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            DELIVERY & RETURN CARD
        ══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">ডেলিভারি ও রিটার্ন</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#f0fdf4' }}>
              <span className="text-2xl flex-shrink-0">🚚</span>
              <div>
                <p className="text-sm font-bold text-green-800 mb-1">হোম ডেলিভারি</p>
                <p className="text-xs text-green-700 leading-relaxed">দোকানের সাথে যোগাযোগ করে ডেলিভারির তথ্য নিশ্চিত করুন।</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#eff6ff' }}>
              <span className="text-2xl flex-shrink-0">🏪</span>
              <div>
                <p className="text-sm font-bold text-blue-800 mb-1">সরাসরি সংগ্রহ</p>
                <p className="text-xs text-blue-700 leading-relaxed">দোকানে গিয়ে সরাসরি পণ্য সংগ্রহ করতে পারবেন।</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#fefce8' }}>
              <span className="text-2xl flex-shrink-0">🔄</span>
              <div>
                <p className="text-sm font-bold text-yellow-800 mb-1">রিটার্ন পলিসি</p>
                <p className="text-xs text-yellow-700 leading-relaxed">পণ্যে সমস্যা থাকলে বিক্রেতার সাথে যোগাযোগ করুন।</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            WHY BUY FROM US — TRUST CARD
        ══════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">কেন শিবের বাজার থেকে কিনবেন?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🏅', title: 'যাচাইকৃত দোকান', desc: 'সব দোকান যাচাই করা' },
              { icon: '💬', title: 'সহজ যোগাযোগ', desc: 'WhatsApp ও ফোনে অর্ডার' },
              { icon: '🛡️', title: 'নিরাপদ কেনাকাটা', desc: 'বিশ্বস্ত মার্কেটপ্লেস' },
              { icon: '🌍', title: 'স্থানীয় বিক্রেতা', desc: 'আপনার এলাকার দোকান' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl"
                style={{ background: '#f8fafc' }}>
                <span className="text-2xl mb-2">{item.icon}</span>
                <p className="text-xs font-bold text-gray-800 mb-0.5">{item.title}</p>
                <p className="text-xs text-gray-500 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RELATED PRODUCTS
        ══════════════════════════════════════════════════════ */}
        {relatedOthers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-lg">এই দোকানের অন্য পণ্য</h2>
              {shop && (
                <Link to={`/shop/${shop.slug || shop.id}`}
                  className="text-xs font-semibold hover:underline" style={{ color: BLUE }}>
                  সব দেখুন →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {relatedOthers.map(p => <RelatedCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE STICKY BOTTOM BAR
          bottom-[60px] = sits above the bottom navbar (60px tall)
      ══════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2 max-w-lg mx-auto">
          <button onClick={goOrder}
            className="flex-1 py-3 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${GREEN}, #15803d)` }}>
            🛒 অর্ডার করুন
          </button>
          {(shop?.whatsapp || shop?.phone) && (
            <a href={whatsappUrl(
                shop.whatsapp || shop.phone,
                `"${product.name}" পণ্যটি অর্ডার করতে চাই${product.price ? ` — মূল্য ৳${product.price}` : ''}`
              )}
              target="_blank" rel="noreferrer"
              className="flex-1 py-3 font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 text-white"
              style={{ background: '#25d366' }}>
              💬 WhatsApp
            </a>
          )}
          {shop?.phone && (
            <a href={`tel:${shop.phone}`}
              className="w-12 flex items-center justify-center rounded-xl text-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
              📞
            </a>
          )}
        </div>
      </div>

      {/* ── Image zoom modal ── */}
      {imgZoom && mainImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setImgZoom(false)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-bold leading-none" onClick={() => setImgZoom(false)}>×</button>
          <img src={mainImage} alt={product.name}
            className="max-w-full max-h-full object-contain rounded-xl"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()} />
          {allImages.length > 1 && (
            <div className="absolute bottom-6 flex gap-2 justify-center">
              {allImages.map((img, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setActiveImg(i) }}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 ${activeImg === i ? 'border-white' : 'border-transparent opacity-60'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
