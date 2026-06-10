import { Link } from 'react-router-dom'

export default function ShopCard({ shop }) {
  const fallbackImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=16a34a&color=fff&size=200&font-size=0.4`

  return (
    <Link to={`/shop/${shop.id}`} className="card block group">
      {/* Image */}
      <div className="h-40 overflow-hidden bg-gray-100">
        <img
          src={shop.image_url || fallbackImg}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = fallbackImg }}
        />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 text-lg leading-tight group-hover:text-primary-700 transition-colors">
            {shop.name}
          </h3>
          {shop.is_featured && (
            <span className="badge bg-yellow-100 text-yellow-700 shrink-0">⭐ বিশেষ</span>
          )}
        </div>

        {shop.categories?.name && (
          <span className="badge bg-primary-100 text-primary-700 mt-1">
            {shop.categories.icon} {shop.categories.name}
          </span>
        )}

        {shop.address && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
            <span>📍</span> {shop.address}
          </p>
        )}

        {shop.phone && (
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
            <span>📞</span> {shop.phone}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            🕐 {shop.opening_time} - {shop.closing_time}
          </span>
          <span className="text-primary-600 text-sm font-medium">বিস্তারিত →</span>
        </div>
      </div>
    </Link>
  )
}
