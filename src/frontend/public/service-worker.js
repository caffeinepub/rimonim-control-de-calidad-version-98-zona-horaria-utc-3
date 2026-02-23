const CACHE_VERSION = 'v2';
const STATIC_CACHE = `rimonim-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `rimonim-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `rimonim-images-${CACHE_VERSION}`;

// Assets to cache on install - essential for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/generated/rimonim-ios-icon-180x180.dim_180x180.png',
  '/assets/generated/rimonim-ios-icon-167x167.dim_167x167.png',
  '/assets/generated/rimonim-ios-icon-152x152.dim_152x152.png',
  '/assets/generated/rimonim-ios-icon-120x120.dim_120x120.png',
  '/assets/generated/rimonim-ios-icon-76x76.dim_76x76.png',
  '/assets/generated/rimonim-ios-icon-60x60.dim_60x60.png',
  '/assets/generated/rimonim-ios-splash.dim_1024x1024.png',
  '/assets/Rimonim - F&V - Blanco - Alta.jpg',
  '/assets/Rimonim - F&V - Blanco - Alta-1.jpg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing PWA...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets for offline use');
        // Use addAll with error handling for iOS compatibility
        return Promise.all(
          STATIC_ASSETS.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, err);
              // Continue even if some assets fail
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[Service Worker] Installation failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that don't match current version
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - network-first strategy for dynamic content, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip canister API calls and backend requests - always use network
  if (url.pathname.includes('/api/') || 
      url.pathname.includes('canister') ||
      url.pathname.includes('?canisterId=')) {
    return;
  }

  // Handle different types of requests
  if (request.method !== 'GET') {
    // Only cache GET requests
    return;
  }

  // Cache strategy based on resource type
  if (isStaticAsset(url.pathname)) {
    // Cache-first for static assets (icons, images, fonts)
    event.respondWith(cacheFirst(request));
  } else if (isImageAsset(url.pathname)) {
    // Cache-first for images with separate cache
    event.respondWith(cacheFirstImage(request));
  } else {
    // Network-first for HTML and dynamic content
    event.respondWith(networkFirst(request));
  }
});

// Helper: Check if URL is a static asset
function isStaticAsset(pathname) {
  return pathname.includes('/assets/') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.ttf') ||
         pathname === '/manifest.json';
}

// Helper: Check if URL is an image
function isImageAsset(pathname) {
  return pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.webp') ||
         pathname.endsWith('.gif');
}

// Strategy: Cache-first for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache-first fetch failed:', error);
    // Return offline fallback if available
    return caches.match('/index.html');
  }
}

// Strategy: Cache-first for images with separate cache
async function cacheFirstImage(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Image fetch failed:', error);
    return new Response('Image not available offline', { status: 503 });
  }
}

// Strategy: Network-first for dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Network-first fetch failed:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Fallback to index.html for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    return new Response('Offline - content not available', { status: 503 });
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    console.log('[Service Worker] Received CLIENTS_CLAIM message');
    self.clients.claim();
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  // Future implementation for push notifications
});

// Handle notification clicks (future feature)
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();
  // Future implementation for notification actions
});

console.log('[Service Worker] Script loaded successfully');
