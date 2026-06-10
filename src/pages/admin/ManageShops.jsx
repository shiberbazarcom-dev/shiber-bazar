import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminShops, useApproveShop, useToggleFeatured, useDeleteShop } from '../../hooks/useShops'
import { useCategories } from '../../hooks/useCategories'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { RatingDisplay } from '../../components/ui/StarRating'
import { getAvatarUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function ManageShops() {
  const [filter, setFilter]     = useState('all')
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch]     = useState('')

  const { data: shops = [], isLoading } = useAdminShops(filter)
  const { data: categories = [] }      = useCategories()
  const approve  = useApproveShop()
  const featured = useToggleFeatured()
  const del      = useDeleteShop()

  const filtered = shops.filter(s => {
    const matchCat  = !catFilter || s.category_id === catFilter
    const matchSearch = !search  || s.shop_name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const toggleApprove = async (shop) => {
    await approve.mutateAsync({ id: shop.id, approve: !shop.is_approved })
    toast.success(shop.is_approved ? 'অনুমোদন বাতিল' : 'অনুমোদন দেওয়া হয়েছে ✅')
  }

  const toggleFeat = async (shop) => {
    await featured.mutateAsync({ id: shop.id, featured: !shop.is_featured })
    toast.success(shop.is_featured ? 'বিশেষ তালিকা থেকে সরানো হয়েছে' : '⭐ বিশেষ হিসেবে চিহ্নিত')
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" মুছে ফেলবেন?`)) return
    await del.mutateAsync(id)
    toast.success('দোকান মুছে ফেলা হয়েছে')
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

        <span className="ml-auto text-sm text-slate-400">{filtered.length} টি দোকান</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400">কোনো দোকান নেই</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="table-cell text-left">দোকান</th>
                  <th className="table-cell text-left">বিভাগ</th>
                  <th className="table-cell text-left">মালিক</th>
                  <th className="table-cell text-center">রেটিং</th>
                  <th className="table-cell text-center">স্ট্যাটাস</th>
                  <th className="table-cell text-center">বিশেষ</th>
                  <th className="table-cell text-center">কার্যক্রম</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(shop => {
                  const fallback = getAvatarUrl(shop.shop_name)
                  return (
                    <tr key={shop.id} className="table-row">
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
                      <td className="table-cell">
                        {shop.categories && (
                          <Badge variant="gray">{shop.categories.icon} {shop.categories.name}</Badge>
                        )}
                      </td>
                      <td className="table-cell text-slate-500">{shop.profiles?.full_name || '—'}</td>
                      <td className="table-cell text-center">
                        {shop.review_count > 0
                          ? <RatingDisplay rating={shop.avg_rating} count={shop.review_count} />
                          : <span className="text-slate-300 dark:text-slate-600">—</span>
                        }
                      </td>
                      <td className="table-cell text-center">
                        <button onClick={() => toggleApprove(shop)}>
                          <Badge variant={shop.is_approved ? 'green' : 'gold'} dot className="cursor-pointer hover:opacity-80 transition-opacity">
                            {shop.is_approved ? 'অনুমোদিত' : 'অপেক্ষমান'}
                          </Badge>
                        </button>
                      </td>
                      <td className="table-cell text-center">
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
                          <Button size="xs" variant="danger" onClick={() => handleDelete(shop.id, shop.shop_name)}>🗑️</Button>
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
    </div>
  )
}
