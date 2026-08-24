// Namespace legado preservado para manter caches e instalações PWA existentes.
// Consulte docs/brand/rebranding-migration.md antes de alterar.
const CACHE_PREFIX = 'biblioteca-digital-';
const CACHE_VERSION = 'v5';
const CACHES = {
  shell: `${CACHE_PREFIX}shell-${CACHE_VERSION}`,
  catalog: `${CACHE_PREFIX}catalog-${CACHE_VERSION}`,
  covers: `${CACHE_PREFIX}covers-${CACHE_VERSION}`,
  assets: `${CACHE_PREFIX}assets-${CACHE_VERSION}`,
  offline: `${CACHE_PREFIX}offline-v1`,
  config: `${CACHE_PREFIX}config-v1`
};
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/brand/araru-favicon.png'
];
let apiOrigin = self.location.origin;
let apiPathPrefix = '/api';
const CONFIG_REQUEST = new Request(new URL('/__biblioteca_api_config__', self.location.origin));

const applyApiConfig = (apiBaseUrl) => {
  const configured = new URL(apiBaseUrl);
  apiOrigin = configured.origin;
  apiPathPrefix = configured.pathname.replace(/\/$/, '') || '/api';
};

const apiConfigReady = caches.open(CACHES.config)
  .then((cache) => cache.match(CONFIG_REQUEST))
  .then((response) => response?.json())
  .then((config) => {
    if (config?.apiBaseUrl) applyApiConfig(config.apiBaseUrl);
  })
  .catch(() => {});

const apiPath = (url) => {
  if (url.origin !== apiOrigin || !url.pathname.startsWith(apiPathPrefix)) return null;
  return url.pathname.slice(apiPathPrefix.length) || '/';
};

const isCatalogRequest = (url) => (
  apiPath(url) === '/livros'
  || apiPath(url) === '/categorias'
  || apiPath(url)?.startsWith('/categorias/')
);

const isCoverRequest = (url) => (
  /^\/livros\/[^/]+\/capa$/.test(apiPath(url) || '')
);

const isStaticAsset = (request) => (
  ['script', 'style', 'font', 'worker'].includes(request.destination)
);

const isBookPayload = (request, url) => (
  url.origin === apiOrigin && (
    request.headers.has('range')
    || url.pathname.startsWith('/arquivos/')
    || /\/livros\/[^/]+\/(conteudo|paginas?|recursos)(\/|$)/.test(apiPath(url) || '')
  )
);

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CONFIGURE_API' || !event.data.apiBaseUrl) return;
  try {
    applyApiConfig(event.data.apiBaseUrl);
    event.waitUntil(caches.open(CACHES.config).then((cache) => cache.put(
      CONFIG_REQUEST,
      new Response(JSON.stringify({ apiBaseUrl: event.data.apiBaseUrl }), { headers: { 'Content-Type': 'application/json' } })
    )));
  } catch {
    // Mantém a configuração same-origin segura.
  }
});

const trimCache = async (cache, maxEntries) => {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
};

const cacheResponse = async (cache, request, response, maxEntries) => {
  const cacheControl = response?.headers?.get('cache-control') || '';
  if (response?.ok && !/no-store|private/i.test(cacheControl)) {
    await cache.put(request, response.clone());
    if (maxEntries) await trimCache(cache, maxEntries);
  }
  return response;
};

const networkFirst = async (request, cacheName, fallback) => {
  const cache = await caches.open(cacheName);

  try {
    return await cacheResponse(cache, request, await fetch(request), 100);
  } catch {
    return (await cache.match(request)) || fallback || new Response(JSON.stringify({ message: 'Servidor indisponível.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const staleWhileRevalidate = async (request, cacheName, maxEntries) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then((response) => cacheResponse(cache, request, response, maxEntries))
    .catch(() => null);

  return cached || update;
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHES.shell).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && !Object.values(CACHES).includes(key))
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

async function handleRequest(request) {
  await apiConfigReady;
  const url = new URL(request.url);

  if (url.origin === self.location.origin && request.mode === 'navigate') {
    return networkFirst(request, CACHES.shell, caches.match('/index.html'));
  }

  if (isBookPayload(request, url)) {
    return fetch(request).catch(async () => {
      const cache = await caches.open(CACHES.offline);
      return (await cache.match(request)) || new Response(JSON.stringify({ message: 'Livro não está disponível offline.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    });
  }

  if (isCatalogRequest(url)) return networkFirst(request, CACHES.catalog, null);
  if (isCoverRequest(url)) return staleWhileRevalidate(request, CACHES.covers, 200);
  if (url.origin === self.location.origin && isStaticAsset(request)) return staleWhileRevalidate(request, CACHES.assets, 80);
  return fetch(request);
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Recursos externos (por exemplo, capas da Open Library) devem seguir o
  // carregamento normal do navegador e a diretiva img-src. Interceptá-los os
  // transforma em fetch do worker, sujeito a connect-src, e gera falso 503.
  if (url.origin !== self.location.origin && url.origin !== apiOrigin) return;
  if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return;
  event.respondWith(handleRequest(event.request).catch(async () => {
    if (event.request.mode === 'navigate') {
      return (await caches.match('/index.html')) || new Response('Aplicação indisponível offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    return new Response(JSON.stringify({ message: 'Recurso indisponível.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }));
});
