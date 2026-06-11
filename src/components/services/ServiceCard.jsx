import { Link } from 'react-router-dom'

const BLUE = '#2563EB'

export default function ServiceCard({ service }) {
  const {
    id, name, phone, description, location,
    image_url, is_verified, service_categories: cat,
  } = service

  const whatsappUrl = `https://wa.me/88${phone.replace(/^0/, '')}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি শিবের বাজার থেকে আপনার "${name}" সেবা সম্পর্কে জানতে চাই।`
  )}`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Photo */}
      {image_url ? (
        <img
          src={image_url}
          alt={name}
          className="w-full h-36 object-cover"
          onError={e => { e.target.style.display = 'none' }}
        />
      ) : (
        <div className="w-full h-20 flex items-center justify-center text-4xl"
          style={{ background: '#eff6ff' }}>
          {cat?.icon || '🔧'}
        </div>
      )}

      <div className="p-4">
        {/* Name + verified badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-800 text-sm leading-tight flex-1">{name}</h3>
          {is_verified && (
            <span className="flex-shrink-0 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 whitespace-nowrap">
              ✓ বিশ্বস্ত
            </span>
          )}
        </div>

        {/* Category */}
        {cat && (
          <p className="text-[11px] text-blue-600 font-medium mb-1.5">
            {cat.icon} {cat.name_bn}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{description}</p>
        )}

        {/* Location */}
        {location && (
          <p className="text-xs text-gray-400 mb-3">📍 {location}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
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

        {/* Details link */}
        <Link
          to={`/services/detail/${id}`}
          className="mt-2 block text-center text-xs text-blue-600 hover:underline"
        >
          বিস্তারিত দেখুন →
        </Link>
      </div>
    </div>
  )
}
