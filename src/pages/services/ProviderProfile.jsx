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
  routes:         { label: 'রুট',                icon: '🗺️' },
  blood_group:    { label: 'রক্তের গ্রুপ',       icon: '🩸' },
  rent_amount:    { label: 'ভাড়া (মাসিক)',       icon: '💰' },
  experience:     { label: 'অভিজ্ঞতা',           icon: '⭐' },
  available_time: { label: 'সময়সূচি',           icon: '📅' },
  service_area:   { label: 'সেবা এলাকা',         icon: '📍' },
  fee:            { label: 'ফি / চার্জ',          icon: '💵' },
  qualification:  { label: 'যোগ্যতা',            icon: '📋' },
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-5 flex gap-4 items-center">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-36" />
          <div className="h-4 bg-gray-100 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-28" />
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Section card wrapper ── */
function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-50">
        <span className="text-base">{icon}</span>
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  )
}

/* ── Info row ── */
function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-base flex-shrink-0 mt-0.5 w-5 text-center">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-gray-50">
        <div className="text-6xl mb-4">😔</div>
        <p className="text-gray-700 font-semibold mb-2 text-center">প্রোফাইল পাওয়া যায়নি</p>
        <p className="text-sm text-gray-400 mb-5 text-center">এই সেবা প্রদানকারীর কোনো অনুমোদিত সেবা নেই</p>
        <Link to="/services" className="text-sm font-medium text-blue-600 hover:underline">← সব সেবা দেখুন</Link>
      </div>
    )
  }

  /* Use first service as the primary profile source */
  const primary = services[0]
  const { name, phone, image_url, is_verified, location, description, service_categories: cat, extra = {} } = primary

  const waUrl = `https://wa.me/88${phone.replace(/^0/, '')}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি শিবের বাজার থেকে আপনার সেবা সম্পর্কে জানতে চাই।`
  )}`

  /* Unique categories */
  const categories = [...new Map(
    services.map(s => [s.service_categories?.id, s.service_categories]).filter(([k]) => k)
  ).values()]

  const primaryExtra = Object.entries(extra || {}).filter(([, v]) => v)

  /* Collect all images from services */
  const gallery = services.map(s => s.image_url).filter(Boolean)
  const uniqueGallery = [...new Set(gallery)]

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${name} — সেবা প্রোফাইল | শিবের বাজার`}
        description={description || `${name} — শিবের বাজারে ${categories.map(c=>c?.name_bn).join(', ')} সেবা প্রদান করেন।`}
        image={image_url}
      />

      {/* ══════════════════════════════════════════
          PROFILE CARD — compact, no banner overlap
      ══════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-5">
        {/* Back nav */}
        <Link to="/services" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 mb-4 transition-colors">
          ← সব সেবা
        </Link>

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
                title="বিশ্বস্ত সেবা প্রদানকারী"
              >✓</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{name}</h1>

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {categories.map(c => c && (
                <span key={c.id} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: BLUE_LIGHT, color: BLUE }}>
                  {c.icon} {c.name_bn}
                </span>
              ))}
            </div>

            {/* Verified */}
            {is_verified && (
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[11px] font-medium text-green-700">✓ বিশ্বস্ত সেবা প্রদানকারী</span>
              </div>
            )}

            {/* Location */}
            {location && (
              <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <span>📍</span>
                <span className="truncate">{location}</span>
              </p>
            )}

            {/* Service count */}
            {services.length > 1 && (
              <p className="text-xs text-gray-400 mt-1">{services.length}টি সেবা তালিকাভুক্ত</p>
            )}
          </div>
        </div>

        {/* Quick action row — inline (desktop) */}
        <div className="hidden sm:flex gap-3 mt-5">
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: BLUE }}
          >
            📞 কল করুন
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm bg-green-500 shadow-sm hover:opacity-90 transition-opacity"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CONTENT SECTIONS
      ══════════════════════════════════════════ */}
      <div className="px-4 py-4 pb-32 sm:pb-6 max-w-2xl mx-auto space-y-3">

        {/* ── পরিচিতি ── */}
        {(description || primaryExtra.length > 0) && (
          <Section title="পরিচিতি" icon="👤">
            {description && (
              <p className="px-4 py-3 text-sm text-gray-600 leading-relaxed border-b border-gray-50">
                {description}
              </p>
            )}
            {primaryExtra.map(([key, val]) => {
              const meta = extraLabels[key] || { icon: '•', label: key }
              return <InfoRow key={key} icon={meta.icon} label={meta.label} value={val} />
            })}
          </Section>
        )}

        {/* ── সেবাসমূহ ── */}
        <Section title={`সেবাসমূহ${services.length > 1 ? ` (${services.length}টি)` : ''}`} icon="🛠️">
          <div className="divide-y divide-gray-50">
            {services.map((s) => {
              const sExtra = Object.entries(s.extra || {}).filter(([, v]) => v)
              return (
                <Link
                  key={s.id}
                  to={`/services/detail/${s.id}`}
                  className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  {/* Category icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
                    style={{ background: BLUE_LIGHT }}
                  >
                    {s.service_categories?.icon || '🔧'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                      {s.is_verified && (
                        <span className="flex-shrink-0 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">✓</span>
                      )}
                    </div>
                    {s.service_categories && (
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: BLUE }}>
                        {s.service_categories.name_bn}
                      </p>
                    )}
                    {s.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{s.description}</p>
                    )}
                    {/* Key extra detail */}
                    {sExtra.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {sExtra.slice(0, 2).map(([key, val]) => {
                          const meta = extraLabels[key] || { icon: '•' }
                          return (
                            <span key={key} className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                              {meta.icon} {val}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Chevron */}
                  <span className="text-gray-300 text-sm flex-shrink-0 mt-1">›</span>
                </Link>
              )
            })}
          </div>
        </Section>

        {/* ── যোগাযোগ ── */}
        <Section title="যোগাযোগ" icon="📞">
          <InfoRow icon="📱" label="ফোন নম্বর" value={phone} />
          <InfoRow icon="💬" label="WhatsApp" value={phone} />
          {location && <InfoRow icon="📍" label="অবস্থান" value={location} />}
        </Section>

        {/* ── Gallery (if multiple images) ── */}
        {uniqueGallery.length > 1 && (
          <Section title="ছবি" icon="🖼️">
            <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
              {uniqueGallery.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${name} — ছবি ${i + 1}`}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                  loading="lazy"
                />
              ))}
            </div>
          </Section>
        )}

        {/* ── Footer note ── */}
        <p className="text-center text-xs text-gray-400 pb-2">
          শিবের বাজারে তালিকাভুক্ত সেবা প্রদানকারী
        </p>
      </div>

      {/* ══════════════════════════════════════════
          STICKY BOTTOM ACTION BAR — mobile only
      ══════════════════════════════════════════ */}
      <div className="sm:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex gap-3">
          <a
            href={`tel:${phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-2xl text-sm active:opacity-80 transition-opacity"
            style={{ background: BLUE }}
          >
            📞 কল করুন
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-2xl text-sm bg-green-500 active:opacity-80 transition-opacity"
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
