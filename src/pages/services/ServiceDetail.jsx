import { Link, useParams } from 'react-router-dom'
import { useServiceDetail } from '../../hooks/useServices'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'

const extraLabels = {
  subjects:     { label: 'বিষয়সমূহ',             icon: '📚' },
  classes:      { label: 'শ্রেণি',                 icon: '🎓' },
  education:    { label: 'শিক্ষাগত যোগ্যতা',      icon: '🎓' },
  speciality:   { label: 'বিশেষজ্ঞতা',            icon: '🩺' },
  chamber_time: { label: 'চেম্বারের সময়',          icon: '🕐' },
  vehicle_type: { label: 'গাড়ির ধরন',             icon: '🚗' },
  routes:       { label: 'রুট',                    icon: '🗺️' },
  blood_group:  { label: 'রক্তের গ্রুপ',           icon: '🩸' },
  rent_amount:  { label: 'ভাড়া (মাসিক)',           icon: '💰' },
  experience:   { label: 'অভিজ্ঞতা',               icon: '⭐' },
  available_time: { label: 'সময়সূচি',             icon: '📅' },
  service_area: { label: 'সেবা এলাকা',             icon: '📍' },
  fee:          { label: 'ফি / চার্জ',              icon: '💵' },
  qualification: { label: 'যোগ্যতা',               icon: '📋' },
}

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

  const extraEntries = Object.entries(extra || {}).filter(([, val]) => val)

  return (
    <div className="container-app py-6 pb-36 md:pb-10 max-w-2xl mx-auto">
      <SEO
        title={`${name} — ${cat?.name_bn || 'স্থানীয় সেবা'}`}
        description={description || `${name} — শিবের বাজারে ${cat?.name_bn || 'স্থানীয় সেবা'}`}
        image={image_url}
      />

      {/* Back */}
      <Link to={`/services/${cat?.slug || ''}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-5">
        ← {cat?.name_bn || 'সেবাসমূহ'}
      </Link>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header with gradient */}
        <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #60a5fa 100%)' }}>
          {/* Category badge */}
          {cat && (
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
              {cat.icon} {cat.name_bn}
            </div>
          )}
        </div>

        {/* Avatar — overlapping the gradient */}
        <div className="flex flex-col items-center -mt-12 pb-4 px-5">
          <div className="relative mb-3">
            {image_url ? (
              <img
                src={image_url}
                alt={name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-5xl"
                style={{ background: '#eff6ff' }}
              >
                {cat?.icon || '🔧'}
              </div>
            )}
            {is_verified && (
              <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow border-2 border-white"
                title="বিশ্বস্ত সেবা প্রদানকারী">
                ✓
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="text-xl font-bold text-gray-800 text-center leading-tight">{name}</h1>

          {/* Verified badge */}
          {is_verified && (
            <span className="mt-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-0.5">
              ✓ বিশ্বস্ত সেবা প্রদানকারী
            </span>
          )}

          {/* Location */}
          {location && (
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
              <span>📍</span> {location}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
            <span>👁️ {views || 0} বার দেখা হয়েছে</span>
            <span>📅 {new Date(created_at).toLocaleDateString('bn-BD')}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-5" />

        <div className="p-5 space-y-4">

          {/* Description */}
          {description && (
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">📝 পরিচিতি</h2>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
                {description}
              </p>
            </div>
          )}

          {/* Extra / specialty fields */}
          {extraEntries.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">ℹ️ বিস্তারিত তথ্য</h2>
              <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {extraEntries.map(([key, val]) => {
                  const meta = extraLabels[key] || { label: key, icon: '•' }
                  return (
                    <div key={key} className="flex items-start gap-3 p-3 bg-white hover:bg-gray-50 transition-colors">
                      <span className="text-base flex-shrink-0 w-6 text-center">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-400 block mb-0.5">{meta.label}</span>
                        <span className="text-sm text-gray-800 font-medium">{val}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Provider profile link */}
          {service.user_id && (
            <Link
              to={`/services/provider/${service.user_id}`}
              className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <span className="text-xl">👤</span>
              <div className="flex-1">
                <p className="text-xs text-purple-400">সেবা প্রদানকারী</p>
                <p className="text-sm font-semibold text-purple-700">সম্পূর্ণ প্রোফাইল দেখুন →</p>
              </div>
            </Link>
          )}

          {/* Phone number display */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">📞 যোগাযোগ</h2>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-xs text-gray-400">ফোন নম্বর</p>
                <p className="text-base font-bold text-gray-800">{phone}</p>
              </div>
            </div>
          </div>

          {/* CTA buttons — desktop */}
          <div className="hidden md:flex flex-col gap-2.5 pt-2">
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

      {/* Sticky bottom CTA — mobile only */}
      <div className="md:hidden fixed bottom-[60px] left-0 right-0 p-3 bg-white border-t border-gray-200 z-30 shadow-lg">
        <div className="flex gap-2">
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-white font-bold rounded-xl text-sm"
            style={{ background: BLUE }}>
            📞 কল করুন
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-white font-bold rounded-xl text-sm bg-green-500">
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
