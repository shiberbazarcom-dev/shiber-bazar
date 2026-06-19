import { useState } from 'react'
import { useAdminServices, useAdminUpdateService } from '../../hooks/useServices'
import toast from 'react-hot-toast'

const BLUE = 'var(--primary)'

const STATUS_TABS = [
  { key: 'pending',  label: '⏳ অনুমোদন বাকি' },
  { key: 'approved', label: '✅ অনুমোদিত'      },
  { key: 'rejected', label: '❌ প্রত্যাখ্যাত'   },
  { key: 'all',      label: '📋 সব'             },
]

const EXTRA_LABELS = {
  subjects:     'বিষয়',
  classes:      'শ্রেণি',
  education:    'শিক্ষাগত যোগ্যতা',
  speciality:   'বিশেষজ্ঞতা',
  chamber_time: 'চেম্বার সময়',
  vehicle_type: 'গাড়ির ধরন',
  routes:       'রুট',
  blood_group:  'রক্তের গ্রুপ',
  rent_amount:  'ভাড়া',
}

function DetailModal({ service, onClose, onAction }) {
  const update = useAdminUpdateService()
  const extra = service.extra || {}

  const act = async (action) => {
    try {
      if (action === 'approve')   await update.mutateAsync({ id: service.id, status: 'approved' })
      if (action === 'reject')    await update.mutateAsync({ id: service.id, status: 'rejected' })
      if (action === 'verify')    await update.mutateAsync({ id: service.id, is_verified: true })
      if (action === 'unverify')  await update.mutateAsync({ id: service.id, is_verified: false })
      toast.success('আপডেট হয়েছে')
      onAction()
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">সেবার বিবরণ</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          {service.image_url && (
            <img src={service.image_url} alt={service.name} className="w-full h-40 object-cover rounded-xl mb-4" />
          )}

          <div className="space-y-2 mb-4">
            <InfoRow label="নাম"        value={service.name} />
            <InfoRow label="মোবাইল"    value={<a href={`tel:${service.phone}`} className="text-purple-600">{service.phone}</a>} />
            <InfoRow label="ক্যাটাগরি" value={`${service.service_categories?.icon} ${service.service_categories?.name_bn}`} />
            {service.location    && <InfoRow label="এলাকা"      value={service.location} />}
            {service.description && <InfoRow label="বিবরণ"      value={service.description} />}
            {Object.entries(extra).map(([k, v]) => v ? (
              <InfoRow key={k} label={EXTRA_LABELS[k] || k} value={v} />
            ) : null)}
            <InfoRow label="ভিউ"        value={`${service.views} বার`} />
            <InfoRow label="স্ট্যাটাস" value={service.status} />
            <InfoRow label="বিশ্বস্ত"  value={service.is_verified ? 'হ্যাঁ ✓' : 'না'} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {service.status !== 'approved' && (
              <button onClick={() => act('approve')} disabled={update.isPending}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl bg-green-500 disabled:opacity-60">
                ✅ অনুমোদন করুন
              </button>
            )}
            {service.status !== 'rejected' && (
              <button onClick={() => act('reject')} disabled={update.isPending}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl bg-red-500 disabled:opacity-60">
                ❌ প্রত্যাখ্যান করুন
              </button>
            )}
            {service.status === 'approved' && !service.is_verified && (
              <button onClick={() => act('verify')} disabled={update.isPending}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl bg-purple-500 disabled:opacity-60">
                ✓ বিশ্বস্ত হিসেবে চিহ্নিত করুন
              </button>
            )}
            {service.is_verified && (
              <button onClick={() => act('unverify')} disabled={update.isPending}
                className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl bg-gray-500 disabled:opacity-60">
                বিশ্বস্ততা সরান
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 w-28 flex-shrink-0">{label}:</span>
      <span className="text-gray-700 font-medium flex-1">{value}</span>
    </div>
  )
}

export default function ManageServices() {
  const [activeTab, setActiveTab] = useState('pending')
  const [selected, setSelected] = useState(null)
  const { data: services = [], isLoading } = useAdminServices(activeTab)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🛠️ সেবা অনুমোদন</h1>
        <p className="text-sm text-gray-400 mt-0.5">স্থানীয় সেবার তালিকা অনুমোদন ও পরিচালনা করুন</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === tab.key
                ? 'text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={activeTab === tab.key ? { background: BLUE } : {}}>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 font-semibold">এই ক্যাটাগরিতে কোনো সেবা নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(svc => (
            <div key={svc.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-purple-100 transition-colors cursor-pointer"
              onClick={() => setSelected(svc)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 items-start flex-1 min-w-0">
                  {svc.image_url ? (
                    <img src={svc.image_url} alt={svc.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: '#eff6ff' }}>
                      {svc.service_categories?.icon || '🔧'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800 text-sm">{svc.name}</h3>
                      {svc.is_verified && (
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                          ✓ বিশ্বস্ত
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {svc.service_categories?.icon} {svc.service_categories?.name_bn}
                    </p>
                    <p className="text-xs text-gray-400">📞 {svc.phone}</p>
                    {svc.location && <p className="text-xs text-gray-400">📍 {svc.location}</p>}
                  </div>
                </div>
                <span className={`flex-shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-1 border ${
                  svc.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200'
                  : svc.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {svc.status === 'approved' ? '✅ অনুমোদিত'
                    : svc.status === 'rejected' ? '❌ প্রত্যাখ্যাত'
                    : '⏳ অপেক্ষমান'}
                </span>
              </div>

              <p className="text-xs text-purple-600 mt-2 text-right">বিস্তারিত দেখুন →</p>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal
          service={selected}
          onClose={() => setSelected(null)}
          onAction={() => setSelected(null)}
        />
      )}
    </div>
  )
}
