import { Link } from 'react-router-dom'
import { useFavorites, useToggleFavorite } from '../../hooks/useShops'
import ShopCard from '../../components/shop/ShopCard'
import { Skeleton } from '../../components/ui/Skeleton'
import toast from 'react-hot-toast'

export default function Favorites() {
  const { data: favs = [], isLoading } = useFavorites()
  const toggle = useToggleFavorite()

  const handleRemove = async (shopId) => {
    await toggle.mutateAsync({ shopId, isFav: true })
    toast.success('পছন্দের তালিকা থেকে সরানো হয়েছে')
  }

  const shops = favs.map(f => f.shops).filter(Boolean)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">❤️ পছন্দের দোকান</h1>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : shops.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <p className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">কোনো পছন্দের দোকান নেই</p>
          <p className="text-slate-400 mb-6">দোকানের পেজ থেকে হৃদয় আইকনে ক্লিক করে পছন্দে যোগ করুন</p>
          <Link to="/shops" className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            দোকান দেখুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
        </div>
      )}
    </div>
  )
}
