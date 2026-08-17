// ══════════════════════════════════════════════════════════════
// SESIÓN COMPARTIDA — Portal Suplevet
// ──────────────────────────────────────────────────────────────
// Único punto de autenticación de la app. Lo usan las tres capas:
//   /index.html        → login y resolución de rol
//   /admin/index.html  → guard de rol admin
//   /vendedor/index.html → guard de rol vendedor
//
// La sesión vive en UNA sola clave de storage con el rol dentro, así
// que entrar por el login deja al usuario listo en su panel sin volver
// a autenticarse.
// ══════════════════════════════════════════════════════════════
(function (global) {
  'use strict';

  var SB = 'https://bcahhdszzwearqaafhpa.supabase.co';
  var AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhoZHN6endlYXJxYWFmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODU0OTAsImV4cCI6MjA4OTg2MTQ5MH0.PpmQ5NygRvbItCqdfsO2D2Yb1oVoa7WikmMb8ByMfK0';

  var KEY = 'suplevet_session';
  // Claves de los paneles antiguos. Se limpian al arrancar para que nadie
  // quede con dos sesiones descoordinadas en el mismo navegador.
  var LEGACY_KEYS = ['sv_rep_v4', 'ctrl_session'];

  // El script siempre vive en <raíz>/assets/js/session.js, así que quitarle
  // ese sufijo a su propia URL da la raíz de la app funcione desde donde funcione.
  var BASE = (function () {
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/assets\/js\/session\.js.*$/, '');
    return './';
  })();

  // Refrescar el token antes de que expire (Supabase: 1h por defecto).
  // Sin esto, dejar el panel abierto más de una hora hace que todo empiece
  // a devolver 401 sin ningún aviso al usuario.
  var REFRESH_EVERY_MS = 45 * 60 * 1000;

  var _session = null;
  var _refreshTimer = null;

  // ── STORAGE ────────────────────────────────────────────────
  function _read() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (!raw) { try { raw = sessionStorage.getItem(KEY); } catch (e) {} }
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function _write(data, persist) {
    var s = JSON.stringify(data);
    try {
      if (persist) { localStorage.setItem(KEY, s); sessionStorage.removeItem(KEY); }
      else { sessionStorage.setItem(KEY, s); localStorage.removeItem(KEY); }
    } catch (e) {
      try { sessionStorage.setItem(KEY, s); } catch (e2) {}
    }
  }

  function _isPersistent() {
    try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
  }

  function _clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    LEGACY_KEYS.forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
      try { sessionStorage.removeItem(k); } catch (e) {}
    });
    _session = null;
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
  }

  // ── HTTP ───────────────────────────────────────────────────
  function _headers(token) {
    return {
      'Content-Type': 'application/json',
      'apikey': AK,
      'Authorization': 'Bearer ' + (token || AK)
    };
  }

  function _get(table, query, token) {
    return fetch(SB + '/rest/v1/' + table + (query ? '?' + query : ''), { headers: _headers(token) })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(r.status + ': ' + t); });
        return r.json();
      });
  }

  // ── RESOLUCIÓN DE ROL ──────────────────────────────────────
  // Admin gana sobre vendedor: si un id existe en ambas tablas, entra como
  // admin (es el permiso más amplio y evita dejarlo encerrado en el panel
  // de vendedor sin poder llegar a su panel real).
  function _resolveRole(userId, token) {
    return _get('admins', 'id=eq.' + userId + '&activo=eq.true&select=*', token)
      .then(function (rows) {
        if (rows && rows.length) {
          return { role: 'admin', user: rows[0] };
        }
        // activo=eq.true acá también: un vendedor dado de baja NO debe poder
        // loguearse aunque su fila siga existiendo. Antes solo se filtraba
        // para admins — un vendedor desactivado sí conseguía sesión nueva.
        return _get('vendedores', 'id=eq.' + userId + '&activo=eq.true&select=*', token)
          .then(function (vrows) {
            if (vrows && vrows.length) return { role: 'vendedor', user: vrows[0] };
            // Ni admin ni vendedor activo. Antes de decir "sin panel asignado"
            // (mensaje pensado para una cuenta que nunca tuvo acceso), hay que
            // distinguir el caso real: la fila existe pero está desactivada.
            // Sin esto un vendedor dado de baja veía el mismo mensaje genérico
            // que alguien que nunca tuvo cuenta, que confunde al usuario.
            return _get('vendedores', 'id=eq.' + userId + '&activo=eq.false&select=id', token)
              .then(function (bajaV) {
                if (bajaV && bajaV.length) return { code: 'baja' };
                return _get('admins', 'id=eq.' + userId + '&activo=eq.false&select=id', token)
                  .then(function (bajaA) {
                    if (bajaA && bajaA.length) return { code: 'baja' };
                    return null;
                  });
              });
          });
      });
  }

  // ── API PÚBLICA ────────────────────────────────────────────

  /**
   * Autentica contra Supabase y resuelve el rol.
   * Resuelve con {role, user}; rechaza con un Error cuyo .code es
   * 'bad_credentials' | 'no_role' | 'baja' | 'network'.
   */
  function login(email, password, persist) {
    return fetch(SB + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': AK },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (r) {
        if (r.status === 400 || r.status === 401) {
          var e = new Error('Credenciales incorrectas');
          e.code = 'bad_credentials';
          throw e;
        }
        if (!r.ok) {
          var e2 = new Error('No pudimos conectar con el servidor');
          e2.code = 'network';
          throw e2;
        }
        return r.json();
      })
      .then(function (auth) {
        return _resolveRole(auth.user.id, auth.access_token).then(function (resolved) {
          if (!resolved || resolved.code === 'baja') {
            var e = resolved && resolved.code === 'baja'
              ? new Error('Te han dado de baja')
              : new Error('Esta cuenta no tiene un panel asignado');
            e.code = resolved && resolved.code === 'baja' ? 'baja' : 'no_role';
            throw e;
          }
          _session = {
            role: resolved.role,
            user: resolved.user,
            token: auth.access_token,
            refresh: auth.refresh_token,
            ts: Date.now()
          };
          _write(_session, !!persist);
          return { role: resolved.role, user: resolved.user };
        });
      })
      .catch(function (err) {
        if (!err.code) { err.code = 'network'; }
        throw err;
      });
  }

  /**
   * Recupera la sesión guardada y renueva el token.
   * Resuelve con {role, user} o con null si no hay sesión utilizable.
   */
  function restore() {
    var saved = _read();
    if (!saved || !saved.refresh || !saved.role) return Promise.resolve(null);

    return fetch(SB + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': AK },
      body: JSON.stringify({ refresh_token: saved.refresh })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('refresh_failed');
        return r.json();
      })
      .then(function (auth) {
        // Releer el perfil para que cambios de zona, productos asignados o
        // una baja de vendedor se apliquen sin obligar a cerrar sesión.
        // activo=eq.true SIEMPRE (antes solo se aplicaba para admin): sin
        // esto, un vendedor dado de baja seguía renovando su sesión cada
        // 45 min indefinidamente y nunca era expulsado del panel.
        var table = saved.role === 'admin' ? 'admins' : 'vendedores';
        var q = 'id=eq.' + saved.user.id + '&select=*&activo=eq.true';
        return _get(table, q, auth.access_token)
          .then(function (rows) {
            if (!rows || !rows.length) {
              // La cuenta perdió el acceso (admin desactivado o vendedor borrado).
              var e = new Error('revoked');
              e.code = 'revoked';
              throw e;
            }
            _session = {
              role: saved.role,
              user: rows[0],
              token: auth.access_token,
              refresh: auth.refresh_token,
              ts: Date.now()
            };
            _write(_session, _isPersistent());
            _startAutoRefresh();
            return { role: _session.role, user: _session.user };
          })
          .catch(function (e) {
            if (e && e.code === 'revoked') throw e;
            // Falló releer el perfil pero el token es válido: seguimos con
            // los datos guardados en vez de expulsar al usuario.
            _session = {
              role: saved.role,
              user: saved.user,
              token: auth.access_token,
              refresh: auth.refresh_token,
              ts: Date.now()
            };
            _write(_session, _isPersistent());
            _startAutoRefresh();
            return { role: _session.role, user: _session.user };
          });
      })
      .catch(function () {
        _clear();
        return null;
      });
  }

  function _startAutoRefresh() {
    if (_refreshTimer) clearInterval(_refreshTimer);
    _refreshTimer = setInterval(function () {
      if (!_session || !_session.refresh) return;
      fetch(SB + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': AK },
        body: JSON.stringify({ refresh_token: _session.refresh })
      })
        .then(function (r) { if (!r.ok) throw new Error('refresh_failed'); return r.json(); })
        .then(function (auth) {
          _session.token = auth.access_token;
          _session.refresh = auth.refresh_token;
          _session.ts = Date.now();
          _write(_session, _isPersistent());
          // Mantener sincronizado el token que usan los helpers de cada panel.
          if (typeof global.AUTH_TOKEN !== 'undefined') global.AUTH_TOKEN = auth.access_token;
          if (typeof global.AUTH_REFRESH !== 'undefined') global.AUTH_REFRESH = auth.refresh_token;
        })
        .catch(function () { /* al siguiente ciclo se reintenta */ });
    }, REFRESH_EVERY_MS);
  }

  /**
   * Guard para las páginas de panel. Si no hay sesión o el rol no coincide,
   * manda al login y deja la promesa sin resolver (la página ya se va).
   * Resuelve con {role, user} cuando el acceso es legítimo.
   */
  function require(expectedRole) {
    return restore().then(function (s) {
      if (!s) { goToLogin(); return new Promise(function () {}); }
      if (s.role !== expectedRole) {
        // Sesión válida pero panel equivocado: lo llevamos al suyo.
        goToPanel(s.role);
        return new Promise(function () {});
      }
      return s;
    });
  }

  function goToLogin() { location.replace(BASE + 'index.html'); }

  function goToPanel(role) {
    location.replace(BASE + (role === 'admin' ? 'admin/' : 'vendedor/'));
  }

  function logout() {
    var token = _session && _session.token;
    // Revocar el refresh token en el servidor. Sin esto queda vivo y
    // reutilizable aunque el navegador ya no lo tenga.
    var done = fetch(SB + '/auth/v1/logout', {
      method: 'POST',
      headers: _headers(token)
    }).catch(function () {});
    _clear();
    return Promise.resolve(done).then(function () { goToLogin(); });
  }

  function current() { return _session; }
  function token() { return _session ? _session.token : null; }

  global.SVSession = {
    SB: SB,
    AK: AK,
    login: login,
    restore: restore,
    require: require,
    logout: logout,
    current: current,
    token: token,
    goToLogin: goToLogin,
    goToPanel: goToPanel,
    clearLegacy: function () {
      LEGACY_KEYS.forEach(function (k) {
        try { localStorage.removeItem(k); } catch (e) {}
        try { sessionStorage.removeItem(k); } catch (e) {}
      });
    }
  };
})(window);
