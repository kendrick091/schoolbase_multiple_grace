const CACHE_NAME = "schoolbase-cache-v7.6.4";
const urlsToCache = [
  "/",
  "/index.html",
  "/styleGpt.css",
  "/app.js",
  "/icons/logo-192.png",
  "/icons/logo-512.png"
];

// Install event → cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event → cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event → serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If cached, return from cache
      if (cachedResponse) {
        return cachedResponse;
      }

      // Else fetch from network and cache it
      return fetch(event.request)
        .then((response) => {
          // Don’t cache invalid responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          // Clone response and save to cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Fallback if offline and resource not cached
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
        });
    })
  );
});
