import { Link, useParams } from 'react-router-dom'
import { useServiceDetail } from '../../hooks/useServices'
import SEO from '../../components/SEO'

const BLUE = 'var(--primary)'

const extraLabels = {
  subjects:       { label: 'বিষয়সমূহ',           icon: '📚' },
  classes:        { label: 'শ্রেণি',               icon: '🎓' },
  education:      { label: 'শিক্ষাগত যোগ্যতা',    icon: '🎓' },
  speciality:     { label: 'বিশেষজ্ঞতা',          icon: '🩺' },
  chamber_time:   { label: 'চেম্বারের সময়',        icon: '🕐' },
  vehicle_type:   { label: 'গাড়ির ধরন',           icon: '🚗' },
  routes:         { label: 'রুট',                  icon: '🗺️' },
  blood_group:    { label: 'রক্তের গ্রুপ',         icon: '🩸' },
  rent_amount:    { label: 'ভাড়া (মাসিক)',         icon: '💰' },
  experience:     { label: 'অভিজ্ঞতা',             icon: '⭐' },
  available_time: { label: 'সময়সূচি',             icon: '📅' },
  service_area:   { label: 'সেবা এলাকা',           icon: '📍' },
  fee:            { label: 'ফি / চার্জ',            icon: '💵' },
  qualification:  { label: 'যোগ্যতা',              icon: '📋' },
}

export default function ServiceDetail() {
  const { id } = useParams()
  const { data: service, isLoading, isError } = useServiceDetail(id)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !service) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-5xl mb-4">😔</p>
        <p className="text-gray-600 font-semibold mb-4 text-center">সেবাটি পাওয়া যায়নি</p>
        <Link to="/services" className="text-purple-600 hover:underline text-sm">← সব সেবা দেখুন</Link>
      </div>
    )
  }

  const {
    name, phone, description, location, image_url,
    is_verified, views, created_at, extra = {},
    service_categories: cat, user_id,
  } = service

  const waUrl = `https://wa.me/88${phone.replace(/^0/, '')}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি শিবের বাজার থেকে আপনার "${name}" সেবা সম্পর্কে জানতে চাই।`
  )}`

  const extraEntries = Object.entries(extra || {}).filter(([, val]) => val)

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${name} — ${cat?.name_bn || 'স্থানীয় সেবা'}`}
        description={description || `${name} — শিবের বাজারে ${cat?.name_bn || 'সেবা'}`}
        image={image_url}
      />

      {/* ── Top gradient ── */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #60a5fa 100%)' }} className="h-28 sm:h-36 relative">
        <div className="absolute top-4 left-4">
          <Link to={`/services/${cat?.slug || ''}`} className="flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors">
            ← <span className="text-xs">{cat?.name_bn || 'সেবাসমূহ'}</span>
          </Link>
        </div>
        {cat && (
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {cat.icon} {cat.name_bn}
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="max-w-lg mx-auto px-4 -mt-12 pb-32 sm:pb-10">

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          {/* Avatar */}
          <div className="flex flex-col items-center pt-3 pb-4 px-5">
            <div className="relative mb-3">
              {image_url ? (
                <img src={image_url} alt={name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-5xl" style={{ background: '#eff6ff' }}>
                  {cat?.icon || '🔧'}
                </div>
              )}
              {is_verified && (
                <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow border-2 border-white">✓</span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 text-center leading-tight">{name}</h1>
            {is_verified && (
              <span className="mt-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-0.5">✓ বিশ্বস্ত সেবা প্রদানকারী</span>
            )}
            {location && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">📍 {location}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
              <span>👁️ {views || 0} বার</span>
              <span>📅 {new Date(created_at).toLocaleDateString('bn-BD')}</span>
            </div>
          </div>

          {/* ── CTA inside card — mobile ── */}
          <div className="px-4 pb-4 flex gap-2.5">
            <a href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm active:opacity-80"
              style={{ background: BLUE }}>
              📞 {phone}
            </a>
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm bg-green-500 active:opacity-80">
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* ── Info sections ── */}
        <div className="space-y-3">

          {/* Description */}
          {description && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">📝 পরিচিতি</p>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </div>
          )}

          {/* Extra fields */}
          {extraEntries.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-4 pt-4 pb-2">ℹ️ বিস্তারিত তথ্য</p>
              <div className="divide-y divide-gray-50">
                {extraEntries.map(([key, val]) => {
                  const meta = extraLabels[key] || { icon: '•', label: key }
                  return (
                    <div key={key} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-lg w-6 text-center flex-shrink-0">{meta.icon}</span>
                      <div>
                        <p className="text-[11px] text-gray-400">{meta.label}</p>
                        <p className="text-sm font-semibold text-gray-800">{val}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Provider profile link */}
          {user_id && (
            <Link
              to={`/services/provider/${user_id}`}
              className="flex items-center gap-3 bg-white rounded-2xl border border-purple-100 p-4 hover:bg-purple-50 transition-colors active:opacity-80"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">👤</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-400">সেবা প্রদানকারীর</p>
                <p className="text-sm font-semibold text-purple-700">সম্পূর্ণ প্রোফাইল দেখুন →</p>
              </div>
            </Link>
          )}

        </div>
      </div>

      {/* ── Fixed bottom bar (always visible on mobile) ── */}
      <div className="sm:hidden fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30 shadow-lg">
        <div className="flex gap-2.5">
          <a href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-white font-bold rounded-xl text-sm"
            style={{ background: BLUE }}>
            📞 কল করুন
          </a>
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-white font-bold rounded-xl text-sm bg-green-500">
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
