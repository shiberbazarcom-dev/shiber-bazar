import { useState } from 'react'
import { useSiteSettings } from '../../hooks/useSettings'

export default function AnnouncementBar() {
  const { data: settings = {} } = useSiteSettings()
  const [dismissed, setDismissed] = useState(false)

  const isActive = settings['announcement_active'] === 'true'
  const text     = settings['announcement_text'] || ''

  if (!isActive || !text || dismissed) return null

  return (
    <div className="relative bg-brand-600 text-white text-sm py-2 px-4 flex items-center justify-center gap-3 min-h-[36px]">
      <p className="text-center text-sm font-medium leading-snug flex-1 max-w-2xl">
        {text}
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="বন্ধ করুন"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors flex-shrink-0 text-white/80 hover:text-white"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
