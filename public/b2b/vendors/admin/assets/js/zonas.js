// ══════════════════════════════════════════════════════════════
// ZONAS
// ──────────────────────────────────────────────────────────────
// Antes esto vivía en dashboard.js y pintaba cada zona dos veces:
// una tarjeta de reporte arriba y otra tarjeta abajo que listaba
// entera la cartera de clínicas. Con 15 zonas la página medía
// varias pantallas y los dos bloques nunca cuadraban entre sí
// porque uno filtraba por mes y el otro no.
//
// Aquí la zona es una fila. Los números del mes, el responsable
// y el tamaño de la cartera se leen de un vistazo; las clínicas,
// los doctores y el histórico del equipo se abren dentro de la
// fila solo cuando hacen falta.
//
// Sobre el histórico: un vendedor que dejó la empresa (activo:false)
// o al que le reasignaron la zona sigue apareciendo en las ventas
// viejas. Borrarlo de la vista falsearía el historial; mezclarlo
// con el actual confunde a quien la lee. Se muestran separados:
// arriba quien cubre la zona hoy, debajo quiénes la cubrieron.
// ══════════════════════════════════════════════════════════════

var _zn = {
  vista: 'tabla',      // 'tabla' | 'cards'
  orden: 'monto',
  dir: -1,             // -1 desc, 1 asc
  busq: ''
};

// ── Utilidades ────────────────────────────────────────────────

function _znIcono(id, cls) {
  return '<svg class="' + (cls || 'ic') + '" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-' + id + '"/></svg>';
}

function _znInicial(nombre) {
  // Un vendedor borrado de la tabla llega como "(vendedor eliminado)":
  // la inicial "(" no dice nada, mejor la interrogación.
  var c = String(nombre || '').trim().charAt(0).toUpperCase();
  return esc(/[A-ZÁÉÍÓÚÑ0-9]/.test(c) ? c : '?');
}

function _znMes() {
  var el = gel('zr-mes');
  if (el && !el.value) {
    var n = new Date();
    el.value = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
  }
  return el ? el.value : '';
}

function _znEsVenta(mov) {
  return mov === 'Venta al contado' || mov === 'Venta delivery' || esCredito15(mov);
}

// ── Agregación ────────────────────────────────────────────────
// Una pasada por _ventas para todas las zonas. La anterior hacía
// un filter completo por zona dentro de un for, o sea O(zonas × ventas).

function _znDatos(mes) {
  var porNombre = {};

  function zonaDe(nombre, id) {
    if (!porNombre[nombre]) {
      porNombre[nombre] = {
        id: id || null, nombre: nombre,
        monto: 0, ventas: 0, unidades: 0, visitas: 0,
        vetsMap: {}, vendMap: {},
        actuales: [], historicos: [], vets: []
      };
    }
    if (id && !porNombre[nombre].id) porNombre[nombre].id = id;
    return porNombre[nombre];
  }

  // Zonas dadas de alta, aunque todavía no tengan movimiento
  (_zonas || []).forEach(function (z) { zonaDe(z.nombre, z.id); });

  (_ventas || []).forEach(function (v) {
    if (!v.zona || v.estado === 'Anulado') return;
    var z = zonaDe(v.zona);
    var delMes = !mes || (v.fecha && v.fecha.indexOf(mes) === 0);

    // Cartera de la zona: histórica, no del mes. Es cobertura, no resultado.
    if (v.veterinaria) {
      var vet = z.vetsMap[v.veterinaria];
      if (!vet) vet = z.vetsMap[v.veterinaria] = { nombre: v.veterinaria, doctores: [], total: 0, mes: 0 };
      vet.total++;
      if (delMes) vet.mes++;
      if (v.doctora && vet.doctores.indexOf(v.doctora) < 0) vet.doctores.push(v.doctora);
    }

    // Rastro de cada vendedor en la zona, para saber quién la trabajó
    if (v.vendedor_id) {
      var k = String(v.vendedor_id);
      z.vendMap[k] = (z.vendMap[k] || 0) + 1;
    }

    if (!delMes) return;
    if (v.movimiento === 'Visita') { z.visitas++; return; }
    if (_znEsVenta(v.movimiento)) {
      z.ventas++;
      z.unidades += Number(v.cantidad || 0);
      z.monto += Number(v.total || 0);
    }
  });

  return Object.keys(porNombre).map(function (nombre) {
    var z = porNombre[nombre];

    // Quién cubre la zona hoy: asignada y de alta.
    var enPlantilla = {};
    (_vendedores || []).forEach(function (v) {
      var asignado = v.zonas_asignadas && v.zonas_asignadas.indexOf(nombre) >= 0;
      if (asignado && v.activo !== false) {
        z.actuales.push({ id: v.id, nombre: v.nombre, movs: z.vendMap[String(v.id)] || 0 });
        enPlantilla[String(v.id)] = true;
      }
    });

    // Quién la cubrió antes: dejó ventas pero ya no la tiene asignada
    // (o fue dado de baja). Se conserva con el motivo y la fecha.
    Object.keys(z.vendMap).forEach(function (vid) {
      if (enPlantilla[vid]) return;
      var v = (_vendedores || []).find(function (x) { return String(x.id) === vid; });
      var deBaja = v ? v.activo === false : false;
      z.historicos.push({
        id: vid,
        nombre: v ? v.nombre : getNombreVendedor(vid),
        movs: z.vendMap[vid],
        motivo: v ? (deBaja ? 'baja' : 'reasignado') : 'retirado',
        fecha_baja: v ? v.fecha_baja : null
      });
    });

    z.actuales.sort(function (a, b) { return b.movs - a.movs; });
    z.historicos.sort(function (a, b) { return b.movs - a.movs; });
    z.vets = Object.keys(z.vetsMap).map(function (k) { return z.vetsMap[k]; })
      .sort(function (a, b) { return b.mes - a.mes || b.total - a.total; });

    delete z.vetsMap; delete z.vendMap;
    return z;
  });
}

// ── Filtro y orden ────────────────────────────────────────────

function _znFiltrar(lista) {
  var q = (_zn.busq || '').toLowerCase().trim();
  if (!q) return lista;
  return lista.filter(function (z) {
    if (z.nombre.toLowerCase().indexOf(q) >= 0) return true;
    var gente = z.actuales.concat(z.historicos);
    for (var i = 0; i < gente.length; i++) {
      if (String(gente[i].nombre).toLowerCase().indexOf(q) >= 0) return true;
    }
    for (var j = 0; j < z.vets.length; j++) {
      if (z.vets[j].nombre.toLowerCase().indexOf(q) >= 0) return true;
      if (z.vets[j].doctores.join(' ').toLowerCase().indexOf(q) >= 0) return true;
    }
    return false;
  });
}

// Convención: dir 1 = ascendente, -1 = descendente, igual que el
// aria-sort que anuncia la cabecera. El comparador base siempre
// ordena ascendente y el signo lo invierte.
function _znOrdenar(lista) {
  var k = _zn.orden, d = _zn.dir;
  return lista.slice().sort(function (a, b) {
    if (k === 'nombre') return a.nombre.localeCompare(b.nombre, 'es') * d;
    if (k === 'vets') return (a.vets.length - b.vets.length) * d;
    return ((a[k] || 0) - (b[k] || 0)) * d;
  });
}

// ── Fragmentos reutilizados ───────────────────────────────────

function _znVendedorHtml(z) {
  // La insignia de histórico dice siempre lo mismo y ocupa lo mismo,
  // haya o no responsable actual: si cambia de texto según el caso, la
  // columna se ensancha justo en las filas que ya llevan una alerta.
  var ex = z.historicos.length
    ? '<span class="zn-ex" title="' + z.historicos.length + ' vendedor(es) trabajaron esta zona antes. Abre la fila para ver quiénes.">' +
        z.historicos.length + ' ex</span>'
    : '';

  if (!z.actuales.length) {
    return '<span class="zn-sin-vend">' + _znIcono('alerta') + 'Sin asignar</span>' + ex;
  }

  var primero = z.actuales[0];
  var html = '<span class="zn-vend">' +
    '<span class="zn-ava" aria-hidden="true">' + _znInicial(primero.nombre) + '</span>' +
    '<span class="zn-vend-nom">' + esc(primero.nombre) + '</span>';
  if (z.actuales.length > 1) {
    html += '<span class="zn-vend-mas" title="' + esc(z.actuales.map(function (v) { return v.nombre; }).join(', ')) + '">+' +
      (z.actuales.length - 1) + '</span>';
  }
  html += '</span>';
  return html + ex;
}

function _znMotivoTexto(h) {
  if (h.motivo === 'baja') return 'Dado de baja' + (h.fecha_baja ? ' el ' + fmt(h.fecha_baja) : '');
  if (h.motivo === 'reasignado') return 'Ya no cubre esta zona';
  return 'Ya no figura en el equipo';
}

// El detalle de una zona ya no se despliega dentro de la fila: vive en
// su propia pagina (#zona-det, assets/js/zona-detalle.js), donde caben
// la lista de clientes, todos los movimientos y el historial de cada
// vendedor con sus filtros. Un panel de 230px no daba para eso.

// ── Vista tabla ───────────────────────────────────────────────

// Sin columna de acciones: eliminar una zona vive en la página de esa
// zona. Una papelera pegada a cada fila de una tabla que se recorre a
// diario es un borrado accidental esperando su turno, y en móvil se
// comía el ancho que necesitan el nombre y el responsable.
var _ZN_COLS = [
  { k: 'nombre', t: 'Zona' },
  { k: null, t: 'A cargo' },
  { k: 'monto', t: 'Ingresos', num: true },
  { k: 'ventas', t: 'Ventas', num: true, opcSm: true },
  { k: 'unidades', t: 'Unid.', num: true, opc: true },
  { k: 'visitas', t: 'Visitas', num: true, opc: true },
  { k: 'vets', t: 'Clínicas', num: true, opcSm: true }
];

function _znTablaHtml(lista, maxMonto) {
  var head = _ZN_COLS.map(function (c) {
    var cls = (c.num ? 'zn-num ' : '') + (c.opc ? 'zn-opc ' : '') + (c.opcSm ? 'zn-opc-sm ' : '') + (c.k ? 'zn-sort' : '');
    var attrs = '';
    if (c.k) {
      attrs = ' tabindex="0" role="button"' +
        ' onclick="znOrdenar(\'' + c.k + '\')"' +
        ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();znOrdenar(\'' + c.k + '\');}"';
      if (_zn.orden === c.k) attrs += ' aria-sort="' + (_zn.dir === -1 ? 'descending' : 'ascending') + '"';
    }
    return '<th scope="col" class="' + cls.trim() + '"' + attrs + '>' + c.t + '</th>';
  }).join('');

  var filas = lista.map(function (z) {
    var nom = esc(z.nombre).replace(/'/g, '&#39;');
    var pct = maxMonto > 0 ? Math.round(z.monto / maxMonto * 100) : 0;
    var fillCls = z.monto <= 0 ? 'cero' : (pct >= 45 ? '' : 'media');

    return '<tr class="zn-fila" tabindex="0" role="link"' +
      ' aria-label="Abrir la zona ' + esc(z.nombre) + '"' +
      ' onclick="znAbrirZona(\'' + nom + '\')"' +
      ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();znAbrirZona(\'' + nom + '\');}">' +
      '<td><span class="zn-nombre">' + _znIcono('pin') + esc(z.nombre) +
        _znIcono('chevron-abajo', 'zn-chevron') + '</span></td>' +
      '<td>' + _znVendedorHtml(z) + '</td>' +
      '<td class="zn-num"><span class="zn-share">' +
        '<span class="zn-share-val">' + money(z.monto) + '</span>' +
        '<span class="zn-share-bar" role="img" aria-label="' + pct + '% del mejor mes de zona">' +
          '<span class="zn-share-fill ' + fillCls + '" style="width:' + pct + '%"></span>' +
        '</span></span></td>' +
      '<td class="zn-num zn-opc-sm">' + z.ventas + '</td>' +
      '<td class="zn-num zn-opc">' + z.unidades + '</td>' +
      '<td class="zn-num zn-opc">' + z.visitas + '</td>' +
      '<td class="zn-num zn-opc-sm">' + z.vets.length + '</td>' +
    '</tr>';
  }).join('');

  return '<div class="card u-mb-0"><div class="zn-wrap">' +
    '<table class="zn-tabla"><caption class="zn-sr">Zonas con su responsable actual y resultados del mes</caption>' +
    '<thead><tr>' + head + '</tr></thead><tbody>' + filas + '</tbody></table>' +
    '</div></div>';
}

// ── Vista tarjetas ────────────────────────────────────────────

function _znCardsHtml(lista) {
  return '<div class="zn-cards">' + lista.map(function (z) {
    var nom = esc(z.nombre).replace(/'/g, '&#39;');
    return '<button type="button" class="zn-card' + (z.actuales.length ? '' : ' sin-vend') + '"' +
      ' onclick="znAbrirZona(\'' + nom + '\')">' +
      '<span class="zn-card-top">' + _znIcono('pin') + '<span class="zn-card-nom">' + esc(z.nombre) + '</span></span>' +
      '<span class="zn-card-val' + (z.monto > 0 ? '' : ' cero') + '">' + money(z.monto) + '</span>' +
      '<span class="zn-card-mini">' +
        '<span><b>' + z.ventas + '</b> ventas</span>' +
        '<span><b>' + z.visitas + '</b> visitas</span>' +
        '<span><b>' + z.vets.length + '</b> clínicas</span>' +
      '</span>' +
      '<span class="zn-card-pie">' + _znVendedorHtml(z) + '</span>' +
    '</button>';
  }).join('') + '</div>';
}

// ── KPIs ──────────────────────────────────────────────────────

function _znKpisHtml(lista) {
  var ingresos = 0, sinVend = 0, clinicas = {};
  lista.forEach(function (z) {
    ingresos += z.monto;
    if (!z.actuales.length) sinVend++;
    z.vets.forEach(function (v) { clinicas[v.nombre] = 1; });
  });

  function kpi(icono, lbl, val, alerta) {
    return '<div class="zn-kpi' + (alerta ? ' zn-kpi-alerta' : '') + '">' + _znIcono(icono) +
      '<div><div class="zn-kpi-lbl">' + lbl + '</div><div class="zn-kpi-val">' + val + '</div></div></div>';
  }

  return kpi('globo', 'Zonas', lista.length) +
    kpi('monedas', 'Ingresos del mes', money(ingresos)) +
    kpi('clinica', 'Clínicas cubiertas', Object.keys(clinicas).length) +
    kpi(sinVend ? 'alerta' : 'ok', 'Sin vendedor', sinVend, sinVend > 0);
}

// ── Render principal ──────────────────────────────────────────

function rZonas() {
  var cont = gel('zn-contenido');
  if (!cont) return;

  var lista = _znDatos(_znMes());
  var kpis = gel('zn-kpis');
  if (kpis) kpis.innerHTML = _znKpisHtml(lista);

  lista = _znOrdenar(_znFiltrar(lista));

  if (!lista.length) {
    var hayZonas = (_zonas || []).length > 0;
    cont.innerHTML = '<div class="card"><div class="es">' +
      '<div class="ei">' + _znIcono('globo', 'ic ic-vacio') + '</div>' +
      (hayZonas
        ? '<strong>Ninguna zona coincide con la búsqueda.</strong><br>Prueba con otro nombre de zona, vendedor o clínica.'
        : '<strong>Todavía no hay zonas.</strong><br>Crea la primera con el botón “Nueva zona”.') +
      '</div></div>';
    return;
  }

  var maxMonto = lista.reduce(function (m, z) { return Math.max(m, z.monto); }, 0);
  cont.innerHTML = _zn.vista === 'cards' ? _znCardsHtml(lista) : _znTablaHtml(lista, maxMonto);
}

// Compatibilidad: el reporte por mes y la lista eran dos render distintos.
function rZonasReporte() { rZonas(); }

// ── Interacción ───────────────────────────────────────────────

function znSetVista(v) {
  _zn.vista = v;
  var t = gel('zn-vista-tabla'), c = gel('zn-vista-cards');
  if (t) t.setAttribute('aria-pressed', v === 'tabla' ? 'true' : 'false');
  if (c) c.setAttribute('aria-pressed', v === 'cards' ? 'true' : 'false');
  rZonas();
}

function znOrdenar(k) {
  // Al cambiar de columna se elige el sentido útil por defecto:
  // los nombres de la A a la Z, las cifras de mayor a menor.
  if (_zn.orden === k) _zn.dir = -_zn.dir;
  else { _zn.orden = k; _zn.dir = (k === 'nombre') ? 1 : -1; }
  var sel = gel('zn-orden');
  if (sel && sel.value !== k) sel.value = k;
  rZonas();
}

var _znBusqTimer = null;
function znBuscar(v) {
  // Filtrar en cada tecla repinta toda la tabla; 180 ms basta para
  // que se sienta inmediato sin recalcular por letra.
  clearTimeout(_znBusqTimer);
  _znBusqTimer = setTimeout(function () { _zn.busq = v; rZonas(); }, 180);
}

function znToggleNueva(forzar) {
  var caja = gel('zn-nueva'), btn = gel('zn-btn-nueva');
  if (!caja) return;
  var abrir = (forzar === undefined) ? !caja.classList.contains('abierta') : !!forzar;
  caja.classList.toggle('abierta', abrir);
  if (btn) btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  if (abrir && gel('nueva-zona')) gel('nueva-zona').focus();
  else if (btn) btn.focus();
}

// ── Alta y baja de zonas ──────────────────────────────────────

function agregarZona() {
  var nombre = val('nueva-zona');
  if (!nombre) { showToast('Escribe el nombre de la zona', 'er'); return; }
  var repetida = (_zonas || []).some(function (z) {
    return String(z.nombre).toLowerCase() === nombre.toLowerCase();
  });
  if (repetida) { showToast('Ya existe una zona con ese nombre', 'er'); return; }

  sbP('zonas', { nombre: nombre })
    .then(function () { return reloadZonas(); })
    .then(function () {
      gel('nueva-zona').value = '';
      znToggleNueva(false);
      rZonas();
      showToast('Zona "' + nombre + '" creada', 'ok');
    })
    .catch(function (e) { showToast(SVUI.error(e, 'crear la zona'), 'er'); });
}

function eliminarZona(id) {
  var zona = (_zonas || []).find(function (z) { return String(z.id) === String(id); }) || {};
  var nombre = zona.nombre || 'esta zona';
  showConfirm(
    '¿Eliminar la zona <strong>"' + esc(nombre) + '"</strong>?<br>' +
    '<span style="font-size:12px;color:var(--tl);">Las ventas y visitas ya registradas se conservan con el nombre de la zona. Los vendedores que la tuvieran asignada se quedan sin ella.</span>',
    'Eliminar zona',
    'Sí, eliminar',
    function () {
      sbDel('zonas', 'id=eq.' + id)
        .then(function () { return reloadZonas(); })
        .then(function () {
          // Si se borró desde la página de la zona, esa página ya no
          // tiene sujeto: hay que volver a la lista, no repintarla vacía.
          if (typeof _zd !== 'undefined' && _zd.zona === nombre) { _zd.zona = null; goTo('zonas'); return; }
          rZonas();
          showToast('Zona "' + nombre + '" eliminada', 'ok');
        })
        .catch(function (e) { showToast(SVUI.error(e, 'eliminar'), 'er'); });
    }
  );
}
