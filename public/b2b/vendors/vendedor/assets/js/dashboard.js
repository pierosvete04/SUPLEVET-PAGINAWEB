function rDash(){
  // ── NOTIFICACIÓN DE CRÉDITOS PENDIENTES ──
  _renderCreditAlerts();

  // Nivel widget
  var _vmTotal=0,_hoy2=new Date(),_mes2=_hoy2.getMonth(),_anio2=_hoy2.getFullYear();
  for(var _vi=0;_vi<_ventas.length;_vi++){
    var _vv=_ventas[_vi],_vd=new Date(_vv.fecha||'');
    if(_vd.getMonth()===_mes2&&_vd.getFullYear()===_anio2){
      var _mt=(_vv.movimiento||'').toLowerCase();
      var _est=(_vv.estado||'').toLowerCase();
      // Ventas mes = contado + delivery + cobros de credito (pagados), excluir devoluciones y anulados
      var esVenta=(_mt.indexOf('contado')>-1||_mt.indexOf('delivery')>-1||_mt.indexOf('cobro')>-1);
      var esValido=(_est.indexOf('anulado')<0&&_est.indexOf('devuelto')<0&&_mt.indexOf('devoluci')<0&&_mt.indexOf('visita')<0);
      if(esVenta&&esValido)_vmTotal+=Number(_vv.total||0);
    }
  }
  // Nivel widget ocultado por decisión de negocio
  var _nw=gel('nivel-widget-new'); if(_nw) _nw.style.display='none';

  var now=new Date(),mes=now.getMonth(),anio=now.getFullYear();
  var vm=[];
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];var d=new Date(v.fecha);
    if(d.getMonth()===mes&&d.getFullYear()===anio&&v.movimiento!=='Devoluci\u00f3n'&&v.movimiento!=='Devolucion')vm.push(v);
  }
  var total=0,cobrado=0,pendiente=0,venc=0,nTrxVentas=0;
  // Ventas del mes actual: solo contado/delivery pagados + cobros pagados
  for(var i=0;i<vm.length;i++){
    var v=vm[i];
    var _mt=(v.movimiento||'').toLowerCase();
    var _est=(v.estado||'');
    var esContado=(_mt.indexOf('contado')>-1||_mt.indexOf('delivery')>-1);
    var esCobro=(_mt.indexOf('cobro')>-1);
    var esPagado=(_est==='\u2705 Pagado');
    if((esContado&&esPagado)||(esCobro&&esPagado)){total+=(v.total||0);nTrxVentas++;}
    if(esPagado&&_est!=='Anulado')cobrado+=(v.total||0);
  }
  // Pendientes y vencidos: de TODOS los meses (visibles aunque sea inicio de mes)
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if(v.estado==='Anulado')continue;
    if(v.estado==='\u23f3 Pendiente'||v.estado==='\u274c Vencido')pendiente+=(v.total||0);
    if(v.estado==='\u274c Vencido')venc++;
  }
  gel('dash-kpis').innerHTML=
    '<div class="kpi-card kpi-blue"><div class="kpi-icon">\ud83d\udcb0</div><div class="kpi-val">'+money(total)+'</div><div class="kpi-lbl">Ventas del mes</div><div class="kpi-sub">'+nTrxVentas+' transacciones</div></div>'+
    '<div class="kpi-card kpi-green"><div class="kpi-icon">\u2705</div><div class="kpi-val">'+money(cobrado)+'</div><div class="kpi-lbl">Total cobrado</div></div>'+
    '<div class="kpi-card kpi-orange"><div class="kpi-icon">\u23f3</div><div class="kpi-val">'+money(pendiente)+'</div><div class="kpi-lbl">Pendiente</div><div class="kpi-sub">'+venc+' vencidos</div></div>';

  // Tarjetas de operaciones del mes (clickeables)
  // Solo se cuentan transacciones PAGADAS para mantener consistencia con el KPI "Ventas del mes"
  var opsContado=0,opsDelivery=0,opsCobros=0,opsCredPend=0,opsDevol=0;
  var nContado=0,nDelivery=0,nCobros=0,nCredPend=0,nDevol=0;
  for(var i=0;i<vm.length;i++){
    var v=vm[i];
    var _est=(v.estado||'');
    var _mt=(v.movimiento||'').toLowerCase();
    if(_est==='Anulado')continue;
    var esPagado=(_est==='\u2705 Pagado');
    if(v.movimiento==='Venta al contado'&&esPagado){opsContado+=(v.total||0);nContado++;}
    else if(v.movimiento==='Venta delivery'&&esPagado){opsDelivery+=(v.total||0);nDelivery++;}
    else if(v.movimiento==='Cobro de credito'&&esPagado){opsCobros+=(v.total||0);nCobros++;}
    else if(_mt.indexOf('devoluci')>=0||_est==='\ud83d\udce6 Devuelto'){opsDevol+=Math.abs(v.total||0);nDevol++;}
  }
  // Crédito pendiente: TODOS los créditos pendientes/vencidos (no solo del mes)
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if((v.movimiento==='Credito a 15 dias'||v.movimiento==='Cr\u00e9dito a 15 d\u00edas')&&(v.estado==='\u23f3 Pendiente'||v.estado==='\u274c Vencido')){
      opsCredPend+=(v.total||0);nCredPend++;
    }
  }
  var totalVentas = opsContado + opsDelivery + opsCobros;
  var nTotalVentas = nContado + nDelivery + nCobros;
  gel('dash-ops').innerHTML=
    '<div class="ops-card ops-c-total" onclick="goTo(\'ventas\')" style="grid-column:1/-1;">'+
      '<div class="ops-arrow">\u203a</div>'+
      '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'+
        '<div class="ops-icon" style="font-size:28px;margin-bottom:0;">\ud83d\udcb5</div>'+
        '<div style="flex:1;min-width:0;">'+
          '<div class="ops-lbl">Total Ventas del Mes</div>'+
          '<div class="ops-val" style="font-size:30px;">'+money(totalVentas)+'</div>'+
          '<div class="ops-sub">'+nTotalVentas+' transacciones (contado + delivery + cobros)</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="ops-card ops-c-contado" onclick="goToVentasTab(\'Venta al contado\')">'+
      '<div class="ops-arrow">\u203a</div>'+
      '<div class="ops-icon">\ud83d\udc9a</div>'+
      '<div class="ops-lbl">Contado</div>'+
      '<div class="ops-val">'+money(opsContado)+'</div>'+
      '<div class="ops-sub">'+nContado+' venta'+(nContado!==1?'s':'')+' del mes</div>'+
    '</div>'+
    '<div class="ops-card ops-c-credito" onclick="goTo(\'creditos\')">'+
      '<div class="ops-arrow">\u203a</div>'+
      '<div class="ops-icon">\u23f3</div>'+
      '<div class="ops-lbl">Crédito pendiente</div>'+
      '<div class="ops-val">'+money(opsCredPend)+'</div>'+
      '<div class="ops-sub">'+nCredPend+' por cobrar</div>'+
    '</div>'+
    '<div class="ops-card ops-c-cobros" onclick="goToVentasTab(\'Cobro de credito\')">'+
      '<div class="ops-arrow">\u203a</div>'+
      '<div class="ops-icon">\ud83d\udcb0</div>'+
      '<div class="ops-lbl">Cobros de crédito</div>'+
      '<div class="ops-val">'+money(opsCobros)+'</div>'+
      '<div class="ops-sub">'+nCobros+' cobro'+(nCobros!==1?'s':'')+' del mes</div>'+
    '</div>'+
    '<div class="ops-card ops-c-delivery" onclick="goToVentasTab(\'Venta delivery\')">'+
      '<div class="ops-arrow">\u203a</div>'+
      '<div class="ops-icon">\ud83d\ude9a</div>'+
      '<div class="ops-lbl">Delivery</div>'+
      '<div class="ops-val">'+money(opsDelivery)+'</div>'+
      '<div class="ops-sub">'+nDelivery+' venta'+(nDelivery!==1?'s':'')+' del mes</div>'+
    '</div>'+
    '<div class="ops-card ops-c-devol" onclick="goToHistTab(\'Devolucion\')">'+
      '<div class="ops-arrow">\u203a</div>'+
      '<div class="ops-icon">\u21a9\ufe0f</div>'+
      '<div class="ops-lbl">Devoluciones</div>'+
      '<div class="ops-val">'+money(opsDevol)+'</div>'+
      '<div class="ops-sub">'+nDevol+' devolucion'+(nDevol!==1?'es':'')+' del mes</div>'+
    '</div>';

  // ── Productos vendidos del mes (dinámico, con selector de mes) ──
  rDashProds();

  // Mercaderia (mantener este card oculto si no hay items, o visible si hay)
  sbG('movimientos','vendedor_id=eq.'+CUR.id+'&tipo=eq.salida&categoria=eq.producto').then(function(movs){
    var stk={};for(var i=0;i<(movs||[]).length;i++){var m=movs[i];stk[m.item_nombre]=(stk[m.item_nombre]||0)+m.cantidad;}
    for(var i=0;i<_ventas.length;i++){var v=_ventas[i];if(v.movimiento!=='Devoluci\u00f3n'&&v.movimiento!=='Visita'&&v.estado!=='Anulado'&&v.producto)stk[v.producto]=(stk[v.producto]||0)-v.cantidad;}
    var items=[];for(var k in stk){if(stk[k]>0)items.push({n:k,c:stk[k]});}
    var el=gel('dash-merch');if(el){
      if(items.length){
        el.style.display='block';
        el.innerHTML='<div class="ch"><span class="ct">Mi Mercanc\u00eda</span></div><div class="cb" style="display:flex;gap:10px;flex-wrap:wrap;">'+
          items.map(function(it){var low=it.c<=5;return '<div style="background:'+(low?'#fffbeb':'var(--sky4)')+';border:1px solid '+(low?'#fcd34d':'var(--sky)')+';border-radius:8px;padding:.7rem 1rem;min-width:120px;text-align:center;"><div style="font-size:10px;font-weight:700;color:'+(low?'#92400e':'#1e6e77')+';text-transform:uppercase;margin-bottom:4px;">'+it.n+'</div><div style="font-family:Bebas Neue,sans-serif;font-size:30px;color:'+(low?'#d97706':'var(--brand)')+';">'+it.c+'</div><div style="font-size:10px;color:var(--tl);">uds'+(low?' BAJO STOCK':'')+' </div></div>';}).join('')+
          '</div>';
      }else{el.style.display='none';}
    }
  }).catch(function(){});
}

// ══════════════════════════════════════════════════════════════
// Variable global: mes seleccionado en la sección de productos del dashboard
// Default = mes actual (formato "YYYY-MM"). '' = todos los meses.
// ══════════════════════════════════════════════════════════════
var _dashProdMes = (typeof hoy==='function')?hoy().substring(0,7):'';

// Cambio de mes en el selector de productos
function _dashProdCambioMes(){
  var sel=gel('dash-prod-mes');
  if(sel) _dashProdMes = sel.value;
  rDashProds();
}

// Renderiza la sección "Productos vendidos" del dashboard
// con selector de mes y diseño responsive
function rDashProds(){
  var prodEl=gel('dash-prods');
  if(!prodEl)return;

  // Asegurar default si no hay valor
  if(_dashProdMes===null||_dashProdMes===undefined)_dashProdMes=hoy().substring(0,7);

  // 1) Calcular unidades vendidas según el mes seleccionado
  var prodsVendidos={};
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    // Filtro de mes (si _dashProdMes='' significa "todos los meses")
    if(_dashProdMes && (!v.fecha || v.fecha.indexOf(_dashProdMes)!==0))continue;
    var _mt=(v.movimiento||'').toLowerCase();
    var _est=(v.estado||'');
    if(_est==='Anulado')continue;
    // Solo ventas reales (excluir visitas y devoluciones)
    var esVentaReal=(_mt.indexOf('contado')>-1||_mt.indexOf('delivery')>-1||_mt.indexOf('cobro')>-1||_mt.indexOf('credito')>-1||_mt.indexOf('cr\u00e9dito')>-1);
    if(!esVentaReal)continue;
    if(!v.producto)continue;
    prodsVendidos[v.producto]=(prodsVendidos[v.producto]||0)+(parseInt(v.cantidad)||0);
  }

  // 2) Construir lista: incluir TODOS los productos de la BD aunque tengan 0 ventas
  var listaProds=[];
  var seenProds={};
  if(typeof _prods!=='undefined' && _prods && _prods.length){
    for(var i=0;i<_prods.length;i++){
      var nom=_prods[i].nombre;
      if(!nom||seenProds[nom])continue;
      seenProds[nom]=true;
      listaProds.push({nombre:nom,cantidad:prodsVendidos[nom]||0});
    }
  }
  // Incluir productos vendidos que no estén en la BD actual
  for(var pn in prodsVendidos){
    if(!seenProds[pn]){
      seenProds[pn]=true;
      listaProds.push({nombre:pn,cantidad:prodsVendidos[pn]});
    }
  }
  // Ordenar: más vendidos primero, luego alfabético
  listaProds.sort(function(a,b){
    if(b.cantidad!==a.cantidad)return b.cantidad-a.cantidad;
    return (a.nombre||'').localeCompare(b.nombre||'','es');
  });

  // 3) Construir las opciones del selector de mes
  // Recolectar todos los meses con ventas + asegurar que el mes actual aparece
  var mesesSet={};
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if(v.fecha)mesesSet[v.fecha.substring(0,7)]=true;
  }
  mesesSet[hoy().substring(0,7)]=true; // asegurar mes actual
  var meses=Object.keys(mesesSet).sort().reverse();
  var nMeses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var optionsHtml='<option value="">Todos los meses</option>';
  for(var i=0;i<meses.length;i++){
    var p=meses[i].split('-');
    var lbl=nMeses[parseInt(p[1])-1]+' '+p[0];
    optionsHtml+='<option value="'+meses[i]+'"'+(_dashProdMes===meses[i]?' selected':'')+'>'+lbl+'</option>';
  }
  // Si _dashProdMes es vacío ("Todos"), marcar el option vacío como selected
  if(!_dashProdMes){
    optionsHtml=optionsHtml.replace('<option value="">Todos los meses</option>','<option value="" selected>Todos los meses</option>');
  }

  // 4) Construir tarjetas de productos (responsive: grid auto-fit)
  var totalUds=listaProds.reduce(function(s,p){return s+p.cantidad;},0);
  var mesLbl=_dashProdMes?(function(){var p=_dashProdMes.split('-');return nMeses[parseInt(p[1])-1]+' '+p[0];})():'todos los meses';

  var cardsHtml='';
  if(listaProds.length){
    cardsHtml=listaProds.map(function(p){
      var esCero=(p.cantidad===0);
      var bgCol=esCero?'#f9fafb':'var(--sky4)';
      var bdCol=esCero?'#e5e7eb':'var(--sky)';
      var lblCol=esCero?'#9ca3af':'#1e6e77';
      var numCol=esCero?'#9ca3af':'var(--brand)';
      return '<div class="prod-vendido-card" style="background:'+bgCol+';border:1px solid '+bdCol+';border-radius:10px;padding:.9rem 1rem;text-align:center;">'+
        '<div style="font-size:10px;font-weight:700;color:'+lblCol+';text-transform:uppercase;margin-bottom:6px;letter-spacing:.4px;line-height:1.2;">'+p.nombre+'</div>'+
        '<div style="font-family:Bebas Neue,sans-serif;font-size:34px;color:'+numCol+';line-height:1;">'+p.cantidad+'</div>'+
        '<div style="font-size:10px;color:var(--tl);margin-top:2px;">'+(p.cantidad===1?'unidad':'unidades')+' vendida'+(p.cantidad===1?'':'s')+'</div>'+
      '</div>';
    }).join('');
  } else {
    cardsHtml='<div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:var(--tl);font-size:13px;">Sin productos registrados. Agrega productos en Supabase para verlos aquí.</div>';
  }

  // 5) Renderizar el card completo con selector y grid responsive
  prodEl.innerHTML=
    '<div class="card">'+
      '<div class="ch" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">'+
        '<span class="ct">\ud83d\udce6 Productos vendidos · <span style="font-family:DM Sans,sans-serif;font-weight:600;font-size:12px;color:var(--tm);text-transform:none;letter-spacing:0;">'+mesLbl+'</span></span>'+
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+
          '<span style="font-size:11px;color:var(--tl);font-weight:600;">Total: '+totalUds+' uds</span>'+
          '<select id="dash-prod-mes" onchange="_dashProdCambioMes()" style="font-size:12px;padding:.3rem .55rem;border:1px solid var(--bd);border-radius:8px;background:var(--wh);color:var(--td);min-width:140px;font-family:DM Sans,sans-serif;">'+optionsHtml+'</select>'+
        '</div>'+
      '</div>'+
      '<div class="cb prod-vendido-grid">'+cardsHtml+'</div>'+
    '</div>';
}

function loadNiveles(){
  return sbG('niveles_config','order=orden.asc').then(function(r){
    if(!r||!r.length) throw new Error('empty');
    _NIVELES=r.map(function(n){
      return {
        n: n.nombre, emoji: n.emoji||'⭐', color: n.color||'#6b7280',
        min: n.ventas_min||0, max: n.ventas_max||9e9,
        pct: n.comision_pct||0, bono: n.bono||0,
        basico: n.basico||1200, movilidad: n.movilidad||400
      };
    });
  }).catch(function(){
    // Fallback hardcoded si falla Supabase
    _NIVELES=[
      {n:'Inicial', emoji:'🔘',color:'#6b7280', min:0,    max:4999,  pct:0,bono:0,   basico:1200,movilidad:400},
      {n:'Bronce',  emoji:'🥉',color:'#cd7f32', min:5000, max:6999,  pct:3,bono:400, basico:1200,movilidad:400},
      {n:'Plata',   emoji:'🥈',color:'#9ca3af', min:7000, max:8999,  pct:4,bono:600, basico:1200,movilidad:400},
      {n:'Oro',     emoji:'🥇',color:'#f59e0b', min:9000, max:11999, pct:5,bono:800, basico:1200,movilidad:400},
      {n:'Platino', emoji:'💎',color:'#06b6d4', min:12000,max:9e9,   pct:6,bono:1000,basico:1200,movilidad:400}
    ];
  });
}
function getNivel(v){for(var i=_NIVELES.length-1;i>=0;i--){if(v>=_NIVELES[i].min)return i;}return 0;}

function renderNivelWidget(ventasMes,nombre){
  var w=gel('nivel-widget-new');if(!w)return;
  if(!_NIVELES||!_NIVELES.length){w.style.display='none';return;}
  var idx=getNivel(ventasMes),niv=_NIVELES[idx],next=_NIVELES[idx+1]||null;
  if(!niv){w.style.display='none';return;}
  var basico=niv.basico||1200,mov=niv.movilidad||400;
  var comision=ventasMes*(niv.pct/100),ingEst=basico+mov+comision+niv.bono;
  var pct=0,progMsg='';
  if(next){pct=Math.min(100,Math.round(((ventasMes-niv.min)/(next.min-niv.min))*100));progMsg='Faltan S/ '+Math.max(0,next.min-ventasMes).toLocaleString('es-PE')+' para nivel '+next.n;}
  else{pct=100;progMsg='🏆 Nivel máximo. ¡Excelente!';}
  w.style.display='block';
  w.style.borderLeft='5px solid '+(niv.color||'var(--sky)');
  w.innerHTML='<div class="nw-kicker">Mi nivel este mes</div>'+
    '<div class="nw-hello">Hola, '+nombre+'</div>'+
    '<div class="nw-nivel">'+(niv.emoji||'')+'&nbsp;'+niv.n.toUpperCase()+'</div>'+
    '<div class="nw-ventas">Ventas del mes (contado + cobros): <strong>S/ '+ventasMes.toLocaleString('es-PE')+'</strong></div>'+
    '<div class="nw-bar-wrap"><div class="nw-bar-fill" style="width:'+pct+'%"></div></div>'+
    '<div class="nw-bar-labels"><span>'+niv.n+'</span><span>'+(next?next.n:'Platino')+'</span></div>'+
    '<div class="nw-prog-msg">'+progMsg+'</div>'+
    '<div class="nw-stats">'+
    '<div><div class="nw-stat-val">S/ '+Math.round(ingEst).toLocaleString('es-PE')+'</div><div class="nw-stat-lbl">Ingreso est.</div></div>'+
    '<div><div class="nw-stat-val">'+niv.pct+'%</div><div class="nw-stat-lbl">Comisión</div></div>'+
    '<div><div class="nw-stat-val">S/ '+niv.bono.toLocaleString('es-PE')+'</div><div class="nw-stat-lbl">Bono</div></div>'+
    '</div>';
}

// ===== SUMMARY UPDATER =====