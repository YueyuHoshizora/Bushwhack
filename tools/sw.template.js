// Generated into /sw.js by tools/build-pages.mjs. Do not edit the generated file.
const CACHE = __CACHE_NAME__;
const FILES = __FILES__;
const HOME = new URL('./', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new URL(file, HOME).href))));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('bushwhack-shell-') && key !== CACHE)
    .map(key => caches.delete(key)))));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(HOME)) || Response.error();
    }));
    return;
  }
  // Only versioned shell assets are cached; never cache arbitrary same-origin requests.
  event.respondWith(caches.open(CACHE).then(async cache =>
    (await cache.match(event.request)) || fetch(event.request)));
});
