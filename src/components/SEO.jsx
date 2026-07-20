/**
 * SEO — zero-dependency per-page meta tag manager.
 * Uses useEffect to directly update <head> tags on every route change.
 * Works with React Router v6 BrowserRouter (no SSR needed for Google indexing).
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteSettings } from '../hooks/useSettings'

export const SITE_URL  = 'https://shiber-bazar.vercel.app'
export const SITE_NAME = 'শিবের বাজার'
const DEFAULT_DESC = 'সিলেটের শিবের বাজারের সকল দোকান এক জায়গায়। খাবার, পোশাক, ইলেকট্রনিক্স, মুদিপণ্য সহ শতাধিক দোকান খুঁজুন, পণ্য দেখুন ও সরাসরি যোগাযোগ করুন।'
const DEFAULT_IMG  = `${SITE_URL}/logo.png`

/* ── helpers ── */
function setMeta(nameOrProp, content, attr = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${nameOrProp}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, nameOrProp)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  if (!href) return
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(data) {
  document.querySelector('script[data-role="jsonld"]')?.remove()
  if (!data) return
  const s = document.createElement('script')
  s.type = 'application/ld+json'
  s.setAttribute('data-role', 'jsonld')
  s.textContent = JSON.stringify(data)
  document.head.appendChild(s)
}

/* ── component ── */
export default function SEO({
  title,                        // page-specific title (site name appended automatically)
  description = DEFAULT_DESC,
  image       = DEFAULT_IMG,
  type        = 'website',
  noindex     = false,
  jsonLd      = null,
}) {
  const { pathname } = useLocation()
  const { data: s = {} } = useSiteSettings()

  const siteName = (s['site_name'] && s['site_name'] !== '') ? s['site_name'] : SITE_NAME
  const siteTagline = s['site_tagline'] || 'আপনার স্থানীয় বাজারের ডিজিটাল ঠিকানা'
  const siteUrl = (s['site_url'] && s['site_url'] !== '') ? s['site_url'] : SITE_URL
  const cmsDesc = (s['meta_description'] && s['meta_description'] !== '') ? s['meta_description'] : null
  const cmsImg = (s['og_image_url'] && s['og_image_url'] !== '') ? s['og_image_url'] : null

  const resolvedDesc = cmsDesc || description
  const resolvedImg  = cmsImg  || image

  const fullTitle = title
    ? `${title} — ${siteName}`
    : `${siteName} — ${siteTagline}`
  const canonical = `${siteUrl}${pathname}`

  useEffect(() => {
    // Title
    document.title = fullTitle

    // Standard
    setMeta('description',     resolvedDesc)
    setMeta('robots',          noindex ? 'noindex,nofollow' : 'index,follow')

    // Open Graph
    setMeta('og:title',        fullTitle,     'property')
    setMeta('og:description',  resolvedDesc,  'property')
    setMeta('og:url',          canonical,     'property')
    setMeta('og:image',        resolvedImg,   'property')
    setMeta('og:type',         type,          'property')
    setMeta('og:site_name',    siteName,      'property')
    setMeta('og:locale',       'bn_BD',       'property')

    // Twitter Card
    setMeta('twitter:card',        'summary_large_image')
    setMeta('twitter:title',       fullTitle)
    setMeta('twitter:description', resolvedDesc)
    setMeta('twitter:image',       resolvedImg)

    // Canonical
    setLink('canonical', canonical)

    // JSON-LD structured data
    setJsonLd(jsonLd)
  }, [fullTitle, resolvedDesc, resolvedImg, canonical, type, noindex, jsonLd, siteName])

  return null
}
