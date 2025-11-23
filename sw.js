// sw.js - simple cache-first for assets, network-first for README
const CACHE_NAME = 'js-interview-static-v1';
const PRECACHE_URLS = [
  '/', '/index.html', '/manifest.json',
  // CDNs - optionally cache these too (some CDNs disallow cross origin caching)
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network first for README raw fetch so user can refresh
  if (url.hostname === 'raw.githubusercontent.com') {
    event.respondWith(
      fetch(event.request).then(resp => {
        // clone to cache
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return resp;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // For navigation and other assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // don't cache opaque responses unless needed
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return resp;
      }).catch(() => {
        // fallback for navigation to cached index
        if (event.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
