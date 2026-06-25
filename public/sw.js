// Bump this version on EVERY deploy to force SW update
const CACHE = 'shiberbazar-v6'

self.addEventListener('install', e => {
  // Skip waiting immediately — take over all tabs right away
  e.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', e => {
  // Nuke ALL old caches unconditionally, then claim all clients
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  // Never intercept Supabase or external API calls
  const url = e.request.url
  if (url.includes('supabase.co')) return
  if (url.includes('formsubmit.co')) return
  if (!url.startsWith(self.location.origin)) return

  // HTML / navigation → ALWAYS network, never cache
  if (e.request.mode === 'navigate' ||
      e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Static assets with content-hash filenames (JS/CSS/fonts) → cache-first
  // Safe because Vite gives them unique hashes — stale is impossible
  if (url.includes('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(e.request, clone))
          }
          return res
        })
      })
    )
    return
  }

  // Everything else (images, manifests, etc.) → network-first
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
})

/* ── Push Notifications ── */
self.addEventListener('push', e => {
  // Ping push (no payload) = new order notification
  let data = {
    title: '🛍️ শিবের বাজার',
    body:  'নতুন অর্ডার এসেছে! এখনই দেখুন।',
    url:   '/dashboard/orders',
  }
  try {
    if (e.data) data = { ...data, ...e.data.json() }
  } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      tag:     'new-order',        // replaces previous unread notification
      renotify: true,
      data:    { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.navigate(url)
          return c.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
