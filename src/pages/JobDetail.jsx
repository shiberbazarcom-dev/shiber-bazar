import { Link, useParams } from 'react-router-dom'
import { useJob } from '../hooks/useJobs'
import SEO from '../components/SEO'

export default function JobDetail() {
  const { id } = useParams()
  const { data: job, isLoading, isError } = useJob(id)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-4xl">😕</p>
        <p className="text-gray-500">চাকরিটি পাওয়া যায়নি।</p>
        <Link to="/jobs" className="text-blue-600 hover:underline text-sm">← চাকরির বোর্ডে ফিরুন</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO
        title={`${job.title} — শিবের বাজার চাকরি`}
        description={job.description || `${job.title} পদে নিয়োগ। ${job.company_name || ''} ${job.location || ''}`}
      />

      <div className="container-app max-w-2xl">
        {/* Back */}
        <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          চাকরির বোর্ড
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${job.is_featured ? 'bg-amber-50' : 'bg-blue-50'}`}>
                {job.is_featured ? '⭐' : '💼'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                  {job.is_featured && (
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">ফিচার্ড</span>
                  )}
                </div>
                {job.company_name && (
                  <p className="text-gray-500 text-sm">🏢 {job.company_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              { icon: '📋', label: 'ক্যাটাগরি', value: job.category },
              { icon: '💰', label: 'বেতন',       value: job.salary },
              { icon: '📍', label: 'অবস্থান',    value: job.location },
              { icon: '📅', label: 'মেয়াদ শেষ', value: job.expiry_date },
            ].filter(d => d.value).map(d => (
              <div key={d.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{d.icon} {d.label}</p>
                <p className="text-sm font-semibold text-gray-700">{d.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {job.description && (
            <div className="px-6 pb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">📄 বিস্তারিত</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>
          )}

          {/* Contact buttons */}
          {(job.contact_phone || job.whatsapp_number) && (
            <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-3">
              {job.contact_phone && (
                <a href={`tel:${job.contact_phone}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
                  📞 কল করুন — {job.contact_phone}
                </a>
              )}
              {job.whatsapp_number && (
                <a href={`https://wa.me/${job.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
                  💬 WhatsApp করুন
                </a>
              )}
            </div>
          )}
        </div>

        {/* Posted date */}
        <p className="text-center text-xs text-gray-300 mt-4">
          পোস্ট করা হয়েছে: {new Date(job.created_at).toLocaleDateString('bn-BD')}
        </p>
      </div>
    </div>
  )
}
