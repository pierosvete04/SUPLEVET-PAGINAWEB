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
  var totalVentaMes=0, transaccMes=0;
  ventasMes.forEach(function(v){
    if(!_metEsDevolucion(v.movimiento) && v.estado!=='Anulado' && v.movimiento!=='Visita' && v.movimiento!=='Solo visita'){
      totalVentaMes+=(v.total||0); transaccMes++;
    }
  });
  var ticketProm=transaccMes>0 ? (totalVentaMes/transaccMes) : 0;

  var elKpi=gel('met-kpis');
  if(elKpi){
    elKpi.innerHTML=
      '<div class="sc"><div class="sl">Total visitas</div><div class="sv sv-b">'+totalVisitas+'</div><div class="ss">'+diasTrabajados+' día'+(diasTrabajados!==1?'s':'')+' trabajado'+(diasTrabajados!==1?'s':'')+'</div></div>'+
      '<div class="sc"><div class="sl">Ventas / visitas</div><div class="sv sv-s">'+tasaConversion.toFixed(0)+'%</div><div class="ss">'+visitasConVenta+' de '+totalVisitas+' visitas vendieron algo</div></div>'+
      '<div class="sc"><div class="sl">Ventas del mes</div><div class="sv sv-b">S/ '+totalVentaMes.toFixed(2)+'</div></div>'+
      '<div class="sc"><div class="sl">Ticket promedio</div><div class="sv sv-g">S/ '+ticketProm.toFixed(2)+'</div></div>'+
      '<div class="sc"><div class="sl">Prom. visitas / día</div><div class="sv" style="color:var(--brand);">'+promVisitasDia.toFixed(1)+'</div></div>';
  }

  metRenderZonas(ventasMes,ventasMesAnt);
  metRenderTopClientes(visitasArr);
  metRenderCreditos(ventasMes);
  metRenderTrend();
}

// Suma vendida por zona (ventas reales, no visitas) para poder comparar
// contra el mes anterior — "creciendo" o "cayendo" en cada zona.
function _metVentasPorZona(rows){
  var m={};
  rows.forEach(function(v){
    if(_metEsDevolucion(v.movimiento)||v.estado==='Anulado'||v.movimiento==='Visita'||v.movimiento==='Solo visita') return;
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
    return '<div style="margin-bottom:.7rem;">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:12.5px;margin-bottom:4px;gap:6px;">'+
        '<strong style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+esc(z)+'</strong>'+
        '<span style="white-space:nowrap;">S/ '+val.toFixed(2)+(crecTxt?' <span style="color:'+crecColor+';font-weight:700;">('+crecTxt+')</span>':'')+'</span>'+
      '</div>'+
      '<div style="background:var(--gry);border-radius:20px;height:8px;overflow:hidden;"><div style="width:'+pct+'%;height:100%;background:var(--sky);"></div></div>'+
    '</div>';
  }).join('');
}

function metRenderTopClientes(visitasArr){
  var el=gel('met-top-clientes'); if(!el) return;
  var conteo={};
  visitasArr.forEach(function(x){conteo[x.cliente]=(conteo[x.cliente]||0)+1;});
  var top=Object.keys(conteo).sort(function(a,b){return conteo[b]-conteo[a];}).slice(0,6);
  if(!top.length){el.innerHTML='<div class="es" style="padding:1rem;"><strong>Sin visitas este mes.</strong></div>';return;}
  el.innerHTML=top.map(function(c,i){
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:.5rem 0;'+(i<top.length-1?'border-bottom:1px solid var(--bd);':'')+'">'+
      '<span style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px;">'+(i+1)+'. '+esc(c)+'</span>'+
      '<span class="b b-visita" style="flex-shrink:0;">'+conteo[c]+' visita'+(conteo[c]!==1?'s':'')+'</span>'+
    '</div>';
  }).join('');
}

// Créditos cobrados ESTE mes (movimiento ya pasó a "Cobro de credito", con
// fecha pisada a la fecha real del cobro). "Visitas hasta cobrar" y
// "Seguimiento" miran el historial completo, no solo el mes — un crédito
// dejado hace 2 meses y cobrado ahora igual cuenta para "cuántas visitas
// tardó", y un crédito pendiente de hace tiempo igual cuenta para
// "¿le hice seguimiento?".
function metRenderCreditos(ventasMes){
  var el=gel('met-creditos-kpis'); if(!el) return;
  var todas=_ventas||[];

  var cobradosMes=ventasMes.filter(function(v){return v.movimiento==='Cobro de credito' && v.estado==='✅ Pagado';});
  var totalCobradoMes=cobradosMes.reduce(function(s,v){return s+(v.total||0);},0);

  // Visitas hasta cobrar: created_at (fecha de alta real, no se pisa) es el
  // origen; fecha (pisada al cobrar) es el cobro. Se cuentan los días
  // distintos en que hubo CUALQUIER movimiento con ese cliente en el rango.
  var visitasHasta=[];
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
    visitasHasta.push(Object.keys(dias).length);
  });
  var promVisitasHasta=visitasHasta.length ? (visitasHasta.reduce(function(a,b){return a+b;},0)/visitasHasta.length) : 0;

  // Seguimiento: de los créditos que TODAVÍA están pendientes, ¿a cuántos les
  // hice al menos otra visita desde que los dejé? Es la pregunta accionable:
  // "¿a cuáles créditos abiertos les debo una visita de seguimiento?"
  var pendientes=todas.filter(function(v){
    return v.movimiento==='Credito a 15 dias' && (v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido') && v.created_at;
  });
  var conSeguimiento=0;
  pendientes.forEach(function(v){
    var origen=v.created_at.substring(0,10);
    var cliente=(v.veterinaria||v.doctora||'').trim().toLowerCase();
    var hubo=todas.some(function(v2){
      var c2=(v2.veterinaria||v2.doctora||'').trim().toLowerCase();
      return c2===cliente && v2.id!==v.id && v2.fecha && v2.fecha>origen;
    });
    if(hubo) conSeguimiento++;
  });
  var pctSeguimiento=pendientes.length ? (conSeguimiento/pendientes.length*100) : 0;

  el.innerHTML=
    '<div class="sc"><div class="sl">Créditos cobrados este mes</div><div class="sv sv-g">'+cobradosMes.length+'</div><div class="ss">S/ '+totalCobradoMes.toFixed(2)+'</div></div>'+
    '<div class="sc"><div class="sl">Visitas hasta cobrar</div><div class="sv" style="color:var(--brand);">'+(visitasHasta.length?promVisitasHasta.toFixed(1):'—')+'</div><div class="ss">promedio, todo tu historial</div></div>'+
    '<div class="sc"><div class="sl">Seguimiento a créditos abiertos</div><div class="sv '+(pctSeguimiento>=70?'sv-g':pctSeguimiento>=40?'sv-w':'sv-r')+'">'+(pendientes.length?pctSeguimiento.toFixed(0)+'%':'—')+'</div><div class="ss">'+conSeguimiento+' de '+pendientes.length+' créditos pendientes con visita después</div></div>';
}

// Tendencia de ventas de los últimos 6 meses — mismo patrón visual que la
// ficha de cliente (cliRenderTrend en clientes.js), sobre TODAS tus ventas.
function metRenderTrend(){
  var el=gel('met-trend'); if(!el) return;
  var nombresMes=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var hoyD=new Date();
  var meses=[];
  for(var i=5;i>=0;i--){
    var d=new Date(hoyD.getFullYear(),hoyD.getMonth()-i,1);
    meses.push({key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),lbl:nombresMes[d.getMonth()],total:0,esActual:i===0});
  }
  var byKey={}; meses.forEach(function(m){byKey[m.key]=m;});
  (_ventas||[]).forEach(function(v){
    if(_metEsDevolucion(v.movimiento)||v.estado==='Anulado'||v.movimiento==='Visita'||v.movimiento==='Solo visita') return;
    var k=v.fecha?v.fecha.substring(0,7):null;
    if(k&&byKey[k]) byKey[k].total+=(v.total||0);
  });
  var max=Math.max.apply(null,meses.map(function(m){return m.total;}).concat([1]));
  var hayDatos=meses.some(function(m){return m.total>0;});
  if(!hayDatos){el.innerHTML='<div class="es" style="padding:.5rem;width:100%;"><strong>Sin ventas en los últimos 6 meses.</strong></div>';return;}
  el.innerHTML=meses.map(function(m){
    var h=Math.max(6,Math.round((m.total/max)*100));
    return '<div class="ctb'+(m.esActual?' now':'')+'"><b>'+(m.total>0?'S/ '+m.total.toFixed(0):'')+'</b><i style="height:'+h+'%;" title="'+m.lbl+': S/ '+m.total.toFixed(2)+'"></i><span>'+m.lbl+'</span></div>';
  }).join('');
}
