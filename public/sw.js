const CACHE = "__VOXTEXTO_CACHE__";
const PRECACHE = /*__PRECACHE__*/ [];
const scope = new URL(self.registration.scope);
const index = new URL("index.html", scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE.map((path) => new URL(path, scope).href)),
      ),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("voxtexto-shell-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Only app assets, never audio, documents, blob URLs, POSTs or third-party requests.
  if (
    request.method !== "GET" ||
    url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname)
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(index, {
          cacheName: CACHE,
          ignoreVary: true,
        });
        return cached || Response.error();
      }),
    );
  } else if (/\.(js|css|wasm|woff2?|png|svg|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        // Vite/static hosts may send Vary: Origin. All these assets are same-origin,
        // and identical whether requested as a module (CORS) or by the precache loader.
        const cached = await cache.match(request, { ignoreVary: true });
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      })(),
    );
  }
});
