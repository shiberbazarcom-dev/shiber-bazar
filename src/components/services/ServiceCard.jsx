import { useNavigate } from 'react-router-dom'

const BLUE = 'var(--primary)'

export default function ServiceCard({ service }) {
  const {
    id, name, phone, description, location,
    image_url, is_verified, service_categories: cat,
    extra = {}, user_id,
  } = service

  const navigate = useNavigate()

  const whatsappUrl = `https://wa.me/88${phone.replace(/^0/, '')}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি শিবের বাজার থেকে আপনার "${name}" সেবা সম্পর্কে জানতে চাই।`
  )}`

  const profilePath = user_id ? `/services/provider/${user_id}` : `/services/detail/${id}`

  const highlight = extra?.speciality || extra?.subjects || extra?.blood_group ||
    extra?.vehicle_type || extra?.rent_amount || null

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 overflow-hidden cursor-pointer select-none"
      onClick={() => navigate(profilePath)}
    >
      {/* Avatar */}
      <div className="flex flex-col items-center pt-4 pb-2 px-3">
        <div className="relative mb-2.5">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-100 shadow-sm"
            />
          ) : (
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-3xl sm:text-4xl border-2 border-gray-100 shadow-sm"
              style={{ background: '#eff6ff' }}
            >
              {cat?.icon || '🔧'}
            </div>
          )}
          {is_verified && (
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow border-2 border-white">
              ✓
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-gray-800 text-xs sm:text-sm leading-tight text-center line-clamp-1 w-full">{name}</h3>

        {/* Category */}
        {cat && (
          <span className="mt-0.5 text-[10px] sm:text-[11px] text-purple-600 font-medium text-center line-clamp-1">
            {cat.icon} {cat.name_bn}
          </span>
        )}

        {/* Verified */}
        {is_verified && (
          <span className="mt-1 text-[9px] sm:text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">
            ✓ বিশ্বস্ত
          </span>
        )}
      </div>

      <div className="h-px bg-gray-50 mx-3" />

      <div className="px-3 pb-3 pt-2.5">
        {/* Description */}
        {description && (
          <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 mb-1.5 text-center">{description}</p>
        )}

        {/* Highlight chip */}
        {highlight && (
          <p className="text-[10px] sm:text-xs text-center text-indigo-600 font-medium mb-1.5 bg-indigo-50 rounded-lg py-1 px-1.5 line-clamp-1">
            {highlight}
          </p>
        )}

        {/* Location */}
        {location && (
          <p className="text-[10px] sm:text-xs text-gray-400 mb-2.5 text-center line-clamp-1">📍 {location}</p>
        )}

        {/* Action buttons — stop propagation so card click doesn't fire */}
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl text-white active:opacity-80"
            style={{ background: BLUE }}
          >
            📞 <span className="hidden sm:inline">কল</span><span className="sm:hidden">Call</span>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl text-white bg-green-500 active:opacity-80"
          >
            💬 WA
          </a>
        </div>
      </div>
    </div>
  )
}
