const CACHE = 'weekplan-v5';
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/base.css', './css/grid.css', './css/mini-cal.css', './css/blocks.css', './css/modal.css',
  './js/app.js', './js/dates.js', './js/store.js', './js/blocks.js',
  './js/notes.js', './js/sanitize.js', './js/targets.js', './js/week.js',
  './js/mini-cal.js', './js/gcal.js', './js/modal.js',
  './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
