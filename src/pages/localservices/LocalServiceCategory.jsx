import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useDirectoryCategory, useDirectoryEntries, entryMatches } from '../../hooks/useServiceDirectory'
import { whatsappUrl } from '../../lib/utils'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'
const PAGE_SIZE = 20

const WA_ICON = (
  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function Avatar({ entry, size = 'w-11 h-11' }) {
  return entry.photo_url
    ? <img src={entry.photo_url} alt="" loading="lazy"
        className={`${size} rounded-full object-cover flex-shrink-0 bg-gray-50 border border-gray-100`}
        onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling?.classList?.remove('hidden') }} />
    : <span className={`${size} rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center flex-shrink-0`}>
        {(entry.full_name || '?')[0]}
      </span>
}

function CallButton({ phone, big = false }) {
  if (!phone) return null
  return (
    <a href={`tel:${phone}`}
      className={`inline-flex items-center justify-center gap-1.5 font-bold text-white rounded-xl active:scale-95 transition-all ${
        big ? 'flex-1 h-11 text-sm' : 'px-4 h-10 text-xs'
      }`}
      style={{ background: BLUE }}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
      </svg>
      কল করুন
    </a>
  )
}

function WaButton({ phone, big = false }) {
  if (!phone) return null
  return (
    <a href={whatsappUrl(phone, 'আসসালামু আলাইকুম, শিবের বাজার সেবা ডিরেক্টরি থেকে যোগাযোগ করছি।')}
      target="_blank" rel="noreferrer"
      className={`inline-flex items-center justify-center gap-1.5 font-bold text-white rounded-xl active:scale-95 transition-all ${
        big ? 'flex-1 h-11 text-sm' : 'w-10 h-10'
      }`}
      style={{ background: '#25d366' }}>
      {WA_ICON}
      {big && 'WhatsApp'}
    </a>
  )
}

/* ═══════════════════════════════════════════════════════
   Category listing — table style (Google Sheets) or
   profile cards, based on category.display_type
═══════════════════════════════════════════════════════ */
export default function LocalServiceCategory() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: category, isLoading: catLoading } = useDirectoryCategory(slug)
  const { data: entries = [], isLoading } = useDirectoryEntries(category?.id)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => entries.filter(e => entryMatches(e, search)),
    [entries, search]
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const isProfile = category?.display_type === 'profile'

  if (catLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse space-y-3">
      <div className="h-6 bg-gray-100 rounded w-44" />
      <div className="h-12 bg-gray-100 rounded-xl" />
      {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
    </div>
  )

  if (!category) return (
    <div className="py-24 text-center px-4">
      <div className="text-5xl mb-3">📒</div>
      <p className="text-gray-600 font-bold mb-4">ক্যাটাগরি পাওয়া যায়নি</p>
      <Link to="/services" className="text-sm font-semibold" style={{ color: BLUE }}>← সব সেবা দেখুন</Link>
    </div>
  )

  return (
    <div className="bg-white min-h-screen">
      <SEO
        title={`${category.name_bn} — স্থানীয় সেবা`}
        description={`শিবের বাজারের ${category.name_bn} তালিকা — নাম, মোবাইল নম্বর ও ঠিকানা সহ। এক ক্লিকে কল করুন।`}
      />
      <div className="max-w-3xl mx-auto px-4 py-5 pb-24 md:pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">{category.icon}</span> {category.name_bn}
            <span className="text-xs font-bold text-gray-400">({filtered.length})</span>
          </h1>
        </div>

        {/* Search — name or phone */}
        <div className="relative mb-4">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full h-12 pl-11 pr-4 text-[15px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
          </svg>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-500 font-medium text-sm">
              {search ? `"${search}" পাওয়া যায়নি` : 'এখনো কোনো তথ্য যোগ করা হয়নি'}
            </p>
          </div>
        ) : isProfile ? (

          /* ══════════ PROFILE CARDS ══════════ */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visible.map(e => (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <Avatar entry={e} size="w-14 h-14" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-[15px] leading-tight flex items-center gap-1">
                      {e.full_name}
                      {e.is_verified && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </p>
                    {e.additional_info && (
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{e.additional_info}</p>
                    )}
                    {e.address && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {e.address}</p>
                    )}
                  </div>
                </div>
                {e.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mt-2.5 line-clamp-2">{e.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <CallButton phone={e.phone_number} big />
                  <WaButton phone={e.phone_number} big />
                </div>
              </div>
            ))}
          </div>

        ) : (
          <>
            {/* ══════════ TABLE STYLE — desktop ══════════ */}
            <div className="hidden sm:block rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-3 font-semibold w-14">ছবি</th>
                    <th className="px-3 py-3 font-semibold">নাম</th>
                    <th className="px-3 py-3 font-semibold">মোবাইল নম্বর</th>
                    <th className="px-3 py-3 font-semibold">ঠিকানা</th>
                    <th className="px-4 py-3 font-semibold text-right">যোগাযোগ</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(e => (
                    <tr key={e.id} className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-2.5"><Avatar entry={e} size="w-9 h-9" /></td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-gray-800">{e.full_name}</p>
                        {e.additional_info && <p className="text-[11px] text-gray-400">{e.additional_info}</p>}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">{e.phone_number}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[160px] truncate">{e.address}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5 justify-end">
                          <CallButton phone={e.phone_number} />
                          <WaButton phone={e.phone_number} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ══════════ TABLE STYLE — mobile cards ══════════ */}
            <div className="sm:hidden space-y-2.5">
              {visible.map(e => (
                <div key={e.id} className="rounded-2xl border border-gray-100 p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar entry={e} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-tight">{e.full_name}</p>
                      {e.additional_info && <p className="text-[11px] text-blue-600 font-medium mt-0.5">{e.additional_info}</p>}
                      <p className="text-xs text-gray-500 mt-0.5">📞 {e.phone_number}</p>
                      {e.address && <p className="text-xs text-gray-400 truncate mt-0.5">📍 {e.address}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <CallButton phone={e.phone_number} big />
                    <WaButton phone={e.phone_number} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════ PAGINATION ══════════ */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}
              className="px-4 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50 active:scale-95 transition-all">
              ← আগের
            </button>
            <span className="text-xs font-bold text-gray-500">পৃষ্ঠা {safePage} / {totalPages}</span>
            <button disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50 active:scale-95 transition-all">
              পরের →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
