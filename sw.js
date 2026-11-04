const CACHE_NAME = 'nexoralab-v2';

// Usamos rutas relativas a la raíz para evitar fallos de resolución
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-512.png'
];

// Instalación e instanciamiento del caché
self.addEventListener('install', event => {
  self.skipWaiting(); // Forzar la activación inmediata del nuevo SW
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Intentamos guardar recurso por recurso para que si falta una imagen no rompa todo el caché
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`No se pudo precargar en caché el recurso: ${url}`, err);
        }
      }
    })
  );
});

// Limpieza de cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Tomar control de todos los clientes abiertos de inmediato
  );
});

// Estrategia: Cache-First, fallback a Red, y fallback a index.html si todo falla
self.addEventListener('fetch', event => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Retornar recurso desde el caché local inmediatamente
      }

      // Si no está en caché, intentar traerlo de la red
      return fetch(event.request)
        .then(networkResponse => {
          // Si la respuesta es válida, la guardamos dinámicamente en el caché
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red y se solicita una navegación web, devolver la app principal de la caché
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
        });
    })
  );
});