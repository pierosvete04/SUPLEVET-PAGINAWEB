// ══════════════════════════════════════════════════════════════
// PROYECCIÓN DE STOCK — ¿Cuándo iniciar el siguiente lote?
// ══════════════════════════════════════════════════════════════

var _spVentana   = 30;   // días analizados para velocidad
var _TIPOS_VENTA = ['Venta al contado','Venta delivery','Credito a 15 dias','Crédito a 15 días'];

// ── ENTRADA PRINCIPAL ──────────────────────────────────────────
function rStockProyeccion(){
  _spLoadSettings();

  var leadTime   = parseInt((gel('sp-lead-time')  && gel('sp-lead-time').value)  || 30);
  var umbralCrit = parseInt((gel('sp-umbral-crit') && gel('sp-umbral-crit').value)|| 0);
  var umbralBajo = parseInt((gel('sp-umbral-bajo') && gel('sp-umbral-bajo').value)|| 14);

  var hoy = new Date(); hoy.setHours(0,0,0,0);
  var limiteInf = new Date(hoy.getTime() - _spVentana * 86400000)
                    .toISOString().split('T')[0];

  var resultados = _productos.map(function(p){
    return _spCalc(p, limiteInf, hoy, leadTime, umbralCrit, umbralBajo);
  });

  // Orden: critico → pronto → ok → sinDatos, luego por diasParaOrdenar asc
  var ord = {critico:0, pronto:1, ok:2, sinDatos:3};
  resultados.sort(function(a,b){
    if(ord[a.status] !== ord[b.status]) return ord[a.status]-ord[b.status];
    return (a.diasParaOrdenar !== null ? a.diasParaOrdenar : 9999)
         - (b.diasParaOrdenar !== null ? b.diasParaOrdenar : 9999);
  });

  _spRenderPage(resultados, leadTime);
  _spRenderDashWidget(resultados);
  _spUpdateNavBadge(resultados);
}

// ── CÁLCULO POR PRODUCTO ───────────────────────────────────────
function _spCalc(p, limiteInf, hoy, leadTime, umbralCrit, umbralBajo){
  var en_periodo = _ventas.filter(function(v){
    return v.producto === p.nombre
        && v.fecha >= limiteInf
        && v.estado !== 'Anulado';
  });

  var vendidas = en_periodo
    .filter(function(v){ return _TIPOS_VENTA.indexOf(v.movimiento) >= 0; })
    .reduce(function(s,v){ return s + (parseInt(v.cantidad)||0); }, 0);

  var devueltas = en_periodo
    .filter(function(v){ return v.movimiento === 'Devolucion'; })
    .reduce(function(s,v){ return s + (parseInt(v.cantidad)||0); }, 0);

  var netas = Math.max(0, vendidas - devueltas);
  var velDia = netas > 0 ? netas / _spVentana : 0;

  var diasRest = null, fechaAgot = null, diasOrden = null, fechaOrden = null;

  if(velDia > 0){
    diasRest  = Math.floor((p.stock || 0) / velDia);
    fechaAgot = new Date(hoy.getTime() + diasRest * 86400000);
    diasOrden = diasRest - leadTime;
    fechaOrden= new Date(hoy.getTime() + diasOrden * 86400000);
  }

  var status;
  if(velDia === 0)              status = 'sinDatos';
  else if(diasOrden <= umbralCrit) status = 'critico';
  else if(diasOrden <= umbralBajo) status = 'pronto';
  else                             status = 'ok';

  return {
    p: p,
    vendidas: vendidas, devueltas: devueltas, netas: netas,
    velDia: velDia,
    diasRest: diasRest, fechaAgot: fechaAgot,
    diasParaOrdenar: diasOrden, fechaOrden: fechaOrden,
    status: status
  };
}

// ── RENDERIZADO: PÁGINA COMPLETA ───────────────────────────────
function _spRenderPage(resultados, leadTime){
  // KPIs
  var cnt = {critico:0, pronto:0, ok:0, sinDatos:0};
  resultados.forEach(function(r){ cnt[r.status]++; });

  var kpiEl = gel('sp-kpis');
  if(kpiEl){
    kpiEl.innerHTML = [
      {k:'critico', icon:'🔴', lbl:'CRÍTICO',    color:'var(--er)', bg:'var(--er-bg)',   border:'var(--er-b)'},
      {k:'pronto',  icon:'🟡', lbl:'PRONTO',     color:'#d97706',   bg:'#fffbeb',        border:'#fcd34d'},
      {k:'ok',      icon:'🟢', lbl:'OK',         color:'var(--ok)', bg:'var(--ok-bg)',   border:'var(--ok-b)'},
      {k:'sinDatos',icon:'⚫', lbl:'SIN DATOS',  color:'var(--tl)', bg:'var(--gry)',     border:'var(--bd)'}
    ].map(function(s){
      return '<div style="background:'+s.bg+';border:1.5px solid '+s.border+';border-radius:var(--rl);'+
             'padding:.85rem 1rem;text-align:center;cursor:default;">'+
        '<div style="font-size:22px;line-height:1.3;">'+s.icon+'</div>'+
        '<div style="font-family:Bebas Neue,sans-serif;font-size:30px;color:'+s.color+';line-height:1.1;">'+cnt[s.k]+'</div>'+
        '<div style="font-size:10px;font-weight:700;color:'+s.color+';text-transform:uppercase;letter-spacing:.5px;">'+s.lbl+'</div>'+
      '</div>';
    }).join('');
  }

  // Tarjetas
  var cardsEl = gel('sp-cards');
  if(!cardsEl) return;

  if(!resultados.length){
    cardsEl.innerHTML='<div style="text-align:center;padding:3rem;color:var(--tl);">Sin productos registrados.</div>';
    return;
  }

  cardsEl.innerHTML = resultados.map(function(r){ return _spCard(r, leadTime); }).join('');
}

// ── TARJETA DE PRODUCTO ────────────────────────────────────────
function _spCard(r, leadTime){
  var p = r.p;
  var cfg = {
    critico:  {border:'var(--er)',  bg:'#fff5f5', badgeS:'background:var(--er-bg);color:var(--er);border:1px solid var(--er-b);',   label:'🔴 CRÍTICO'},
    pronto:   {border:'#f59e0b',   bg:'#fdfaf0', badgeS:'background:#fffbeb;color:#d97706;border:1px solid #fcd34d;',              label:'🟡 PRONTO'},
    ok:       {border:'var(--ok-b)',bg:'#f7fdf7', badgeS:'background:var(--ok-bg);color:var(--ok);border:1px solid var(--ok-b);',  label:'🟢 OK'},
    sinDatos: {border:'var(--bd)', bg:'var(--wh)',badgeS:'background:var(--gry);color:var(--tl);border:1px solid var(--bd);',     label:'⚫ SIN DATOS'}
  }[r.status];

  // Barra de progreso: qué % del tiempo-hasta-ordenar ya consumiste
  var barHtml = '';
  if(r.velDia > 0 && r.diasParaOrdenar !== null){
    var totalWindow = _spVentana + leadTime; // referencia visual
    var elapsed     = totalWindow - Math.max(0, r.diasParaOrdenar);
    var pct         = Math.min(100, Math.max(0, (elapsed / totalWindow)*100));
    var barColor    = r.status==='critico' ? 'var(--er)' : r.status==='pronto' ? '#f59e0b' : 'var(--ok)';
    barHtml = '<div style="background:var(--bd);border-radius:20px;height:6px;margin:.6rem 0;overflow:hidden;">'+
                '<div style="background:'+barColor+';height:6px;border-radius:20px;width:'+pct.toFixed(1)+'%;"></div>'+
              '</div>';
  }

  // Bloque de acción principal
  var accion = '';
  if(r.status === 'sinDatos'){
    accion = '<div style="font-size:12px;color:var(--tl);font-style:italic;padding:.5rem 0;">'+
               'Sin ventas registradas en los últimos '+_spVentana+' días — no es posible proyectar.'+
             '</div>';
  } else if(r.status === 'critico'){
    var retraso = Math.abs(r.diasParaOrdenar);
    var msj = r.diasParaOrdenar < 0
      ? '⚠️ Deberías haber iniciado el lote hace <strong>'+retraso+' día(s)</strong>'
      : '⚠️ Debes iniciar el lote <strong>HOY</strong> (fecha límite superada)';
    accion = '<div style="background:var(--er-bg);border:1px solid var(--er-b);border-radius:var(--r);padding:.7rem .95rem;margin-top:.3rem;">'+
               '<div style="font-size:13px;font-weight:700;color:var(--er);">'+msj+'</div>'+
               '<div style="font-size:11.5px;color:#9b2222;margin-top:3px;">'+
                 'Stock estimado hasta: <strong>'+_spFecha(r.fechaAgot)+'</strong> · '+
                 'Con lote listo en '+leadTime+' días el stock no llegará.'+
               '</div>'+
             '</div>';
  } else if(r.status === 'pronto'){
    accion = '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:var(--r);padding:.7rem .95rem;margin-top:.3rem;">'+
               '<div style="font-size:13px;font-weight:700;color:#92400e;">'+
                 '📅 Inicia el lote en <strong>'+r.diasParaOrdenar+' día(s)</strong> — '+_spFecha(r.fechaOrden)+
               '</div>'+
               '<div style="font-size:11.5px;color:#92400e;margin-top:3px;">'+
                 'Stock se agota el: <strong>'+_spFecha(r.fechaAgot)+'</strong>'+
               '</div>'+
             '</div>';
  } else {
    accion = '<div style="background:var(--ok-bg);border:1px solid var(--ok-b);border-radius:var(--r);padding:.7rem .95rem;margin-top:.3rem;">'+
               '<div style="font-size:13px;font-weight:600;color:var(--ok);">'+
                 '✅ Inicia el lote el: <strong>'+_spFecha(r.fechaOrden)+'</strong> (en '+r.diasParaOrdenar+' días)'+
               '</div>'+
               '<div style="font-size:11.5px;color:var(--ok);margin-top:3px;">'+
                 'Stock estimado hasta: <strong>'+_spFecha(r.fechaAgot)+'</strong>'+
               '</div>'+
             '</div>';
  }

  return '<div style="background:'+cfg.bg+';border:1.5px solid '+cfg.border+';border-radius:var(--rl);'+
                     'padding:1.1rem 1.2rem;margin-bottom:.85rem;">'+
    // Encabezado
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:.4rem;">'+
      '<div style="font-size:15px;font-weight:700;color:var(--brand);">'+esc(p.nombre)+
        (p.presentacion?'<span style="font-size:11px;font-weight:400;color:var(--tl);margin-left:6px;">'+esc(p.presentacion)+'</span>':'')+
      '</div>'+
      '<span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;white-space:nowrap;'+cfg.badgeS+'">'+cfg.label+'</span>'+
    '</div>'+
    // Métricas
    '<div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:.2rem;">'+
      '<div style="font-size:12px;color:var(--tm);">📦 Stock actual: <strong style="color:var(--brand);">'+(p.stock||0)+' u</strong></div>'+
      (r.velDia>0
        ? '<div style="font-size:12px;color:var(--tm);">⚡ Velocidad: <strong>'+r.velDia.toFixed(2)+' u/día</strong></div>'
        : '<div style="font-size:12px;color:var(--tl);">⚡ Velocidad: —</div>')+
      (r.diasRest !== null
        ? '<div style="font-size:12px;color:var(--tm);">⏳ Días de stock: <strong>'+r.diasRest+' días</strong></div>'
        : '')+
      (r.netas > 0
        ? '<div style="font-size:12px;color:var(--tl);">'+_spVentana+'d: '+r.vendidas+'u vendidas'+(r.devueltas?' − '+r.devueltas+'u dev.':'')+'</div>'
        : '')+
    '</div>'+
    barHtml+
    accion+
  '</div>';
}

// ── WIDGET DEL DASHBOARD ───────────────────────────────────────
function _spRenderDashWidget(resultados){
  var el = gel('dash-stock-alerta');
  if(!el) return;

  var alertas = resultados.filter(function(r){ return r.status==='critico'||r.status==='pronto'; });
  if(!alertas.length){ el.innerHTML=''; return; }

  var items = alertas.slice(0,4).map(function(r){
    var icon = r.status==='critico' ? '🔴' : '🟡';
    var desc = r.status==='critico'
      ? (r.diasParaOrdenar < 0 ? 'Lote con '+Math.abs(r.diasParaOrdenar)+'d de retraso — ¡Ordena ya!' : 'Ordena AHORA')
      : 'Iniciar lote en '+r.diasParaOrdenar+'d ('+_spFecha(r.fechaOrden)+')';
    return '<div style="display:flex;align-items:center;gap:8px;padding:.38rem 0;border-bottom:.5px solid var(--bd);">'+
      '<span style="font-size:13px;flex-shrink:0;">'+icon+'</span>'+
      '<span style="font-size:12.5px;font-weight:600;color:var(--td);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(r.p.nombre)+'</span>'+
      '<span style="font-size:11px;color:var(--tl);white-space:nowrap;flex-shrink:0;">'+desc+'</span>'+
    '</div>';
  }).join('');

  var mas = alertas.length > 4 ? '<div style="font-size:11px;color:var(--tl);text-align:center;margin-top:.4rem;">+'+( alertas.length-4)+' productos más</div>' : '';

  el.innerHTML =
    '<div class="card">'+
      '<div class="ch">'+
        '<span class="ct">📦 Proyección de stock</span>'+
        '<button class="btn btn-sm btn-sk" onclick="goTo(\'stock-alerta\')" style="font-size:11px;padding:.22rem .65rem;">Ver todo →</button>'+
      '</div>'+
      '<div style="padding:.75rem 1.1rem;">'+items+mas+'</div>'+
    '</div>';
}

// ── HELPERS ────────────────────────────────────────────────────
function _spFecha(d){
  if(!d) return '---';
  return d.toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'});
}

function spSetVentana(dias, btn){
  _spVentana = dias;
  document.querySelectorAll('.sp-ventana-btn').forEach(function(b){
    b.className = b.dataset.v == dias
      ? 'btn btn-sk btn-sm sp-ventana-btn'
      : 'btn btn-s  btn-sm sp-ventana-btn';
  });
  _spSaveSettings();
  rStockProyeccion();
}

// ── PERSISTENCIA LOCAL ─────────────────────────────────────────
function _spSaveSettings(){
  try{
    var lt  = gel('sp-lead-time')  ? gel('sp-lead-time').value  : 30;
    var uc  = gel('sp-umbral-crit')? gel('sp-umbral-crit').value: 0;
    var ub  = gel('sp-umbral-bajo')? gel('sp-umbral-bajo').value: 14;
    localStorage.setItem('sp_settings', JSON.stringify({v:_spVentana, lt:lt, uc:uc, ub:ub}));
  }catch(e){}
}

function _spUpdateNavBadge(resultados){
  var badge = gel('nav-stock-badge');
  if(!badge) return;
  var criticos = resultados.filter(function(r){ return r.status==='critico'; }).length;
  badge.style.display = criticos ? 'inline-flex' : 'none';
  badge.textContent   = criticos || '';
}

function _spLoadSettings(){
  try{
    var s = JSON.parse(localStorage.getItem('sp_settings')||'{}');
    if(s.v)  _spVentana = parseInt(s.v);
    if(s.lt && gel('sp-lead-time'))   gel('sp-lead-time').value   = s.lt;
    if(s.uc && gel('sp-umbral-crit')) gel('sp-umbral-crit').value = s.uc;
    if(s.ub && gel('sp-umbral-bajo')) gel('sp-umbral-bajo').value = s.ub;
    // Sync botones de ventana
    document.querySelectorAll('.sp-ventana-btn').forEach(function(b){
      b.className = parseInt(b.dataset.v)===_spVentana
        ? 'btn btn-sk btn-sm sp-ventana-btn'
        : 'btn btn-s  btn-sm sp-ventana-btn';
    });
  }catch(e){}
}
