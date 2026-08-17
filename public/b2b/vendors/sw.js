// ═══════════════════════════════════════════════════════════════
// SERVICE WORKER — Portal Suplevet (unificado)
// Un solo SW en la raíz con scope "/" cubre el login y los dos paneles.
// Antes había uno por panel, cada uno con su propio caché y su propio
// ciclo de actualización.
// ═══════════════════════════════════════════════════════════════

// Subir este número invalida el caché de todos los dispositivos en la
// siguiente visita. Hay que subirlo cuando cambia algo del shell.
// v3: fix de seguridad en session.js (un vendedor dado de baja podía seguir
// entrando/renovando sesión) — hay que invalidar el caché para que llegue.
const CACHE = 'suplevet-portal-v3';

// Shell mínimo. Los assets de cada panel entran al caché solos, la primera
// vez que se piden (no los pre-cacheamos: son ~1 MB entre los dos y la
// mayoría de usuarios solo usa uno).
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  // tokens.css lo cargan los tres (login, vendedor, admin): sin él
  // ninguna pantalla tiene colores.
  './assets/css/tokens.css',
  './assets/css/login.css',
  './assets/js/session.js',
  './assets/js/a11y.js',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        // allSettled: que un asset ausente no tumbe toda la instalación.
        return Promise.allSettled(SHELL.map(function (url) { return cache.add(url); }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(
          names.filter(function (n) { return n !== CACHE; })
               .map(function (n) { return caches.delete(n); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var url;
  try { url = new URL(event.request.url); } catch (e) { return; }

  // Solo mismo origen. Supabase, Google Fonts y los CDN quedan fuera:
  // cachear respuestas de la API serviría datos viejos como si fueran
  // frescos, que es peor que no tener nada.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(event.request, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(event.request).then(function (hit) {
          if (hit) return hit;
          // Solo las navegaciones caen al shell. Devolver index.html en lugar
          // de un .css o un .js dejaría la página rota y sin explicación.
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return Response.error();
        });
      })
  );
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── PUSH ───────────────────────────────────────────────────────
self.addEventListener('push', function (event) {
  if (!event.data) return;

  var data;
  try { data = event.data.json(); } catch (e) { return; }

  var destino = data.url || (self.location.origin + '/');

  event.waitUntil(
    self.registration.showNotification(data.title || 'Suplevet', {
      body: data.body || '',
      icon: './assets/img/icon-192.png',
      badge: './assets/img/icon-192.png',
      tag: data.tag || 'suplevet',
      renotify: true,
      data: { url: destino }
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var destino = (event.notification.data && event.notification.data.url) ||
                (self.location.origin + '/');

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (list) {
        // Si ya hay una pestaña del portal abierta, se enfoca esa.
        // Antes se comparaba contra un dominio escrito a mano, así que
        // dejaba de funcionar en cuanto la app cambiaba de dirección.
        for (var i = 0; i < list.length; i++) {
          if (list[i].url.indexOf(self.location.origin) === 0) {
            return list[i].focus();
          }
        }
        return self.clients.openWindow(destino);
      })
  );
});
