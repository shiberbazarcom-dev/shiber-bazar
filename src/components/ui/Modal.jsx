import { useEffect } from 'react'
import { cn } from '../../lib/utils'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className={cn(
        'relative w-full bg-white dark:bg-slate-800 rounded-2xl shadow-premium p-6 animate-fade-up',
        sizes[size]
      )}>
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl leading-none"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
