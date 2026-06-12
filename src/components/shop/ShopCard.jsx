import { useState } from 'react'
import { Link } from 'react-router-dom'
import OrderModal from '../order/OrderModal'

/* ── helpers ── */
function toWhatsApp(phone) {
  if (!phone) return null
  const digits = phone.replace(/[^0-9]/g, '')
  if (digits.startsWith('880')) return digits
  if (digits.startsWith('0'))   return '88' + digits
  return digits
}

/* ── ShopCard — Dokanlink-style ── */
export function ShopCard({ shop, featured = false, index = 0 }) {
  const coverUrl = shop.cover_image || shop.cover_image_url || null
  const logoUrl  = shop.logo || shop.logo_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent((shop.shop_name || 'দ')[0])}&size=80&background=2563EB&color=fff&bold=true`

  const phone   = shop.phone || shop.profiles?.phone || null
  const waNum   = toWhatsApp(phone)
  const shopUrl = `/shop/${shop.slug || shop.id}`
  const [orderOpen, setOrderOpen] = useState(false)

  // Prevent card navigation when tapping action buttons
  const stopProp = (e) => e.stopPropagation()

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* ── Cover image ── */}
      <Link to={shopUrl} className="block relative flex-shrink-0">
        <div className="relative h-44 sm:h-40 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={shop.shop_name}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          )}
          {/* bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Featured badge */}
        {featured && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1 rounded-full shadow-lg">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              ফিচার্ড
            </span>
          </div>
        )}

        {/* Verified badge (top-right) */}
        {shop.is_verified && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-green-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              ভেরিফাইড
            </span>
          </div>
        )}
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Logo + Name */}
        <Link to={shopUrl} className="flex items-center gap-3 group">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-blue-100 flex-shrink-0 bg-white">
            <img
              src={logoUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={e => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((shop.shop_name || 'দ')[0])}&size=80&background=2563EB&color=fff&bold=true`
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate group-hover:text-blue-600 transition-colors">
                {shop.shop_name}
              </h3>
              {shop.is_verified && (
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {shop.categories?.name && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                {shop.categories.icon && <span>{shop.categories.icon}</span>}
                <span className="truncate">{shop.categories.name}</span>
              </p>
            )}
            {shop.avg_rating > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-semibold text-gray-600">{Number(shop.avg_rating).toFixed(1)}</span>
                <span className="text-xs text-gray-400">({shop.review_count || 0})</span>
              </div>
            )}
          </div>
        </Link>

        {/* Description */}
        {shop.description && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
            {shop.description}
          </p>
        )}

        {/* Order + WhatsApp buttons */}
        <div className="flex gap-2">
            <button
              type="button"
              onClick={e => { stopProp(e); setOrderOpen(true) }}
              className="flex-1 flex items-center justify-center gap-1 h-9 px-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              অর্ডার করুন
            </button>
            {waNum && (
              <a
                href={`https://wa.me/${waNum}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stopProp}
                className="flex-1 flex items-center justify-center gap-1 h-9 px-2 border border-green-200 rounded-xl text-xs font-bold text-green-700 hover:bg-green-50 active:scale-95 transition-all whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </a>
            )}
          </div>

        {/* Address */}
        {shop.address && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{shop.address}</span>
          </div>
        )}

        {/* দোকান দেখুন CTA — pinned to bottom */}
        <Link
          to={shopUrl}
          className="mt-auto block w-full text-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
        >
          দোকান দেখুন &rarr;
        </Link>
      </div>

      {orderOpen && (
        <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} shop={shop} />
      )}
    </div>
  )
}

/* ── ShopListItem — Horizontal Compact Variant ── */
export function ShopListItem({ shop }) {
  const logoUrl = shop.logo || shop.logo_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent((shop.shop_name || 'দ')[0])}&size=80&background=2563EB&color=fff&bold=true`

  return (
    <Link
      to={`/shop/${shop.slug || shop.id}`}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all group"
    >
      <div className="relative flex-shrink-0">
        <img
          src={logoUrl}
          alt=""
          className="w-14 h-14 rounded-xl object-cover"
          onError={e => { e.target.src = logoUrl }}
        />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-brand-600 transition-colors">
          {shop.shop_name}
        </h3>
        {shop.categories?.name && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span>{shop.categories.icon}</span>
            <span>{shop.categories.name}</span>
          </p>
        )}
        {shop.address && (
          <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {shop.address}
          </p>
        )}
      </div>

      {shop.avg_rating > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1 text-xs bg-amber-50 px-2 py-1 rounded-full">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-semibold">{Number(shop.avg_rating).toFixed(1)}</span>
        </div>
      )}
    </Link>
  )
}

export default ShopCard
