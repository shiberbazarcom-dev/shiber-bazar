import { Link } from 'react-router-dom'
import { useMyShops, useDeleteShop } from '../../hooks/useShops'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { RatingDisplay } from '../../components/ui/StarRating'
import { getAvatarUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function MyShops() {
  const { data: shops = [], isLoading } = useMyShops()
  const deleteShop = useDeleteShop()

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" দোকানটি মুছে ফেলবেন?`)) return
    try {
      await deleteShop.mutateAsync(id)
      toast.success('দোকান মুছে ফেলা হয়েছে')
    } catch {
      toast.error('মুছতে সমস্যা হয়েছে')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">🏪 আমার দোকান</h1>
        <Link to="/dashboard/add-shop">
          <Button size="sm">+ নতুন দোকান</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : shops.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">কোনো দোকান নেই</p>
          <p className="text-slate-400 mb-6">আপনার প্রথম দোকান যোগ করুন</p>
          <Link to="/dashboard/add-shop"><Button>+ নতুন দোকান যোগ করুন</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map(shop => {
            const fallback = getAvatarUrl(shop.shop_name)
            return (
              <div key={shop.id} className="card p-3 sm:p-4 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                    <img src={shop.cover_image || fallback} alt={shop.shop_name}
                      className="w-full h-full object-cover" onError={e => { e.target.src = fallback }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-white truncate">{shop.shop_name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant={shop.is_approved ? 'green' : 'gold'} dot>
                            {shop.is_approved ? 'অনুমোদিত' : 'অপেক্ষমান'}
                          </Badge>
                          {shop.is_featured && <Badge variant="gold">⭐ বিশেষ</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {shop.is_approved && (
                          <Link to={`/shop/${shop.slug || shop.id}`} target="_blank">
                            <Button size="xs" variant="secondary">👁️</Button>
                          </Link>
                        )}
                        <Button size="xs" variant="danger" onClick={() => handleDelete(shop.id, shop.shop_name)}>
                          🗑️
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {shop.categories && <Badge variant="gray">{shop.categories.icon} {shop.categories.name}</Badge>}
                      {shop.review_count > 0 && <RatingDisplay rating={shop.avg_rating} count={shop.review_count} />}
                      <span className="text-xs text-slate-400">👁️ {shop.view_count || 0} ভিউ</span>
                    </div>
                    {shop.address && <p className="text-xs text-slate-400 mt-1 truncate">📍 {shop.address}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
