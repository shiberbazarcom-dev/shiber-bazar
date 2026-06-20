import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProduct, useShopProducts } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { recordProductView } from '../hooks/useAnalytics'
import { whatsappUrl } from '../lib/utils'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'
import OrderModal from '../components/order/OrderModal'

const GREEN = '#16a34a'
const BLUE  = '#2563EB'

const WA_ICON = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
}

function RelatedCard({ product }) {
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0
  return (
    <Link to={`/product/${product.id}`}
      className="group rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-md transition-all bg-white flex flex-col">
      <div className="relative overflow-hidden bg-gray-50">
        {product.image_url
          ? <img src={product.image_url} alt={product.name}
              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-36 flex items-center justify-center text-4xl">📦</div>
        }
        {discount > 0 && (
          <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full bg-red-500">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-700 leading-snug mb-1.5 flex-1">{product.name}</p>
        <div className="flex items-baseline gap-1.5">
          <p className="text-sm font-bold" style={{ color: GREEN }}>৳{Number(product.price).toLocaleString('bn-BD')}</p>
          {discount > 0 && <p className="text-xs text-gray-400 line-through">৳{Number(product.original_price).toLocaleString('bn-BD')}</p>}
        </div>
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
  const { addItem, isInCart } = useCart()
  const { user } = useAuth()
  const [activeImg, setActiveImg] = useState(0)
  const [imgZoom, setImgZoom] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const viewRecorded = useRef(false)

  useEffect(() => {
    if (product && !viewRecorded.current) {
      viewRecorded.current = true
      recordProductView(product.id, product.shop_id, user?.id || null)
    }
  }, [product, user])

  const inCart = product ? isInCart(product.id) : false

  function handleAddToCart() {
    addItem(product)
    toast.success('কার্টে যোগ হয়েছে! 🛒', {
      duration: 2000,
      style: { background: '#16a34a', color: '#fff', borderRadius: '12px' },
    })
  }

  /* Opens the in-page order modal (no redirect) — order logic unchanged */
  function goOrder() {
    setOrderOpen(true)
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) { try { await navigator.share({ title: product.name, url }) } catch {} }
    else { await navigator.clipboard.writeText(url); toast.success('লিংক কপি হয়েছে') }
  }

  /* ── Loading skeleton ── */
  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-4 w-24 mb-2" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )

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
  const relatedOthers = related.filter(p => p.id !== product.id).slice(0, 4)

  /* discount */
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : 0
  const savings = discount > 0 ? Number(product.original_price) - Number(product.price) : 0

  return (
    <div className="pb-36 md:pb-10 bg-white">
      <SEO
        title={product.name}
        description={product.description || `${product.name} — শিবের বাজারে পাওয়া যাচ্ছে। দাম ও বিস্তারিত দেখুন এবং সরাসরি অর্ডার করুন।`}
        image={product.image_url}
        url={`https://shiberbazar.vercel.app/product/${product.id}`}
      />

      {/* ── Back button ── */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          ফিরে যান
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-4">

        {/* ══════════════════════════════════════════
            MAIN PRODUCT SECTION
        ══════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* ─── Left: Image gallery ─── */}
            <div className="p-4 sm:p-6 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-gray-100">
              {/* Main image */}
              <div className="relative cursor-zoom-in rounded-2xl overflow-hidden bg-gray-50"
                onClick={() => allImages.length > 0 && setImgZoom(true)}>
                {mainImage
                  ? <img src={mainImage} alt={product.name} key={mainImage}
                      className="w-full h-64 sm:h-80 md:h-96 object-contain p-4" />
                  : <div className="w-full h-64 sm:h-80 md:h-96 flex items-center justify-center text-8xl">📦</div>
                }
                {discount > 0 && (
                  <span className="absolute top-3 left-3 text-sm font-bold text-white px-3 py-1 rounded-full bg-red-500">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImg === i ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-300 bg-gray-50'
                      }`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Share row */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-gray-400">শেয়ার করুন:</span>
                {[
                  { icon: '🔗', label: 'লিংক', action: handleShare },
                  {
                    icon: null, svg: <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
                    label: 'Facebook', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')
                  },
                  {
                    icon: null, svg: <svg className="w-4 h-4" fill="#25d366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
                    label: 'WhatsApp', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank')
                  },
                ].map((s, i) => (
                  <button key={i} onClick={s.action}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-sm">
                    {s.svg ?? s.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Right: Product info ─── */}
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              {/* Name */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>

              {/* Price */}
              <div className="py-3 px-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-baseline gap-3 flex-wrap">
                  {product.price && (
                    <p className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: BLUE }}>
                      ৳{Number(product.price).toLocaleString('bn-BD')}
                    </p>
                  )}
                  {discount > 0 && (
                    <>
                      <p className="text-base text-gray-400 line-through">
                        ৳{Number(product.original_price).toLocaleString('bn-BD')}
                      </p>
                      <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full bg-red-500">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs font-semibold mt-1 text-green-600">
                    🎉 আপনি ৳{savings.toLocaleString('bn-BD')} সাশ্রয় করছেন!
                  </p>
                )}
                {!product.price && (
                  <p className="text-sm text-gray-500 font-medium">দাম জানতে যোগাযোগ করুন</p>
                )}
              </div>

              {/* Stock */}
              {product.stock !== null && (
                <div className="flex items-center gap-2">
                  {product.stock > 0
                    ? <>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                        <span className="text-xs font-semibold text-green-700">স্টকে আছে ({product.stock}টি)</span>
                      </>
                    : <>
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                        <span className="text-xs font-semibold text-red-700">স্টক শেষ</span>
                      </>
                  }
                </div>
              )}

              {/* Action buttons — desktop only (mobile uses the sticky bottom bar) */}
              <div className="hidden md:flex flex-col gap-2.5 mt-1">
                {/* Primary CTA — Order */}
                <button
                  onClick={goOrder}
                  className="w-full h-13 font-bold rounded-2xl text-sm flex items-center justify-center gap-2.5 text-white shadow-md hover:shadow-lg hover:brightness-105 transition-all active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', minHeight: '52px' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  এখনই অর্ডার করুন
                </button>

                {/* Secondary row — WhatsApp + Cart */}
                <div className="flex gap-2.5">
                  {(shop?.whatsapp || shop?.phone) && (
                    <a href={whatsappUrl(shop.whatsapp || shop.phone, `আমি "${product.name}" অর্ডার করতে চাই।`)}
                      target="_blank" rel="noreferrer"
                      className="flex-1 h-11 font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 text-white hover:brightness-105 active:scale-[0.98] transition-all shadow-sm"
                      style={{ background: '#25d366' }}>
                      {WA_ICON}
                      WhatsApp
                    </a>
                  )}
                  <button onClick={handleAddToCart}
                    className={`flex-1 h-11 font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 border-2 transition-all active:scale-[0.98] ${
                      inCart
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-700'
                    }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {inCart ? 'কার্টে আছে ✓' : 'কার্টে যোগ'}
                  </button>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">বিবরণ</p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              )}

              {/* Features */}
              {product.features && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">বৈশিষ্ট্য</p>
                  <ul className="space-y-1.5">
                    {product.features.split('\n').filter(Boolean).map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] flex-shrink-0 mt-0.5"
                          style={{ background: GREEN }}>✓</span>
                        {line.trim()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RELATED PRODUCTS
        ══════════════════════════════════════════ */}
        {relatedOthers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">একই ধরনের পণ্য</h2>
              {shop && (
                <Link to={`/shop/${shop.slug || shop.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold hover:opacity-80 transition-opacity"
                  style={{ color: BLUE }}>
                  সব দেখুন
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px]"
                    style={{ background: BLUE }}>→</span>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedOthers.map(p => <RelatedCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SHOP FOOTER CARD
        ══════════════════════════════════════════ */}
        {shop && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Shop header strip */}
            <div className="h-12 w-full" style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6)' }} />
            <div className="px-5 pb-5 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-shrink-0">
                  {(shop.logo || shop.logo_url)
                    ? <img src={shop.logo || shop.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover border-4 border-white shadow-sm" />
                    : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-4 border-white shadow-sm" style={{ background: '#eff6ff' }}>🏪</div>
                  }
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{shop.shop_name}</p>
                  {shop.categories?.name && <p className="text-xs text-blue-600 font-medium mt-0.5">{shop.categories.name}</p>}
                  {shop.address && <p className="text-xs text-gray-400 truncate mt-0.5">📍 {shop.address}</p>}
                </div>
                <Link to={`/shop/${shop.slug || shop.id}`}
                  className="flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 active:scale-95"
                  style={{ background: BLUE }}>
                  দোকান →
                </Link>
              </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-gray-100 pt-4">
              {shop.phone && (
                <a href={`tel:${shop.phone}`}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: '#eff6ff' }}>📞</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400">প্রধান ফোন নম্বর</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{shop.phone}</p>
                  </div>
                </a>
              )}
              {(shop.whatsapp || shop.phone) && (
                <a href={whatsappUrl(shop.whatsapp || shop.phone)}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/40 transition-all">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                    <svg className="w-4 h-4" fill="#25d366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400">বিক্রয় ফোন নম্বর</p>
                    <p className="text-sm font-bold text-gray-800 truncate">+{String(shop.whatsapp || shop.phone).replace(/^\++/, '')}</p>
                  </div>
                </a>
              )}
              {shop.address && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: '#fef3c7' }}>📍</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400">ঠিকানা</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{shop.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

      </div>

      {/* ══════════════════════════════════════════
          MOBILE STICKY BOTTOM BAR
          Sits above the bottom navbar (60px)
      ══════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2.5 max-w-lg mx-auto">
          <button onClick={handleAddToCart} aria-label="কার্টে যোগ করুন"
            className={`w-12 h-12 flex-shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${
              inCart ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-600 text-blue-600 bg-white'
            }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          <button onClick={goOrder}
            className="flex-1 h-12 font-bold rounded-2xl text-sm flex items-center justify-center gap-1.5 text-white active:scale-95 transition-all"
            style={{ background: BLUE }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            অর্ডার করুন
          </button>
          {(shop?.whatsapp || shop?.phone) && (
            <a href={whatsappUrl(shop.whatsapp || shop.phone, `আমি "${product.name}" অর্ডার করতে চাই।`)}
              target="_blank" rel="noreferrer"
              className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all"
              style={{ background: '#25d366' }}>
              {WA_ICON}
            </a>
          )}
        </div>
      </div>

      {/* ══ ORDER MODAL (bottom sheet) ══ */}
      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        shop={shop}
        product={product}
      />

      {/* ── Image zoom modal ── */}
      {imgZoom && mainImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setImgZoom(false)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-bold" onClick={() => setImgZoom(false)}>×</button>
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
