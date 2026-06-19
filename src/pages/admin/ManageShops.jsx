import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminShops, useApproveShop, useToggleFeatured, useDeleteShop } from '../../hooks/useShops'
import { useCategories } from '../../hooks/useCategories'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { RatingDisplay } from '../../components/ui/StarRating'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getAvatarUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function ManageShops() {
  const [filter, setFilter]           = useState('all')
  const [catFilter, setCatFilter]     = useState('')
  const [search, setSearch]           = useState('')
  const [locationFilter, setLocation] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: shops = [], isLoading } = useAdminShops(filter)
  const { data: categories = [] }      = useCategories()
  const approve  = useApproveShop()
  const featured = useToggleFeatured()
  const del      = useDeleteShop()

  const filtered = shops.filter(s => {
    const matchCat      = !catFilter || s.category_id === catFilter
    const name          = (s.shop_name || '').toLowerCase()
    const matchSearch   = !search || name.includes(search.toLowerCase())
    const matchLocation = !locationFilter || (s.address || '').toLowerCase().includes(locationFilter.toLowerCase())
    return matchCat && matchSearch && matchLocation
  })

  const allSelected = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id))

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)))
    }
  }

  async function bulkApprove(isApprove) {
    const ids = [...selectedIds]
    if (!ids.length) return
    setBulkLoading(true)
    try {
      await Promise.all(ids.map(id => approve.mutateAsync({ id, approve: isApprove })))
      toast.success(`${ids.length}টি দোকান ${isApprove ? 'অনুমোদন' : 'বাতিল'} হয়েছে ✅`)
      setSelectedIds(new Set())
    } catch {
      toast.error('সমস্যা হয়েছে')
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleApprove = async (shop) => {
    const isApproved = shop.status === 'approved'
    await approve.mutateAsync({ id: shop.id, approve: !isApproved })
    toast.success(isApproved ? 'অনুমোদন বাতিল' : 'অনুমোদন দেওয়া হয়েছে ✅')
  }

  const toggleFeat = async (shop) => {
    await featured.mutateAsync({ id: shop.id, featured: !shop.is_featured })
    toast.success(shop.is_featured ? 'বিশেষ তালিকা থেকে সরানো হয়েছে' : '⭐ বিশেষ হিসেবে চিহ্নিত')
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    setDeleteLoading(true)
    try {
      await del.mutateAsync(deleteConfirm.id)
      toast.success('দোকান মুছে ফেলা হয়েছে')
      setDeleteConfirm(null)
    } catch {
      toast.error('সমস্যা হয়েছে')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filters = [
    { val: 'all',      label: 'সব' },
    { val: 'pending',  label: 'অপেক্ষমান' },
    { val: 'approved', label: 'অনুমোদিত' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">🏪 দোকান ব্যবস্থাপনা</h1>

      {/* Filter bar */}
      <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f.val} onClick={() => setFilter(f.val)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f.val ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="দোকান খুঁজুন..."
          className="input text-sm py-2 w-44" />

        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="input bg-white dark:bg-slate-800 text-sm py-2 w-40 cursor-pointer">
          <option value="">সব ক্যাটাগরি</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input type="text" value={locationFilter} onChange={e => setLocation(e.target.value)}
          placeholder="📍 এলাকা ফিল্টার..."
          className="input text-sm py-2 w-36" />

        <span className="ml-auto text-sm text-slate-400">{filtered.length} টি দোকান</span>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-purple-600 text-white rounded-xl px-4 py-3 mb-4 flex items-center gap-3 flex-wrap animate-fadeIn">
          <span className="text-sm font-semibold">{selectedIds.size}টি নির্বাচিত</span>
          <div className="flex gap-2 flex-wrap ml-auto">
            <button onClick={() => bulkApprove(true)} disabled={bulkLoading}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded-lg text-xs font-semibold disabled:opacity-60">
              ✅ সব অনুমোদন
            </button>
            <button onClick={() => bulkApprove(false)} disabled={bulkLoading}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-400 rounded-lg text-xs font-semibold disabled:opacity-60">
              ❌ সব বাতিল
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold">
              বাতিল
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-5xl mb-3">🏪</p>
            <p className="text-slate-500 font-medium">কোনো দোকান পাওয়া যায়নি</p>
            {(search || locationFilter || catFilter) && (
              <p className="text-xs text-slate-400 mt-1">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="table-cell w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 cursor-pointer" />
                  </th>
                  <th className="table-cell text-left">দোকান</th>
                  <th className="table-cell text-left hidden sm:table-cell">বিভাগ</th>
                  <th className="table-cell text-left hidden md:table-cell">মালিক</th>
                  <th className="table-cell text-center hidden lg:table-cell">রেটিং</th>
                  <th className="table-cell text-center">স্ট্যাটাস</th>
                  <th className="table-cell text-center hidden md:table-cell">বিশেষ</th>
                  <th className="table-cell text-center">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(shop => {
                  const fallback = getAvatarUrl(shop.shop_name || '?')
                  return (
                    <tr key={shop.id} className={`table-row transition-colors ${selectedIds.has(shop.id) ? 'bg-purple-50' : ''}`}>
                      <td className="table-cell">
                        <input type="checkbox" checked={selectedIds.has(shop.id)} onChange={() => toggleSelect(shop.id)}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 cursor-pointer" />
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                            <img src={shop.cover_image || fallback} alt="" className="w-full h-full object-cover"
                              onError={e => { e.target.src = fallback }} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{shop.shop_name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[150px]">{shop.address}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell hidden sm:table-cell">
                        {shop.categories && (
                          <Badge variant="gray">{shop.categories.icon} {shop.categories.name}</Badge>
                        )}
                      </td>
                      <td className="table-cell text-slate-500 hidden md:table-cell">{shop.profiles?.full_name || '—'}</td>
                      <td className="table-cell text-center hidden lg:table-cell">
                        {shop.review_count > 0
                          ? <RatingDisplay rating={shop.avg_rating} count={shop.review_count} />
                          : <span className="text-slate-300 dark:text-slate-600">—</span>
                        }
                      </td>
                      <td className="table-cell text-center">
                        <button onClick={() => toggleApprove(shop)}>
                          <Badge variant={shop.status === 'approved' ? 'green' : 'gold'} dot className="cursor-pointer hover:opacity-80 transition-opacity">
                            {shop.status === 'approved' ? 'অনুমোদিত' : 'অপেক্ষমান'}
                          </Badge>
                        </button>
                      </td>
                      <td className="table-cell text-center hidden md:table-cell">
                        <button onClick={() => toggleFeat(shop)}>
                          <Badge variant={shop.is_featured ? 'gold' : 'gray'} className="cursor-pointer hover:opacity-80 transition-opacity">
                            {shop.is_featured ? '⭐ হ্যাঁ' : '— না'}
                          </Badge>
                        </button>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {shop.is_approved && (
                            <Link to={`/shop/${shop.slug || shop.id}`} target="_blank">
                              <Button size="xs" variant="secondary">👁️</Button>
                            </Link>
                          )}
                          <Button size="xs" variant="danger" onClick={() => setDeleteConfirm({ id: shop.id, name: shop.shop_name })}>🗑️</Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteConfirm}
        title={`"${deleteConfirm?.name}" মুছে ফেলবেন?`}
        message="দোকানের সব তথ্য, পণ্য ও ছবি স্থায়ীভাবে মুছে যাবে। এটি পুনরুদ্ধার করা সম্ভব নয়।"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
