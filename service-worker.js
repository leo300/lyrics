/* =====================================
   LYRICS FINDER PWA SERVICE WORKER
===================================== */
const CACHE_NAME = "lyrics-finder-v1";
const APP_FILES = ["./", "./index.html", "./style.css", "./script.js", "./manifest.json"];
/*
 INSTALL
*/
self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(APP_FILES);
    }));
    self.skipWaiting();
});
/*
 ACTIVATE
*/
self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => {
        return Promise.all(keys.map(key => {
            if (key !== CACHE_NAME) {
                return caches.delete(key);
            }
        }));
    }));
    self.clients.claim();
});
/*
 FETCH HANDLER
*/
self.addEventListener("fetch", event => {
    const request = event.request;
    /*
     API REQUESTS
     Always use network first
    */
    if (request.url.includes("lrclib.net")) {
        event.respondWith(fetch(request).catch(() => {
            return new Response(JSON.stringify({
                error: "Offline - lyrics unavailable"
            }), {
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }));
        return;
    }
    /*
     APP FILES
     Cache first
    */
    event.respondWith(caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(request, response.clone());
                return response;
            });
        });
    }));
});
