import * as React from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('animate-pulse rounded-md bg-gray-200', className)} {...props} />
  )
}

// ── ShopCardSkeleton ─────────────────────────────────────────
function ShopCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ── CategoryCardSkeleton ─────────────────────────────────────
function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-3">
      <Skeleton className="w-14 h-14 rounded-xl" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-12" />
    </div>
  )
}

export { Skeleton, ShopCardSkeleton, CategoryCardSkeleton }
