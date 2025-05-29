/**
 * Service Worker for DICOM Viewer v3
 * Provides offline caching and background sync
 */

const CACHE_NAME = 'dicom-viewer-v3-cache-v1';
const RUNTIME_CACHE = 'dicom-viewer-v3-runtime-v1';

// Files to cache immediately
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// Install event - cache essential files
self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(function() {
        console.log('[SW] Service worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(cacheName) {
              return cacheName.startsWith('dicom-viewer-v3-') && 
                     cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE;
            })
            .map(function(cacheName) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(function() {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip DICOM file requests (too large for cache)
  if (event.request.url.includes('/api/dicom/files/')) {
    return;
  }
  
  event.respondWith(
    // caches.open(RUNTIME_CACHE)
    //   .then(function(cache) {
    //     return cache.match(event.request)
    //       .then(function(response) {
    //         if (response) {
    //           // Serve from cache
    //           return response;
    //         }
            
    //         // Fetch from network and cache
    //         return fetch(event.request)
    //           .then(function(response) {
    //             // Only cache successful responses
    //             if (response && response.status === 200 && response.type === 'basic') {
    //               const responseToCache = response.clone();
    //               cache.put(event.request, responseToCache);
    //             }
    //             return response;
    //           })
    //           .catch(function(error) {
    //             console.log('[SW] Fetch failed:', error);
                
    //             // Return offline page for navigation requests
    //             if (event.request.mode === 'navigate') {
    //               return caches.match('/');
    //             }
                
    //             throw error;
    //           });
    //       });
    //     })
    // );
});

// Background sync for failed uploads
self.addEventListener('sync', function(event) {
  if (event.tag === 'dicom-upload') {
    console.log('[SW] Background sync: dicom-upload');
    
    event.waitUntil(
      // Handle background upload sync
      retryFailedUploads()
    );
  }
});

// Message handler for cache management
self.addEventListener('message', function(event) {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'CACHE_URLS':
        event.waitUntil(
          caches.open(RUNTIME_CACHE)
            .then(function(cache) {
              return cache.addAll(event.data.payload);
            })
        );
        break;
        
      case 'CLEAR_CACHE':
        event.waitUntil(
          caches.keys()
            .then(function(cacheNames) {
              return Promise.all(
                cacheNames.map(function(cacheName) {
                  return caches.delete(cacheName);
                })
              );
            })
        );
        break;
    }
  }
});

/**
 * Retry failed DICOM uploads
 */
async function retryFailedUploads() {
  try {
    // TODO: Implement retry logic for failed uploads
    console.log('[SW] Retrying failed uploads...');
    
    // This would typically:
    // 1. Get failed uploads from IndexedDB
    // 2. Retry uploading them
    // 3. Update status in IndexedDB
    
  } catch (error) {
    console.error('[SW] Error retrying uploads:', error);
  }
}