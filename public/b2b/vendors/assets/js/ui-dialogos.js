/* ═══════════════════════════════════════════════════════════
   DIÁLOGOS DEL PORTAL — SVUI
   ───────────────────────────────────────────────────────────
   Reemplaza alert(), confirm() y prompt() nativos.

   Por qué:
   · Los botones nativos dicen "Aceptar" y "Cancelar". Delante de
     "¿Eliminar la ruta?", "Aceptar" no dice qué se acepta. Un
     botón debe llevar el nombre de lo que hace.
   · No se pueden estilar ni marcar como destructivos, así que
     borrar y guardar se ven exactamente igual.
   · prompt() no valida nada: devuelve texto libre y el que llama
     tiene que comprobarlo después, cuando ya se cerró y no puede
     decirle al usuario qué escribió mal.
   · En iOS instalado como PWA, alert() y prompt() bloquean el
     hilo y a veces no se pintan.

   El diálogo se construye con las clases que ya existen
   (.mo/.md/.mh/.mb/.mf), así que hereda el estilo del portal.
   La accesibilidad (role=dialog, foco atrapado, Escape, devolver
   el foco) la añade a11y.js al detectar la clase .mo — no hay
   que repetirla aquí.

   Uso:
     SVUI.confirmar({...}).then(function(ok){ if(ok) ... });
     SVUI.pedir({...}).then(function(v){ if(v!==null) ... });
     SVUI.avisar({...}).then(function(){ ... });
   ═══════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var contador = 0;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Construye el diálogo, lo abre y resuelve cuando el usuario decide.
     Se destruye al cerrar: son diálogos puntuales, no vale la pena
     mantener el nodo vivo ni arriesgarse a que quede estado pegado. */
  function abrir(opts) {
    return new Promise(function (resolve) {
      var id = 'svui-' + (++contador);
      var mo = document.createElement('div');
      mo.className = 'mo';
      mo.id = id;
      mo.style.zIndex = '10050';   // por encima de cualquier modal ya abierto

      var idTitulo = id + '-t';
      var idCampo  = id + '-c';
      var idError  = id + '-e';

      var cuerpo = '<p class="svui-msg">' + (opts.mensajeHTML || esc(opts.mensaje)) + '</p>';

      if (opts.tipo === 'pedir') {
        cuerpo +=
          '<div class="fgr svui-campo">' +
            '<label for="' + idCampo + '">' + esc(opts.etiqueta || 'Valor') + '</label>' +
            '<input id="' + idCampo + '" type="' + esc(opts.tipoCampo || 'text') + '"' +
              (opts.inputmode ? ' inputmode="' + esc(opts.inputmode) + '"' : '') +
              (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') +
              ' value="' + esc(opts.valor || '') + '"' +
              ' aria-describedby="' + idError + '"/>' +
            (opts.ayuda ? '<small class="svui-ayuda">' + esc(opts.ayuda) + '</small>' : '') +
            /* El error va junto al campo, no arriba del todo: así se lee
               sin tener que buscar a qué campo se refiere. */
            '<p class="svui-error" id="' + idError + '" role="alert" hidden></p>' +
          '</div>';
      }

      mo.innerHTML =
        '<div class="md" style="width:420px;max-width:94vw;">' +
          '<div class="mh">' +
            '<h2 class="mt2" id="' + idTitulo + '">' + esc(opts.titulo) + '</h2>' +
            '<button class="mc" type="button" data-svui="cancelar" aria-label="Cerrar">&times;</button>' +
          '</div>' +
          '<div class="mb">' + cuerpo + '</div>' +
          '<div class="mf">' +
            /* Un aviso solo tiene un botón: no hay nada que cancelar. */
            (opts.cancelar === null ? '' :
              '<button class="btn btn-s" type="button" data-svui="cancelar">' +
                esc(opts.cancelar || 'Cancelar') + '</button>') +
            '<button class="btn ' + (opts.peligro ? 'btn-d' : 'btn-p') + '" type="button" data-svui="ok">' +
              esc(opts.confirmar || 'Confirmar') + '</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(mo);
      mo.setAttribute('aria-labelledby', idTitulo);

      var campo  = mo.querySelector('#' + idCampo);
      var errorP = mo.querySelector('#' + idError);

      function cerrar(valor) {
        mo.classList.remove('open');
        // Se espera a que a11y.js devuelva el foco antes de quitar el nodo.
        setTimeout(function () {
          if (mo.parentNode) mo.parentNode.removeChild(mo);
        }, 60);
        resolve(valor);
      }

      function mostrarError(txt) {
        if (!errorP) return;
        errorP.textContent = txt;
        errorP.hidden = false;
        if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
      }

      function aceptar() {
        if (opts.tipo !== 'pedir') { cerrar(true); return; }

        var v = campo.value.trim();
        // La validación ocurre con el diálogo abierto: si algo está mal,
        // el usuario lo corrige sin volver a empezar.
        var fallo = opts.validar ? opts.validar(v) : null;
        if (fallo) { mostrarError(fallo); return; }
        cerrar(v);
      }

      mo.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-svui]') : null;
        if (b) {
          if (b.getAttribute('data-svui') === 'ok') aceptar();
          else cerrar(opts.tipo === 'pedir' ? null : false);
          return;
        }
        // Clic en el fondo = cancelar, igual que el resto de modales.
        if (e.target === mo) cerrar(opts.tipo === 'pedir' ? null : false);
      });

      mo.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { cerrar(opts.tipo === 'pedir' ? null : false); return; }
        // Enter en el campo confirma, como en cualquier formulario corto.
        if (e.key === 'Enter' && campo && e.target === campo) { e.preventDefault(); aceptar(); }
      });

      if (campo) {
        campo.addEventListener('input', function () {
          if (errorP && !errorP.hidden) {
            errorP.hidden = true;
            campo.setAttribute('aria-invalid', 'false');
          }
        });
      }

      /* En el siguiente tick, para que a11y.js observe el nodo antes de que
         cambie la clase. Se usa setTimeout y no requestAnimationFrame:
         rAF no se ejecuta si la pestaña está en segundo plano, y entonces
         el diálogo se quedaría creado pero nunca abierto — la promesa no
         resolvería jamás y la acción quedaría colgada. */
      setTimeout(function () { mo.classList.add('open'); }, 0);
    });
  }

  var SVUI = {
    /* Confirmación. `confirmar` es el texto del botón y debe nombrar la
       acción ("Eliminar ruta"), no decir "Aceptar". `peligro:true` lo
       pinta en rojo. */
    confirmar: function (o) {
      return abrir({
        tipo: 'confirmar',
        titulo: o.titulo || '¿Continuar?',
        mensaje: o.mensaje, mensajeHTML: o.mensajeHTML,
        confirmar: o.confirmar || 'Continuar',
        cancelar: o.cancelar || 'Cancelar',
        peligro: !!o.peligro
      });
    },

    /* Pide un dato. Resuelve con el texto, o con null si se cancela.
       `validar` recibe el valor y devuelve el mensaje de error o null. */
    pedir: function (o) {
      return abrir({
        tipo: 'pedir',
        titulo: o.titulo || 'Escribe un valor',
        mensaje: o.mensaje || '',
        etiqueta: o.etiqueta, tipoCampo: o.tipoCampo, inputmode: o.inputmode,
        placeholder: o.placeholder, valor: o.valor, ayuda: o.ayuda,
        validar: o.validar,
        confirmar: o.confirmar || 'Guardar',
        cancelar: o.cancelar || 'Cancelar'
      });
    },

    /* Aviso de un solo botón. Para lo que el usuario solo puede acusar. */
    avisar: function (o) {
      return abrir({
        tipo: 'avisar',
        titulo: o.titulo || 'Aviso',
        mensaje: o.mensaje, mensajeHTML: o.mensajeHTML,
        confirmar: o.confirmar || 'Entendido',
        cancelar: null
      }).then(function () { return undefined; });
    }
  };

  /* ═════════════════════════════════════════════════════════
     VALIDACIÓN EN LÍNEA
     ─────────────────────────────────────────────────────────
     Un alert() de validación tapa el formulario, no dice a qué
     campo se refiere y, al cerrarlo, el usuario tiene que
     recordar qué decía. El mensaje va junto al campo que falla
     y el foco salta al primero, que es donde hay que escribir.
     ═════════════════════════════════════════════════════════ */

  function contenedorDe(campo) {
    // .fgr es el grupo etiqueta+campo; si no existe, el propio padre.
    return campo.closest('.fgr') || campo.parentNode;
  }

  SVUI.limpiarError = function (campo) {
    if (typeof campo === 'string') campo = document.getElementById(campo);
    if (!campo) return;
    campo.setAttribute('aria-invalid', 'false');
    campo.removeAttribute('aria-describedby');
    var cont = contenedorDe(campo);
    var p = cont && cont.querySelector('.campo-error');
    if (p) p.remove();
  };

  SVUI.limpiarErrores = function (raiz) {
    var r = (typeof raiz === 'string' ? document.getElementById(raiz) : raiz) || document;
    r.querySelectorAll('.campo-error').forEach(function (p) { p.remove(); });
    r.querySelectorAll('[aria-invalid="true"]').forEach(function (c) {
      c.setAttribute('aria-invalid', 'false');
      c.removeAttribute('aria-describedby');
    });
  };

  SVUI.marcarError = function (campo, mensaje) {
    if (typeof campo === 'string') campo = document.getElementById(campo);
    if (!campo) return null;

    SVUI.limpiarError(campo);
    campo.setAttribute('aria-invalid', 'true');

    var p = document.createElement('p');
    p.className = 'campo-error';
    p.id = (campo.id || 'campo') + '-error';
    p.setAttribute('role', 'alert');
    p.textContent = mensaje;
    contenedorDe(campo).appendChild(p);
    campo.setAttribute('aria-describedby', p.id);

    // El error se borra en cuanto el usuario toca el campo: seguir viendo
    // "obligatorio" mientras escribes es ruido.
    if (!campo.__svuiLimpia) {
      campo.__svuiLimpia = true;
      var limpiar = function () { SVUI.limpiarError(campo); };
      campo.addEventListener('input', limpiar);
      campo.addEventListener('change', limpiar);
    }
    return campo;
  };

  /* Valida una lista de reglas. Marca todas las que fallen, lleva el foco
     a la primera y devuelve true solo si el formulario está completo.
     reglas: [{campo:'v-vete', si:function(v){return !v}, error:'...'}] */
  SVUI.validar = function (reglas) {
    var primero = null;
    for (var i = 0; i < reglas.length; i++) {
      var r = reglas[i];
      if (r.saltar) continue;
      var el = typeof r.campo === 'string' ? document.getElementById(r.campo) : r.campo;
      if (!el) continue;
      if (r.si(el.value)) {
        SVUI.marcarError(el, r.error);
        if (!primero) primero = el;
      } else {
        SVUI.limpiarError(el);
      }
    }
    if (primero) {
      primero.focus({ preventScroll: false });
      primero.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return false;
    }
    return true;
  };

  /* ═════════════════════════════════════════════════════════
     MENSAJES DE ERROR
     ─────────────────────────────────────────────────────────
     Casi medio centenar de sitios mostraban al vendedor cosas
     como "Error: Failed to fetch", "Error: 401" o
     "No se pudo completar la operación. Detalle: JSON object
     requested, multiple (or no) rows returned".

     Eso no le sirve a nadie: no dice qué pasó en sus términos
     ni qué puede hacer. Y de paso enseña detalles internos del
     backend a cualquiera que mire la pantalla.

     SVUI.error() traduce a un mensaje accionable y deja el
     detalle técnico en la consola, que es donde hace falta
     cuando hay que depurar.

       .catch(function(e){ setSt(SVUI.error(e,'guardar la venta'),'er'); })
       → "No pudimos guardar la venta. Revisa tu conexión e
          inténtalo otra vez."
     ═════════════════════════════════════════════════════════ */

  function codigoDe(e) {
    if (!e) return 'desconocido';
    var txt = String(e.message || e.msg || e || '');
    var st  = e.status || e.statusCode || 0;

    // Un número suelto al principio suele ser el status HTTP.
    var m = txt.match(/^\s*(\d{3})\b/);
    if (!st && m) st = parseInt(m[1], 10);

    if (/Failed to fetch|NetworkError|Load failed|ERR_INTERNET|ERR_NETWORK/i.test(txt)) return 'sin-red';
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'sin-red';
    if (st === 401 || st === 403 || /JWT|token|not authorized|permission denied/i.test(txt)) return 'sesion';
    if (st === 409 || /duplicate key|already exists|unique constraint/i.test(txt)) return 'duplicado';
    if (st === 404) return 'no-existe';
    if (st === 413 || /too large|payload/i.test(txt)) return 'muy-grande';
    if (st === 429) return 'muchos-intentos';
    if (st >= 500) return 'servidor';
    if (/timeout|timed out|abort/i.test(txt)) return 'lento';
    return 'desconocido';
  }

  /* {accion} se sustituye por lo que el usuario intentaba hacer, en
     infinitivo: "guardar la venta", "cargar tu historial". */
  var TEXTOS = {
    'sin-red':        'No pudimos {accion}: parece que te quedaste sin conexión. Revísala e inténtalo otra vez — lo que escribiste sigue aquí.',
    'sesion':         'Tu sesión caducó. Vuelve a ingresar para {accion}.',
    'duplicado':      'Ya existe un registro con esos datos. Revísalos antes de {accion}.',
    'no-existe':      'No encontramos ese registro. Puede que alguien lo haya borrado mientras trabajabas.',
    'muy-grande':     'El archivo pesa demasiado. Prueba con una foto más ligera.',
    'muchos-intentos':'Demasiados intentos seguidos. Espera un momento y vuelve a probar.',
    'servidor':       'El servidor no respondió. Espera unos segundos e inténtalo otra vez.',
    'lento':          'La conexión va muy lenta y se agotó el tiempo. Inténtalo otra vez.',
    'desconocido':    'No pudimos {accion}. Inténtalo otra vez; si vuelve a fallar, avisa al administrador.'
  };

  SVUI.error = function (e, accion) {
    var codigo = codigoDe(e);
    var txt = TEXTOS[codigo] || TEXTOS.desconocido;

    // Sin acción concreta, la frase tiene que seguir leyéndose bien.
    txt = txt.replace('{accion}', accion || 'completar la operación');
    // "No pudimos completar la operación: parece que..." → mejor sin dos puntos
    // cuando la acción es genérica.
    txt = txt.replace('No pudimos completar la operación:', 'No pudimos completar la operación —');

    // El detalle real va a la consola, no a la pantalla del vendedor.
    if (global.console && console.error) {
      console.error('[' + codigo + ']' + (accion ? ' al ' + accion : ''), e);
    }
    return txt;
  };

  /* ═════════════════════════════════════════════════════════
     GRUPO DE OPCIONES ÚNICAS (radiogroup)
     ─────────────────────────────────────────────────────────
     Para selectores tipo "seis tarjetas, una activa a la vez"
     (el tipo de movimiento en Registrar Visita, por ejemplo).
     Antes eran <div onclick> con role="button" genérico — un
     lector de pantalla los anunciaba como botones sueltos, sin
     decir que formaban un grupo ni cuál estaba marcado.

     Pone el teclado (flechas mueven Y seleccionan, como un
     <input type=radio> nativo; Inicio/Fin saltan a los extremos;
     Enter/Espacio confirman) y el roving tabindex (solo la
     opción activa es alcanzable con Tab). El HTML ya debe traer
     role="radiogroup" en el contenedor y role="radio" en cada
     opción — esto solo añade el comportamiento.

       SVUI.radiogroup(document.getElementById('mv-tipo-grid'), {
         onSelect: function(el){ mvSelTipo(el.dataset.tipo, el); }
       });

     Llamar a .sync() después de cambiar la selección por código
     (sin pasar por el teclado/clic) para que aria-checked y el
     tabindex reactivo se mantengan correctos.
     ═════════════════════════════════════════════════════════ */
  SVUI.radiogroup = function (contenedor, opts) {
    if (!contenedor) return null;
    opts = opts || {};
    var onSelect = opts.onSelect || function () {};
    var esActivo = opts.isChecked || function (el) { return el.classList.contains('sel'); };

    function opciones() {
      return Array.prototype.slice.call(contenedor.querySelectorAll('[role="radio"]'));
    }

    // Sincroniza aria-checked y el roving tabindex con la clase .sel real.
    // Sin una opción marcada, la primera queda como destino de Tab.
    function sync() {
      var ops = opciones();
      var activo = null;
      for (var i = 0; i < ops.length; i++) { if (esActivo(ops[i])) { activo = ops[i]; break; } }
      if (!activo) activo = ops[0];
      ops.forEach(function (o) {
        o.setAttribute('aria-checked', esActivo(o) ? 'true' : 'false');
        o.tabIndex = (o === activo) ? 0 : -1;
      });
    }

    function mover(actual, delta) {
      var ops = opciones();
      var i = ops.indexOf(actual);
      if (i < 0) return;
      var siguiente = ops[(i + delta + ops.length) % ops.length];
      siguiente.focus();
      siguiente.click(); // como un radio nativo: la flecha selecciona, no solo mueve el foco
    }

    contenedor.addEventListener('keydown', function (e) {
      var el = e.target.closest ? e.target.closest('[role="radio"]') : null;
      if (!el || !contenedor.contains(el)) return;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown':
          e.preventDefault(); mover(el, 1); break;
        case 'ArrowLeft': case 'ArrowUp':
          e.preventDefault(); mover(el, -1); break;
        case 'Home': {
          e.preventDefault();
          var primero = opciones()[0];
          if (primero) { primero.focus(); primero.click(); }
          break;
        }
        case 'End': {
          e.preventDefault();
          var ops2 = opciones(), ultimo = ops2[ops2.length - 1];
          if (ultimo) { ultimo.focus(); ultimo.click(); }
          break;
        }
        case 'Enter': case ' ': case 'Spacebar':
          e.preventDefault(); onSelect(el); break;
      }
    });

    contenedor.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[role="radio"]') : null;
      if (el && contenedor.contains(el)) onSelect(el);
    });

    sync();
    return { sync: sync };
  };

  global.SVUI = SVUI;

})(window);
