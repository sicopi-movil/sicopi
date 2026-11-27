/* SICOPI 4.3 — Service Worker: deja SICOPI usable sin conexión una vez instalado.
   Solo funciona en http(s), nunca en file:// ni content://. No toca los datos:
   IndexedDB sigue siendo la base; esto solo guarda los archivos en caché. */
const CACHE = 'sicopi-4.3-v3';
const CORE = [
  'sicopi_movil_4.3_instalable.html',
  'sicopi-manifest.json',
  'sicopi-icon-192.png',
  'sicopi-icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // La librería del escáner (unpkg) necesita internet la primera vez; luego queda en caché.
  if (url.origin === 'https://unpkg.com') {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(e.request).then((hit) =>
          hit || fetch(e.request).then((res) => { c.put(e.request, res.clone()); return res; })
        )
      )
    );
    return;
  }
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('sicopi_movil_4.3_instalable.html'));
    })
  );
});
