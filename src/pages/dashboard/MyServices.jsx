import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyServices, useDeleteService, useUpdateService } from '../../hooks/useServices'
import { useServiceCategories } from '../../hooks/useServices'
import { SERVICE_CATEGORIES, CATEGORY_EXTRA_FIELDS } from '../../data/serviceCategories'
import toast from 'react-hot-toast'

const BLUE = '#2563EB'

const STATUS_LABEL = {
  pending:  { label: '⏳ অনুমোদনের অপেক্ষায়', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved: { label: '✅ অনুমোদিত',              cls: 'bg-green-50  text-green-700  border-green-200'  },
  rejected: { label: '❌ প্রত্যাখ্যাত',           cls: 'bg-red-50    text-red-700    border-red-200'    },
}

function EditModal({ service, cats, onClose, onSave }) {
  const [form, setForm] = useState({
    name:        service.name        || '',
    phone:       service.phone       || '',
    description: service.description || '',
    location:    service.location    || '',
  })
  const [extra, setExtra] = useState(service.extra || {})
  const update = useUpdateService()

  const selectedCat = cats.find(c => c.id === service.category_id)
  const extraFields = selectedCat ? (CATEGORY_EXTRA_FIELDS[selectedCat.slug] || []) : []

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('নাম লিখুন')
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) return toast.error('সঠিক নম্বর দিন')
    try {
      await update.mutateAsync({ id: service.id, ...form, extra })
      toast.success('আপডেট হয়েছে — পুনরায় অনুমোদনের অপেক্ষায়')
      onSave()
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">সেবা সম্পাদনা করুন</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="space-y-3">
            {[
              { k: 'name',        label: 'নাম',       type: 'text'  },
              { k: 'phone',       label: 'মোবাইল',    type: 'tel'   },
              { k: 'location',    label: 'এলাকা',     type: 'text'  },
            ].map(({ k, label, type }) => (
              <div key={k}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
                <input
                  type={type}
                  value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            ))}

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">বিবরণ</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>

            {extraFields.map(field => (
              <div key={field.key}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={extra[field.key] || ''}
                    onChange={e => setExtra(x => ({ ...x, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white">
                    <option value="">বেছে নিন</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    value={extra[field.key] || ''}
                    onChange={e => setExtra(x => ({ ...x, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
              বাতিল
            </button>
            <button
              onClick={handleSave}
              disabled={update.isPending}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-60"
              style={{ background: BLUE }}>
              {update.isPending ? '⏳ সংরক্ষণ...' : '💾 সংরক্ষণ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyServices() {
  const { data: services = [], isLoading } = useMyServices()
  const { data: dbCats = [] } = useServiceCategories()
  const cats = dbCats.length ? dbCats : SERVICE_CATEGORIES
  const deleteService = useDeleteService()
  const [editing, setEditing] = useState(null)

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" সেবাটি মুছে ফেলবেন?`)) return
    try {
      await deleteService.mutateAsync(id)
      toast.success('মুছে ফেলা হয়েছে')
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🛠️ আমার সেবাসমূহ</h1>
          <p className="text-sm text-gray-400 mt-0.5">আপনার যোগ করা সেবার তালিকা</p>
        </div>
        <Link
          to="/services/submit"
          className="text-sm font-bold text-white px-4 py-2.5 rounded-xl"
          style={{ background: BLUE }}>
          + নতুন সেবা
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-100 rounded-xl" />
                <div className="h-8 w-20 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-5xl mb-4">🛠️</p>
          <p className="text-gray-600 font-semibold mb-1">কোনো সেবা যোগ করা হয়নি</p>
          <p className="text-sm text-gray-400 mb-5">আপনার সেবা লিস্ট করুন — বিনামূল্যে</p>
          <Link
            to="/services/submit"
            className="inline-block text-sm font-bold text-white px-6 py-2.5 rounded-xl"
            style={{ background: BLUE }}>
            সেবা যোগ করুন
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(svc => {
            const statusInfo = STATUS_LABEL[svc.status] || STATUS_LABEL.pending
            const cat = cats.find(c => c.id === svc.category_id || c.slug === svc.service_categories?.slug)
            return (
              <div key={svc.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800 text-sm">{svc.name}</h3>
                      {svc.is_verified && (
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                          ✓ বিশ্বস্ত
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {svc.service_categories?.icon || cat?.icon} {svc.service_categories?.name_bn || cat?.name_bn}
                    </p>
                    {svc.location && <p className="text-xs text-gray-400">📍 {svc.location}</p>}
                  </div>
                  <span className={`flex-shrink-0 text-[11px] font-semibold border rounded-full px-2.5 py-1 ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">👁️ {svc.views} ভিউ</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(svc)}
                      className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      ✏️ সম্পাদনা
                    </button>
                    <button
                      onClick={() => handleDelete(svc.id, svc.name)}
                      disabled={deleteService.isPending}
                      className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                      🗑️ মুছুন
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <EditModal
          service={editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSave={() => setEditing(null)}
        />
      )}
    </div>
  )
}
