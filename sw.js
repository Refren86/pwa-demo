const staticCacheName = 's-app-v3'; // change the version to update the cache ^^
const dynamicCacheName = 'd-app-v3'; // change the version to update the cache ^^

const assetUrls = [
  'index.html',
  '/js/app.js',
  '/css/styles.css',
  'offline.html',
];

// here we cache out web app
self.addEventListener('install', async (event) => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(assetUrls);
});

// here we clear old version from cache and apply new one
self.addEventListener('activate', async (event) => {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name !== staticCacheName && name !== dynamicCacheName) // extract all cache names except current one
      .map((name) => caches.delete(name)) // remove filtered caches from cache storage
  );
});

// here we configure the cache strategy for all fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  const url = new URL(request.url); // will allow to operate easier with url

  // this is the requests where we get all static files, as request url is the same as app url
  if (url.origin === location.origin) {
    // cache-first strategy (static files):
    event.respondWith(cacheFirst(request));
    return;
  }

  // network-first strategy (api requests)
  event.respondWith(networkFirst(request));
});

// if request is cached - give it to the client, else fetch it
async function cacheFirst(request) {
  const cached = await caches.match(request); // check if cache already has info about current request
  return cached ?? (await fetch(request));
}

// check if we can get a data by fetching it, and if not - get it from the cache storage
async function networkFirst(request) {
  const cache = await caches.open(dynamicCacheName);

  try {
    const response = await fetch(request);
    await cache.put(request, response.clone()); // putting response for particular request into cache by cloning it
    return response;
  } catch (error) {
    // if request failed, try to get data from cache
    const cached = await cache.match(request);
    return cached ?? (await caches.match('/offline.html')); // and if there is no cached version, just return offline.html file
  }
}
