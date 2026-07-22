import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useListing, trackListingView, CONDITION_LABELS } from '../../hooks/useUsedListings'
import SEO from '../../components/SEO'

export default function UsedListingDetail() {
  const { id } = useParams()
  const { data: listing, isLoading, isError } = useListing(id)
  const [activeImg, setActiveImg] = useState(0)
  const [showPhone, setShowPhone] = useState(false)

  useEffect(() => {
    if (id) trackListingView(id)
  }, [id])

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">লোড হচ্ছে...</div>
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-4xl">😕</p>
        <p className="text-gray-500">বিজ্ঞাপনটি পাওয়া যায়নি বা সরিয়ে ফেলা হয়েছে</p>
        <Link to="/used" className="text-emerald-600 text-sm font-semibold hover:underline">← পুরাতন বাজারে ফিরুন</Link>
      </div>
    )
  }

  const images = Array.isArray(listing.images) ? listing.images : []
  const sold = listing.status === 'sold'

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SEO title={`${listing.title} — পুরাতন বাজার`} description={listing.description?.slice(0, 150)} />

      <div className="container-app py-5 px-4" style={{ maxWidth: 900 }}>
        <Link to="/used" className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
          ← পুরাতন বাজার
        </Link>

        <div className="grid md:grid-cols-2 gap-5 mt-3">
          {/* Images */}
          <div>
            <div className="relative aspect-[4/3] bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {images.length > 0 ? (
                <img src={images[activeImg]} alt={listing.title}
                  className={`w-full h-full object-contain ${sold ? 'opacity-60 grayscale' : ''}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-gray-200">📦</div>
              )}
              {sold && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-gray-800/90 text-white font-bold px-5 py-2 rounded-xl text-lg -rotate-6">
                    বিক্রি হয়ে গেছে
                  </span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                      i === activeImg ? 'border-emerald-500' : 'border-transparent opacity-70'
                    }`}>
                    <img src={img} alt={`${listing.title} — ছবি ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-xl font-bold text-gray-800">{listing.title}</h1>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                  {CONDITION_LABELS[listing.condition] || listing.condition}
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-2">
                ৳{Number(listing.price).toLocaleString('bn-BD')}
                {listing.negotiable && <span className="text-sm text-gray-400 font-normal ml-2">দাম আলোচনা সাপেক্ষ</span>}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                <span>{listing.category}</span>
                {listing.location && <span>📍 {listing.location}</span>}
                <span>👁️ {listing.views || 0} বার দেখা হয়েছে</span>
                <span>🗓️ {new Date(listing.created_at).toLocaleDateString('bn-BD')}</span>
              </div>
            </div>

            {listing.description && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">বিবরণ</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Seller card */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">বিক্রেতা</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  {(listing.seller_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{listing.seller_name || 'বিক্রেতা'}</p>
                  <p className="text-xs text-gray-400">শিবের বাজার সদস্য</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            {!sold && (
              <div className="flex gap-2">
                {showPhone ? (
                  <a href={`tel:${listing.contact_phone}`}
                    className="flex-1 text-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors">
                    📞 {listing.contact_phone}
                  </a>
                ) : (
                  <button onClick={() => setShowPhone(true)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors">
                    📞 নম্বর দেখুন
                  </button>
                )}
                {listing.whatsapp_number && (
                  <a href={`https://wa.me/88${listing.whatsapp_number.replace(/\D/g, '').replace(/^88/, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors">
                    💬 WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* Safety warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
              <p className="font-bold">⚠️ নিরাপদ লেনদেনের জন্য:</p>
              <p>• সরাসরি দেখা করে, পণ্য যাচাই করে টাকা দিন</p>
              <p>• কোনো অবস্থাতেই অগ্রিম টাকা পাঠাবেন না</p>
              <p>• জনবহুল স্থানে দেখা করুন</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
