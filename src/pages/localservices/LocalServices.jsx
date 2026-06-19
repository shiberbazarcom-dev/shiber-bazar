import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDirectoryCategories, useAllDirectoryEntries, entryMatches } from '../../hooks/useServiceDirectory'
import { whatsappUrl } from '../../lib/utils'
import SEO from '../../components/SEO'

const BLUE = '#2563EB'

const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'

/* ── এক সেবাদাতার কার্ড — কল + WhatsApp সহ ── */
function ProviderCard({ entry }) {
  const cat = entry.local_service_categories
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-3.5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        {entry.photo_url
          ? <img src={entry.photo_url} alt="" loading="lazy"
              className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-gray-50 border border-gray-100" />
          : <span className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center flex-shrink-0">
              {(entry.full_name || '?')[0]}
            </span>
        }
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-1">
            <span className="truncate">{entry.full_name}</span>
            {entry.is_verified && (
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            )}
          </p>
          {cat && (
            <p className="text-[11px] text-blue-600 font-medium mt-0.5 truncate">
              {cat.icon} {cat.name_bn}{entry.additional_info ? ` • ${entry.additional_info}` : ''}
            </p>
          )}
          {entry.address && <p className="text-xs text-gray-400 truncate mt-0.5">📍 {entry.address}</p>}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <a href={`tel:${entry.phone_number}`}
          className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white active:scale-95 transition-all"
          style={{ background: BLUE }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
          কল করুন
        </a>
        <a href={whatsappUrl(entry.phone_number, 'আসসালামু আলাইকুম, শিবের বাজার সেবা ডিরেক্টরি থেকে যোগাযোগ করছি।')}
          target="_blank" rel="noreferrer" aria-label="WhatsApp"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all flex-shrink-0"
          style={{ background: '#25d366' }}>
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d={WA_PATH}/></svg>
        </a>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   স্থানীয় সেবাসমূহ — এক পেইজে সব সেবাদাতা
   ক্যাটাগরি কার্ড = ফিল্টার (পেইজ বদলায় না), "সব" ডিফল্ট
═══════════════════════════════════════════════════════ */
export default function LocalServices() {
  const { data: categories = [], isLoading: catsLoading } = useDirectoryCategories()
  const { data: entries = [], isLoading } = useAllDirectoryEntries()

  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = entries
    if (activeCat !== 'all') list = list.filter(e => e.category_id === activeCat)
    if (search.trim()) list = list.filter(e => entryMatches(e, search))
    return list
  }, [entries, activeCat, search])

  const countFor = (catId) => entries.filter(e => e.category_id === catId).length

  return (
    <div className="bg-white min-h-screen">
      <SEO
        title="স্থানীয় সেবাসমূহ"
        description="শিবের বাজারের স্থানীয় সেবা ডিরেক্টরি — সিএনজি চালক, ডাক্তার, ইলেকট্রিশিয়ান, প্লাম্বার, রক্তদাতা, জরুরি নম্বর সহ প্রয়োজনীয় সব যোগাযোগ এক জায়গায়।"
      />
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-10">

        <div className="text-center mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">স্থানীয় সেবাসমূহ</h1>
          <p className="text-sm text-gray-400 mt-1.5">
            শিবের বাজারের প্রয়োজনীয় সেবা — এক ক্লিকে যোগাযোগ করুন
          </p>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
            className="w-full h-12 pl-11 pr-4 text-[15px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
          </svg>
        </div>

        {/* ── Category filter chips — "সব" first, no page change ── */}
        {catsLoading ? (
          <div className="flex gap-2 mb-5">
            {[1,2,3,4].map(i => <div key={i} className="h-9 w-24 rounded-full bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button onClick={() => setActiveCat('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeCat === 'all' ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeCat === 'all' ? { background: BLUE } : {}}>
              সব ({entries.length})
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(activeCat === cat.id ? 'all' : cat.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCat === cat.id ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={activeCat === cat.id ? { background: BLUE } : {}}>
                {cat.icon} {cat.name_bn} ({countFor(cat.id)})
              </button>
            ))}
          </div>
        )}

        {/* ── Providers list ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-500 font-medium text-sm">
              {search
                ? `"${search}" পাওয়া যায়নি`
                : entries.length === 0
                  ? 'এখনো কোনো সেবাদাতা যোগ করা হয়নি'
                  : 'এই ক্যাটাগরিতে এখনো কেউ নেই'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(e => <ProviderCard key={e.id} entry={e} />)}
          </div>
        )}

        {/* ── Submit your own service ── */}
        <Link to="/services/submit"
          className="mt-6 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-4 hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98] transition-all">
          <div>
            <p className="text-sm font-bold text-gray-800">➕ আপনার সেবা যোগ করুন</p>
            <p className="text-xs text-gray-400 mt-0.5">ইলেকট্রিশিয়ান, শিক্ষক, ড্রাইভার? বিনামূল্যে তালিকাভুক্ত হোন — অ্যাডমিন অনুমোদনের পর সবাই দেখবে</p>
          </div>
          <span className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: BLUE }}>→</span>
        </Link>
      </div>
    </div>
  )
}
