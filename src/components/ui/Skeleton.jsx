export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function ShopCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}
