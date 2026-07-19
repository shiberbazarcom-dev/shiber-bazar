import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminListings, useUpdateListing, useDeleteListing, CONDITION_LABELS } from '../../hooks/useUsedListings'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { value: 'pending',  label: '⏳ রিভিউতে' },
  { value: 'approved', label: '✅ প্রকাশিত' },
  { value: 'rejected', label: '❌ বাতিল' },
  { value: 'sold',     label: '🎉 বিক্রি' },
  { value: 'all',      label: 'সব' },
]

export default function ManageUsedListings() {
  const [tab, setTab] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: listings = [], isLoading } = useAdminListings()
  const updateListing = useUpdateListing()
  const deleteListing = useDeleteListing()

  const filtered = tab === 'all' ? listings : listings.filter(l => l.status === tab)
  const pendingCount = listings.filter(l => l.status === 'pending').length

  function approve(l) {
    updateListing.mutate({ id: l.id, status: 'approved', reject_reason: null }, {
      onSuccess: () => { toast.success('অনুমোদন হয়েছে ✅'); setSelected(null) },
      onError:   () => toast.error('ব্যর্থ হয়েছে'),
    })
  }

  function reject(l) {
    updateListing.mutate({ id: l.id, status: 'rejected', reject_reason: rejectReason.trim() || null }, {
      onSuccess: () => { toast.success('বাতিল করা হয়েছে'); setSelected(null); setRejectReason('') },
      onError:   () => toast.error('ব্যর্থ হয়েছে'),
    })
  }

  function handleDelete(l) {
    if (!confirm(`"${l.title}" স্থায়ীভাবে মুছে ফেলবেন?`)) return
    deleteListing.mutate(l.id, {
      onSuccess: () => { toast.success('মুছে ফেলা হয়েছে'); setSelected(null) },
      onError:   () => toast.error('মুছে ফেলা যায়নি'),
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">♻️ পুরাতন বাজার</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          ব্যবহারকারীদের বিজ্ঞাপন অনুমোদন ও পরিচালনা
          {pendingCount > 0 && <span className="ml-2 text-amber-600 font-semibold">— {pendingCount}টি রিভিউয়ের অপেক্ষায়</span>}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => {
          const count = t.value === 'all' ? listings.length : listings.filter(l => l.status === t.value).length
          return (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {t.label} ({count})
            </button>
          )
        })}
      </div>

      {isLoading && <div className="text-center py-12 text-gray-400">লোড হচ্ছে...</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-14 text-gray-400 bg-white rounded-xl border">
          <p className="text-3xl mb-2">♻️</p>
          <p className="text-sm">কোনো বিজ্ঞাপন নেই</p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map(l => {
          const img = Array.isArray(l.images) && l.images[0]
          return (
            <div key={l.id}
              className="bg-white rounded-xl border shadow-sm p-4 flex gap-3 cursor-pointer hover:border-emerald-200 transition-colors"
              onClick={() => { setSelected(l); setRejectReason('') }}>
              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {img
                  ? <img src={img} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm line-clamp-1">{l.title}</p>
                <p className="text-emerald-700 font-bold text-sm">৳{Number(l.price).toLocaleString('bn-BD')}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  {l.profiles?.full_name || l.seller_name || '—'} · {l.category} · {new Date(l.created_at).toLocaleDateString('bn-BD')}
                </p>
                {l.status === 'pending' && (
                  <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => approve(l)} disabled={updateListing.isPending}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded-lg transition-colors">
                      ✅ অনুমোদন
                    </button>
                    <button onClick={() => { setSelected(l); setRejectReason('') }}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1 rounded-lg transition-colors">
                      ❌ বাতিল
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {Array.isArray(selected.images) && selected.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selected.images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <img src={url} alt="" className="w-24 h-24 rounded-lg object-cover border" />
                  </a>
                ))}
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <Row label="দাম"       value={`৳${Number(selected.price).toLocaleString('bn-BD')}${selected.negotiable ? ' (আলোচনা সাপেক্ষ)' : ''}`} />
              <Row label="ক্যাটাগরি" value={selected.category} />
              <Row label="কন্ডিশন"   value={CONDITION_LABELS[selected.condition]} />
              <Row label="এলাকা"     value={selected.location} />
              <Row label="বিক্রেতা"  value={selected.profiles?.full_name || selected.seller_name} />
              <Row label="ফোন"       value={selected.contact_phone} />
              <Row label="WhatsApp"  value={selected.whatsapp_number} />
              <Row label="ভিউ"       value={String(selected.views || 0)} />
            </div>

            {selected.description && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {selected.description}
              </div>
            )}

            {selected.status === 'approved' && (
              <Link to={`/used/${selected.id}`} target="_blank"
                className="block text-center text-sm text-blue-600 hover:underline">
                পাবলিক পেজ দেখুন ↗
              </Link>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t">
              {selected.status === 'pending' && (
                <>
                  <button onClick={() => approve(selected)} disabled={updateListing.isPending}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors">
                    ✅ অনুমোদন করুন
                  </button>
                  <div className="flex gap-2">
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="বাতিলের কারণ (ঐচ্ছিক)"
                      className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
                    <button onClick={() => reject(selected)} disabled={updateListing.isPending}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-sm transition-colors flex-shrink-0">
                      ❌ বাতিল
                    </button>
                  </div>
                </>
              )}
              {selected.status === 'approved' && (
                <button onClick={() => reject(selected)} disabled={updateListing.isPending}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-sm transition-colors">
                  ❌ প্রকাশ বন্ধ করুন (বাতিল)
                </button>
              )}
              <button onClick={() => handleDelete(selected)} disabled={deleteListing.isPending}
                className="w-full py-2 text-xs text-gray-400 hover:text-red-500 transition-colors">
                🗑️ স্থায়ীভাবে মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
