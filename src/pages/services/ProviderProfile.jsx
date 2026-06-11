import { Link, useParams } from 'react-router-dom'
import { useProviderProfile } from '../../hooks/useServices'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'
const BLUE_LIGHT = '#EFF6FF'

const extraLabels = {
  subjects:       { label: 'বিষয়সমূহ',         icon: '📚' },
  classes:        { label: 'শ্রেণি',             icon: '🎓' },
  education:      { label: 'শিক্ষাগত যোগ্যতা',  icon: '🎓' },
  speciality:     { label: 'বিশেষজ্ঞতা',        icon: '🩺' },
  chamber_time:   { label: 'চেম্বারের সময়',      icon: '🕐' },
  vehicle_type:   { label: 'গাড়ির ধরন',         icon: '🚗' },
  routes:         { label: 'রুট / এলাকা',        icon: '🗺️' },
  blood_group:    { label: 'রক্তের গ্রুপ',       icon: '🩸' },
  rent_amount:    { label: 'ভাড়া (মাসিক)',       icon: '💰' },
  experience:     { label: 'অভিজ্ঞতা',           icon: '⭐' },
  available_time: { label: 'সময়সূচি',           icon: '📅' },
  service_area:   { label: 'সেবা এলাকা',         icon: '📍' },
  fee:            { label: 'ফি / চার্জ',          icon: '💵' },
  qualification:  { label: 'যোগ্যতা',            icon: '📋' },
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-6">
        <div className="max-w-3xl mx-auto flex gap-4 items-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-40" />
            <div className="h-3 bg-gray-100 rounded w-24" />
            <div className="h-3 bg-gray-100 rounded w-32" />
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 space-y-3">
            <div className="h-4 bg-gray-100 rounded w-28" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm flex-shrink-0 mt-0.5 w-5 text-center">{icon}</span>
      <div>
        <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-gray-50">
        <span>{icon}</span>
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function ProviderProfile() {
  const { userId } = useParams()
  const { data: services = [], isLoading, isError } = useProviderProfile(userId)

  if (isLoading) return <Skeleton />

  if (isError || services.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="text-6xl mb-4">😔</div>
        <p className="text-gray-700 font-semibold mb-2">প্রোফাইল পাওয়া যায়নি</p>
        <Link to="/services" className="text-sm text-blue-600 hover:underline mt-1">← সব সেবা</Link>
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

  const extraEntries = Object.entries(extra || {}).filter(([, v]) => v)
  const gallery = [...new Set(services.map(s => s.image_url).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${name} — ${categories.map(c => c?.name_bn).join(', ')} | শিবের বাজার`}
        description={description || `${name} — শিবের বাজারে ${categories.map(c => c?.name_bn).join(', ')} সেবা প্রদান করেন।`}
        image={image_url}
      />

      {/* ── Top nav ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <Link to="/services" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors">
            ← সব সেবা
          </Link>
        </div>
      </div>

      {/* ── Profile header ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-4 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {image_url ? (
                <img
                  src={image_url}
                  alt={name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                />
              ) : (
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-4xl border-2 border-gray-100 shadow-sm"
                  style={{ background: BLUE_LIGHT }}
                >
                  {cat?.icon || '🔧'}
                </div>
              )}
              {is_verified && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow"
                  title="বিশ্বস্ত"
                >✓</span>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{name}</h1>

              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {categories.map(c => c && (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: BLUE_LIGHT, color: BLUE }}
                  >
                    {c.icon} {c.name_bn}
                  </span>
                ))}
              </div>

              {is_verified && (
                <p className="text-xs text-green-600 font-medium mt-1.5">✓ বিশ্বস্ত সেবা প্রদানকারী</p>
              )}

              {location && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  📍 {location}
                </p>
              )}
            </div>

            {/* Desktop action buttons — top right */}
            <div className="hidden sm:flex flex-col gap-2 flex-shrink-0 min-w-[160px]">
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-center gap-2 py-2.5 px-5 text-white font-bold rounded-xl text-sm shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: BLUE }}
              >
                📞 কল করুন
              </a>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-5 text-white font-bold rounded-xl text-sm bg-green-500 shadow-sm hover:opacity-90 transition-opacity"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-3xl mx-auto px-4 py-4 pb-32 sm:pb-8 space-y-3">

        {/* পরিচিতি */}
        {(description || extraEntries.length > 0) && (
          <Card title="পরিচিতি" icon="👤">
            {description && (
              <p className="px-5 py-4 text-sm text-gray-600 leading-relaxed border-b border-gray-50 last:border-0">
                {description}
              </p>
            )}
            {extraEntries.map(([key, val]) => {
              const meta = extraLabels[key] || { icon: '•', label: key }
              return <InfoRow key={key} icon={meta.icon} label={meta.label} value={val} />
            })}
          </Card>
        )}

        {/* যোগাযোগ */}
        <Card title="যোগাযোগ" icon="📞">
          <InfoRow icon="📱" label="ফোন নম্বর" value={phone} />
          <InfoRow icon="💬" label="WhatsApp" value={phone} />
          {location && <InfoRow icon="📍" label="অবস্থান" value={location} />}
        </Card>

        {/* Gallery */}
        {gallery.length > 1 && (
          <Card title="ছবি" icon="🖼️">
            <div className="flex gap-2.5 overflow-x-auto px-5 py-4 scrollbar-hide">
              {gallery.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${name} — ছবি ${i + 1}`}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                  loading="lazy"
                />
              ))}
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-gray-400 py-2">
          শিবের বাজারে তালিকাভুক্ত সেবা প্রদানকারী
        </p>
      </div>

      {/* ── Fixed bottom bar — mobile only ── */}
      <div className="sm:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.07)]">
        <div className="flex gap-3">
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-2xl text-sm active:opacity-80"
            style={{ background: BLUE }}
          >
            📞 কল করুন
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-2xl text-sm bg-green-500 active:opacity-80"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
