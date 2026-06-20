import { useMemo } from 'react'
import { useDirectoryEntries, useDirectoryCategories } from '../hooks/useServiceDirectory'
import SEO from '../components/SEO'

const EMERGENCY_SLUG = 'emergency'

/* Priority label → color */
const CATEGORY_COLORS = {
  'অ্যাম্বুলেন্স':   { bg: 'bg-red-50',    border: 'border-red-200',    icon: '🚑', text: 'text-red-700'    },
  'হাসপাতাল':        { bg: 'bg-pink-50',   border: 'border-pink-200',   icon: '🏥', text: 'text-pink-700'   },
  'পুলিশ':           { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: '👮', text: 'text-blue-700'   },
  'ফায়ার সার্ভিস':  { bg: 'bg-orange-50', border: 'border-orange-200', icon: '🔥', text: 'text-orange-700'  },
  'বিদ্যুৎ অফিস':   { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '⚡', text: 'text-yellow-700'  },
  'গ্যাস অফিস':      { bg: 'bg-green-50',  border: 'border-green-200',  icon: '🔧', text: 'text-green-700'   },
}

function getStyle(name = '') {
  for (const [key, val] of Object.entries(CATEGORY_COLORS)) {
    if (name.includes(key)) return val
  }
  return { bg: 'bg-gray-50', border: 'border-gray-200', icon: '📞', text: 'text-gray-700' }
}

function ContactCard({ entry }) {
  const style = getStyle(entry.additional_info || entry.description || '')
  const phone = entry.phone_number
  const wa    = entry.whatsapp_number

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start gap-3">
        {entry.photo_url ? (
          <img src={entry.photo_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        ) : (
          <span className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 bg-white ${style.border} border`}>
            {style.icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${style.text}`}>{entry.full_name}</p>
          {entry.additional_info && (
            <p className="text-xs text-gray-500 mt-0.5">{entry.additional_info}</p>
          )}
          {entry.address && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {entry.address}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <a href={`tel:${phone}`}
          className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-white border border-current text-sm font-bold transition-all active:scale-95"
          style={{ color: '#DC2626' }}>
          📞 কল করুন
        </a>
        {wa && (
          <a href={`https://wa.me/${wa.replace(/\D/g, '')}`}
            target="_blank" rel="noopener noreferrer"
            className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl bg-green-500 text-white text-sm font-bold transition-all active:scale-95 hover:bg-green-600">
            💬
          </a>
        )}
      </div>
    </div>
  )
}

export default function EmergencyContacts() {
  const { data: categories = [] } = useDirectoryCategories()
  const emergencyCat = categories.find(c => c.slug === EMERGENCY_SLUG)
  const { data: entries = [], isLoading } = useDirectoryEntries(emergencyCat?.id)

  const featured = useMemo(() => entries.filter(e => e.is_featured), [entries])
  const rest     = useMemo(() => entries.filter(e => !e.is_featured), [entries])

  return (
    <>
      <SEO
        title="জরুরি নম্বরসমূহ"
        description="হাটখোলা ইউনিয়নের জরুরি যোগাযোগ নম্বর — অ্যাম্বুলেন্স, হাসপাতাল, পুলিশ, ফায়ার সার্ভিস, বিদ্যুৎ।"
      />

      <div className="container-app py-6 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl mx-auto mb-3">🆘</div>
          <h1 className="text-xl font-bold text-gray-900">জরুরি যোগাযোগ</h1>
          <p className="text-sm text-gray-500 mt-1">হাটখোলা ইউনিয়ন — এক ক্লিকে কল করুন</p>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📞</p>
            <p className="text-sm">তথ্য শীঘ্রই আসছে</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">⚡ অগ্রাধিকার নম্বর</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {featured.map(e => <ContactCard key={e.id} entry={e} />)}
                </div>
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <div>
                {featured.length > 0 && (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">অন্যান্য যোগাযোগ</p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {rest.map(e => <ContactCard key={e.id} entry={e} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          জাতীয় জরুরি সেবা: <a href="tel:999" className="font-bold text-red-500 hover:underline">999</a>
          &nbsp;•&nbsp;
          অ্যাম্বুলেন্স: <a href="tel:1994" className="font-bold text-red-500 hover:underline">1994</a>
        </p>
      </div>
    </>
  )
}
