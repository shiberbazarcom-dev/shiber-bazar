import { Link, useNavigate } from 'react-router-dom'

const BLUE = '#2563EB'

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

  // Highlight one key extra field
  const highlight = extra?.speciality || extra?.subjects || extra?.blood_group ||
    extra?.vehicle_type || extra?.rent_amount || null

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer relative"
      onClick={() => navigate(profilePath)}
    >
      {/* ── Avatar section ── */}
      <div className="flex flex-col items-center pt-5 pb-3 px-4">
        <div className="relative mb-3">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 shadow"
              onError={e => { e.target.onerror = null; e.target.src = '' }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-2 border-gray-100 shadow"
              style={{ background: '#eff6ff' }}
            >
              {cat?.icon || '🔧'}
            </div>
          )}
          {is_verified && (
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow border-2 border-white"
              title="বিশ্বস্ত সেবা প্রদানকারী"
            >✓</span>
          )}
        </div>

        <h3 className="font-bold text-gray-800 text-sm leading-tight text-center">{name}</h3>

        {cat && (
          <span className="mt-1 text-[11px] text-blue-600 font-medium">{cat.icon} {cat.name_bn}</span>
        )}
        {is_verified && (
          <span className="mt-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            ✓ বিশ্বস্ত
          </span>
        )}
      </div>

      <div className="h-px bg-gray-50 mx-4" />

      <div className="p-4 pt-3">
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 text-center">{description}</p>
        )}
        {highlight && (
          <p className="text-xs text-center text-indigo-600 font-medium mb-2 bg-indigo-50 rounded-lg py-1 px-2">
            {highlight}
          </p>
        )}
        {location && (
          <p className="text-xs text-gray-400 mb-3 text-center">📍 {location}</p>
        )}

        {/* Buttons — relative z-10 so they're above the card click layer */}
        <div className="relative z-10 flex gap-2" onClick={e => e.stopPropagation()}>
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl text-white transition-opacity active:opacity-80"
            style={{ background: BLUE }}
          >
            📞 কল করুন
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl text-white bg-green-500 transition-opacity active:opacity-80"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
