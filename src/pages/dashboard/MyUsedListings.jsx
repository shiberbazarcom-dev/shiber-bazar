import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useMyListings, useUpdateListing, useDeleteListing, CONDITION_LABELS } from '../../hooks/useUsedListings'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending:  { label: '⏳ রিভিউতে',       color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: '✅ প্রকাশিত',      color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: '❌ বাতিল',          color: 'bg-red-50 text-red-700 border-red-200' },
  sold:     { label: '🎉 বিক্রি হয়েছে',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
}

export default function MyUsedListings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: listings = [], isLoading } = useMyListings(user?.id)
  const updateListing = useUpdateListing()
  const deleteListing = useDeleteListing()

  function markSold(l) {
    if (!confirm(`"${l.title}" বিক্রি হয়ে গেছে হিসেবে মার্ক করবেন?`)) return
    updateListing.mutate({ id: l.id, status: 'sold' }, {
      onSuccess: () => toast.success('বিক্রি হয়েছে হিসেবে মার্ক হয়েছে 🎉'),
      onError:   () => toast.error('আপডেট হয়নি'),
    })
  }

  function handleDelete(l) {
    if (!confirm(`"${l.title}" বিজ্ঞাপনটি মুছে ফেলবেন?`)) return
    deleteListing.mutate(l.id, {
      onSuccess: () => toast.success('বিজ্ঞাপন মুছে ফেলা হয়েছে'),
      onError:   () => toast.error('মুছে ফেলা যায়নি'),
    })
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">♻️ আমার বিজ্ঞাপন</h1>
          <p className="text-sm text-gray-500 mt-0.5">পুরাতন বাজারে দেওয়া আপনার বিজ্ঞাপনগুলো</p>
        </div>
        <Link to="/used/post"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
          ➕ নতুন বিজ্ঞাপন
        </Link>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-400">লোড হচ্ছে...</div>}

      {!isLoading && listings.length === 0 && (
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-4xl mb-3">♻️</p>
          <p className="text-gray-500 mb-1">এখনো কোনো বিজ্ঞাপন দেননি</p>
          <p className="text-gray-400 text-sm mb-4">পুরাতন জিনিস বিক্রি করুন — সম্পূর্ণ ফ্রি</p>
          <Link to="/used/post"
            className="inline-block px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
            ➕ বিজ্ঞাপন দিন
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {listings.map(l => {
          const cfg = STATUS_CONFIG[l.status] || STATUS_CONFIG.pending
          const img = Array.isArray(l.images) && l.images[0]
          return (
            <div key={l.id} className="bg-white rounded-xl border shadow-sm p-4 flex gap-3">
              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {img
                  ? <img src={img} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-800 text-sm line-clamp-1">{l.title}</p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-emerald-700 font-bold text-sm mt-0.5">
                  ৳{Number(l.price).toLocaleString('bn-BD')}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {CONDITION_LABELS[l.condition]} · 👁️ {l.views || 0} · {new Date(l.created_at).toLocaleDateString('bn-BD')}
                </p>
                {l.status === 'rejected' && l.reject_reason && (
                  <p className="text-xs text-red-500 mt-1">কারণ: {l.reject_reason}</p>
                )}

                <div className="flex gap-3 mt-2 flex-wrap">
                  {l.status === 'approved' && (
                    <Link to={`/used/${l.id}`} className="text-xs text-blue-600 hover:underline">দেখুন</Link>
                  )}
                  {(l.status === 'approved' || l.status === 'pending') && (
                    <button onClick={() => markSold(l)} disabled={updateListing.isPending}
                      className="text-xs text-purple-600 hover:underline">বিক্রি হয়েছে</button>
                  )}
                  {l.status !== 'sold' && (
                    <button onClick={() => navigate(`/used/post?edit=${l.id}`)}
                      className="text-xs text-gray-500 hover:underline">এডিট</button>
                  )}
                  <button onClick={() => handleDelete(l)} disabled={deleteListing.isPending}
                    className="text-xs text-red-500 hover:underline">মুছুন</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
