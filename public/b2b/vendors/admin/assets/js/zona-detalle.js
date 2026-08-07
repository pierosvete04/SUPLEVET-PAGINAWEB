// ══════════════════════════════════════════════════════════════
// DETALLE DE ZONA — página completa
// ──────────────────────────────────────────────────────────────
// Antes el detalle de una zona era un modal de 380px de alto con
// dos pestañas. Cabían los nombres y poco más: para saber qué
// había hecho un vendedor en la zona había que salir a Historial,
// filtrar por zona a mano y cruzarlo mentalmente.
//
// Ahora es una página con su propia URL (#zona-det), así que el
// botón Atrás del navegador funciona y se puede compartir el
// enlace. Tres vistas sobre el MISMO conjunto filtrado:
//
//   Clientes     → quién compra en la zona
//   Movimientos  → qué pasó, transacción a transacción
//   Vendedores   → cómo se ha movido cada uno, mes a mes
//
// Los filtros (fechas, vendedor, tipo, búsqueda) son únicos y
// afectan a las tres vistas y a los KPIs. Un filtro que solo vale
// en una pestaña obliga a recordar en cuál estabas.
// ══════════════════════════════════════════════════════════════

var _zd = {
  zona: null,
  vista: 'clientes',        // 'clientes' | 'movs' | 'vendedores'
  desde: '', hasta: '',
  vendedor: '',
  tipo: '',                 // '' = todos, o el nombre exacto del movimiento
  busq: '',
  limite: 100,              // filas de movimientos mostradas
  // Segmentación de la cartera por volumen, solo en la vista Clientes
  seg: '',                  // '' | 'alto' | 'medio' | 'bajo' | 'cero'
  minU: '',                 // mínimo de unidades compradas
  ordenCli: 'unidades',
  dirCli: -1                // -1 descendente (quien más compra arriba)
};

var _ZD_PASO = 100;

// Los mismos siete filtros que la pagina Historial Global, con sus
// mismos valores. Antes aqui habia categorias propias ("Ventas"
// agrupaba contado y delivery): dos vocabularios para lo mismo obligan
// a traducir mentalmente al saltar de una pantalla a otra.
var _ZD_TIPOS = [
  { v: '',                   t: 'Todos' },
  { v: 'Venta al contado',   t: 'Contado' },
  { v: 'Venta delivery',     t: 'Delivery' },
  { v: 'Credito a 15 dias',  t: 'Crédito' },
  { v: 'Devolucion',         t: 'Devolución' },
  { v: 'Visita',             t: 'Visitas' },
  { v: 'Cobro de credito',   t: 'Cobros' }
];

// ── Clasificación de movimientos ──────────────────────────────
// movNorm() quita tildes, así que "Crédito a 15 días" y
// "Credito a 15 dias" caen en la misma rama.

function _zdTipo(mov) {
  var m = movNorm(mov);
  if (m === 'visita') return 'visitas';
  if (m.indexOf('devolucion') > -1) return 'devoluciones';
  if (m.indexOf('cobro') > -1) return 'cobros';
  if (m.indexOf('credito a 15') > -1) return 'creditos';
  return 'ventas';
}

// Misma regla que anEsIngreso() en analiticas.js: contado + delivery +
// cobros, solo pagados. Si esta pagina contara distinto, la zona
// mostraria una cifra aqui y otra en Analíticas para el mismo mes.
function _zdEsIngreso(v) {
  if (!v || String(v.estado || '').indexOf('Pagado') < 0) return false;
  var t = _zdTipo(v.movimiento);
  return t === 'ventas' || t === 'cobros' || t === 'creditos';
}

// Las devoluciones restan del ingreso, igual que en Analíticas.
function _zdEsDevolucion(v) {
  return !!v && v.estado !== 'Anulado' && _zdTipo(v.movimiento) === 'devoluciones';
}

function _zdPendiente(v) {
  var e = String(v.estado || '');
  return _zdTipo(v.movimiento) === 'creditos' && (e.indexOf('Pendiente') > -1 || e.indexOf('Vencido') > -1);
}

// ── Selección de datos ────────────────────────────────────────

function _zdTodos() {
  if (!_zd.zona) return [];
  return (_ventas || []).filter(function (v) {
    return v.zona === _zd.zona && v.estado !== 'Anulado';
  });
}

function _zdFiltrados() {
  var q = (_zd.busq || '').toLowerCase().trim();
  return _zdTodos().filter(function (v) {
    var f = (v.fecha || '').substring(0, 10);
    if (_zd.desde && f < _zd.desde) return false;
    if (_zd.hasta && f > _zd.hasta) return false;
    if (_zd.vendedor && String(v.vendedor_id) !== String(_zd.vendedor)) return false;
    // movNorm en ambos lados: en la base conviven "Credito a 15 dias"
    // y "Crédito a 15 días", igual que en rHist().
    if (_zd.tipo && movNorm(v.movimiento) !== movNorm(_zd.tipo)) return false;
    if (q) {
      var heno = [v.veterinaria, v.doctora, v.producto, getNombreVendedor(v.vendedor_id)].join(' ').toLowerCase();
      if (heno.indexOf(q) < 0) return false;
    }
    return true;
  }).sort(function (a, b) {
    return String(b.fecha || '').localeCompare(String(a.fecha || ''));
  });
}

// ── Entrada y salida de la página ─────────────────────────────

function znAbrirZona(nombre) {
  _zd.zona = nombre;
  _zd.vista = 'clientes';
  _zd.desde = ''; _zd.hasta = ''; _zd.vendedor = ''; _zd.tipo = ''; _zd.busq = '';
  _zd.seg = ''; _zd.minU = '';
  _zd.ordenCli = 'unidades'; _zd.dirCli = -1;
  _zd.limite = _ZD_PASO;
  goTo('zona-det');
}

function zdVolver() { goTo('zonas'); }

function zdEliminar() {
  var z = (_zonas || []).find(function (x) { return x.nombre === _zd.zona; });
  if (z) eliminarZona(z.id);
}

// La llama _runPageFn() de core.js al entrar en #zona-det.
function rZonaDetalle() {
  if (!_zd.zona) { goTo('zonas'); return; }
  _zdPintarCabecera();
  _zdPintarFiltros();
  _zdPintar();
}

// ── Cabecera ──────────────────────────────────────────────────

function _zdEquipo() {
  var actuales = [], historicos = [], vistos = {};
  (_vendedores || []).forEach(function (v) {
    if (v.zonas_asignadas && v.zonas_asignadas.indexOf(_zd.zona) >= 0 && v.activo !== false) {
      actuales.push(v); vistos[String(v.id)] = true;
    }
  });
  var conRastro = {};
  _zdTodos().forEach(function (v) { if (v.vendedor_id) conRastro[String(v.vendedor_id)] = true; });
  Object.keys(conRastro).forEach(function (id) {
    if (vistos[id]) return;
    var v = (_vendedores || []).find(function (x) { return String(x.id) === id; });
    // Sin ficha en la tabla de vendedores no hay baja que mostrar: el
    // registro se perdió, que no es lo mismo que haber dado de baja.
    historicos.push(v || { id: id, nombre: getNombreVendedor(id), activo: false, _borrado: true });
  });
  return { actuales: actuales, historicos: historicos };
}

function _zdPintarCabecera() {
  var eq = _zdEquipo();
  var tit = gel('zd-titulo');
  if (tit) tit.textContent = _zd.zona;

  var sub = gel('zd-sub');
  if (sub) {
    sub.innerHTML = eq.actuales.length
      ? 'A cargo de <strong>' + esc(eq.actuales.map(function (v) { return v.nombre; }).join(', ')) + '</strong>' +
        (eq.historicos.length ? ' · ' + eq.historicos.length + ' vendedor(es) en el historial' : '')
      : '<span class="zd-aviso">' + _znIcono('alerta') + 'Sin vendedor asignado</span>' +
        (eq.historicos.length ? ' · ' + eq.historicos.length + ' vendedor(es) en el historial' : '');
  }
}

// ── Filtros ───────────────────────────────────────────────────

function _zdPintarFiltros() {
  var sel = gel('zd-f-vendedor');
  if (!sel) return;
  var eq = _zdEquipo();
  var opts = ['<option value="">Todos los vendedores</option>'];
  eq.actuales.forEach(function (v) {
    opts.push('<option value="' + esc(v.id) + '">' + esc(v.nombre) + '</option>');
  });
  if (eq.historicos.length) {
    opts.push('<optgroup label="Ya no cubren la zona">');
    eq.historicos.forEach(function (v) {
      var nota = v._borrado ? ''
        : (v.activo === false
          ? ' (baja' + (v.fecha_baja ? ' ' + fmt(v.fecha_baja) : '') + ')'
          : ' (reasignado)');
      opts.push('<option value="' + esc(v.id) + '">' + esc(v.nombre) + nota + '</option>');
    });
    opts.push('</optgroup>');
  }
  sel.innerHTML = opts.join('');
  sel.value = _zd.vendedor;

  var d = gel('zd-f-desde'), h = gel('zd-f-hasta'), b = gel('zd-f-busq');
  if (d) d.value = _zd.desde;
  if (h) h.value = _zd.hasta;
  if (b && b.value !== _zd.busq) b.value = _zd.busq;
}

// Cada chip lleva su recuento con el resto de filtros ya aplicados, así
// que se ve si merece la pena pulsarlo antes de pulsarlo.
function _zdPintarChips() {
  var cont = gel('zd-chips');
  if (!cont) return;

  var base = _zdTodos().filter(function (v) {
    var f = (v.fecha || '').substring(0, 10);
    if (_zd.desde && f < _zd.desde) return false;
    if (_zd.hasta && f > _zd.hasta) return false;
    if (_zd.vendedor && String(v.vendedor_id) !== String(_zd.vendedor)) return false;
    var q = (_zd.busq || '').toLowerCase().trim();
    if (q) {
      var heno = [v.veterinaria, v.doctora, v.producto, getNombreVendedor(v.vendedor_id)].join(' ').toLowerCase();
      if (heno.indexOf(q) < 0) return false;
    }
    return true;
  });

  var cuenta = {};
  base.forEach(function (v) {
    var k = movNorm(v.movimiento);
    cuenta[k] = (cuenta[k] || 0) + 1;
  });

  cont.innerHTML = _ZD_TIPOS.map(function (tp) {
    var n = tp.v === '' ? base.length : (cuenta[movNorm(tp.v)] || 0);
    var activo = movNorm(_zd.tipo) === movNorm(tp.v);
    return '<button type="button" class="zd-chip' + (activo ? ' activo' : '') + '"' +
      (n === 0 && tp.v !== '' ? ' disabled' : '') +
      ' aria-pressed="' + (activo ? 'true' : 'false') + '"' +
      ' onclick="zdFiltro(\'tipo\',\'' + tp.v + '\')">' +
      tp.t + '<span class="zd-chip-n">' + n + '</span></button>';
  }).join('');
}

function zdFiltro(campo, valor) {
  _zd[campo] = valor;
  _zd.limite = _ZD_PASO;
  _zdPintar();
}

var _zdBusqTimer = null;
function zdBuscar(v) {
  clearTimeout(_zdBusqTimer);
  _zdBusqTimer = setTimeout(function () { zdFiltro('busq', v); }, 180);
}

function zdLimpiar() {
  _zd.desde = ''; _zd.hasta = ''; _zd.vendedor = ''; _zd.tipo = ''; _zd.busq = '';
  _zd.seg = ''; _zd.minU = '';
  _zd.limite = _ZD_PASO;
  _zdPintarFiltros();
  _zdPintar();
}

function zdSetVista(v) {
  _zd.vista = v;
  _zd.limite = _ZD_PASO;
  _zdPintar();
}

// Atajo desde la tabla de clientes: filtra por esa clínica y salta
// a los movimientos, que es lo que se quiere ver a continuación.
function zdVerCliente(nombre) {
  _zd.busq = nombre;
  var b = gel('zd-f-busq');
  if (b) b.value = nombre;
  zdSetVista('movs');
}

function zdVerMas() {
  _zd.limite += _ZD_PASO;
  _zdPintar();
}

// ── Segmentación de la cartera por volumen ────────────────────

function zdSegmento(v) {
  _zd.seg = (_zd.seg === v) ? '' : v;
  _zdPintar();
}

var _zdMinUTimer = null;
function zdMinUnidades(v) {
  clearTimeout(_zdMinUTimer);
  _zdMinUTimer = setTimeout(function () {
    var n = String(v).trim();
    _zd.minU = (n === '' || isNaN(n) || Number(n) < 0) ? '' : n;
    _zdPintar();
    // El repintado destruye el campo: hay que devolverle el cursor o
    // se escribe un dígito y el foco se pierde en el siguiente.
    var el = gel('zd-minu');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, 250);
}

function zdOrdenCli(k) {
  if (_zd.ordenCli === k) _zd.dirCli = -_zd.dirCli;
  else { _zd.ordenCli = k; _zd.dirCli = (k === 'nombre') ? 1 : -1; }
  _zdPintar();
}

// ── KPIs ──────────────────────────────────────────────────────

function _zdKpisHtml(movs) {
  var ingresos = 0, unidades = 0, visitas = 0, pendiente = 0, nPend = 0, clientes = {};
  var nVentas = 0;
  movs.forEach(function (v) {
    if (v.veterinaria) clientes[v.veterinaria] = 1;
    var t = _zdTipo(v.movimiento);
    if (t === 'visitas') { visitas++; return; }
    if (_zdEsIngreso(v)) ingresos += Number(v.total || 0);
    else if (_zdEsDevolucion(v)) ingresos -= Math.abs(Number(v.total || 0));
    if (t === 'ventas' || t === 'creditos') { nVentas++; unidades += Number(v.cantidad || 0); }
    if (_zdPendiente(v)) { pendiente += Number(v.total || 0); nPend++; }
  });

  function k(icono, lbl, val, sub, alerta) {
    return '<div class="zn-kpi' + (alerta ? ' zn-kpi-alerta' : '') + '">' + _znIcono(icono) +
      '<div><div class="zn-kpi-lbl">' + lbl + '</div><div class="zn-kpi-val">' + val + '</div>' +
      (sub ? '<div class="zd-kpi-sub">' + sub + '</div>' : '') + '</div></div>';
  }

  return k('monedas', 'Ingresos', money(Math.max(0, ingresos)), 'cobrado, neto de devoluciones') +
    k('tendencia', 'Ventas', nVentas, unidades + ' unidades') +
    k('brujula', 'Visitas', visitas, '') +
    k('clinica', 'Clientes', Object.keys(clientes).length, 'con movimiento') +
    k(nPend ? 'alerta' : 'ok', 'Crédito pendiente', money(pendiente), nPend + ' operación(es)', nPend > 0);
}

// ── Vista: clientes ───────────────────────────────────────────

// Agrupa los movimientos por clínica. Las unidades se cuentan de ventas
// y créditos, y las devoluciones RESTAN: si un cliente pidió 10 y devolvió
// 4, compró 6, y ese es el número por el que hay que ordenarlo.
function _zdAgruparClientes(movs) {
  var map = {};
  movs.forEach(function (v) {
    var nom = v.veterinaria || '(sin clínica)';
    var c = map[nom];
    if (!c) c = map[nom] = { nombre: nom, doctores: [], vends: [], visitas: 0, ventas: 0, unidades: 0, ingresos: 0, pend: 0, ultima: '' };
    if (v.doctora && c.doctores.indexOf(v.doctora) < 0) c.doctores.push(v.doctora);
    var nv = getNombreVendedor(v.vendedor_id);
    if (nv && c.vends.indexOf(nv) < 0) c.vends.push(nv);
    if ((v.fecha || '') > c.ultima) c.ultima = v.fecha || '';

    var t = _zdTipo(v.movimiento);
    if (t === 'visitas') c.visitas++;
    else if (t === 'ventas' || t === 'creditos') { c.ventas++; c.unidades += Number(v.cantidad || 0); }
    else if (t === 'devoluciones') c.unidades -= Math.abs(Number(v.cantidad || 0));

    if (_zdEsIngreso(v)) c.ingresos += Number(v.total || 0);
    else if (_zdEsDevolucion(v)) c.ingresos -= Math.abs(Number(v.total || 0));
    if (_zdPendiente(v)) c.pend += Number(v.total || 0);
  });

  return Object.keys(map).map(function (k) {
    var c = map[k];
    c.unidades = Math.max(0, c.unidades);
    c.ingresos = Math.max(0, c.ingresos);
    return c;
  });
}

// Corta la cartera en tres tramos por unidades usando los tercios de la
// propia zona, no umbrales fijos. Un "cliente grande" en Barranco no
// compra lo mismo que uno en San Isidro; un 10 fijo mentiría en las dos.
function _zdTramos(lista) {
  var us = lista.map(function (c) { return c.unidades; }).filter(function (u) { return u > 0; })
    .sort(function (a, b) { return a - b; });
  if (us.length < 3) return null;
  return {
    bajo: us[Math.floor(us.length / 3)],
    alto: us[Math.floor(us.length * 2 / 3)]
  };
}

function _zdSegmentoDe(c, tr) {
  if (c.unidades <= 0) return 'cero';
  if (!tr) return 'medio';
  if (c.unidades > tr.alto) return 'alto';
  if (c.unidades <= tr.bajo) return 'bajo';
  return 'medio';
}

var _ZD_SEGS = [
  { v: '',      t: 'Todos' },
  { v: 'alto',  t: 'Compran más' },
  { v: 'medio', t: 'Intermedios' },
  { v: 'bajo',  t: 'Compran menos' },
  { v: 'cero',  t: 'Sin compras' }
];

var _ZD_COLS_CLI = [
  { k: 'nombre',   t: 'Clínica y doctores' },
  { k: null,       t: 'Atendida por', opc: true },
  { k: null,       t: 'Último movimiento', opc: true },
  { k: 'visitas',  t: 'Visitas', num: true, opcSm: true },
  { k: 'ventas',   t: 'Ventas', num: true, opcSm: true },
  { k: 'unidades', t: 'Unidades', num: true },
  { k: 'ingresos', t: 'Ingresos', num: true }
];

function _zdClientesHtml(movs) {
  var todos = _zdAgruparClientes(movs);
  var tr = _zdTramos(todos);

  // Los recuentos de los botones salen de la cartera completa, para que
  // no cambien al elegir un tramo: si al pulsar "Compran más" el propio
  // botón dijera otro número, no habría con qué comparar.
  var porSeg = { '': todos.length, alto: 0, medio: 0, bajo: 0, cero: 0 };
  todos.forEach(function (c) { porSeg[_zdSegmentoDe(c, tr)]++; });

  var lista = todos.filter(function (c) {
    if (_zd.seg && _zdSegmentoDe(c, tr) !== _zd.seg) return false;
    if (_zd.minU !== '' && c.unidades < Number(_zd.minU)) return false;
    return true;
  });

  var k = _zd.ordenCli, d = _zd.dirCli;
  lista.sort(function (a, b) {
    if (k === 'nombre') return a.nombre.localeCompare(b.nombre, 'es') * d;
    return ((a[k] || 0) - (b[k] || 0)) * d;
  });

  var segs = _ZD_SEGS.map(function (s) {
    var etq = s.t;
    if (tr && s.v === 'alto')  etq += ' <span class="zd-seg-u">+' + tr.alto + ' u</span>';
    if (tr && s.v === 'bajo')  etq += ' <span class="zd-seg-u">≤' + tr.bajo + ' u</span>';
    var activo = _zd.seg === s.v;
    return '<button type="button" class="zd-chip' + (activo ? ' activo' : '') + '"' +
      (porSeg[s.v] === 0 && s.v !== '' ? ' disabled' : '') +
      ' aria-pressed="' + (activo ? 'true' : 'false') + '"' +
      ' onclick="zdSegmento(\'' + s.v + '\')">' + etq +
      '<span class="zd-chip-n">' + porSeg[s.v] + '</span></button>';
  }).join('');

  var controles = '<div class="zd-cli-bar">' +
    '<div class="zd-chips zd-chips-seg">' + segs + '</div>' +
    '<label class="zd-minu"><span>Desde</span>' +
      '<input type="number" min="0" step="1" id="zd-minu" value="' + esc(_zd.minU) + '"' +
        ' aria-label="Mínimo de unidades compradas" placeholder="0"' +
        ' oninput="zdMinUnidades(this.value)"/>' +
      '<span>unidades</span></label>' +
  '</div>';

  if (!lista.length) {
    return controles + (todos.length
      ? '<div class="card"><div class="es"><div class="ei">' + _znIcono('clinica', 'ic ic-vacio') + '</div>' +
        '<strong>Ningún cliente llega a ese volumen.</strong><br>Baja el mínimo de unidades o elige otro tramo.</div></div>'
      : _zdVacio('Sin clientes que mostrar'));
  }

  var maxU = lista.reduce(function (m, c) { return Math.max(m, c.unidades); }, 0);

  var head = _ZD_COLS_CLI.map(function (c) {
    var cls = (c.num ? 'zn-num ' : '') + (c.opc ? 'zn-opc ' : '') + (c.opcSm ? 'zn-opc-sm ' : '') + (c.k ? 'zn-sort' : '');
    var attrs = '';
    if (c.k) {
      attrs = ' tabindex="0" role="button" onclick="zdOrdenCli(\'' + c.k + '\')"' +
        ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();zdOrdenCli(\'' + c.k + '\');}"';
      if (k === c.k) attrs += ' aria-sort="' + (d === -1 ? 'descending' : 'ascending') + '"';
    }
    return '<th scope="col" class="' + cls.trim() + '"' + attrs + '>' + c.t + '</th>';
  }).join('');

  var filas = lista.map(function (c) {
    var nom = esc(c.nombre).replace(/'/g, '&#39;');
    var pct = maxU > 0 ? Math.round(c.unidades / maxU * 100) : 0;
    return '<tr class="zd-clic" tabindex="0" role="button"' +
      ' onclick="zdVerCliente(\'' + nom + '\')"' +
      ' onkeydown="if(event.key===\'Enter\'){zdVerCliente(\'' + nom + '\')}">' +
      '<td><div class="zd-cli-nom">' + esc(c.nombre) + '</div>' +
        (c.doctores.length ? '<div class="zd-cli-sub">' + esc(c.doctores.join(', ')) + '</div>' : '') + '</td>' +
      '<td class="zn-opc">' + esc(c.vends.join(', ')) + '</td>' +
      '<td class="zn-opc">' + (c.ultima ? fmt(c.ultima) : '—') + '</td>' +
      '<td class="zn-num zn-opc-sm">' + c.visitas + '</td>' +
      '<td class="zn-num zn-opc-sm">' + c.ventas + '</td>' +
      '<td class="zn-num"><span class="zn-share">' +
        '<span class="zn-share-val">' + c.unidades + '</span>' +
        '<span class="zn-share-bar" role="img" aria-label="' + pct + '% de las unidades del mayor cliente">' +
          '<span class="zn-share-fill ' + (c.unidades <= 0 ? 'cero' : (pct >= 45 ? '' : 'media')) + '" style="width:' + pct + '%"></span>' +
        '</span></span></td>' +
      '<td class="zn-num"><strong>' + money(c.ingresos) + '</strong>' +
        (c.pend > 0 ? '<div class="zd-pend">' + money(c.pend) + ' pendiente</div>' : '') + '</td>' +
    '</tr>';
  }).join('');

  var pie = lista.length !== todos.length
    ? '<div class="zd-mas">Mostrando ' + lista.length + ' de ' + todos.length + ' clientes de la zona</div>'
    : '';

  return controles + '<div class="card u-mb-0"><div class="zn-wrap"><table class="zn-tabla zd-tabla">' +
    '<caption class="zn-sr">Clientes de la zona ordenados por ' + k + '</caption>' +
    '<thead><tr>' + head + '</tr></thead><tbody>' + filas + '</tbody></table></div>' + pie + '</div>';
}

// ── Vista: movimientos ────────────────────────────────────────

function _zdMovsHtml(movs) {
  if (!movs.length) return _zdVacio('Sin movimientos que mostrar');

  var pagina = movs.slice(0, _zd.limite);
  var filas = pagina.map(function (v) {
    return '<tr class="zd-clic" tabindex="0" role="button"' +
      ' onclick="verDetalle(\'' + esc(v.id) + '\')"' +
      ' onkeydown="if(event.key===\'Enter\'){verDetalle(\'' + esc(v.id) + '\')}">' +
      '<td class="zd-fecha">' + fmt(v.fecha) + '</td>' +
      '<td>' + esc(getNombreVendedor(v.vendedor_id)) + '</td>' +
      '<td><div class="zd-cli-nom">' + esc(v.veterinaria || '—') + '</div>' +
        (v.doctora ? '<div class="zd-cli-sub">' + esc(v.doctora) + '</div>' : '') + '</td>' +
      '<td>' + bMov(v.movimiento) + '</td>' +
      '<td class="zn-opc">' + esc(v.producto || '—') + '</td>' +
      '<td class="zn-num zn-opc-sm">' + (v.cantidad || 0) + '</td>' +
      '<td class="zn-num"><strong>' + money(v.total) + '</strong></td>' +
      '<td class="zn-opc">' + bEst(v.estado) + '</td>' +
    '</tr>';
  }).join('');

  // Si se recorta la lista hay que decirlo: una tabla truncada en
  // silencio se lee como si fuera todo lo que hay.
  var pie = movs.length > pagina.length
    ? '<div class="zd-mas">Mostrando ' + pagina.length + ' de ' + movs.length + ' movimientos ' +
      '<button class="btn btn-s btn-sm" onclick="zdVerMas()">Ver ' +
      Math.min(_ZD_PASO, movs.length - pagina.length) + ' más</button></div>'
    : '<div class="zd-mas">' + movs.length + ' movimiento' + (movs.length !== 1 ? 's' : '') + ' en total</div>';

  return '<div class="card u-mb-0"><div class="zn-wrap"><table class="zn-tabla zd-tabla">' +
    '<thead><tr><th scope="col">Fecha</th><th scope="col">Vendedor</th><th scope="col">Clínica</th>' +
    '<th scope="col">Tipo</th><th scope="col" class="zn-opc">Producto</th>' +
    '<th scope="col" class="zn-num zn-opc-sm">Cant.</th><th scope="col" class="zn-num">Total</th>' +
    '<th scope="col" class="zn-opc">Estado</th></tr></thead>' +
    '<tbody>' + filas + '</tbody></table></div>' + pie + '</div>';
}

// ── Vista: vendedores (el historial de actividad) ─────────────

function _zdVendedoresHtml(movs) {
  var eq = _zdEquipo();
  var porVend = {};

  movs.forEach(function (v) {
    var id = String(v.vendedor_id || '—');
    var d = porVend[id];
    if (!d) d = porVend[id] = { id: id, visitas: 0, ventas: 0, ingresos: 0, pend: 0, clientes: {}, meses: {}, primera: '', ultima: '' };
    var f = (v.fecha || '').substring(0, 10);
    if (f) {
      if (!d.primera || f < d.primera) d.primera = f;
      if (f > d.ultima) d.ultima = f;
      var mes = f.substring(0, 7);
      if (!d.meses[mes]) d.meses[mes] = { ingresos: 0, visitas: 0, ventas: 0 };
    }
    var m = f ? d.meses[f.substring(0, 7)] : null;
    if (v.veterinaria) d.clientes[v.veterinaria] = 1;
    var t = _zdTipo(v.movimiento);
    if (t === 'visitas') { d.visitas++; if (m) m.visitas++; }
    else if (t === 'ventas' || t === 'creditos') { d.ventas++; if (m) m.ventas++; }
    if (_zdEsIngreso(v)) { d.ingresos += Number(v.total || 0); if (m) m.ingresos += Number(v.total || 0); }
    else if (_zdEsDevolucion(v)) {
      var dv = Math.abs(Number(v.total || 0));
      d.ingresos -= dv; if (m) m.ingresos -= dv;
    }
    if (_zdPendiente(v)) d.pend += Number(v.total || 0);
  });

  // Orden: primero quien cubre la zona hoy, después el historial.
  var orden = eq.actuales.map(function (v) { return { v: v, actual: true }; })
    .concat(eq.historicos.map(function (v) { return { v: v, actual: false }; }));

  var conDatos = orden.filter(function (o) { return porVend[String(o.v.id)]; });
  if (!conDatos.length) return _zdVacio('Sin actividad de vendedores');

  // Escala común entre vendedores: si cada uno se normaliza contra su
  // propio máximo, dos barras del mismo alto significan cosas distintas.
  var tope = 0;
  Object.keys(porVend).forEach(function (id) {
    Object.keys(porVend[id].meses).forEach(function (m) {
      tope = Math.max(tope, porVend[id].meses[m].ingresos);
    });
  });

  return '<div class="zd-vends">' + conDatos.map(function (o) {
    var v = o.v, d = porVend[String(v.id)];
    var meses = Object.keys(d.meses).sort();
    var barras = meses.map(function (m) {
      var mm = d.meses[m];
      var alto = tope > 0 ? Math.max(3, Math.round(mm.ingresos / tope * 100)) : 3;
      var etiqueta = m.substring(5) + '/' + m.substring(2, 4);
      return '<div class="zd-mes" title="' + etiqueta + ': ' + money(mm.ingresos) + ' · ' +
        mm.ventas + ' ventas · ' + mm.visitas + ' visitas">' +
        '<div class="zd-mes-col"><div class="zd-mes-fill" style="height:' + alto + '%"></div></div>' +
        '<div class="zd-mes-lbl">' + etiqueta + '</div></div>';
    }).join('');

    var etiquetaEstado = o.actual
      ? '<span class="zd-tag activo">Cubre la zona</span>'
      : (v._borrado
        ? '<span class="zd-tag ex">Sin ficha de vendedor</span>'
        : (v.activo === false
          ? '<span class="zd-tag baja">Baja' + (v.fecha_baja ? ' ' + fmt(v.fecha_baja) : '') + '</span>'
          : '<span class="zd-tag ex">Ya no cubre la zona</span>'));

    return '<div class="zd-vend' + (o.actual ? '' : ' historico') + '">' +
      '<div class="zd-vend-cab">' +
        '<span class="zn-ava">' + _znInicial(v.nombre) + '</span>' +
        '<div class="zd-vend-id"><div class="zd-vend-nom">' + esc(v.nombre) + '</div>' +
          '<div class="zd-vend-per">' + (d.primera ? fmt(d.primera) + ' → ' + fmt(d.ultima) : 'Sin fechas') + '</div></div>' +
        etiquetaEstado +
      '</div>' +
      '<div class="zd-vend-cifras">' +
        '<div><span class="zd-c-val">' + money(Math.max(0, d.ingresos)) + '</span><span class="zd-c-lbl">Ingresos</span></div>' +
        '<div><span class="zd-c-val">' + d.ventas + '</span><span class="zd-c-lbl">Ventas</span></div>' +
        '<div><span class="zd-c-val">' + d.visitas + '</span><span class="zd-c-lbl">Visitas</span></div>' +
        '<div><span class="zd-c-val">' + Object.keys(d.clientes).length + '</span><span class="zd-c-lbl">Clientes</span></div>' +
        (d.pend > 0 ? '<div><span class="zd-c-val pend">' + money(d.pend) + '</span><span class="zd-c-lbl">Pendiente</span></div>' : '') +
      '</div>' +
      (meses.length
        ? '<div class="zd-vend-graf"><div class="zd-graf-tit">Ingresos por mes en esta zona</div>' +
          '<div class="zd-bars">' + barras + '</div></div>'
        : '') +
    '</div>';
  }).join('') + '</div>';
}

// ── Render ────────────────────────────────────────────────────

// Sugerir "quita filtros" a quien no ha puesto ninguno es mandarle a
// buscar algo que no existe: si la zona está vacía de origen, se dice.
function _zdVacio(msg) {
  var hayFiltro = [_zd.desde, _zd.hasta, _zd.vendedor, _zd.tipo, _zd.busq].some(Boolean);
  var pista = hayFiltro
    ? 'Prueba a ampliar el rango de fechas o quitar filtros.'
    : 'Esta zona todavía no tiene movimientos registrados.';
  return '<div class="card"><div class="es"><div class="ei">' +
    _znIcono('lista', 'ic ic-vacio') + '</div><strong>' + msg + '</strong><br>' + pista + '</div></div>';
}

function _zdPintar() {
  var movs = _zdFiltrados();

  _zdPintarChips();

  var kpis = gel('zd-kpis');
  if (kpis) kpis.innerHTML = _zdKpisHtml(movs);

  ['clientes', 'movs', 'vendedores'].forEach(function (v) {
    var b = gel('zd-tab-' + v);
    if (b) b.setAttribute('aria-selected', _zd.vista === v ? 'true' : 'false');
  });

  var activos = [_zd.desde, _zd.hasta, _zd.vendedor, _zd.tipo, _zd.busq, _zd.seg, _zd.minU].filter(Boolean).length;
  var limpiar = gel('zd-limpiar');
  if (limpiar) {
    limpiar.style.display = activos ? '' : 'none';
    limpiar.textContent = 'Quitar filtros (' + activos + ')';
  }

  var cont = gel('zd-contenido');
  if (!cont) return;
  if (_zd.vista === 'movs') cont.innerHTML = _zdMovsHtml(movs);
  else if (_zd.vista === 'vendedores') cont.innerHTML = _zdVendedoresHtml(movs);
  else cont.innerHTML = _zdClientesHtml(movs);
}
