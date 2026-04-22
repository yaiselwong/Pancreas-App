// service-worker.js
// Nombre del cache (puedes cambiar la versión cada vez que actualices)
const CACHE_NAME = 'pancreas-app-v1';

// Archivos básicos para que la app cargue offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './404.html',
    './manifest.webmanifest',
    './css/app.css',
    './favicon.png',
    './Pancreatitisv02.styles.css', // Asegúrate de que este nombre sea el correcto
    './lib/bootstrap/dist/css/bootstrap.min.css',
    './js/indexedDb.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});