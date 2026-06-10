import { cn } from '../../lib/utils'

const variants = {
  green:  'bg-green-100 text-green-700',
  gold:   'bg-amber-100 text-amber-700',
  blue:   'bg-blue-100 text-blue-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
}

const dotColors = {
  green:  'bg-green-500',
  gold:   'bg-amber-500',
  blue:   'bg-blue-500',
  red:    'bg-red-500',
  gray:   'bg-gray-400',
  purple: 'bg-purple-500',
}

export function Badge({ variant = 'gray', className, children, dot }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
      variants[variant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}
