import { cn } from '../../lib/utils'

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />
}

export function ShopCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div className="card p-6 flex flex-col items-center gap-3">
      <Skeleton className="h-14 w-14 rounded-2xl" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-14" />
    </div>
  )
}
