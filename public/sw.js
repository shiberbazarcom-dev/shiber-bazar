const CACHE = 'shiberbazar-v3'

self.addEventListener('install', e => {
  // Don't precache anything — let the network provide fresh HTML on every load
  e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', e => {
  // Delete ALL old caches (v1, v2, etc.)
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  // Never intercept Supabase API calls
  if (e.request.url.includes('supabase.co')) return

  // HTML navigation requests (page loads / refreshes) → always network-first
  // This ensures index.html is always fresh after a new Vercel deploy
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    )
    return
  }

  // Static assets (JS/CSS/images have content-hash filenames) → cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return response
      })
    })
  )
})
