const CACHE_NAME = 'pocketbizz-v1';
const OFFLINE_CACHE_NAME = 'pocketbizz-offline-v1';

// Essential URLs to cache for offline startup
const ESSENTIAL_URLS = [
  '/',
  '/index.html'
];

// Install event - cache essential URLs for offline startup
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  event.waitUntil(
    caches.open(OFFLINE_CACHE_NAME)
      .then((cache) => {
        console.log('Caching essential URLs for offline');
        return cache.addAll(ESSENTIAL_URLS);
      })
      .catch((error) => {
        console.error('Failed to cache essential URLs:', error);
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
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests - always fetch from network
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback - only for navigation requests
        // Don't serve HTML for JS/CSS/image requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        // For other resources, just fail gracefully
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
