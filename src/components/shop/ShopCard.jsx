import { Link } from 'react-router-dom'

/* ── ShopCard — Modern Minimal Design ── */
export function ShopCard({ shop, featured = false, index = 0 }) {
  const coverUrl = shop.cover_image || shop.cover_image_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.shop_name)}&size=400&background=2563EB&color=fff&bold=true`

  const logoUrl = shop.logo || shop.logo_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent((shop.shop_name || 'দ')[0])}&size=80&background=2563EB&color=fff&bold=true`

  // Staggered animation delay based on index
  const animationDelay = index * 50

  return (
    <Link 
      to={`/shop/${shop.slug || shop.id}`} 
      className="group block"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-1 rounded-full shadow-lg">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              ফিচার্ড
            </span>
          </div>
        )}

        {/* Cover Image */}
        <div className="relative h-36 sm:h-40 overflow-hidden">
          <img
            src={coverUrl}
            alt={shop.shop_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={e => { 
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.shop_name)}&size=400&background=2563EB&color=fff` 
            }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="relative p-4">
          {/* Logo & Name Row */}
          <div className="flex items-start gap-3">
            <div className="relative -mt-10 flex-shrink-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-3 border-white shadow-lg bg-white">
                <img 
                  src={logoUrl} 
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = logoUrl }} 
                />
              </div>
              {/* Online Status Indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate group-hover:text-brand-600 transition-colors">
                {shop.shop_name}
              </h3>
              {shop.categories?.name && (
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <span>{shop.categories.icon}</span>
                  <span className="truncate">{shop.categories.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Info Row */}
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
            {shop.avg_rating > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-gray-700">{Number(shop.avg_rating).toFixed(1)}</span>
                <span className="text-gray-400">({shop.review_count || 0})</span>
              </div>
            )}
            {shop.address && (
              <div className="flex items-center gap-1 truncate">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{shop.address}</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:gap-2 transition-all">
              বিস্তারিত দেখুন
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
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
