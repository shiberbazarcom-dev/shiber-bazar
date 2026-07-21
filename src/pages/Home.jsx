import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFeaturedShops, useLatestShops, useMarketStats } from '../hooks/useShops'
import { useCategoryWithCount } from '../hooks/useCategories'
import { useActiveAds, trackAdClick } from '../hooks/useAds'
import { ShopCard } from '../components/shop/ShopCard'
import { ShopCardSkeleton } from '../components/ui/Skeleton'
import SearchDropdown from '../components/SearchDropdown'
import { supabase } from '../lib/supabase'
import SEO from '../components/SEO'
import ServiceCategoryCard from '../components/services/ServiceCategoryCard'
import { useDirectoryCategories } from '../hooks/useServiceDirectory'
import { useServices } from '../hooks/useServices'
import { useSiteSettings } from '../hooks/useSettings'
import { useHomeSections } from '../hooks/useHomeSections'
import { usePublicListings, CONDITION_LABELS as USED_CONDITION_LABELS, USED_CATEGORIES } from '../hooks/useUsedListings'

// CMS fallbacks for Home page
const HOME_FB = {
  hero_title:                      'শিবের বাজার',
  hero_subtitle:                   'আপনার এলাকার সকল দোকান এক জায়গায় — সহজে খুঁজুন, যোগাযোগ করুন',
  hero_search_placeholder_shop:    'দোকানের নাম বা ক্যাটাগরি লিখুন...',
  hero_search_placeholder_product: 'পণ্যের নাম লিখুন...',
  cta_badge:        'ফ্রি রেজিস্ট্রেশন',
  cta_title:        'আপনার দোকান যোগ করুন',
  cta_subtitle:     'বিনামূল্যে আপনার দোকানের তথ্য দিন এবং লক্ষাধিক মানুষের কাছে পৌঁছান। আমাদের প্ল্যাটফর্মে আজই যোগ দিন।',
  cta_btn_primary:  'বিনামূল্যে রেজিস্ট্রেশন করুন',
  cta_btn_secondary:'দোকান ব্রাউজ করুন',
  contact_address:  'শিবের বাজার, সিলেট সদর, সিলেট',
  contact_phone:    '01310012276',
  contact_phone_display: '০১৩১০-০১২২৭৬',
  whatsapp_number:  '8801310012276',
}
function hcms(settings, key) {
  const v = settings[key]
  return (v !== undefined && v !== null && v !== '') ? v : (HOME_FB[key] ?? '')
}

// Animated counter component
function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!value) return
    const duration = 1500
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  
  return <span>{count.toLocaleString('bn-BD')}{suffix}</span>
}

// ── Banner Ad — modern e-commerce style ──────────────────────────
function BannerAd({ ads }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused]   = useState(false)
  const timer = useRef(null)

  const startTimer = () => {
    clearInterval(timer.current)
    if (ads.length > 1) {
      timer.current = setInterval(() => setCurrent(p => (p + 1) % ads.length), 5000)
    }
  }

  useEffect(() => { startTimer(); return () => clearInterval(timer.current) }, [ads.length])
  useEffect(() => {
    if (paused) clearInterval(timer.current)
    else startTimer()
  }, [paused])

  if (!ads.length) return null
  const ad = ads[current]

  function go(idx) {
    setCurrent((idx + ads.length) % ads.length)
    startTimer()
  }

  /* ── Single slide ── */
  function Slide({ a, active }) {
    const wrap = (children) => a.target_url
      ? <a href={a.target_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full" onClick={() => trackAdClick(a.id)}>{children}</a>
      : <div className="w-full h-full">{children}</div>

    return (
      <div className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
        {wrap(
          a.image_url ? (
            /* ── Image ad: show image purely, let the image speak ── */
            <img
              src={a.image_url}
              alt={a.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            /* ── Text-only ad: gradient card ── */
            <div className="w-full h-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-400 flex items-center">
              <div className="px-8 sm:px-16 py-8 max-w-2xl">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">বিজ্ঞাপন</p>
                <h3 className="text-white font-bold text-2xl sm:text-4xl leading-tight mb-3">{a.title}</h3>
                {a.description && (
                  <p className="text-white/80 text-sm sm:text-base mb-5">{a.description}</p>
                )}
                <span className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  বিস্তারিত দেখুন
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          )
        )}
      </div>
    )
  }

  return (
    <section className="bg-gray-100 py-3 sm:py-4">
      <div className="container-app">
        <div
          className="relative w-full overflow-hidden rounded-xl shadow-md group"
          style={{ aspectRatio: '21/6', minHeight: 140, maxHeight: 320 }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Slides */}
          {ads.map((a, i) => <Slide key={a.id} a={a} active={i === current} />)}

          {/* Left arrow */}
          {ads.length > 1 && (
            <>
              <button
                onClick={() => go(current - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="আগের">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right arrow */}
              <button
                onClick={() => go(current + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="পরের">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {ads.map((_, i) => (
                  <button key={i} onClick={() => go(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? 'w-5 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

              {/* Slide counter top-right */}
              <div className="absolute top-2.5 right-3 z-20 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                {current + 1} / {ads.length}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

// ── Sidebar / mid-page Ad strips ───────────────────────────────────
function SidebarAdStrip({ ads }) {
  if (!ads.length) return null
  return (
    <div className="container-app py-3">
      <div className="flex flex-wrap gap-3">
        {ads.map(ad => {
          const card = (
            <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-100 h-32 sm:h-36 w-full group cursor-pointer">
              {ad.image_url ? (
                <img src={ad.image_url} alt={ad.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-400" />
              )}
              {/* Gradient overlay only for text ads */}
              {!ad.image_url && (
                <div className="absolute inset-0 bg-black/10" />
              )}
              {/* Bottom label for image ads */}
              {ad.image_url && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                <p className="text-white font-bold text-sm leading-tight drop-shadow line-clamp-1">{ad.title}</p>
                {ad.description && !ad.image_url && (
                  <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{ad.description}</p>
                )}
              </div>
              {ad.target_url && (
                <div className="absolute top-2 right-2 z-10 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  বিজ্ঞাপন
                </div>
              )}
            </div>
          )
          return ad.target_url ? (
            <a key={ad.id} href={ad.target_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 min-w-[200px]" onClick={() => trackAdClick(ad.id)}>
              {card}
            </a>
          ) : <div key={ad.id} className="flex-1 min-w-[200px]">{card}</div>
        })}
      </div>
    </div>
  )
}

// ── Popup Ad (shows once per session) ──────────────────────────────
function PopupAd({ ads }) {
  const [visible, setVisible] = useState(false)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!ads.length) return
    const key = 'popup_ad_seen_' + ads[0]?.id
    if (!sessionStorage.getItem(key)) {
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [ads])

  if (!visible || !ads[idx]) return null
  const ad = ads[idx]

  function close() {
    sessionStorage.setItem('popup_ad_seen_' + ads[0]?.id, '1')
    setVisible(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={close}>
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full animate-scaleIn"
        onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm font-bold transition-colors">
          ✕
        </button>

        {/* Image */}
        {ad.image_url ? (
          <div className="relative aspect-[3/2] w-full">
            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h3 className="text-white font-bold text-xl drop-shadow">{ad.title}</h3>
              {ad.description && <p className="text-white/85 text-sm mt-1">{ad.description}</p>}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <h3 className="font-bold text-xl">{ad.title}</h3>
            {ad.description && <p className="text-white/85 text-sm mt-1">{ad.description}</p>}
          </div>
        )}

        {/* CTA */}
        <div className="p-4 flex gap-3">
          {ad.target_url ? (
            <a href={ad.target_url} target="_blank" rel="noopener noreferrer" onClick={close}
              className="flex-1 text-center py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors">
              বিস্তারিত দেখুন
            </a>
          ) : (
            <Link to="/shops" onClick={close}
              className="flex-1 text-center py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors">
              দোকান দেখুন
            </Link>
          )}
          <button onClick={close}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            বন্ধ করুন
          </button>
        </div>

        {/* Multi-popup dots */}
        {ads.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-3">
            {ads.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-brand-500' : 'w-1.5 bg-gray-300'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Category Card Component with Enhanced Hover
function CategoryPill({ category }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 active:scale-95 w-[82px] sm:w-auto min-w-[76px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-start"
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />

      <div className="relative z-10 flex flex-col items-center">
        <span className="text-2xl sm:text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          {category.icon}
        </span>
        <span className="text-[11px] sm:text-xs font-medium text-gray-700 group-hover:text-brand-600 transition-colors mt-1.5 sm:mt-2 text-center leading-tight">
          {category.name}
        </span>
        <span className="text-[10px] text-gray-400 group-hover:text-brand-400 transition-colors mt-0.5">
          {category.shop_count || 0} দোকান
        </span>
      </div>
    </Link>
  )
}

/* ── Homepage Used Market (পুরাতন বাজার) Section ───────────────── */
function usedTimeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins || 1} মিনিট আগে`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ঘণ্টা আগে`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} দিন আগে`
  return new Date(iso).toLocaleDateString('bn-BD')
}

function HomeUsedMarketSection({ title, subtitle }) {
  const { data: allListings = [] } = usePublicListings()
  const listings = allListings.filter(l => l.status === 'approved').slice(0, 8)

  return (
    <section className="py-10 sm:py-14 bg-gradient-to-b from-emerald-50/70 to-white">
      <div className="container-app">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed tracking-tight flex items-center gap-2">
              ♻️ {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">{subtitle}</p>
          </div>
          <Link
            to="/used"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group flex-shrink-0">
            সব দেখুন
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Category quick-chips — one tap to a pre-filtered browse page */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {USED_CATEGORIES.slice(0, 6).map(cat => (
            <Link key={cat} to={`/used?cat=${encodeURIComponent(cat)}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 bg-white text-gray-700 border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors shadow-sm">
              {cat}
            </Link>
          ))}
          <Link to="/used"
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm">
            আরও দেখুন →
          </Link>
        </div>

        {listings.length === 0 ? (
          /* No listings yet — promo banner */
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-10 sm:py-12 text-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />
            <div className="relative z-10">
              <p className="text-3xl mb-2">♻️</p>
              <h3 className="text-white font-bold text-lg sm:text-xl mb-1">পুরাতন জিনিস বিক্রি করুন — সম্পূর্ণ ফ্রি</h3>
              <p className="text-emerald-100 text-sm mb-5">মোবাইল, ল্যাপটপ, ফার্নিচার, বাইক — যা খুশি, সরাসরি এলাকার মানুষের কাছে</p>
              <Link
                to="/used/post"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors shadow-lg">
                ➕ প্রথম বিজ্ঞাপনটি দিন
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal snap scroll · Desktop: grid */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
              {listings.map(l => {
                const img = Array.isArray(l.images) && l.images[0]
                const isNew = Date.now() - new Date(l.created_at).getTime() < 24 * 60 * 60 * 1000
                return (
                  <Link key={l.id} to={`/used/${l.id}`}
                    className="w-40 flex-shrink-0 snap-start sm:w-auto bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all overflow-hidden group">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {img ? (
                        <img src={img} alt={l.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">📦</div>
                      )}
                      {isNew && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          নতুন
                        </span>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {USED_CONDITION_LABELS[l.condition] || l.condition}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {l.title}
                      </p>
                      <p className="text-emerald-700 font-bold text-sm sm:text-base mt-0.5">
                        ৳{Number(l.price).toLocaleString('bn-BD')}
                        {l.negotiable && <span className="text-[9px] text-gray-400 font-normal ml-1">(আলোচনা)</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                        {l.location ? `📍 ${l.location} · ` : ''}{usedTimeAgo(l.created_at)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-5 text-center">
              <Link
                to="/used/post"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl transition-colors">
                + আপনার পুরাতন জিনিস বিক্রি করুন — ফ্রি
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/* ── Homepage Services Section ─────────────────────────────────── */
function HomeServicesSection() {
  /* স্থানীয় সেবা ডিরেক্টরি-র category — /services/:slug এর সাথে মিলে */
  const { data: dbCats = [] } = useDirectoryCategories()
  const cats = dbCats.slice(0, 10)
  /* ব্যবহারকারীর জমা দেওয়া সেবা — admin অনুমোদন করলেই এখানে চলে আসে */
  const { data: allProviders = [] } = useServices()
  const providers = allProviders.slice(0, 8)
  if (cats.length === 0 && providers.length === 0) return null

  return (
    <section className="py-10 sm:py-14 bg-white">
      <div className="container-app">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed tracking-tight">🛠️ প্রয়োজনীয় সেবাসমূহ</h2>
            <p className="text-sm text-gray-500 mt-1.5">শিবের বাজারের বিশ্বস্ত স্থানীয় সেবা প্রদানকারী</p>
          </div>
          <Link
            to="/services"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group flex-shrink-0">
            সব দেখুন
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {/* মোবাইলে পাশাপাশি স্ক্রল, ডেস্কটপে গ্রিড */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-5 md:grid-cols-10">
          {cats.map(cat => (
            <div key={cat.slug || cat.id} className="w-[78px] flex-shrink-0 snap-start sm:w-auto sm:flex-shrink">
              <ServiceCategoryCard category={cat} />
            </div>
          ))}
        </div>

        {/* সম্প্রতি অনুমোদিত সেবাদাতা — নতুন সেবা যোগ হলেই এখানে দেখা যাবে */}
        {providers.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-400 rounded-full" />
                সম্প্রতি যুক্ত সেবাদাতা
              </h3>
              <Link to="/services/all" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                সব সেবাদাতা →
              </Link>
            </div>
            {/* মোবাইলে পাশাপাশি স্ক্রল, ডেস্কটপে গ্রিড */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
              {providers.map(s => (
                <Link
                  key={s.id}
                  to={s.user_id ? `/services/provider/${s.user_id}` : `/services/detail/${s.id}`}
                  className="w-40 flex-shrink-0 snap-start sm:w-auto bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-3 flex flex-col items-center text-center group"
                >
                  <div className="relative mb-2">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name} loading="lazy"
                        className="w-14 h-14 rounded-full object-cover border-2 border-blue-50" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-xl text-blue-400">
                        {s.service_categories?.icon || '🛠️'}
                      </div>
                    )}
                    {s.is_verified && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center border-2 border-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-blue-700 transition-colors">
                    {s.name}
                  </p>
                  {s.service_categories?.name_bn && (
                    <p className="text-[11px] text-blue-600 mt-0.5 line-clamp-1">
                      {s.service_categories.icon} {s.service_categories.name_bn}
                    </p>
                  )}
                  {s.location && (
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">📍 {s.location}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 text-center">
          <Link
            to="/services/submit"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition-colors">
            + আপনার সেবা লিস্ট করুন — বিনামূল্যে
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchTab, setSearchTab] = useState('shops')
  const [isLoaded, setIsLoaded] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [announceDismissed, setAnnounceDismissed] = useState(false)
  const [announceVisible, setAnnounceVisible] = useState(false)

  const { data: stats, refetch: refetchStats } = useMarketStats()
  const { data: featuredShops = [], isLoading: isFeaturedLoading, refetch: refetchFeatured } = useFeaturedShops(8)
  const { data: latestShops = [], isLoading: isLatestLoading, refetch: refetchLatest } = useLatestShops(12)
  const { data: categories = [], refetch: refetchCategories } = useCategoryWithCount()
  const { data: ads = [] } = useActiveAds()
  const { data: cmsSettings = {} } = useSiteSettings()
  const { data: cmsSections = [] } = useHomeSections()

  // Build a quick lookup: slug → section data
  const sectionMap = Object.fromEntries(cmsSections.map(s => [s.section_slug, s]))

  // Returns true if a section is active (defaults to true if not in CMS yet)
  function sectionVisible(slug) {
    if (cmsSections.length === 0) return true // DB not seeded yet — show all
    const s = sectionMap[slug]
    return s ? s.is_active : true
  }

  // Returns CMS title/subtitle if set, otherwise falls back to provided default
  function sectionTitle(slug, fallback) {
    return sectionMap[slug]?.title || fallback
  }
  function sectionSubtitle(slug, fallback) {
    return sectionMap[slug]?.subtitle || fallback
  }

  // Sections in display_order; fall back to a fixed order if CMS is empty
  const FALLBACK_ORDER = ['hero','categories','banner_ads','featured_shops','latest_shops','used_market','services','cta']
  let orderedSlugs = cmsSections.length > 0
    ? cmsSections.filter(s => s.is_active).map(s => s.section_slug)
    : FALLBACK_ORDER

  // Newer sections may not have a CMS row yet (DB seeded before they existed) —
  // show them anyway, slotted before 'cta', until a row is added to control them
  if (cmsSections.length > 0) {
    const knownSlugs = cmsSections.map(s => s.section_slug)
    const missing = FALLBACK_ORDER.filter(slug => !knownSlugs.includes(slug))
    if (missing.length > 0) {
      const ctaIdx = orderedSlugs.indexOf('cta')
      orderedSlugs = ctaIdx === -1
        ? [...orderedSlugs, ...missing]
        : [...orderedSlugs.slice(0, ctaIdx), ...missing, ...orderedSlugs.slice(ctaIdx)]
    }
  }

  // Filter by date validity
  const today = new Date().toISOString().slice(0, 10)
  const validAds = ads.filter(a => {
    if (a.start_date && a.start_date > today) return false
    if (a.end_date   && a.end_date   < today) return false
    return true
  })

  // Filter by placement (new) or fall back to ad_type (legacy)
  const bannerAds  = validAds.filter(a => a.ad_placement
    ? a.ad_placement === 'homepage_banner'
    : a.ad_type === 'banner')
  const sidebarAds = validAds.filter(a => a.ad_placement
    ? a.ad_placement === 'sidebar'
    : a.ad_type === 'sidebar')
  const popupAds   = validAds.filter(a => a.ad_placement
    ? false   // popup placement type not used in homepage_banner/sidebar/grid
    : a.ad_type === 'popup')

  // Real-time subscriptions for auto-updates
  useEffect(() => {
    if (latestShops.length > 0 && !announceDismissed) {
      const t = setTimeout(() => setAnnounceVisible(true), 2500)
      return () => clearTimeout(t)
    }
  }, [latestShops.length])

  useEffect(() => {
    setIsLoaded(true)

    // Subscribe to shops changes
    const shopsChannel = supabase
      .channel('shops-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, () => {
        refetchStats()
        refetchFeatured()
        refetchLatest()
      })
      .subscribe()

    // Subscribe to products changes
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        refetchStats()
      })
      .subscribe()

    // Subscribe to categories changes
    const categoriesChannel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        refetchStats()
        refetchCategories()
      })
      .subscribe()

    // Subscribe to profiles changes
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refetchStats()
      })
      .subscribe()

    return () => {
      shopsChannel.unsubscribe()
      productsChannel.unsubscribe()
      categoriesChannel.unsubscribe()
      profilesChannel.unsubscribe()
    }
  }, [refetchStats, refetchFeatured, refetchLatest, refetchCategories])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}&tab=${searchTab}`)
    else navigate(`/search?tab=${searchTab}`)
  }

  const scrollToFeatured = () => {
    const element = document.getElementById('featured-shops')
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'শিবের বাজার — দোকান তালিকা',
    'description': 'সিলেটের শিবের বাজারের সকল দোকান',
    'url': 'https://shiberbazar.com/shops',
  }

  // ── Section render functions (closures over component state) ──

  function renderHero() {
    return (
      <section className="relative z-20 min-h-[320px] sm:min-h-[380px] flex items-center">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        
        {/* Animated Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl" />
        </div>

        <div className="container-app relative z-10 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
              {hcms(cmsSettings,'hero_title')}
            </h1>
            <p className="text-white/90 text-sm sm:text-base mb-8 max-w-xl mx-auto">
              {hcms(cmsSettings,'hero_subtitle')}
            </p>

            {/* Modern Search Bar */}
            <div className="max-w-xl mx-auto relative">
              {/* Tab Toggle */}
              <div className="flex justify-center gap-2 mb-3">
                {[
                  { key: 'shops', label: 'দোকান', icon: '🏪' },
                  { key: 'products', label: 'পণ্য', icon: '📦' },
                ].map(t => (
                  <button 
                    key={t.key} 
                    onClick={() => setSearchTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      searchTab === t.key
                        ? 'bg-white text-brand-600 shadow-lg'
                        : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Search Input with Dropdown */}
              <form onSubmit={handleSearch} className="relative group">
                <div className="flex rounded-2xl overflow-hidden shadow-2xl bg-white transform transition-transform duration-200 focus-within:scale-[1.02]">
                  <input
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={searchTab === 'shops' ? hcms(cmsSettings,'hero_search_placeholder_shop') : hcms(cmsSettings,'hero_search_placeholder_product')}
                    className="flex-1 px-5 py-4 text-gray-700 placeholder:text-gray-400 text-sm focus:outline-none"
                  />
                  {query && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setQuery('')
                        setShowDropdown(false)
                      }}
                      className="px-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="px-6 py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex-shrink-0 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="hidden sm:inline">খুঁজুন</span>
                  </button>
                </div>
                
                {/* Live Search Dropdown — all screen sizes */}
                {showDropdown && query.trim().length > 1 && (
                  <SearchDropdown
                    query={query}
                    onClose={() => { setShowDropdown(false) }}
                    searchTab={searchTab}
                  />
                )}
              </form>
            </div>

            {/* Featured shop quick-links */}
            {(featuredShops.length > 0 || latestShops.length > 0) && (
              <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                <span className="text-white/50 text-xs">জনপ্রিয়:</span>
                {(featuredShops.length > 0 ? featuredShops : latestShops).slice(0, 3).map(shop => (
                  <Link
                    key={shop.id}
                    to={`/shop/${shop.slug || shop.id}`}
                    className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
                  >
                    {(shop.logo || shop.logo_url)
                      ? <img src={shop.logo || shop.logo_url} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                      : <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                          {shop.shop_name?.[0]}
                        </span>
                    }
                    {shop.shop_name}
                  </Link>
                ))}
              </div>
            )}

            {/* Animated Stats */}
            {stats && (
              <div className="flex items-center justify-center gap-4 sm:gap-8 mt-6 flex-wrap">
                {[
                  { value: stats.totalShops, icon: '🏪', label: 'দোকান' },
                  { value: stats.totalProducts, icon: '📦', label: 'পণ্য' },
                  { value: stats.totalCategories, icon: '📋', label: 'ক্যাটাগরি' },
                  { value: stats.totalUsers, icon: '👥', label: 'সদস্য' },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center group cursor-default px-2">
                    <div className="flex items-center gap-1.5 text-white/90 text-sm sm:text-base">
                      <span className="group-hover:scale-110 transition-transform">{stat.icon}</span>
                      <span className="font-bold"><AnimatedCounter value={stat.value} suffix="+" /></span>
                    </div>
                    <span className="text-white/60 text-xs">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <button 
          onClick={scrollToFeatured}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 hover:text-white/80 transition-colors animate-bounce"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </section>
    )
  }

  function renderSponsorBanner() {
    return (
      <section className="py-2" style={{ background: '#fff5f5' }}>
        <div className="container-app">
          <a
            href="https://www.microvex.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-row items-center justify-between gap-2 rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-shadow"
            style={{ background: 'linear-gradient(135deg, #fff0f0 0%, #ffe4e4 100%)', border: '1.5px solid #ffc5c5' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff5757, #ff8c42)' }}>
                M
              </div>
              <div>
                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest mb-0">Sponsored by</p>
                <p className="text-sm font-bold leading-tight" style={{ color: '#ff5757' }}>Microvex<span className="text-gray-800">.</span></p>
                <p className="text-xs text-gray-500 hidden sm:block">Product Promotion &amp; Digital Solutions</p>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ff5757, #ff8c42)' }}
            >
              Visit Website
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </a>
        </div>
      </section>
    )
  }

  function renderCategories() {
    return (
      <section className="py-10 sm:py-14 bg-gray-50/50">
        <div className="container-app">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed tracking-tight">
                {sectionTitle('categories', 'ক্যাটাগরিসমূহ')}
              </h2>
              <p className="text-sm text-gray-500 mt-1.5">
                {sectionSubtitle('categories', 'আপনার পছন্দের ক্যাটাগরি বেছে নিন')}
              </p>
            </div>
            <Link
              to="/categories"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              সব দেখুন
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {/* মোবাইলে এক সারিতে পাশাপাশি স্ক্রল, ট্যাব/ডেস্কটপে গ্রিড */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 snap-x sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 sm:gap-4">
            {categories.map(cat => (
              <CategoryPill key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  function renderBannerAds() {
    return (
      <>
        {bannerAds.length  > 0 && <BannerAd ads={bannerAds} />}
        {sidebarAds.length > 0 && <SidebarAdStrip ads={sidebarAds} />}
      </>
    )
  }

  function renderFeaturedShops() {
    if (featuredShops.length === 0) return null
    return (
      <section id="featured-shops" className="py-10 sm:py-14 bg-gradient-to-b from-brand-50/50 to-white">
        <div className="container-app">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed tracking-tight">
                  {sectionTitle('featured_shops', 'ফিচার্ড দোকান')}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {sectionSubtitle('featured_shops', 'আমাদের বিশেষায়িত দোকানসমূহ')}
                </p>
              </div>
            </div>
            <Link
              to="/shops?featured=true"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              সব দেখুন
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {isFeaturedLoading
              ? Array.from({ length: 4 }).map((_, i) => <ShopCardSkeleton key={i} />)
              : featuredShops.map((shop, idx) => <ShopCard key={shop.id} shop={shop} featured index={idx} />)
            }
          </div>
        </div>
      </section>
    )
  }

  function renderLatestShops() {
    return (
      <section className="py-10 sm:py-14 bg-white">
        <div className="container-app">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed tracking-tight">
                  {sectionTitle('latest_shops', 'নতুন দোকান')}
                </h2>
                {/* সদ্য যুক্ত দোকানের সংখ্যা — তালিকার সাথে নিজে থেকেই বদলায় */}
                {latestShops.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex-shrink-0">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    {latestShops.length.toLocaleString('bn-BD')}টি নতুন
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                <span className="text-emerald-600">✨</span>
                {sectionSubtitle('latest_shops', 'সম্প্রতি যুক্ত হওয়া দোকানসমূহ')}
              </p>
            </div>
            <Link
              to="/shops"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 group flex-shrink-0 mt-1"
            >
              সব দেখুন
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {latestShops.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-20 h-20 mx-auto mb-4 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🏪</span>
              </div>
              <p className="text-gray-500 mb-4">এখনো কোনো দোকান নেই</p>
              <Link
                to="/dashboard/add-shop"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                প্রথম দোকান যোগ করুন
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 [&>*:nth-child(n+5)]:hidden sm:[&>*:nth-child(n+5)]:block">
              {/* মোবাইলে শুধু প্রথম ৪টি দেখায় — নিচের সেকশনগুলো যেন চাপা না পড়ে।
                  ট্যাব/ডেস্কটপে (sm+) সবগুলোই দেখায়। */}
              {isLatestLoading
                ? Array.from({ length: 8 }).map((_, i) => <ShopCardSkeleton key={i} />)
                : latestShops.map((shop, idx) => <ShopCard key={shop.id} shop={shop} index={idx} />)
              }
            </div>
          )}
          {/* মোবাইলে বাকি দোকানগুলো লুকানো থাকে — তাই এখানে পথ দেখিয়ে দিই */}
          {latestShops.length > 4 && (
            <div className="mt-5 text-center sm:hidden">
              <Link
                to="/shops"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 border border-brand-200 bg-brand-50 hover:bg-brand-100 px-5 py-2.5 rounded-xl transition-colors"
              >
                আরও {(latestShops.length - 4).toLocaleString('bn-BD')}টি দোকান দেখুন →
              </Link>
            </div>
          )}
        </div>
      </section>
    )
  }

  function renderServices() {
    return <HomeServicesSection />
  }

  function renderUsedMarket() {
    return (
      <HomeUsedMarketSection
        title={sectionTitle('used_market', 'পুরাতন বাজার')}
        subtitle={sectionSubtitle('used_market', 'পুরাতন জিনিস কিনুন-বিক্রি করুন — সরাসরি এলাকার মানুষের সাথে')}
      />
    )
  }

  function renderCTA() {
    return (
      <section className="relative py-16 pb-28 sm:py-20 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="container-app relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 bg-brand-800/50 rounded-full px-3 py-1 mb-4 border border-brand-700">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              {hcms(cmsSettings,'cta_badge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              {hcms(cmsSettings,'cta_title')}
            </h2>
            <p className="text-brand-200 text-sm sm:text-base mb-8 max-w-xl mx-auto">
              {hcms(cmsSettings,'cta_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand-900/20"
              >
                {hcms(cmsSettings,'cta_btn_primary')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                to="/shops"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-white font-semibold px-8 py-3.5 rounded-xl border-2 border-brand-600 hover:bg-brand-800/50 transition-all"
              >
                {hcms(cmsSettings,'cta_btn_secondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Section registry: slug → render function
  const SECTION_RENDERERS = {
    hero:           renderHero,
    categories:     renderCategories,
    banner_ads:     renderBannerAds,
    featured_shops: renderFeaturedShops,
    latest_shops:   renderLatestShops,
    used_market:    renderUsedMarket,
    services:       renderServices,
    cta:            renderCTA,
  }

  return (
    <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <SEO
        description="সিলেটের শিবের বাজারের সকল দোকান এক জায়গায়। খাবার, পোশাক, ইলেকট্রনিক্স, মুদিপণ্য সহ শতাধিক দোকান খুঁজুন, পণ্য দেখুন ও সরাসরি যোগাযোগ করুন। স্থানীয় ব্যবসার ডিজিটাল ঠিকানা।"
        jsonLd={homeJsonLd}
      />

      {/* Popup ad — overlay, not a section */}
      <PopupAd ads={popupAds} />

      {/* New shop announcement — floating card, not a section */}
      {latestShops.length > 0 && !announceDismissed && (() => {
        const newest = latestShops[0]
        return (
          <div
            className="hidden md:block fixed bottom-20 left-4 z-50 max-w-[260px] transition-all duration-500 ease-out md:bottom-6"
            style={{
              transform: announceVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
              opacity: announceVisible ? 1 : 0,
              pointerEvents: announceVisible ? 'auto' : 'none',
            }}
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                {(newest.logo || newest.logo_url)
                  ? <img src={newest.logo || newest.logo_url} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                      {newest.shop_name?.[0]}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-green-600 font-semibold">🎉 নতুন দোকান যোগ হয়েছে</p>
                  <p className="text-xs font-bold text-gray-900 truncate">{newest.shop_name}</p>
                  {newest.categories?.name && (
                    <p className="text-[10px] text-gray-400 truncate">{newest.categories.name}</p>
                  )}
                </div>
                <button
                  onClick={() => setAnnounceDismissed(true)}
                  className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 ml-1"
                  aria-label="বন্ধ করুন"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <Link
                to={`/shop/${newest.slug || newest.id}`}
                onClick={() => setAnnounceDismissed(true)}
                className="block text-center text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 py-1.5 transition-colors"
              >
                দোকান দেখুন →
              </Link>
            </div>
          </div>
        )
      })()}

      {/* Dynamic sections in CMS display_order */}
      {orderedSlugs.map(slug => {
        const fn = SECTION_RENDERERS[slug]
        if (!fn) return null
        return (
          <div key={slug}>
            {fn()}
            {/* Sponsor banner always follows hero */}
            {slug === 'hero' && renderSponsorBanner()}
          </div>
        )
      })}

      {/* Contact strip — fixed at bottom */}
      <section className="bg-white border-t border-gray-100 py-6">
        <div className="container-app">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{hcms(cmsSettings,'contact_address')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📞</span>
              <a href={`tel:${hcms(cmsSettings,'contact_phone')}`} className="font-medium text-blue-600 hover:underline">
                {hcms(cmsSettings,'contact_phone_display')}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span>💬</span>
              <a href={`https://wa.me/${hcms(cmsSettings,'whatsapp_number')}`} target="_blank" rel="noopener noreferrer"
                 className="font-medium text-green-600 hover:underline">
                WhatsApp করুন
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
