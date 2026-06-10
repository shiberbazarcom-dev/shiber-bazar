import { cn } from '../../lib/utils'
import { forwardRef } from 'react'

export const Input = forwardRef(({ className, label, error, prefix, suffix, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="form-label">{label}</label>}
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-slate-400 pointer-events-none">{prefix}</span>
      )}
      <input
        ref={ref}
        className={cn(
          'input',
          prefix && 'pl-10',
          suffix && 'pr-10',
          error && 'border-red-400 focus:ring-red-400/50 focus:border-red-400',
          className
        )}
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 text-slate-400 pointer-events-none">{suffix}</span>
      )}
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
Input.displayName = 'Input'

export const Textarea = forwardRef(({ className, label, error, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="form-label">{label}</label>}
    <textarea
      ref={ref}
      className={cn('input resize-none', error && 'border-red-400', className)}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef(({ className, label, error, children, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="form-label">{label}</label>}
    <select
      ref={ref}
      className={cn('input bg-white dark:bg-slate-800 cursor-pointer', error && 'border-red-400', className)}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
Select.displayName = 'Select'
