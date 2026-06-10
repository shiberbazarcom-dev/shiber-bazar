import { cn } from '../../lib/utils'

export function StarRating({ rating = 0, max = 5, size = 'sm', onChange, className }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {stars.map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-transform',
            onChange && 'cursor-pointer hover:scale-110',
            !onChange && 'cursor-default',
            size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : 'text-2xl'
          )}
        >
          <span className={star <= rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-600'}>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

export function RatingDisplay({ rating, count, className }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="text-amber-400 text-sm">★</span>
      <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
        {rating ? Number(rating).toFixed(1) : '—'}
      </span>
      {count !== undefined && (
        <span className="text-slate-400 text-xs">({count} রিভিউ)</span>
      )}
    </div>
  )
}
