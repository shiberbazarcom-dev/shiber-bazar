import { Link, useParams } from 'react-router-dom'
import { useProviderProfile } from '../../hooks/useServices'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'

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

/* Skeleton */
function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-28 bg-blue-200" />
      <div className="max-w-lg mx-auto px-4 -mt-12">
        <div className="bg-white rounded-2xl p-5 flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white" />
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-4 bg-gray-100 rounded w-28" />
        </div>
      </div>
    </div>
  )
}

/* Mini card for each service */
function ServiceMiniCard({ service }) {
  const { id, name, description, location, extra = {}, is_verified, service_categories: cat } = service
  const waUrl = `https://wa.me/88${service.phone.replace(/^0/, '')}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি শিবের বাজার থেকে আপনার "${name}" সেবা সম্পর্কে জানতে চাই।`
  )}`
  const extraEntries = Object.entries(extra || {}).filter(([, v]) => v)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Service header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{cat?.icon || '🔧'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-800 text-sm leading-tight">{name}</h3>
            {is_verified && (
              <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 flex-shrink-0">✓</span>
            )}
          </div>
          {cat && <p className="text-[11px] text-blue-600 mt-0.5">{cat.name_bn}</p>}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500 line-clamp-2 px-4 pb-2">{description}</p>
      )}

      {/* Extra chips */}
      {extraEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {extraEntries.map(([key, val]) => {
            const meta = extraLabels[key] || { icon: '•', label: key }
            return (
              <span key={key} className="text-[11px] bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 text-gray-600">
                {meta.icon} {val}
              </span>
            )
          })}
        </div>
      )}

      {/* Location */}
      {location && (
        <p className="text-[11px] text-gray-400 px-4 pb-3">📍 {location}</p>
      )}

      {/* Action bar */}
      <div className="flex gap-0 border-t border-gray-50">
        <a href={`tel:${service.phone}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-white rounded-none rounded-bl-2xl"
          style={{ background: BLUE }}>
          📞 কল করুন
        </a>
        <div className="w-px bg-white/30" />
        <a href={waUrl} target="_blank" rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-white bg-green-500 rounded-none">
          💬 WhatsApp
        </a>
        <div className="w-px bg-white/30" />
        <Link to={`/services/detail/${id}`}
          className="flex-1 flex items-center justify-center py-3 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors rounded-none rounded-br-2xl">
          বিস্তারিত
        </Link>
      </div>
    </div>
  )
}

export default function ProviderProfile() {
  const { userId } = useParams()
  const { data: services = [], isLoading, isError } = useProviderProfile(userId)

  if (isLoading) return <Skeleton />

  if (isError || services.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-5xl mb-4">😔</p>
        <p className="text-gray-600 font-semibold mb-4 text-center">প্রোফাইল পাওয়া যায়নি</p>
        <Link to="/services" className="text-blue-600 hover:underline text-sm">← সব সেবা দেখুন</Link>
      </div>
    )
  }

  const primary = services[0]
  const { name, phone, image_url, is_verified, location, description, service_categories: cat, extra = {} } = primary

  const waUrl = `https://wa.me/88${phone.replace(/^0/, '')}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি শিবের বাজার থেকে আপনার সেবা সম্পর্কে জানতে চাই।`
  )}`

  const categories = [...new Map(
    services.map(s => [s.service_categories?.id, s.service_categories]).filter(([k]) => k)
  ).values()]

  const primaryExtra = Object.entries(extra || {}).filter(([, v]) => v)

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${name} — সেবা প্রোফাইল`}
        description={description || `${name} — শিবের বাজারে ${cat?.name_bn || 'স্থানীয় সেবা'} প্রদান করেন।`}
        image={image_url}
      />

      {/* ── Gradient header ── */}
      <div style={{ background: 'linear-gradient(135deg, #2563EB 0%, #60a5fa 100%)' }} className="h-28 sm:h-36 relative">
        <div className="absolute top-4 left-4">
          <Link to="/services" className="text-white/80 hover:text-white text-sm transition-colors">← সব সেবা</Link>
        </div>
        {/* Category chips in header */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 max-w-[75%]">
          {categories.slice(0, 3).map(c => c && (
            <span key={c.id} className="text-[11px] bg-white/20 text-white font-medium px-2.5 py-0.5 rounded-full">
              {c.icon} {c.name_bn}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-12 pb-32 sm:pb-10">

        {/* ── Profile card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          {/* Avatar + name */}
          <div className="flex items-end gap-4 px-4 pt-3 pb-3">
            <div className="relative flex-shrink-0">
              {image_url ? (
                <img src={image_url} alt={name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-4xl" style={{ background: '#eff6ff' }}>
                  {cat?.icon || '🔧'}
                </div>
              )}
              {is_verified && (
                <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow border-2 border-white">✓</span>
              )}
            </div>
            <div className="pb-1 min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-800 leading-tight">{name}</h1>
              {is_verified && <p className="text-xs text-green-600 font-medium">✓ বিশ্বস্ত সেবা প্রদানকারী</p>}
              {location && <p className="text-xs text-gray-500 mt-0.5">📍 {location}</p>}
              {services.length > 1 && (
                <p className="text-xs text-gray-400 mt-0.5">{services.length}টি সেবা তালিকাভুক্ত</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {description && (
            <div className="px-4 pb-3">
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">{description}</p>
            </div>
          )}

          {/* Professional detail chips */}
          {primaryExtra.length > 0 && (
            <div className="px-4 pb-3">
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {primaryExtra.map(([key, val]) => {
                  const meta = extraLabels[key] || { icon: '•', label: key }
                  return (
                    <div key={key} className="flex items-center gap-3 p-3">
                      <span className="text-base w-6 text-center flex-shrink-0">{meta.icon}</span>
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

          {/* Contact buttons inside card */}
          <div className="flex gap-0 border-t border-gray-100">
            <a href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-bold text-sm rounded-bl-2xl"
              style={{ background: BLUE }}>
              📞 কল করুন
            </a>
            <div className="w-px bg-gray-100" />
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-bold text-sm bg-green-500 rounded-br-2xl">
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* ── All services ── */}
        {services.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">
              🛠️ {services.length > 1 ? `সকল সেবাসমূহ (${services.length}টি)` : 'সেবা'}
            </h2>
            <div className="space-y-3">
              {services.map(s => <ServiceMiniCard key={s.id} service={s} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed bottom bar (mobile) ── */}
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
