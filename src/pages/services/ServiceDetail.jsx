import { Link, useParams } from 'react-router-dom'
import { useServiceDetail } from '../../hooks/useServices'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'

export default function ServiceDetail() {
  const { id } = useParams()
  const { data: service, isLoading, isError } = useServiceDetail(id)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !service) {
    return (
      <div className="container-app py-16 text-center">
        <p className="text-5xl mb-4">😔</p>
        <p className="text-gray-600 font-semibold mb-4">সেবাটি পাওয়া যায়নি</p>
        <Link to="/services" className="text-blue-600 hover:underline text-sm">← সব সেবা দেখুন</Link>
      </div>
    )
  }

  const {
    name, phone, description, location, image_url,
    is_verified, views, created_at, extra = {},
    service_categories: cat,
  } = service

  const whatsappUrl = `https://wa.me/88${phone.replace(/^0/, '')}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি শিবের বাজার থেকে আপনার "${name}" সেবা সম্পর্কে জানতে চাই।`
  )}`

  const extraLabels = {
    subjects:     'বিষয়সমূহ',
    classes:      'শ্রেণি',
    education:    'শিক্ষাগত যোগ্যতা',
    speciality:   'বিশেষজ্ঞতা',
    chamber_time: 'চেম্বারের সময়',
    vehicle_type: 'গাড়ির ধরন',
    routes:       'রুট',
    blood_group:  'রক্তের গ্রুপ',
    rent_amount:  'ভাড়া (মাসিক)',
  }

  return (
    <div className="container-app py-6 pb-28 md:pb-10 max-w-2xl mx-auto">
      <SEO
        title={`${name} — ${cat?.name_bn || 'স্থানীয় সেবা'}`}
        description={description || `${name} — শিবের বাজারে ${cat?.name_bn || 'স্থানীয় সেবা'}`}
        image={image_url}
      />

      {/* Back */}
      <Link to={`/services/${cat?.slug || ''}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4">
        ← {cat?.name_bn || 'সেবাসমূহ'}
      </Link>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Photo */}
        {image_url ? (
          <img src={image_url} alt={name} className="w-full h-52 object-cover" />
        ) : (
          <div className="w-full h-32 flex items-center justify-center text-6xl"
            style={{ background: '#eff6ff' }}>
            {cat?.icon || '🔧'}
          </div>
        )}

        <div className="p-5">
          {/* Name + badges */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800 leading-tight">{name}</h1>
              {cat && (
                <p className="text-sm text-blue-600 font-medium mt-0.5">{cat.icon} {cat.name_bn}</p>
              )}
            </div>
            {is_verified && (
              <span className="flex-shrink-0 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                ✓ বিশ্বস্ত সেবা প্রদানকারী
              </span>
            )}
          </div>

          {/* Location */}
          {location && (
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
              <span>📍</span> {location}
            </p>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 bg-gray-50 rounded-xl p-3">
              {description}
            </p>
          )}

          {/* Extra fields */}
          {Object.keys(extra).length > 0 && (
            <div className="mb-4 space-y-2">
              {Object.entries(extra).map(([key, val]) => val ? (
                <div key={key} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 w-32 flex-shrink-0">{extraLabels[key] || key}:</span>
                  <span className="text-gray-700 font-medium">{val}</span>
                </div>
              ) : null)}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
            <span>👁️ {views} বার দেখা হয়েছে</span>
            <span>📅 {new Date(created_at).toLocaleDateString('bn-BD')}</span>
          </div>

          {/* CTA buttons */}
          <div className="space-y-2.5">
            <a
              href={`tel:${phone}`}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl text-sm transition-opacity active:opacity-80"
              style={{ background: BLUE }}>
              📞 এখনই কল করুন — {phone}
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl text-sm bg-green-500 transition-opacity active:opacity-80">
              💬 WhatsApp-এ মেসেজ দিন
            </a>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA — mobile */}
      <div className="md:hidden fixed bottom-[60px] left-0 right-0 p-3 bg-white border-t border-gray-200 z-30">
        <div className="flex gap-2">
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-white font-bold rounded-xl text-sm"
            style={{ background: BLUE }}>
            📞 কল করুন
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-white font-bold rounded-xl text-sm bg-green-500">
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
