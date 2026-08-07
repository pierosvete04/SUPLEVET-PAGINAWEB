// ── PWA Service Worker ──
// El SW vive en la raíz del portal con scope "/" para cubrir el login y los
// dos paneles con un solo registro y un solo caché.
if('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('../sw.js', {scope: '/'})
      .then(function(reg){
        console.log('[SW] Registrado OK. Scope:', reg.scope);
        reg.addEventListener('updatefound', function(){
          var sw = reg.installing;
          sw.addEventListener('statechange', function(){
            if(sw.state === 'installed' && navigator.serviceWorker.controller){
              console.log('[SW] Nueva version disponible');
            }
          });
        });
      })
      .catch(function(err){ console.warn('[SW] Error al registrar:', err); });
  });
}
// ── PWA Install Prompt ──
var _pwaPrompt = null;
window.addEventListener('beforeinstallprompt', function(e){
  e.preventDefault();
  _pwaPrompt = e;
  var b = document.getElementById('install-banner');
  if(b) b.style.display = 'flex';
});
function installPWA(){
  var b = document.getElementById('install-banner');
  if(b) b.style.display = 'none';
  if(_pwaPrompt){
    _pwaPrompt.prompt();
    _pwaPrompt.userChoice.then(function(r){
      console.log('[PWA] Usuario eligio:', r.outcome);
      _pwaPrompt = null;
    });
  }
}
window.addEventListener('appinstalled', function(){
  var b = document.getElementById('install-banner');
  if(b) b.style.display = 'none';
  console.log('[PWA] App instalada correctamente');
});

// ===== PLAN SEMANAL =====
var _DIAS_LABELS=['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];
var _DIAS_KEYS=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];

// ═══════════════════════════════════════════════════════
// WEB PUSH NOTIFICATIONS — Suplevet
// ═══════════════════════════════════════════════════════
var VAPID_PUBLIC_KEY = 'BOPhRuWpTV6jRgkM3WTUAiEYDVeOspkWPE_P1XeXKm0ufOgbXom3pfk1yZ8vp2ojUkX_k_pa9du_PcGm29tu0Y0';

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
}

function registerPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (!CUR || !CUR.id) return;

  navigator.serviceWorker.ready.then(function(registration) {
    return registration.pushManager.getSubscription().then(function(existing) {
      if (existing) return existing;
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    });
  }).then(function(subscription) {
    if (!subscription) return;
    return fetch(SB + '/rest/v1/push_subscriptions?on_conflict=vendedor_id', {
      method: 'POST',
      headers: Object.assign({}, getHeaders(), {
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      }),
      body: JSON.stringify({
        vendedor_id: CUR.id,
        subscription: subscription.toJSON(),
        updated_at: new Date().toISOString()
      })
    });
  }).catch(function(err) {
    console.warn('[Push] No disponible o bloqueado:', err);
  });
}