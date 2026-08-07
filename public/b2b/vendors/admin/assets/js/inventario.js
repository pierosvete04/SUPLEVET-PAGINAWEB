// ══════════════════════════════════════════════════════════════
// INVENTARIO: módulo de inventario integrado en Portal Suplevet
// Depende de: core.js (_productos, _materiales, _vendedores,
//             _invMov, _invLastPage, gel, val, hoy, fmt,
//             setSt, setBL, sbG, sbP, sbU, sbDel,
//             abrirModal, cerrarModal, loadAll)
// ══════════════════════════════════════════════════════════════

// ── Estado del módulo ──
var _invHF = 'todos';
var _invPL = [];
var _invPI = -1;
var _invHistMesIniciado = false; // bandera: si ya se aplicó el mes actual por defecto

// ── Helpers locales ──
function _invIni(n) {
  return (n || '?').split(' ').map(function(x) { return x[0]; }).slice(0, 2).join('').toUpperCase();
}
function _rInvCurrent() {
  if (_invLastPage === 'inv-historial') rInvHist();
  else if (_invLastPage === 'inv-personas') rInvPersonas();
  else if (_invLastPage === 'inv-productos') rInvProd();
  else if (_invLastPage === 'inv-materiales') rInvMat();
}

// ── Abrir / cerrar modales de inventario ──
function invOpenModal(code) {
  var today = hoy();
  if (code === 'ep' || code === 'sp') {
    var sel = gel(code === 'ep' ? 'ep-itm' : 'sp-itm');
    if (sel) sel.innerHTML = _productos.map(function(p) {
      return '<option value="' + p.id + '">' + p.nombre + ' — stock: ' + p.stock + '</option>';
    }).join('');
    var fec = gel(code === 'ep' ? 'ep-fec' : 'sp-fec');
    if (fec) fec.value = today;
    if (code === 'sp') _invPobV('sp-per');
  }
  if (code === 'em' || code === 'sm') {
    var sel2 = gel(code === 'em' ? 'em-itm' : 'sm-itm');
    if (sel2) sel2.innerHTML = _materiales.map(function(m) {
      return '<option value="' + m.id + '">' + m.nombre + ' — stock: ' + m.stock + '</option>';
    }).join('');
    var fec2 = gel(code === 'em' ? 'em-fec' : 'sm-fec');
    if (fec2) fec2.value = today;
    if (code === 'sm') _invPobV('sm-per');
  }
  abrirModal('m-' + code);
}
function invCloseModal(id) { cerrarModal(id); }

// ── Poblar select de vendedores ──
function _invPobV(sid) {
  var s = gel(sid); if (!s) return;
  var c = s.value;
  var html = '<option value="">— Seleccionar vendedor —</option>';
  _vendedores.forEach(function(v) {
    html += '<option value="' + v.id + '">' + v.nombre + (v.empresa ? ' (' + v.empresa + ')' : '') + '</option>';
  });
  s.innerHTML = html;
  if (c) s.value = c;
}

// ══════════════════════════════════════════════════════════════
// RENDER: PRODUCTOS (tarjetas)
// ══════════════════════════════════════════════════════════════
function rInvProd() {
  var bq = (val('srch-inv-p') || '').toLowerCase();
  var l = _productos.filter(function(p) {
    return p.nombre.toLowerCase().indexOf(bq) > -1 || (p.categoria || '').toLowerCase().indexOf(bq) > -1;
  });
  var el = gel('tbl-inv-p'); if (!el) return;
  if (!l.length) { el.innerHTML = '<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>Todavía no hay productos.</strong><br>Añade el primero para poder registrar entradas y salidas.</div>'; return; }
  var bajosN = l.filter(function(p){ return p.stock <= p.minimo; }).length;
  var totalU = l.reduce(function(s,p){ return s + (p.stock||0); }, 0);
  var resumen = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:1rem;">' +
    '<div style="background:var(--sky4);border:1.5px solid var(--sky);border-radius:var(--r);padding:8px 16px;font-size:12px;font-weight:700;color:var(--brand);">'+l.length+' productos</div>' +
    '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:var(--r);padding:8px 16px;font-size:12px;font-weight:700;color:#166534;">'+totalU+' uds en stock</div>' +
    (bajosN ? '<div style="background:#fff1f2;border:1.5px solid #fca5a5;border-radius:var(--r);padding:8px 16px;font-size:12px;font-weight:700;color:#dc2626;">⚠ '+bajosN+' en stock bajo</div>' : '') +
  '</div>';
  var cards = l.map(function(p) {
    var bj = p.stock <= (p.minimo || 0);
    var pct = p.minimo > 0 ? Math.min(Math.round((p.stock / Math.max(p.minimo * 3, p.stock, 1)) * 100), 100) : (p.stock > 0 ? 100 : 0);
    var barColor = bj ? '#dc2626' : (pct < 50 ? '#f59e0b' : '#16a34a');
    var ini = _invIni(p.nombre);
    return '<div style="background:#fff;border:1.5px solid '+(bj?'#fca5a5':'var(--bd)')+';border-radius:var(--rxl);padding:16px;display:flex;flex-direction:column;gap:10px;position:relative;overflow:hidden;">' +
      (bj ? '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:#dc2626;"></div>' : '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:#16a34a;"></div>') +
      '<div style="display:flex;align-items:flex-start;gap:10px;">' +
        '<div style="width:38px;height:38px;border-radius:50%;background:var(--sky4);color:var(--brand);font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+ini+'</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:700;font-size:13px;line-height:1.3;word-break:break-word;">'+p.nombre+'</div>' +
          (p.categoria ? '<div style="font-size:10px;color:var(--tl);margin-top:2px;">'+p.categoria+(p.presentacion?' · '+p.presentacion:'')+'</div>' : '') +
        '</div>' +
      '</div>' +
      '<div style="text-align:center;padding:6px 0;">' +
        '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:52px;line-height:1;color:'+(bj?'#dc2626':'var(--brand)')+';">'+p.stock+'</div>' +
        '<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tl);letter-spacing:.5px;margin-top:2px;">unidades</div>' +
      '</div>' +
      '<div>' +
        '<div style="background:#f1f5f9;border-radius:99px;height:6px;overflow:hidden;margin-bottom:5px;">' +
          '<div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:99px;transition:width .3s;"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:10px;color:var(--tl);">Mín: '+(p.minimo||0)+'</span>' +
          '<span style="font-size:10px;font-weight:700;padding:1px 7px;border-radius:99px;background:'+(bj?'#fff1f2':'#f0fdf4')+';color:'+(bj?'#dc2626':'#16a34a')+'">'+(bj?'⚠ Bajo':'✓ OK')+'</span>' +
        '</div>' +
      '</div>' +
      (p.notas ? '<div style="font-size:10px;color:var(--tl);border-top:1px solid var(--bd);padding-top:8px;">'+p.notas+'</div>' : '') +
      '<div style="display:flex;gap:5px;border-top:1px solid var(--bd);padding-top:8px;">' +
        '<button class="btn btn-sk btn-sm" style="flex:1;" onclick="invEditProd(\''+p.id+'\')">✏️ Editar</button>' +
        '<button class="btn btn-sk btn-sm" title="Entrada" onclick="_invQE(\'p\',\''+p.id+'\')">⬆</button>' +
        '<button class="btn btn-or btn-sm" title="Salida" onclick="_invQS(\'p\',\''+p.id+'\')">⬇</button>' +
        '<button class="btn btn-d btn-sm" title="Eliminar" onclick="invDel(\'p\',\''+p.id+'\')">🗑</button>' +
      '</div>' +
    '</div>';
  }).join('');
  el.innerHTML = resumen + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;">' + cards + '</div>';
}

// ══════════════════════════════════════════════════════════════
// RENDER: MATERIALES
// ══════════════════════════════════════════════════════════════
// RENDER: MATERIALES (tarjetas)
// ══════════════════════════════════════════════════════════════
function rInvMat() {
  var el = gel('tbl-inv-m'); if (!el) return;
  if (!_materiales.length) { el.innerHTML = '<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>Todavía no hay materiales.</strong><br>Añade bandanas, etiquetas o cajas para empezar a controlarlos.</div>'; return; }
  var bajosN = _materiales.filter(function(m){ return m.stock <= m.minimo; }).length;
  var totalU = _materiales.reduce(function(s,m){ return s + (m.stock||0); }, 0);
  var resumen = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:1rem;">' +
    '<div style="background:#fff7ed;border:1.5px solid #fdba74;border-radius:var(--r);padding:8px 16px;font-size:12px;font-weight:700;color:#9a3412;">'+_materiales.length+' materiales</div>' +
    '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:var(--r);padding:8px 16px;font-size:12px;font-weight:700;color:#166534;">'+totalU+' uds en stock</div>' +
    (bajosN ? '<div style="background:#fff1f2;border:1.5px solid #fca5a5;border-radius:var(--r);padding:8px 16px;font-size:12px;font-weight:700;color:#dc2626;">⚠ '+bajosN+' en stock bajo</div>' : '') +
  '</div>';
  var cards = _materiales.map(function(m) {
    var bj = m.stock <= (m.minimo || 0);
    var pct = m.minimo > 0 ? Math.min(Math.round((m.stock / Math.max(m.minimo * 3, m.stock, 1)) * 100), 100) : (m.stock > 0 ? 100 : 0);
    var barColor = bj ? '#dc2626' : (pct < 50 ? '#f59e0b' : '#16a34a');
    var ini = _invIni(m.nombre);
    return '<div style="background:#fff;border:1.5px solid '+(bj?'#fca5a5':'var(--bd)')+';border-radius:var(--rxl);padding:16px;display:flex;flex-direction:column;gap:10px;position:relative;overflow:hidden;">' +
      (bj ? '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:#dc2626;"></div>' : '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:#16a34a;"></div>') +
      '<div style="display:flex;align-items:flex-start;gap:10px;">' +
        '<div style="width:38px;height:38px;border-radius:50%;background:#fff7ed;color:#9a3412;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+ini+'</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:700;font-size:13px;line-height:1.3;word-break:break-word;">'+m.nombre+'</div>' +
          (m.unidad ? '<div style="font-size:10px;color:var(--tl);margin-top:2px;">'+m.unidad+'</div>' : '') +
        '</div>' +
      '</div>' +
      '<div style="text-align:center;padding:6px 0;">' +
        '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:52px;line-height:1;color:'+(bj?'#dc2626':'#9a3412')+';">'+m.stock+'</div>' +
        '<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tl);letter-spacing:.5px;margin-top:2px;">unidades</div>' +
      '</div>' +
      '<div>' +
        '<div style="background:#f1f5f9;border-radius:99px;height:6px;overflow:hidden;margin-bottom:5px;">' +
          '<div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:99px;transition:width .3s;"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:10px;color:var(--tl);">Mín: '+(m.minimo||0)+'</span>' +
          '<span style="font-size:10px;font-weight:700;padding:1px 7px;border-radius:99px;background:'+(bj?'#fff1f2':'#f0fdf4')+';color:'+(bj?'#dc2626':'#16a34a')+'">'+(bj?'⚠ Bajo':'✓ OK')+'</span>' +
        '</div>' +
      '</div>' +
      (m.notas ? '<div style="font-size:10px;color:var(--tl);border-top:1px solid var(--bd);padding-top:8px;">'+m.notas+'</div>' : '') +
      '<div style="display:flex;gap:5px;border-top:1px solid var(--bd);padding-top:8px;">' +
        '<button class="btn btn-sk btn-sm" style="flex:1;" onclick="invEditMat(\''+m.id+'\')">✏️ Editar</button>' +
        '<button class="btn btn-sk btn-sm" title="Entrada" onclick="_invQE(\'m\',\''+m.id+'\')">⬆</button>' +
        '<button class="btn btn-or btn-sm" title="Salida" onclick="_invQS(\'m\',\''+m.id+'\')">⬇</button>' +
        '<button class="btn btn-d btn-sm" title="Eliminar" onclick="invDel(\'m\',\''+m.id+'\')">🗑</button>' +
      '</div>' +
    '</div>';
  }).join('');
  el.innerHTML = resumen + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;">' + cards + '</div>';
}

// ══════════════════════════════════════════════════════════════
// RENDER: PERSONAS
// ══════════════════════════════════════════════════════════════
function rInvPersonas() {
  var bq = (val('srch-inv-per') || '').toLowerCase();
  var map = {};
  _invMov.filter(function(m) { return m.tipo === 'salida' && m.persona; }).forEach(function(m) {
    var k = m.persona.toLowerCase();
    if (!map[k]) map[k] = { nombre: m.persona, empresa: m.empresa || '', telefono: m.telefono || '', tipo: m.tipo_persona || '', entregas: [] };
    if (m.empresa && !map[k].empresa) map[k].empresa = m.empresa;
    map[k].entregas.push(m);
  });
  _invPL = Object.values(map).filter(function(p) {
    return p.nombre.toLowerCase().indexOf(bq) > -1 || p.empresa.toLowerCase().indexOf(bq) > -1;
  }).sort(function(a, b) { return b.entregas.length - a.entregas.length; });
  var el = gel('lista-inv-per'); if (!el) return;
  if (!_invPL.length) { el.innerHTML = '<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>Sin entregas registradas.</strong><br>Aparecerán aquí en cuanto salga mercadería a un vendedor.</div>'; return; }
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:.8rem;margin-top:.9rem">' +
    _invPL.map(function(p, i) {
      var tot = p.entregas.reduce(function(s, e) { return s + e.cantidad; }, 0);
      return '<div class="card" onclick="invOpenPersona(' + i + ')" style="cursor:pointer;padding:1rem;display:flex;align-items:center;gap:12px;transition:box-shadow .2s,transform .2s"' +
        ' onmouseover="this.style.boxShadow=\'0 4px 20px rgba(0,0,0,.13)\';this.style.transform=\'translateY(-2px)\'"' +
        ' onmouseout="this.style.boxShadow=\'\';this.style.transform=\'\'">' +
        '<div class="vav" style="flex-shrink:0">' + _invIni(p.nombre) + '</div>' +
        '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:700;font-size:13.5px;color:var(--brand);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.nombre + '</div>' +
        '<div class="tm2">' + (p.tipo || '') + (p.empresa ? ' · ' + p.empresa : '') + '</div>' +
        (p.telefono ? '<div class="tm2">📱 ' + p.telefono + '</div>' : '') +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
        '<div style="font-weight:700;font-size:20px;color:var(--brand)">' + tot + '</div>' +
        '<div class="tm2">' + p.entregas.length + ' ent.</div>' +
        '</div></div>';
    }).join('') + '</div>';
}

// ── Abrir modal persona ──
function invOpenPersona(i) {
  _invPI = i; var p = _invPL[i]; if (!p) return;
  p.entregas.sort(function(a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  var meses = {}; p.entregas.forEach(function(e) { var ym = (e.fecha || '').slice(0, 7); if (ym) meses[ym] = 1; });
  var mList = Object.keys(meses).sort().reverse();
  var tot = p.entregas.reduce(function(s, e) { return s + e.cantidad; }, 0);
  gel('m-persona-title').textContent = p.nombre;
  var opsMes = mList.map(function(m) {
    var parts = m.split('-');
    var lbl = new Date(+parts[0], +parts[1] - 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    return '<option value="' + m + '">' + lbl.charAt(0).toUpperCase() + lbl.slice(1) + '</option>';
  }).join('');

  // ── Resumen por producto ──
  var prodMap = {};
  p.entregas.forEach(function(e) {
    var k = e.item_nombre || 'Sin nombre';
    if (!prodMap[k]) prodMap[k] = { nombre: k, total: 0, cat: e.categoria || 'producto' };
    prodMap[k].total += e.cantidad;
  });
  var prodList = Object.values(prodMap).sort(function(a, b) { return b.total - a.total; });

  // Intentar encontrar el vendedor para calcular stock actual
  var vendObj = null;
  if (typeof _vendedores !== 'undefined') {
    var nomLower = p.nombre.toLowerCase().trim();
    for (var vi = 0; vi < _vendedores.length; vi++) {
      if (_vendedores[vi].nombre.toLowerCase().trim() === nomLower) { vendObj = _vendedores[vi]; break; }
    }
  }
  var stockActualMap = {};
  if (vendObj && typeof stockVendedor === 'function') {
    var stk = stockVendedor(vendObj.id);
    stk.forEach(function(s) { stockActualMap[s.n.toUpperCase()] = s.c; });
  }

  var prodCardsHtml = '';
  if (prodList.length) {
    prodCardsHtml = '<div style="padding:.6rem 1rem .2rem">' +
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--tl);margin-bottom:.5rem;">Productos entregados</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.5rem;margin-bottom:.8rem">' +
      prodList.map(function(pr) {
        var stockKey = pr.nombre.toUpperCase();
        var hasStock = stockKey in stockActualMap;
        var stockVal = hasStock ? stockActualMap[stockKey] : null;
        var stockBg = stockVal === null ? '#f8fafc' : (stockVal <= 0 ? '#fef2f2' : (stockVal <= 5 ? '#fffbeb' : '#f0fdf4'));
        var stockBd = stockVal === null ? 'var(--bd)' : (stockVal <= 0 ? '#fca5a5' : (stockVal <= 5 ? '#fcd34d' : '#86efac'));
        var stockColor = stockVal === null ? 'var(--tl)' : (stockVal <= 0 ? '#dc2626' : (stockVal <= 5 ? '#92400e' : '#15803d'));
        var stockLbl = stockVal === null ? '—' : (stockVal <= 0 ? 'Sin stock' : stockVal + ' uds');
        return '<div style="background:var(--wh);border:1.5px solid var(--sky);border-radius:10px;padding:.65rem .7rem;text-align:center;">' +
          '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;line-height:1.2;margin-bottom:.35rem;">' + pr.nombre + '</div>' +
          '<div style="font-family:Bebas Neue,sans-serif;font-size:26px;color:var(--brand);line-height:1">' + pr.total + '</div>' +
          '<div style="font-size:9px;color:var(--tl);margin-bottom:.4rem">uds. entregadas</div>' +
          (hasStock ? '<div style="background:' + stockBg + ';border:1px solid ' + stockBd + ';border-radius:6px;padding:2px 6px;font-size:10px;font-weight:700;color:' + stockColor + ';">' + stockLbl + '</div>' : '') +
        '</div>';
      }).join('') +
      '</div></div>';
  }

  gel('m-persona-body').innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;padding:.8rem 1rem;border-bottom:1px solid var(--bd);margin-bottom:.5rem">' +
      '<div class="vav" style="flex-shrink:0">' + _invIni(p.nombre) + '</div>' +
      '<div style="flex:1"><div style="font-weight:700;font-size:14px;color:var(--brand)">' + p.nombre + '</div>' +
      '<div class="tm2">' + (p.tipo || '') + (p.empresa ? ' · ' + p.empresa : '') + (p.telefono ? ' · 📱 ' + p.telefono : '') + '</div></div>' +
      '<div style="text-align:right">' +
        '<div style="font-weight:700;font-size:22px;color:var(--brand)" id="pm-tot">' + tot + ' uds</div>' +
        '<div class="tm2" id="pm-ent">' + p.entregas.length + ' entrega' + (p.entregas.length !== 1 ? 's' : '') + '</div>' +
      '</div></div>' +
    prodCardsHtml +
    '<div style="display:flex;align-items:center;padding:.4rem 1rem .6rem">' +
      '<select id="pm-mes" onchange="invRenderPersonaTabla(this.value)" style="padding:.35rem .7rem;border:1px solid var(--bd);border-radius:var(--r);font-size:13px;color:var(--td);background:var(--wh)">' +
        '<option value="">Todos los meses</option>' + opsMes +
      '</select></div>' +
    '<div style="overflow-x:auto;padding:0 .5rem"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Ítem</th><th>Cant.</th><th>Motivo</th><th></th></tr></thead>' +
      '<tbody id="pm-tbody">' + _invRenderPersonaTbody(p.entregas) + '</tbody></table></div>';
  abrirModal('m-persona');
}
function _invRenderPersonaTbody(ent) {
  if (!ent.length) return '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:#aaa">Sin movimientos en este período.</td></tr>';
  return ent.map(function(e) {
    return '<tr><td>' + fmt(e.fecha) + '</td>' +
      '<td><span class="b ' + (e.categoria === 'producto' ? 'b-sk' : 'b-or') + '">' + (e.categoria === 'producto' ? 'Producto' : 'Material') + '</span></td>' +
      '<td>' + e.item_nombre + '</td><td><strong>' + e.cantidad + '</strong></td>' +
      '<td class="tm2">' + (e.motivo || '—') + '</td>' +
      '<td style="white-space:nowrap">' +
        '<button class="btn btn-sk btn-sm" onclick="invEditMov(\'' + e.id + '\',\'' + e.categoria + '\')">✏️</button>' +
        '<button class="btn btn-d btn-sm" style="margin-left:3px" onclick="invDelMov(\'' + e.id + '\',\'' + e.categoria + '\',\'' + e.item_id + '\',' + e.cantidad + ',\'' + e.tipo + '\')">🗑</button>' +
      '</td></tr>';
  }).join('');
}
function invRenderPersonaTabla(mes) {
  var p = _invPL[_invPI]; if (!p) return;
  var src = mes ? p.entregas.filter(function(e) { return (e.fecha || '').indexOf(mes) === 0; }) : p.entregas;
  var tot = src.reduce(function(s, e) { return s + e.cantidad; }, 0);
  gel('pm-tot').textContent = tot + ' uds';
  gel('pm-ent').textContent = src.length + ' entrega' + (src.length !== 1 ? 's' : '');
  gel('pm-tbody').innerHTML = _invRenderPersonaTbody(src);
}

// ══════════════════════════════════════════════════════════════
// RENDER: HISTORIAL
// ══════════════════════════════════════════════════════════════
function fInvHist(f, btn) {
  _invHF = f;
  document.querySelectorAll('#page-inv-historial .tabs .tab').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  // Al cambiar de pestaña Todos/Productos/Materiales no resetear el mes elegido
  rInvHist();
}
function rInvHist() {
  var src = _invHF === 'todos' ? _invMov : _invMov.filter(function(m) { return m.categoria === _invHF; });
  // Poblar filtro de meses
  var smEl = gel('inv-h-filt-mes');
  if (smEl) {
    var cm = smEl.value;
    var mesesMap = {};
    _invMov.forEach(function(m) { if (m.fecha) { var ym = String(m.fecha).substring(0, 7); if (ym) mesesMap[ym] = 1; } });
    var mesesList = Object.keys(mesesMap).sort().reverse();
    var nomMes = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    smEl.innerHTML = '<option value="">Todos los meses</option>' + mesesList.map(function(ym) {
      var p = ym.split('-');
      return '<option value="' + ym + '">' + nomMes[parseInt(p[1]) - 1] + ' ' + p[0] + '</option>';
    }).join('');
    smEl.value = cm;
    // Solo en la primera carga (nunca si el usuario eligió "Todos los meses")
    if (!_invHistMesIniciado) {
      _invHistMesIniciado = true;
      if (!smEl.value) {
        var d = new Date();
        var mesAct = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        smEl.value = mesAct;
      }
    }
  }
  var svEl = gel('inv-h-filt-vend'), siEl = gel('inv-h-filt-item'), stEl = gel('inv-h-filt-tipo');
  if (svEl) {
    var cv = svEl.value;
    var vends = _invMov.filter(function(m) { return m.persona; }).map(function(m) { return m.persona; });
    vends = vends.filter(function(v, i, a) { return a.indexOf(v) === i; }).sort();
    svEl.innerHTML = '<option value="">Todos los vendedores</option>' + vends.map(function(v) { return '<option value="' + v + '">' + v + '</option>'; }).join('');
    svEl.value = cv;
  }
  if (siEl) {
    var ci = siEl.value;
    var seen = new Map();
    _invMov.forEach(function(m) { if (m.item_nombre) { var k = m.item_nombre.toLowerCase(); if (!seen.has(k)) seen.set(k, m.item_nombre); } });
    var items = Array.from(seen.values()).sort(function(a, b) { return a.localeCompare(b, 'es'); });
    siEl.innerHTML = '<option value="">Todos los ítems</option>' + items.map(function(i) { return '<option value="' + i.toLowerCase() + '">' + i + '</option>'; }).join('');
    siEl.value = ci;
  }
  var flEl = gel('inv-h-filt-lote');
  var fm = smEl ? smEl.value : '';
  var fv = svEl ? svEl.value : '', fi = siEl ? siEl.value : '', ft = stEl ? stEl.value : '', fl = flEl ? (flEl.value || '').trim().toLowerCase() : '';
  if (fm) src = src.filter(function(m) { return (m.fecha || '').indexOf(fm) === 0; });
  if (fv) src = src.filter(function(m) { return m.persona === fv; });
  if (fi) src = src.filter(function(m) { return (m.item_nombre || '').toLowerCase() === fi; });
  if (ft) src = src.filter(function(m) { return m.tipo === ft; });
  if (fl) src = src.filter(function(m) { return (m.lote || '').toLowerCase().indexOf(fl) > -1; });
  // Ordenar: más reciente primero
  src = src.slice().sort(function(a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  var el = gel('tbl-inv-h'); if (!el) return;
  el.innerHTML = src.length ?
    '<table><thead><tr><th>Fecha</th><th>Categoría</th><th>Ítem</th><th>Tipo</th><th>Cant.</th><th>Lote</th><th>Persona</th><th>Empresa</th><th>Motivo</th><th></th></tr></thead><tbody>' +
    src.map(function(m) {
      return '<tr>' +
        '<td>' + fmt(m.fecha) + '</td>' +
        '<td><span class="b ' + (m.categoria === 'producto' ? 'b-sk' : 'b-or') + '">' + (m.categoria === 'producto' ? 'Producto' : 'Material') + '</span></td>' +
        '<td>' + m.item_nombre + '</td>' +
        '<td><span class="b b-' + (m.tipo === 'entrada' ? 'in' : 'out') + '">' + (m.tipo === 'entrada' ? '⬆ Entrada' : '⬇ Salida') + '</span></td>' +
        '<td><strong>' + m.cantidad + '</strong></td>' +
        '<td class="tm2">' + (m.lote ? '<span style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:1px 7px;font-size:11px;font-weight:600;color:#166534;">📦 ' + m.lote + '</span>' : '—') + '</td>' +
        '<td>' + (m.persona ? '<span class="ptag">👤 ' + m.persona + '</span>' : '—') + '</td>' +
        '<td class="tm2">' + (m.empresa || '—') + '</td>' +
        '<td class="tm2">' + (m.motivo || '—') + '</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="btn btn-sk btn-sm" onclick="invEditMov(\'' + m.id + '\',\'' + m.categoria + '\')">✏️</button>' +
          '<button class="btn btn-d btn-sm" style="margin-left:3px" onclick="invDelMov(\'' + m.id + '\',\'' + m.categoria + '\',\'' + m.item_id + '\',' + m.cantidad + ',\'' + m.tipo + '\')">🗑</button>' +
        '</td></tr>';
    }).join('') + '</tbody></table>' :
    '<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>Sin movimientos en este periodo.</strong><br>Prueba con otro rango de fechas.</div>';
}

// ══════════════════════════════════════════════════════════════
// CRUD: NUEVO PRODUCTO
// ══════════════════════════════════════════════════════════════
async function invGNP() {
  var nom = val('np-nom'); if (!nom) { setSt('El nombre es obligatorio','er'); return; }
  setBL('btn-np', true);
  try {
    var stk = parseInt(gel('np-stk').value) || 0;
    var res = await sbP('productos', { nombre: nom, categoria: gel('np-cat').value, presentacion: val('np-pre'), stock: stk, minimo: parseInt(gel('np-min').value) || 5, notas: val('np-not') });
    var prod = Array.isArray(res) ? res[0] : res;
    if (stk > 0) await sbP('movimientos', { tipo: 'entrada', categoria: 'producto', item_id: prod.id, item_nombre: prod.nombre, cantidad: stk, motivo: 'Stock inicial', fecha: hoy() });
    await loadAll(); invCloseModal('m-np');
    ['np-nom', 'np-not'].forEach(function(x) { var e = gel(x); if (e) e.value = ''; });
    gel('np-stk').value = '0'; _rInvCurrent(); setSt('Producto guardado', 'ok'); setTimeout(function() { setSt(''); }, 3000);
  } catch(e) { setSt(SVUI.error(e), 'er'); } finally { setBL('btn-np', false, 'Guardar'); }
}

// ══════════════════════════════════════════════════════════════
// CRUD: NUEVO MATERIAL
// ══════════════════════════════════════════════════════════════
async function invGNM() {
  var nom = gel('nm-tip').value; if (nom === 'Otro') nom = val('nm-otr') || 'Material';
  setBL('btn-nm', true);
  try {
    var stk = parseInt(gel('nm-stk').value) || 0;
    var res = await sbP('materiales', { nombre: nom, unidad: gel('nm-uni').value, stock: stk, minimo: parseInt(gel('nm-min').value) || 10, notas: val('nm-not') });
    var mat = Array.isArray(res) ? res[0] : res;
    if (stk > 0) await sbP('movimientos', { tipo: 'entrada', categoria: 'material', item_id: mat.id, item_nombre: mat.nombre, cantidad: stk, motivo: 'Stock inicial', fecha: hoy() });
    await loadAll(); invCloseModal('m-nm'); _rInvCurrent(); setSt('Material guardado', 'ok'); setTimeout(function() { setSt(''); }, 3000);
  } catch(e) { setSt(SVUI.error(e), 'er'); } finally { setBL('btn-nm', false, 'Guardar'); }
}

// ══════════════════════════════════════════════════════════════
// CRUD: ENTRADA PRODUCTO
// ══════════════════════════════════════════════════════════════
async function invGEP() {
  var id = gel('ep-itm').value, can = parseInt(gel('ep-can').value) || 0;
  if (can <= 0) { setSt('Cantidad inválida','er'); return; }
  var prod = _productos.find(function(x) { return x.id === id; }); if (!prod) return;
  setBL('btn-ep', true);
  try {
    await sbU('productos', id, { stock: prod.stock + can });
    await sbP('movimientos', { tipo: 'entrada', categoria: 'producto', item_id: id, item_nombre: prod.nombre, cantidad: can, motivo: val('ep-mot') || 'Compra', persona: val('ep-res'), lote: val('ep-lote'), fecha: gel('ep-fec').value || hoy() });
    await loadAll(); invCloseModal('m-ep'); _rInvCurrent(); setSt('Entrada registrada', 'ok'); setTimeout(function() { setSt(''); }, 3000);
  } catch(e) { setSt(SVUI.error(e), 'er'); } finally { setBL('btn-ep', false, 'Registrar'); }
}

// ══════════════════════════════════════════════════════════════
// CRUD: SALIDA PRODUCTO
// ══════════════════════════════════════════════════════════════
async function invGSP() {
  var sv = gel('sp-per').value; if (!sv) { setSt('Selecciona un vendedor','er'); return; }
  var vnd = _vendedores.find(function(x) { return x.id === sv; });
  var id = gel('sp-itm').value, can = parseInt(gel('sp-can').value) || 0;
  if (can <= 0) { setSt('Cantidad inválida','er'); return; }
  var prod = _productos.find(function(x) { return x.id === id; }); if (!prod) return;
  if (prod.stock < can) { setSt('Stock insuficiente: ' + prod.stock,'er'); return; }
  setBL('btn-sp', true);
  try {
    await sbU('productos', id, { stock: prod.stock - can });
    await sbP('movimientos', { tipo: 'salida', categoria: 'producto', item_id: id, item_nombre: prod.nombre, cantidad: can, motivo: gel('sp-mot').value, persona: vnd ? vnd.nombre : '', empresa: val('sp-emp') || (vnd ? vnd.empresa : '') || '', telefono: vnd ? vnd.telefono : '', tipo_persona: vnd ? vnd.tipo : '', notas: val('sp-not'), lote: val('sp-lote'), vendedor_id: sv, fecha: gel('sp-fec').value || hoy() });
    await loadAll(); invCloseModal('m-sp');
    ['sp-emp', 'sp-not'].forEach(function(x) { var e = gel(x); if (e) e.value = ''; });
    _rInvCurrent(); setSt('Entrega registrada', 'ok'); setTimeout(function() { setSt(''); }, 3000);
  } catch(e) { setSt(SVUI.error(e), 'er'); } finally { setBL('btn-sp', false, 'Registrar'); }
}

// ══════════════════════════════════════════════════════════════
// CRUD: ENTRADA MATERIAL
// ══════════════════════════════════════════════════════════════
async function invGEM() {
  var id = gel('em-itm').value, can = parseInt(gel('em-can').value) || 0;
  if (can <= 0) { setSt('Cantidad inválida','er'); return; }
  var mat = _materiales.find(function(x) { return x.id === id; }); if (!mat) return;
  setBL('btn-em', true);
  try {
    await sbU('materiales', id, { stock: mat.stock + can });
    await sbP('movimientos', { tipo: 'entrada', categoria: 'material', item_id: id, item_nombre: mat.nombre, cantidad: can, motivo: val('em-mot') || 'Compra', persona: val('em-res'), lote: val('em-lote'), fecha: gel('em-fec').value || hoy() });
    await loadAll(); invCloseModal('m-em'); _rInvCurrent(); setSt('Entrada registrada', 'ok'); setTimeout(function() { setSt(''); }, 3000);
  } catch(e) { setSt(SVUI.error(e), 'er'); } finally { setBL('btn-em', false, 'Registrar'); }
}

// ══════════════════════════════════════════════════════════════
// CRUD: SALIDA MATERIAL
// ══════════════════════════════════════════════════════════════
async function invGSM() {
  var sv = gel('sm-per').value; if (!sv) { setSt('Selecciona un vendedor','er'); return; }
  var vnd = _vendedores.find(function(x) { return x.id === sv; });
  var id = gel('sm-itm').value, can = parseInt(gel('sm-can').value) || 0;
  if (can <= 0) { setSt('Cantidad inválida','er'); return; }
  var mat = _materiales.find(function(x) { return x.id === id; }); if (!mat) return;
  if (mat.stock < can) { setSt('Stock insuficiente: ' + mat.stock,'er'); return; }
  setBL('btn-sm', true);
  try {
    await sbU('materiales', id, { stock: mat.stock - can });
    await sbP('movimientos', { tipo: 'salida', categoria: 'material', item_id: id, item_nombre: mat.nombre, cantidad: can, motivo: val('sm-mot'), persona: vnd ? vnd.nombre : '', empresa: val('sm-emp') || (vnd ? vnd.empresa : '') || '', telefono: vnd ? vnd.telefono : '', tipo_persona: vnd ? vnd.tipo : '', notas: val('sm-not'), lote: val('sm-lote'), vendedor_id: sv, fecha: gel('sm-fec').value || hoy() });
    await loadAll(); invCloseModal('m-sm');
    ['sm-emp', 'sm-not', 'sm-mot'].forEach(function(x) { var e = gel(x); if (e) e.value = ''; });
    _rInvCurrent(); setSt('Entrega registrada', 'ok'); setTimeout(function() { setSt(''); }, 3000);
  } catch(e) { setSt(SVUI.error(e), 'er'); } finally { setBL('btn-sm', false, 'Registrar'); }
}

// ══════════════════════════════════════════════════════════════
// CRUD: ELIMINAR PRODUCTO / MATERIAL
// ══════════════════════════════════════════════════════════════
function invDel(tp, id) {
  showConfirm('¿Eliminar este elemento?','Eliminar','Eliminar',function(){
    (tp === 'p' ? sbDel('productos','id=eq.'+id) : sbDel('materiales','id=eq.'+id))
    .then(function(){return loadAll();})
    .then(function(){_rInvCurrent();setSt('Eliminado','ok');setTimeout(function(){setSt('');},2500);})
    .catch(function(e){setSt(SVUI.error(e),'er');});
  });
}
function _invQE(tp, id) { invOpenModal(tp === 'p' ? 'ep' : 'em'); setTimeout(function() { var el = gel(tp === 'p' ? 'ep-itm' : 'em-itm'); if (el) el.value = id; }, 80); }
function _invQS(tp, id) { invOpenModal(tp === 'p' ? 'sp' : 'sm'); setTimeout(function() { var el = gel(tp === 'p' ? 'sp-itm' : 'sm-itm'); if (el) el.value = id; }, 80); }

// ══════════════════════════════════════════════════════════════
// CRUD: EDITAR PRODUCTO
// ══════════════════════════════════════════════════════════════
function invEditProd(id) {
  var prod = _productos.find(function(x) { return x.id === id; }); if (!prod) return;
  gel('editprod-id').value = prod.id;
  gel('editprod-nom').value = prod.nombre || '';
  gel('editprod-cat').value = prod.categoria || 'Suplemento';
  gel('editprod-pre').value = prod.presentacion || '';
  gel('editprod-stk').value = prod.stock || 0;
  gel('editprod-min').value = prod.minimo || 5;
  gel('editprod-not').value = prod.notas || '';
  abrirModal('m-editprod');
}
async function invSaveProd() {
  var id = val('editprod-id'), nom = val('editprod-nom');
  if (!nom) { setSt('El nombre es obligatorio','er'); return; }
  var newStk = parseInt(gel('editprod-stk').value);
  if (isNaN(newStk) || newStk < 0) { setSt('Stock inválido','er'); return; }
  setBL('btn-editprod', true);
  try {
    await sbU('productos', id, { nombre: nom, categoria: gel('editprod-cat').value, presentacion: val('editprod-pre'), stock: newStk, minimo: parseInt(gel('editprod-min').value) || 5, notas: val('editprod-not') });
    await loadAll(); invCloseModal('m-editprod'); _rInvCurrent(); setSt('Producto actualizado', 'ok'); setTimeout(function() { setSt(''); }, 3000);
  } catch(e) { setSt(SVUI.error(e), 'er'); } finally { setBL('btn-editprod', false, 'Guardar'); }
}

// ══════════════════════════════════════════════════════════════
// CRUD: EDITAR MATERIAL
// ══════════════════════════════════════════════════════════════
function invEditMat(id) {
  var mat = _materiales.find(function(x) { return x.id === id; }); if (!mat) return;
  gel('editmat-id').value = mat.id;
  gel('editmat-nom').value = mat.nombre || '';
  gel('editmat-uni').value = mat.unidad || 'unidades';
  gel('editmat-stk').value = mat.stock || 0;
  gel('editmat-min').value = mat.minimo || 10;
  gel('editmat-not').value = mat.notas || '';
  abrirModal('m-editmat');
}
async function invSaveMat() {
  var id = val('editmat-id'), nom = val('editmat-nom');
  if (!nom) { setSt('El nombre es obligatorio','er'); return; }
  var newStk = parseInt(gel('editmat-stk').value);
  if (isNaN(newStk) || newStk < 0) { setSt('Stock inválido','er'); return; }
  setBL('btn-editmat', true);
  try {
    await sbU('materiales', id, { nombre: nom, unidad: gel('editmat-uni').value, stock: newStk, minimo: parseInt(gel('editmat-min').value) || 10, notas: val('editmat-not') });
    await loadAll(); invCloseModal('m-editmat'); _rInvCurrent(); setSt('Material actualizado', 'ok'); setTimeout(function() { setSt(''); }, 3000);
  } catch(e) { setSt(SVUI.error(e), 'er'); } finally { setBL('btn-editmat', false, 'Guardar'); }
}

// ══════════════════════════════════════════════════════════════
// CRUD: EDITAR MOVIMIENTO
// ══════════════════════════════════════════════════════════════
function invEditMov(id, cat) {
  var mov = _invMov.find(function(m) { return m.id === id; }); if (!mov) return;
  gel('editmov-id').value = mov.id;
  gel('editmov-cat').value = mov.categoria;
  gel('editmov-item-id').value = mov.item_id || '';
  gel('editmov-old-can').value = mov.cantidad;
  gel('editmov-old-tipo').value = mov.tipo;
  gel('editmov-item').value = mov.item_nombre || '';
  gel('editmov-tipo').value = mov.tipo;
  gel('editmov-can').value = mov.cantidad;
  gel('editmov-fec').value = (mov.fecha || '').split('T')[0];
  gel('editmov-per').value = mov.persona || '';
  gel('editmov-emp').value = mov.empresa || '';
  gel('editmov-mot').value = mov.motivo || '';
  gel('editmov-not').value = mov.notas || '';
  abrirModal('m-editmov');
}
async function invSaveMov() {
  var id = val('editmov-id'), cat = val('editmov-cat'), itemId = val('editmov-item-id');
  var oldCan = parseInt(gel('editmov-old-can').value) || 0;
  var oldTipo = val('editmov-old-tipo');
  var newCan = parseInt(gel('editmov-can').value) || 0;
  var newTipo = gel('editmov-tipo').value;
  if (newCan <= 0) { setSt('Cantidad inválida','er'); return; }
  setBL('btn-editmov', true);
  try {
    var tbl = cat === 'producto' ? 'productos' : 'materiales';
    var item = cat === 'producto' ? _productos.find(function(x) { return x.id === itemId; }) : _materiales.find(function(x) { return x.id === itemId; });
    if (item && itemId) {
      var stock = item.stock;
      if (oldTipo === 'entrada') stock -= oldCan; else stock += oldCan;
      if (newTipo === 'entrada') stock += newCan; else stock -= newCan;
      if (stock < 0) { setSt('Stock insuficiente tras el ajuste: ' + stock,'er'); setBL('btn-editmov', false, 'Guardar'); return; }
      await sbU(tbl, itemId, { stock: stock });
    }
    await sbU('movimientos', id, { tipo: newTipo, cantidad: newCan, fecha: gel('editmov-fec').value || hoy(), persona: val('editmov-per'), empresa: val('editmov-emp'), motivo: val('editmov-mot'), notas: val('editmov-not') });
    await loadAll(); invCloseModal('m-editmov');
    if (_invPI >= 0 && gel('m-persona') && gel('m-persona').classList.contains('open')) invOpenPersona(_invPI);
    _rInvCurrent(); setSt('Movimiento actualizado', 'ok'); setTimeout(function() { setSt(''); }, 3000);
  } catch(e) { setSt(SVUI.error(e), 'er'); } finally { setBL('btn-editmov', false, 'Guardar'); }
}
function invDelMov(id, cat, itemId, can, tipo) {
  if (!id) { id = val('editmov-id'); cat = val('editmov-cat'); itemId = val('editmov-item-id'); can = parseInt(gel('editmov-old-can').value) || 0; tipo = val('editmov-old-tipo'); }
  showConfirm('¿Eliminar este movimiento? Se ajustará el stock.','Eliminar movimiento','Eliminar',function(){
    var tbl = cat === 'producto' ? 'productos' : 'materiales';
    var item = cat === 'producto' ? _productos.find(function(x){return x.id===itemId;}) : _materiales.find(function(x){return x.id===itemId;});
    var stockProm = Promise.resolve();
    if (item && itemId) {
      var stock = item.stock;
      if (tipo === 'entrada') stock -= can; else stock += can;
      if (stock < 0) { setSt('Stock quedaría negativo: '+stock+'. Operación cancelada.','er'); return; }
      stockProm = sbU(tbl, itemId, {stock:stock});
    }
    stockProm.then(function(){return sbDel('movimientos','id=eq.'+id);})
    .then(function(){return loadAll();})
    .then(function(){
      invCloseModal('m-editmov');
      if (_invPI >= 0 && gel('m-persona') && gel('m-persona').classList.contains('open')) invOpenPersona(_invPI);
      _rInvCurrent(); setSt('Movimiento eliminado','ok'); setTimeout(function(){setSt('');},3000);
    }).catch(function(e){setSt(SVUI.error(e),'er');});
  });
}

// ══════════════════════════════════════════════════════════════
// PDF: POR PERSONA
// ══════════════════════════════════════════════════════════════
function invExportPersonaPDF() {
  var p = _invPL[_invPI]; if (!p) return;
  var mes = gel('pm-mes') ? gel('pm-mes').value : '';
  var src = mes ? p.entregas.filter(function(e) { return (e.fecha || '').indexOf(mes) === 0; }) : p.entregas;
  var tot = src.reduce(function(s, e) { return s + e.cantidad; }, 0);
  var mesLbl = mes ? (function() { var pts = mes.split('-'); return new Date(+pts[0], +pts[1] - 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }); })() : 'Todos los meses';
  var mesCapit = mesLbl.charAt(0).toUpperCase() + mesLbl.slice(1);
  var subInfo = [p.tipo, p.empresa].filter(Boolean).join(' · ');
  var rows = src.map(function(e, i) {
    return '<tr style="background:' + (i % 2 === 0 ? '#fff' : '#f8fafc') + ';border-bottom:1px solid #f3f4f6;">' +
      '<td style="padding:7px 10px;font-size:11px;">' + fmt(e.fecha) + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;">' + (e.categoria === 'producto' ? 'Producto' : 'Material') + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;">' + e.item_nombre + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;text-align:center;font-weight:700;">' + e.cantidad + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;">' + (e.motivo || '—') + '</td></tr>';
  }).join('');
  var hdr = '<div style="background:#253C61;color:#fff;padding:24px 32px;display:flex;align-items:center;gap:16px;">' +
    '<div style="flex:1"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:32px;letter-spacing:1px;">SUPLEVET</div>' +
    '<div style="font-size:18px;font-weight:700;margin-top:2px;">Movimientos — ' + p.nombre + '</div>' +
    '<div style="font-size:13px;opacity:.8;margin-top:2px;">' + (subInfo ? subInfo + ' · ' : '') + mesCapit + '</div></div>' +
    '<div style="text-align:right;font-size:12px;opacity:.7;">' + new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</div></div>';
  var kpis = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:20px 32px;">' +
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#718096;font-weight:600;text-transform:uppercase;">Unidades entregadas</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:26px;color:#253C61;">' + tot + '</div></div>' +
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#718096;font-weight:600;text-transform:uppercase;">Entregas</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:26px;color:#253C61;">' + src.length + '</div></div>' +
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#718096;font-weight:600;text-transform:uppercase;">Período</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:18px;color:#253C61;">' + mesCapit + '</div></div></div>';
  var tbl = '<div style="padding:0 32px 28px;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#253C61;">' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Fecha</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Tipo</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Ítem</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:center;color:#fff;font-weight:700;text-transform:uppercase;">Cant.</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Motivo</th>' +
    '</tr></thead><tbody>' + (rows || '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#aaa;">Sin movimientos en este período</td></tr>') + '</tbody></table></div>';
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Movimientos — ' + p.nombre + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">' +
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>' +
    '</head><body>' + hdr + kpis + tbl + '<script>window.onload=function(){window.print();};<\/script></body></html>';
  var w = window.open('', '_blank'); if (!w) return; w.document.write(html); w.document.close();
}

// ══════════════════════════════════════════════════════════════
// PDF: HISTORIAL
// ══════════════════════════════════════════════════════════════
function invExportHistPDF() {
  var src = (_invHF === 'todos' ? _invMov : _invMov.filter(function(m) { return m.categoria === _invHF; })).slice();
  var fm = gel('inv-h-filt-mes') ? gel('inv-h-filt-mes').value : '';
  var fv = gel('inv-h-filt-vend') ? gel('inv-h-filt-vend').value : '';
  var fi = gel('inv-h-filt-item') ? gel('inv-h-filt-item').value : '';
  var ft = gel('inv-h-filt-tipo') ? gel('inv-h-filt-tipo').value : '';
  if (fm) src = src.filter(function(m) { return (m.fecha || '').indexOf(fm) === 0; });
  if (fv) src = src.filter(function(m) { return m.persona === fv; });
  if (fi) src = src.filter(function(m) { return (m.item_nombre || '').toLowerCase() === fi; });
  if (ft) src = src.filter(function(m) { return m.tipo === ft; });
  var _nsM=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var mesLabel=fm?(function(){var _p=fm.split('-');return _nsM[parseInt(_p[1])-1]+' '+_p[0];}()):'';
  var titulo = 'Historial de Movimientos' + (_invHF !== 'todos' ? ' — ' + _invHF.charAt(0).toUpperCase() + _invHF.slice(1) : '');
  var subtit = [mesLabel?'Período: '+mesLabel:'', fv ? 'Vendedor: ' + fv : '', fi ? 'Ítem: ' + fi : '', ft ? (ft.charAt(0).toUpperCase() + ft.slice(1) + 's') : ''].filter(Boolean).join(' · ') || 'Todos los movimientos';
  var totalUds = src.reduce(function(s, m) { return s + m.cantidad; }, 0);
  var entradas = src.filter(function(m) { return m.tipo === 'entrada'; }).reduce(function(s, m) { return s + m.cantidad; }, 0);
  var salidas = src.filter(function(m) { return m.tipo === 'salida'; }).reduce(function(s, m) { return s + m.cantidad; }, 0);
  var rows = src.map(function(e, i) {
    var tipoBg = e.tipo === 'entrada' ? '#dcfce7' : '#fee2e2';
    var tipoCl = e.tipo === 'entrada' ? '#166534' : '#991b1b';
    return '<tr style="background:' + (i % 2 === 0 ? '#fff' : '#f8fafc') + ';border-bottom:1px solid #f3f4f6;">' +
      '<td style="padding:7px 10px;font-size:11px;">' + fmt(e.fecha) + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;">' + (e.categoria === 'producto' ? 'Producto' : 'Material') + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;">' + e.item_nombre + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;"><span style="background:' + tipoBg + ';color:' + tipoCl + ';padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">' + (e.tipo === 'entrada' ? '⬆ Entrada' : '⬇ Salida') + '</span></td>' +
      '<td style="padding:7px 10px;font-size:11px;text-align:center;font-weight:700;">' + e.cantidad + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;">' + (e.persona || '—') + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;">' + (e.empresa || '—') + '</td>' +
      '<td style="padding:7px 10px;font-size:11px;">' + (e.motivo || '—') + '</td></tr>';
  }).join('');
  var hdr = '<div style="background:#253C61;color:#fff;padding:24px 32px;display:flex;align-items:center;gap:16px;">' +
    '<div style="flex:1"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:32px;letter-spacing:1px;">SUPLEVET</div>' +
    '<div style="font-size:18px;font-weight:700;margin-top:2px;">' + titulo + '</div>' +
    '<div style="font-size:13px;opacity:.8;margin-top:2px;">' + subtit + '</div></div>' +
    '<div style="text-align:right;font-size:12px;opacity:.7;">' + new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</div></div>';
  var kpis = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:20px 32px;">' +
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#718096;font-weight:600;text-transform:uppercase;">Movimientos</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:26px;color:#253C61;">' + src.length + '</div></div>' +
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#718096;font-weight:600;text-transform:uppercase;">Total unidades</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:26px;color:#253C61;">' + totalUds + '</div></div>' +
    '<div style="background:#dcfce7;border:1.5px solid #86efac;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#166534;font-weight:600;text-transform:uppercase;">Entradas</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:26px;color:#166534;">' + entradas + '</div></div>' +
    '<div style="background:#fee2e2;border:1.5px solid #fca5a5;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#991b1b;font-weight:600;text-transform:uppercase;">Salidas</div><div style="font-family:\'Bebas Neue\',sans-serif;font-size:26px;color:#dc2626;">' + salidas + '</div></div></div>';
  var tbl = '<div style="padding:0 32px 28px;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#253C61;">' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Fecha</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Cat.</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Ítem</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Tipo</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:center;color:#fff;font-weight:700;text-transform:uppercase;">Cant.</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Persona</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Empresa</th>' +
    '<th style="padding:8px 10px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Motivo</th>' +
    '</tr></thead><tbody>' + (rows || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#aaa;">Sin movimientos</td></tr>') + '</tbody></table></div>';
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'+_pdfFavicon()+'<title>' + titulo + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">' +
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>' +
    '</head><body>' + hdr + kpis + tbl + '<script>window.onload=function(){window.print();};<\/script></body></html>';
  var w = window.open('', '_blank'); if (!w) return; w.document.write(html); w.document.close();
}

function rptPdfInvHist() {
  var mes = gel('rpt-mes-inv') ? gel('rpt-mes-inv').value : '';
  var fMes = gel('inv-h-filt-mes');
  if (fMes) fMes.value = mes;
  _invHF = 'todos';
  invExportHistPDF();
}

// ══════════════════════════════════════════════════════════════
// EXPORT CSV
// ══════════════════════════════════════════════════════════════
function invExportCSV() {
  var hdr = ['Fecha', 'Categoría', 'Ítem', 'Tipo', 'Cantidad', 'Persona', 'Empresa', 'Motivo'];
  var rows = _invMov.map(function(m) { return [m.fecha, m.categoria, m.item_nombre, m.tipo, m.cantidad, m.persona || '', m.empresa || '', m.motivo || '']; });
  var csv = [hdr].concat(rows).map(function(r) { return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
  var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob); var a = document.createElement('a');
  a.href = url; a.download = 'suplevet_inv_' + hoy() + '.csv'; a.click(); URL.revokeObjectURL(url);
}
