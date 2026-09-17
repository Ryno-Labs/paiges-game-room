const CACHE = 'paige-game-room-six-month-v9-hero3';

const CORE_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/games/solitaire.js',
  './js/games/blocks.js'
];

const OPTIONAL_ASSETS = [
  './assets/paige-hero.png',
  './assets/victory-team.jpg',
  './assets/solitaire-card.jpg',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/favicon-32.png'
];

async function cacheOne(cache, url, required = false) {
  try {
    const response = await fetch(url, { cache: 'reload' });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    await cache.put(url, response);
    return true;
  } catch (error) {
    if (required) throw error;
    console.warn('Optional offline asset was not cached:', url, error);
    return false;
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE_SHELL.map(url => cacheOne(cache, url, true)));
    await Promise.allSettled(OPTIONAL_ASSETS.map(url => cacheOne(cache, url, false)));
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function staleWhileRevalidate(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request) || (fallbackUrl ? await cache.match(fallbackUrl) : null);
  const network = fetch(request)
    .then(async response => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) { void network; return cached; }
  const response = await network;
  return response || new Response('Offline', { status: 503, statusText: 'Offline' });
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(event.request, './index.html'));
    return;
  }
  const isCode = event.request.destination === 'script' || event.request.destination === 'style' || url.pathname.endsWith('.webmanifest');
  event.respondWith(isCode ? staleWhileRevalidate(event.request) : cacheFirst(event.request));
});
