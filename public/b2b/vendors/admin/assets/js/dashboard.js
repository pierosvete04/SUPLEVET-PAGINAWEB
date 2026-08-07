// ══════════════════════════════════════════════════════════════
// DASHBOARD: vendedores, créditos, ventas, historial, planes,
// zonas, mercadería, niveles
// ══════════════════════════════════════════════════════════════

function dashNavHistorial(tipo){
  poblarFiltros();
  var now=new Date();
  var mesStr=now.getFullYear()+'-'+(String(now.getMonth()+1).padStart(2,'0'));
  var selM=gel('fil-mes');
  if(selM){
    var optFound=false;
    for(var i=0;i<selM.options.length;i++){if(selM.options[i].value===mesStr){optFound=true;break;}}
    if(optFound)selM.value=mesStr;
  }
  _hFilAdmin=tipo||'todos';
  goTo('historial');
}

function rDash(){
  var now=new Date(),mes=now.getMonth(),anio=now.getFullYear();
  // Ventas del mes actual (todas)
  var vm=_ventas.filter(function(v){
    var d=new Date(v.fecha||'');
    return d.getMonth()===mes&&d.getFullYear()===anio&&v.movimiento!=='Visita'&&v.estado!=='Anulado';
  });
  // KPIs principales
  var totalVentas=0,cobrado=0,pendienteTot=0,vencidos=0,nTrx=0;
  vm.forEach(function(v){
    var esVenta=esVentaPagada(v.movimiento,v.estado);
    var esDevol=esDevolucion(v.movimiento);
    var esPagado=(v.estado==='\u2705 Pagado');
    if(esVenta){totalVentas+=(v.total||0);nTrx++;}
    if(esPagado&&!esDevol)cobrado+=(v.total||0);
  });
  _ventas.forEach(function(v){
    if(v.estado==='\u23f3 Pendiente'||v.estado==='\u274c Vencido'){pendienteTot+=(v.total||0);}
    if(v.estado==='\u274c Vencido')vencidos++;
  });
  var credTodos=_ventas.filter(function(v){return esCredito15(v.movimiento)&&(v.estado==='\u23f3 Pendiente'||v.estado==='\u274c Vencido');});
  // (kpi-grid eliminado \u2014 se usa ops-grid m\u00e1s abajo)
  // Tarjetas de operaciones (igual que portal vendedor, adaptadas al admin global)
  var opsContado=0,nContado=0,opsDelivery=0,nDelivery=0,opsCobros=0,nCobros=0;
  var opsCredPend=0,nCredPend=0,opsDevol=0,nDevol=0;
  vm.forEach(function(v){
    var mn=movNorm(v.movimiento),est=v.estado||'';
    var esPagado=(est==='\u2705 Pagado');
    if(mn==='venta al contado'&&esPagado){opsContado+=(v.total||0);nContado++;}
    else if(mn==='venta delivery'&&esPagado){opsDelivery+=(v.total||0);nDelivery++;}
    else if(mn==='cobro de credito'&&esPagado){opsCobros+=(v.total||0);nCobros++;}
    else if(esDevolucion(v.movimiento)){opsDevol+=Math.abs(v.total||0);nDevol++;}
  });
  credTodos.forEach(function(v){opsCredPend+=(v.total||0);nCredPend++;});
  var nTotalVentas=nContado+nDelivery+nCobros;
  var dashOps=gel('dash-ops');
  if(dashOps){
    dashOps.innerHTML=
      '<div class="ops-card ops-c-total" onclick="goTo(\'ventas\')" style="width:100%;">'+
        '<div class="ops-arrow">\u203a</div>'+
        '<div style="display:flex;align-items:center;gap:14px;">'+
          '<div class="ops-icon" style="font-size:30px;margin-bottom:0;">\ud83d\udcb5</div>'+
          '<div style="flex:1;min-width:0;">'+
            '<div class="ops-lbl">Total Ventas del Mes</div>'+
            '<div class="ops-val" style="font-size:32px;">'+money(totalVentas)+'</div>'+
            '<div class="ops-sub">'+nTotalVentas+' transacciones (contado + delivery + cobros)</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="ops-sub-grid">'+
        '<div class="ops-card ops-c-contado" onclick="goTo(\'ventas\')">'+
          '<div class="ops-arrow">\u203a</div>'+
          '<div class="ops-icon">\ud83d\udc9a</div>'+
          '<div class="ops-lbl">Contado</div>'+
          '<div class="ops-val">'+money(opsContado)+'</div>'+
          '<div class="ops-sub">'+nContado+' venta'+(nContado!==1?'s':'')+' del mes</div>'+
        '</div>'+
        '<div class="ops-card ops-c-credito" onclick="goTo(\'creditos\')">'+
          '<div class="ops-arrow">\u203a</div>'+
          '<div class="ops-icon">\u23f3</div>'+
          '<div class="ops-lbl">Cr\u00e9dito pendiente</div>'+
          '<div class="ops-val">'+money(opsCredPend)+'</div>'+
          '<div class="ops-sub">'+nCredPend+' por cobrar</div>'+
        '</div>'+
        '<div class="ops-card ops-c-cobros" onclick="goTo(\'ventas\')">'+
          '<div class="ops-arrow">\u203a</div>'+
          '<div class="ops-icon">\ud83d\udcb0</div>'+
          '<div class="ops-lbl">Cobros de cr\u00e9dito</div>'+
          '<div class="ops-val">'+money(opsCobros)+'</div>'+
          '<div class="ops-sub">'+nCobros+' cobro'+(nCobros!==1?'s':'')+' del mes</div>'+
        '</div>'+
        '<div class="ops-card ops-c-delivery" onclick="histSetTab(\'Venta delivery\',null);goTo(\'historial\')">'+
          '<div class="ops-arrow">\u203a</div>'+
          '<div class="ops-icon">\ud83d\ude9a</div>'+
          '<div class="ops-lbl">Delivery</div>'+
          '<div class="ops-val">'+money(opsDelivery)+'</div>'+
          '<div class="ops-sub">'+nDelivery+' venta'+(nDelivery!==1?'s':'')+' del mes</div>'+
        '</div>'+
        '<div class="ops-card ops-c-devol" onclick="histSetTab(\'Devolucion\',null);goTo(\'historial\')">'+
          '<div class="ops-arrow">\u203a</div>'+
          '<div class="ops-icon">\u21a9\ufe0f</div>'+
          '<div class="ops-lbl">Devoluciones</div>'+
          '<div class="ops-val">'+money(opsDevol)+'</div>'+
          '<div class="ops-sub">'+nDevol+' devolucion'+(nDevol!==1?'es':'')+' del mes</div>'+
        '</div>'+
      '</div>';
    if(window.gsap){
      var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!reduced) gsap.from('#dash-ops .ops-card',{y:16,opacity:0,duration:.3,stagger:.06,ease:'power2.out',overwrite:true,clearProps:'transform,opacity'});
    }
  }
  // Ranking vendedores
  var rank={};
  vm.forEach(function(v){
    var vid=v.vendedor_id;
    if(!esVentaPagada(v.movimiento,v.estado))return;
    if(!rank[vid])rank[vid]={id:vid,total:0,transacc:0};
    rank[vid].total+=(v.total||0);rank[vid].transacc++;
  });
  var rankList=Object.values(rank).sort(function(a,b){return b.total-a.total;});
  var rankHtml='';
  rankList.forEach(function(r,i){
    var nom=getNombreVendedor(r.id);
    var pct=totalVentas>0?Math.round(r.total/totalVentas*100):0;
    var nivel=anNivelVendedor?anNivelVendedor(r.total):null;
    rankHtml+='<div class="rank-item" onclick="verVendedor(\''+esc(r.id)+'\')" style="cursor:pointer;">'+
      '<div class="rank-num">'+(i+1)+'</div>'+
      '<div style="flex:1"><div style="font-weight:600;font-size:13px;">'+esc(nom)+(nivel?'<span style="font-size:10px;margin-left:6px;padding:1px 5px;border-radius:8px;background:'+nivel.color+'22;color:'+nivel.color+';border:1px solid '+nivel.color+'44;">'+nivel.emoji+' '+esc(nivel.nombre)+'</span>':'')+'</div>'+
      '<div style="background:var(--bd);border-radius:4px;height:5px;margin-top:4px;overflow:hidden;"><div style="background:var(--brand);height:5px;width:'+pct+'%;border-radius:4px;transition:width .5s;"></div></div></div>'+
      '<div style="text-align:right"><div style="font-weight:700;color:var(--brand);font-size:13px;">'+money(r.total)+'</div>'+
      '<div style="font-size:11px;color:var(--tl);">'+r.transacc+' transacc.</div></div>'+
    '</div>';
  });
  if(!rankHtml)rankHtml='<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-tendencia"/></svg></div><strong>Sin ventas este mes.</strong><br>Aparecerán aquí en cuanto el equipo registre la primera.</div>';
  gel('dash-ranking').innerHTML=rankHtml;
  // \u00daltimas transacciones
  var ult=_ventas.slice(0,10);
  var ultHtml='';
  ult.forEach(function(v){
    ultHtml+='<tr onclick="verDetalle(\''+esc(v.id)+'\')" style="cursor:pointer;">'+
      '<td>'+fmt(v.fecha)+'</td>'+
      '<td><span style="font-size:11px;background:var(--sky4);color:var(--brand);border-radius:4px;padding:1px 6px;font-weight:700;">'+esc(getNombreVendedor(v.vendedor_id))+'</span></td>'+
      '<td>'+esc(v.veterinaria||'---')+'</td>'+
      '<td>'+bMov(v.movimiento)+'</td>'+
      '<td>'+esc(v.producto||'---')+'</td>'+
      '<td><strong>'+money(v.total)+'</strong></td>'+
      '<td>'+bEst(v.estado)+'</td>'+
    '</tr>';
  });
  gel('dash-ult').innerHTML=ultHtml?
    '<table><thead><tr><th>Fecha</th><th>Vendedor</th><th>Veterinaria</th><th>Movimiento</th><th>Producto</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+ultHtml+'</tbody></table>':
    '<div class="es"><strong>Sin movimientos todavía.</strong></div>';
  _renderCreditAlerts();
  _renderStockAlerta();
  _updateCreditBadge();
}

// Delegado a stock.js — usa historial de ventas reales + parámetros configurables
function _renderStockAlerta(){
  if(typeof _spCalc==='undefined'||typeof _spRenderDashWidget==='undefined'){return;}
  var box=gel('dash-stock-alerta');if(!box)return;
  if(!_productos.length){box.innerHTML='';return;}
  var cfg={};
  try{cfg=JSON.parse(localStorage.getItem('sp_settings')||'{}');}catch(e){}
  var ventana    = parseInt(cfg.v  ||30);
  var leadTime   = parseInt(cfg.lt ||30);
  var umbralCrit = parseInt(cfg.uc ||0);
  var umbralBajo = parseInt(cfg.ub ||14);
  var hoy=new Date();hoy.setHours(0,0,0,0);
  var limiteInf=new Date(hoy.getTime()-ventana*86400000).toISOString().split('T')[0];
  var prev=_spVentana; _spVentana=ventana;
  var resultados;
  try{resultados=_productos.map(function(p){return _spCalc(p,limiteInf,hoy,leadTime,umbralCrit,umbralBajo);});}
  finally{_spVentana=prev;}
  _spRenderDashWidget(resultados);
  // Actualizar badge en nav
  var badge=gel('nav-stock-badge');
  if(badge){
    var criticos=resultados.filter(function(r){return r.status==='critico';}).length;
    badge.style.display=criticos?'inline-flex':'none';
    badge.textContent=criticos||'';
  }
}


function verVendedor(vid){
  var vend=null;
  for(var i=0;i<_vendedores.length;i++){if(_vendedores[i].id===vid){vend=_vendedores[i];break;}}
  if(!vend)return;

  var mes=new Date().getMonth(),anio=new Date().getFullYear();
  var ventas=_ventas.filter(function(v){return v.vendedor_id===vid;});
  var vm=ventas.filter(function(v){
    var d=new Date(v.fecha);return d.getMonth()===mes&&d.getFullYear()===anio&&v.movimiento!=='Visita'&&v.estado!=='Anulado';
  });
  var total=0,cobrado=0,pendiente=0;
  for(var i=0;i<vm.length;i++){
    var esDevol2=esDevolucion(vm[i].movimiento);
    if(esDevol2){total-=(vm[i].total||0);cobrado-=(vm[i].total||0);}
    else{total+=(vm[i].total||0);if(vm[i].estado==='\u2705 Pagado')cobrado+=(vm[i].total||0);}
    if(vm[i].estado==='\u23f3 Pendiente'||vm[i].estado==='\u274c Vencido')pendiente+=(vm[i].total||0);
  }
  var stock=stockVendedor(vid);
  var zonas=vend.zonas_asignadas||[];

  var html='<div style="margin-bottom:1rem;display:flex;align-items:center;gap:12px;">'+
    '<div style="width:48px;height:48px;border-radius:50%;background:var(--sky4);border:2px solid var(--sky);display:flex;align-items:center;justify-content:center;font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--brand);">'+esc(vend.nombre.charAt(0))+'</div>'+
    '<div><div style="font-family:Bebas Neue,sans-serif;font-size:22px;letter-spacing:.5px;color:var(--brand);">'+esc(vend.nombre)+'</div>'+
    '<div style="font-size:11px;color:var(--tl);">@'+esc(vend.usuario)+' \u00b7 Vendedor</div></div>'+
    '<button class="btn btn-sk btn-sm" style="margin-left:auto;" onclick="editarVendedor(\''+esc(vid)+'\')">Editar</button>'+
    '</div>';

  html+='<div class="sg" style="margin-bottom:1rem;">'+
    '<div class="sc"><div class="sl">VENTAS MES</div><div class="sv sv-b">'+money(total)+'</div></div>'+
    '<div class="sc"><div class="sl">COBRADO</div><div class="sv" style="color:var(--ok)">'+money(cobrado)+'</div></div>'+
    '<div class="sc"><div class="sl">PENDIENTE</div><div class="sv sv-r">'+money(pendiente)+'</div></div>'+
    '<div class="sc"><div class="sl">TRANSACCIONES</div><div class="sv sv-b">'+vm.length+'</div></div>'+
    '</div>';

  // Stock
  if(stock.length){
    html+='<div class="ch" style="margin-bottom:8px;"><span class="ct">Mercader\u00eda actual</span></div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:1rem;">';
    for(var i=0;i<stock.length;i++){
      var low=stock[i].c<=5;
      html+='<div style="background:'+(low?'#fffbeb':'var(--sky4)')+';border:1px solid '+(low?'#fcd34d':'var(--sky)')+';border-radius:8px;padding:.6rem .9rem;text-align:center;min-width:100px;">'+
        '<div style="font-size:10px;font-weight:700;color:'+(low?'#92400e':'#1e6e77')+';text-transform:uppercase;">'+esc(stock[i].n)+'</div>'+
        '<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:'+(low?'#d97706':'var(--brand)')+'">'+stock[i].c+'</div>'+
        '<div style="font-size:10px;color:var(--tl);">uds'+(low?' \u00b7 BAJO':'')+'</div></div>';
    }
    html+='</div>';
  }

  // Zonas
  if(zonas.length){
    html+='<div style="margin-bottom:1rem;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--tl);margin-bottom:6px;">Zonas asignadas</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
      zonas.map(function(z){return '<span class="b b-contado">'+esc(z)+'</span>';}).join('')+
      '</div></div>';
  }
  // Segmentos
  var segs=vend.segmentos||[];
  if(segs.length){
    html+='<div style="margin-bottom:1rem;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--tl);margin-bottom:6px;">Segmentos de mercado</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
      segs.map(function(s){return '<span class="b" style="background:#f0fdf4;color:#166534;border:1px solid #86efac;">'+esc(s)+'</span>';}).join('')+
      '</div></div>';
  }

  // Productos asignados
  var prods=vend.productos_asignados||[];
  html+='<div style="margin-bottom:1rem;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--tl);margin-bottom:6px;">Productos que puede vender</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
  if(prods.length){
    prods.forEach(function(p){
      html+='<span style="background:#f0fdf4;color:#166534;border:1px solid #86efac;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:600;">\ud83d\udce6 '+esc(p)+'</span>';
    });
  }else{
    html+='<span style="font-size:12px;color:var(--tl);font-style:italic;">Todos los productos (sin restricci\u00f3n)</span>';
  }
  html+='</div></div>';

  // \u00daltimas ventas
  var ultV=ventas.slice(0,8);
  if(ultV.length){
    var rows='';
    for(var i=0;i<ultV.length;i++){
      var v=ultV[i];
      rows+='<tr onclick="verDetalle(\''+esc(v.id)+'\')" style="cursor:pointer;"><td>'+fmt(v.fecha)+'</td><td>'+esc(v.veterinaria||'---')+'</td><td>'+bMov(v.movimiento)+'</td><td>'+esc(v.producto||'---')+'</td><td><strong>'+money(v.total)+'</strong></td><td>'+bEst(v.estado)+'</td></tr>';
    }
    html+='<div class="ch" style="margin-bottom:8px;"><span class="ct">\u00daltimas transacciones</span></div>'+
      '<div class="tw"><table><thead><tr><th>Fecha</th><th>Veterinaria</th><th>Movimiento</th><th>Producto</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }

  gel('vend-detail-body').innerHTML=html;
  abrirModal('modal-vend-detail');
}

// \u2500\u2500 VENDEDORES \u2500\u2500
function rVendedores(){
  var html='';
  var lista = _vendedores.filter(function(v){return (typeof _vendVisible==='function')?_vendVisible(v):true;});
  for(var i=0;i<lista.length;i++){
    var v=lista[i];
    var inactivo = v.activo===false;
    var mes=new Date().getMonth(),anio=new Date().getFullYear();
    var ventas=_ventas.filter(function(vt){return vt.vendedor_id===v.id;});
    var vm=ventas.filter(function(vt){var d=new Date(vt.fecha);return d.getMonth()===mes&&d.getFullYear()===anio&&(vt.movimiento==='Venta al contado'||vt.movimiento==='Venta delivery'||vt.movimiento==='Cobro de credito')&&vt.estado==='✅ Pagado';});
    var total=vm.reduce(function(s,vt){return s+(vt.total||0);},0);
    var stock=stockVendedor(v.id);
    var lowStock=stock.filter(function(s){return s.c<=5;}).length;
    var pendientes=_ventas.filter(function(vt){
      return String(vt.vendedor_id)===String(v.id) &&
        (vt.movimiento==='Credito a 15 dias'||vt.movimiento==='Cr\u00e9dito a 15 d\u00edas') &&
        (vt.estado==='\u23f3 Pendiente'||vt.estado==='\u274c Vencido');
    });
    var bgCard = inactivo ? '#f3f4f6' : 'var(--wh)';
    var borderCard = inactivo ? '#9ca3af' : 'rgba(230,225,215,.8)';
    var subInfo = inactivo
      ? ('Baja: '+fmt(v.fecha_baja||'')+(v.motivo_baja?' \u00b7 '+esc(v.motivo_baja):'')+(pendientes.length?' \u00b7 \u26a0 '+pendientes.length+' pendientes sin transferir':''))
      : ('@'+esc(v.usuario||'')+(v.zonas_asignadas&&v.zonas_asignadas.length?' \u00b7 '+v.zonas_asignadas.length+' zonas':'')+(v.segmentos&&v.segmentos.length?' \u00b7 '+v.segmentos.length+' seg.':''));
    html+='<div class="card" style="margin-bottom:.7rem;background:'+bgCard+';border-color:'+borderCard+';'+(inactivo?'opacity:.85;':'')+'">'+
      '<div class="cb" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'+
      '<div style="width:44px;height:44px;border-radius:50%;background:'+(inactivo?'#e5e7eb':'var(--sky4)')+';border:2px solid '+(inactivo?'#9ca3af':'var(--sky)')+';display:flex;align-items:center;justify-content:center;font-family:Bebas Neue,sans-serif;font-size:20px;color:'+(inactivo?'#6b7280':'var(--brand)')+';flex-shrink:0;">'+esc(v.nombre.charAt(0))+'</div>'+
      '<div style="flex:1;min-width:160px;"><div style="font-weight:700;font-size:14px;">'+esc(v.nombre)+
        (inactivo?' <span style="font-size:10px;background:#9ca3af;color:#fff;padding:1px 6px;border-radius:10px;margin-left:6px;text-transform:uppercase;letter-spacing:.5px;">Inactivo</span>':'')+
      '</div>'+
      '<div style="font-size:11px;color:var(--tl);">'+subInfo+'</div></div>'+
      (!inactivo?('<div style="text-align:right;margin-right:8px;"><div style="font-weight:700;color:var(--brand);">'+money(total)+'</div><div style="font-size:11px;color:var(--tl);">este mes</div>'+
        (lowStock>0?'<div style="font-size:10px;color:#d97706;font-weight:600;">\u26a0 Bajo stock</div>':'')+'</div>'):'')+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
      '<button class="btn btn-sk btn-sm" onclick="verVendedor(\''+esc(v.id)+'\')">Ver</button>'+
      (!inactivo
        ? '<button class="btn btn-p btn-sm" onclick="editarVendedor(\''+esc(v.id)+'\')">Editar</button>'+
          '<button class="btn btn-d btn-sm" onclick="darDeBajaVendedor(\''+esc(v.id)+'\')">\ud83d\udc4b Baja</button>'
        : '<button class="btn btn-ok btn-sm" onclick="reactivarVendedor(\''+esc(v.id)+'\')">\u21a9 Reactivar</button>')+
      '</div></div></div>';
  }
  if(!html){
    var msg = _vendFiltro==='inactivos' ? 'Sin vendedores inactivos' : (_vendFiltro==='activos' ? 'Sin vendedores activos' : 'Sin vendedores registrados');
    html='<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-equipo"/></svg></div>'+msg+'</div>';
  }
  gel('lista-vendedores').innerHTML=html;
}

function nuevoVendedor(){
  gel('vf-id').value='';
  gel('vf-nombre').value='';
  gel('vf-usuario').value='';
  gel('vf-pass').value='';
  gel('vf-titulo').textContent='Nuevo Vendedor';
  renderZonasCheck('');
  renderSegmentosCheck('');
  renderProductosCheck([]);
  _vfOrigenReset(null);
  abrirModal('modal-vend-form');
}

function editarVendedor(id){
  var v=null;for(var i=0;i<_vendedores.length;i++){if(_vendedores[i].id===id){v=_vendedores[i];break;}}
  if(!v)return;
  gel('vf-id').value=v.id;
  gel('vf-nombre').value=v.nombre;
  gel('vf-usuario').value=v.usuario||'';
  gel('vf-pass').value=v.contrasena||'';
  gel('vf-titulo').textContent='Editar Vendedor';
  renderZonasCheck(v.zonas_asignadas||[]);
  renderSegmentosCheck(v.segmentos||[]);
  renderProductosCheck(v.productos_asignados||[]);
  _vfOrigenReset(v);
  abrirModal('modal-vend-form');
}

// Carga el punto de partida actual en el form. Si el vendedor ya tiene coords,
// las dejamos visibles y los inputs sirven para reemplazarlas.
function _vfOrigenReset(v){
  var calle=gel('vf-or-calle'),distrito=gel('vf-or-distrito'),maps=gel('vf-or-maps');
  var status=gel('vf-origen-status'),msg=gel('vf-origen-msg');
  if(calle)calle.value='';
  if(distrito)distrito.value='';
  if(maps)maps.value='';
  if(msg){msg.textContent='';msg.style.color='var(--tl)';}
  if(!v||!v.origen_latitud||!v.origen_longitud){
    if(status)status.innerHTML='Sin punto de partida registrado. Llena los campos abajo para que el vendedor pueda generar su ruta sin entrar a su panel.';
    return;
  }
  if(status)status.innerHTML='✅ Origen actual: <strong>'+(v.origen_direccion||(v.origen_latitud+', '+v.origen_longitud))+'</strong>. Puedes reemplazarlo abajo.';
  // Pre-rellenar calle/distrito a partir de origen_direccion guardada (formato "calle, ..., distrito")
  var partes=(v.origen_direccion||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  if(partes.length>=2 && calle && distrito){
    distrito.value=partes[partes.length-1];
    calle.value=partes.slice(0,-1).join(', ');
  } else if(calle){
    calle.value=v.origen_direccion||'';
  }
}

// Parser de URL de Google Maps para el origen del vendedor (mismo formato que
// el usado en clientes — distintos panels llevan implementaciones independientes
// para no acoplar archivos JS entre admin y vendedor)
function _vfParseMapsUrl(url){
  if(!url)return null;
  var s=String(url).trim();
  if(!s)return null;
  if(/^https?:\/\/(goo\.gl\/maps|maps\.app\.goo\.gl)\//i.test(s)){
    var err=new Error('Enlace corto detectado. Abre el enlace en Google Maps, copia la URL larga (la que tiene "@lat,lng") y pégala aquí.');
    err.shortUrl=true;throw err;
  }
  var m;
  m=s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if(m)return {latitud:parseFloat(m[1]),longitud:parseFloat(m[2])};
  m=s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if(m)return {latitud:parseFloat(m[1]),longitud:parseFloat(m[2])};
  m=s.match(/[?&](?:q|ll|center|destination)=(-?\d+\.\d+)[,%2C\s]+(-?\d+\.\d+)/i);
  if(m)return {latitud:parseFloat(m[1]),longitud:parseFloat(m[2])};
  m=s.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if(m)return {latitud:parseFloat(m[1]),longitud:parseFloat(m[2])};
  return null;
}

function _vfGeocodificar(texto){
  var q=encodeURIComponent(texto+', Lima, Perú');
  return fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+q,{headers:{'Accept-Language':'es'}})
    .then(function(r){return r.json();})
    .then(function(arr){
      if(!arr||!arr.length)return null;
      return {latitud:parseFloat(arr[0].lat),longitud:parseFloat(arr[0].lon),direccion:arr[0].display_name};
    });
}

// Devuelve una promesa con {latitud,longitud,direccionFinal} a guardar, o null
// si el admin no llenó nada nuevo (caso edición sin tocar el origen).
function _vfResolverOrigen(){
  var calle=(val('vf-or-calle')||'').trim();
  var distrito=(val('vf-or-distrito')||'').trim();
  var mapsUrl=(val('vf-or-maps')||'').trim();
  if(!calle&&!distrito&&!mapsUrl)return Promise.resolve(null); // no tocar
  var msg=gel('vf-origen-msg');
  if(mapsUrl){
    var fromUrl;
    try{fromUrl=_vfParseMapsUrl(mapsUrl);}catch(e){
      if(msg){msg.style.color='var(--er)';msg.textContent=e.message;}
      return Promise.reject(e);
    }
    if(fromUrl){
      var dir1=[calle,distrito].filter(Boolean).join(', ')||(fromUrl.latitud+', '+fromUrl.longitud);
      return Promise.resolve({latitud:fromUrl.latitud,longitud:fromUrl.longitud,direccionFinal:dir1});
    }
  }
  if(!calle||!distrito){
    var e2=new Error('Para guardar el origen pega una URL de Google Maps o completa calle y distrito.');
    if(msg){msg.style.color='var(--er)';msg.textContent=e2.message;}
    return Promise.reject(e2);
  }
  if(msg){msg.style.color='var(--tl)';msg.textContent='Buscando dirección…';}
  var texto=[calle,distrito].join(', ');
  return _vfGeocodificar(texto).then(function(res){
    if(!res){
      var e3=new Error('No encontramos esa dirección. Pega la URL de Google Maps para coordenadas exactas.');
      if(msg){msg.style.color='var(--er)';msg.textContent=e3.message;}
      throw e3;
    }
    return {latitud:res.latitud,longitud:res.longitud,direccionFinal:texto};
  });
}

function renderZonasCheck(asignadas){
  var html='';
  for(var i=0;i<_zonas.length;i++){
    var z=_zonas[i];
    var checked=Array.isArray(asignadas)&&asignadas.indexOf(z.nombre)>=0;
    html+='<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;padding:3px 0;">'+
      '<input type="checkbox" value="'+z.nombre+'" '+(checked?'checked':'')+' style="width:16px;height:16px;cursor:pointer;"> '+z.nombre+'</label>';
  }
  gel('vf-zonas').innerHTML=html||'<span style="color:var(--tl);font-size:12px;">Sin zonas creadas a\u00fan</span>';
}

function renderSegmentosCheck(seleccionados){
  var el=gel('vf-segmentos');if(!el)return;
  if(!_segmentos.length){el.innerHTML='<span style="color:var(--tl);font-size:12px;">Sin categorías creadas aún</span>';return;}
  var html='';
  _segmentos.forEach(function(s){
    var checked=Array.isArray(seleccionados)&&seleccionados.indexOf(s.nombre)>=0;
    html+='<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;padding:3px 0;">'+
      '<input type="checkbox" value="'+esc(s.nombre)+'" '+(checked?'checked':'')+' style="width:16px;height:16px;cursor:pointer;"> '+esc(s.nombre)+'</label>';
  });
  el.innerHTML=html;
}

function renderProductosCheck(seleccionados){
  var el=gel('vf-productos');if(!el)return;
  if(!_productos.length){el.innerHTML='<span style="color:var(--tl);font-size:12px;">Sin productos registrados</span>';return;}
  var html='';
  _productos.forEach(function(p){
    var checked=Array.isArray(seleccionados)&&seleccionados.length>0&&seleccionados.indexOf(p.nombre)>=0;
    html+='<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;padding:3px 0;">'+
      '<input type="checkbox" value="'+esc(p.nombre)+'" '+(checked?'checked':'')+' style="width:16px;height:16px;cursor:pointer;accent-color:#16a34a;"> '+
      '<span>'+esc(p.nombre)+'</span>'+
    '</label>';
  });
  el.innerHTML=html;
}

function rSegmentos(){
  var el=gel('lista-segmentos');if(!el)return;
  if(!_segmentos.length){el.innerHTML='<div style="color:var(--tl);font-size:13px;">Sin categorías. Usa "+ Añadir categoría" para crear la primera.</div>';return;}
  var html='<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">';
  _segmentos.forEach(function(s){
    html+='<div style="display:inline-flex;align-items:center;gap:5px;background:var(--sky4);border:1px solid var(--sky);border-radius:20px;padding:4px 6px 4px 13px;">'+
      '<span style="font-size:13px;font-weight:600;color:var(--brand);">'+esc(s.nombre)+'</span>'+
      '<button onclick="eliminarSegmento(\''+esc(s.id)+'\')" title="Eliminar" style="background:none;border:none;cursor:pointer;color:var(--er);font-size:16px;line-height:1;padding:0 4px;font-weight:700;">&times;</button>'+
    '</div>';
  });
  html+='</div>';
  el.innerHTML=html;
}

function nuevoSegmento(){
  showConfirm(
    '<input id="seg-nombre-inp" type="text" placeholder="Nombre de la categoría" style="width:100%;padding:8px;border:1px solid var(--bd);border-radius:var(--r);font-size:14px;margin-top:6px;" autofocus>',
    'Nueva categoría','Añadir',function(){
      var nombre=(gel('seg-nombre-inp').value||'').trim();
      if(!nombre)return;
      sbP('segmentos_vendedor',{nombre:nombre})
      .then(function(){return loadAll();})
      .then(function(){rSegmentos();setSt('Categoría añadida','ok');setTimeout(function(){setSt('');},2000);})
      .catch(function(e){setSt(SVUI.error(e),'er');});
    });
  setTimeout(function(){var i=gel('seg-nombre-inp');if(i)i.focus();},100);
}

function eliminarSegmento(id){
  showConfirm('¿Eliminar esta categoría? Se perderá la asignación en los vendedores que la tengan.','Eliminar categoría','Eliminar',function(){
    sbDel('segmentos_vendedor','id=eq.'+id)
    .then(function(){return loadAll();})
    .then(function(){rSegmentos();setSt('Categoría eliminada','ok');setTimeout(function(){setSt('');},2000);})
    .catch(function(e){setSt(SVUI.error(e),'er');});
  });
}

// Reasigna TODAS las transacciones (no solo cr\u00e9ditos pendientes) de las zonas
// dadas al vendedor destino. Se usa cuando se le asigna una zona nueva a un
// vendedor desde su ficha, para que herede el historial completo de esa zona.
function _reasignarTransaccionesZonas(zonas, destinoId){
  if(!zonas||!zonas.length) return Promise.resolve({numVentas:0});
  var afectadas=(_ventas||[]).filter(function(v){
    return zonas.indexOf(v.zona)>=0 && String(v.vendedor_id)!==String(destinoId);
  });
  if(!afectadas.length) return Promise.resolve({numVentas:0});
  var ids=afectadas.map(function(v){return v.id;});
  var inClause='id=in.('+ids.map(encodeURIComponent).join(',')+')';
  return fetch(SB+'/rest/v1/ventas?'+inClause,{
    method:'PATCH',
    headers:Object.assign(getHeaders(),{'Prefer':'return=minimal'}),
    body:JSON.stringify({vendedor_id:destinoId})
  }).then(function(r){
    if(!r.ok) return r.text().then(function(tx){throw new Error(_errMsg(r.status,tx));});
    return {numVentas:ids.length};
  });
}

function guardarVendedor(){
  var id=val('vf-id');
  var nombre=val('vf-nombre'),usuario=val('vf-usuario'),pass=val('vf-pass');
  if(id){
    if(!nombre||!usuario){showToast('Nombre y usuario son obligatorios','er');return;}
  }else{
    if(!nombre||!usuario||!pass){showToast('Nombre, usuario y contrase\u00f1a son obligatorios','er');return;}
  }
  var zonas=[];
  gel('vf-zonas').querySelectorAll('input[type=checkbox]:checked').forEach(function(cb){zonas.push(cb.value);});
  var segmentos=[];
  if(gel('vf-segmentos'))gel('vf-segmentos').querySelectorAll('input[type=checkbox]:checked').forEach(function(cb){segmentos.push(cb.value);});
  var productosAsig=[];
  if(gel('vf-productos'))gel('vf-productos').querySelectorAll('input[type=checkbox]:checked').forEach(function(cb){productosAsig.push(cb.value);});
  var row={nombre:nombre,usuario:usuario.toLowerCase(),zonas_asignadas:zonas,segmentos:segmentos,productos_asignados:productosAsig};
  if(pass)row.contrasena=pass;

  // Zonas reci\u00e9n marcadas en esta edici\u00f3n (no estaban antes asignadas a este vendedor)
  var zonasNuevas=[];
  if(id){
    var prev=_vendedores.filter(function(v){return String(v.id)===String(id);})[0];
    var prevZonas=(prev&&prev.zonas_asignadas)||[];
    zonasNuevas=zonas.filter(function(z){return prevZonas.indexOf(z)<0;});
  }
  if(zonasNuevas.length){
    var afectadas=(_ventas||[]).filter(function(v){
      return zonasNuevas.indexOf(v.zona)>=0 && String(v.vendedor_id)!==String(id);
    });
    if(afectadas.length){
      var monto=afectadas.reduce(function(s,v){return s+Number(v.total||0);},0);
      showConfirm(
        'Vas a asignar la zona '+(zonasNuevas.length>1?'<strong>'+zonasNuevas.map(esc).join(', ')+'</strong>':'<strong>'+esc(zonasNuevas[0])+'</strong>')+
        ' a <strong>'+esc(nombre)+'</strong>.<br><br>Esto reasignar\u00e1 <strong>'+afectadas.length+' transacci\u00f3n'+(afectadas.length!==1?'es':'')+'</strong> ('+money(monto)+') que actualmente pertenecen a otros vendedores en esa zona, incluyendo todo su historial de ventas, cr\u00e9ditos y visitas.',
        'Reasignar zona completa','S\u00ed, reasignar todo',
        function(){ _guardarVendedorFinal(id,row,usuario,pass,zonasNuevas); }
      );
      return;
    }
  }
  _guardarVendedorFinal(id,row,usuario,pass,zonasNuevas);
}

function _guardarVendedorFinal(id,row,usuario,pass,zonasNuevas){
  setBL('btn-gv-vend',true,'Guardando...');

  // Resolver origen ANTES de guardar \u2014 si el admin escribi\u00f3 algo en los campos
  // de origen pero la URL/direcci\u00f3n no se puede resolver, abortamos en seco para
  // no dejar al vendedor sin punto de partida v\u00e1lido. Si los campos est\u00e1n vac\u00edos,
  // _vfResolverOrigen() resuelve a null y el origen actual se conserva.
  _vfResolverOrigen().then(function(origen){
    if(origen){
      row.origen_latitud=origen.latitud;
      row.origen_longitud=origen.longitud;
      row.origen_direccion=origen.direccionFinal;
    }
    if(id){
      // Editar vendedor existente
      return _reasignarTransaccionesZonas(zonasNuevas,id)
      .then(function(){return sbU('vendedores',id,row);})
      .then(function(){return loadAll();})
      .then(function(){
        cerrarModal('modal-vend-form');rVendedores();
        setSt('\u2705 Vendedor actualizado','ok');setTimeout(function(){setSt('');},2500);
      });
    }
    // Nuevo vendedor: crear en Auth primero
    return fetch(SB+'/auth/v1/signup',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':AK},
      body:JSON.stringify({email:usuario.toLowerCase(),password:pass})
    })
    .then(function(r){
      if(!r.ok) return r.json().then(function(err){throw new Error(err.msg||err.message||'Error creando usuario');});
      return r.json();
    })
    .then(function(authData){
      var authId=authData.id||authData.user.id;
      row.id=authId;
      return sbP('vendedores',row);
    })
    .then(function(){return loadAll();})
    .then(function(){
      cerrarModal('modal-vend-form');rVendedores();
      setSt('\u2705 Vendedor creado','ok');setTimeout(function(){setSt('');},2500);
    });
  })
  .catch(function(e){setSt(SVUI.error(e),'er');})
  .finally(function(){setBL('btn-gv-vend',false,'Guardar');});
}

// \u2500\u2500 CR\u00c9DITOS GLOBALES \u2500\u2500
function rCreditos(){
  var sel=gel('cr-filtro-vend');
  if(sel){
    var cur=sel.value;
    sel.innerHTML='<option value="">Todos los vendedores</option>';
    _vendedores.forEach(function(v){
      var o=document.createElement('option');
      o.value=v.id;o.textContent=v.nombre;
      if(String(v.id)===String(cur))o.selected=true;
      sel.appendChild(o);
    });
  }
  var filtVend=sel?sel.value:'';
  var busq=gel('srch-cred')?(val('srch-cred')||'').toLowerCase():'';
  var cr=_ventas.filter(function(v){
    var esCred=(v.movimiento==='Credito a 15 dias'||v.movimiento==='Cr\u00e9dito a 15 d\u00edas');
    var pendiente=v.estado!=='\u2705 Pagado'&&v.estado!=='\ud83d\udce6 Devuelto'&&v.estado!=='Anulado';
    if(!esCred||!pendiente)return false;
    if(filtVend&&String(v.vendedor_id)!==String(filtVend))return false;
    if(busq){
      var match=(v.veterinaria||'').toLowerCase().indexOf(busq)>=0||
                (v.doctora||'').toLowerCase().indexOf(busq)>=0||
                (v.zona||'').toLowerCase().indexOf(busq)>=0||
                (v.producto||'').toLowerCase().indexOf(busq)>=0;
      if(!match)return false;
    }
    return true;
  });
  // Ordenar: más vencidos primero (igual que portal)
  cr.sort(function(a,b){
    var diasA=a.fecha_cobro?diasDesde(a.fecha_cobro):-9999;
    var diasB=b.fecha_cobro?diasDesde(b.fecha_cobro):-9999;
    if(diasA!==diasB)return diasB-diasA;
    return (b.total||0)-(a.total||0);
  });
  var total=cr.reduce(function(s,v){return s+(v.total||0);},0);
  var venc=0,pv=0;
  cr.forEach(function(v){
    if(v.fecha_cobro){
      var d=diasHasta(v.fecha_cobro);
      if(d<0)venc++;
      else if(d>=0&&d<=DIAS_POR_VENCER_REPORTE)pv++;
    }
  });
  gel('cr-total').textContent=money(total);
  gel('cr-venc').textContent=venc;
  var pvel=gel('cr-pv');if(pvel)pvel.textContent=pv;
  var html='';
  cr.forEach(function(v){
    var dias=v.fecha_cobro?diasHasta(v.fecha_cobro):null;
    var vencido=dias!==null&&dias<0;
    var diasAbs=dias!==null?Math.abs(dias):0;
    // Color scheme idéntico al portal vendedor
    var cardBg,cardBorder,textColor,subColor,moneyColor,btnStyle;
    if(vencido&&diasAbs>15){
      cardBg='#dc2626';cardBorder='#b91c1c';textColor='#fff';subColor='rgba(255,255,255,.75)';moneyColor='#fff';
      btnStyle='background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);';
    }else if(vencido&&diasAbs>7){
      cardBg='#ef4444';cardBorder='#dc2626';textColor='#fff';subColor='rgba(255,255,255,.75)';moneyColor='#fff';
      btnStyle='background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);';
    }else if(vencido){
      cardBg='#f97316';cardBorder='#ea580c';textColor='#fff';subColor='rgba(255,255,255,.8)';moneyColor='#fff';
      btnStyle='background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);';
    }else if(dias!==null&&dias<=5){
      cardBg='#fef3c7';cardBorder='#f59e0b';textColor='#92400e';subColor='#a16207';moneyColor='#d97706';
      btnStyle='';
    }else{
      cardBg='var(--wh)';cardBorder='rgba(230,225,215,.8)';textColor='inherit';subColor='var(--tl)';moneyColor='#d97706';
      btnStyle='';
    }
    var diasStr=dias!==null?(vencido?'<strong>Vencido hace '+diasAbs+' d\u00edas</strong>':'Vence en '+dias+' d\u00edas'):'';
    html+='<div class="cred-item" style="background:'+cardBg+';border-color:'+cardBorder+';">'+
      '<div class="cred-dot '+(vencido?'venc':'pend')+'"></div>'+
      '<div style="flex:1">'+
        '<div style="font-weight:700;font-size:13.5px;color:'+textColor+'">'+esc(v.veterinaria||v.doctora||'\u2014')+'</div>'+
        '<div style="font-size:11px;color:'+subColor+'">'+
          '<span style="font-size:10px;background:rgba(255,255,255,.25);border-radius:4px;padding:1px 5px;font-weight:700;">'+esc(getNombreVendedor(v.vendedor_id))+'</span>'+
          (v.doctora?' \u00b7 '+esc(v.doctora):'')+
          (v.zona?' \u00b7 '+esc(v.zona):'')+
        '</div>'+
        '<div style="font-size:11px;color:'+subColor+'">Cobro: '+fmt(v.fecha_cobro)+' \u00b7 '+diasStr+'</div>'+
        '<div style="margin-top:2px;font-weight:600;font-size:11px;color:'+subColor+'">'+esc(v.producto||'')+(v.cantidad?' \u00b7 '+v.cantidad+' uds':'')+'</div>'+
        (v.notas&&v.notas.trim()?'<div style="font-size:10px;color:'+subColor+';font-style:italic;margin-top:2px;">'+esc(v.notas)+'</div>':'')+
      '</div>'+
      '<div style="text-align:right;display:flex;flex-direction:column;gap:5px;align-items:flex-end;">'+
        '<div style="font-size:16px;font-weight:700;color:'+moneyColor+'">'+money(v.total)+'</div>'+
        '<button class="btn btn-sm" style="white-space:nowrap;'+btnStyle+'" onclick="marcarPagado(\''+v.id+'\')">&#x2705; Cobrado</button>'+
        '<button class="btn btn-sm" style="white-space:nowrap;'+btnStyle+'" onclick="abrirCobroParcialAdmin(\''+v.id+'\')">&#128176; Parcial</button>'+
      '</div>'+
    '</div>';
  });
  gel('lista-cr').innerHTML=html||'<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-ok"/></svg></div><strong>Sin créditos pendientes.</strong><br>Todo el equipo está al día con sus cobros.</div>';
  _updateCreditBadge();
}

function _updateCreditBadge(){
  var venc=0;
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if(esCredito15(v.movimiento)&&
       v.estado!=='\u2705 Pagado'&&v.estado!=='Anulado'&&v.estado!=='\ud83d\udce6 Devuelto'){
      if(v.fecha_cobro){
        var dias=diasDesde(v.fecha_cobro);
        if(dias>0)venc++;
      }
    }
  }
  var badge=gel('nav-cred-badge');
  if(badge){
    if(venc>0){badge.textContent=venc;badge.style.display='inline-block';}
    else{badge.style.display='none';}
  }
}

function _renderCreditAlerts(){
  var box=gel('dash-alert-cred');
  if(!box)return;
  var pendientes=[];
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if(esCredito15(v.movimiento)&&
       v.estado!=='\u2705 Pagado'&&v.estado!=='Anulado'&&v.estado!=='\ud83d\udce6 Devuelto'){
      var dias=v.fecha_cobro?diasDesde(v.fecha_cobro):null;
      pendientes.push({v:v,dias:dias});
    }
  }
  var vencidos=pendientes.filter(function(x){return x.dias!==null&&x.dias>0;});
  var porVencer=pendientes.filter(function(x){return x.dias!==null&&x.dias<=0&&x.dias>=-DIAS_POR_VENCER_ALERTA;});
  if(!vencidos.length&&!porVencer.length){box.innerHTML='';return;}
  vencidos.sort(function(a,b){return b.dias-a.dias;});
  var html='';
  if(vencidos.length){
    var totalVenc=vencidos.reduce(function(s,x){return s+(x.v.total||0);},0);
    var topClient=vencidos[0].v.veterinaria||vencidos[0].v.doctora||'cliente';
    var topDias=vencidos[0].dias;
    html+='<div class="alert-cred-banner" onclick="goTo(\'creditos\')">'+
      '<div class="alert-cred-icon">\u26a0\ufe0f</div>'+
      '<div class="alert-cred-content">'+
        '<div class="alert-cred-title">'+vencidos.length+' cr\u00e9dito'+(vencidos.length!==1?'s':'')+' VENCIDO'+(vencidos.length!==1?'S':'')+' por cobrar</div>'+
        '<div class="alert-cred-sub">Total: <strong>'+money(totalVenc)+'</strong> \u00b7 M\u00e1s urgente: <strong>'+topClient+'</strong> ('+topDias+' d\u00edas vencido)</div>'+
      '</div>'+
      '<div class="alert-cred-arrow">\u203a</div>'+
    '</div>';
  }
  if(porVencer.length){
    var totalPV=porVencer.reduce(function(s,x){return s+(x.v.total||0);},0);
    html+='<div class="alert-cred-banner warning" onclick="goTo(\'creditos\')">'+
      '<div class="alert-cred-icon">\u23f3</div>'+
      '<div class="alert-cred-content">'+
        '<div class="alert-cred-title">'+porVencer.length+' cr\u00e9dito'+(porVencer.length!==1?'s':'')+' por vencer en los pr\u00f3ximos 5 d\u00edas</div>'+
        '<div class="alert-cred-sub">Total: <strong>'+money(totalPV)+'</strong> \u00b7 Coordina la cobranza con tiempo</div>'+
      '</div>'+
      '<div class="alert-cred-arrow">\u203a</div>'+
    '</div>';
  }
  box.innerHTML=html;
}

// \u2500\u2500 COBRO ADMIN: multi-comprobante helpers (mp = marcar pagado, cp = cobro parcial) \u2500\u2500
var _cobAdminImgs = { mp: [], cp: [] };
var _COB_ADMIN_MAX = 4;

function _cobAdmAgr(pfx){
  var inp=gel(pfx+'-img'); if(!inp||!inp.files) return;
  var arr=_cobAdminImgs[pfx]||(_cobAdminImgs[pfx]=[]);
  var libre=_COB_ADMIN_MAX-arr.length;
  if(libre<=0){ setSt('\u26a0\ufe0f M\u00e1ximo '+_COB_ADMIN_MAX+' archivos','er'); setTimeout(function(){setSt('');},2000); inp.value=''; return; }
  for(var i=0;i<inp.files.length&&i<libre;i++) arr.push(inp.files[i]);
  inp.value=''; _cobAdmRen(pfx);
}
function _cobAdmRem(pfx, idx){
  var arr=_cobAdminImgs[pfx]||[]; if(idx<0||idx>=arr.length) return;
  arr.splice(idx,1); _cobAdmRen(pfx);
}
function _cobAdmRen(pfx){
  var arr=_cobAdminImgs[pfx]||[];
  var grid=gel(pfx+'-img-grid'); var counter=gel(pfx+'-img-counter');
  if(counter) counter.textContent='('+arr.length+'/'+_COB_ADMIN_MAX+')';
  if(!grid) return;
  var html='';
  arr.forEach(function(f,idx){
    var isImg=f.type&&f.type.indexOf('image/')===0;
    html+='<div style="position:relative;border:2px solid #16a34a;border-radius:10px;background:#f0fdf4;padding:6px 4px;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;">'+
      '<button type="button" onclick="_cobAdmRem(\''+pfx+'\','+idx+');event.stopPropagation();" style="position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:#dc2626;color:#fff;border:none;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:bold;line-height:1;padding:0;">\u00d7</button>'+
      (isImg?'<img data-adm-thumb="'+pfx+'-'+idx+'" src="" style="max-width:100%;max-height:55px;object-fit:contain;border-radius:5px;"/>':'<div style="font-size:28px;line-height:1;">\ud83d\udcc4</div>')+
      '<div style="font-size:9px;color:var(--brand);font-weight:600;text-align:center;word-break:break-all;padding:0 2px;line-height:1.2;">'+f.name+'</div>'+
    '</div>';
  });
  if(arr.length<_COB_ADMIN_MAX){
    html+='<div onclick="document.getElementById(\''+pfx+'-img\').click()" style="border:2px dashed var(--brand);border-radius:10px;background:var(--sky4);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 6px;cursor:pointer;min-height:100px;text-align:center;user-select:none;">'+
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>'+
      '<span style="font-size:11px;font-weight:600;color:var(--brand);">'+(arr.length?'Agregar':'Subir')+'</span>'+
    '</div>';
  }
  grid.innerHTML=html;
  arr.forEach(function(f,idx){
    if(!f.type||f.type.indexOf('image/')!==0) return;
    var img=grid.querySelector('img[data-adm-thumb="'+pfx+'-'+idx+'"]');
    if(!img) return;
    var r=new FileReader(); r.onload=function(e){img.src=e.target.result;}; r.readAsDataURL(f);
  });
}
function _cobAdmReset(pfx){
  _cobAdminImgs[pfx]=[]; _cobAdmRen(pfx);
  var inp=gel(pfx+'-img');
  if(inp&&!inp.dataset.wiredAdm){
    inp.dataset.wiredAdm='1';
    inp.addEventListener('change', function(){ _cobAdmAgr(pfx); });
  }
  var td=gel(pfx+'-tipo-doc'); if(td) td.value='';
  var nd=gel(pfx+'-num-doc'); if(nd) nd.value='';
  _cobResetMP(pfx);
}

// ── Método de pago en modales de cobro de crédito (admin) ──
// Reutiliza _MP_CONFIG (definido en visitas.js) para mostrar el mismo
// selector con logos que ya existe en "Registrar Visita" y en el panel de vendedores.
function _cobToggleMPDrop(pfx, e){
  if(e) e.stopPropagation();
  var drop=gel(pfx+'-mp-drop'), chev=gel(pfx+'-mp-chev');
  if(!drop) return;
  if(drop.style.display!=='none'){ drop.style.display='none'; if(chev) chev.style.transform=''; return; }
  drop.innerHTML=Object.keys(_MP_CONFIG).map(function(k){
    return '<div onclick="_cobSelecMP(\''+pfx+'\',\''+k.replace(/'/g,"\\'")+'\');event.stopPropagation();" style="display:flex;align-items:center;gap:10px;padding:.55rem .85rem;cursor:pointer;border-bottom:1px solid var(--bd);background:#fff;" onmouseover="this.style.background=\'var(--sky4)\'" onmouseout="this.style.background=\'#fff\'">'+
      _MP_CONFIG[k].html+'<span style="font-size:12px;font-weight:600;color:var(--td);">'+esc(k)+'</span></div>';
  }).join('');
  drop.style.display='block';
  if(chev) chev.style.transform='rotate(180deg)';
  setTimeout(function(){
    document.addEventListener('click', function _close(){ drop.style.display='none'; if(chev) chev.style.transform=''; document.removeEventListener('click',_close); }, {once:true});
  },0);
}
function _cobSelecMP(pfx, val){
  var cfg=_MP_CONFIG[val]; if(!cfg) return;
  var inp=gel(pfx+'-metodo-pago'); if(inp) inp.value=val;
  var logo=gel(pfx+'-mp-logo'); if(logo) logo.innerHTML=cfg.html;
  var name=gel(pfx+'-mp-name'); if(name){ name.textContent=val; name.style.color=cfg.color; name.style.fontWeight='600'; }
  var drop=gel(pfx+'-mp-drop'); if(drop) drop.style.display='none';
  var chev=gel(pfx+'-mp-chev'); if(chev) chev.style.transform='';
  var rw=gel(pfx+'-receptor-wrap'); if(rw) rw.style.display=(val==='EFECTIVO')?'block':'none';
  var rs=gel(pfx+'-receptor'); if(rs&&val!=='EFECTIVO') rs.value='';
  // Con EFECTIVO el comprobante de pago es opcional (igual que en Registrar Visita).
  var reqEl=gel(pfx+'-img-req'); if(reqEl) reqEl.style.display=(val==='EFECTIVO')?'none':'inline';
}
function _cobResetMP(pfx){
  var mp=gel(pfx+'-metodo-pago'); if(mp) mp.value='';
  var logo=gel(pfx+'-mp-logo'); if(logo) logo.innerHTML='<div style="width:32px;height:32px;border-radius:6px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#718096;font-size:12px;">—</div>';
  var name=gel(pfx+'-mp-name'); if(name){ name.textContent='— Seleccionar método —'; name.style.color='var(--tl)'; name.style.fontWeight='normal'; }
  var rw=gel(pfx+'-receptor-wrap'); if(rw) rw.style.display='none';
  var rs=gel(pfx+'-receptor'); if(rs) rs.value='';
  var reqEl=gel(pfx+'-img-req'); if(reqEl) reqEl.style.display='inline';
}
function _cobAdmUpload(pfx, idPrefix){
  var arr=_cobAdminImgs[pfx]||[];
  if(!arr.length) return Promise.resolve(null);
  var ts=Date.now();
  return arr.reduce(function(chain,file,i){
    return chain.then(function(urls){
      return comprimirImagen(file,4).then(function(c){
        var ext=(c.name.split('.').pop()||'jpg').toLowerCase();
        var path=(idPrefix||'cobro')+'-'+ts+'-'+i+'.'+ext;
        return fetch(SB+'/storage/v1/object/documentos-venta/'+path,{
          method:'POST',headers:{'apikey':AK,'Authorization':'Bearer '+(AUTH_TOKEN||AK),'Content-Type':c.type},body:c
        }).then(function(r){
          if(!r.ok)return r.text().then(function(tx){var p={};try{p=JSON.parse(tx);}catch(ex){}throw new Error(p.message||p.error||'Error al subir comprobante '+(i+1));});
          urls.push(SB+'/storage/v1/object/public/documentos-venta/'+path);
          return urls;
        });
      });
    });
  }, Promise.resolve([])).then(function(urls){ return urls.join('\n'); });
}

function marcarPagado(id){
  gel('mp-id').value=id;
  gel('mp-fecha').value=hoy();
  _cobAdmReset('mp');
  docsReset('mp');
  abrirModal('modal-marcar-pagado');
  setTimeout(function(){gel('mp-fecha').focus();},200);
}

function confirmarMarcarPagado(){
  var id=gel('mp-id').value;
  var fecha=gel('mp-fecha').value||hoy();
  var mpVal=gel('mp-metodo-pago')?gel('mp-metodo-pago').value:'';
  var receptorVal=gel('mp-receptor')?gel('mp-receptor').value:'';
  var _docsMp=docsSerializar('mp');
  var tipoDoc=_docsMp.tipo||'';
  var numDoc=_docsMp.nro||'';
  var arr=_cobAdminImgs.mp||[];
  if(!mpVal){setSt('\u26a0\ufe0f Selecciona el m\u00e9todo de pago','er');return;}
  if(mpVal==='EFECTIVO'&&!receptorVal){setSt('\u26a0\ufe0f Indica a qui\u00e9n se entreg\u00f3 el efectivo','er');return;}
  if(mpVal!=='EFECTIVO'&&!arr.length){setSt('Adjunta al menos un comprobante de pago','er');return;}
  setBL('btn-mp-ok',true,'Guardando...');
  _cobAdmUpload('mp', id+'-cobro').then(function(imgUrl){
    var upd={estado:'\u2705 Pagado',movimiento:'Cobro de credito',fecha:fecha,fecha_cobro:fecha,notas:'Cobrado el '+fmt(fecha),
      metodo_pago:mpVal||null,receptor_efectivo:mpVal==='EFECTIVO'?(receptorVal||null):null};
    if(imgUrl)upd.imagen_documento=imgUrl;
    if(tipoDoc)upd.tipo_documento=tipoDoc;
    if(numDoc)upd.numero_documento=numDoc;
    return sbU('ventas',id,upd);
  }).then(function(){return loadAll();})
  .then(function(){
    gel('modal-marcar-pagado').classList.remove('open');
    _cobAdminImgs.mp=[];
    rCreditos();rDash();
    setSt('Cobro registrado el '+fmt(fecha)+' \u2705','ok');
    setTimeout(function(){setSt('');},3000);
  }).catch(function(e){setSt(SVUI.error(e),'er');})
  .finally(function(){setBL('btn-mp-ok',false,'Confirmar');});
}

// ── COBRO PARCIAL ──
// Dos formas de registrarlo, porque en la calle pasan las dos:
//   'uds'   → "pagaron 5 de las 10 bolsas"
//   'monto' → "pagaron S/ 500 de los S/ 1000"
//
// En modo dinero el importe manda y es exacto; las unidades se aproximan
// dividiendo entre el precio unitario, porque ventas.cantidad es una columna
// de enteros y no admite media bolsa. Las dos filas resultantes SUMAN el
// original tanto en dinero como en unidades, así que stock y contabilidad
// siguen cuadrando.
//
// Esta lógica es gemela de la del panel de vendedores
// (vendedor/assets/js/creditos.js). Si cambias una, cambia la otra.
var _cpModo='uds';

function cpSetModo(modo){
  _cpModo=(modo==='monto')?'monto':'uds';
  var esMonto=(_cpModo==='monto');
  gel('cp-wrap-uds').hidden=esMonto;
  gel('cp-wrap-monto').hidden=!esMonto;
  var bU=gel('cp-modo-uds'), bM=gel('cp-modo-monto');
  bU.classList.toggle('is-on',!esMonto);
  bM.classList.toggle('is-on',esMonto);
  bU.setAttribute('aria-pressed',String(!esMonto));
  bM.setAttribute('aria-pressed',String(esMonto));
  var campo=gel(esMonto?'cp-monto':'cp-cant');
  if(campo){campo.value='';campo.focus();}
  cpPreview();
}

function _cpVentaActual(){
  var id=gel('cp-id').value;
  return _ventas.filter(function(x){return String(x.id)===String(id);})[0]||null;
}

function _cpPrecio(v){ return SVCobros.precioEfectivo(v); }

// El reparto vive en assets/js/cobros.js (SVCobros), compartido con el panel
// de vendedores y con las dos pantallas de Registrar Visita.
function cpCalcularReparto(v,modo,valor){
  return SVCobros.reparto(v,modo,valor);
}

function cpPreview(){
  var box=gel('cp-resumen');
  if(!box)return;
  var v=_cpVentaActual();
  var esMonto=(_cpModo==='monto');
  var bruto=parseFloat(gel(esMonto?'cp-monto':'cp-cant').value);
  SVCobros.pintarResumen(box,v,_cpModo,bruto);
}

function abrirCobroParcialAdmin(id){
  var v=_ventas.filter(function(x){return String(x.id)===String(id);})[0];
  if(!v)return;
  gel('cp-id').value=id;
  gel('cp-vete').textContent=(v.veterinaria||'—')+' · '+getNombreVendedor(v.vendedor_id);
  gel('cp-desc').textContent=(v.producto||'—')+' · '+money(v.total)+' · '+(v.cantidad||0)+' unidades';
  gel('cp-max').textContent=v.cantidad||0;
  gel('cp-max-monto').textContent=money(v.total);
  gel('cp-cant').value='';
  gel('cp-monto').value='';
  gel('cp-fecha').value=hoy();
  _cobAdmReset('cp');
  docsReset('cp');
  abrirModal('modal-cobro-parcial');
  cpSetModo('uds');
  setTimeout(function(){gel('cp-cant').focus();},200);
}

function confirmarCobroParcialAdmin(){
  var v=_cpVentaActual();
  if(!v)return;
  var id=v.id;
  var esMonto=(_cpModo==='monto');
  var campo=gel(esMonto?'cp-monto':'cp-cant');
  var bruto=parseFloat(campo.value);
  var precio=_cpPrecio(v);
  var fechaCobro=gel('cp-fecha').value||hoy();
  var mpVal=gel('cp-metodo-pago')?gel('cp-metodo-pago').value:'';
  var receptorVal=gel('cp-receptor')?gel('cp-receptor').value:'';

  var rep=cpCalcularReparto(v,_cpModo,bruto);
  if(rep.invalido){
    // El valor NO se borra: se corrige el número, no se reescribe entero.
    setSt(SVCobros.mensajeError(v,_cpModo,rep),'er');
    campo.focus();campo.select();return;
  }
  if(!(precio>0)){setSt('Este crédito no tiene precio unitario válido. Edítalo antes de cobrar.','er');return;}
  if(!mpVal){setSt('Selecciona el método de pago','er');return;}
  if(mpVal==='EFECTIVO'&&!receptorVal){setSt('Indica a quién se entregó el efectivo','er');return;}

  var _docsCp=docsSerializar('cp');
  var tipoDoc=_docsCp.tipo||'';
  var numDoc=_docsCp.nro||'';
  if(mpVal!=='EFECTIVO'&&!(_cobAdminImgs.cp||[]).length){setSt('Adjunta al menos un comprobante de pago','er');return;}

  setBL('btn-cp-ok-admin',true,'Guardando...');

  _cobAdmUpload('cp', id+'-cobro').then(function(imgUrl){
    var _cerrar=function(){
      gel('modal-cobro-parcial').classList.remove('open');
      _cobAdminImgs.cp=[];
      rCreditos();rDash();
    };
    var upd={
      estado:'✅ Pagado',
      movimiento:'Cobro de credito',
      fecha:fechaCobro,
      fecha_cobro:fechaCobro,
      metodo_pago:mpVal||null,
      receptor_efectivo:mpVal==='EFECTIVO'?(receptorVal||null):null
    };
    if(imgUrl)upd.imagen_documento=imgUrl;
    if(tipoDoc)upd.tipo_documento=tipoDoc;
    if(numDoc)upd.numero_documento=numDoc;

    if(rep.completo){
      upd.notas=(v.notas?v.notas+' | ':'')+'Cobrado el '+fmt(fechaCobro);
      return sbU('ventas',id,upd).then(function(){return loadAll();})
        .then(function(){
          _cerrar();
          setSt('Crédito saldado por completo el '+fmt(fechaCobro),'ok');
          setTimeout(function(){setSt('');},3000);
        });
    }

    // Fila original = la parte cobrada; fila nueva = el saldo. Las dos suman
    // el total original (SVCobros lo garantiza) y el saldo conserva la fecha
    // de vencimiento ORIGINAL: un cobro parcial no reinicia el plazo.
    var filaCobro=SVCobros.camposCobroParcial(rep,upd);
    filaCobro.notas=(v.notas?v.notas+' | ':'')+SVCobros.notaCobro(v,rep,_cpModo,fmt(fechaCobro));

    return sbU('ventas',id,filaCobro).then(function(){
      return sbP('ventas',SVCobros.filaSaldo(v,rep,{
        notas:SVCobros.notaSaldo(v,rep,_cpModo,fmt(fechaCobro))
      }));
    }).then(function(){return loadAll();})
      .then(function(){
        _cerrar();
        setSt('Cobrado '+money(rep.montoPagado)+' el '+fmt(fechaCobro)+'. Quedan '+money(rep.montoSaldo)+' pendientes.','ok');
        setTimeout(function(){setSt('');},4000);
      });
  }).catch(function(e){setSt(SVUI.error(e,'guardar el cobro'),'er');})
  .finally(function(){setBL('btn-cp-ok-admin',false,'Confirmar cobro');});
}


function poblarFiltros(){
  var sel=gel('fil-vend');
  sel.innerHTML='<option value="">Todos los vendedores</option>';
  for(var i=0;i<_vendedores.length;i++){
    var opt=document.createElement('option');
    opt.value=_vendedores[i].id;opt.textContent=_vendedores[i].nombre;
    sel.appendChild(opt);
  }
  var seen={},meses=[];
  for(var i=0;i<_ventas.length;i++){var m=_ventas[i].fecha?_ventas[i].fecha.substring(0,7):null;if(m&&!seen[m]){seen[m]=1;meses.push(m);}}
  meses.sort().reverse();
  var n=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var selM=gel('fil-mes');
  selM.innerHTML='<option value="">Todos los meses</option>';
  for(var i=0;i<meses.length;i++){var p=meses[i].split('-');var opt=document.createElement('option');opt.value=meses[i];opt.textContent=n[parseInt(p[1])-1]+' '+p[0];selM.appendChild(opt);}
  var _now=new Date();var _cur=_now.getFullYear()+'-'+(String(_now.getMonth()+1).padStart(2,'0'));
  if(seen[_cur])selM.value=_cur;
  // Productos únicos para fil-prod
  var fp=gel('fil-prod');
  if(fp){fp.innerHTML='<option value="">Todos los productos</option>';var prods={};_ventas.forEach(function(v){if(v.producto&&v.producto.trim())prods[v.producto.trim()]=1;});Object.keys(prods).sort().forEach(function(p){var o=document.createElement('option');o.value=p;o.textContent=p;fp.appendChild(o);});}
  // Zonas únicas para fil-zona
  var fz=gel('fil-zona');
  if(fz){fz.innerHTML='<option value="">Todas las zonas</option>';var zonas={};_ventas.forEach(function(v){if(v.zona&&v.zona.trim())zonas[v.zona.trim()]=1;});Object.keys(zonas).sort().forEach(function(z){var o=document.createElement('option');o.value=z;o.textContent=z;fz.appendChild(o);});}
}

var _hFilAdmin='todos';
function histSetTab(mov, btn){
  _hFilAdmin = mov;
  document.querySelectorAll('.hist-tab').forEach(function(b){
    b.classList.remove('btn-p'); b.classList.add('btn-s');
  });
  if(btn){ btn.classList.remove('btn-s'); btn.classList.add('btn-p'); }
  _histPag=1; rHist();
}

// ── VENTAS (Venta al contado + Cobro de crédito) ──
function poblarVentasFiltros(){
  var sm=gel('vt-mes');
  if(sm&&!sm.options.length){
    var meses={};
    _ventas.forEach(function(v){if(v.fecha)meses[v.fecha.substring(0,7)]=1;});
    var lista=Object.keys(meses).sort().reverse();
    sm.innerHTML='<option value="">Todos los meses</option>';
    lista.forEach(function(m){var opt=document.createElement('option');opt.value=m;var p=m.split('-');opt.textContent=new Date(p[0],p[1]-1,1).toLocaleDateString('es-PE',{month:'long',year:'numeric'});sm.appendChild(opt);});
    var now=new Date();var cur=now.getFullYear()+'-'+(String(now.getMonth()+1).padStart(2,'0'));
    if(meses[cur])sm.value=cur;
  }
  var sv=gel('vt-vend');
  if(sv&&sv.options.length<=1){
    sv.innerHTML='<option value="">Todos los vendedores</option>';
    _vendedores.forEach(function(v){var o=document.createElement('option');o.value=v.id;o.textContent=v.nombre;sv.appendChild(o);});
  }
  // Productos únicos para vt-prod
  var sprod=gel('vt-prod');
  if(sprod&&sprod.options.length<=1){
    var prods={};
    _ventas.forEach(function(v){if(v.producto&&v.producto.trim())prods[v.producto.trim()]=1;});
    var prodList=Object.keys(prods).sort();
    prodList.forEach(function(p){var o=document.createElement('option');o.value=p;o.textContent=p;sprod.appendChild(o);});
  }
  // Zonas únicas para vt-zona
  var szona=gel('vt-zona');
  if(szona&&szona.options.length<=1){
    var zonas={};
    _ventas.forEach(function(v){if(v.zona&&v.zona.trim())zonas[v.zona.trim()]=1;});
    var zonaList=Object.keys(zonas).sort();
    zonaList.forEach(function(z){var o=document.createElement('option');o.value=z;o.textContent=z;szona.appendChild(o);});
  }
}

function rVentas(){
  var mes=gel('vt-mes')?gel('vt-mes').value:'';
  var vid=gel('vt-vend')?gel('vt-vend').value:'';
  var tipo=gel('vt-tipo')?gel('vt-tipo').value:'';
  var prod=(gel('vt-prod')?gel('vt-prod').value||'':'').trim();
  var zona=(gel('vt-zona')?gel('vt-zona').value||'':'').trim();
  var busq=(gel('vt-busq')?gel('vt-busq').value||'':'').toLowerCase().trim();

  var lista=_ventas.filter(function(v){
    var mt=v.movimiento||'';
    var esVenta=(mt==='Venta al contado'||mt==='Cobro de credito');
    if(!esVenta)return false;
    if(v.estado==='Anulado')return false;
    if(mes&&(!v.fecha||v.fecha.substring(0,7)!==mes))return false;
    if(vid&&String(v.vendedor_id)!==String(vid))return false;
    if(tipo&&mt!==tipo)return false;
    if(prod&&(v.producto||'').trim()!==prod)return false;
    if(zona&&(v.zona||'').trim()!==zona)return false;
    if(busq){
      var hay=(v.veterinaria||'').toLowerCase().indexOf(busq)>=0||
              (v.doctora||'').toLowerCase().indexOf(busq)>=0||
              (v.producto||'').toLowerCase().indexOf(busq)>=0||
              (v.observaciones||'').toLowerCase().indexOf(busq)>=0;
      if(!hay)return false;
    }
    return true;
  });

  // Ordenar más reciente primero
  lista.sort(function(a,b){
    var da=(a.fecha||'')+(a.hora||'00:00');
    var db=(b.fecha||'')+(b.hora||'00:00');
    if(db>da)return 1;if(db<da)return -1;
    return (b.id||'')>(a.id||'')?1:-1;
  });

  // KPIs
  var totalSum=0,contadoSum=0,cobrosSum=0,cantTotal=0;
  lista.forEach(function(v){
    var t=v.total||0;
    totalSum+=t;
    cantTotal+=(v.cantidad||1);
    if(v.movimiento==='Venta al contado')contadoSum+=t;
    else cobrosSum+=t;
  });
  var el;
  if((el=gel('vt-total')))el.textContent=money(totalSum);
  if((el=gel('vt-contado')))el.textContent=money(contadoSum);
  if((el=gel('vt-cobros')))el.textContent=money(cobrosSum);
  if((el=gel('vt-count')))el.textContent=lista.length+(prod?' · '+cantTotal+' uds':'');

  // Tabla
  if(!lista.length){
    gel('vt-tabla').innerHTML='<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>Sin ventas registradas.</strong><br>Aparecerán aquí en cuanto el equipo registre la primera.</div>';
    return;
  }
  var html='<table><thead><tr>'+
    '<th>Fecha</th><th>Vendedor</th><th>Veterinaria</th><th>Tipo</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th>'+
  '</tr></thead><tbody>';
  lista.forEach(function(v){
    html+='<tr onclick="verDetalle(\''+v.id+'\')" style="cursor:pointer;">'+
      '<td>'+fmt(v.fecha)+'</td>'+
      '<td><span style="font-size:11px;background:var(--sky4);color:var(--brand);border-radius:4px;padding:1px 6px;font-weight:700;">'+getNombreVendedor(v.vendedor_id)+'</span></td>'+
      '<td>'+(v.veterinaria||'---')+'</td>'+
      '<td>'+bMov(v.movimiento)+'</td>'+
      '<td>'+(v.producto||'---')+'</td>'+
      '<td style="text-align:center;">'+(v.cantidad||1)+'</td>'+
      '<td><strong>'+money(v.total)+'</strong></td>'+
      '<td>'+bEst(v.estado)+'</td>'+
    '</tr>';
  });
  html+='</tbody></table>';
  gel('vt-tabla').innerHTML=html;
}

function generarPDFVentas(){
  var mes=gel('vt-mes')?gel('vt-mes').value:'';
  var vid=gel('vt-vend')?gel('vt-vend').value:'';
  var lista=_ventas.filter(function(v){
    var mt=v.movimiento||'';
    var esVenta=(mt==='Venta al contado'||mt==='Cobro de credito');
    if(!esVenta||v.estado==='Anulado')return false;
    if(mes&&(!v.fecha||v.fecha.substring(0,7)!==mes))return false;
    if(vid&&String(v.vendedor_id)!==String(vid))return false;
    return true;
  });
  var total=lista.reduce(function(s,v){return s+(v.total||0);},0);
  var _nsM=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var label=mes?(function(){var _p=mes.split('-');return' — '+_nsM[parseInt(_p[1])-1]+' de '+_p[0];}()):'';

  var vendLabel=vid?(' · '+getNombreVendedor(vid)):'';
  var tabla='<table style="width:100%;border-collapse:collapse;font-size:11px;">'+
    '<thead><tr style="background:#253C61;color:#fff;">'+
    '<th style="padding:6px 8px;text-align:left;">Fecha</th><th style="padding:6px 8px;text-align:left;">Vendedor</th>'+
    '<th style="padding:6px 8px;text-align:left;">Veterinaria</th><th style="padding:6px 8px;text-align:left;">Tipo</th>'+
    '<th style="padding:6px 8px;text-align:left;">Producto</th><th style="padding:6px 8px;text-align:right;">Cant.</th>'+
    '<th style="padding:6px 8px;text-align:right;">Total</th><th style="padding:6px 8px;text-align:left;">Estado</th>'+
    '</tr></thead><tbody>';
  lista.forEach(function(v,i){
    var bg=i%2===0?'#fff':'#f8fafc';
    tabla+='<tr style="background:'+bg+';">'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+fmt(v.fecha)+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+getNombreVendedor(v.vendedor_id)+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+(v.veterinaria||'---')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+(v.movimiento||'')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+(v.producto||'---')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">'+(v.cantidad||1)+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">'+money(v.total)+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+(v.estado||'')+'</td>'+
    '</tr>';
  });
  tabla+='<tr style="background:#f0f4f8;font-weight:700;"><td colspan="6" style="padding:6px 8px;text-align:right;border-top:2px solid #253C61;">TOTAL</td><td style="padding:6px 8px;text-align:right;border-top:2px solid #253C61;color:#253C61;">'+money(total)+'</td><td style="border-top:2px solid #253C61;"></td></tr>';
  tabla+='</tbody></table>';
  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8">'+_pdfFavicon()+'<title>Reporte de Ventas</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}.wrap{padding:16px 32px;}</style></head><body>'+
    _pdfHeader('Reporte de Ventas'+label,'Ventas al contado y cobros de crédito'+vendLabel)+
    '<div class="wrap">'+tabla+
    '<div style="margin-top:12px;font-size:10px;color:#64748b;text-align:right;">'+lista.length+' transacciones · Generado: '+new Date().toLocaleString('es-PE')+'</div>'+
    '</div><script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>');
  w.document.close();
}

function rHist(){
  var busq=(val('srch-h')||'').toLowerCase(),mes=val('fil-mes'),vfil=val('fil-vend');
  var desde=val('fil-desde')||'',hasta=val('fil-hasta')||'';
  var fprod=(val('fil-prod')||'').trim(),fzona=(val('fil-zona')||'').trim();
  var l=_ventas.filter(function(v){
    if(vfil&&String(v.vendedor_id)!==String(vfil))return false;
    if(_hFilAdmin&&_hFilAdmin!=='todos'&&movNorm(v.movimiento)!==movNorm(_hFilAdmin))return false;
    if(mes&&(!v.fecha||v.fecha.indexOf(mes)!==0))return false;
    if(desde&&(v.fecha||'')<desde)return false;
    if(hasta&&(v.fecha||'')>hasta)return false;
    if(fprod&&(v.producto||'').trim()!==fprod)return false;
    if(fzona&&(v.zona||'').trim()!==fzona)return false;
    if(busq){
      var txt=(v.veterinaria||'')+(v.doctora||'')+(v.zona||'')+(v.producto||'')+getNombreVendedor(v.vendedor_id);
      if(txt.toLowerCase().indexOf(busq)<0)return false;
    }
    return true;
  });
  // Ordenar más reciente primero
  l.sort(function(a,b){
    var da=(a.fecha||'')+(a.hora||'00:00');
    var db=(b.fecha||'')+(b.hora||'00:00');
    if(db>da)return 1;if(db<da)return -1;
    return (b.id||'')>(a.id||'')?1:-1;
  });
  // KPIs
  var kpiEl=gel('hist-kpis');
  if(kpiEl){
    var contadoV=l.filter(function(v){return v.movimiento==='Venta al contado'&&v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
    var cobrosV=l.filter(function(v){return v.movimiento==='Cobro de credito'&&v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
    var credPendV=l.filter(function(v){return esCredito15(v.movimiento)&&(v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido');}).reduce(function(s,v){return s+(v.total||0);},0);
    var deliveryV=l.filter(function(v){return v.movimiento==='Venta delivery'&&v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
    var visitasN=l.filter(function(v){return v.movimiento==='Visita';}).length;
    var totalVentasV=contadoV+cobrosV+deliveryV;
    kpiEl.innerHTML=[
      {lbl:'TOTAL VENTAS',val:money(totalVentasV),c:'var(--brand)'},
      {lbl:'VENTAS AL CONTADO',val:money(contadoV),c:'var(--ok)'},
      {lbl:'COBROS CRÉDITO',val:money(cobrosV),c:'#0891b2'},
      {lbl:'CRÉDITOS PEND.',val:money(credPendV),c:'var(--orange)'},
      {lbl:'DELIVERY',val:money(deliveryV),c:'#7c3aed'},
      {lbl:'VISITAS',val:String(visitasN),c:'var(--brand)'}
    ].map(function(k){
      return '<div class="an-kpi"><div class="an-kpi-lbl">'+k.lbl+'</div><div class="an-kpi-val" style="color:'+k.c+'">'+k.val+'</div></div>';
    }).join('');
  }
  // Paginación
  var PER=15,totalPags=Math.max(1,Math.ceil(l.length/PER));
  if(_histPag>totalPags)_histPag=totalPags;
  var page=l.slice((_histPag-1)*PER,_histPag*PER);
  // Filas
  var rows='';
  for(var i=0;i<page.length;i++){
    var v=page[i];
    var canAnul=v.estado!=='Anulado';
    rows+='<tr style="cursor:pointer;'+(v.estado==='Anulado'?'opacity:.5;text-decoration:line-through;':'')+'" onclick="verDetalle(\''+esc(v.id)+'\')" tabindex="0" role="button" aria-label="Ver detalle del movimiento" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();verDetalle(\''+esc(v.id)+'\');}">'+
      '<td style="white-space:nowrap;">'+fmt(v.fecha)+(v.hora?' <span class="tm2">'+esc(v.hora)+'</span>':'')+'</td>'+
      '<td><span style="font-size:11px;background:var(--sky4);color:var(--brand);border-radius:4px;padding:2px 6px;font-weight:700;">'+esc(getNombreVendedor(v.vendedor_id))+'</span></td>'+
      '<td style="font-weight:600;">'+esc(v.veterinaria||'---')+'</td>'+
      '<td class="tm2">'+esc(v.doctora||'---')+'</td>'+
      '<td>'+esc(v.zona||'---')+'</td>'+
      '<td>'+bMov(v.movimiento)+'</td>'+
      '<td>'+esc(v.producto||'---')+'</td>'+
      '<td style="text-align:center;">'+(v.cantidad||0)+'</td>'+
      '<td><strong>'+money(v.total)+'</strong></td>'+
      '<td>'+bEst(v.estado)+'</td>'+
      '<td style="white-space:nowrap;">'+
        (canAnul?'<button class="btn btn-d btn-sm" onclick="event.stopPropagation();anularVenta(\''+esc(v.id)+'\')">Anular</button>':'<span class="tm2">---</span>')+
      '</td>'+
    '</tr>';
  }
  // Paginador
  var pag='';
  if(totalPags>1){
    pag='<div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;border-top:1px solid var(--bd);font-size:12px;">'+
      '<span style="color:var(--tl);">'+l.length+' movimientos &middot; p\u00e1gina '+_histPag+' de '+totalPags+'</span>'+
      '<div style="display:flex;gap:4px;">';
    if(_histPag>1)pag+='<button class="btn btn-s btn-sm" onclick="_histPag=1;rHist()">\u00ab</button><button class="btn btn-s btn-sm" onclick="_histPag--;rHist()">&lsaquo;</button>';
    var sp=Math.max(1,_histPag-2),ep=Math.min(totalPags,sp+4);
    for(var pp=sp;pp<=ep;pp++)pag+='<button class="btn '+(pp===_histPag?'btn-p':'btn-s')+' btn-sm" onclick="_histPag='+pp+';rHist()">'+pp+'</button>';
    if(_histPag<totalPags)pag+='<button class="btn btn-s btn-sm" onclick="_histPag++;rHist()">&rsaquo;</button><button class="btn btn-s btn-sm" onclick="_histPag=totalPags;rHist()">\u00bb</button>';
    pag+='</div></div>';
  }else if(l.length>0){
    pag='<div style="padding:.5rem 1rem;font-size:11px;color:var(--tl);border-top:1px solid var(--bd);">'+l.length+' movimientos</div>';
  }
  gel('tbl-hist').innerHTML=rows?
    '<table><thead><tr><th>Fecha</th><th>Vendedor</th><th>Veterinaria</th><th>Doctor/a</th><th>Zona</th><th>Movimiento</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Acci\u00f3n</th></tr></thead><tbody>'+rows+'</tbody></table>'+pag:
    '<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-lista"/></svg></div><strong>Sin registros que mostrar.</strong></div>';
}

function generarPDFHistorialAdmin(){
  var busq=(val('srch-h')||'').toLowerCase();
  var mes=val('fil-mes'),vfil=val('fil-vend');
  var desde=val('fil-desde')||'',hasta=val('fil-hasta')||'';
  var fprod=(val('fil-prod')||'').trim(),fzona=(val('fil-zona')||'').trim();
  var l=_ventas.filter(function(v){
    if(vfil&&String(v.vendedor_id)!==String(vfil))return false;
    if(_hFilAdmin&&_hFilAdmin!=='todos'&&movNorm(v.movimiento)!==movNorm(_hFilAdmin))return false;
    if(mes&&(!v.fecha||v.fecha.indexOf(mes)!==0))return false;
    if(desde&&(v.fecha||'')<desde)return false;
    if(hasta&&(v.fecha||'')>hasta)return false;
    if(fprod&&(v.producto||'').trim()!==fprod)return false;
    if(fzona&&(v.zona||'').trim()!==fzona)return false;
    if(busq){
      var txt=(v.veterinaria||'')+(v.doctora||'')+(v.zona||'')+(v.producto||'')+getNombreVendedor(v.vendedor_id);
      if(txt.toLowerCase().indexOf(busq)<0)return false;
    }
    return true;
  });
  l.sort(function(a,b){
    var da=(a.fecha||'')+(a.hora||'00:00'),db=(b.fecha||'')+(b.hora||'00:00');
    if(db>da)return 1;if(db<da)return -1;
    return (b.id||'')>(a.id||'')?1:-1;
  });
  var _nsM=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var mesLabel=mes?(function(){var _p=mes.split('-');return _nsM[parseInt(_p[1])-1]+' de '+_p[0];}()):'Todos los períodos';
  var vendLabel=vfil?getNombreVendedor(vfil):'Todos los vendedores';
  var subt=mesLabel+' · '+vendLabel+(_hFilAdmin&&_hFilAdmin!=='todos'?' · '+_hFilAdmin:'')+(fzona?' · Zona: '+fzona:'')+(fprod?' · '+fprod:'');
  var contadoV=l.filter(function(v){return v.movimiento==='Venta al contado'&&v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
  var cobrosV=l.filter(function(v){return v.movimiento==='Cobro de credito'&&v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
  var credPendV=l.filter(function(v){return esCredito15(v.movimiento)&&(v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido');}).reduce(function(s,v){return s+(v.total||0);},0);
  var deliveryV=l.filter(function(v){return v.movimiento==='Venta delivery'&&v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
  var visitasN=l.filter(function(v){return v.movimiento==='Visita';}).length;
  var totalV=contadoV+cobrosV+deliveryV;
  var kpisHtml='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">'+
    [['TOTAL VENTAS',money(totalV),'#253C61'],['CONTADO',money(contadoV),'#2d7a3a'],['COBROS CRÉD.',money(cobrosV),'#0891b2'],
     ['CRÉDITOS PEND.',money(credPendV),'#d97706'],['DELIVERY',money(deliveryV),'#7c3aed'],['VISITAS',String(visitasN),'#64748b']
    ].map(function(k){return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 14px;"><div style="font-size:10px;font-weight:700;color:#718096;text-transform:uppercase;">'+k[0]+'</div><div style="font-size:20px;font-weight:800;color:'+k[2]+';font-family:\'Bebas Neue\',sans-serif;">'+k[1]+'</div></div>';}).join('')+
  '</div>';
  var rows='';
  l.forEach(function(v,i){
    rows+='<tr style="background:'+(i%2===0?'#fff':'#f8fafc')+';">'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px;">'+fmt(v.fecha)+(v.hora?' '+v.hora:'')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px;">'+getNombreVendedor(v.vendedor_id)+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px;">'+(v.veterinaria||'---')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px;">'+(v.doctora||'---')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px;">'+(v.zona||'---')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px;">'+(v.movimiento||'')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px;">'+(v.producto||'---')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:10px;">'+(v.cantidad||0)+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-size:10px;">'+money(v.total)+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:10px;">'+(v.estado||'')+'</td>'+
    '</tr>';
  });
  var tabla='<div style="padding:0 32px 20px;"><table style="width:100%;border-collapse:collapse;">'+
    '<thead><tr style="background:#253C61;color:#fff;">'+
    '<th style="padding:6px 8px;text-align:left;font-size:10px;">Fecha</th>'+
    '<th style="padding:6px 8px;text-align:left;font-size:10px;">Vendedor</th>'+
    '<th style="padding:6px 8px;text-align:left;font-size:10px;">Veterinaria</th>'+
    '<th style="padding:6px 8px;text-align:left;font-size:10px;">Doctor/a</th>'+
    '<th style="padding:6px 8px;text-align:left;font-size:10px;">Zona</th>'+
    '<th style="padding:6px 8px;text-align:left;font-size:10px;">Movimiento</th>'+
    '<th style="padding:6px 8px;text-align:left;font-size:10px;">Producto</th>'+
    '<th style="padding:6px 8px;text-align:center;font-size:10px;">Cant.</th>'+
    '<th style="padding:6px 8px;text-align:right;font-size:10px;">Total</th>'+
    '<th style="padding:6px 8px;text-align:left;font-size:10px;">Estado</th>'+
    '</tr></thead><tbody>'+(rows||'<tr><td colspan="10" style="text-align:center;padding:2rem;color:#aaa;">Sin registros</td></tr>')+
    '</tbody></table></div>';
  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8">'+_pdfFavicon()+'<title>Historial Global</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>'+
    _pdfHeader('Historial Global',subt)+
    '<div style="padding:16px 32px 0;">'+kpisHtml+'</div>'+tabla+
    '<div style="padding:0 32px 16px;font-size:10px;color:#64748b;text-align:right;">'+l.length+' movimientos · Generado: '+new Date().toLocaleString('es-PE')+'</div>'+
    '<script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>');
  w.document.close();
}

function rptPdfVentas(){
  var mes=gel('rpt-mes-ventas')?gel('rpt-mes-ventas').value:'';
  var vid=gel('rpt-vend-ventas')?gel('rpt-vend-ventas').value:'';
  var vtMes=gel('vt-mes'),vtVend=gel('vt-vend');
  if(vtMes)vtMes.value=mes;
  if(vtVend)vtVend.value=vid;
  generarPDFVentas();
}

function rptPdfHistorial(){
  var mes=gel('rpt-mes-hist')?gel('rpt-mes-hist').value:'';
  var vid=gel('rpt-vend-hist')?gel('rpt-vend-hist').value:'';
  var fMes=gel('fil-mes'),fVend=gel('fil-vend');
  if(fMes)fMes.value=mes;
  if(fVend)fVend.value=vid;
  _hFilAdmin='todos';
  generarPDFHistorialAdmin();
}

function anularVenta(id){
  showConfirm(
    '\u00bfEst\u00e1s seguro/a que quieres anular esta transacci\u00f3n?<br><span style="font-size:12px;color:var(--tl);">El estado cambiar\u00e1 a "Anulado" y no contar\u00e1 en reportes.</span>',
    'Anular transacci\u00f3n',
    'S\u00ed, anular',
    function(){
      sbU('ventas',id,{estado:'Anulado'}).then(function(){return loadAll();})
      .then(function(){
        rDash();rHist();rCreditos();
        var modal=gel('modal-detalle');if(modal&&modal.classList.contains('open'))cerrarModal('modal-detalle');
        showToast('Transacci\u00f3n anulada','ok');
      }).catch(function(e){setSt(SVUI.error(e),'er');});
    }
  );
}

// \u2500\u2500 DETALLE TRANSACCI\u00d3N \u2500\u2500
function verDetalle(id){
  var v=null;
  for(var i=0;i<_ventas.length;i++){if(_ventas[i].id===id){v=_ventas[i];break;}}
  if(!v)return;
  _detalleVentaId=id;
  _detalleEditando=false;
  // Cargar productos para el select de edición
  if(_productosCache!==null){
    _productosDisponibles=_productosCache;
    renderDetalle(v);
  }else{
    sbG('productos','select=nombre').then(function(r){
      _productosCache=r||[];_productosDisponibles=_productosCache;renderDetalle(v);
    }).catch(function(){_productosCache=[];_productosDisponibles=[];renderDetalle(v);});
  }
}

function renderDetalle(v){
  function campo(lbl,val,rawHtml){
    var out=rawHtml?val:esc(val);
    return '<div class="sc"><div style="font-size:11px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:4px;">'+esc(lbl)+'</div>'+
      '<div style="font-size:13px;color:var(--tl);">'+out+'</div></div>';
  }
  // valMostrar: lo que se ve en modo lectura cuando difiere de lo que va en el
  // input (p.ej. el RUC vacío se lee como "---" pero el input arranca vacío,
  // no con la palabra "---" dentro).
  function campoEditable(lbl,val,fieldId,tipo,valMostrar,extraAttrs){
    if(!tipo)tipo='text';
    var safeVal=esc(val);
    var muestra=(valMostrar===undefined||valMostrar===null)?safeVal:esc(valMostrar);
    return '<div class="sc">'+
      '<div style="font-size:11px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:4px;">'+esc(lbl)+'</div>'+
      '<div id="campo-'+esc(fieldId)+'" style="font-size:13px;color:var(--tl);">'+muestra+'</div>'+
      '<input type="'+esc(tipo)+'" id="edit-'+esc(fieldId)+'" value="'+safeVal+'" '+(extraAttrs||'')+' '+
      'style="display:none;width:100%;padding:6px 10px;border:1px solid var(--brand);border-radius:4px;font-size:13px;" /></div>';
  }
  // Header con vendedor — editable: si el movimiento se registró con el usuario
  // equivocado, aquí se reasigna (afecta historial, analíticas y stock del vendedor).
  _detalleVendedorOrig=v.vendedor_id||'';
  _detalleGrupoIds=_dvFilasGrupo(v).map(function(x){return x.id;});
  var opcionesVend='';
  for(var iv=0;iv<_vendedores.length;iv++){
    var vd=_vendedores[iv];
    opcionesVend+='<option value="'+esc(vd.id)+'"'+(String(vd.id)===String(v.vendedor_id)?' selected':'')+'>'+esc(vd.nombre)+'</option>';
  }
  var contenido='<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.6rem .85rem;margin-bottom:.8rem;font-size:12px;">'+
    '<div style="font-size:10px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:3px;">Vendedor</div>'+
    '<div id="campo-vendedor"><strong style="color:var(--brand);">'+esc(getNombreVendedor(v.vendedor_id))+'</strong></div>'+
    '<select id="edit-vendedor" style="display:none;width:100%;padding:6px 8px;border:1px solid var(--brand);border-radius:4px;font-size:13px;">'+opcionesVend+'</select>'+
    '<div id="dv-vend-extra" style="display:none;margin-top:6px;">'+
      (_detalleGrupoIds.length
        ? '<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--td);cursor:pointer;">'+
            '<input type="checkbox" id="dv-vend-grupo" checked style="margin:0;"/>'+
            'Aplicar tambi&eacute;n a las otras '+_detalleGrupoIds.length+' l&iacute;neas de este mismo registro'+
          '</label>'
        : '')+
      '<div style="font-size:11px;color:var(--tl);margin-top:4px;">Al cambiar el vendedor, el movimiento pasa a su historial y su stock se recalcula (se le devuelve al anterior y se le descuenta al nuevo).</div>'+
    '</div>'+
  '</div>';
  contenido+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1rem;">';
  contenido+=campoEditable('Fecha',fmt(v.fecha),'fecha','date');
  contenido+=campo('Movimiento',bMov(v.movimiento),true);
  contenido+=campo('Veterinaria',v.veterinaria||'---');
  contenido+=campo('Doctora / Medico',v.doctora||'---');
  contenido+=campo('Zona',v.zona||'---');
  contenido+=campo('Celular',v.num_medico||v.celular||'---');
  // RUC: dato fiscal del cliente, no del movimiento. Se muestra siempre (con
  // "---" si nunca se capturó) y es editable, para poder completarlo desde
  // aquí sin tener que ir a la ficha del cliente. Al guardar se sincroniza
  // también a clientes_vet, que es el registro canónico del cliente.
  contenido+=campoEditable('RUC',v.ruc||'','ruc','text',v.ruc||'---','maxlength="11" placeholder="20XXXXXXXXX"');
  contenido+='</div>';
  if(v.movimiento!=='Visita'){
    var opcionesProducto='';
    if(_productosDisponibles.length>0){
      _productosDisponibles.forEach(function(p){
        var sel=(p.nombre===v.producto)?'selected':'';
        opcionesProducto+='<option value="'+esc(p.nombre)+'" '+sel+'>'+esc(p.nombre)+'</option>';
      });
    }else{
      opcionesProducto='<option value="'+esc(v.producto||'')+'" selected>'+esc(v.producto||'Sin producto')+'</option>';
    }
    contenido+='<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.85rem 1rem;margin-bottom:1rem;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;">';
    contenido+='<div><div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;margin-bottom:3px;">PRODUCTO</div>'+
      '<div id="campo-producto" style="font-size:13px;color:var(--tl);">'+esc(v.producto||'---')+'</div>'+
      '<select id="edit-producto" style="display:none;width:100%;padding:6px 8px;border:1px solid var(--brand);border-radius:4px;font-size:13px;">'+opcionesProducto+'</select></div>';
    contenido+='<div><div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;margin-bottom:3px;">CANTIDAD</div>'+
      '<div id="campo-cantidad" style="font-size:13px;color:var(--tl);">'+(v.cantidad||0)+'</div>'+
      '<input type="number" id="edit-cantidad" value="'+(v.cantidad||0)+'" oninput="recalcularTotal()" style="display:none;width:100%;padding:6px 8px;border:1px solid var(--brand);border-radius:4px;font-size:13px;"/></div>';
    contenido+='<div><div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;margin-bottom:3px;">PRECIO UNIT.</div>'+
      '<div id="campo-precio" style="font-size:13px;color:var(--tl);">'+Number(v.precio_unitario||0).toFixed(2)+'</div>'+
      '<input type="number" step="0.01" id="edit-precio" value="'+Number(v.precio_unitario||0).toFixed(2)+'" oninput="recalcularTotal()" style="display:none;width:100%;padding:6px 8px;border:1px solid var(--brand);border-radius:4px;font-size:13px;"/></div>';
    contenido+='<div><div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;margin-bottom:3px;">TOTAL</div>'+
      '<div id="campo-total" style="font-size:15px;font-weight:700;color:var(--brand);">S/ '+Number(v.total||0).toFixed(2)+'</div>'+
      '<input type="number" step="0.01" id="edit-total" value="'+Number(v.total||0).toFixed(2)+'" disabled style="display:none;width:100%;padding:6px 8px;border:1px solid var(--bd);border-radius:4px;font-size:13px;background:#f3f4f6;"/></div>';
    contenido+='</div>';
    if(v.fecha_cobro)contenido+='<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:var(--r);padding:.7rem 1rem;margin-bottom:1rem;font-size:12px;color:#92400e;">&#128197; Cobro estimado: <strong>'+fmt(v.fecha_cobro)+'</strong></div>';
    // Sección documento(s) + imagen(es) — vista de solo lectura. El editor (multi-documento +
    // multi-imagen, igual que Registrar Visita / Marcar pagado) se construye en _dvDocsImgsInit(),
    // que reemplaza el contenido de #dv-docs-editor cuando se entra en modo edición.
    contenido+='<div style="border:1px solid var(--bd);border-radius:var(--r);padding:.85rem 1rem;margin-bottom:1rem;">'+
      '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">📄 Documento(s)</div>'+
      '<div id="campo-documentos">'+
        (function(){
          var tipos=(v.tipo_documento||'').split(' | ');
          var nros=(v.numero_documento||'').split(' | ');
          var n=Math.max(tipos.length,nros.length);
          var filas='';
          for(var i=0;i<n;i++){
            if(!tipos[i]&&!nros[i])continue;
            filas+='<div style="font-size:13px;color:var(--tl);margin-bottom:3px;"><strong>'+esc(tipos[i]||'Sin documento')+'</strong>'+(nros[i]?' · '+esc(nros[i]):'')+'</div>';
          }
          return filas||'<div style="font-size:12px;color:var(--tl);font-style:italic;">Sin documento</div>';
        })()+
      '</div>'+
      '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;margin:10px 0 6px;">IMAGEN</div>'+
      '<div id="campo-imagen_documento">'+
        (function(){
          // imagen_documento puede contener varias URLs separadas por salto de línea
          // (registro de visita con 2+ comprobantes adjuntos) — mostrar una galería.
          var raw=(v.imagen_documento||'').trim();
          if(!raw) return '<span style="font-size:12px;color:var(--tl);font-style:italic;">Sin imagen adjunta</span>';
          var urls=raw.split(/[\r\n\s]+/).map(function(u){return u.trim();}).filter(function(u){return /^https?:\/\//i.test(u);});
          if(!urls.length) return '<span style="font-size:12px;color:var(--tl);font-style:italic;">Sin imagen adjunta</span>';
          return '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+
            urls.map(function(u){
              return '<a href="'+esc(u)+'" target="_blank"><img src="'+esc(u)+'" style="max-width:140px;max-height:150px;border-radius:6px;border:1px solid var(--bd);cursor:pointer;"/></a>';
            }).join('')+
          '</div>';
        })()+
      '</div>'+
      '<div id="edit-documentos" style="display:none;">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'+
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--tl);letter-spacing:.5px;">📄 Documentos</div>'+
          '<button type="button" class="btn btn-s btn-sm" onclick="docsAgregar(\'dv\')" style="font-size:11px;padding:.3rem .6rem;">+ Agregar otro</button>'+
        '</div>'+
        '<div id="dv-docs-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;"></div>'+
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--tl);letter-spacing:.5px;margin-bottom:6px;">📎 Comprobantes / im&aacute;genes <span id="dv-img-counter" style="font-size:11px;font-weight:600;color:var(--brand);">(0/4)</span></div>'+
        '<div id="dv-img-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;"></div>'+
        '<input type="file" id="dv-img" accept="image/*,application/pdf" multiple style="display:none;"/>'+
        '<div style="font-size:11px;color:var(--tl);margin-top:6px;">Hasta 4 fotos o PDFs. Las imágenes existentes se conservan salvo que las elimines aquí; al subir nuevas, reemplazan a las actuales.</div>'+
      '</div>'+
    '</div>';
  }
  if(v.metodo_pago){
    contenido+='<div style="border:1px solid var(--bd);border-radius:var(--r);padding:.7rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'+
      '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.6px;min-width:80px;">Método de pago</div>'+
      '<div style="font-size:13px;font-weight:600;color:var(--td);">'+esc(v.metodo_pago)+'</div>'+
      (v.receptor_efectivo
        ? '<div style="margin-left:auto;background:#f0fdf4;border:1px solid #16a34a;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:700;color:#16a34a;">&#128200; Entregado a: '+esc(v.receptor_efectivo)+'</div>'
        : '')+
    '</div>';
  }
  contenido+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;"><span style="font-size:11px;font-weight:700;color:var(--brand);text-transform:uppercase;">Estado:</span>'+bEst(v.estado)+'</div>';
  var notasTexto=(v.notas&&v.notas.trim())?v.notas:'';
  contenido+='<div style="border:1px solid var(--bd);border-radius:var(--r);padding:.85rem 1rem;margin-bottom:1rem;">'+
    '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;">&#128203; Notas del vendedor</div>'+
    '<div id="campo-notas" style="font-size:13px;line-height:1.6;color:var(--td);">'+(notasTexto?esc(notasTexto):'<span style="color:var(--tl);font-style:italic;">Sin notas adicionales</span>')+'</div>'+
    '<textarea id="edit-notas" style="display:none;width:100%;min-height:80px;padding:10px;border:1px solid var(--brand);border-radius:4px;font-size:13px;font-family:inherit;resize:vertical;">'+esc(notasTexto)+'</textarea>'+
    '</div>';
  var canAnul=(v.estado!=='Anulado');
  var isCred=esCredito15(v.movimiento)&&(v.estado==='\u23f3 Pendiente'||v.estado==='\u274c Vencido');
  contenido+='<div style="display:flex;justify-content:space-between;gap:8px;margin-top:1rem;">'+
    '<button id="btn-editar" class="btn" style="background:var(--brand);color:#fff;" onclick="toggleEditar()">&#x270F;&#xFE0F; Editar</button>'+
    '<div style="display:flex;gap:8px;">'+
      '<button id="btn-guardar" class="btn" style="display:none;background:#10b981;color:#fff;" onclick="guardarCambios()">&#128190; Guardar</button>'+
      '<button id="btn-cancelar" class="btn" style="display:none;background:var(--bd);color:var(--td);" onclick="cancelarEdicion()">Cancelar</button>'+
      (isCred?'<button class="btn btn-ok" onclick="marcarPagado(\''+esc(v.id)+'\');cerrarModal(\'modal-detalle\')">\u2705 Cobrar</button>':'')+
      (canAnul?'<button class="btn btn-d" onclick="anularVenta(\''+esc(v.id)+'\');cerrarModal(\'modal-detalle\')">Anular</button>':'')+
      '<button class="btn btn-p" onclick="cerrarModal(\'modal-detalle\')">Cerrar</button>'+
    '</div></div>';
  gel('detalle-body').innerHTML=contenido;
  gel('detalle-titulo').textContent=(v.veterinaria||'Transacci\u00f3n')+' \u00b7 '+fmt(v.fecha);
  abrirModal('modal-detalle');
  var ef=gel('edit-fecha');if(ef&&v.fecha)ef.value=v.fecha;
  // Inicializar el editor multi-documento + multi-imagen (prefijo 'dv') con los
  // valores actuales de la transacción, igual patrón que Registrar Visita / Marcar pagado.
  _dvDocsImgsInit(v);
}

// ── DOCUMENTOS + IMÁGENES (multi) – MODAL DETALLE/EDITAR TRANSACCIÓN ──
// Reutiliza docsReset/docsRender/docsSerializar (core.js, prefijo 'dv') para los pares
// tipo+número, y el mismo patrón de galería multi-imagen que _cobAdminImgs (mp/cp),
// extendido aquí para soportar imágenes URL YA EXISTENTES (no solo File nuevos) que el
// usuario puede quitar individualmente. Si se sube al menos 1 imagen nueva o se quita alguna
// existente, el set final de URLs reemplaza a imagen_documento; si no se toca nada, se mantiene.
var _dvImgsExist=[]; // URLs existentes que el usuario no ha quitado
var _dvImgsNuevas=[]; // File[] nuevos a subir
var _DV_IMG_MAX=4;

function _dvDocsImgsInit(v){
  docsCargar('dv', v.tipo_documento||'', v.numero_documento||'');
  var raw=(v.imagen_documento||'').trim();
  _dvImgsExist=raw?raw.split(/[\r\n\s]+/).map(function(u){return u.trim();}).filter(function(u){return /^https?:\/\//i.test(u);}):[];
  _dvImgsNuevas=[];
  _dvImgRender();
  var inp=gel('dv-img');
  if(inp&&!inp.dataset.wiredDv){
    inp.dataset.wiredDv='1';
    inp.addEventListener('change',_dvImgAgregar);
  }
}
function _dvImgAgregar(){
  var inp=gel('dv-img');if(!inp||!inp.files)return;
  var libre=_DV_IMG_MAX-(_dvImgsExist.length+_dvImgsNuevas.length);
  if(libre<=0){setSt('Máximo '+_DV_IMG_MAX+' archivos','er');setTimeout(function(){setSt('');},2000);inp.value='';return;}
  for(var i=0;i<inp.files.length&&i<libre;i++)_dvImgsNuevas.push(inp.files[i]);
  inp.value='';_dvImgRender();
}
function _dvImgQuitarExist(idx){_dvImgsExist.splice(idx,1);_dvImgRender();}
function _dvImgQuitarNueva(idx){_dvImgsNuevas.splice(idx,1);_dvImgRender();}
function _dvImgRender(){
  var grid=gel('dv-img-grid');var counter=gel('dv-img-counter');
  var total=_dvImgsExist.length+_dvImgsNuevas.length;
  if(counter)counter.textContent='('+total+'/'+_DV_IMG_MAX+')';
  if(!grid)return;
  var html='';
  _dvImgsExist.forEach(function(u,idx){
    html+='<div style="position:relative;border:2px solid var(--sky);border-radius:10px;background:var(--sky4);padding:6px 4px;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;">'+
      '<button type="button" onclick="_dvImgQuitarExist('+idx+');event.stopPropagation();" style="position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:#dc2626;color:#fff;border:none;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:bold;line-height:1;padding:0;">×</button>'+
      '<a href="'+esc(u)+'" target="_blank"><img src="'+esc(u)+'" style="max-width:100%;max-height:55px;object-fit:contain;border-radius:5px;"/></a>'+
      '<div style="font-size:9px;color:var(--brand);font-weight:600;">Actual</div>'+
    '</div>';
  });
  _dvImgsNuevas.forEach(function(f,idx){
    var isImg=f.type&&f.type.indexOf('image/')===0;
    html+='<div style="position:relative;border:2px solid #16a34a;border-radius:10px;background:#f0fdf4;padding:6px 4px;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;">'+
      '<button type="button" onclick="_dvImgQuitarNueva('+idx+');event.stopPropagation();" style="position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:#dc2626;color:#fff;border:none;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:bold;line-height:1;padding:0;">×</button>'+
      (isImg?'<img data-dv-thumb="'+idx+'" src="" style="max-width:100%;max-height:55px;object-fit:contain;border-radius:5px;"/>':'<div style="font-size:28px;line-height:1;">📄</div>')+
      '<div style="font-size:9px;color:var(--brand);font-weight:600;text-align:center;word-break:break-all;padding:0 2px;line-height:1.2;">'+esc(f.name)+'</div>'+
    '</div>';
  });
  if(total<_DV_IMG_MAX){
    html+='<div onclick="document.getElementById(\'dv-img\').click()" style="border:2px dashed var(--brand);border-radius:10px;background:var(--sky4);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 6px;cursor:pointer;min-height:100px;text-align:center;user-select:none;">'+
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>'+
      '<span style="font-size:11px;font-weight:600;color:var(--brand);">'+(total?'Agregar':'Subir')+'</span>'+
    '</div>';
  }
  grid.innerHTML=html;
  _dvImgsNuevas.forEach(function(f,idx){
    if(!f.type||f.type.indexOf('image/')!==0)return;
    var img=grid.querySelector('img[data-dv-thumb="'+idx+'"]');
    if(!img)return;
    var r=new FileReader();r.onload=function(e){img.src=e.target.result;};r.readAsDataURL(f);
  });
}
// Sube las imágenes nuevas y arma el string final (existentes conservadas + nuevas), unidas por '\n'.
function _dvImgUpload(){
  var idPrefix=(_detalleVentaId||'dv')+'-edit';
  var existentes=_dvImgsExist.slice();
  if(!_dvImgsNuevas.length)return Promise.resolve(existentes.length?existentes.join('\n'):null);
  var ts=Date.now();
  return _dvImgsNuevas.reduce(function(chain,file,i){
    return chain.then(function(urls){
      return comprimirImagen(file,4).then(function(c){
        var ext=(c.name.split('.').pop()||'jpg').toLowerCase();
        var path=idPrefix+'-'+ts+'-'+i+'.'+ext;
        return fetch(SB+'/storage/v1/object/documentos-venta/'+path,{
          method:'POST',headers:{'apikey':AK,'Authorization':'Bearer '+(AUTH_TOKEN||AK),'Content-Type':c.type},body:c
        }).then(function(r){
          if(!r.ok)return r.text().then(function(tx){var p={};try{p=JSON.parse(tx);}catch(ex){}throw new Error(p.message||p.error||'Error al subir imagen '+(i+1));});
          urls.push(SB+'/storage/v1/object/public/documentos-venta/'+path);
          return urls;
        });
      });
    });
  },Promise.resolve(existentes)).then(function(urls){return urls.length?urls.join('\n'):null;});
}

// ── EXPORTAR COMPROBANTES ──
function abrirExport(){
  var sel=gel('exp-vendedor');if(!sel)return;
  sel.innerHTML='<option value="">— Todos los vendedores —</option>';
  _vendedores.forEach(function(v){var o=document.createElement('option');o.value=v.id;o.textContent=v.nombre;sel.appendChild(o);});
  var now=new Date(),y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0');
  var desde=gel('exp-desde'),hasta=gel('exp-hasta');
  if(desde)desde.value=y+'-'+m+'-01';
  if(hasta)hasta.value=hoy();
  var stEl=gel('exp-st');if(stEl){stEl.textContent='';stEl.style.color='var(--tl)';}
  abrirModal('modal-export');
}

function _loadScript(src){
  return new Promise(function(resolve,reject){
    var s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
}

function exportarComprobantes(){
  var vendId=val('exp-vendedor'),desde=val('exp-desde'),hasta=val('exp-hasta');
  var stEl=gel('exp-st'),btn=gel('btn-exp');
  if(!desde||!hasta){
    if(stEl){stEl.textContent='⚠️ Selecciona el rango de fechas';stEl.style.color='var(--er)';}
    return;
  }
  if(btn){btn.disabled=true;btn.textContent='Preparando...';}
  if(stEl){stEl.textContent='Consultando ventas...';stEl.style.color='var(--tl)';}
  var q='ventas?select=*&fecha=gte.'+desde+'&fecha=lte.'+hasta+'&imagen_documento=not.is.null&order=fecha.asc';
  if(vendId)q+='&vendedor_id=eq.'+vendId;
  sbG(q).then(function(ventas){
    if(!ventas||!ventas.length){
      if(stEl){stEl.textContent='Sin comprobantes en ese rango.';stEl.style.color='var(--tl)';}
      if(btn){btn.disabled=false;btn.textContent='📥 Descargar ZIP';}
      return;
    }
    if(stEl)stEl.textContent='Cargando librería ZIP...';
    var prom=window.JSZip?Promise.resolve():_loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    return prom.then(function(){
      var zip=new window.JSZip(),errores=0,completados=0;
      function _sanit(s){return (s||'').replace(/[\/\\:*?"<>|]/g,'_').trim();}
      var CONCURRENCIA=5;
      // imagen_documento puede contener varias URLs separadas por salto de línea
      // (registro de visita con 2+ adjuntos). Aplanamos a [{venta,url,idx,total}].
      var tareas=[];
      ventas.forEach(function(v){
        var raw=(v.imagen_documento||'').trim();if(!raw)return;
        var urls=raw.split(/[\r\n\s]+/).map(function(u){return u.trim();}).filter(function(u){return /^https?:\/\//i.test(u);});
        urls.forEach(function(u,idx){tareas.push({venta:v,url:u,idx:idx,total:urls.length});});
      });
      if(!tareas.length){
        if(stEl){stEl.textContent='Sin comprobantes en ese rango.';stEl.style.color='var(--tl)';}
        if(btn){btn.disabled=false;btn.textContent='📥 Descargar ZIP';}
        return;
      }
      function fetchTarea(t){
        var v=t.venta,url=t.url;
        var vetN=_sanit(v.veterinaria||'Sin veterinaria');
        var docN=_sanit(v.doctora||'');
        var carpeta=docN?vetN+', '+docN:vetN;
        var movLbl=_sanit(v.movimiento||'Sin tipo');
        var _urlPath=url.split('?')[0];var _extM=_urlPath.match(/\.([a-zA-Z0-9]+)$/);var ext=(_extM&&_extM[1])||'jpg';
        var sufijo=t.total>1?'-'+(t.idx+1):'';
        var fname=movLbl+(vetN?', '+vetN:'')+(docN?', '+docN:'')+', '+(v.fecha||'sin-fecha')+sufijo+'.'+ext;
        return fetch(url).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.blob();})
          .then(function(blob){zip.folder(carpeta).file(fname,blob);})
          .catch(function(err){errores++;zip.folder(carpeta).file(fname+'.error.txt','Error: '+url+'\n'+err.message);})
          .then(function(){completados++;if(stEl)stEl.textContent='('+completados+'/'+tareas.length+') Descargando...';});
      }
      // Run in parallel batches of CONCURRENCIA
      var i=0;
      function nextBatch(){
        if(i>=tareas.length)return Promise.resolve();
        var batch=tareas.slice(i,i+CONCURRENCIA);i+=CONCURRENCIA;
        return Promise.all(batch.map(fetchTarea)).then(nextBatch);
      }
      return nextBatch().then(function(){
        if(stEl)stEl.textContent='Generando ZIP...';
        return zip.generateAsync({type:'blob'});
      }).then(function(content){
        var vnom='todos';
        if(vendId){for(var j=0;j<_vendedores.length;j++){if(String(_vendedores[j].id)===String(vendId)){vnom=_vendedores[j].nombre.replace(/\s+/g,'-');break;}}}
        var a=document.createElement('a');
        a.href=URL.createObjectURL(content);
        a.download='comprobantes-'+vnom+'-'+desde+'-al-'+hasta+'.zip';
        document.body.appendChild(a);a.click();document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        if(stEl){stEl.textContent='✅ ZIP descargado'+(errores?' ('+errores+' errores)':'');stEl.style.color=errores?'var(--er)':'#16a34a';}
      });
    });
  }).catch(function(e){
    if(stEl){stEl.textContent=SVUI.error(e);stEl.style.color='var(--er)';}
  }).finally(function(){
    if(btn){btn.disabled=false;btn.textContent='📥 Descargar ZIP';}
  });
}

function toggleEditar(){
  _detalleEditando=!_detalleEditando;
  ['vendedor','fecha','ruc','producto','cantidad','precio','total','notas'].forEach(function(f){
    var c=gel('campo-'+f),inp=gel('edit-'+f);
    if(c&&inp){
      c.style.display=_detalleEditando?'none':'block';
      inp.style.display=_detalleEditando?'block':'none';
      if(f==='total')inp.disabled=true;
    }
  });
  // Aviso + checkbox de reasignación de vendedor: solo tienen sentido en edición.
  var vendExtra=gel('dv-vend-extra');
  if(vendExtra)vendExtra.style.display=_detalleEditando?'block':'none';
  // Documento(s) + imagen(es): bloque propio con su propia vista lectura/edición
  // (reutiliza el editor multi-documento/multi-imagen 'dv', ver _dvDocsImgsInit).
  var campoDocs=gel('campo-documentos'),campoImg=gel('campo-imagen_documento'),editDocs=gel('edit-documentos');
  if(campoDocs)campoDocs.style.display=_detalleEditando?'none':'block';
  if(campoImg)campoImg.style.display=_detalleEditando?'none':'block';
  if(editDocs){
    editDocs.style.display=_detalleEditando?'block':'none';
    if(_detalleEditando)docsRender('dv'); // el contenedor #dv-docs-list recién es visible ahora
  }
  var be=gel('btn-editar'),bg=gel('btn-guardar'),bc=gel('btn-cancelar');
  if(be)be.style.display=_detalleEditando?'none':'inline-block';
  if(bg)bg.style.display=_detalleEditando?'inline-block':'none';
  if(bc)bc.style.display=_detalleEditando?'inline-block':'none';
}

function recalcularTotal(){
  var c=gel('edit-cantidad'),p=gel('edit-precio'),t=gel('edit-total');
  if(c&&p&&t)t.value=((parseFloat(c.value)||0)*(parseFloat(p.value)||0)).toFixed(2);
}

function cancelarEdicion(){
  var id=_detalleVentaId;if(!id)return;
  var v=null;for(var i=0;i<_ventas.length;i++){if(_ventas[i].id===id){v=_ventas[i];break;}}
  if(!v)return;
  _detalleEditando=false;renderDetalle(v);
}

// Replica el RUC editado en el detalle del movimiento a clientes_vet, que es
// donde vive el dato del cliente (no de la transacción). Sin esto, el RUC
// quedaría solo en esa fila de ventas: la ficha del cliente lo seguiría
// mostrando vacío y Registrar Visita no lo autocompletaría.
// Devuelve siempre una promesa resuelta: es un extra, no debe tumbar el guardado.
function _dvSincronizarRuc(ruc){
  if(!ruc)return Promise.resolve();
  var v=null;
  for(var i=0;i<_ventas.length;i++){if(_ventas[i].id===_detalleVentaId){v=_ventas[i];break;}}
  var vete=v&&v.veterinaria;
  if(!vete)return Promise.resolve();   // movimiento solo de doctor: no hay fila en clientes_vet
  // ilike: ventas guarda el nombre en mayúsculas y clientes_vet capitalizado.
  return sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(vete)+'&select=id')
    .then(function(filas){
      if(!filas||!filas.length)return;
      return sbU('clientes_vet',filas[0].id,{ruc:ruc});
    })
    .catch(function(e){ if(window.console)console.warn('No se pudo sincronizar el RUC en clientes_vet:',e.message); });
}

// Otras líneas de ventas que pertenecen al mismo registro (una visita con varios
// productos genera una fila por producto, todas con el mismo grupo_visita_id).
function _dvFilasGrupo(v){
  if(!v||!v.grupo_visita_id)return [];
  return _ventas.filter(function(x){return x.grupo_visita_id===v.grupo_visita_id&&x.id!==v.id;});
}

function guardarCambios(){
  var vendedor=gel('edit-vendedor')?gel('edit-vendedor').value:null;
  var fecha=gel('edit-fecha')?gel('edit-fecha').value:null;
  var producto=gel('edit-producto')?gel('edit-producto').value:null;
  var cantidad=gel('edit-cantidad')?parseFloat(gel('edit-cantidad').value):null;
  var precio=gel('edit-precio')?parseFloat(gel('edit-precio').value):null;
  var total=gel('edit-total')?parseFloat(gel('edit-total').value):null;
  var notas=gel('edit-notas')?gel('edit-notas').value.trim():null;
  var ruc=gel('edit-ruc')?gel('edit-ruc').value.trim():null;
  var _docsDv=docsSerializar('dv');
  if(!_detalleVentaId){setSt('No encontramos ese registro. Recarga la página e inténtalo otra vez.','er');return;}
  var updates={};
  // Reasignar vendedor: solo se manda si realmente cambió, para no tocar filas ajenas.
  var vendCambio=(vendedor&&String(vendedor)!==String(_detalleVendedorOrig));
  if(vendCambio)updates.vendedor_id=vendedor;
  var chkGrupo=gel('dv-vend-grupo');
  var idsGrupo=(vendCambio&&_detalleGrupoIds.length&&(!chkGrupo||chkGrupo.checked))?_detalleGrupoIds.slice():[];
  if(fecha)updates.fecha=fecha;
  if(producto)updates.producto=producto;
  if(cantidad!==null)updates.cantidad=cantidad;
  if(precio!==null)updates.precio_unitario=precio;
  if(total!==null)updates.total=total;
  if(notas!==null)updates.notas=notas||null;
  if(ruc!==null)updates.ruc=ruc||null;
  updates.tipo_documento=_docsDv.tipo;
  updates.numero_documento=_docsDv.nro;
  var btn=gel('btn-guardar');if(btn){btn.textContent='Guardando...';btn.disabled=true;}
  _dvImgUpload().then(function(imgStr){
    updates.imagen_documento=imgStr;
    return sbU('ventas',_detalleVentaId,updates);
  }).then(function(){
    // Las demás líneas del mismo registro siguen al vendedor, si se pidió.
    if(!idsGrupo.length)return null;
    return Promise.all(idsGrupo.map(function(gid){
      return sbU('ventas',gid,{vendedor_id:vendedor});
    }));
  }).then(function(){
    // El RUC no es un dato del movimiento sino del cliente: se replica a
    // clientes_vet (registro canónico) para que aparezca en la ficha del
    // cliente y se autocomplete en la próxima visita, no solo en esta fila.
    // Best-effort: si falla, el movimiento ya quedó guardado igual.
    return _dvSincronizarRuc(ruc);
  }).then(function(){return loadAll();})
  .then(function(){
    rDash();rHist();rCreditos();
    var msg=vendCambio
      ? 'Movimiento reasignado a '+getNombreVendedor(vendedor)+(idsGrupo.length?' ('+(idsGrupo.length+1)+' líneas)':'')
      : 'Cambios guardados correctamente';
    setSt(msg,'ok');setTimeout(function(){setSt('');},2500);
    cerrarModal('modal-detalle');
  }).catch(function(e){setSt(SVUI.error(e),'er');setTimeout(function(){setSt('');},5000);})
  .finally(function(){if(btn){btn.textContent='\ud83d\udcbe Guardar';btn.disabled=false;}});
}

var _detalleVentaId=null,_detalleEditando=false,_productosCache=null,_productosDisponibles=[];
// Vendedor con el que se abrió el detalle + ids de las otras líneas del mismo
// registro, para detectar la reasignación y arrastrarla a todo el movimiento.
var _detalleVendedorOrig='',_detalleGrupoIds=[];

function getLunes(base,ofs){var d=new Date(base),dia=d.getDay(),diff=dia===0?-6:1-dia;d.setDate(d.getDate()+diff+(ofs*7));d.setHours(0,0,0,0);return d;}
function semLabel(l){var v=new Date(l);v.setDate(l.getDate()+6);var f=function(d){return d.toLocaleDateString('es-PE',{day:'2-digit',month:'short'});};return f(l)+' \u2014 '+f(v);}
var _planVend='',_planOfs=0;

function rPlanes(){
  var sel=gel('plan-vend-sel');
  sel.innerHTML='<option value="">\u2014 Seleccionar vendedor \u2014</option>';
  for(var i=0;i<_vendedores.length;i++){
    var opt=document.createElement('option');opt.value=_vendedores[i].id;opt.textContent=_vendedores[i].nombre;sel.appendChild(opt);
  }
  gel('plan-contenido').innerHTML='<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-calendario"/></svg></div><strong>Elige un vendedor</strong><br>para ver su plan de la semana.</div>';
}

function cargarPlan(){
  _planVend=val('plan-vend-sel');_planOfs=0;
  if(!_planVend){gel('plan-contenido').innerHTML='<div class="es"><strong>Elige un vendedor</strong><br>arriba para ver sus datos.</div>';return;}
  mostrarPlan();
}

function mostrarPlan(){
  var lunes=getLunes(new Date(),_planOfs);
  gel('plan-label').textContent=semLabel(lunes);
  var key=lunes.toISOString().split('T')[0];
  sbG('plan_semanal','vendedor_id=eq.'+_planVend+'&semana_inicio=eq.'+key+'&order=orden.asc')
  .then(function(rows){
    if(!rows||!rows.length){gel('plan-contenido').innerHTML='<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-calendario"/></svg></div><strong>Sin plan para esta semana.</strong><br>El vendedor todavía no ha planificado sus visitas.</div>';return;}
    var html='<div class="plan-wrap"><table class="plan-table"><thead><tr><th>Hora</th><th>Lunes</th><th>Martes</th><th>Mi\u00e9rcoles</th><th>Jueves</th><th>Viernes</th><th class="opt">S\u00e1bado</th><th class="opt">Domingo</th></tr></thead><tbody>';
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      html+='<tr><td style="font-weight:600;color:var(--brand);">'+(r.hora||'')+'</td>'+
        '<td>'+(r.lunes||'')+'</td><td>'+(r.martes||'')+'</td><td>'+(r.miercoles||'')+'</td>'+
        '<td>'+(r.jueves||'')+'</td><td>'+(r.viernes||'')+'</td>'+
        '<td class="opt" style="background:#f0f4f8">'+(r.sabado||'')+'</td>'+
        '<td class="opt" style="background:#f0f4f8">'+(r.domingo||'')+'</td></tr>';
    }
    html+='</tbody></table></div>';
    gel('plan-contenido').innerHTML=html;
  }).catch(function(){gel('plan-contenido').innerHTML='<div class="es"><strong>No pudimos cargar el plan.</strong><br>Revisa la conexión y vuelve a intentarlo.</div>';});
}
function camPlan(d){_planOfs+=d;mostrarPlan();}

// Las zonas se movieron a assets/js/zonas.js: este archivo ya pasaba
// de 2400 lineas y la pagina se reescribio entera (tabla densa con
// detalle desplegable en vez de tarjetas de altura ilimitada).


// \u2500\u2500 MERCADER\u00cdA POR VENDEDOR \u2500\u2500
function rMercaderia(){
  var filtVend=gel('merch-filtro-vend')?gel('merch-filtro-vend').value:'';
  var ICONS={'BOLSA DE 150 GR':'\ud83e\uddf4','BOLSA DE 250 GR':'\ud83d\udce6','FRASCO DE 150 GR':'\ud83e\uddea','default':'\ud83d\udce6'};
  var vends=filtVend?_vendedores.filter(function(v){return String(v.id)===String(filtVend);}):_vendedores;
  var html='';
  vends.forEach(function(vend){
    var stk={},ini={};
    _movimientos.filter(function(m){return String(m.vendedor_id)===String(vend.id);}).forEach(function(m){
      stk[m.item_nombre]=(stk[m.item_nombre]||0)+m.cantidad;
      ini[m.item_nombre]=(ini[m.item_nombre]||0)+m.cantidad;
    });
    _ventas.filter(function(v){return String(v.vendedor_id)===String(vend.id)&&v.movimiento!=='Visita'&&v.estado!=='Anulado'&&v.producto;}).forEach(function(v){
      if(esDevolucion(v.movimiento)) stk[v.producto]=(stk[v.producto]||0)+Math.abs(v.cantidad||0);
      else stk[v.producto]=(stk[v.producto]||0)-(v.cantidad||0);
    });
    var keys=Object.keys(stk);
    if(!keys.length)return;
    var alertas=keys.filter(function(k){return (stk[k]||0)<=0;});
    html+='<div class="card" style="margin-bottom:1rem;"><div class="ch"><span class="ct">'+vend.nombre+'</span>'+(alertas.length?'<span style="font-size:11px;background:#fffbeb;color:#92400e;border:1px solid #fcd34d;padding:2px 8px;border-radius:12px;font-weight:600;">\u26a0 '+alertas.length+' sin stock</span>':'')+'</div><div class="cb">';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:1rem;">';
    keys.forEach(function(pk){
      var qty=Math.max(0,stk[pk]||0),icT=ini[pk]||Math.max(1,qty);
      var pct=Math.min(100,Math.round(qty/icT*100));
      var icon=ICONS[pk.toUpperCase()]||ICONS.default;
      var isZero=qty<=0;
      var barColor=isZero?'#e74c3c':pct>=60?'#2d7a3a':'#1e6e77';
      html+='<div style="background:var(--wh);border:1.5px solid '+(isZero?'#fcd34d':'var(--sky)')+';border-radius:12px;padding:1rem;text-align:center;position:relative;">';
      if(isZero)html+='<div style="position:absolute;top:8px;right:8px;background:#dc2626;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;">SIN STOCK</div>';
      html+='<div style="font-size:28px;margin-bottom:6px;">'+icon+'</div>';
      html+='<div style="font-size:11px;font-weight:700;color:var(--brand);text-transform:uppercase;margin-bottom:2px;">'+pk+'</div>';
      html+='<div style="font-size:9px;color:var(--tl);margin-bottom:8px;">Asignado por Suplevet</div>';
      html+='<div style="font-family:Bebas Neue,sans-serif;font-size:36px;color:'+(isZero?'#e74c3c':'var(--brand)')+';">'+qty+'</div>';
      html+='<div style="font-size:10px;color:var(--tl);margin-bottom:8px;">uds</div>';
      html+='<div style="background:var(--bd);border-radius:4px;height:5px;overflow:hidden;"><div style="background:'+barColor+';height:5px;width:'+pct+'%;border-radius:4px;"></div></div>';
      html+='<div style="font-size:10px;color:'+(isZero?'#e74c3c':'var(--tl)')+';margin-top:4px;">'+(isZero?'Solicitar reposici\u00f3n':pct+'% del stock inicial')+'</div>';
      html+='</div>';
    });
    html+='</div>';
    var movsVend=_movimientos.filter(function(m){return String(m.vendedor_id)===String(vend.id);}).sort(function(a,b){return (b.created_at||'').localeCompare(a.created_at||'');}).slice(0,10);
    if(movsVend.length){
      html+='<div style="font-size:11px;font-weight:700;color:var(--tm);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Movimientos recientes de stock</div>';
      var sd2={};
      html+='<div class="tw"><table><thead><tr><th>Fecha</th><th>Producto</th><th>Movimiento</th><th>Cant.</th><th>Saldo</th></tr></thead><tbody>';
      movsVend.forEach(function(m){
        var ds=m.created_at?new Date(m.created_at.split('T')[0]).toLocaleDateString('es-PE',{day:'2-digit',month:'short'}):'';
        sd2[m.item_nombre]=(sd2[m.item_nombre]||0)+m.cantidad;
        html+='<tr><td>'+ds+'</td><td>'+m.item_nombre+'</td><td><span class="b b-pagado">+Entrega</span></td><td>+'+m.cantidad+'</td><td>'+sd2[m.item_nombre]+'</td></tr>';
      });
      html+='</tbody></table></div>';
    }
    html+='</div></div>';
  });
  var cont=gel('lista-merch');
  if(cont)cont.innerHTML=html||'<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-caja"/></svg></div><strong>Sin mercadería asignada.</strong><br>Asígnale stock desde Inventario.</div>';
}


// ── NIVELES ──
// La página de Niveles se retiró del panel. Se conserva solo el dato porque
// anNivelVendedor() lo usa en analíticas, dashboard y PDFs. Ahora se carga en
// loadAll() (core.js) en vez de al abrir la página, que era la razón por la
// que el nivel salía vacío si nunca la visitabas.
// El alta, edición y borrado de niveles se hace desde Supabase.
var _niveles = [];