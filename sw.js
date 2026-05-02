// Service Worker — кешує тільки статику, index.html завжди свіжий
const CACHE = 'ltava-static-v1';
const BASE = '/Ltava/';

// Тільки зовнішні бібліотеки — вони не змінюються
const STATIC = [
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn.jsdelivr.net/npm/vue@2.7.16/dist/vue.js',
  'https://unpkg.com/vue-the-mask@0.11.1/dist/vue-the-mask.js',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  BASE + 'manifest.json',
];

// Встановлення — кешуємо тільки статику
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

// Активація — видаляємо старі кеші
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch стратегія:
// - index.html, sw.js → завжди мережа, кеш тільки як запасний
// - все інше → кеш першим
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isIndex = url.pathname === BASE || url.pathname === BASE + 'index.html';
  const isSW    = url.pathname === BASE + 'sw.js';

  if (isIndex || isSW) {
    // Network-first: завжди намагаємось взяти свіже
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Оновлюємо кеш свіжою версією
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request)) // офлайн — старий кеш
    );
  } else {
    // Cache-first для статики
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
  }
});
