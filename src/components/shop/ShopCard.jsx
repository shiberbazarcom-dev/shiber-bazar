import { Link } from 'react-router-dom'

/* ── helpers ── */
function toWhatsApp(phone) {
  if (!phone) return null
  const digits = phone.replace(/[^0-9]/g, '')
  if (digits.startsWith('880')) return digits
  if (digits.startsWith('0'))   return '88' + digits
  return digits
}

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent((name || 'দ')[0])}&size=80&background=e0e7ff&color=3730a3&bold=true`
}

/* ── ShopCard — Clean minimal style ── */
export function ShopCard({ shop, featured = false, index = 0 }) {
  const coverUrl = shop.cover_image || shop.cover_image_url || null
  const logoUrl  = shop.logo || shop.logo_url || avatarUrl(shop.shop_name)
  const phone    = shop.phone || shop.profiles?.phone || null
  const waNum    = toWhatsApp(phone)
  const shopUrl  = `/shop/${shop.slug || shop.id}`

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow hover:shadow-lg transition-shadow duration-200 flex flex-col"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* ── Cover image ── */}
      <Link to={shopUrl} className="block relative flex-shrink-0">
        <div className="relative h-36 overflow-hidden bg-gray-100">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={shop.shop_name}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Featured badge */}
          {featured && (
            <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 text-[11px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">
              ⭐ ফিচার্ড
            </span>
          )}
        </div>

        {/* Logo — overlaps cover bottom */}
        <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex-shrink-0 z-10">
          <img
            src={logoUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={e => { e.target.src = avatarUrl(shop.shop_name) }}
          />
        </div>
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 pt-7 pb-3 px-4 gap-2">

        {/* Name + Verified */}
        <Link to={shopUrl} className="group">
          <div className="flex items-start gap-1.5 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
              {shop.shop_name}
            </h3>
            {shop.is_verified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full flex-shrink-0 mt-px">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                ভেরিফাইড
              </span>
            )}
          </div>
          {shop.categories?.name && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {shop.categories.icon && <span className="mr-0.5">{shop.categories.icon}</span>}
              {shop.categories.name}
            </p>
          )}
        </Link>

        {/* Description */}
        {shop.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {shop.description}
          </p>
        )}

        {/* Rating */}
        {shop.avg_rating > 0 && (
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className={`w-3 h-3 ${s <= Math.round(shop.avg_rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-[11px] text-gray-500 ml-0.5">{Number(shop.avg_rating).toFixed(1)} ({shop.review_count || 0})</span>
          </div>
        )}

        {/* Phone + WhatsApp — outlined, minimal */}
        <div className="flex gap-2 mt-auto pt-1">
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {phone.slice(0, 11)}
            </a>
          )}
          {waNum && (
            <a
              href={`https://wa.me/${waNum}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className={`${phone ? 'w-8 flex-shrink-0' : 'flex-1'} h-8 flex items-center justify-center gap-1.5 border border-green-200 rounded-lg text-[11px] font-medium text-green-700 hover:bg-green-50 transition-colors`}
            >
              <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              {!phone && <span>WhatsApp</span>}
            </a>
          )}
        </div>

        {/* Address */}
        {shop.address && (
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <svg className="w-3 h-3 flex-shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{shop.address}</span>
          </div>
        )}
      </div>

      {/* দোকান দেখুন — bottom border CTA */}
      <Link
        to={shopUrl}
        className="flex items-center justify-center gap-1.5 py-2.5 border-t border-gray-100 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors"
      >
        দোকান দেখুন
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

/* ── ShopListItem — Horizontal Compact Variant ── */
export function ShopListItem({ shop }) {
  const logoUrl = shop.logo || shop.logo_url || avatarUrl(shop.shop_name)

  return (
    <Link
      to={`/shop/${shop.slug || shop.id}`}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <div className="flex-shrink-0">
        <img
          src={logoUrl}
          alt=""
          className="w-12 h-12 rounded-xl object-cover"
          onError={e => { e.target.src = avatarUrl(shop.shop_name) }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
          {shop.shop_name}
        </h3>
        {shop.categories?.name && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span>{shop.categories.icon}</span>
            <span>{shop.categories.name}</span>
          </p>
        )}
        {shop.address && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            📍 {shop.address}
          </p>
        )}
      </div>

      {shop.avg_rating > 0 && (
        <div className="flex-shrink-0 flex items-center gap-0.5 text-xs text-gray-600">
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
