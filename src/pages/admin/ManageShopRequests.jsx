import { useState } from 'react'
import { useAllShopRequests, useUpdateShopRequest } from '../../hooks/useShopRequests'
import { useAdminWhatsapp } from '../../hooks/useSettings'
import { whatsappUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

const STATUS_LABEL = {
  pending:  { label: 'অপেক্ষমান',  bg: 'bg-amber-100',  text: 'text-amber-700',  dot: '🟡' },
  approved: { label: 'অনুমোদিত',  bg: 'bg-green-100',  text: 'text-green-700',  dot: '🟢' },
  rejected: { label: 'প্রত্যাখ্যাত', bg: 'bg-red-100',    text: 'text-red-700',    dot: '🔴' },
}

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || STATUS_LABEL.pending
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      {s.dot} {s.label}
    </span>
  )
}

/* ── Detail / action modal ── */
function RequestModal({ req, onClose }) {
  const updateRequest = useUpdateShopRequest()
  const adminPhone    = useAdminWhatsapp()
  const [adminNote, setAdminNote] = useState(req.admin_note || '')
  const [acting, setActing] = useState(false)

  const handle = async (status) => {
    setActing(true)
    try {
      await updateRequest.mutateAsync({
        id:         req.id,
        user_id:    req.user_id,
        status,
        admin_note: adminNote,
      })
      toast.success(status === 'approved' ? 'অনুমোদিত হয়েছে! ব্যবহারকারী এখন Shop Owner।' : 'প্রত্যাখ্যাত হয়েছে।')
      onClose()
    } catch (err) {
      toast.error('কিছু সমস্যা হয়েছে: ' + (err.message || ''))
    } finally {
      setActing(false)
    }
  }

  const contactOnWhatsApp = () => {
    const phone = req.phone.replace(/\D/g, '')
    const msg = `আসসালামু আলাইকুম ${req.full_name} ভাই/আপু, শিবের বাজারে আপনার দোকান খোলার আবেদন সম্পর্কে যোগাযোগ করছি।`
    window.open(`https://wa.me/88${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">আবেদনের বিস্তারিত</h2>
            <StatusBadge status={req.status} />
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Info rows */}
          {[
            ['পূর্ণ নাম',    req.full_name],
            ['মোবাইল',      req.phone],
            ['ব্যবসার ধরন', req.business_type],
            ['দোকানের নাম', req.shop_name || '—'],
            ['এলাকা',       req.location],
            ['অতিরিক্ত',   req.notes || '—'],
            ['আবেদনের তারিখ', new Date(req.created_at).toLocaleDateString('bn-BD')],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <span className="text-sm text-gray-400 w-28 flex-shrink-0">{label}</span>
              <span className="text-sm font-medium text-gray-700 flex-1">{value}</span>
            </div>
          ))}

          {/* User email */}
          {req.profiles?.email && (
            <div className="flex gap-3">
              <span className="text-sm text-gray-400 w-28 flex-shrink-0">ইমেইল</span>
              <span className="text-sm font-medium text-gray-700 flex-1">{req.profiles.email}</span>
            </div>
          )}

          {/* Contact button */}
          <button
            onClick={contactOnWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: '#25D366' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp-এ যোগাযোগ করুন
          </button>

          {/* Admin note */}
          {req.status === 'pending' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">অ্যাডমিন নোট (ঐচ্ছিক)</label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                placeholder="প্রত্যাখ্যানের কারণ বা যেকোনো নোট..."
              />
            </div>
          )}

          {/* Action buttons */}
          {req.status === 'pending' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handle('rejected')}
                disabled={acting}
                className="py-3 rounded-xl font-bold text-sm border-2 border-red-500 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60">
                ❌ প্রত্যাখ্যান
              </button>
              <button
                onClick={() => handle('approved')}
                disabled={acting}
                className="py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60">
                ✅ অনুমোদন
              </button>
            </div>
          )}

          {req.status !== 'pending' && req.admin_note && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">অ্যাডমিন নোট</p>
              <p className="text-sm text-gray-700">{req.admin_note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main admin page ── */
export default function ManageShopRequests() {
  const [filter, setFilter]     = useState('pending')
  const [selected, setSelected] = useState(null)
  const { data: requests = [], isLoading } = useAllShopRequests(filter)

  const filterTabs = [
    { key: 'all',      label: 'সব' },
    { key: 'pending',  label: '🟡 অপেক্ষমান' },
    { key: 'approved', label: '🟢 অনুমোদিত' },
    { key: 'rejected', label: '🔴 প্রত্যাখ্যাত' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">দোকান খোলার আবেদন</h1>
        <p className="text-gray-400 text-sm mt-1">
          ব্যবহারকারীদের দোকান খোলার অনুরোধ পর্যালোচনা করুন
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 text-sm">কোনো আবেদন নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req.id}
              onClick={() => setSelected(req)}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600 flex-shrink-0">
                    {req.full_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{req.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{req.phone}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.business_type}
                      {req.shop_name ? ` · ${req.shop_name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <StatusBadge status={req.status} />
                  <span className="text-xs text-gray-400">
                    {new Date(req.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">📍 {req.location}</span>
                <span className="text-xs text-blue-600 font-semibold">বিস্তারিত দেখুন →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <RequestModal req={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
