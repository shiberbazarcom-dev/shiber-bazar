import { useState, useEffect, useRef, useCallback } from 'react'

const GRADIENTS = [
  'linear-gradient(135deg, #2563EB 0%, #60a5fa 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  'linear-gradient(135deg, #059669 0%, #34d399 100%)',
  'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
  'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
]

export function AdCarousel({ ads = [] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef(null)

  const total = ads.length

  const goTo = useCallback((idx) => {
    setCurrent((idx + total) % total)
  }, [total])

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Auto-advance
  useEffect(() => {
    if (total <= 1 || paused) return
    intervalRef.current = setInterval(next, 5000)
    return () => clearInterval(intervalRef.current)
  }, [total, paused, next])

  if (!total) return null

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{ userSelect: 'none' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides strip */}
      <div
        className="flex"
        style={{
          transform: `translateX(-${current * 100}%)`,
          transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
      >
        {ads.map((ad, i) => {
          const Wrapper = ad.target_url ? 'a' : 'div'
          const wProps = ad.target_url
            ? { href: ad.target_url, target: '_blank', rel: 'noopener noreferrer' }
            : {}

          return (
            <Wrapper
              key={ad.id}
              {...wProps}
              className="flex-shrink-0 w-full block relative overflow-hidden"
              style={{ width: '100%' }}
            >
              {ad.image_url ? (
                /* ── Image ad ── */
                <div className="relative">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-full object-cover"
                    style={{ height: 200, display: 'block' }}
                    draggable={false}
                  />
                  {/* Bottom gradient overlay */}
                  <div
                    className="absolute bottom-0 inset-x-0 px-4 pb-3 pt-8"
                    style={{
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 100%)',
                    }}
                  >
                    <p className="text-white text-sm font-semibold leading-tight drop-shadow">
                      {ad.title}
                    </p>
                    {ad.target_url && (
                      <p className="text-white/70 text-xs mt-0.5">বিস্তারিত দেখুন →</p>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Text-only ad ── */
                <div
                  className="w-full flex flex-col items-center justify-center text-center px-8"
                  style={{
                    height: 200,
                    background: GRADIENTS[i % GRADIENTS.length],
                  }}
                >
                  <span className="text-5xl mb-3">📢</span>
                  <p className="text-white font-bold text-xl leading-tight drop-shadow-sm">
                    {ad.title}
                  </p>
                  {ad.target_url && (
                    <span className="mt-3 inline-flex items-center gap-1 text-white/90 text-xs font-medium
                      border border-white/40 rounded-full px-3 py-1 backdrop-blur-sm">
                      বিস্তারিত দেখুন →
                    </span>
                  )}
                </div>
              )}
            </Wrapper>
          )
        })}
      </div>

      {/* ── Left / Right arrows (only when >1 ad) ── */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full
              flex items-center justify-center text-white text-xl font-bold
              transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            aria-label="আগের বিজ্ঞাপন"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full
              flex items-center justify-center text-white text-xl font-bold
              transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            aria-label="পরের বিজ্ঞাপন"
          >
            ›
          </button>
        </>
      )}

      {/* ── Dot indicators ── */}
      {total > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-20">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                background: i === current ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label={`বিজ্ঞাপন ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar (auto-advance visual) ── */}
      {total > 1 && !paused && (
        <div className="absolute bottom-0 inset-x-0 h-0.5 z-30 overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div
            key={current}
            className="h-full"
            style={{
              background: 'rgba(255,255,255,0.8)',
              animation: 'adProgress 5s linear forwards',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes adProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}
