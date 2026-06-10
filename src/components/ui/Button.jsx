import { cn } from '../../lib/utils'

const variants = {
  primary:   'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm',
  secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
  ghost:     'hover:bg-gray-100 text-gray-600',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  gold:      'bg-amber-500 hover:bg-amber-600 text-white',
  outline:   'border border-blue-600 text-blue-700 hover:bg-blue-50',
}

const sizes = {
  xs: 'text-xs px-3 py-1.5 rounded-lg',
  sm: 'text-sm px-4 py-2 rounded-xl',
  md: 'text-sm px-5 py-2.5 rounded-xl',
  lg: 'text-base px-6 py-3 rounded-xl',
  xl: 'text-lg px-8 py-4 rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 select-none cursor-pointer whitespace-nowrap',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-60 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
