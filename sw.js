/* MeuMed · service worker (app shell offline + notificações de lembrete) */
const VERSION = 'meumed-v1.0.0';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // VLibras e outros serviços externos dinâmicos: sempre rede
  if (url.hostname.endsWith('vlibras.gov.br')) return;

  // Navegação: rede primeiro, cache como fallback (funciona offline)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { caches.open(VERSION).then((c) => c.put('./index.html', res.clone())); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Fontes do Google: cache primeiro
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Assets do próprio app: stale-while-revalidate
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './#/inicio';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(target).catch(() => {}); return c.focus(); }
      }
      return self.clients.openWindow(target);
    })
  );
});
