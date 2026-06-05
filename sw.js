const CACHE_NAME = 'paanya-v3';
const PRECACHE = [
  './index.html',
  './manifest.json',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icon-180.png',
];

// ── Install: precache core assets ──────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clear old caches ─────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for local, network-first for API/CDN ───────────────
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // ไม่ cache: Gemini API, JSONBin API
  if (url.includes('generativelanguage.googleapis.com') ||
      url.includes('jsonbin.io') ||
      url.includes('api.anthropic.com')) {
    return;
  }

  // Network-first: Google Fonts (ต้องการ online)
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first: ไฟล์ local ทั้งหมด
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
