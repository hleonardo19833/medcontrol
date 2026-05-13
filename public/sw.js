// MedControl Service Worker
const CACHE_NAME = 'medcontrol-v1'
const STATIC_ASSETS = ['/', '/dashboard', '/icons/icon-192x192.png']

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return res
      })
      .catch(() => caches.match(event.request))
  )
})

// Push notification received
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'medcontrol',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: true,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const doseId = event.notification.data?.doseId
  const url = event.notification.data?.url || '/dashboard'

  if (action === 'confirm' && doseId) {
    // Confirm dose via API without opening browser
    event.waitUntil(
      fetch(`/api/doses/${doseId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'taken' }),
      }).then(() => {
        self.registration.showNotification('✅ Dose confirmada!', {
          body: 'Ótimo! Continue assim.',
          icon: '/icons/icon-192x192.png',
          tag: 'dose-confirmed',
          requireInteraction: false,
        })
      })
    )
    return
  }

  if (action === 'snooze' && doseId) {
    // Show reminder after 10 minutes
    event.waitUntil(
      new Promise(resolve => {
        setTimeout(async () => {
          await self.registration.showNotification('⏰ Lembrete de dose', {
            body: 'Não se esqueça de tomar seu remédio!',
            icon: '/icons/icon-192x192.png',
            tag: `snooze-${doseId}`,
            data: { doseId, url },
            requireInteraction: true,
          })
          resolve()
        }, 10 * 60 * 1000)
      })
    )
    return
  }

  // Open app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(url)
      } else {
        self.clients.openWindow(url)
      }
    })
  )
})
