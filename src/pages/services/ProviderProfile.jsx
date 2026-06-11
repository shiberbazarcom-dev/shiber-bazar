/**
 * ProviderProfile.jsx
 * Public professional profile page for a service provider.
 * Shows all their approved listings + contact info, professionally styled.
 */
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

/* Skeleton loader */
function ProfileSkeleton() {
  return (
    <div className="container-app max-w-2xl mx-auto py-6 animate-pulse">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="h-28 bg-blue-100" />
        <div className="flex flex-col items-center -mt-12 pb-5 px-5 gap-3">
          <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white" />
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-4 bg-gray-100 rounded w-28" />
        </div>
      </div>
    </div>
  )
}

/* Single service mini-card within the profile */
function ServiceMiniCard({ service }) {
  const { id, name, description, location, extra = {}, is_verified, service_categories: cat } = service

  const whatsappUrl = `https://wa.me/88${service.phone.replace(/^0/, '')}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি শিবের বাজার থেকে আপনার "${name}" সেবা সম্পর্কে জানতে চাই।`
  )}`

  const extraEntries = Object.entries(extra || {}).filter(([, v]) => v)

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
      {/* Service title row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{cat?.icon || '🔧'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 text-sm leading-tight">{name}</h3>
          {cat && <p className="text-[11px] text-blue-600">{cat.name_bn}</p>}
        </div>
        {is_verified && (
          <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 flex-shrink-0">
            ✓ বিশ্বস্ত
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{description}</p>
      )}

      {/* Extra fields (inline chips) */}
      {extraEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {extraEntries.map(([key, val]) => {
            const meta = extraLabels[key] || { icon: '•', label: key }
            return (
              <span key={key} className="text-[11px] bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                {meta.icon} {val}
              </span>
            )
          })}
        </div>
      )}

      {/* Location */}
      {location && (
        <p className="text-[11px] text-gray-400 mb-3">📍 {location}</p>
      )}

      {/* Action row */}
      <div className="flex gap-2 items-center">
        <a
          href={`tel:${service.phone}`}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-xl text-white"
          style={{ background: BLUE }}
        >
          📞 কল করুন
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-xl text-white bg-green-500"
        >
          💬 WhatsApp
        </a>
        <Link
          to={`/services/detail/${id}`}
          className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
        >
          বিস্তারিত
        </Link>
      </div>
    </div>
  )
}

export default function ProviderProfile() {
  const { userId } = useParams()
  const { data: services = [], isLoading, isError } = useProviderProfile(userId)

  if (isLoading) return <ProfileSkeleton />

  if (isError || services.length === 0) {
    return (
      <div className="container-app py-16 text-center">
        <p className="text-5xl mb-4">😔</p>
        <p className="text-gray-600 font-semibold mb-4">প্রোফাইল পাওয়া যায়নি</p>
        <Link to="/services" className="text-blue-600 hover:underline text-sm">← সব সেবা দেখুন</Link>
      </div>
    )
  }

  // Use the first service for provider's main info
  const primary = services[0]
  const {
    name, phone, image_url, is_verified, location,
    description, service_categories: cat, extra = {},
  } = primary

  const whatsappUrl = `https://wa.me/88${phone.replace(/^0/, '')}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি শিবের বাজার থেকে আপনার সেবা সম্পর্কে জানতে চাই।`
  )}`

  // Collect all unique categories this provider works in
  const categories = [...new Map(services.map(s => [s.service_categories?.id, s.service_categories]).filter(([k]) => k)).values()]

  // Primary extra fields from first service
  const primaryExtra = Object.entries(extra || {}).filter(([, v]) => v)

  return (
    <div className="container-app max-w-2xl mx-auto py-6 pb-36 md:pb-10">
      <SEO
        title={`${name} — স্থানীয় সেবা প্রদানকারী`}
        description={description || `${name} — শিবের বাজারে ${cat?.name_bn || 'স্থানীয় সেবা'} প্রদান করেন।`}
        image={image_url}
      />

      {/* Back */}
      <Link to="/services" className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-5">
        ← সব সেবা
      </Link>

      {/* Profile Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {/* Gradient header */}
        <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #60a5fa 100%)' }}>
          {/* Category chips */}
          <div className="absolute bottom-3 left-4 flex flex-wrap gap-1.5">
            {categories.map(c => c && (
              <span key={c.id} className="text-[11px] bg-white/20 backdrop-blur-sm text-white font-medium px-2.5 py-0.5 rounded-full">
                {c.icon} {c.name_bn}
              </span>
            ))}
          </div>
        </div>

        {/* Avatar + name section */}
        <div className="flex items-end gap-4 px-5 -mt-12 mb-4">
          <div className="relative flex-shrink-0">
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
              <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow border-2 border-white">
                ✓
              </span>
            )}
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-800 leading-tight">{name}</h1>
            {is_verified && (
              <span className="text-xs font-medium text-green-700">✓ বিশ্বস্ত সেবা প্রদানকারী</span>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Bio / description */}
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
              {description}
            </p>
          )}

          {/* Professional details (extra fields) */}
          {primaryExtra.length > 0 && (
            <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {primaryExtra.map(([key, val]) => {
                const meta = extraLabels[key] || { icon: '•', label: key }
                return (
                  <div key={key} className="flex items-center gap-3 p-3 bg-white">
                    <span className="text-base w-6 text-center flex-shrink-0">{meta.icon}</span>
                    <div>
                      <p className="text-[11px] text-gray-400">{meta.label}</p>
                      <p className="text-sm font-medium text-gray-800">{val}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Location + phone */}
          <div className="grid grid-cols-2 gap-3">
            {location && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[11px] text-gray-400 mb-0.5">অবস্থান</p>
                <p className="text-sm font-medium text-gray-700">📍 {location}</p>
              </div>
            )}
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 mb-0.5">ফোন নম্বর</p>
              <p className="text-sm font-bold text-gray-800">📱 {phone}</p>
            </div>
          </div>

          {/* Number of services */}
          {services.length > 1 && (
            <p className="text-xs text-gray-400 text-center">
              এই প্রদানকারীর মোট {services.length}টি সেবা তালিকাভুক্ত
            </p>
          )}

          {/* Contact buttons */}
          <div className="hidden md:flex gap-2.5">
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl text-sm"
              style={{ background: BLUE }}
            >
              📞 এখনই কল করুন
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl text-sm bg-green-500"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* All services by this provider */}
      {services.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-3 px-1">
            🛠️ {services.length > 1 ? 'সকল সেবাসমূহ' : 'সেবা'}
          </h2>
          <div className="space-y-3">
            {services.map(s => (
              <ServiceMiniCard key={s.id} service={s} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky bottom CTA — mobile */}
      <div className="md:hidden fixed bottom-[60px] left-0 right-0 p-3 bg-white border-t border-gray-200 z-30 shadow-lg">
        <div className="flex gap-2">
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-white font-bold rounded-xl text-sm"
            style={{ background: BLUE }}
          >
            📞 কল করুন
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-white font-bold rounded-xl text-sm bg-green-500"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
