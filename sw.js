// Service Worker for FarmVoice AI - Offline Support

const CACHE_NAME = 'farmvoice-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/assistant.js',
  '/js/claude-api.js',
  '/js/home.js',
  '/js/livestock.js',
  '/js/storage.js',
  '/js/vaccine.js',
  '/js/vision.js',
  '/js/voice-engine.js',
  '/js/animal.js'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch((err) => {
        console.error('Cache install error:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For API requests, use network-first but allow offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          // Clone response
          const responseClone = response.clone();
          return responseClone;
        })
        .catch(() => {
          console.warn('API request failed, offline mode');
          return new Response(
            JSON.stringify({ error: 'Offline - API not available' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // For static assets, use cache-first with network fallback
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) return response;
        
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
      .catch(() => {
        console.warn('Static asset failed to load');
        return new Response('Not found', { status: 404 });
      })
  );
});
