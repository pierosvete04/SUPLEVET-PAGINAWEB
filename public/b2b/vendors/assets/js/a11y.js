/* ═══════════════════════════════════════════════════════════
   ACCESIBILIDAD COMPARTIDA — login, vendedor y admin
   ───────────────────────────────────────────────────────────
   El portal está construido con <div onclick="...">. Un div no
   recibe foco, no responde a Enter ni a Espacio y no se anuncia
   como control: quien navega con teclado simplemente no llega.

   La hoja de estilos ya tenía la regla :focus-visible para
   .nav-item, con un comentario que decía "se marca aquí para que
   el JS los haga enfocables" — pero ese JS no existía, así que la
   regla no llegaba a dispararse nunca. Esto es ese JS.

   Se aplica sobre el DOM ya escrito en vez de reescribir el HTML:
   son 48 items entre los dos paneles, y buena parte se genera
   desde JS después de cargar. Un MutationObserver recoge también
   los que aparecen más tarde.
   ═══════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // Elementos que se comportan como botón pero no lo son.
  var CLICKABLE = [
    '.nav-item',
    '.bn-item',
    '.bn-more-item',
    '.tab',
    '.ops-card',
    '.kpi-card[onclick]',
    '.exp',
    '.cli-tab',
    '.vdd-item',
    '.alert-cred-banner',
    '.mo .mc',
    '.cp-modo-btn'
  ].join(',');

  function esNativo(el) {
    var t = el.tagName;
    return t === 'BUTTON' || t === 'A' || t === 'INPUT' ||
           t === 'SELECT' || t === 'TEXTAREA' || t === 'SUMMARY';
  }

  /* Un control necesita nombre accesible. Si el texto visible es solo un
     icono (emoji, ×, ☰), el lector de pantalla lee "signo de multiplicación"
     o nada. En ese caso se busca un title o se deja marcado para revisar. */
  function tieneNombre(el) {
    if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return true;
    var txt = (el.textContent || '').replace(/[\s‍️]/g, '');
    if (!txt) return false;
    // ¿Queda algo además de símbolos e iconos?
    return /[a-záéíóúñü0-9]/i.test(txt);
  }

  /* Iconos sueltos que aparecen como único contenido de un botón, con el
     nombre que debería anunciar el lector de pantalla. */
  var NOMBRE_POR_ICONO = {
    '×': 'Cerrar', '✕': 'Cerrar', '✖': 'Cerrar', '⨯': 'Cerrar', '╳': 'Cerrar',
    '‹': 'Anterior', '❮': 'Anterior', '←': 'Anterior', '◀': 'Anterior',
    '›': 'Siguiente', '❯': 'Siguiente', '→': 'Siguiente', '▶': 'Siguiente',
    '☰': 'Más opciones', '⋯': 'Más opciones', '…': 'Más opciones',
    '🗑': 'Eliminar', '🗑️': 'Eliminar', '✎': 'Editar', '✏': 'Editar', '✏️': 'Editar',
    '+': 'Agregar', '＋': 'Agregar', '−': 'Quitar', '-': 'Quitar',
    '⟳': 'Actualizar', '↻': 'Actualizar', '🔄': 'Actualizar'
  };

  function nombrar(el) {
    if (!el || el.__a11yNombrado) return;
    el.__a11yNombrado = true;
    if (tieneNombre(el)) return;

    var t = el.getAttribute('title');
    if (t) { el.setAttribute('aria-label', t); return; }

    var icono = (el.textContent || '').trim();
    if (NOMBRE_POR_ICONO[icono]) { el.setAttribute('aria-label', NOMBRE_POR_ICONO[icono]); return; }

    // Botón de cerrar de un modal: la clase ya dice qué hace.
    if (el.classList.contains('mc')) el.setAttribute('aria-label', 'Cerrar');
  }

  function preparar(el) {
    if (!el || el.__a11yListo) return;
    el.__a11yListo = true;

    if (!esNativo(el)) {
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    }

    nombrar(el);
  }

  /* Enter y Espacio activan un botón. Se delega en el documento en vez de
     poner un listener por elemento: funciona igual con lo que se pinte
     después y no hay que acordarse de limpiar nada. */
  function alPulsarTecla(e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;

    var el = e.target;
    if (!el || esNativo(el)) return;          // el navegador ya lo maneja
    if (el.getAttribute('role') !== 'button') return;

    // Espacio hace scroll por defecto; en un botón eso no debe pasar.
    e.preventDefault();
    el.click();
  }

  function barrer(raiz) {
    var r = raiz || document;
    if (r.nodeType !== 1 && r.nodeType !== 9) return;

    var nodos = r.querySelectorAll(CLICKABLE);
    for (var i = 0; i < nodos.length; i++) preparar(nodos[i]);

    /* Cualquier otro div/span con onclick que no esté en la lista de arriba.
       Son los que se generan desde plantillas de JS (filas de tabla,
       tarjetas de cliente) y se olvidan uno a uno. */
    var sueltos = r.querySelectorAll('div[onclick],span[onclick],td[onclick],tr[onclick]');
    for (var j = 0; j < sueltos.length; j++) preparar(sueltos[j]);

    /* Botones y enlaces nativos: no necesitan rol ni tabindex, pero sí
       nombre. Los de cerrar modal ("×"), los de quitar fila ("🗑") y los
       de navegar ("‹" "›") se anuncian hoy como "signo de multiplicación"
       o directamente como "botón", sin más. */
    var nativos = r.querySelectorAll('button,a[href]');
    for (var k = 0; k < nativos.length; k++) nombrar(nativos[k]);
  }

  function iniciar() {
    barrer(document);
    document.addEventListener('keydown', alPulsarTecla, true);

    /* Lo que se pinta después de cargar (listas, tablas, modales) también
       tiene que quedar operable. */
    if (global.MutationObserver) {
      var obs = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var añadidos = muts[i].addedNodes;
          for (var j = 0; j < añadidos.length; j++) {
            if (añadidos[j].nodeType === 1) barrer(añadidos[j]);
          }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  /* ═════════════════════════════════════════════════════════
     MODALES
     Los .mo no se anunciaban como diálogo, el foco se quedaba
     detrás del overlay y al cerrar no volvía a donde estaba.
     ═════════════════════════════════════════════════════════ */

  var FOCUSABLES = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden])' +
                   ',select:not([disabled]),textarea:not([disabled])' +
                   ',[tabindex]:not([tabindex="-1"])';

  var pilaFoco = [];   // a dónde devolver el foco al cerrar cada modal

  function visibles(modal) {
    var todos = modal.querySelectorAll(FOCUSABLES);
    var out = [];
    for (var i = 0; i < todos.length; i++) {
      var r = todos[i].getBoundingClientRect();
      if (r.width > 0 || r.height > 0) out.push(todos[i]);
    }
    return out;
  }

  function marcarDialogo(modal) {
    if (modal.getAttribute('role') !== 'dialog') {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
    }
    // El título del modal da el nombre accesible del diálogo.
    if (!modal.getAttribute('aria-labelledby') && !modal.getAttribute('aria-label')) {
      var titulo = modal.querySelector('.mt2, .mt, .mh .ct');
      if (titulo) {
        if (!titulo.id) titulo.id = 'mt-' + (modal.id || Math.round(performance.now()));
        modal.setAttribute('aria-labelledby', titulo.id);
      }
    }
  }

  // Igual que visibles(), pero se detiene en el primer elemento que sirve en
  // vez de calcular getBoundingClientRect() de TODOS los focusables del
  // modal. Un modal con una tabla de cientos de filas (historial de un
  // cliente) tiene cientos de botones focusables detrás del campo que de
  // verdad nos interesa — recorrerlos todos en cada apertura era trabajo
  // desperdiciado, ya que el resultado casi siempre es uno de los primeros
  // controles del formulario, antes de llegar a la tabla.
  function primerFocusable(modal, excluirCerrar) {
    var candidatos = modal.querySelectorAll(FOCUSABLES);
    for (var i = 0; i < candidatos.length; i++) {
      var el = candidatos[i];
      if (excluirCerrar && el.classList.contains('mc')) continue;
      var r = el.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) return el;
    }
    return null;
  }

  /* ═════════════════════════════════════════════════════════
     BLOQUEO DE SCROLL DE FONDO
     overscroll-behavior:contain en .md (registrar-visita.css/app.css)
     sólo corta el "chaining" cuando la rueda del mouse está encima de la
     tarjeta del modal. En cuanto el cursor está sobre el área gris de
     alrededor (.mo, que cubre toda la pantalla pero no es scrolleable
     por sí misma), el evento de scroll sigue de largo hasta el body y
     mueve la lista de fondo — el modal de un cliente con muchas
     transacciones se sentía "atascado" porque no había forma de
     desplazarse dentro de él sin mover lo de atrás. Con varios modales
     apilables (poco común pero posible: cliente → editar cliente), se
     cuenta cuántos hay abiertos en vez de asumir que sólo hay uno, para
     no reactivar el scroll de fondo mientras el segundo sigue abierto.
     ═════════════════════════════════════════════════════════ */
  var _modalesAbiertos = 0;
  var _scrollBodyPrevio = null;

  function bloquearScrollFondo() {
    // alAbrir() ya incrementó el contador antes de llamar esto: en el primer
    // modal, _modalesAbiertos vale 1 aquí (no 0). Comparar con ">1" en vez de
    // "===1" bloqueaba de más; comparar con "0" nunca bloqueaba nada.
    if (_modalesAbiertos !== 1) return;
    var barraAncho = window.innerWidth - document.documentElement.clientWidth;
    _scrollBodyPrevio = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight };
    document.body.style.overflow = 'hidden';
    // Compensa el ancho de la scrollbar que desaparece: sin esto el
    // contenido salta unos px hacia la derecha al abrir el modal.
    if (barraAncho > 0) {
      var actual = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = (actual + barraAncho) + 'px';
    }
  }

  function desbloquearScrollFondo() {
    if (_modalesAbiertos > 0 || !_scrollBodyPrevio) return;
    document.body.style.overflow = _scrollBodyPrevio.overflow;
    document.body.style.paddingRight = _scrollBodyPrevio.paddingRight;
    _scrollBodyPrevio = null;
  }

  function alAbrir(modal) {
    marcarDialogo(modal);
    pilaFoco.push(document.activeElement);
    _modalesAbiertos++;
    bloquearScrollFondo();

    /* El fondo deja de ser alcanzable con Tab y deja de leerse.

       .contains(modal) NO es redundante: si un modal está anidado dentro de
       otro hijo de <body> (p.ej. dentro de <main>), marcar ese ancestro como
       inert deja inerte al propio modal — clics, foco, cursor y scroll
       muertos dentro de él. El usuario lo ve como "la página entera se
       trabó": ni la X, ni Editar, ni el clic fuera responden, y el puntero
       sale como flecha en vez de mano. Pasó exactamente eso con
       #modal-cli-ent / #modal-cli-edit / #modal-nuevo-cliente. Aunque esos
       tres ya se movieron a ser hijos directos de <body>, la guarda se queda:
       un modal nuevo mal ubicado no debe poder congelar la pantalla. */
    var hermanos = document.body.children;
    for (var i = 0; i < hermanos.length; i++) {
      if (hermanos[i] !== modal &&
          !hermanos[i].contains(modal) &&
          !hermanos[i].classList.contains('mo')) {
        hermanos[i].setAttribute('aria-hidden', 'true');
        if ('inert' in HTMLElement.prototype) hermanos[i].inert = true;
      }
    }

    // El foco entra al primer campo real, no al botón de cerrar: si el
    // modal es un formulario, lo primero que quieres es escribir.
    var primero = primerFocusable(modal, true) || primerFocusable(modal, false);
    (primero || modal).focus({ preventScroll: true });
  }

  function alCerrar(modal) {
    var hermanos = document.body.children;
    for (var i = 0; i < hermanos.length; i++) {
      hermanos[i].removeAttribute('aria-hidden');
      if ('inert' in HTMLElement.prototype) hermanos[i].inert = false;
    }
    var volver = pilaFoco.pop();
    if (volver && volver.focus) volver.focus({ preventScroll: true });
    _modalesAbiertos = Math.max(0, _modalesAbiertos - 1);
    desbloquearScrollFondo();
  }

  /* Tab circula dentro del modal en vez de salirse por detrás. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var modal = document.querySelector('.mo.open');
    if (!modal) return;

    var f = visibles(modal);
    if (!f.length) return;
    var primero = f[0], ultimo = f[f.length - 1];

    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault(); ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault(); primero.focus();
    } else if (!modal.contains(document.activeElement)) {
      e.preventDefault(); primero.focus();
    }
  }, true);

  /* No hay un evento "modal abierto": el estado es la clase .open, que
     ponen y quitan abrirModal()/cerrarModal() y varios sitios más. Se
     observa el atributo class en lugar de parchear cada llamada. */
  function vigilarModales() {
    if (!global.MutationObserver) return;
    var obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        var el = m.target;
        if (!el.classList || !el.classList.contains('mo')) return;
        var abierto = el.classList.contains('open');
        if (abierto === !!el.__a11yAbierto) return;   // sin cambio real
        el.__a11yAbierto = abierto;
        if (abierto) alAbrir(el); else alCerrar(el);
      });
    });
    document.querySelectorAll('.mo').forEach(function (m) {
      obs.observe(m, { attributes: true, attributeFilter: ['class'] });
    });
    // Modales que se inyectan después de cargar.
    new MutationObserver(function (muts) {
      muts.forEach(function (mu) {
        mu.addedNodes.forEach(function (n) {
          if (n.nodeType === 1 && n.classList && n.classList.contains('mo')) {
            obs.observe(n, { attributes: true, attributeFilter: ['class'] });
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', vigilarModales);
  } else {
    vigilarModales();
  }

  global.SVA11y = { preparar: preparar, barrer: barrer };

})(window);
