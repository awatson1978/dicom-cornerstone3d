// Service worker completely disabled for debugging
// This prevents the fetch errors we're seeing

console.log('📦 Service worker disabled for debugging');

// Don't intercept any requests - let them all pass through normally
self.addEventListener('fetch', function(event) {
  // Do nothing - let the browser handle all requests normally
  return;
});

self.addEventListener('install', function(event) {
  console.log('📦 Service worker installed (but disabled)');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('📦 Service worker activated (but disabled)');
  event.waitUntil(self.clients.claim());
});