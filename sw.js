// Smart Ustaad — Service Worker v1.0
const CACHE = 'smart-ustaad-v1';

// Files jo offline bhi kaam karen
const OFFLINE_FILES = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Noto+Nastaliq+Urdu:wght@400;600;700&family=DM+Mono:wght@500&display=swap'
];

// Install — files cache karo
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      console.log('✅ SW: Caching files...');
      return cache.addAll(OFFLINE_FILES).catch(err => {
        console.log('Cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — purana cache hatao
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network first, cache fallback
self.addEventListener('fetch', e => {
  // Firebase aur API requests cache mat karo
  if(e.request.url.includes('firebase') ||
     e.request.url.includes('googleapis.com/ai') ||
     e.request.url.includes('generativelanguage')) {
    return fetch(e.request);
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Successful response cache mein save karo
        if(response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network fail — cache se do
        return caches.match(e.request).then(cached => {
          if(cached) return cached;
          // Offline fallback page
          return caches.match('/index.html');
        });
      })
  );
});

// Push notifications (future feature)
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  self.registration.showNotification(data.title || 'Smart Ustaad', {
    body: data.body || 'Naya update!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' }
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
