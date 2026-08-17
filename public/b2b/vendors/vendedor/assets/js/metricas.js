// ── MIS MÉTRICAS ──
// Todo se calcula en el navegador sobre _ventas (ya cargado para el resto
// del panel) — no hace falta ninguna consulta nueva a Supabase.
//
// Definiciones que no son obvias del nombre:
//  - "Visita" = una fila NO es una visita; una VISITA es un conjunto de filas
//    que comparten fecha + cliente (Registrar Visita puede insertar varias
//    filas de golpe: la venta, el regalo, etc., todas de la misma visita).
//    Se agrupan por (fecha, veterinaria||doctora) porque este panel no
//    guarda un grupo_visita_id como el del admin.
//  - "Visitas hasta cobrar un crédito" y "Seguimiento post-crédito" usan
//    ventas.created_at (fecha real de alta, que NO se pisa al cobrar) como
//    origen del crédito, y ventas.fecha (que SÍ se pisa a la fecha de cobro
//    cuando se cobra) como el momento del cobro.

// Este panel no tiene un esDevolucion() compartido (cada archivo lo repite
// inline) — se centraliza acá solo para este módulo.
function _metEsDevolucion(mov){return mov==='Devolucion'||mov==='Devolución';}
// "Venta realizada" = plata que YA es tuya, mismo criterio que rVentas()
// en historial.js ("Mis Ventas"): contado, delivery o cobro de crédito.
// Un "Credito a 15 dias" todavía pendiente NO cuenta acá — recién cuenta
// cuando se cobra y pasa a ser "Cobro de credito". Usar este helper en
// TODO lo que sea plata (ventas del mes, zonas, tendencia, top clientes)
// para que ninguna tarjeta se desalinee de otra.
function _metEsVentaRealizada(v){
  return (v.movimiento==='Venta al contado'||v.movimiento==='Venta delivery'||v.movimiento==='Cobro de credito') && v.estado!=='Anulado';
}

// Caché de lo último calculado, para que los clics de "ver detalle" no
// tengan que recalcular todo — solo filtran sobre lo que ya se pintó.
var _metCache={ventasMes:[],zonasMes:{},cobradosMes:[],visitasHastaDetalle:[]};

function poblarMesesMet(){
  var sel=gel('met-mes'); if(!sel) return;
  var meses=[], seen={};
  (_ventas||[]).forEach(function(v){
    if(!v.fecha) return;
    var m=v.fecha.substring(0,7);
    if(!seen[m]){seen[m]=1;meses.push(m);}
  });
  var actual=hoy().substring(0,7);
  if(!seen[actual]){meses.push(actual);}
  meses.sort().reverse();
  var nm=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var prev=sel.value;
  sel.innerHTML=meses.map(function(m){
    var p=m.split('-');
    return '<option value="'+m+'">'+nm[parseInt(p[1],10)-1]+' '+p[0]+'</option>';
  }).join('');
  sel.value = (prev && meses.indexOf(prev)>=0) ? prev : actual;
}

// Agrupa filas de ventas en "visitas" (fecha+cliente) y marca si esa visita
// incluyó algún movimiento que no sea "Visita" (es decir, si se vendió algo).
function _metAgruparVisitas(rows){
  var map={};
  rows.forEach(function(v){
    var cliente=v.veterinaria||v.doctora;
    if(!cliente||!v.fecha) return;
    var key=v.fecha+'|'+cliente.trim().toLowerCase();
    if(!map[key]) map[key]={fecha:v.fecha,cliente:cliente.trim(),zona:v.zona||'',tuvoVenta:false};
    if(v.movimiento!=='Visita' && v.movimiento!=='Solo visita' && !_metEsDevolucion(v.movimiento) && v.estado!=='Anulado'){
      map[key].tuvoVenta=true;
    }
  });
  return map;
}

function rMetricas(){
  poblarMesesMet();
  var mes = gel('met-mes') ? gel('met-mes').value : hoy().substring(0,7);
  if(!mes) mes=hoy().substring(0,7);

  var ventasMes=(_ventas||[]).filter(function(v){return v.fecha && v.fecha.indexOf(mes)===0;});
  _metCache.ventasMes=ventasMes;
  _metCache.mesLabel=gel('met-mes')?(gel('met-mes').options[gel('met-mes').selectedIndex]?gel('met-mes').options[gel('met-mes').selectedIndex].textContent:mes):mes;

  // Mes anterior, para medir crecimiento por zona.
  var p=mes.split('-'), y=parseInt(p[0],10), mo=parseInt(p[1],10)-1;
  if(mo===0){mo=12;y-=1;}
  var mesAnt=y+'-'+String(mo).padStart(2,'0');
  var ventasMesAnt=(_ventas||[]).filter(function(v){return v.fecha && v.fecha.indexOf(mesAnt)===0;});

  // ── Visitas y conversión ──
  var visitasMap=_metAgruparVisitas(ventasMes);
  var visitasArr=Object.keys(visitasMap).map(function(k){return visitasMap[k];});
  var totalVisitas=visitasArr.length;
  var visitasConVenta=visitasArr.filter(function(x){return x.tuvoVenta;}).length;
  var tasaConversion=totalVisitas>0 ? (visitasConVenta/totalVisitas*100) : 0;
  var diasSet={}; visitasArr.forEach(function(x){diasSet[x.fecha]=1;});
  var diasTrabajados=Object.keys(diasSet).length;
  var promVisitasDia=diasTrabajados>0 ? (totalVisitas/diasTrabajados) : 0;

  // ── Ventas y ticket promedio ──
  // OJO: mismo criterio que "Mis Ventas" (rVentas en historial.js) — ahí
  // "Ventas" es plata YA REALIZADA, no incluye créditos todavía pendientes
  // de cobro. Antes esta tarjeta sí los sumaba y por eso no cuadraba con
  // "Mis Ventas" (reportado: acá salía S/1300 de más, exactamente el
  // crédito abierto del mes).
  var totalVentaMes=0, transaccMes=0;
  ventasMes.forEach(function(v){
    if(_metEsVentaRealizada(v)){ totalVentaMes+=(v.total||0); transaccMes++; }
  });
  var ticketProm=transaccMes>0 ? (totalVentaMes/transaccMes) : 0;
  // Ventas diarias promedio: sobre días TRABAJADOS (no días de calendario)
  // — mismo criterio que "Prom. visitas / día", para que ambas respondan
  // "¿cómo me rinde un día que salgo a la calle?", no "¿cómo rinde el mes?".
  var ventaDiariaProm=diasTrabajados>0 ? (totalVentaMes/diasTrabajados) : 0;

  var elKpi=gel('met-kpis');
  if(elKpi){
    elKpi.innerHTML=
      '<div class="sc"><div class="sl">Total visitas</div><div class="sv sv-b">'+totalVisitas+'</div><div class="ss">'+diasTrabajados+' día'+(diasTrabajados!==1?'s':'')+' trabajado'+(diasTrabajados!==1?'s':'')+'</div></div>'+
      '<div class="sc"><div class="sl">Ventas / visitas</div><div class="sv sv-s">'+tasaConversion.toFixed(0)+'%</div><div class="ss">'+visitasConVenta+' de '+totalVisitas+' visitas vendieron algo</div></div>'+
      '<div class="sc"><div class="sl">Ventas del mes</div><div class="sv sv-b">S/ '+totalVentaMes.toFixed(2)+'</div></div>'+
      '<div class="sc"><div class="sl">Cantidad de ventas</div><div class="sv" style="color:var(--brand);">'+transaccMes+'</div><div class="ss">venta'+(transaccMes!==1?'s':'')+' este mes</div></div>'+
      '<div class="sc"><div class="sl">Ventas diarias promedio</div><div class="sv sv-o">S/ '+ventaDiariaProm.toFixed(2)+'</div><div class="ss">por día trabajado</div></div>'+
      '<div class="sc"><div class="sl">Ticket promedio</div><div class="sv sv-g">S/ '+ticketProm.toFixed(2)+'</div></div>'+
      '<div class="sc"><div class="sl">Prom. visitas / día</div><div class="sv" style="color:var(--brand);">'+promVisitasDia.toFixed(1)+'</div></div>';
  }

  metRenderZonas(ventasMes,ventasMesAnt);
  metRenderTopClientes(visitasArr,ventasMes);
  metRenderCreditos(ventasMes,mes);
  metRenderTrend();
  metRenderRiesgo();
}

// ── MODAL DE DETALLE (genérico) ──
function metAbrirDetalle(titulo,bodyHtml){
  var t=gel('met-detalle-titulo'),b=gel('met-detalle-body'),m=gel('modal-met-detalle');
  if(t)t.textContent=titulo;
  if(b)b.innerHTML=bodyHtml;
  if(m)m.classList.add('open');
}
function metCerrarDetalle(){var m=gel('modal-met-detalle');if(m)m.classList.remove('open');}

function _metTablaVentas(rows){
  if(!rows.length) return '<div class="es" style="padding:1rem;"><strong>Sin movimientos.</strong></div>';
  var ordenadas=rows.slice().sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');});
  return '<div class="tw"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Movimiento</th><th>Producto</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+
    ordenadas.map(function(v){
      return '<tr><td style="white-space:nowrap;">'+fmt(v.fecha)+'</td>'+
        '<td>'+esc(v.veterinaria||v.doctora||'---')+'</td>'+
        '<td>'+bMov(v.movimiento)+'</td>'+
        '<td>'+esc(v.producto||'---')+'</td>'+
        '<td><strong>S/ '+Number(v.total||0).toFixed(2)+'</strong></td>'+
        '<td>'+bEst(v.estado)+'</td></tr>';
    }).join('')+
  '</tbody></table></div>';
}

// ── Ventas por zona (con crecimiento vs. mes anterior) ──
function _metVentasPorZona(rows){
  var m={};
  rows.forEach(function(v){
    if(!_metEsVentaRealizada(v)) return;
    var z=v.zona||'Sin zona';
    m[z]=(m[z]||0)+(v.total||0);
  });
  return m;
}

function metRenderZonas(ventasMes,ventasMesAnt){
  var el=gel('met-zonas'); if(!el) return;
  var zonasMes=_metVentasPorZona(ventasMes), zonasAnt=_metVentasPorZona(ventasMesAnt);
  var keys=Object.keys(zonasMes).sort(function(a,b){return zonasMes[b]-zonasMes[a];});
  if(!keys.length){el.innerHTML='<div class="es" style="padding:1rem;"><strong>Sin ventas este mes.</strong></div>';return;}
  var max=Math.max.apply(null,keys.map(function(z){return zonasMes[z];}).concat([1]));
  el.innerHTML=keys.map(function(z){
    var val=zonasMes[z], ant=zonasAnt[z]||0;
    var pct=Math.max(4,Math.round(val/max*100));
    var crecTxt='', crecColor='var(--tl)';
    if(ant>0){
      var crec=(val-ant)/ant*100;
      crecTxt=(crec>=0?'+':'')+crec.toFixed(0)+'% vs mes anterior';
      crecColor=crec>=0?'var(--ok)':'var(--er)';
    }else if(val>0){
      crecTxt='Nuevo este mes'; crecColor='var(--brand)';
    }
    return '<div style="margin-bottom:.7rem;cursor:pointer;" onclick="metVerZonaDetalle(\''+z.replace(/'/g,"\\'")+'\')" title="Ver ventas de '+esc(z)+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:12.5px;margin-bottom:4px;gap:6px;">'+
        '<strong style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--brand);text-decoration:underline dotted;">'+esc(z)+'</strong>'+
        '<span style="white-space:nowrap;">S/ '+val.toFixed(2)+(crecTxt?' <span style="color:'+crecColor+';font-weight:700;">('+crecTxt+')</span>':'')+'</span>'+
      '</div>'+
      '<div style="background:var(--gry);border-radius:20px;height:8px;overflow:hidden;"><div style="width:'+pct+'%;height:100%;background:var(--sky);"></div></div>'+
    '</div>';
  }).join('');
}

function metVerZonaDetalle(zona){
  var rows=_metCache.ventasMes.filter(function(v){
    return (v.zona||'Sin zona')===zona && _metEsVentaRealizada(v);
  });
  var total=rows.reduce(function(s,v){return s+(v.total||0);},0);
  metAbrirDetalle('Ventas en '+zona+' · '+_metCache.mesLabel,
    '<div style="font-size:12px;color:var(--tl);margin-bottom:.7rem;">'+rows.length+' movimiento'+(rows.length!==1?'s':'')+' · <strong style="color:var(--brand);">S/ '+total.toFixed(2)+'</strong></div>'+
    _metTablaVentas(rows));
}

// ── Clientes más recurrentes: visitas Y ventas de cada uno ──
function metRenderTopClientes(visitasArr,ventasMes){
  var el=gel('met-top-clientes'); if(!el) return;
  var visitas={}, ventasCant={}, ventasMonto={};
  visitasArr.forEach(function(x){visitas[x.cliente]=(visitas[x.cliente]||0)+1;});
  ventasMes.forEach(function(v){
    var cliente=(v.veterinaria||v.doctora||'').trim(); if(!cliente) return;
    if(!_metEsVentaRealizada(v)) return;
    ventasCant[cliente]=(ventasCant[cliente]||0)+1;
    ventasMonto[cliente]=(ventasMonto[cliente]||0)+(v.total||0);
  });
  var top=Object.keys(visitas).sort(function(a,b){return visitas[b]-visitas[a];}).slice(0,6);
  if(!top.length){el.innerHTML='<div class="es" style="padding:1rem;"><strong>Sin visitas este mes.</strong></div>';return;}
  el.innerHTML=top.map(function(c,i){
    var nVentas=ventasCant[c]||0, monto=ventasMonto[c]||0;
    return '<div style="padding:.5rem 0;'+(i<top.length-1?'border-bottom:1px solid var(--bd);':'')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">'+
        '<span style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(i+1)+'. '+esc(c)+'</span>'+
        '<span class="b b-visita" style="flex-shrink:0;">'+visitas[c]+' visita'+(visitas[c]!==1?'s':'')+'</span>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--tl);margin-top:2px;">'+(nVentas?nVentas+' venta'+(nVentas!==1?'s':'')+' · S/ '+monto.toFixed(2):'Sin ventas este mes')+'</div>'+
    '</div>';
  }).join('');
}

// ── Créditos: dejados, cobrados, visitas hasta cobrar, seguimiento ──
function metRenderCreditos(ventasMes,mes){
  var el=gel('met-creditos-kpis'); if(!el) return;
  var todas=_ventas||[];

  // Créditos DEJADOS este mes que SIGUEN sin cobrar (en soles) — a propósito
  // distinto de "cobrados": si ya se cobró, esa plata ya está en "Ventas del
  // mes" (como Cobro de credito) y contarla acá también sería duplicarla.
  // Esto es solo lo que sigue como deuda abierta de lo que fiaste este mes.
  // Usa created_at (fecha de alta real) porque `fecha` se pisa al cobrar.
  var creditosDejadosMes=todas.filter(function(v){
    return v.movimiento==='Credito a 15 dias' && (v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido')
      && v.created_at && v.created_at.substring(0,7)===mes;
  });
  var totalDejadoMes=creditosDejadosMes.reduce(function(s,v){return s+(v.total||0);},0);
  _metCache.creditosDejadosMes=creditosDejadosMes;

  var cobradosMes=ventasMes.filter(function(v){return v.movimiento==='Cobro de credito' && v.estado==='✅ Pagado';});
  var totalCobradoMes=cobradosMes.reduce(function(s,v){return s+(v.total||0);},0);
  _metCache.cobradosMes=cobradosMes;

  // Visitas hasta cobrar: created_at (fecha de alta real, no se pisa) es el
  // origen; fecha (pisada al cobrar) es el cobro. Se cuentan los días
  // distintos en que hubo CUALQUIER movimiento con ese cliente en el rango.
  var visitasHasta=[], detalleVisitasHasta=[];
  cobradosMes.forEach(function(v){
    if(!v.created_at||!v.fecha) return;
    var origen=v.created_at.substring(0,10);
    var cliente=(v.veterinaria||v.doctora||'').trim().toLowerCase();
    if(!cliente) return;
    var dias={};
    todas.forEach(function(v2){
      var c2=(v2.veterinaria||v2.doctora||'').trim().toLowerCase();
      if(c2!==cliente || !v2.fecha) return;
      if(v2.fecha>=origen && v2.fecha<=v.fecha) dias[v2.fecha]=1;
    });
    var n=Object.keys(dias).length;
    visitasHasta.push(n);
    detalleVisitasHasta.push({cliente:v.veterinaria||v.doctora,origen:origen,cobro:v.fecha,visitas:n,monto:v.total||0});
  });
  _metCache.visitasHastaDetalle=detalleVisitasHasta;
  var promVisitasHasta=visitasHasta.length ? (visitasHasta.reduce(function(a,b){return a+b;},0)/visitasHasta.length) : 0;

  // Seguimiento: de los créditos que TODAVÍA están pendientes, ¿a cuántos les
  // hice al menos otra visita desde que los dejé? Es la pregunta accionable:
  // "¿a cuáles créditos abiertos les debo una visita de seguimiento?"
  var pendientes=todas.filter(function(v){
    return v.movimiento==='Credito a 15 dias' && (v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido') && v.created_at;
  });
  var conSeguimiento=0, sinSeguimiento=[];
  pendientes.forEach(function(v){
    var origen=v.created_at.substring(0,10);
    var cliente=(v.veterinaria||v.doctora||'').trim().toLowerCase();
    var hubo=todas.some(function(v2){
      var c2=(v2.veterinaria||v2.doctora||'').trim().toLowerCase();
      return c2===cliente && v2.id!==v.id && v2.fecha && v2.fecha>origen;
    });
    if(hubo) conSeguimiento++;
    else sinSeguimiento.push(v);
  });
  _metCache.sinSeguimiento=sinSeguimiento;
  var pctSeguimiento=pendientes.length ? (conSeguimiento/pendientes.length*100) : 0;

  el.innerHTML=
    '<div class="sc"'+(creditosDejadosMes.length?' style="cursor:pointer;" onclick="metVerCreditosDejadosDetalle()" title="Ver créditos pendientes de este mes"':'')+'><div class="sl">Créditos de este mes sin cobrar</div><div class="sv sv-o">S/ '+totalDejadoMes.toFixed(2)+'</div><div class="ss">'+creditosDejadosMes.length+' crédito'+(creditosDejadosMes.length!==1?'s':'')+' todavía pendiente'+(creditosDejadosMes.length!==1?'s':'')+'</div></div>'+
    '<div class="sc" style="cursor:pointer;" onclick="metVerCreditosCobradosDetalle()" title="Ver créditos cobrados"><div class="sl">Créditos cobrados este mes</div><div class="sv sv-g">'+cobradosMes.length+'</div><div class="ss">S/ '+totalCobradoMes.toFixed(2)+'</div></div>'+
    '<div class="sc"'+(visitasHasta.length?' style="cursor:pointer;" onclick="metVerVisitasHastaDetalle()" title="Ver detalle"':'')+'><div class="sl">Visitas hasta cobrar</div><div class="sv" style="color:var(--brand);">'+(visitasHasta.length?promVisitasHasta.toFixed(1):'—')+'</div><div class="ss">promedio, todo tu historial</div></div>'+
    '<div class="sc"'+(sinSeguimiento.length?' style="cursor:pointer;" onclick="metVerSeguimientoDetalle()" title="Ver créditos sin seguimiento"':'')+'><div class="sl">Seguimiento a créditos abiertos</div><div class="sv '+(pctSeguimiento>=70?'sv-g':pctSeguimiento>=40?'sv-w':'sv-r')+'">'+(pendientes.length?pctSeguimiento.toFixed(0)+'%':'—')+'</div><div class="ss">'+conSeguimiento+' de '+pendientes.length+' créditos pendientes con visita después</div></div>';

  metRenderCartera(todas);
}

// ── Cartera pendiente: proyección de "si cobro todo lo que me deben, a
// cuánto llegaría" — separada en vencidos / por vencer en 7 días / resto,
// porque no es lo mismo un vencido que un crédito recién dejado. Mira TODO
// el historial pendiente, no solo el mes elegido: una deuda no caduca sola.
var MET_DIAS_POR_VENCER=7;
function metRenderCartera(todas){
  var totalEl=gel('met-cartera-total'), el=gel('met-cartera-kpis');
  if(!el) return;
  var pend=todas.filter(function(v){
    return v.movimiento==='Credito a 15 dias' && (v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido');
  });
  var hoyD=new Date(hoy());
  var vencidos=[], porVencer=[], resto=[];
  pend.forEach(function(v){
    if(!v.fecha_cobro){resto.push(v);return;}
    var dias=Math.round((new Date(v.fecha_cobro)-hoyD)/86400000);
    if(v.estado==='❌ Vencido'||dias<0) vencidos.push(v);
    else if(dias<=MET_DIAS_POR_VENCER) porVencer.push(v);
    else resto.push(v);
  });
  var sum=function(rows){return rows.reduce(function(s,v){return s+(v.total||0);},0);};
  var totalPend=sum(pend);
  _metCache.carteraVencidos=vencidos;
  _metCache.carteraPorVencer=porVencer;
  _metCache.carteraResto=resto;
  if(totalEl) totalEl.textContent='S/ '+totalPend.toFixed(2);
  el.innerHTML=
    '<div class="sc"'+(vencidos.length?' style="cursor:pointer;" onclick="metVerCarteraDetalle(\'vencidos\')"':'')+'><div class="sl">Vencidos</div><div class="sv sv-r">S/ '+sum(vencidos).toFixed(2)+'</div><div class="ss">'+vencidos.length+' cliente'+(vencidos.length!==1?'s':'')+'</div></div>'+
    '<div class="sc"'+(porVencer.length?' style="cursor:pointer;" onclick="metVerCarteraDetalle(\'porVencer\')"':'')+'><div class="sl">Por vencer (7 días)</div><div class="sv sv-w">S/ '+sum(porVencer).toFixed(2)+'</div><div class="ss">'+porVencer.length+' cliente'+(porVencer.length!==1?'s':'')+'</div></div>'+
    '<div class="sc"'+(resto.length?' style="cursor:pointer;" onclick="metVerCarteraDetalle(\'resto\')"':'')+'><div class="sl">Con plazo todavía</div><div class="sv" style="color:var(--brand);">S/ '+sum(resto).toFixed(2)+'</div><div class="ss">'+resto.length+' cliente'+(resto.length!==1?'s':'')+' · vencen en más de '+MET_DIAS_POR_VENCER+' días</div></div>';
}

function metVerCarteraDetalle(grupo){
  var rows=grupo==='vencidos'?_metCache.carteraVencidos:grupo==='porVencer'?_metCache.carteraPorVencer:_metCache.carteraResto;
  var titulo=grupo==='vencidos'?'Créditos vencidos':grupo==='porVencer'?'Créditos por vencer (7 días)':'Créditos con plazo todavía (vencen en más de '+MET_DIAS_POR_VENCER+' días)';
  if(!rows||!rows.length){metAbrirDetalle(titulo,'<div class="es" style="padding:1rem;"><strong>No hay créditos en este grupo.</strong></div>');return;}
  var ordenadas=rows.slice().sort(function(a,b){return (a.fecha_cobro||'').localeCompare(b.fecha_cobro||'');});
  var html='<div class="tw"><table><thead><tr><th>Cliente</th><th>Producto</th><th>Vence</th><th>Monto</th></tr></thead><tbody>'+
    ordenadas.map(function(v){
      return '<tr><td>'+esc(v.veterinaria||v.doctora||'---')+'</td><td>'+esc(v.producto||'---')+'</td><td>'+fmt(v.fecha_cobro)+'</td><td><strong>S/ '+Number(v.total||0).toFixed(2)+'</strong></td></tr>';
    }).join('')+'</tbody></table></div>';
  metAbrirDetalle(titulo, html);
}

function metVerCreditosDejadosDetalle(){
  var rows=_metCache.creditosDejadosMes;
  metAbrirDetalle('Créditos de '+_metCache.mesLabel+' aún sin cobrar', _metTablaVentas(rows));
}

function metVerCreditosCobradosDetalle(){
  var rows=_metCache.cobradosMes;
  metAbrirDetalle('Créditos cobrados · '+_metCache.mesLabel, _metTablaVentas(rows));
}

function metVerVisitasHastaDetalle(){
  var rows=_metCache.visitasHastaDetalle;
  if(!rows.length){metAbrirDetalle('Visitas hasta cobrar','<div class="es" style="padding:1rem;"><strong>Sin créditos cobrados este mes.</strong></div>');return;}
  var html='<div class="tw"><table><thead><tr><th>Cliente</th><th>Crédito otorgado</th><th>Cobrado</th><th>Visitas</th><th>Monto</th></tr></thead><tbody>'+
    rows.map(function(r){
      return '<tr><td>'+esc(r.cliente||'---')+'</td><td>'+fmt(r.origen)+'</td><td>'+fmt(r.cobro)+'</td>'+
        '<td style="text-align:center;"><strong>'+r.visitas+'</strong></td><td>S/ '+r.monto.toFixed(2)+'</td></tr>';
    }).join('')+'</tbody></table></div>';
  metAbrirDetalle('Visitas hasta cobrar · '+_metCache.mesLabel, html);
}

function metVerSeguimientoDetalle(){
  var rows=_metCache.sinSeguimiento||[];
  if(!rows.length){metAbrirDetalle('Créditos sin seguimiento','<div class="es" style="padding:1rem;"><strong>Todos tus créditos abiertos ya tuvieron seguimiento. 🎉</strong></div>');return;}
  var html='<div style="font-size:12px;color:var(--tl);margin-bottom:.7rem;">Estos créditos siguen pendientes y no has vuelto a visitar a ese cliente desde que se los dejaste.</div>'+
    '<div class="tw"><table><thead><tr><th>Cliente</th><th>Otorgado</th><th>Monto</th><th>Días abierto</th></tr></thead><tbody>'+
    rows.map(function(v){
      var dias=Math.round((new Date(hoy())-new Date(v.created_at.substring(0,10)))/86400000);
      return '<tr><td>'+esc(v.veterinaria||v.doctora||'---')+'</td><td>'+fmt(v.created_at.substring(0,10))+'</td><td>S/ '+Number(v.total||0).toFixed(2)+'</td><td>'+dias+'</td></tr>';
    }).join('')+'</tbody></table></div>';
  metAbrirDetalle('Créditos abiertos sin seguimiento', html);
}

// ── Tendencia de ventas: desde julio del año en curso hasta el mes actual
// (no una ventana fija de 6 meses) — crece cada mes que pasa. ──
var MET_TREND_DESDE_MES=7; // Julio
function metRenderTrend(){
  var el=gel('met-trend'); if(!el) return;
  var nombresMes=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var hoyD=new Date();
  var anio=hoyD.getFullYear(), mesActual=hoyD.getMonth()+1; // 1-12
  var desde=MET_TREND_DESDE_MES>mesActual?1:MET_TREND_DESDE_MES; // si aún no llega julio, arranca en enero
  var meses=[];
  for(var m=desde;m<=mesActual;m++){
    meses.push({key:anio+'-'+String(m).padStart(2,'0'),lbl:nombresMes[m-1],total:0,esActual:m===mesActual});
  }
  var titEl=gel('met-trend-titulo');
  if(titEl)titEl.textContent='Tendencia de ventas (desde '+nombresMes[desde-1]+')';
  var byKey={}; meses.forEach(function(m){byKey[m.key]=m;});
  (_ventas||[]).forEach(function(v){
    if(!_metEsVentaRealizada(v)) return;
    var k=v.fecha?v.fecha.substring(0,7):null;
    if(k&&byKey[k]) byKey[k].total+=(v.total||0);
  });
  var max=Math.max.apply(null,meses.map(function(m){return m.total;}).concat([1]));
  var hayDatos=meses.some(function(m){return m.total>0;});
  if(!hayDatos){el.innerHTML='<div class="es" style="padding:.5rem;width:100%;"><strong>Sin ventas todavía.</strong></div>';return;}
  el.innerHTML=meses.map(function(m){
    var h=Math.max(6,Math.round((m.total/max)*100));
    return '<div class="ctb'+(m.esActual?' now':'')+'"><b>'+(m.total>0?'S/ '+m.total.toFixed(0):'')+'</b><i style="height:'+h+'%;" title="'+m.lbl+': S/ '+m.total.toFixed(2)+'"></i><span>'+m.lbl+'</span></div>';
  }).join('');
}

// ── Clientes en riesgo: recurrentes (2+ visitas en tu historial) que llevan
// 20+ días sin que los visites. Es la contracara de "clientes más
// recurrentes": a quién le debo una visita antes de que se enfríe. ──
var MET_DIAS_RIESGO=20;
function metRenderRiesgo(){
  var el=gel('met-riesgo-lista'); if(!el) return;
  var porCliente={};
  (_ventas||[]).forEach(function(v){
    var cliente=(v.veterinaria||v.doctora||'').trim(); if(!cliente||!v.fecha) return;
    var key=cliente.toLowerCase();
    if(!porCliente[key]) porCliente[key]={nombre:cliente,fechas:{}};
    porCliente[key].fechas[v.fecha]=1;
  });
  var hoyD=new Date(hoy());
  var lista=Object.keys(porCliente).map(function(k){
    var c=porCliente[k];
    var fechas=Object.keys(c.fechas).sort();
    var visitas=fechas.length;
    var ultima=fechas[fechas.length-1];
    var dias=Math.round((hoyD-new Date(ultima))/86400000);
    return {nombre:c.nombre,visitas:visitas,ultima:ultima,dias:dias};
  }).filter(function(c){return c.visitas>=2 && c.dias>=MET_DIAS_RIESGO;})
    .sort(function(a,b){return b.dias-a.dias;})
    .slice(0,8);
  if(!lista.length){
    el.innerHTML='<div class="es" style="padding:.7rem;"><strong>Ninguno — tu cartera recurrente está al día. 👍</strong></div>';
    return;
  }
  el.innerHTML=lista.map(function(c,i){
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;'+(i<lista.length-1?'border-bottom:1px solid var(--bd);':'')+'">'+
      '<div><span style="font-size:13px;font-weight:600;">'+esc(c.nombre)+'</span><div style="font-size:11px;color:var(--tl);">'+c.visitas+' visitas en tu historial · última: '+fmt(c.ultima)+'</div></div>'+
      '<span class="b b-vencido">'+c.dias+' días</span>'+
    '</div>';
  }).join('');
}
