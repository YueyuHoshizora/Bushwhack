// Generated into /sw.js by tools/build-pages.mjs. Do not edit the generated file.
const CACHE = "bushwhack-shell-501d42a6005d";
const FILES = ["./","assets/pwa-icon-192.png","assets/pwa-icon-512.png","style.css?v=7738ed7c89","i18n.js?v=98ad428b4c","game.js?v=8640136c6e","favicon.ico?v=5f1563b6c2","assets/favicon.svg?v=26fa8956a8","assets/apple-touch-icon.png?v=5653f38f50","manifest.webmanifest?v=3c42c983e0","assets/pwa-icon-192.png?v=2aef9e5eed","assets/pwa-icon-512.png?v=01a855af32"];
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
