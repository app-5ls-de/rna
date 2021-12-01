importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.2.4/workbox-sw.js"
);
const { registerRoute, setDefaultHandler } = workbox.routing;
const { NetworkFirst, CacheFirst } = workbox.strategies;
const { cacheNames, setCacheNameDetails } = workbox.core;

setCacheNameDetails({ suffix: "v1" });

registerRoute(
  ({ url }) => url.origin == "https://cdn.jsdelivr.net",
  new CacheFirst()
);

setDefaultHandler(new NetworkFirst());

self.addEventListener("activate", (event) => {
  const cacheNamesArray = Object.values(cacheNames);
  event.waitUntil(
    caches.keys().then((userCacheNames) =>
      Promise.all(
        userCacheNames.map((cacheName) => {
          if (!cacheNamesArray.includes(cacheName))
            return caches.delete(cacheName);
        })
      )
    )
  );
});
