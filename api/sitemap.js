/* Vercel serverless function — dynamic sitemap.xml
   The static public/sitemap.xml only listed 5 landing pages, so every shop,
   product, job, service and used listing was invisible to search engines.
   This builds the full list from the database on each request (cached 1h).
*/
import { createClient } from '@supabase/supabase-js'

const SITE = 'https://shiberbazar.com'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
// Anon key is enough — the sitemap only contains publicly readable rows
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

/* Static pages that always exist */
const STATIC_PAGES = [
  { loc: '/',              changefreq: 'daily',   priority: '1.0' },
  { loc: '/shops',         changefreq: 'daily',   priority: '0.9' },
  { loc: '/categories',    changefreq: 'weekly',  priority: '0.8' },
  { loc: '/used',          changefreq: 'daily',   priority: '0.8' },
  { loc: '/services',      changefreq: 'weekly',  priority: '0.8' },
  { loc: '/services/all',  changefreq: 'weekly',  priority: '0.7' },
  { loc: '/jobs',          changefreq: 'daily',   priority: '0.7' },
  { loc: '/hatkhula-union',changefreq: 'monthly', priority: '0.6' },
  { loc: '/emergency',     changefreq: 'monthly', priority: '0.6' },
  { loc: '/pricing',       changefreq: 'monthly', priority: '0.5' },
  { loc: '/contact',       changefreq: 'monthly', priority: '0.5' },
  { loc: '/policy',        changefreq: 'yearly',  priority: '0.3' },
]

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function urlTag({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${SITE}${esc(loc)}</loc>`,
    lastmod    ? `    <lastmod>${String(lastmod).slice(0, 10)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority   ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n')
}

export default async function handler(req, res) {
  const urls = [...STATIC_PAGES]

  try {
    const supabase = createClient(SUPABASE_URL, KEY)

    const [shops, categories, products, jobs, listings, services] = await Promise.all([
      supabase.from('shops')
        .select('slug, id, updated_at')
        .eq('status', 'approved').eq('is_active', true)
        .order('updated_at', { ascending: false }).limit(5000),

      supabase.from('categories')
        .select('slug').eq('is_active', true).limit(500),

      supabase.from('products')
        .select('id, updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false }).limit(5000),

      supabase.from('job_listings')
        .select('id, updated_at')
        .eq('is_active', true).eq('status', 'open').limit(1000),

      supabase.from('used_listings')
        .select('id, updated_at')
        .eq('status', 'approved')
        .order('updated_at', { ascending: false }).limit(2000),

      supabase.from('services')
        .select('id').eq('status', 'approved').limit(1000),
    ])

    for (const s of shops.data || []) {
      urls.push({ loc: `/shop/${s.slug || s.id}`, lastmod: s.updated_at, changefreq: 'weekly', priority: '0.8' })
    }
    for (const c of categories.data || []) {
      urls.push({ loc: `/category/${c.slug}`, changefreq: 'weekly', priority: '0.7' })
    }
    for (const p of products.data || []) {
      urls.push({ loc: `/product/${p.id}`, lastmod: p.updated_at, changefreq: 'weekly', priority: '0.6' })
    }
    for (const j of jobs.data || []) {
      urls.push({ loc: `/jobs/${j.id}`, lastmod: j.updated_at, changefreq: 'daily', priority: '0.6' })
    }
    for (const l of listings.data || []) {
      urls.push({ loc: `/used/${l.id}`, lastmod: l.updated_at, changefreq: 'weekly', priority: '0.6' })
    }
    for (const sv of services.data || []) {
      urls.push({ loc: `/services/detail/${sv.id}`, changefreq: 'weekly', priority: '0.5' })
    }
  } catch (err) {
    // Never fail the sitemap — fall back to the static pages so crawlers
    // still get a valid document instead of a 500
    console.error('[sitemap] db query failed:', err?.message)
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(urlTag),
    '</urlset>',
  ].join('\n')

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}
