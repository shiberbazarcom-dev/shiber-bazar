import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProduct, useShopProducts } from '../hooks/useProducts'
import { whatsappUrl } from '../lib/utils'

const GREEN  = '#16a34a'
const BLUE   = '#2563EB'

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: product, isLoading, error } = useProduct(id)
  const { data: related = [] } = useShopProducts(product?.shop_id)
  const [activeImg, setActiveImg] = useState(0)

  function goOrder() {
    const shop = product.shops
    const params = new URLSearchParams({
      shop: shop?.shop_name || '',
      product: product.name,
      ...(product.price ? { price: String(product.price) } : {}),
    })
    navigate(`/order/${shop?.id}?${params.toString()}`)
  }

  if (isLoading) return (
    <div className="container-app py-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <div className="space-y-4 py-2">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </div>
    </div>
  )

  if (error || !product) return (
    <div className="container-app py-20 text-center">
      <p className="text-5xl mb-4">📦</p>
      <p className="text-gray-500">পণ্য পাওয়া যায়নি</p>
      <Link to="/shops" className="mt-4 inline-block text-sm font-medium" style={{ color: BLUE }}>
        ← দোকান দেখুন
      </Link>
    </div>
  )

  const shop = product.shops
  const relatedOthers = related.filter(p => p.id !== product.id).slice(0, 4)

  // Build image list: combine image_url + images array, deduplicate
  const rawImgs = [
    product.image_url,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean)
  const allImages = [...new Set(rawImgs)]
  const mainImage = allImages[activeImg] ?? allImages[0] ?? null

  return (
    <div className="pb-10">
      {/* Breadcrumb */}
      <div className="container-app py-3 max-w-4xl mx-auto">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/" className="hover:text-blue-600 transition-colors">হোম</Link>
          <span>›</span>
          {shop && (
            <>
              <Link to={`/shop/${shop.slug || shop.id}`} className="hover:text-blue-600 transition-colors">
                {shop.shop_name}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-gray-600 truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="container-app max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Image gallery */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {/* Main image */}
            <div className="relative bg-gray-50">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  key={mainImage}
                  className="w-full h-72 sm:h-96 object-contain p-4"
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="w-full h-72 sm:h-96 flex items-center justify-center text-8xl bg-gray-50">📦</div>
              )}
            </div>

            {/* Thumbnails (only if multiple images) */}
            {allImages.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto border-t border-gray-100">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>

            <div className="flex items-baseline gap-3 mb-3">
              {product.price && (
                <p className="text-2xl font-bold" style={{ color: GREEN }}>
                  ৳{Number(product.price).toLocaleString('bn-BD')}
                </p>
              )}
              {product.original_price && product.original_price > product.price && (
                <p className="text-sm text-gray-400 line-through">
                  ৳{Number(product.original_price).toLocaleString('bn-BD')}
                </p>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{product.description}</p>
            )}

            {/* Features / Specifications */}
            {product.features && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">বৈশিষ্ট্য</p>
                <ul className="space-y-1">
                  {product.features.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{line.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Shop info */}
            {shop && (
              <Link to={`/shop/${shop.slug || shop.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-all mb-5 group">
                {(shop.logo || shop.logo_url)
                  ? <img src={shop.logo || shop.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: '#eff6ff' }}>🏪</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors truncate">{shop.shop_name}</p>
                  {shop.address && <p className="text-xs text-gray-400 truncate">📍 {shop.address}</p>}
                </div>
                <span className="text-xs text-blue-500">দোকান দেখুন →</span>
              </Link>
            )}

            <div className="mt-auto space-y-3">
              <button onClick={goOrder}
                className="w-full py-3 text-white font-bold rounded-xl text-base transition-opacity hover:opacity-90"
                style={{ background: GREEN }}>
                🛒 এখনই অর্ডার করুন
              </button>

              {(shop?.whatsapp || shop?.phone) && (
                <a href={whatsappUrl(
                    shop.whatsapp || shop.phone,
                    `"${product.name}" পণ্যটি অর্ডার করতে চাই${product.price ? ` — মূল্য ৳${product.price}` : ''}`
                  )}
                  target="_blank" rel="noreferrer"
                  className="w-full py-3 font-semibold rounded-xl text-base flex items-center justify-center gap-2 border-2 transition-colors hover:bg-green-50"
                  style={{ borderColor: GREEN, color: GREEN }}>
                  💬 WhatsApp-এ অর্ডার করুন
                </a>
              )}

              {shop?.phone && (
                <a href={`tel:${shop.phone}`}
                  className="w-full py-2.5 font-medium rounded-xl text-sm flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors">
                  📞 {shop.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Related products */}
        {relatedOthers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h2 className="font-bold text-gray-800 mb-4">এই দোকানের অন্য পণ্য</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedOthers.map(p => (
                <Link key={p.id} to={`/product/${p.id}`}
                  className="group rounded-xl border border-gray-100 overflow-hidden hover:border-blue-200 transition-all">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-full h-28 object-cover group-hover:scale-105 transition-transform" />
                    : <div className="w-full h-28 bg-gray-50 flex items-center justify-center text-3xl">📦</div>
                  }
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                    {p.price && (
                      <p className="text-xs font-bold mt-0.5" style={{ color: GREEN }}>৳{Number(p.price).toLocaleString('bn-BD')}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
