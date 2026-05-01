self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(Ltava-cache').then((cache) => {
            return cache.addAll([
                '/',
                '/Ltava/',
                '/Ltava/index.html',
                '/Ltava/assets/index.9d19f81e.js',
                '/Ltava/assets/index.7c801b86.css',
                '/Ltava/assets/favicon.4ad42837.ico'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
