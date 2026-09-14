const APP_CACHE = "cumbre-app-v1";
const TILE_CACHE = "cumbre-tiles-v1";
const TILE_HOSTS = ["tile.openstreetmap.org", "tile.opentopomap.org"];
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event)=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_CACHE).then(cache=> cache.addAll(APP_SHELL).catch(()=>{}))
  );
});

self.addEventListener("activate", (event)=>{
  self.clients.claim();
});

self.addEventListener("fetch", (event)=>{
  const url = new URL(event.request.url);

  // Teselas del mapa: cache primero, red como respaldo (funciona con respuestas opacas cross-origin)
  if(TILE_HOSTS.some(h=> url.hostname.endsWith(h))){
    event.respondWith(
      caches.open(TILE_CACHE).then(cache=>
        cache.match(event.request).then(cached=>{
          const fetchPromise = fetch(event.request).then(resp=>{
            cache.put(event.request, resp.clone());
            return resp;
          }).catch(()=> cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // App shell propia: red primero, cache como respaldo si no hay conexión
  if(url.origin === self.location.origin){
    event.respondWith(
      fetch(event.request).then(resp=>{
        const copy = resp.clone();
        caches.open(APP_CACHE).then(cache=> cache.put(event.request, copy));
        return resp;
      }).catch(()=> caches.match(event.request))
    );
  }
});
