// ══════════════════════════════════════════════════════════════
// ANALÍTICAS: vistas General, Comparativo, Detallado + PDF + PWA
// ══════════════════════════════════════════════════════════════

// ══ ANALÍTICAS ══
var _anChartMeses = null;
var _anChartZonas = null;
var _anChartEvolucion = null;
var _anChartCat = null;
var _anPeriodos = null; // se inicializa la primera vez en rAnaliticas
var _anEvolRangoTouched = false; // si el usuario tocó desde/hasta, no autocambiar
var _anView = 'gen'; // gen | comp | det

// Muestra mensaje sobre un canvas sin destruirlo (para poder volver a renderizar el chart luego)
function anChartEmpty(canvas, msg){
  if(!canvas) return;
  var parent = canvas.parentElement;
  if(!parent) return;
  // Asegurar contenedor relativo
  if(parent.style.position !== 'relative') parent.style.position = 'relative';
  // Limpiar el canvas (por si tenía un chart anterior)
  var ctx = canvas.getContext && canvas.getContext('2d');
  if(ctx) ctx.clearRect(0,0,canvas.width,canvas.height);
  // Crear/actualizar overlay (NO toca el canvas)
  var overlayId = canvas.id+'-empty';
  var overlay = document.getElementById(overlayId);
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--tl);font-size:13px;padding:1rem;pointer-events:none;';
    parent.appendChild(overlay);
  }
  overlay.textContent = msg || 'Sin datos';
  overlay.style.display = 'flex';
}
function anChartShowCanvas(canvas){
  if(!canvas) return;
  var overlay = document.getElementById(canvas.id+'-empty');
  if(overlay) overlay.style.display = 'none';
}

function anSetView(v){
  _anView = v;
  var vs=['gen','comp','det','cat'];
  vs.forEach(function(x){
    var tab = gel('an-view-tab-'+x);
    if(tab){ tab.classList.remove('btn-p'); tab.classList.remove('btn-s'); tab.classList.add(x===v?'btn-p':'btn-s'); }
    var pane = gel('an-view-'+x);
    if(pane) pane.style.display = (x===v?'block':'none');
  });
  rAnaliticas();
}

function anAnioMesActual(){
  var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}
function anAnioMesPrev(){
  var d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-1);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}
function anInitPeriodos(){
  if(!_anPeriodos){ _anPeriodos=[anAnioMesPrev(), anAnioMesActual()]; }
  if(_anPeriodos.length<2) _anPeriodos.push(anAnioMesActual());
}
function anRenderPeriodosUI(){
  var cont=gel('an-periodos-row'); if(!cont) return;
  var letras=['A','B','C','D','E','F','G','H'];
  var html='';
  _anPeriodos.forEach(function(per,i){
    var letra=letras[i]||('P'+(i+1));
    var tag=(i===0?'(base)':'(comparar)');
    var canRemove=_anPeriodos.length>2;
    html+='<div class="fgr" style="min-width:140px;position:relative;">'+
      '<label>Período '+letra+' <span style="font-size:10px;color:var(--tl)">'+tag+'</span></label>'+
      '<div style="display:flex;gap:4px;align-items:center;">'+
        '<input type="month" data-idx="'+i+'" value="'+esc(per)+'" onchange="anCambiarPeriodo('+i+',this.value)" style="padding:.46rem .7rem;border:1.5px solid var(--bd);border-radius:var(--r);font-size:13px;flex:1;"/>'+
        (canRemove?'<button class="btn btn-d btn-sm" onclick="anRemovePeriodo('+i+')" title="Eliminar" style="padding:.3rem .5rem;">✕</button>':'')+
      '</div>'+
    '</div>';
  });
  cont.innerHTML=html;
}
function anCambiarPeriodo(idx, val){ _anPeriodos[idx]=val||anAnioMesActual(); rAnaliticas(); }
function anAddPeriodo(){
  if(!_anPeriodos) anInitPeriodos();
  if(_anPeriodos.length>=8){ setSt('Máximo 8 períodos','er'); return; }
  // Sugerir un mes anterior al primero
  var prim=_anPeriodos[0]; var p=anParseMes(prim);
  var d=new Date(p.y, p.m-1, 1);
  var sug=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  // Si ya existe, ofrecer el mes actual
  if(_anPeriodos.indexOf(sug)>=0) sug=anAnioMesActual();
  _anPeriodos.push(sug); rAnaliticas();
}
function anRemovePeriodo(idx){
  if(!_anPeriodos||_anPeriodos.length<=2){ setSt('Mínimo 2 períodos','er'); return; }
  _anPeriodos.splice(idx,1); rAnaliticas();
}
function anResetEvolRango(){
  _anEvolRangoTouched=false;
  var ed=gel('an-evol-desde'), eh=gel('an-evol-hasta');
  if(ed) ed.value=''; if(eh) eh.value='';
  rAnaliticas();
}

// ── Helpers globales (usados por rAnaliticas y rRentabilidadVend) ──
function anParseMes(m){ var p=m.split('-'); return {y:parseInt(p[0]),m:parseInt(p[1])-1}; }
function anLabelMes(m){
  var ns=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var p=m.split('-'); return ns[parseInt(p[1])-1]+' '+p[0];
}
function anDelta(a,b){
  if(a===0&&b===0) return 0; if(a===0) return 100;
  return Math.round((b-a)/a*100);
}
function anDeltaHtml(d){
  if(d>0) return '<span class="an-delta an-delta-up">▲ '+d+'%</span>';
  if(d<0) return '<span class="an-delta an-delta-down">▼ '+Math.abs(d)+'%</span>';
  return '<span class="an-delta an-delta-flat">— igual</span>';
}
function anSumTotal(arr){ return arr.reduce(function(s,v){return s+(v.total||0);},0); }

// ── REGLA UNICA DE INGRESO ──
// Cada bloque de este archivo reescribia a mano "que cuenta como
// ingreso". Coincidian en lo esencial (contado + delivery + cobros,
// solo pagados) pero solo la evolucion mensual restaba las
// devoluciones, asi que un mismo mes salia con dos cifras distintas
// segun el panel que lo mostrara, ambas rotuladas "Ingresos".
// Ahora la regla vive aqui y la usan todos.
//
// Un credito NO suma al otorgarlo: al cobrarlo, la propia fila pasa a
// movimiento 'Cobro de credito' (ver marcarPagado en dashboard.js), asi
// que contar cobros no duplica nada.
function anEsIngreso(v){
  if(!v || v.estado!=='✅ Pagado') return false;
  var n=movNorm(v.movimiento);
  return n==='venta al contado' || n==='venta delivery' || n==='cobro de credito';
}

function anEsDevolucion(v){
  return !!v && v.estado!=='Anulado' && esDevolucion(v.movimiento);
}

// Ingreso neto: lo cobrado menos lo devuelto. El dinero que vuelve al
// cliente no es ingreso, y sin restarlo el panel premia a quien mas
// devoluciones acumula.
function anIngresoNeto(arr){
  var bruto=0, dev=0;
  (arr||[]).forEach(function(v){
    if(anEsIngreso(v)) bruto += Number(v.total||0);
    else if(anEsDevolucion(v)) dev += Math.abs(Number(v.total||0));
  });
  return Math.max(0, bruto - dev);
}
function anVentasRealesDe(periodo, vendId){
  var p=anParseMes(periodo);
  return _ventas.filter(function(v){
    var d=new Date(v.fecha); var mt=(v.movimiento||'').toLowerCase();
    var ok=v.estado==='✅ Pagado'&&d.getFullYear()===p.y&&d.getMonth()===p.m&&
           (mt.indexOf('contado')>-1||mt.indexOf('delivery')>-1||mt.indexOf('cobro')>-1);
    if(vendId) ok=ok&&String(v.vendedor_id)===String(vendId);
    return ok;
  });
}
function anDevolDe(periodo, vendId){
  var p=anParseMes(periodo);
  return _ventas.filter(function(v){
    var d=new Date(v.fecha); var mt=(v.movimiento||'').toLowerCase();
    var ok=(mt==='devolucion'||mt==='devolución')&&v.estado!=='Anulado'&&
           d.getFullYear()===p.y&&d.getMonth()===p.m;
    if(vendId) ok=ok&&String(v.vendedor_id)===String(vendId);
    return ok;
  });
}
function anCarteraDe(periodo, vendId){
  var p=anParseMes(periodo);
  return _ventas.filter(function(v){
    var d=new Date(v.fecha); var mt=(v.movimiento||'').toLowerCase();
    var ok=(mt.indexOf('credito')>-1||mt.indexOf('crédito')>-1)&&
           (v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido')&&
           d.getFullYear()===p.y&&d.getMonth()===p.m;
    if(vendId) ok=ok&&String(v.vendedor_id)===String(vendId);
    return ok;
  });
}
// Créditos pendientes/vencidos totales — sin filtro de fecha
function anCreditosTotales(vendId){
  return _ventas.filter(function(v){
    var mt=(v.movimiento||'').toLowerCase();
    var ok=(mt.indexOf('credito')>-1||mt.indexOf('crédito')>-1)&&
           (v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido');
    if(vendId) ok=ok&&String(v.vendedor_id)===String(vendId);
    return ok;
  });
}
function anVisitasDe(periodo, vendId){
  var p=anParseMes(periodo);
  return _ventas.filter(function(v){
    var d=new Date(v.fecha);
    var ok=d.getFullYear()===p.y&&d.getMonth()===p.m&&v.movimiento==='Visita';
    if(vendId) ok=ok&&String(v.vendedor_id)===String(vendId);
    return ok;
  });
}
function anIngresoDe(periodo, vendId){
  return Math.max(0, anSumTotal(anVentasRealesDe(periodo,vendId))-anSumTotal(anDevolDe(periodo,vendId)));
}

// ── Helpers: visitas, distritos, nuevas vetes ─────────────────
// Primer mes con actividad (YYYY-MM) — null si no hay nada
function anPrimerMesActividad(vendId){
  var min=null;
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if(vendId && String(v.vendedor_id)!==String(vendId)) continue;
    if(!v.fecha) continue;
    var ym=String(v.fecha).substring(0,7);
    if(!min || ym<min) min=ym;
  }
  return min;
}

// Devuelve la lista de meses YYYY-MM entre dos (inclusive)
function anRangoMeses(desde, hasta){
  if(!desde||!hasta) return [];
  var pa=anParseMes(desde), pb=anParseMes(hasta);
  var out=[]; var y=pa.y, m=pa.m;
  while(y<pb.y || (y===pb.y && m<=pb.m)){
    out.push(y+'-'+String(m+1).padStart(2,'0'));
    m++; if(m>11){m=0;y++;}
    if(out.length>120) break; // tope de seguridad: 10 años
  }
  return out;
}

// Normaliza un nombre de zona: trim + Title Case + colapsa espacios
function normZona(s){
  if(!s) return '';
  return String(s).trim().replace(/\s+/g,' ').toLowerCase().replace(/(^|\s)([a-záéíóúñ])/g, function(_,sp,ch){return sp+ch.toUpperCase();});
}

// Visitas únicas por grupo_visita_id en el periodo (cada grupo = 1 visita)
function anVisitasUnicas(periodo, vendId){
  var p=anParseMes(periodo);
  var grupos={};
  _ventas.forEach(function(v){
    if(!v.fecha) return;
    var d=new Date(v.fecha);
    if(d.getFullYear()!==p.y||d.getMonth()!==p.m) return;
    if(vendId && String(v.vendedor_id)!==String(vendId)) return;
    if(v.estado==='Anulado') return;
    var gid=v.grupo_visita_id||('solo_'+v.id);
    var zonaN=normZona(v.zona||'');
    if(!grupos[gid]) grupos[gid]={id:gid,vendedor_id:v.vendedor_id,veterinaria:v.veterinaria||'',doctora:v.doctora||'',zona:zonaN,fecha:v.fecha,movimientos:[],total:0};
    grupos[gid].movimientos.push(v);
    if(!esDevolucion(v.movimiento)) grupos[gid].total+=(v.total||0);
    if(!grupos[gid].veterinaria && v.veterinaria) grupos[gid].veterinaria=v.veterinaria;
    if(!grupos[gid].zona && zonaN) grupos[gid].zona=zonaN;
  });
  return Object.keys(grupos).map(function(k){return grupos[k];});
}

// Clasifica un grupo según los tipos de movimiento que contiene
function anClasificaGrupo(grupo){
  var tipos={contado:false,delivery:false,credito:false,cobro:false,devolucion:false,visita:false};
  grupo.movimientos.forEach(function(m){
    var n=movNorm(m.movimiento);
    if(n==='venta al contado') tipos.contado=true;
    else if(n==='venta delivery') tipos.delivery=true;
    else if(esCredito15(m.movimiento)) tipos.credito=true;
    else if(n==='cobro de credito') tipos.cobro=true;
    else if(esDevolucion(m.movimiento)) tipos.devolucion=true;
    else if(n==='visita'||n==='solo visita') tipos.visita=true;
  });
  tipos.conVenta = tipos.contado||tipos.delivery||tipos.cobro;
  tipos.soloVisita = tipos.visita && !tipos.conVenta && !tipos.credito;
  return tipos;
}

// Veterinarias visitadas por primera vez en el período (filtradas por vendedor opcional)
function anNuevasVetes(periodo, vendId){
  var p=anParseMes(periodo);
  var primeras={}; // vet -> YYYY-MM
  _ventas.forEach(function(v){
    if(!v.veterinaria||!v.fecha) return;
    if(vendId && String(v.vendedor_id)!==String(vendId)) return;
    var ym=String(v.fecha).substring(0,7);
    if(!primeras[v.veterinaria] || ym<primeras[v.veterinaria]) primeras[v.veterinaria]=ym;
  });
  var perStr=periodo;
  var out=[];
  Object.keys(primeras).forEach(function(vet){if(primeras[vet]===perStr) out.push(vet);});
  return out;
}

// Clientes inactivos: vetes que compraron antes pero llevan N+ días sin actividad
// Devuelve [{vet,ultimaFecha,diasInactivo,totalHistorico,nVisitas,motivo,creditosPend,creditoMonto}]
function anClientesInactivos(vendId, diasUmbral){
  var hoy = new Date();
  var ymHoy = hoy.getFullYear()+'-'+String(hoy.getMonth()+1).padStart(2,'0');
  // Recorrer todas las ventas para construir histórico por vet
  var vetes = {};
  _ventas.forEach(function(v){
    if(!v.veterinaria||!v.fecha) return;
    if(vendId && String(v.vendedor_id)!==String(vendId)) return;
    if(v.estado==='Anulado') return;
    var vet=v.veterinaria;
    if(!vetes[vet]) vetes[vet]={vet:vet, ultimaFecha:null, primeraFecha:null, totalHistorico:0, nMovs:0, zona:'', doctora:'', vendedor_id:'', creditosPend:0, creditoMonto:0, ultimaCompra:null, soloVisitasRecientes:false};
    var r=vetes[vet];
    if(!r.ultimaFecha || v.fecha>r.ultimaFecha) r.ultimaFecha=v.fecha;
    if(!r.primeraFecha || v.fecha<r.primeraFecha) r.primeraFecha=v.fecha;
    if(!esDevolucion(v.movimiento)) r.totalHistorico += (v.total||0);
    r.nMovs++;
    if(v.zona && (!r.ultimaFecha||v.fecha>=r.ultimaFecha)) r.zona=v.zona;
    if(v.doctora) r.doctora=v.doctora;
    if(v.vendedor_id) r.vendedor_id=v.vendedor_id;
    var n=movNorm(v.movimiento);
    // Última "compra" = no visita
    if(n!=='visita' && n!=='solo visita'){
      if(!r.ultimaCompra || v.fecha>r.ultimaCompra) r.ultimaCompra=v.fecha;
    }
    // Crédito pendiente
    if(esCredito15(v.movimiento) && (v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido')){
      r.creditosPend++;
      r.creditoMonto+=(v.total||0);
    }
  });
  var arr = Object.keys(vetes).map(function(k){return vetes[k];});
  var out=[];
  arr.forEach(function(r){
    if(!r.ultimaFecha) return;
    r.diasInactivo = diasDesde(r.ultimaFecha);
    if(r.diasInactivo < diasUmbral) return; // todavía activo
    // Diagnosticar motivo
    var motivo='Sin actividad reciente';
    if(r.creditosPend>0 && r.creditoMonto>0){
      motivo='Crédito pendiente sin cobrar — '+money(r.creditoMonto);
    } else if(!r.ultimaCompra){
      motivo='Sólo se le hicieron visitas, nunca compró';
    } else if(r.ultimaCompra && r.ultimaFecha>r.ultimaCompra){
      // Hubo visitas después de la última compra
      motivo='Se visitó pero dejó de comprar';
    } else if(r.diasInactivo>=120){
      motivo='Cliente perdido (más de 4 meses)';
    } else if(r.diasInactivo>=60){
      motivo='Cliente en riesgo (más de 2 meses)';
    }
    r.motivo=motivo;
    out.push(r);
  });
  // Ordenar: mayor monto histórico primero (clientes más valiosos en riesgo)
  out.sort(function(a,b){return b.totalHistorico-a.totalHistorico;});
  return out;
}

// Datos unificados por zona: visitas + ventas + créditos pendientes + cobros
// Si vendId está seteado, solo se muestran las zonas asignadas a ese vendedor (o las que hayan tenido actividad)
function anTableroUnificadoPorZona(periodo, vendId){
  var grupos = anVisitasUnicas(periodo, vendId);
  // Iniciar con zonas relevantes (claves normalizadas)
  var map = {};
  var zonasPermitidas = null;
  if(vendId){
    var vend = _vendedores.filter(function(v){return String(v.id)===String(vendId);})[0];
    if(vend && vend.zonas_asignadas && vend.zonas_asignadas.length){
      zonasPermitidas = {};
      vend.zonas_asignadas.forEach(function(z){ zonasPermitidas[normZona(z)]=1; });
    }
  }
  _zonas.forEach(function(z){
    if(!z.nombre) return;
    var n=normZona(z.nombre);
    if(zonasPermitidas && !zonasPermitidas[n]) return; // saltar zonas no asignadas
    if(!map[n]) map[n]={zona:n,visitas:0,vetsVisitadas:{},contado:0,delivery:0,cobros:0,creditosOtorgados:0,creditosOtorMonto:0,creditosPendActivos:0,creditosPendMonto:0,ingreso:0,devoluciones:0};
  });
  function ensureZona(zRaw){
    var z = normZona(zRaw) || '(sin zona)';
    if(zonasPermitidas && !zonasPermitidas[z]) return null;
    if(!map[z]) map[z]={zona:z,visitas:0,vetsVisitadas:{},contado:0,delivery:0,cobros:0,creditosOtorgados:0,creditosOtorMonto:0,creditosPendActivos:0,creditosPendMonto:0,ingreso:0,devoluciones:0};
    return map[z];
  }
  grupos.forEach(function(g){
    var r = ensureZona(g.zona); if(!r) return;
    r.visitas++;
    if(g.veterinaria) r.vetsVisitadas[g.veterinaria]=1;
  });
  // Recorrer ventas del periodo para sumar montos
  var p=anParseMes(periodo);
  _ventas.forEach(function(v){
    if(!v.fecha) return;
    var d=new Date(v.fecha);
    if(d.getFullYear()!==p.y||d.getMonth()!==p.m) return;
    if(vendId && String(v.vendedor_id)!==String(vendId)) return;
    if(v.estado==='Anulado') return;
    var r = ensureZona(v.zona); if(!r) return;
    var n=movNorm(v.movimiento);
    if(n==='venta al contado' && v.estado==='✅ Pagado'){ r.contado+=(v.total||0); r.ingreso+=(v.total||0); }
    else if(n==='venta delivery' && v.estado==='✅ Pagado'){ r.delivery+=(v.total||0); r.ingreso+=(v.total||0); }
    else if(n==='cobro de credito' && v.estado==='✅ Pagado'){ r.cobros+=(v.total||0); r.ingreso+=(v.total||0); }
    else if(esCredito15(v.movimiento)){ r.creditosOtorgados++; r.creditosOtorMonto+=(v.total||0); }
    else if(esDevolucion(v.movimiento)){
      r.devoluciones+=Math.abs(v.total||0);
      r.ingreso-=Math.abs(v.total||0);
    }
  });
  // Créditos pendientes ACTIVOS (sin filtro de fecha) por zona
  _ventas.forEach(function(v){
    if(!esCredito15(v.movimiento)) return;
    if(v.estado!=='⏳ Pendiente' && v.estado!=='❌ Vencido') return;
    if(vendId && String(v.vendedor_id)!==String(vendId)) return;
    var r = ensureZona(v.zona); if(!r) return;
    r.creditosPendActivos++;
    r.creditosPendMonto+=(v.total||0);
  });
  var arr = Object.keys(map).map(function(k){
    var r=map[k];
    r.vetsCount=Object.keys(r.vetsVisitadas).length;
    return r;
  });
  // Ordenar por ingreso (mayor primero)
  arr.sort(function(a,b){return b.ingreso-a.ingreso;});
  return arr;
}

// Visitas agrupadas por distrito (zona) en el periodo
// Ingreso = SOLO ventas pagadas (contado + delivery + cobro), no incluye créditos creados
function anVisitasPorDistrito(periodo, vendId){
  var grupos=anVisitasUnicas(periodo, vendId);
  var map={};
  grupos.forEach(function(g){
    var z=normZona(g.zona)||'(sin zona)';
    if(!map[z]) map[z]={zona:z,total:0,conVenta:0,soloVisita:0,credito:0,cobro:0,ingreso:0,detalle:[]};
    map[z].total++;
    var c=anClasificaGrupo(g);
    if(c.conVenta) map[z].conVenta++;
    if(c.soloVisita) map[z].soloVisita++;
    if(c.credito) map[z].credito++;
    if(c.cobro) map[z].cobro++;
    // Ingreso real: solo movimientos pagados de venta/cobro, no créditos creados ni visitas
    g.movimientos.forEach(function(m){
      if(m.estado!=='✅ Pagado') return;
      var n=movNorm(m.movimiento);
      if(n==='venta al contado'||n==='venta delivery'||n==='cobro de credito'){
        map[z].ingreso += (m.total||0);
      }
    });
    map[z].detalle.push(g);
  });
  return Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return b.total-a.total;});
}

function rAnaliticas(){
  // Poblar selectores (siempre)
  _vendedores.forEach(function(){}); // no-op, los renderers pueblan
  // Vendedor en Comparativo
  var sel = gel('an-vendedor');
  var cur = sel ? sel.value : '';
  if(sel){
    sel.innerHTML = '<option value="">Todos los vendedores</option>';
    _vendedores.forEach(function(v){
      var o=document.createElement('option'); o.value=v.id; o.textContent=v.nombre;
      if(String(v.id)===String(cur)) o.selected=true; sel.appendChild(o);
    });
  }
  // Vendedor en Detallado
  var selDet = gel('an-det-vendedor');
  var curDet = selDet ? selDet.value : '';
  if(selDet){
    selDet.innerHTML = '<option value="">— Selecciona un vendedor —</option>';
    _vendedores.forEach(function(v){
      var o=document.createElement('option'); o.value=v.id; o.textContent=v.nombre;
      if(String(v.id)===String(curDet)) o.selected=true; selDet.appendChild(o);
    });
  }
  var detMes = gel('an-det-mes');
  if(detMes && !detMes.value) detMes.value = anAnioMesActual();

  // Delegar según vista activa
  if(_anView==='gen') return anRenderGeneral();
  if(_anView==='det') return anRenderDetallado();
  if(_anView==='cat') return anRenderCategorias();
  return anRenderComparativo();
}

function anRenderComparativo(){
  var sel = gel('an-vendedor');
  var now = new Date();
  anInitPeriodos();
  anRenderPeriodosUI();
  var mesA = _anPeriodos[0];
  var mesB = _anPeriodos[_anPeriodos.length-1];
  var filtVend = sel ? sel.value : '';

  // ── DATOS GLOBALES ────────────────────────────────────────
  var vA = anVentasRealesDe(mesA, filtVend);
  var vB = anVentasRealesDe(mesB, filtVend);
  var totA = anIngresoDe(mesA, filtVend);
  var totB = anIngresoDe(mesB, filtVend);
  var credTotB = anSumTotal(anCreditosTotales(filtVend));
  var devB = anSumTotal(anDevolDe(mesB, filtVend));
  var visA = anVisitasDe(mesA, filtVend).length;
  var visB = anVisitasDe(mesB, filtVend).length;
  var convA = visA>0 ? Math.round(vA.length/visA*100) : 0;
  var convB = visB>0 ? Math.round(vB.length/visB*100) : 0;
  var tickA = vA.length>0 ? totA/vA.length : 0;
  var tickB = vB.length>0 ? totB/vB.length : 0;

  // ── KPIs ─────────────────────────────────────────────────
  var contadoB = anSumTotal(vB.filter(function(v){var mt=(v.movimiento||'').toLowerCase();return mt.indexOf('contado')>-1||mt.indexOf('delivery')>-1;}));
  var cobrosB  = anSumTotal(vB.filter(function(v){var mt=(v.movimiento||'').toLowerCase();return mt.indexOf('cobro')>-1;}));
  var baseTotal = contadoB + cobrosB;
  var pContado = baseTotal>0 ? Math.round(contadoB/baseTotal*100) : 0;
  var pCobros  = baseTotal>0 ? Math.round(cobrosB/baseTotal*100)  : 0;

  var kpiData = [
    {lbl:'VENTAS '+anLabelMes(mesA), val:money(totA), sub:vA.length+' transacc.', delta:null, color:'var(--brand)'},
    {lbl:'VENTAS '+anLabelMes(mesB), val:money(totB), sub:vB.length+' transacc.', delta:anDelta(totA,totB), color:'var(--brand)'},
    {lbl:'CRÉDITOS PENDIENTES', val:money(credTotB), sub:'acumulado total', delta:null, color:'#d97706'},
    {lbl:'TICKET PROM. '+anLabelMes(mesB), val:money(tickB), sub:'vs '+money(tickA), delta:anDelta(tickA,tickB), color:'#1e6e77'},
    {lbl:'CONVERSIÓN '+anLabelMes(mesB), val:convB+'%', sub:visB+' visitas', delta:anDelta(convA,convB), color:'var(--orange)'},
  ];
  var breakdownHtml = baseTotal>0
    ? '<div style="background:var(--bg);border:1px solid var(--bd);border-radius:var(--r);padding:.75rem 1rem;margin-top:.5rem;font-size:12px;">'+
        '<div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.5rem;">Composición ventas '+anLabelMes(mesB)+'</div>'+
        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:.5rem;">'+
          '<span>💵 Contado/Delivery: <strong style="color:#2d7a3a;">'+money(contadoB)+'</strong> ('+pContado+'%)</span>'+
          '<span>🔄 Cobros crédito: <strong style="color:#0891b2;">'+money(cobrosB)+'</strong> ('+pCobros+'%)</span>'+
          (devB>0?'<span>↩ Devoluciones: <strong style="color:var(--er);">−'+money(devB)+'</strong></span>':'')+
        '</div>'+
        '<div style="display:flex;height:6px;border-radius:3px;overflow:hidden;">'+
          '<div style="flex:'+pContado+';background:#2d7a3a;min-width:'+(pContado>0?'2px':'0')+';"></div>'+
          '<div style="flex:'+pCobros+';background:#0891b2;min-width:'+(pCobros>0?'2px':'0')+';"></div>'+
        '</div>'+
      '</div>'
    : '';
  gel('an-kpis').innerHTML = kpiData.map(function(k){
    return '<div class="an-kpi">'+
      '<div class="an-kpi-lbl">'+k.lbl+'</div>'+
      '<div class="an-kpi-val" style="color:'+k.color+'">'+k.val+'</div>'+
      '<div class="an-kpi-sub">'+k.sub+'</div>'+
      (k.delta!==null?'<div>'+anDeltaHtml(k.delta)+'</div>':'')+
    '</div>';
  }).join('') + breakdownHtml;
  if(window.gsap&&!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
    gsap.from('#an-kpis .an-kpi',{y:14,opacity:0,duration:.3,stagger:.06,ease:'power2.out',overwrite:true});
  }

  // ── BARRAS VENDEDORES (N períodos) ────────────────────────
  // Si filtVend está seteado: solo barras del vendedor filtrado, una por período (vista mes a mes)
  // Si no: comparar todos los vendedores con barras agrupadas por período
  var palette=['rgba(153,211,218,.55)','rgba(37,60,97,.7)','rgba(234,140,67,.7)','rgba(45,122,58,.65)','rgba(147,51,234,.65)','rgba(220,38,38,.65)','rgba(8,145,178,.65)','rgba(192,100,30,.65)'];
  var border=['#1e6e77','#253C61','#c0641e','#1f5128','#7e22ce','#991b1b','#0e7490','#9a3412'];
  var tituloChart = gel('an-chart-meses-titulo');
  if(_anChartMeses){_anChartMeses.destroy();_anChartMeses=null;}
  var ctxM = gel('an-chart-meses');

  if(filtVend){
    var vendObj = _vendedores.filter(function(v){return String(v.id)===String(filtVend);})[0];
    var nombreV = vendObj?vendObj.nombre.split(' ')[0]:'Vendedor';
    var dataPer = _anPeriodos.map(function(m){return anIngresoDe(m,filtVend);});
    if(tituloChart) tituloChart.textContent = '📊 Ventas de '+nombreV+' por período';
    if(ctxM && dataPer.some(function(x){return x>0;})){
      _anChartMeses = new Chart(ctxM,{type:'bar',data:{
        labels:_anPeriodos.map(function(m){return anLabelMes(m);}),
        datasets:[{
          label:nombreV,
          data:dataPer,
          backgroundColor:_anPeriodos.map(function(_,i){return palette[i%palette.length];}),
          borderColor:_anPeriodos.map(function(_,i){return border[i%border.length];}),
          borderWidth:1.5,borderRadius:4
        }]
      },options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return ' '+money(ctx.parsed.y);}}}},
          scales:{y:{ticks:{callback:function(v){return 'S/'+Math.round(v/1000)+'k';},font:{size:10},color:'#718096'},grid:{color:'#e2e8f0'},beginAtZero:true},
                  x:{ticks:{font:{size:11},color:'#4a5568'},grid:{display:false}}}}});
      anChartShowCanvas(ctxM);
    } else if(ctxM){ anChartEmpty(ctxM, 'Sin ventas del vendedor en los períodos seleccionados'); }
  } else {
    if(tituloChart) tituloChart.textContent = '📊 Ventas por Vendedor: '+_anPeriodos.map(anLabelMes).join(' vs ');
    var vendsDataN = _vendedores.map(function(v){
      var per=_anPeriodos.map(function(m){return anIngresoDe(m,v.id);});
      return {nombre:v.nombre.split(' ')[0], per:per};
    }).filter(function(v){return v.per.some(function(x){return x>0;});}).sort(function(a,b){return b.per[b.per.length-1]-a.per[a.per.length-1];});
    if(ctxM && vendsDataN.length){
      _anChartMeses = new Chart(ctxM,{type:'bar',data:{
        labels:vendsDataN.map(function(v){return v.nombre;}),
        datasets:_anPeriodos.map(function(per,i){return {
          label:anLabelMes(per),
          data:vendsDataN.map(function(v){return v.per[i];}),
          backgroundColor:palette[i%palette.length],
          borderColor:border[i%border.length],
          borderWidth:1.5,borderRadius:4
        };})
      },options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{labels:{font:{family:'DM Sans',size:11},color:'#4a5568'}}},
          scales:{y:{ticks:{callback:function(v){return 'S/'+Math.round(v/1000)+'k';},font:{size:10},color:'#718096'},grid:{color:'#e2e8f0'}},
                  x:{ticks:{font:{size:10},color:'#718096'},grid:{display:false}}}}});
      anChartShowCanvas(ctxM);
    } else if(ctxM){ anChartEmpty(ctxM, 'Sin datos para comparar'); }
  }

  // ── BARRAS ZONAS ──────────────────────────────────────────
  var todasZonas = _zonas.map(function(z){return z.nombre;});
  _ventas.forEach(function(v){if(v.zona&&todasZonas.indexOf(v.zona)<0)todasZonas.push(v.zona);});
  var zonaDataA=[], zonaDataB=[], zonaLabels=[];
  todasZonas.forEach(function(zn){
    var pA=anParseMes(mesA), pB=anParseMes(mesB);
    function filtZona(p, estado, tipos){
      return _ventas.filter(function(v){
        var d=new Date(v.fecha); var mt=(v.movimiento||'').toLowerCase();
        var ok=d.getFullYear()===p.y&&d.getMonth()===p.m&&v.zona===zn;
        if(estado) ok=ok&&v.estado===estado;
        if(tipos) ok=ok&&tipos.some(function(t){return mt.indexOf(t)>-1;});
        else ok=ok&&(mt==='devolucion'||mt==='devolución')&&v.estado!=='Anulado';
        if(filtVend) ok=ok&&String(v.vendedor_id)===String(filtVend);
        return ok;
      });
    }
    var tA3=Math.max(0,anSumTotal(filtZona(pA,'✅ Pagado',['contado','delivery','cobro']))-anSumTotal(filtZona(pA,null,null)));
    var tB3=Math.max(0,anSumTotal(filtZona(pB,'✅ Pagado',['contado','delivery','cobro']))-anSumTotal(filtZona(pB,null,null)));
    if(tA3>0||tB3>0){zonaLabels.push(zn);zonaDataA.push(tA3);zonaDataB.push(tB3);}
  });
  gel('an-zona-periodos').textContent = anLabelMes(mesA)+' vs '+anLabelMes(mesB);
  if(_anChartZonas){_anChartZonas.destroy();_anChartZonas=null;}
  var ctxZ = gel('an-chart-zonas');
  if(ctxZ && zonaLabels.length){
    _anChartZonas = new Chart(ctxZ,{type:'bar',data:{
      labels:zonaLabels,
      datasets:[
        {label:anLabelMes(mesA),data:zonaDataA,backgroundColor:'rgba(153,211,218,.5)',borderColor:'#1e6e77',borderWidth:1.5,borderRadius:4},
        {label:anLabelMes(mesB),data:zonaDataB,backgroundColor:'rgba(234,140,67,.7)',borderColor:'#c0641e',borderWidth:1.5,borderRadius:4}
      ]},options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{font:{family:'DM Sans',size:11},color:'#4a5568'}}},
        scales:{y:{ticks:{callback:function(v){return 'S/'+Math.round(v/1000)+'k';},font:{size:10},color:'#718096'},grid:{color:'#e2e8f0'}},
                x:{ticks:{font:{size:10},color:'#718096'},grid:{display:false}}}}});
    anChartShowCanvas(ctxZ);
  } else if(ctxZ){ anChartEmpty(ctxZ, 'Sin datos de zonas'); }

  // ── DETALLE VENDEDOR ──────────────────────────────────────
  rRentabilidadVend();

  // ── TABLA ZONAS ───────────────────────────────────────────
  var zonaRowsHtml='';
  zonaLabels.forEach(function(zn,i){
    var tA3=zonaDataA[i], tB3=zonaDataB[i], dz=anDelta(tA3,tB3);
    var vendZona=_vendedores.filter(function(v){return v.zonas_asignadas&&v.zonas_asignadas.indexOf(zn)>=0;});
    zonaRowsHtml+='<tr>'+
      '<td style="font-weight:700;">📍 '+zn+'</td>'+
      '<td>'+vendZona.map(function(v){return '<span class="b b-contado" style="font-size:10px;">'+v.nombre.split(' ')[0]+'</span>';}).join(' ')+'</td>'+
      '<td><strong>'+money(tA3)+'</strong></td>'+
      '<td><strong>'+money(tB3)+'</strong></td>'+
      '<td>'+anDeltaHtml(dz)+'<span style="font-size:11px;color:var(--tl);margin-left:4px;">'+money(tB3-tA3)+'</span></td>'+
      '<td><div style="background:var(--bd);border-radius:4px;height:6px;overflow:hidden;width:80px;"><div style="background:'+(dz>=0?'var(--ok)':'var(--er)')+';height:6px;width:'+Math.min(100,Math.abs(dz))+'%;border-radius:4px;"></div></div></td>'+
    '</tr>';
  });
  gel('an-tabla-zonas').innerHTML = zonaRowsHtml
    ? '<table><thead><tr><th>Zona</th><th>Vendedores</th><th>'+anLabelMes(mesA)+'</th><th>'+anLabelMes(mesB)+'</th><th>Variación</th><th>Barra</th></tr></thead><tbody>'+zonaRowsHtml+'</tbody></table>'
    : '<div style="padding:2rem;text-align:center;color:var(--tl);font-size:13px;">Sin datos de zonas</div>';

  // ── RANKING ───────────────────────────────────────────────
  var rankRows=_vendedores.map(function(v){
    var tA4=anIngresoDe(mesA,v.id), tB4=anIngresoDe(mesB,v.id);
    return {v:v,tA:tA4,tB:tB4,dr:anDelta(tA4,tB4),nivel:anNivelVendedor(tB4),cred:anSumTotal(anCreditosTotales(v.id))};
  }).filter(function(r){return r.tA>0||r.tB>0;}).sort(function(a,b){return b.tB-a.tB;});
  var rankHtml='';
  rankRows.forEach(function(r,i){
    rankHtml+='<tr>'+
      '<td><strong>'+(i+1)+'</strong></td>'+
      '<td style="font-weight:700;">'+r.v.nombre+'</td>'+
      '<td>'+money(r.tA)+'</td>'+
      '<td><strong>'+money(r.tB)+'</strong></td>'+
      '<td>'+anDeltaHtml(r.dr)+'</td>'+
      '<td style="color:#d97706;font-size:12px;">'+money(r.cred)+'</td>'+
      '<td>'+(r.nivel?'<span style="font-size:11px;padding:2px 7px;border-radius:12px;background:'+r.nivel.color+'22;color:'+r.nivel.color+';font-weight:700;border:1px solid '+r.nivel.color+'44;">'+r.nivel.emoji+' '+r.nivel.nombre+'</span>':'—')+'</td>'+
    '</tr>';
  });
  gel('an-tabla-vendedores').innerHTML = rankHtml
    ? '<table><thead><tr><th>#</th><th>Vendedor</th><th>'+anLabelMes(mesA)+'</th><th>'+anLabelMes(mesB)+'</th><th>Cambio</th><th>Créd. pend.</th><th>Nivel</th></tr></thead><tbody>'+rankHtml+'</tbody></table>'
    : '<div style="padding:2rem;text-align:center;color:var(--tl);">Sin datos</div>';

  // ── TICKET ────────────────────────────────────────────────
  var tickHtml='';
  _vendedores.forEach(function(v){
    var vbs2=anVentasRealesDe(mesB,v.id), vas2=anVentasRealesDe(mesA,v.id);
    if(!vbs2.length&&!vas2.length) return;
    var tA5=vas2.length>0?anIngresoDe(mesA,v.id)/vas2.length:0;
    var tB5=vbs2.length>0?anIngresoDe(mesB,v.id)/vbs2.length:0;
    tickHtml+='<div class="an-vend-row">'+
      '<div class="an-vend-avatar">'+v.nombre.charAt(0)+'</div>'+
      '<div style="flex:1"><div style="font-size:13px;font-weight:600;">'+v.nombre.split(' ')[0]+'</div>'+
        '<div style="font-size:11px;color:var(--tl);">'+anLabelMes(mesA)+': '+money(tA5)+'</div></div>'+
      '<div style="text-align:right"><div style="font-weight:700;color:var(--brand);font-size:14px;">'+money(tB5)+'</div>'+anDeltaHtml(anDelta(tA5,tB5))+'</div>'+
    '</div>';
  });
  gel('an-ticket').innerHTML = tickHtml || '<div style="color:var(--tl);font-size:12px;text-align:center;padding:1rem;">Sin datos</div>';

  // ── CONVERSIÓN ────────────────────────────────────────────
  var convHtml='';
  _vendedores.forEach(function(v){
    var visB2=anVisitasDe(mesB,v.id).length, venB2=anVentasRealesDe(mesB,v.id).length;
    var visA2=anVisitasDe(mesA,v.id).length, venA2=anVentasRealesDe(mesA,v.id).length;
    if(!visB2&&!venB2&&!visA2&&!venA2) return;
    var cA2=visA2>0?Math.round(venA2/visA2*100):0;
    var cB2=visB2>0?Math.round(venB2/visB2*100):0;
    convHtml+='<div class="an-vend-row">'+
      '<div class="an-vend-avatar">'+v.nombre.charAt(0)+'</div>'+
      '<div style="flex:1"><div style="font-size:13px;font-weight:600;">'+v.nombre.split(' ')[0]+'</div>'+
        '<div class="an-bar-bg" style="margin-top:4px;"><div class="an-bar-fill" style="background:var(--sky);width:'+Math.min(100,cB2)+'%"></div></div>'+
        '<div style="font-size:10px;color:var(--tl);margin-top:2px;">'+visB2+' visitas → '+venB2+' ventas</div></div>'+
      '<div style="text-align:right"><div style="font-weight:700;color:var(--brand);font-size:16px;">'+cB2+'%</div>'+anDeltaHtml(anDelta(cA2,cB2))+'</div>'+
    '</div>';
  });
  gel('an-conversion').innerHTML = convHtml || '<div style="color:var(--tl);font-size:12px;text-align:center;padding:1rem;">Sin datos</div>';

  // ── MOROSIDAD ─────────────────────────────────────────────
  var morHtml='';
  _vendedores.forEach(function(v){
    var cred3=anCarteraDe(mesB,v.id), rev3=anIngresoDe(mesB,v.id);
    if(!cred3.length&&!rev3) return;
    var cart3=anSumTotal(cred3);
    var venc3=cred3.filter(function(x){return x.estado==='❌ Vencido';});
    var pend3=cred3.filter(function(x){return x.estado==='⏳ Pendiente';});
    var base3=rev3+cart3, morPct=base3>0?Math.round(cart3/base3*100):0;
    var color=morPct>30?'var(--er)':morPct>15?'#d97706':'var(--ok)';
    morHtml+='<div class="an-vend-row">'+
      '<div class="an-vend-avatar">'+v.nombre.charAt(0)+'</div>'+
      '<div style="flex:1"><div style="font-size:13px;font-weight:600;">'+v.nombre.split(' ')[0]+'</div>'+
        '<div class="an-bar-bg" style="margin-top:4px;"><div class="an-bar-fill" style="background:'+color+';width:'+Math.min(100,morPct)+'%"></div></div>'+
        '<div style="font-size:10px;color:var(--tl);margin-top:2px;">'+venc3.length+' vencido(s) · '+pend3.length+' pendiente(s)</div></div>'+
      '<div style="text-align:right"><div style="font-weight:700;color:'+color+';font-size:16px;">'+morPct+'%</div>'+
        '<div style="font-size:10px;color:var(--tl);">'+money(cart3)+'</div></div>'+
    '</div>';
  });
  gel('an-morosidad').innerHTML = morHtml || '<div style="color:var(--ok);font-size:12px;text-align:center;padding:1rem;">✅ Sin créditos pendientes este período</div>';

}

// ══════════ VISTA GENERAL ══════════
function anRenderGeneral(){
  var now = new Date();
  var mesActual = anAnioMesActual();

  // KPIs globales del mes actual
  var p = anParseMes(mesActual);
  var ventasMes = _ventas.filter(function(v){
    if(!v.fecha) return false;
    var d=new Date(v.fecha);
    return d.getFullYear()===p.y && d.getMonth()===p.m && v.estado!=='Anulado';
  });
  var ingresoMes = 0;
  var contadoMes = 0, deliveryMes = 0, cobrosMes = 0;
  var visitasMes = 0;
  ventasMes.forEach(function(v){
    var n=movNorm(v.movimiento);
    if(v.estado==='✅ Pagado'){
      if(n==='venta al contado'){ contadoMes+=(v.total||0); ingresoMes+=(v.total||0); }
      else if(n==='venta delivery'){ deliveryMes+=(v.total||0); ingresoMes+=(v.total||0); }
      else if(n==='cobro de credito'){ cobrosMes+=(v.total||0); ingresoMes+=(v.total||0); }
    }
    if(anEsDevolucion(v)) ingresoMes-=Math.abs(v.total||0);
    if(n==='visita') visitasMes++;
  });
  ingresoMes=Math.max(0,ingresoMes);
  var credPendTot = anSumTotal(anCreditosTotales(''));
  var credVencidos = anCreditosTotales('').filter(function(v){return v.estado==='❌ Vencido';});
  var credVencMonto = anSumTotal(credVencidos);
  // Vendedores activos = los que tienen alguna transacción este mes
  var vendActSet = {};
  ventasMes.forEach(function(v){ if(v.vendedor_id) vendActSet[v.vendedor_id]=1; });
  var nVendActivos = Object.keys(vendActSet).length;
  // Vetes únicas atendidas
  var vetSet = {};
  ventasMes.forEach(function(v){ if(v.veterinaria) vetSet[v.veterinaria]=1; });
  var nVets = Object.keys(vetSet).length;
  // Nuevas vetes
  var nuevasMes = anNuevasVetes(mesActual, '').length;

  var kpis = [
    {icon:'💰', lbl:'INGRESO DEL MES', val:money(ingresoMes), sub:ventasMes.filter(function(v){return v.estado==='✅ Pagado';}).length+' transacciones', color:'var(--brand)'},
    {icon:'💵', lbl:'CONTADO', val:money(contadoMes), sub:'al contado', color:'#2d7a3a'},
    {icon:'🚚', lbl:'DELIVERY', val:money(deliveryMes), sub:'venta delivery', color:'#7c3aed'},
    {icon:'💳', lbl:'COBROS CRÉDITO', val:money(cobrosMes), sub:'cobros realizados', color:'#0891b2'},
    {icon:'⏳', lbl:'CRÉDITOS PENDIENTES', val:money(credPendTot), sub:credVencidos.length+' vencidos · '+money(credVencMonto), color:'#d97706'},
    {icon:'👥', lbl:'VENDEDORES ACTIVOS', val:String(nVendActivos), sub:'de '+_vendedores.length+' registrados', color:'#253C61'},
    {icon:'🏥', lbl:'VETERINARIAS ATENDIDAS', val:String(nVets), sub:nuevasMes+' nuevas este mes', color:'#1e6e77'},
    {icon:'🚶', lbl:'VISITAS DEL MES', val:String(visitasMes), sub:'eventos de visita', color:'#0e7490'}
  ];
  gel('an-gen-kpis').innerHTML = kpis.map(function(k){
    return '<div style="background:var(--wh);border:1.5px solid var(--bd);border-radius:var(--rl);padding:.9rem 1rem;box-shadow:var(--sh);position:relative;">'+
      '<div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:.35rem;">'+k.icon+' '+esc(k.lbl)+'</div>'+
      '<div style="font-family:Bebas Neue,sans-serif;font-size:26px;color:'+k.color+';letter-spacing:.5px;line-height:1.1;">'+esc(k.val)+'</div>'+
      '<div style="font-size:11px;color:var(--tl);margin-top:.2rem;">'+esc(k.sub)+'</div>'+
    '</div>';
  }).join('');
  if(window.gsap && !(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
    gsap.from('#an-gen-kpis > div',{y:14,opacity:0,duration:.3,stagger:.05,ease:'power2.out',overwrite:true,clearProps:'transform,opacity'});
  }

  // Evolución (todos los vendedores con datos, desde primer movimiento)
  var elD=gel('an-evol-desde'), elH=gel('an-evol-hasta');
  if(elD && elD.value) _anEvolRangoTouched=true;
  if(elH && elH.value) _anEvolRangoTouched=true;
  var primerMes = anPrimerMesActividad('') || mesActual;
  var desdeAuto = primerMes, hastaAuto = mesActual;
  if(elD && (!elD.value || !_anEvolRangoTouched)) elD.value=desdeAuto;
  if(elH && (!elH.value || !_anEvolRangoTouched)) elH.value=hastaAuto;
  var evolDesde = (elD && elD.value) || desdeAuto;
  var evolHasta = (elH && elH.value) || hastaAuto;
  if(evolDesde>evolHasta){ var tmp=evolDesde; evolDesde=evolHasta; evolHasta=tmp; }
  var mesesRango = anRangoMeses(evolDesde, evolHasta);
  var lblRango = gel('an-evol-rango');
  if(lblRango) lblRango.textContent = mesesRango.length+' mes(es) · '+anLabelMes(evolDesde)+' → '+anLabelMes(evolHasta);

  var lineColors=['#253C61','#1e6e77','#d97706','#2d7a3a','#9333ea','#dc2626','#0891b2','#c0641e'];
  var evolDatasets=[];
  _vendedores.forEach(function(v,idx){
    var data=mesesRango.map(function(m){return anIngresoDe(m,v.id);});
    if(data.every(function(x){return x===0;})) return;
    var c=lineColors[idx%lineColors.length];
    evolDatasets.push({label:v.nombre.split(' ')[0],data:data,borderColor:c,backgroundColor:c+'18',
      borderWidth:2.5,pointRadius:4,pointHoverRadius:6,fill:false,tension:0.3});
  });
  if(_anChartEvolucion){_anChartEvolucion.destroy();_anChartEvolucion=null;}
  var ctxEv=gel('an-chart-evolucion');
  if(ctxEv && evolDatasets.length){
    _anChartEvolucion = new Chart(ctxEv,{type:'line',data:{
      labels:mesesRango.map(function(m){return anLabelMes(m);}),
      datasets:evolDatasets
    },options:{responsive:true,maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      plugins:{legend:{labels:{font:{family:'DM Sans',size:11},color:'#4a5568'}},
        tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+money(ctx.parsed.y);}}}},
      scales:{y:{ticks:{callback:function(v){return 'S/'+Math.round(v/1000)+'k';},font:{size:10},color:'#718096'},grid:{color:'#e2e8f0'},beginAtZero:true},
              x:{ticks:{font:{size:10},color:'#718096'},grid:{color:'#f1f5f9'}}}}});
    anChartShowCanvas(ctxEv);
  } else if(ctxEv){ anChartEmpty(ctxEv, 'Sin datos en el rango seleccionado'); }

  // Top zonas — dos tablas separadas
  var distritos = anVisitasPorDistrito(mesActual, '');
  var lblZ = gel('an-gen-zonas-label');
  if(lblZ) lblZ.textContent = anLabelMes(mesActual);

  // Tabla 1: más visitadas (orden por total visitas)
  var byVisitas = distritos.slice().sort(function(a,b){return b.total-a.total;});
  var maxVisitas = byVisitas.length ? byVisitas[0].total : 1;
  var rowsVis = byVisitas.slice(0,8).map(function(d,i){
    var rank = i===0?'🥇':(i===1?'🥈':(i===2?'🥉':'#'+(i+1)));
    var pct = Math.round(d.total/maxVisitas*100);
    return '<tr style="cursor:pointer;" onclick="abrirModalZona(\''+esc(d.zona)+'\',\''+esc(mesActual)+'\')">'+
      '<td style="font-weight:700;">'+rank+' '+esc(d.zona)+'</td>'+
      '<td style="text-align:center;"><strong>'+d.total+'</strong></td>'+
      '<td style="text-align:right;font-size:11px;color:var(--tl);">'+money(d.ingreso)+'</td>'+
      '<td><div style="background:var(--bd);border-radius:4px;height:6px;overflow:hidden;width:70px;"><div style="background:var(--brand);height:6px;width:'+pct+'%;border-radius:4px;"></div></div></td>'+
    '</tr>';
  }).join('');
  var elVis = gel('an-gen-top-zonas-visitas');
  if(elVis) elVis.innerHTML = rowsVis
    ? '<table><thead><tr><th>Zona</th><th style="text-align:center;">Visitas</th><th style="text-align:right;">Ingreso</th><th>%</th></tr></thead><tbody>'+rowsVis+'</tbody></table>'+
      '<div style="padding:.4rem .8rem;font-size:10px;color:var(--tl);border-top:1px solid var(--bd);">💡 Click en una zona para ver detalle</div>'
    : '<div style="padding:1.5rem;text-align:center;color:var(--tl);font-size:13px;">Sin visitas registradas</div>';

  // Tabla 2: más vendido (orden por ingreso)
  var byVentas = distritos.slice().sort(function(a,b){return b.ingreso-a.ingreso;});
  var maxIngreso = byVentas.length ? byVentas[0].ingreso : 1;
  var rowsVent = byVentas.slice(0,8).map(function(d,i){
    var rank = i===0?'🥇':(i===1?'🥈':(i===2?'🥉':'#'+(i+1)));
    var pct = maxIngreso>0?Math.round(d.ingreso/maxIngreso*100):0;
    return '<tr style="cursor:pointer;" onclick="abrirModalZona(\''+esc(d.zona)+'\',\''+esc(mesActual)+'\')">'+
      '<td style="font-weight:700;">'+rank+' '+esc(d.zona)+'</td>'+
      '<td style="text-align:right;font-weight:700;color:var(--ok);">'+money(d.ingreso)+'</td>'+
      '<td style="text-align:center;font-size:11px;color:var(--tl);">'+d.total+' vis.</td>'+
      '<td><div style="background:var(--bd);border-radius:4px;height:6px;overflow:hidden;width:70px;"><div style="background:var(--ok);height:6px;width:'+pct+'%;border-radius:4px;"></div></div></td>'+
    '</tr>';
  }).join('');
  var elVent = gel('an-gen-top-zonas-ventas');
  if(elVent) elVent.innerHTML = rowsVent
    ? '<table><thead><tr><th>Zona</th><th style="text-align:right;">Ingreso</th><th style="text-align:center;">Visitas</th><th>%</th></tr></thead><tbody>'+rowsVent+'</tbody></table>'+
      '<div style="padding:.4rem .8rem;font-size:10px;color:var(--tl);border-top:1px solid var(--bd);">💡 Click en una zona para ver detalle</div>'
    : '<div style="padding:1.5rem;text-align:center;color:var(--tl);font-size:13px;">Sin ventas registradas</div>';

  // Ranking del mes
  var rank = _vendedores.map(function(v){
    var ing = anIngresoDe(mesActual, v.id);
    var trans = anVentasRealesDe(mesActual, v.id).length;
    var visitas = anVisitasUnicas(mesActual, v.id).length;
    var nivel = anNivelVendedor(ing);
    return {v:v, ing:ing, trans:trans, visitas:visitas, nivel:nivel};
  }).filter(function(r){return r.ing>0||r.trans>0||r.visitas>0;}).sort(function(a,b){return b.ing-a.ing;});
  var rkHtml = rank.map(function(r,i){
    var rk = i===0?'🥇':(i===1?'🥈':(i===2?'🥉':'#'+(i+1)));
    return '<tr style="cursor:pointer;" onclick="anIrDetallado(\''+esc(r.v.id)+'\',\''+esc(mesActual)+'\')">'+
      '<td style="font-weight:800;">'+rk+'</td>'+
      '<td><strong>'+esc(r.v.nombre)+'</strong>'+(r.nivel?' <span style="font-size:10px;padding:1px 6px;border-radius:8px;background:'+r.nivel.color+'22;color:'+r.nivel.color+';font-weight:700;">'+r.nivel.emoji+' '+esc(r.nivel.nombre)+'</span>':'')+'</td>'+
      '<td style="text-align:right;font-weight:700;color:var(--brand);">'+money(r.ing)+'</td>'+
      '<td style="text-align:center;">'+r.trans+'</td>'+
      '<td style="text-align:center;">'+r.visitas+'</td>'+
    '</tr>';
  }).join('');
  gel('an-gen-ranking').innerHTML = rkHtml
    ? '<table><thead><tr><th>#</th><th>Vendedor</th><th style="text-align:right;">Ingreso</th><th style="text-align:center;">Trans.</th><th style="text-align:center;">Visitas</th></tr></thead><tbody>'+rkHtml+'</tbody></table><div style="padding:.4rem .8rem;font-size:11px;color:var(--tl);border-top:1px solid var(--bd);">💡 Click en una fila para ir al análisis detallado</div>'
    : '<div style="padding:1.5rem;text-align:center;color:var(--tl);font-size:13px;">Sin actividad este mes</div>';

  // Alerta stock bajo
  anRenderStockAlerta();

  // Clientes inactivos
  anRenderClientesInactivos('');

  // Proyección de cierre
  var now2=new Date();
  var diaActual=now2.getDate();
  var diasMes=new Date(now2.getFullYear(),now2.getMonth()+1,0).getDate();
  var foreHtml='<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.65rem 1rem;margin-bottom:1rem;font-size:12px;color:#1e6e77;">'+
    '📅 Hoy es día <strong>'+diaActual+'</strong> de <strong>'+diasMes+'</strong> — quedan '+(diasMes-diaActual)+' días del mes</div>';
  var totalProy=0;
  _vendedores.forEach(function(v){
    var acum=anIngresoDe(mesActual,v.id), trans=anVentasRealesDe(mesActual,v.id);
    if(!trans.length&&!acum) return;
    var ritmo=diaActual>0?acum/diaActual:0, proyeccion=ritmo*diasMes;
    totalProy+=proyeccion;
    var nivel=anNivelVendedor(proyeccion);
    foreHtml+='<div class="forecast-row">'+
      '<div class="an-vend-avatar">'+esc(v.nombre.charAt(0))+'</div>'+
      '<div style="flex:1"><div style="font-size:13px;font-weight:700;">'+esc(v.nombre)+'</div>'+
        '<div style="font-size:11px;color:var(--tl);">Ritmo: '+money(ritmo)+'/día · Acumulado: <strong>'+money(acum)+'</strong></div></div>'+
      '<div style="text-align:right"><div style="font-size:10px;color:var(--tl);">Proyección cierre</div>'+
        '<div style="font-weight:700;color:var(--brand);font-size:16px;font-family:Bebas Neue,sans-serif;">'+money(proyeccion)+'</div>'+
        (nivel?'<span style="font-size:11px;padding:2px 7px;border-radius:12px;background:'+nivel.color+'22;color:'+nivel.color+';border:1px solid '+nivel.color+'44;font-weight:700;">'+nivel.emoji+' '+esc(nivel.nombre)+'</span>':'')+
      '</div></div>';
  });
  if(totalProy>0){
    foreHtml += '<div style="border-top:2px solid var(--brand);margin-top:.8rem;padding:.8rem 1rem;display:flex;justify-content:space-between;align-items:center;font-weight:700;background:#f8fafc;">'+
      '<span style="font-size:13px;">📈 Total proyectado del equipo</span>'+
      '<span style="font-family:Bebas Neue,sans-serif;font-size:24px;color:var(--brand);">'+money(totalProy)+'</span></div>';
  } else {
    foreHtml='<div style="color:var(--tl);text-align:center;padding:1.5rem;font-size:13px;">Sin ventas registradas este mes aún</div>';
  }
  gel('an-forecast').innerHTML = foreHtml;
}

// Click en ranking del general → ir directo a detallado
function anIrDetallado(vendId, mes){
  anSetView('det');
  setTimeout(function(){
    var sv=gel('an-det-vendedor'); if(sv) sv.value=vendId;
    var sm=gel('an-det-mes'); if(sm) sm.value=mes;
    anRenderDetallado();
  },50);
}

// ══════════ VISTA DETALLADO ══════════
function anRenderDetallado(){
  var vendId = gel('an-det-vendedor')?gel('an-det-vendedor').value:'';
  var mes = gel('an-det-mes')?gel('an-det-mes').value:'';
  var body = gel('an-det-body');
  if(!body) return;
  if(!vendId || !mes){
    body.innerHTML='<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--rl);padding:2rem;text-align:center;color:#1e6e77;font-size:14px;">📌 Selecciona un <strong>vendedor</strong> y un <strong>mes</strong> para ver el análisis detallado</div>';
    return;
  }
  var vend = _vendedores.filter(function(v){return String(v.id)===String(vendId);})[0];
  if(!vend){ body.innerHTML='<div style="padding:2rem;text-align:center;color:var(--er);">Vendedor no encontrado</div>'; return; }

  // ─ KPIs del mes para el vendedor
  var vts = anVentasRealesDe(mes, vendId);
  var ing = anIngresoDe(mes, vendId);
  var devM = anSumTotal(anDevolDe(mes, vendId));
  var grupos = anVisitasUnicas(mes, vendId);
  var nVisitas = grupos.length;
  var contado = anSumTotal(vts.filter(function(v){return movNorm(v.movimiento)==='venta al contado';}));
  var delivery = anSumTotal(vts.filter(function(v){return movNorm(v.movimiento)==='venta delivery';}));
  var cobros = anSumTotal(vts.filter(function(v){return movNorm(v.movimiento)==='cobro de credito';}));
  // Créditos otorgados en el mes
  var p = anParseMes(mes);
  var credOto = _ventas.filter(function(v){
    if(String(v.vendedor_id)!==String(vendId)) return false;
    if(!esCredito15(v.movimiento)) return false;
    if(!v.fecha) return false;
    var d=new Date(v.fecha);
    return d.getFullYear()===p.y && d.getMonth()===p.m && v.estado!=='Anulado';
  });
  var credOtoMonto = anSumTotal(credOto);
  // Créditos pendientes acumulados del vendedor
  var credPend = anCreditosTotales(vendId);
  var credPendMonto = anSumTotal(credPend);
  var ticket = vts.length>0?ing/vts.length:0;
  var conversion = nVisitas>0?Math.round(vts.length/nVisitas*100):0;
  var nivel = anNivelVendedor(ing);
  var nuevasVet = anNuevasVetes(mes, vendId);

  // Clasificar grupos
  var conVenta=0, soloVisita=0, conCredito=0, conCobro=0, conDevol=0;
  grupos.forEach(function(g){
    var c=anClasificaGrupo(g);
    if(c.conVenta) conVenta++;
    if(c.soloVisita) soloVisita++;
    if(c.credito) conCredito++;
    if(c.cobro) conCobro++;
    if(c.devolucion) conDevol++;
  });

  // Top zonas del vendedor en el mes
  var distritos = anVisitasPorDistrito(mes, vendId);
  var topVis = distritos.slice().sort(function(a,b){return b.total-a.total;})[0];
  var topVen = distritos.slice().sort(function(a,b){return b.ingreso-a.ingreso;}).filter(function(d){return d.ingreso>0;})[0];

  var kpiCard = function(icon,lbl,val,sub,color){
    var valStr=String(val||'');
    var isText = (/^[A-Z—]/.test(valStr) && valStr.length>4 && !/^[\d\sS\/.\,\-+]+$/.test(valStr));
    var fs = isText ? '1.1rem' : '1.5rem';
    var ff = isText ? 'inherit' : 'Bebas Neue,sans-serif';
    return '<div style="background:var(--wh);border:1.5px solid var(--bd);border-radius:var(--rl);padding:.9rem 1rem;box-shadow:var(--sh);">'+
      '<div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:.35rem;">'+icon+' '+esc(lbl)+'</div>'+
      '<div style="font-family:'+ff+';font-size:'+fs+';color:'+color+';letter-spacing:.3px;line-height:1.15;word-break:break-word;font-weight:800;">'+esc(valStr)+'</div>'+
      '<div style="font-size:11px;color:var(--tl);margin-top:.2rem;">'+esc(sub)+'</div>'+
    '</div>';
  };

  // Header del vendedor
  var headerHtml = '<div class="card" style="margin-bottom:1rem;"><div class="cb" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">'+
    '<div style="width:54px;height:54px;border-radius:50%;background:var(--sky4);border:2px solid var(--sky);display:flex;align-items:center;justify-content:center;font-family:Bebas Neue,sans-serif;font-size:26px;color:var(--brand);">'+esc(vend.nombre.charAt(0))+'</div>'+
    '<div><div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--brand);">'+esc(vend.nombre)+'</div>'+
      '<div style="font-size:12px;color:var(--tl);">'+anLabelMes(mes)+' · @'+esc(vend.usuario||'—')+'</div></div>'+
    (nivel?'<span style="margin-left:auto;font-size:13px;padding:6px 14px;border-radius:14px;background:'+nivel.color+'22;color:'+nivel.color+';font-weight:700;border:1px solid '+nivel.color+'44;">'+nivel.emoji+' '+esc(nivel.nombre)+'</span>':'')+
  '</div></div>';

  // KPIs principales
  var kpisHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:10px;margin-bottom:1rem;">'+
    kpiCard('💰','INGRESO',money(ing),vts.length+' transacciones','var(--brand)')+
    kpiCard('💵','CONTADO',money(contado),'al contado','#2d7a3a')+
    kpiCard('🚚','DELIVERY',money(delivery),'venta delivery','#7c3aed')+
    kpiCard('💳','COBROS CRÉDITO',money(cobros),'cobros realizados','#0891b2')+
    kpiCard('📋','CRÉDITO OTORGADO',money(credOtoMonto),credOto.length+' nuevos créditos','#d97706')+
    kpiCard('⏳','CRÉDITOS PENDIENTES',money(credPendMonto),credPend.length+' acumulados','#dc2626')+
    kpiCard('🎯','TICKET PROMEDIO',money(ticket),'por venta','#1e6e77')+
    kpiCard('↩️','DEVOLUCIONES',money(devM),'monto devuelto','var(--er)')+
  '</div>';

  // KPIs de visitas
  var visitasHtml = '<div class="card" style="margin-bottom:1rem;"><div class="ch"><span class="ct">🚶 Visitas del Mes</span></div><div class="cb" style="padding:.8rem;">'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;">'+
      kpiCard('🚶','TOTAL VISITAS',String(nVisitas),'visitas únicas','var(--brand)')+
      kpiCard('✅','→ VENTA',String(conVenta),conversion+'% conversión','var(--ok)')+
      kpiCard('👀','SOLO VISITA',String(soloVisita),'sin transacción','#718096')+
      kpiCard('💳','→ CRÉDITO',String(conCredito),'a crédito','#d97706')+
      kpiCard('💰','→ COBRO',String(conCobro),'cobro de crédito','#0891b2')+
      kpiCard('🆕','NUEVAS VETES',String(nuevasVet.length),'primera visita','#7c3aed')+
      kpiCard('📍','ZONA + VISITAS',topVis?topVis.zona:'—',topVis?(topVis.total+' visitas'):'sin datos','#253C61')+
      kpiCard('🏆','ZONA + VENTAS',topVen?topVen.zona:'—',topVen?money(topVen.ingreso):'sin datos','#2d7a3a')+
    '</div></div></div>';

  // Distritos
  var maxVis = distritos.length?distritos[0].total:0;
  var distRows = distritos.map(function(d,i){
    var rk = i===0?'🥇':(i===1?'🥈':(i===2?'🥉':'•'));
    var pct = maxVis>0?Math.round(d.total/maxVis*100):0;
    return '<tr>'+
      '<td style="font-weight:700;">'+rk+' '+esc(d.zona)+'</td>'+
      '<td style="text-align:center;"><strong>'+d.total+'</strong></td>'+
      '<td style="text-align:center;color:var(--ok);">'+d.conVenta+'</td>'+
      '<td style="text-align:center;color:#718096;">'+d.soloVisita+'</td>'+
      '<td style="text-align:center;color:#d97706;">'+d.credito+'</td>'+
      '<td style="text-align:center;color:#0891b2;">'+d.cobro+'</td>'+
      '<td style="text-align:right;font-weight:700;">'+money(d.ingreso)+'</td>'+
      '<td><div style="background:var(--bd);border-radius:4px;height:6px;overflow:hidden;width:80px;"><div style="background:var(--brand);height:6px;width:'+pct+'%;border-radius:4px;"></div></div></td>'+
      '<td><button class="btn btn-sk btn-sm" onclick="anVerDetalleDistrito(\''+esc(mes)+'\',\''+esc(d.zona)+'\',\''+esc(vendId)+'\')">Ver detalle</button></td>'+
    '</tr>';
  }).join('');
  var distHtml = '<div class="card" style="margin-bottom:1rem;"><div class="ch"><span class="ct">📍 Visitas por Distrito</span></div><div class="cb" style="padding:0;"><div class="tw">'+(distRows
    ? '<table><thead><tr><th>Distrito</th><th style="text-align:center;">Visitas</th><th style="text-align:center;">→Venta</th><th style="text-align:center;">Solo</th><th style="text-align:center;">→Cred.</th><th style="text-align:center;">→Cobro</th><th style="text-align:right;">Ingreso</th><th>%</th><th>Acción</th></tr></thead><tbody>'+distRows+'</tbody></table>'
    : '<div style="padding:1.5rem;text-align:center;color:var(--tl);">Sin visitas en el mes</div>')+'</div></div></div>';

  // Nuevas veterinarias
  var nuevasHtml = '';
  if(nuevasVet.length){
    var nuevasRows = nuevasVet.map(function(vet){
      var movsMes = _ventas.filter(function(v){
        if(v.veterinaria!==vet) return false;
        if(String(v.vendedor_id)!==String(vendId)) return false;
        if(!v.fecha) return false;
        if(v.estado==='Anulado') return false;
        return String(v.fecha).substring(0,7)===mes;
      });
      var ingVet=0; var hasContado=false, hasCredito=false, hasCobro=false;
      movsMes.forEach(function(m){
        var n=movNorm(m.movimiento);
        if(anEsIngreso(m)) ingVet+=(m.total||0);
        else if(anEsDevolucion(m)) ingVet-=Math.abs(m.total||0);
        if(n==='venta al contado'||n==='venta delivery') hasContado=true;
        if(esCredito15(m.movimiento)) hasCredito=true;
        if(n==='cobro de credito') hasCobro=true;
      });
      var badge = hasContado?'<span style="font-size:10px;background:#dcfce7;color:#16a34a;padding:2px 6px;border-radius:8px;font-weight:700;">💵 Compró</span>'
        : hasCredito?'<span style="font-size:10px;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:8px;font-weight:700;">💳 Crédito</span>'
        : hasCobro?'<span style="font-size:10px;background:#cffafe;color:#0891b2;padding:2px 6px;border-radius:8px;font-weight:700;">💰 Cobro</span>'
        : '<span style="font-size:10px;background:#f1f5f9;color:#64748b;padding:2px 6px;border-radius:8px;font-weight:700;">👀 Solo visita</span>';
      var prim = movsMes.slice().sort(function(a,b){return (a.fecha||'').localeCompare(b.fecha||'');})[0];
      return '<div style="display:flex;flex-direction:column;gap:6px;padding:.7rem .85rem;background:#f8fafc;border-radius:8px;border:1px solid var(--bd);">'+
        '<div style="display:flex;align-items:center;gap:10px;">'+
          '<div style="width:30px;height:30px;border-radius:50%;background:#ede9fe;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">'+esc(vet.charAt(0).toUpperCase())+'</div>'+
          '<div style="flex:1;"><div style="font-weight:700;font-size:13px;">'+esc(vet)+'</div>'+
            '<div style="font-size:11px;color:var(--tl);">'+(prim&&prim.zona?'📍 '+esc(normZona(prim.zona)):'')+(prim&&prim.doctora?' · '+esc(prim.doctora):'')+'</div></div>'+
          '<div style="font-size:11px;color:#7c3aed;font-weight:700;">'+(prim?fmt(prim.fecha):'')+'</div>'+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+badge+
          (ingVet>0?'<span style="font-size:11px;color:var(--ok);font-weight:700;">'+money(ingVet)+'</span>':'')+
          '<button class="btn btn-sk btn-sm" style="margin-left:auto;padding:3px 10px;font-size:11px;" onclick="anVerNuevaVet(\''+escAttr(vet)+'\',\''+esc(mes)+'\',\''+esc(vendId)+'\')">Ver detalle</button>'+
        '</div>'+
      '</div>';
    }).join('');
    nuevasHtml = '<div class="card" style="margin-bottom:1rem;"><div class="ch"><span class="ct">🆕 Nuevas Veterinarias del Mes</span><span style="font-size:11px;color:var(--tl);">'+nuevasVet.length+' clientes nuevos</span></div><div class="cb" style="padding:.8rem;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px;">'+nuevasRows+'</div></div></div>';
  }

  // Tablero unificado
  var unif = anTableroUnificadoPorZona(mes, vendId);
  // Acumular totales
  var tot={visitas:0,vets:0,contado:0,delivery:0,cobros:0,credOto:0,credOtoMonto:0,credPend:0,credPendMonto:0,ingreso:0};
  unif.forEach(function(r){
    tot.visitas+=r.visitas; tot.vets+=r.vetsCount;
    tot.contado+=r.contado; tot.delivery+=r.delivery; tot.cobros+=r.cobros;
    tot.credOto+=r.creditosOtorgados; tot.credOtoMonto+=r.creditosOtorMonto;
    tot.credPend+=r.creditosPendActivos; tot.credPendMonto+=r.creditosPendMonto;
    tot.ingreso+=r.ingreso;
  });
  var unifTrs = unif.map(function(r){
    return '<tr>'+
      '<td style="font-weight:700;">📍 '+esc(r.zona)+'</td>'+
      '<td style="text-align:center;"><strong>'+r.visitas+'</strong><div style="font-size:10px;color:var(--tl);">'+r.vetsCount+' vetes</div></td>'+
      '<td style="text-align:right;color:#2d7a3a;"><strong>'+money(r.contado)+'</strong></td>'+
      '<td style="text-align:right;color:#7c3aed;">'+money(r.delivery)+'</td>'+
      '<td style="text-align:right;color:#0891b2;"><strong>'+money(r.cobros)+'</strong></td>'+
      '<td style="text-align:center;color:#d97706;">'+r.creditosOtorgados+'<div style="font-size:10px;">'+money(r.creditosOtorMonto)+'</div></td>'+
      '<td style="text-align:center;color:#dc2626;"><strong>'+r.creditosPendActivos+'</strong><div style="font-size:10px;">'+money(r.creditosPendMonto)+'</div></td>'+
      '<td style="text-align:right;font-weight:700;color:var(--brand);">'+money(r.ingreso)+'</td>'+
    '</tr>';
  }).join('');
  var totalRow = unifTrs ? '<tr style="background:#f8fafc;font-weight:700;border-top:2px solid var(--brand);">'+
    '<td style="font-weight:800;">TOTAL</td>'+
    '<td style="text-align:center;"><strong>'+tot.visitas+'</strong></td>'+
    '<td style="text-align:right;color:#2d7a3a;">'+money(tot.contado)+'</td>'+
    '<td style="text-align:right;color:#7c3aed;">'+money(tot.delivery)+'</td>'+
    '<td style="text-align:right;color:#0891b2;">'+money(tot.cobros)+'</td>'+
    '<td style="text-align:center;color:#d97706;">'+tot.credOto+'<div style="font-size:10px;">'+money(tot.credOtoMonto)+'</div></td>'+
    '<td style="text-align:center;color:#dc2626;">'+tot.credPend+'<div style="font-size:10px;">'+money(tot.credPendMonto)+'</div></td>'+
    '<td style="text-align:right;font-weight:800;color:var(--brand);font-size:14px;">'+money(tot.ingreso)+'</td>'+
  '</tr>' : '';
  var unifHtml = '<div class="card" style="margin-bottom:1rem;"><div class="ch"><span class="ct">🗺️ Tablero Unificado por Zona</span></div><div class="cb" style="padding:0;"><div class="tw">'+(unifTrs
    ? '<table><thead><tr><th>Zona</th><th style="text-align:center;">Visitas</th><th style="text-align:right;">Contado</th><th style="text-align:right;">Delivery</th><th style="text-align:right;">Cobros</th><th style="text-align:center;">Créd. otorg.</th><th style="text-align:center;">Créd. pend.</th><th style="text-align:right;">Ingreso</th></tr></thead><tbody>'+unifTrs+totalRow+'</tbody></table>'
    : '<div style="padding:1.5rem;text-align:center;color:var(--tl);">Sin datos por zona</div>')+'</div></div></div>';

  body.innerHTML = headerHtml + kpisHtml + visitasHtml + distHtml + nuevasHtml + unifHtml;
}

function anRenderVisitasSection(periodo, vendId){
  var grupos = anVisitasUnicas(periodo, vendId);
  var totalVisitas = grupos.length;
  var conVenta=0, soloVisita=0, conCredito=0, conCobro=0, conDevol=0, ingresoTot=0;
  grupos.forEach(function(g){
    var c=anClasificaGrupo(g);
    if(c.conVenta) conVenta++;
    if(c.soloVisita) soloVisita++;
    if(c.credito) conCredito++;
    if(c.cobro) conCobro++;
    if(c.devolucion) conDevol++;
    // Ingreso real: solo pagados (no créditos creados)
    g.movimientos.forEach(function(m){
      if(m.estado!=='✅ Pagado') return;
      var n=movNorm(m.movimiento);
      if(n==='venta al contado'||n==='venta delivery'||n==='cobro de credito'){
        ingresoTot += (m.total||0);
      }
    });
  });
  var pctConv = totalVisitas>0 ? Math.round(conVenta/totalVisitas*100) : 0;
  // Nuevas veterinarias: SIEMPRE en el mes actual (no el periodo seleccionado)
  var mesActualAn = anAnioMesActual();
  var nuevas = anNuevasVetes(mesActualAn, vendId);
  var vetsUnicas = {};
  grupos.forEach(function(g){ if(g.veterinaria) vetsUnicas[g.veterinaria]=1; });
  var nVetsUnicas = Object.keys(vetsUnicas).length;

  var lbl = gel('an-visitas-label');
  if(lbl) lbl.textContent = anLabelMes(periodo)+(vendId?' · '+esc(getNombreVendedor(vendId)):' · todos los vendedores');
  var nuevasLbl=gel('an-nuevas-label');
  if(nuevasLbl) nuevasLbl.textContent='Primera visita registrada en '+anLabelMes(mesActualAn)+' (mes actual)';

  // Top zonas: más visitas y mayores ventas
  var distritos = anVisitasPorDistrito(periodo, vendId);
  var topVisitas = distritos.slice().sort(function(a,b){return b.total-a.total;})[0];
  var topVentas = distritos.slice().sort(function(a,b){return b.ingreso-a.ingreso;}).filter(function(d){return d.ingreso>0;})[0];

  var cards = [
    {icon:'🚶', lbl:'TOTAL VISITAS', val:String(totalVisitas), sub:nVetsUnicas+' veterinarias únicas', color:'var(--brand)'},
    {icon:'✅', lbl:'TERMINARON EN VENTA', val:String(conVenta), sub:pctConv+'% de conversión', color:'var(--ok)'},
    {icon:'👀', lbl:'SOLO VISITA', val:String(soloVisita), sub:'sin transacción', color:'#718096'},
    {icon:'💳', lbl:'CON CRÉDITO OTORGADO', val:String(conCredito), sub:'visitas a crédito', color:'#d97706'},
    {icon:'💰', lbl:'CON COBRO REALIZADO', val:String(conCobro), sub:'cobros de crédito', color:'#0891b2'},
    {icon:'🆕', lbl:'NUEVAS VETERINARIAS', val:String(nuevas.length), sub:'primera visita', color:'#7c3aed'},
    {icon:'💵', lbl:'INGRESO DE VISITAS', val:money(ingresoTot), sub:totalVisitas+' visitas', color:'#1e6e77'},
    {icon:'↩️', lbl:'CON DEVOLUCIÓN', val:String(conDevol), sub:'devoluciones', color:'var(--er)'},
    {icon:'📍', lbl:'ZONA MÁS VISITAS', val:topVisitas?topVisitas.zona:'—', sub:topVisitas?(topVisitas.total+' visitas'):'sin datos', color:'#253C61'},
    {icon:'🏆', lbl:'ZONA MAYORES VENTAS', val:topVentas?topVentas.zona:'—', sub:topVentas?money(topVentas.ingreso):'sin datos', color:'#2d7a3a'}
  ];
  var cardsHtml = cards.map(function(c){
    // Si el valor es texto largo (zona), reducir font-size
    var valStr = String(c.val||'');
    var fontSize = (/^[A-Z—]/.test(valStr) && valStr.length>4 && !/^[\d\sS\/.\,\-+]+$/.test(valStr)) ? '1.05rem' : '1.5rem';
    var fontFam = (fontSize==='1.05rem') ? 'inherit' : 'Bebas Neue,sans-serif';
    return '<div style="background:var(--bg);border:1.5px solid var(--bd);border-radius:var(--r);padding:.85rem 1rem;">'+
      '<div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:.3rem;">'+c.icon+' '+esc(c.lbl)+'</div>'+
      '<div style="font-size:'+fontSize+';font-weight:800;color:'+c.color+';line-height:1.15;font-family:'+fontFam+';letter-spacing:.3px;word-break:break-word;">'+esc(c.val)+'</div>'+
      '<div style="font-size:11px;color:var(--tl);margin-top:.2rem;">'+esc(c.sub)+'</div>'+
    '</div>';
  }).join('');
  var contCards = gel('an-visitas-cards');
  if(contCards) contCards.innerHTML = cardsHtml;
  if(window.gsap && !(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
    gsap.from('#an-visitas-cards > div',{y:14,opacity:0,duration:.3,stagger:.05,ease:'power2.out',overwrite:true,clearProps:'transform,opacity'});
  }

  // ── DISTRITOS / ZONAS ──
  var distritos = anVisitasPorDistrito(periodo, vendId);
  var trows='';
  if(distritos.length){
    var maxV = distritos[0].total;
    distritos.forEach(function(d,idx){
      var pct = maxV>0?Math.round(d.total/maxV*100):0;
      var rank = idx===0?'🥇':(idx===1?'🥈':(idx===2?'🥉':'•'));
      var rankLbl = idx===0?'Más visitas':(idx===distritos.length-1?'Menos visitas':'');
      trows+='<tr>'+
        '<td style="font-weight:700;">'+rank+' '+esc(d.zona)+(rankLbl?' <span style="font-size:10px;color:var(--tl);font-weight:400;">('+rankLbl+')</span>':'')+'</td>'+
        '<td style="text-align:center;"><strong>'+d.total+'</strong></td>'+
        '<td style="text-align:center;color:var(--ok);">'+d.conVenta+'</td>'+
        '<td style="text-align:center;color:#718096;">'+d.soloVisita+'</td>'+
        '<td style="text-align:center;color:#d97706;">'+d.credito+'</td>'+
        '<td style="text-align:center;color:#0891b2;">'+d.cobro+'</td>'+
        '<td style="text-align:right;font-weight:700;">'+money(d.ingreso)+'</td>'+
        '<td><div style="background:var(--bd);border-radius:4px;height:6px;overflow:hidden;width:100px;"><div style="background:var(--brand);height:6px;width:'+pct+'%;border-radius:4px;"></div></div></td>'+
        '<td><button class="btn btn-sk btn-sm" onclick="anVerDetalleDistrito(\''+esc(periodo)+'\',\''+esc(d.zona)+'\',\''+esc(vendId||'')+'\')">Ver detalle</button></td>'+
      '</tr>';
    });
  }
  var elDist = gel('an-visitas-distritos');
  if(elDist) elDist.innerHTML = trows
    ? '<table><thead><tr><th>Distrito</th><th style="text-align:center;">Visitas</th><th style="text-align:center;">→ Venta</th><th style="text-align:center;">Solo visita</th><th style="text-align:center;">→ Crédito</th><th style="text-align:center;">→ Cobro</th><th style="text-align:right;">Ingreso</th><th>%</th><th>Acción</th></tr></thead><tbody>'+trows+'</tbody></table>'
    : '<div style="padding:1.5rem;text-align:center;color:var(--tl);font-size:13px;">Sin visitas registradas en este período</div>';

  // ── NUEVAS VETERINARIAS ──
  var elNu = gel('an-nuevas-vetes');
  if(elNu){
    if(nuevas.length){
      // Para cada nueva vet, mostrar zona/doctora/total
      var rowsNuevas = nuevas.map(function(vet){
        // Movimientos del mes actual para esta vet
        var movsMes = _ventas.filter(function(v){
          if(v.veterinaria!==vet) return false;
          if(vendId && String(v.vendedor_id)!==String(vendId)) return false;
          if(!v.fecha) return false;
          if(v.estado==='Anulado') return false;
          return String(v.fecha).substring(0,7)===mesActualAn;
        });
        var primeraVisita = movsMes.slice().sort(function(a,b){return (a.fecha||'').localeCompare(b.fecha||'');})[0];
        // Clasificar resultado
        var hasContado=false, hasDelivery=false, hasCredito=false, hasCobro=false, hasVisita=false, ingreso=0;
        movsMes.forEach(function(m){
          var n=movNorm(m.movimiento);
          if(n==='venta al contado'){ hasContado=true; if(m.estado==='✅ Pagado') ingreso+=(m.total||0); }
          else if(n==='venta delivery'){ hasDelivery=true; if(m.estado==='✅ Pagado') ingreso+=(m.total||0); }
          else if(esCredito15(m.movimiento)){ hasCredito=true; }
          else if(n==='cobro de credito'){ hasCobro=true; if(m.estado==='✅ Pagado') ingreso+=(m.total||0); }
          else if(n==='visita') hasVisita=true;
          if(anEsDevolucion(m)) ingreso-=Math.abs(m.total||0);
        });
        ingreso=Math.max(0,ingreso);
        var badge='';
        if(hasContado||hasDelivery){ badge='<span style="font-size:10px;background:#dcfce7;color:#16a34a;padding:2px 6px;border-radius:8px;font-weight:700;">💵 Compró</span>'; }
        else if(hasCredito){ badge='<span style="font-size:10px;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:8px;font-weight:700;">💳 A crédito</span>'; }
        else if(hasCobro){ badge='<span style="font-size:10px;background:#cffafe;color:#0891b2;padding:2px 6px;border-radius:8px;font-weight:700;">💰 Cobro</span>'; }
        else { badge='<span style="font-size:10px;background:#f1f5f9;color:#64748b;padding:2px 6px;border-radius:8px;font-weight:700;">👀 Solo visita</span>'; }
        var zona = primeraVisita?normZona(primeraVisita.zona):'';
        var doc = primeraVisita?primeraVisita.doctora:'';
        var vid2 = primeraVisita?primeraVisita.vendedor_id:'';
        return '<div style="display:flex;flex-direction:column;gap:6px;padding:.7rem .85rem;background:#f8fafc;border-radius:8px;border:1px solid var(--bd);">'+
          '<div style="display:flex;align-items:center;gap:10px;">'+
            '<div style="width:30px;height:30px;border-radius:50%;background:#ede9fe;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">'+esc(vet.charAt(0).toUpperCase())+'</div>'+
            '<div style="flex:1;"><div style="font-weight:700;font-size:13px;">'+esc(vet)+'</div>'+
              '<div style="font-size:11px;color:var(--tl);">'+(zona?'📍 '+esc(zona):'')+(doc?' · '+esc(doc):'')+(vid2?' · '+esc(getNombreVendedor(vid2)):'')+'</div></div>'+
            '<div style="font-size:11px;color:#7c3aed;font-weight:700;">'+(primeraVisita?fmt(primeraVisita.fecha):'')+'</div>'+
          '</div>'+
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'+
            badge+
            (ingreso>0?'<span style="font-size:11px;color:var(--ok);font-weight:700;">'+money(ingreso)+'</span>':'')+
            '<button class="btn btn-sk btn-sm" style="margin-left:auto;padding:3px 10px;font-size:11px;" onclick="anVerNuevaVet(\''+escAttr(vet)+'\',\''+esc(mesActualAn)+'\',\''+esc(vendId||'')+'\')">Ver detalle</button>'+
          '</div>'+
        '</div>';
      }).join('');
      elNu.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px;">'+rowsNuevas+'</div>';
    } else {
      elNu.innerHTML='<div style="padding:1rem;text-align:center;color:var(--tl);font-size:13px;">Sin veterinarias nuevas visitadas en este período</div>';
    }
  }
}

function anVerNuevaVet(vet, periodo, vendId){
  var movs = _ventas.filter(function(v){
    if(v.veterinaria!==vet) return false;
    if(vendId && String(v.vendedor_id)!==String(vendId)) return false;
    if(!v.fecha) return false;
    if(v.estado==='Anulado') return false;
    return String(v.fecha).substring(0,7)===periodo;
  }).sort(function(a,b){return (a.fecha||'').localeCompare(b.fecha||'');});
  if(!movs.length){ setSt('Sin movimientos en '+periodo,'er'); return; }
  // KPIs
  var ingreso=0, credOtorgado=0, nVisitas=0, nCompras=0, nCreditos=0, nCobros=0;
  movs.forEach(function(m){
    var n=movNorm(m.movimiento);
    if(n==='visita') nVisitas++;
    else if(n==='venta al contado'||n==='venta delivery'){ nCompras++; if(anEsIngreso(m)) ingreso+=(m.total||0); }
    else if(esCredito15(m.movimiento)){ nCreditos++; credOtorgado+=(m.total||0); }
    else if(n==='cobro de credito'){ nCobros++; if(anEsIngreso(m)) ingreso+=(m.total||0); }
    else if(anEsDevolucion(m)){ ingreso-=Math.abs(m.total||0); }
  });
  var rows = movs.map(function(m){
    return '<tr>'+
      '<td style="white-space:nowrap;">'+fmt(m.fecha)+'</td>'+
      '<td>'+bMov(m.movimiento)+'</td>'+
      '<td>'+esc(m.producto||'—')+'</td>'+
      '<td style="text-align:center;">'+(m.cantidad||0)+'</td>'+
      '<td style="text-align:right;font-weight:700;">'+money(m.total)+'</td>'+
      '<td>'+bEst(m.estado)+'</td>'+
      '<td><span class="b b-contado" style="font-size:10.5px;">'+esc(getNombreVendedor(m.vendedor_id))+'</span></td>'+
      '<td style="font-size:11px;color:var(--tl);">'+esc(m.notas&&m.notas.trim()?m.notas:'—')+'</td>'+
    '</tr>';
  }).join('');
  var first = movs[0];
  var html = '<div style="margin-bottom:.85rem;display:flex;gap:14px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--bd);padding-bottom:.8rem;">'+
    '<div style="width:42px;height:42px;border-radius:50%;background:#ede9fe;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;">'+esc(vet.charAt(0).toUpperCase())+'</div>'+
    '<div><div style="font-weight:800;font-size:16px;">'+esc(vet)+'</div>'+
      '<div style="font-size:11px;color:var(--tl);">'+(first.zona?'📍 '+esc(normZona(first.zona)):'')+(first.doctora?' · '+esc(first.doctora):'')+'</div></div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-left:auto;">'+
      '<div style="text-align:center;"><div style="font-size:10px;color:var(--tl);font-weight:700;">VISITAS</div><div style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--brand);">'+nVisitas+'</div></div>'+
      '<div style="text-align:center;"><div style="font-size:10px;color:var(--tl);font-weight:700;">COMPRAS</div><div style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--ok);">'+nCompras+'</div></div>'+
      '<div style="text-align:center;"><div style="font-size:10px;color:var(--tl);font-weight:700;">CRÉDITOS</div><div style="font-family:Bebas Neue,sans-serif;font-size:20px;color:#d97706;">'+nCreditos+'</div></div>'+
      '<div style="text-align:center;"><div style="font-size:10px;color:var(--tl);font-weight:700;">INGRESO</div><div style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--ok);">'+money(ingreso)+'</div></div>'+
      (credOtorgado>0?'<div style="text-align:center;"><div style="font-size:10px;color:var(--tl);font-weight:700;">CRÉD. OTORG.</div><div style="font-family:Bebas Neue,sans-serif;font-size:20px;color:#d97706;">'+money(credOtorgado)+'</div></div>':'')+
    '</div>'+
  '</div>'+
  '<table style="width:100%;border-collapse:collapse;font-size:12.5px;">'+
    '<thead><tr style="background:var(--sky4);"><th style="padding:8px;text-align:left;">Fecha</th><th style="padding:8px;text-align:left;">Movimiento</th><th style="padding:8px;text-align:left;">Producto</th><th style="padding:8px;text-align:center;">Cant.</th><th style="padding:8px;text-align:right;">Total</th><th style="padding:8px;text-align:left;">Estado</th><th style="padding:8px;text-align:left;">Vendedor</th><th style="padding:8px;text-align:left;">Notas</th></tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
  '</table>';
  gel('an-dist-titulo').textContent = '🆕 '+vet+' · '+anLabelMes(periodo);
  gel('an-dist-body').innerHTML = html;
  abrirModal('modal-an-distrito');
}

function anVerDetalleDistrito(periodo, zona, vendId){
  var grupos = anVisitasUnicas(periodo, vendId).filter(function(g){return (g.zona||'(sin zona)')===zona;});
  if(!grupos.length){ setSt('Sin visitas en '+zona,'er'); return; }
  // Ordenar por fecha desc
  grupos.sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');});
  var rows = grupos.map(function(g){
    var c=anClasificaGrupo(g);
    var clase = c.conVenta?'<span class="b b-pagado">✅ Venta</span>':(c.soloVisita?'<span class="b b-visita">👀 Solo visita</span>':(c.credito?'<span class="b b-credito">💳 Crédito</span>':(c.cobro?'<span class="b b-contado">💰 Cobro</span>':'<span class="b">—</span>')));
    // Calcular ingreso real (solo pagados)
    var ingreso=anIngresoNeto(g.movimientos);
    // Detallar productos/movimientos
    var movsHtml = g.movimientos.map(function(m){
      var label = m.movimiento||'';
      if(m.producto) label += ' · '+m.producto+(m.cantidad?' ×'+m.cantidad:'');
      return '<span style="display:inline-block;font-size:10.5px;background:var(--sky4);color:var(--brand);padding:2px 6px;border-radius:8px;margin:1px 2px 1px 0;border:1px solid var(--sky);">'+esc(label)+'</span>';
    }).join('');
    return '<tr>'+
      '<td style="white-space:nowrap;">'+fmt(g.fecha)+'</td>'+
      '<td style="font-weight:600;">'+esc(g.veterinaria||'—')+'</td>'+
      '<td>'+esc(g.doctora||'—')+'</td>'+
      '<td><span class="b b-contado" style="font-size:10.5px;">'+esc(getNombreVendedor(g.vendedor_id))+'</span></td>'+
      '<td>'+clase+'</td>'+
      '<td style="font-size:11px;line-height:1.6;">'+movsHtml+'</td>'+
      '<td style="text-align:right;font-weight:700;color:'+(ingreso>0?'var(--ok)':'var(--tl)')+';">'+money(ingreso)+'</td>'+
    '</tr>';
  }).join('');
  var totalIngreso = grupos.reduce(function(s,g){
    return s+anIngresoNeto(g.movimientos);
  },0);
  var titulo = '📍 '+zona+' · '+anLabelMes(periodo);
  var html = '<div style="margin-bottom:.85rem;display:flex;gap:14px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--bd);padding-bottom:.7rem;">'+
    '<div><div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;">Visitas</div><div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--brand);">'+grupos.length+'</div></div>'+
    '<div><div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;">Ingreso real</div><div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--ok);">'+money(totalIngreso)+'</div></div>'+
  '</div>'+
  '<table style="width:100%;border-collapse:collapse;font-size:12.5px;">'+
    '<thead><tr style="background:var(--sky4);"><th style="padding:8px;text-align:left;">Fecha</th><th style="padding:8px;text-align:left;">Veterinaria</th><th style="padding:8px;text-align:left;">Doctor(a)</th><th style="padding:8px;text-align:left;">Vendedor</th><th style="padding:8px;text-align:left;">Resultado</th><th style="padding:8px;text-align:left;">Detalle de movimientos</th><th style="padding:8px;text-align:right;">Ingreso</th></tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
  '</table>';
  gel('an-dist-titulo').textContent = titulo;
  gel('an-dist-body').innerHTML = html;
  abrirModal('modal-an-distrito');
}

var _anRentTab = 'comp';
function anRentTab(t){
  _anRentTab = t;
  var tc=gel('an-tab-comp'), tm=gel('an-tab-mes');
  if(tc){ tc.classList.remove('btn-p'); tc.classList.remove('btn-s'); tc.classList.add(t==='comp'?'btn-p':'btn-s'); }
  if(tm){ tm.classList.remove('btn-p'); tm.classList.remove('btn-s'); tm.classList.add(t==='mes'?'btn-p':'btn-s'); }
  rRentabilidadVend();
}

function rRentabilidadVend(){
  anInitPeriodos();
  var mesA = _anPeriodos[0];
  var mesB = _anPeriodos[_anPeriodos.length-1];
  // Ahora usa el filtro global (an-vendedor) en vez de su propio selector
  var vendId = gel('an-vendedor') ? gel('an-vendedor').value : '';
  var el = gel('an-rentabilidad');
  if(!el) return;
  // Ocultar tabs si no hay vendedor seleccionado
  var tabsEl = gel('an-rent-tabs');
  if(tabsEl) tabsEl.style.display = vendId?'flex':'none';

  if(!vendId){
    el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--tl);font-size:13px;">📌 Selecciona un vendedor en el filtro superior para ver su detalle</div>';
    return;
  }
  if(_anRentTab==='mes'){ return anRentMesPorMes(vendId); }
  var vend = null;
  for(var i=0;i<_vendedores.length;i++){ if(String(_vendedores[i].id)===String(vendId)){vend=_vendedores[i];break;} }
  if(!vend){el.innerHTML='';return;}

  var vB = anVentasRealesDe(mesB, vendId);
  var vA = anVentasRealesDe(mesA, vendId);
  var totB = anIngresoDe(mesB, vendId);
  var totA = anIngresoDe(mesA, vendId);
  var credTot = anCreditosTotales(vendId);
  var credVenc = credTot.filter(function(x){return x.estado==='❌ Vencido';});
  var credPend = credTot.filter(function(x){return x.estado==='⏳ Pendiente';});
  var credSum = anSumTotal(credTot);
  var devB2 = anSumTotal(anDevolDe(mesB, vendId));
  var tickB = vB.length>0 ? totB/vB.length : 0;
  var tickA = vA.length>0 ? totA/vA.length : 0;
  var cartMes = anSumTotal(anCarteraDe(mesB, vendId));
  var morBase = totB + cartMes;
  var morPct = morBase>0 ? Math.round(cartMes/morBase*100) : 0;
  var nivel = anNivelVendedor(totB);
  var d2 = anDelta(totA, totB);
  var contadoB2 = anSumTotal(vB.filter(function(v){var mt=(v.movimiento||'').toLowerCase();return mt.indexOf('contado')>-1||mt.indexOf('delivery')>-1;}));
  var cobrosB2  = anSumTotal(vB.filter(function(v){var mt=(v.movimiento||'').toLowerCase();return mt.indexOf('cobro')>-1;}));

  var cards = [
    {icon:'💰', lbl:'Ventas '+anLabelMes(mesB), val:money(totB), sub:vB.length+' transacciones', delta:d2, color:'var(--brand)'},
    {icon:'📋', lbl:'Créditos Pendientes', val:money(credSum), sub:credVenc.length+' vencidos · '+credPend.length+' pendientes', delta:null, color:'#d97706'},
    {icon:'🎯', lbl:'Ticket Promedio '+anLabelMes(mesB), val:money(tickB), sub:'vs '+money(tickA), delta:anDelta(tickA,tickB), color:'#1e6e77'},
    {icon:'⚠️', lbl:'Morosidad '+anLabelMes(mesB), val:morPct+'%', sub:money(cartMes)+' sin cobrar', delta:null, color:morPct>30?'var(--er)':morPct>15?'#d97706':'var(--ok)'},
  ];

  var headerHtml='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:.85rem;">'+
    '<div class="an-vend-avatar" style="width:40px;height:40px;font-size:16px;">'+vend.nombre.charAt(0)+'</div>'+
    '<div><div style="font-weight:800;font-size:15px;">'+vend.nombre+'</div>'+
      '<div style="font-size:12px;color:var(--tl);">'+anLabelMes(mesA)+' → '+anLabelMes(mesB)+'</div></div>'+
    (nivel?'<span style="font-size:11px;padding:3px 9px;border-radius:12px;background:'+nivel.color+'22;color:'+nivel.color+';font-weight:700;border:1px solid '+nivel.color+'44;margin-left:auto;">'+nivel.emoji+' '+nivel.nombre+'</span>':'')+
    anDeltaHtml(d2)+
  '</div>';

  var cardsHtml='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:1rem;">'+
    cards.map(function(c){
      return '<div style="background:var(--bg);border:1.5px solid var(--bd);border-radius:var(--r);padding:.9rem 1rem;">'+
        '<div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:.35rem;">'+c.icon+' '+c.lbl+'</div>'+
        '<div style="font-size:1.4rem;font-weight:800;color:'+c.color+';line-height:1.1;margin-bottom:.2rem;">'+c.val+'</div>'+
        '<div style="font-size:11px;color:var(--tl);">'+c.sub+'</div>'+
        (c.delta!==null?'<div style="margin-top:.25rem;">'+anDeltaHtml(c.delta)+'</div>':'')+
      '</div>';
    }).join('')+
  '</div>';

  var compHtml = (contadoB2+cobrosB2)>0
    ? '<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.75rem 1rem;font-size:12px;">'+
        '<div style="font-weight:700;color:#1e6e77;margin-bottom:.4rem;">Composición ventas — '+anLabelMes(mesB)+'</div>'+
        '<div style="display:flex;gap:16px;flex-wrap:wrap;">'+
          '<span>💵 Contado/Delivery: <strong>'+money(contadoB2)+'</strong></span>'+
          '<span>🔄 Cobros crédito: <strong>'+money(cobrosB2)+'</strong></span>'+
          (devB2>0?'<span>↩ Devoluciones: <strong style="color:var(--er);">−'+money(devB2)+'</strong></span>':'')+
        '</div>'+
      '</div>'
    : '';

  el.innerHTML = headerHtml + cardsHtml + compHtml;
}

function anRenderTableroUnificado(periodo, vendId){
  var rows = anTableroUnificadoPorZona(periodo, vendId);
  var lbl = gel('an-unif-label');
  if(lbl) lbl.textContent = anLabelMes(periodo)+(vendId?' · '+esc(getNombreVendedor(vendId)):'');
  var el = gel('an-tabla-unificada');
  if(!el) return;
  if(!rows.length){ el.innerHTML='<div style="padding:1.5rem;text-align:center;color:var(--tl);font-size:13px;">Sin datos por zona en este período</div>'; return; }
  // Totales
  var tot={visitas:0,vets:0,contado:0,delivery:0,cobros:0,credOto:0,credOtoMonto:0,credPend:0,credPendMonto:0,ingreso:0,dev:0};
  rows.forEach(function(r){
    tot.visitas+=r.visitas; tot.vets+=r.vetsCount;
    tot.contado+=r.contado; tot.delivery+=r.delivery; tot.cobros+=r.cobros;
    tot.credOto+=r.creditosOtorgados; tot.credOtoMonto+=r.creditosOtorMonto;
    tot.credPend+=r.creditosPendActivos; tot.credPendMonto+=r.creditosPendMonto;
    tot.ingreso+=r.ingreso; tot.dev+=r.devoluciones;
  });
  var trs = rows.map(function(r){
    return '<tr>'+
      '<td style="font-weight:700;">📍 '+esc(r.zona)+'</td>'+
      '<td style="text-align:center;"><strong>'+r.visitas+'</strong><div style="font-size:10px;color:var(--tl);">'+r.vetsCount+' vetes</div></td>'+
      '<td style="text-align:right;color:#2d7a3a;"><strong>'+money(r.contado)+'</strong></td>'+
      '<td style="text-align:right;color:#7c3aed;">'+money(r.delivery)+'</td>'+
      '<td style="text-align:right;color:#0891b2;"><strong>'+money(r.cobros)+'</strong></td>'+
      '<td style="text-align:center;color:#d97706;">'+r.creditosOtorgados+'<div style="font-size:10px;">'+money(r.creditosOtorMonto)+'</div></td>'+
      '<td style="text-align:center;color:#dc2626;"><strong>'+r.creditosPendActivos+'</strong><div style="font-size:10px;color:#dc2626;">'+money(r.creditosPendMonto)+'</div></td>'+
      '<td style="text-align:right;color:var(--er);">'+(r.devoluciones>0?'−'+money(r.devoluciones):'—')+'</td>'+
      '<td style="text-align:right;font-weight:700;color:var(--brand);font-size:13px;">'+money(r.ingreso)+'</td>'+
    '</tr>';
  }).join('');
  var totalRow = '<tr style="background:#f8fafc;font-weight:700;border-top:2px solid var(--brand);">'+
    '<td style="font-weight:800;">TOTAL</td>'+
    '<td style="text-align:center;">'+tot.visitas+'</td>'+
    '<td style="text-align:right;color:#2d7a3a;">'+money(tot.contado)+'</td>'+
    '<td style="text-align:right;color:#7c3aed;">'+money(tot.delivery)+'</td>'+
    '<td style="text-align:right;color:#0891b2;">'+money(tot.cobros)+'</td>'+
    '<td style="text-align:center;color:#d97706;">'+tot.credOto+'<div style="font-size:10px;">'+money(tot.credOtoMonto)+'</div></td>'+
    '<td style="text-align:center;color:#dc2626;">'+tot.credPend+'<div style="font-size:10px;">'+money(tot.credPendMonto)+'</div></td>'+
    '<td style="text-align:right;color:var(--er);">'+(tot.dev>0?'−'+money(tot.dev):'—')+'</td>'+
    '<td style="text-align:right;font-weight:800;color:var(--brand);">'+money(tot.ingreso)+'</td>'+
  '</tr>';
  el.innerHTML = '<table>'+
    '<thead><tr>'+
      '<th>Zona</th>'+
      '<th style="text-align:center;">Visitas</th>'+
      '<th style="text-align:right;">Contado</th>'+
      '<th style="text-align:right;">Delivery</th>'+
      '<th style="text-align:right;">Cobros</th>'+
      '<th style="text-align:center;">Créd. otorg.</th>'+
      '<th style="text-align:center;">Créd. pend.</th>'+
      '<th style="text-align:right;">Devol.</th>'+
      '<th style="text-align:right;">Ingreso</th>'+
    '</tr></thead><tbody>'+trs+totalRow+'</tbody></table>';
}

// ── ALERTA: VETERINARIAS POR QUEDARSE SIN PRODUCTO ──
function anRenderStockAlerta(){
  var el = gel('an-stock-alerta');
  if(!el) return;
  var umbralInput = gel('an-stock-umbral');
  var umbral = umbralInput ? (parseInt(umbralInput.value)||3) : 3;

  // Para cada veterinaria, calcular cuánto de cada producto tiene en crédito pendiente
  // y cuánto ha comprado en total (como proxy de consumo)
  var vetMap = {};
  (_ventas||[]).forEach(function(v){
    var vet = (v.veterinaria||'').trim();
    var prod = (v.producto||'').trim();
    if(!vet||!prod) return;
    if(!vetMap[vet]) vetMap[vet] = {};
    if(!vetMap[vet][prod]) vetMap[vet][prod] = {pendiente:0, pagado:0};
    var m = (v.movimiento||'').toLowerCase();
    var isPend = (v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido');
    // Crédito pendiente = stock en poder de la vet no cobrado aún
    if(m.indexOf('credito')>=0 && isPend){
      vetMap[vet][prod].pendiente += (v.cantidad||1);
    }
    // Pagado = vendido confirmado
    if(v.estado==='✅ Pagado'){
      vetMap[vet][prod].pagado += (v.cantidad||1);
    }
  });

  // Detectar veterinarias con poca cantidad pendiente (se están quedando sin stock)
  var alertas = [];
  Object.keys(vetMap).forEach(function(vet){
    var prods = vetMap[vet];
    var prodsBajos = [];
    Object.keys(prods).forEach(function(prod){
      var d = prods[prod];
      // Si tiene crédito pendiente pero pocas unidades, o si su promedio comprado es alto pero el pendiente es bajo
      if(d.pendiente > 0 && d.pendiente <= umbral){
        prodsBajos.push({prod:prod, pendiente:d.pendiente, pagado:d.pagado});
      }
    });
    if(prodsBajos.length) alertas.push({vet:vet, prods:prodsBajos});
  });

  if(!alertas.length){
    el.innerHTML = '<div style="padding:1.2rem;text-align:center;color:var(--tl);font-size:13px;">✅ Ninguna veterinaria en alerta (umbral: '+umbral+' uds)</div>';
    return;
  }

  // Ordenar por nombre
  alertas.sort(function(a,b){return a.vet.localeCompare(b.vet);});

  var html = '<div style="padding:.5rem;">';
  alertas.forEach(function(a){
    html += '<div style="border:1.5px solid #f59e0b;border-radius:10px;padding:.6rem 1rem;margin-bottom:.5rem;background:#fffbeb;">'+
      '<div style="font-weight:700;font-size:13px;margin-bottom:.35rem;">🏥 '+esc(a.vet)+'</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:.4rem;">';
    a.prods.forEach(function(p){
      var urgencia = p.pendiente <= 1 ? '#dc2626' : (p.pendiente <= 2 ? '#f59e0b' : '#78716c');
      html += '<span style="font-size:11px;background:'+urgencia+'22;color:'+urgencia+';border:1px solid '+urgencia+'44;border-radius:6px;padding:2px 8px;font-weight:700;">'+
        '📦 '+esc(p.prod)+': <strong>'+p.pendiente+' uds</strong> pendiente'+(p.pendiente>1?'s':'')+
      '</span>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function anRenderClientesInactivos(vendId){
  var dInput = gel('an-inact-dias');
  var diasUmbral = dInput && parseInt(dInput.value) || 45;
  var lista = anClientesInactivos(vendId, diasUmbral);
  var el = gel('an-inactivos');
  if(!el) return;
  if(!lista.length){
    el.innerHTML='<div style="padding:1.5rem;text-align:center;color:var(--ok);font-size:13px;">✅ No hay clientes inactivos con ≥'+diasUmbral+' días sin actividad</div>';
    return;
  }
  var totalMonto = lista.reduce(function(s,r){return s+r.totalHistorico;},0);
  var conCred = lista.filter(function(r){return r.creditosPend>0;});
  var sumPendiente = conCred.reduce(function(s,r){return s+r.creditoMonto;},0);
  // Banner resumen
  var banner = '<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:var(--r);padding:.7rem 1rem;margin:.8rem;font-size:12px;color:#92400e;">'+
    '⚠️ <strong>'+lista.length+' veterinarias inactivas</strong> con un valor histórico de '+money(totalMonto)+
    (conCred.length>0 ? ' · <strong style="color:#dc2626;">'+conCred.length+' tienen crédito pendiente</strong> ('+money(sumPendiente)+')' : '')+
  '</div>';
  var trs = lista.map(function(r){
    var motivoColor = r.creditosPend>0?'#dc2626':(r.diasInactivo>=120?'#7c3aed':(r.diasInactivo>=60?'#d97706':'#718096'));
    var motivoBg = r.creditosPend>0?'#fee2e2':(r.diasInactivo>=120?'#ede9fe':(r.diasInactivo>=60?'#fef3c7':'#f1f5f9'));
    return '<tr>'+
      '<td style="font-weight:700;">'+esc(r.vet)+'<div style="font-size:10px;color:var(--tl);font-weight:400;">'+(r.doctora?esc(r.doctora):'')+(r.zona?' · 📍 '+esc(r.zona):'')+'</div></td>'+
      '<td style="text-align:center;font-weight:700;color:'+(r.diasInactivo>=120?'#dc2626':(r.diasInactivo>=60?'#d97706':'#718096'))+'">'+r.diasInactivo+'d</td>'+
      '<td style="text-align:center;font-size:11px;color:var(--tl);">'+fmt(r.ultimaFecha)+'</td>'+
      '<td style="text-align:right;font-weight:700;">'+money(r.totalHistorico)+'<div style="font-size:10px;color:var(--tl);font-weight:400;">'+r.nMovs+' transacc</div></td>'+
      '<td><span style="background:'+motivoBg+';color:'+motivoColor+';padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600;display:inline-block;">'+esc(r.motivo)+'</span></td>'+
      '<td>'+(r.vendedor_id?'<span class="b b-contado" style="font-size:10px;">'+esc(getNombreVendedor(r.vendedor_id))+'</span>':'')+'</td>'+
    '</tr>';
  }).join('');
  el.innerHTML = banner +
    '<table><thead><tr>'+
      '<th>Veterinaria</th>'+
      '<th style="text-align:center;">Días inactivo</th>'+
      '<th style="text-align:center;">Última actividad</th>'+
      '<th style="text-align:right;">Valor histórico</th>'+
      '<th>Motivo</th>'+
      '<th>Vendedor</th>'+
    '</tr></thead><tbody>'+trs+'</tbody></table>';
}

function generarPDFAnaliticas(audiencia){
  anInitPeriodos();
  // Determinar filtros según la vista activa
  var filtVend, mesA, mesB, contexto;
  if(_anView === 'det'){
    filtVend = gel('an-det-vendedor')?gel('an-det-vendedor').value:'';
    var mesSel = gel('an-det-mes')?gel('an-det-mes').value:'';
    if(!filtVend || !mesSel){ setSt('Selecciona vendedor y mes en Detallado','er'); return; }
    mesA = mesSel; mesB = mesSel;
    contexto = 'detallado';
  } else if(_anView === 'gen'){
    filtVend = '';
    mesA = anAnioMesActual();
    mesB = anAnioMesActual();
    contexto = 'general';
  } else {
    filtVend = gel('an-vendedor')?gel('an-vendedor').value:'';
    mesA = _anPeriodos[0];
    mesB = _anPeriodos[_anPeriodos.length-1];
    contexto = 'comparativo';
  }
  var titulo = audiencia==='vendedor' ? 'Reporte de Vendedor' : 'Reporte Ejecutivo de Analíticas';
  var subt = filtVend ? getNombreVendedor(filtVend) : 'Todos los vendedores';
  if(contexto === 'detallado'){
    subt += ' · ' + anLabelMes(mesB) + ' (vista detallada)';
  } else if(contexto === 'general'){
    subt += ' · ' + anLabelMes(mesB) + ' (vista general)';
  } else {
    subt += ' · ' + _anPeriodos.map(anLabelMes).join(' vs ');
  }

  // ─ KPIs base
  var totA = anIngresoDe(mesA, filtVend);
  var totB = anIngresoDe(mesB, filtVend);
  var credTotB = anSumTotal(anCreditosTotales(filtVend));
  var vA = anVentasRealesDe(mesA, filtVend);
  var vB = anVentasRealesDe(mesB, filtVend);
  var visA = anVisitasDe(mesA, filtVend).length;
  var visB = anVisitasDe(mesB, filtVend).length;
  var tickB = vB.length>0?totB/vB.length:0;
  var convB = visB>0?Math.round(vB.length/visB*100):0;
  var d = anDelta(totA,totB);

  // ─ Visitas del periodo B
  var grupos = anVisitasUnicas(mesB, filtVend);
  var stats = {total:grupos.length, conVenta:0, soloVisita:0, credito:0, cobro:0, devol:0, ingreso:0};
  grupos.forEach(function(g){
    var c=anClasificaGrupo(g);
    if(c.conVenta) stats.conVenta++;
    if(c.soloVisita) stats.soloVisita++;
    if(c.credito) stats.credito++;
    if(c.cobro) stats.cobro++;
    if(c.devolucion) stats.devol++;
    stats.ingreso+=g.total||0;
  });
  var nuevas = anNuevasVetes(mesB, filtVend);
  var distritos = anVisitasPorDistrito(mesB, filtVend);
  var unificada = anTableroUnificadoPorZona(mesB, filtVend);
  var inactivos = anClientesInactivos(filtVend, 45);

  // ─ KPI cards (HTML)
  function kpi(lbl,val,sub,color){
    return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:14px 16px;">'+
      '<div style="font-size:10px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">'+esc(lbl)+'</div>'+
      '<div style="font-size:22px;font-weight:800;color:'+color+';font-family:Bebas Neue,sans-serif;letter-spacing:.5px;">'+esc(val)+'</div>'+
      '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">'+esc(sub)+'</div>'+
    '</div>';
  }
  var kpisHtml = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">'+
    kpi('Ventas '+anLabelMes(mesB), money(totB), vB.length+' transacc · '+(d>=0?'▲':'▼')+Math.abs(d)+'%', '#253C61')+
    kpi('Ventas '+anLabelMes(mesA), money(totA), vA.length+' transacc', '#1e6e77')+
    kpi('Ticket Promedio', money(tickB), 'por venta', '#1e6e77')+
    kpi('Créditos Pendientes', money(credTotB), 'acumulado', '#d97706')+
  '</div>';

  // ─ Visitas cards
  var visHtml = '<div style="margin-top:20px;"><h2 style="font-size:14px;color:#253C61;margin-bottom:10px;border-bottom:2px solid #253C61;padding-bottom:4px;">Actividad de Visitas — '+anLabelMes(mesB)+'</h2>'+
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">'+
      kpi('Total Visitas', String(stats.total), 'visitas únicas', '#253C61')+
      kpi('→ Venta', String(stats.conVenta), convB+'% conversión', '#2d7a3a')+
      kpi('→ Crédito', String(stats.credito), 'créditos otorgados', '#d97706')+
      kpi('→ Cobro', String(stats.cobro), 'cobros realizados', '#0891b2')+
      kpi('Solo Visita', String(stats.soloVisita), 'sin venta', '#718096')+
      kpi('Nuevas Vetes', String(nuevas.length), 'primera visita', '#7c3aed')+
      kpi('Ingreso Visitas', money(stats.ingreso), 'total cobrado', '#1e6e77')+
      kpi('Devoluciones', String(stats.devol), 'devoluciones', '#c0392b')+
    '</div></div>';

  // ─ Tabla distritos
  var distRows = distritos.map(function(d,i){
    var rank = i===0?'🥇':(i===1?'🥈':(i===2?'🥉':''));
    return '<tr><td>'+rank+' '+esc(d.zona)+'</td><td style="text-align:center;"><strong>'+d.total+'</strong></td>'+
      '<td style="text-align:center;color:#2d7a3a;">'+d.conVenta+'</td>'+
      '<td style="text-align:center;color:#718096;">'+d.soloVisita+'</td>'+
      '<td style="text-align:center;color:#d97706;">'+d.credito+'</td>'+
      '<td style="text-align:center;color:#0891b2;">'+d.cobro+'</td>'+
      '<td style="text-align:right;font-weight:700;">'+money(d.ingreso)+'</td></tr>';
  }).join('');
  var distHtml = '<div style="margin-top:20px;"><h2 style="font-size:14px;color:#253C61;margin-bottom:10px;border-bottom:2px solid #253C61;padding-bottom:4px;">Visitas por Distrito</h2>'+
    (distRows ? '<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="background:#253C61;color:#fff;"><th style="padding:6px 8px;text-align:left;">Distrito</th><th>Visitas</th><th>→Venta</th><th>Solo visita</th><th>→Crédito</th><th>→Cobro</th><th style="text-align:right;padding-right:8px;">Ingreso</th></tr></thead><tbody>'+distRows+'</tbody></table>' : '<div style="color:#94a3b8;padding:10px;">Sin visitas</div>')+
  '</div>';

  // ─ Tablero unificado por zona
  var unifHtml = '';
  if(unificada.length){
    var uRows = unificada.map(function(r){
      return '<tr><td><strong>'+esc(r.zona)+'</strong></td><td style="text-align:center;">'+r.visitas+' ('+r.vetsCount+' vetes)</td>'+
        '<td style="text-align:right;color:#2d7a3a;">'+money(r.contado)+'</td>'+
        '<td style="text-align:right;color:#7c3aed;">'+money(r.delivery)+'</td>'+
        '<td style="text-align:right;color:#0891b2;">'+money(r.cobros)+'</td>'+
        '<td style="text-align:center;color:#d97706;">'+r.creditosOtorgados+' / '+money(r.creditosOtorMonto)+'</td>'+
        '<td style="text-align:center;color:#dc2626;">'+r.creditosPendActivos+' / '+money(r.creditosPendMonto)+'</td>'+
        '<td style="text-align:right;font-weight:700;">'+money(r.ingreso)+'</td></tr>';
    }).join('');
    unifHtml = '<div style="margin-top:20px;page-break-inside:avoid;"><h2 style="font-size:14px;color:#253C61;margin-bottom:10px;border-bottom:2px solid #253C61;padding-bottom:4px;">🗺️ Tablero Unificado por Zona</h2>'+
      '<table style="width:100%;border-collapse:collapse;font-size:10px;"><thead><tr style="background:#253C61;color:#fff;"><th style="padding:5px;text-align:left;">Zona</th><th>Visitas</th><th style="text-align:right;padding-right:6px;">Contado</th><th style="text-align:right;padding-right:6px;">Delivery</th><th style="text-align:right;padding-right:6px;">Cobros</th><th>Créd. otorg.</th><th>Créd. pend.</th><th style="text-align:right;padding-right:6px;">Ingreso</th></tr></thead><tbody>'+uRows+'</tbody></table></div>';
  }

  // ─ Clientes inactivos
  var inactHtml = '';
  if(inactivos.length){
    var iRows = inactivos.slice(0,30).map(function(r){
      return '<tr><td><strong>'+esc(r.vet)+'</strong><div style="font-size:9px;color:#94a3b8;">'+esc(r.zona||'')+'</div></td>'+
        '<td style="text-align:center;color:'+(r.diasInactivo>=120?'#dc2626':(r.diasInactivo>=60?'#d97706':'#718096'))+';font-weight:700;">'+r.diasInactivo+'d</td>'+
        '<td style="text-align:center;font-size:10px;">'+fmt(r.ultimaFecha)+'</td>'+
        '<td style="text-align:right;font-weight:700;">'+money(r.totalHistorico)+'</td>'+
        '<td style="font-size:10px;">'+esc(r.motivo)+'</td></tr>';
    }).join('');
    inactHtml = '<div style="margin-top:20px;page-break-inside:avoid;"><h2 style="font-size:14px;color:#253C61;margin-bottom:10px;border-bottom:2px solid #253C61;padding-bottom:4px;">🥶 Clientes Inactivos (top 30)</h2>'+
      '<table style="width:100%;border-collapse:collapse;font-size:10px;"><thead><tr style="background:#92400e;color:#fff;"><th style="padding:5px;text-align:left;">Veterinaria</th><th>Días</th><th>Última actividad</th><th style="text-align:right;padding-right:6px;">Valor histórico</th><th style="text-align:left;padding-left:6px;">Motivo</th></tr></thead><tbody>'+iRows+'</tbody></table></div>';
  }

  // ─ Nuevas veterinarias
  var nuevasHtml = '';
  if(nuevas.length){
    var nRows = nuevas.map(function(vet){
      var primera = _ventas.filter(function(v){return v.veterinaria===vet && (!filtVend||String(v.vendedor_id)===String(filtVend));}).sort(function(a,b){return (a.fecha||'').localeCompare(b.fecha||'');})[0];
      return '<tr><td><strong>'+esc(vet)+'</strong></td><td>'+esc(primera&&primera.zona||'—')+'</td><td>'+esc(primera&&primera.doctora||'—')+'</td><td>'+esc(getNombreVendedor(primera&&primera.vendedor_id||''))+'</td><td>'+(primera?fmt(primera.fecha):'—')+'</td></tr>';
    }).join('');
    nuevasHtml = '<div style="margin-top:20px;page-break-inside:avoid;"><h2 style="font-size:14px;color:#253C61;margin-bottom:10px;border-bottom:2px solid #253C61;padding-bottom:4px;">🆕 Nuevas Veterinarias ('+nuevas.length+')</h2>'+
      '<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="background:#7c3aed;color:#fff;"><th style="padding:6px 8px;text-align:left;">Veterinaria</th><th>Distrito</th><th>Doctor(a)</th><th>Vendedor</th><th>Primera visita</th></tr></thead><tbody>'+nRows+'</tbody></table></div>';
  }

  // ─ Comparativa períodos vendedores (gerencia)
  var rankHtml='';
  if(audiencia==='gerencia' && !filtVend){
    var rankRows=_vendedores.map(function(v){
      var per = _anPeriodos.map(function(m){return anIngresoDe(m,v.id);});
      return {nombre:v.nombre, per:per, cred:anSumTotal(anCreditosTotales(v.id))};
    }).filter(function(r){return r.per.some(function(x){return x>0;});}).sort(function(a,b){return b.per[b.per.length-1]-a.per[a.per.length-1];});
    var headers = _anPeriodos.map(function(m){return '<th style="text-align:right;padding-right:8px;">'+anLabelMes(m)+'</th>';}).join('');
    var rrows = rankRows.map(function(r,i){
      var cells = r.per.map(function(x){return '<td style="text-align:right;padding-right:8px;">'+money(x)+'</td>';}).join('');
      return '<tr><td><strong>#'+(i+1)+'</strong></td><td><strong>'+esc(r.nombre)+'</strong></td>'+cells+'<td style="text-align:right;color:#d97706;">'+money(r.cred)+'</td></tr>';
    }).join('');
    rankHtml = '<div style="margin-top:20px;page-break-before:always;"><h2 style="font-size:14px;color:#253C61;margin-bottom:10px;border-bottom:2px solid #253C61;padding-bottom:4px;">Ranking de Vendedores (todos los períodos)</h2>'+
      '<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="background:#253C61;color:#fff;"><th>#</th><th style="padding:6px 8px;text-align:left;">Vendedor</th>'+headers+'<th style="text-align:right;padding-right:8px;">Créd. pend.</th></tr></thead><tbody>'+rrows+'</tbody></table></div>';
  }

  // ─ Capturar gráficos del canvas
  var _chartImgs = {};
  ['an-chart-evolucion','an-chart-meses','an-chart-zonas','an-cat-chart'].forEach(function(id){
    var canvas = gel(id);
    if(canvas && canvas.toDataURL) try { _chartImgs[id] = canvas.toDataURL('image/png'); } catch(e){}
  });
  var chartsHtml = '';
  if(_chartImgs['an-chart-evolucion'] || _chartImgs['an-chart-meses']){
    chartsHtml += '<div style="margin-top:20px;page-break-inside:avoid;"><h2 style="font-size:14px;color:#253C61;margin-bottom:10px;border-bottom:2px solid #253C61;padding-bottom:4px;">Evolución y Comparativa</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
    if(_chartImgs['an-chart-evolucion']) chartsHtml += '<img src="'+_chartImgs['an-chart-evolucion']+'" style="width:100%;border-radius:6px;border:1px solid #e2e8f0;"/>';
    if(_chartImgs['an-chart-meses']) chartsHtml += '<img src="'+_chartImgs['an-chart-meses']+'" style="width:100%;border-radius:6px;border:1px solid #e2e8f0;"/>';
    chartsHtml += '</div></div>';
  }
  if(_chartImgs['an-chart-zonas'] || _chartImgs['an-cat-chart']){
    chartsHtml += '<div style="margin-top:16px;page-break-inside:avoid;display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
    if(_chartImgs['an-chart-zonas']) chartsHtml += '<img src="'+_chartImgs['an-chart-zonas']+'" style="width:100%;border-radius:6px;border:1px solid #e2e8f0;"/>';
    if(_chartImgs['an-cat-chart']) chartsHtml += '<img src="'+_chartImgs['an-cat-chart']+'" style="width:100%;border-radius:6px;border:1px solid #e2e8f0;"/>';
    chartsHtml += '</div>';
  }

  // ─ Construcción
  var w = window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8">'+_pdfFavicon()+'<title>'+esc(titulo)+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;color:#1a202c;}table th,table td{padding:5px 8px;border-bottom:1px solid #e2e8f0;}table th{background:#253C61;color:#fff;font-weight:600;font-size:11px;}.wrap{padding:20px 32px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>'+
    _pdfHeader(titulo, subt) +
    '<div class="wrap">' + kpisHtml + chartsHtml + visHtml + unifHtml + distHtml + nuevasHtml + inactHtml + rankHtml +
    '<div style="margin-top:24px;font-size:10px;color:#94a3b8;text-align:right;">Generado: '+new Date().toLocaleString('es-PE')+' · Suplevet · Control Total</div>'+
    '</div><script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>');
  w.document.close();
}

function anRentMesPorMes(vendId){
  var vend = _vendedores.filter(function(v){return String(v.id)===String(vendId);})[0];
  if(!vend) return;
  var el = gel('an-rentabilidad');
  // Detectar todos los meses con actividad del vendedor
  var setMeses = {};
  _ventas.forEach(function(v){
    if(!v.fecha) return;
    if(String(v.vendedor_id)!==String(vendId)) return;
    if(v.estado==='Anulado') return;
    setMeses[String(v.fecha).substring(0,7)] = 1;
  });
  var meses = Object.keys(setMeses).sort().reverse(); // más recientes primero
  if(!meses.length){
    el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--tl);font-size:13px;">Sin movimientos históricos del vendedor</div>';
    return;
  }
  // Calcular cada mes
  var filas = meses.map(function(m){
    var vts = anVentasRealesDe(m, vendId);
    var ingreso = anIngresoDe(m, vendId);
    var devM = anSumTotal(anDevolDe(m, vendId));
    var visitasM = anVisitasUnicas(m, vendId).length;
    var contado = anSumTotal(vts.filter(function(v){var n=movNorm(v.movimiento); return n==='venta al contado';}));
    var delivery = anSumTotal(vts.filter(function(v){var n=movNorm(v.movimiento); return n==='venta delivery';}));
    var cobros = anSumTotal(vts.filter(function(v){var n=movNorm(v.movimiento); return n==='cobro de credito';}));
    var credOto = anSumTotal(_ventas.filter(function(v){
      if(String(v.vendedor_id)!==String(vendId)) return false;
      if(!esCredito15(v.movimiento)) return false;
      if(!v.fecha||String(v.fecha).substring(0,7)!==m) return false;
      return v.estado!=='Anulado';
    }));
    var tick = vts.length>0?ingreso/vts.length:0;
    var conv = visitasM>0?Math.round(vts.length/visitasM*100):0;
    return {m:m, ingreso:ingreso, contado:contado, delivery:delivery, cobros:cobros, credOto:credOto, devol:devM, visitas:visitasM, ventas:vts.length, ticket:tick, conv:conv};
  });
  // Compara cada fila con la anterior (mes inmediatamente posterior cronológicamente)
  var rowsHtml = filas.map(function(r, i){
    var prev = filas[i+1]; // siguiente en el array = mes anterior cronológicamente
    var d = prev?anDelta(prev.ingreso, r.ingreso):null;
    return '<tr>'+
      '<td style="font-weight:700;">'+anLabelMes(r.m)+'</td>'+
      '<td style="text-align:right;font-weight:700;color:var(--brand);">'+money(r.ingreso)+(d!==null?' <span style="font-size:10px;">'+anDeltaHtml(d)+'</span>':'')+'</td>'+
      '<td style="text-align:right;color:#2d7a3a;">'+money(r.contado)+'</td>'+
      '<td style="text-align:right;color:#7c3aed;">'+money(r.delivery)+'</td>'+
      '<td style="text-align:right;color:#0891b2;">'+money(r.cobros)+'</td>'+
      '<td style="text-align:right;color:#d97706;">'+money(r.credOto)+'</td>'+
      '<td style="text-align:right;color:var(--er);">'+(r.devol>0?'−'+money(r.devol):'—')+'</td>'+
      '<td style="text-align:center;">'+r.visitas+'</td>'+
      '<td style="text-align:center;font-weight:600;">'+r.ventas+'</td>'+
      '<td style="text-align:center;">'+r.conv+'%</td>'+
      '<td style="text-align:right;font-style:italic;color:#64748b;">'+money(r.ticket)+'</td>'+
    '</tr>';
  }).join('');
  // Totales
  var totIng = filas.reduce(function(s,r){return s+r.ingreso;},0);
  var totVis = filas.reduce(function(s,r){return s+r.visitas;},0);
  var totVen = filas.reduce(function(s,r){return s+r.ventas;},0);
  var totDev = filas.reduce(function(s,r){return s+r.devol;},0);

  var headerHtml = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:1rem;">'+
    '<div class="an-vend-avatar" style="width:40px;height:40px;font-size:16px;">'+esc(vend.nombre.charAt(0))+'</div>'+
    '<div><div style="font-weight:800;font-size:15px;">'+esc(vend.nombre)+'</div>'+
      '<div style="font-size:12px;color:var(--tl);">Historial mes a mes · '+meses.length+' meses con actividad</div></div>'+
    '<div style="display:flex;gap:10px;margin-left:auto;flex-wrap:wrap;">'+
      '<div style="text-align:center;"><div style="font-size:10px;color:var(--tl);">INGRESO HISTÓRICO</div><div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--ok);">'+money(totIng)+'</div></div>'+
      '<div style="text-align:center;"><div style="font-size:10px;color:var(--tl);">VISITAS HISTÓRICAS</div><div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--brand);">'+totVis+'</div></div>'+
      '<div style="text-align:center;"><div style="font-size:10px;color:var(--tl);">VENTAS HISTÓRICAS</div><div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--brand);">'+totVen+'</div></div>'+
    '</div>'+
  '</div>';

  el.innerHTML = headerHtml +
    '<div class="tw" style="border:1px solid var(--bd);border-radius:var(--r);"><table style="font-size:12.5px;">'+
      '<thead><tr style="background:var(--sky4);">'+
        '<th>Mes</th>'+
        '<th style="text-align:right;">Ingreso</th>'+
        '<th style="text-align:right;">Contado</th>'+
        '<th style="text-align:right;">Delivery</th>'+
        '<th style="text-align:right;">Cobros</th>'+
        '<th style="text-align:right;">Créd. otorg.</th>'+
        '<th style="text-align:right;">Devol.</th>'+
        '<th style="text-align:center;">Visitas</th>'+
        '<th style="text-align:center;">Ventas</th>'+
        '<th style="text-align:center;">Conv.</th>'+
        '<th style="text-align:right;">Ticket prom.</th>'+
      '</tr></thead>'+
      '<tbody>'+rowsHtml+'</tbody>'+
    '</table></div>'+
    '<div style="font-size:11px;color:var(--tl);margin-top:.6rem;">💡 La columna de variación compara cada mes con el mes anterior cronológicamente.</div>';
}

// ══════════ VISTA CATEGORÍAS ══════════
function anRenderCategorias(){
  var mesEl = gel('an-cat-mes');
  var mes = (mesEl && mesEl.value) ? mesEl.value : anAnioMesActual();
  if(mesEl && !mesEl.value) mesEl.value = mes;

  var body = gel('an-cat-body');
  if(!body) return;

  if(!_segmentos || !_segmentos.length){
    body.innerHTML='<div style="padding:2rem;text-align:center;color:var(--tl);font-size:13px;">Sin categorías de vendedor registradas. Crea categorías en la sección de vendedores.</div>';
    return;
  }

  var p = anParseMes(mes);

  // Helper: compute metrics for a category by filtering sales on segmento_cliente field.
  // Each sale belongs to exactly one category — the one the seller chose at registration time.
  function buildCatMetrics(segNombre){
    var allSeg = _ventas.filter(function(vt){
      if(!vt.fecha||vt.estado==='Anulado') return false;
      var d=new Date(vt.fecha);
      return d.getFullYear()===p.y && d.getMonth()===p.m
        && String(vt.segmento_cliente||'')===segNombre;
    });
    var ventas = allSeg.filter(function(vt){
      var n=movNorm(vt.movimiento);
      return vt.estado==='✅ Pagado'&&(n==='venta al contado'||n==='venta delivery'||n==='cobro de credito');
    });
    var contado=0, delivery=0, cobros=0;
    ventas.forEach(function(vt){
      var n=movNorm(vt.movimiento);
      if(n==='venta al contado') contado+=(vt.total||0);
      else if(n==='venta delivery') delivery+=(vt.total||0);
      else if(n==='cobro de credito') cobros+=(vt.total||0);
    });
    var devolMonto=anSumTotal(allSeg.filter(function(vt){
      var mt=movNorm(vt.movimiento); return mt==='devolucion'||mt==='devolución';
    }));
    var ingreso=anIngresoNeto(allSeg);
    var nVentas=ventas.length;
    var credOtoMonto=anSumTotal(allSeg.filter(function(vt){return esCredito15(vt.movimiento);}));
    var credPend=anSumTotal(_ventas.filter(function(vt){
      var mt=movNorm(vt.movimiento);
      return (mt.indexOf('credito')>-1||mt.indexOf('crédito')>-1)
        &&(vt.estado==='⏳ Pendiente'||vt.estado==='❌ Vencido')
        &&String(vt.segmento_cliente||'')===segNombre;
    }));
    var grupos={};
    allSeg.forEach(function(vt){var gid=vt.grupo_visita_id||('solo_'+vt.id);grupos[gid]=true;});
    var visitas=Object.keys(grupos).length;
    var vendSet={};
    allSeg.forEach(function(vt){if(vt.vendedor_id) vendSet[String(vt.vendedor_id)]=true;});
    var vendors=Object.keys(vendSet).map(function(vid){
      return _vendedores.find(function(v){return String(v.id)===vid;})||{nombre:'Vendedor',id:vid};
    });
    return {
      ingreso:ingreso, nVentas:nVentas, visitas:visitas,
      credPend:credPend, devol:devolMonto, credOtoMonto:credOtoMonto,
      contado:contado, delivery:delivery, cobros:cobros,
      nVendedores:vendors.length, vendors:vendors,
      ticket: nVentas>0 ? ingreso/nVentas : 0,
      conv: visitas>0 ? Math.round(nVentas/visitas*100) : 0
    };
  }

  // Build data per category using segmento_cliente on each sale record
  var catData = _segmentos.map(function(seg){
    var m = buildCatMetrics(seg.nombre);
    return Object.assign({nombre:seg.nombre}, m);
  });

  // Add "Sin categoría" bucket for sales without segmento_cliente
  var m2 = buildCatMetrics('');
  if(m2.visitas||m2.nVentas||m2.credPend){
    catData.push(Object.assign({nombre:'(Sin categoría)'},m2));
  }

  if(!catData.length){
    body.innerHTML='<div style="padding:2rem;text-align:center;color:var(--tl);font-size:13px;">Sin categorías con vendedores asignados</div>';
    return;
  }

  // Sort: categories with activity first, then alphabetically
  catData.sort(function(a,b){
    var aAct=(a.ingreso||0)+(a.visitas||0)+(a.credPend||0);
    var bAct=(b.ingreso||0)+(b.visitas||0)+(b.credPend||0);
    if(bAct!==aAct) return bAct-aAct;
    return a.nombre.localeCompare(b.nombre);
  });

  // Palettes
  var palette=['#253C61','#1e6e77','#d97706','#2d7a3a','#9333ea','#dc2626','#0891b2','#c0641e','#0f766e','#b45309'];
  var palBg=['rgba(37,60,97,.18)','rgba(30,110,119,.18)','rgba(215,119,6,.18)','rgba(45,122,58,.18)','rgba(147,51,234,.18)','rgba(220,38,38,.18)','rgba(8,145,178,.18)','rgba(192,100,30,.18)','rgba(15,118,110,.18)','rgba(180,83,9,.18)'];

  var totalIngreso = catData.reduce(function(s,c){return s+c.ingreso;},0);

  // ── CHART ──
  var ctxCat = gel('an-cat-chart');
  if(_anChartCat){_anChartCat.destroy();_anChartCat=null;}
  if(ctxCat && catData.some(function(c){return c.ingreso>0||c.credPend>0;})){
    _anChartCat = new Chart(ctxCat,{
      type:'bar',
      data:{
        labels:catData.map(function(c){return c.nombre;}),
        datasets:[
          {
            label:'Ingreso neto',
            data:catData.map(function(c){return c.ingreso;}),
            backgroundColor:catData.map(function(_,i){return palBg[i%palBg.length];}),
            borderColor:catData.map(function(_,i){return palette[i%palette.length];}),
            borderWidth:2,borderRadius:6
          },
          {
            label:'Créditos pendientes',
            data:catData.map(function(c){return c.credPend;}),
            backgroundColor:'rgba(217,119,6,.13)',
            borderColor:'#d97706',
            borderWidth:1.5,borderRadius:6
          }
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{labels:{font:{family:'DM Sans',size:11},color:'#4a5568'}},
          tooltip:{callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+money(ctx.parsed.y);}}}
        },
        scales:{
          y:{ticks:{callback:function(v){return 'S/'+Math.round(v/1000)+'k';},font:{size:10},color:'#718096'},grid:{color:'#e2e8f0'},beginAtZero:true},
          x:{ticks:{font:{size:11},color:'#4a5568'},grid:{display:false}}
        }
      }
    });
    anChartShowCanvas(ctxCat);
  } else if(ctxCat){
    anChartEmpty(ctxCat,'Sin datos en el mes seleccionado');
  }

  // ── TARJETAS ──
  var cardsHtml = catData.map(function(cat,i){
    var color=palette[i%palette.length];
    var bg=palBg[i%palBg.length];
    var pct=totalIngreso>0?Math.round(cat.ingreso/totalIngreso*100):0;
    var convColor=cat.conv>=60?'#2d7a3a':cat.conv>=35?'#d97706':'#dc2626';
    var vendNombres=cat.vendors.slice(0,3).map(function(v){return v.nombre.split(' ')[0];}).join(', ')+(cat.vendors.length>3?' +más':'');
    return '<div style="background:var(--wh);border:2px solid '+color+'44;border-radius:var(--rl);padding:1rem;box-shadow:var(--sh);position:relative;overflow:hidden;">'+
      '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:'+color+';"></div>'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:.75rem;">'+
        '<div style="width:36px;height:36px;border-radius:50%;background:'+bg+';border:2px solid '+color+'66;display:flex;align-items:center;justify-content:center;font-family:Bebas Neue,sans-serif;font-size:18px;color:'+color+';flex-shrink:0;">'+(i+1)+'</div>'+
        '<div style="flex:1;min-width:0;">'+
          '<div style="font-weight:800;font-size:14px;color:'+color+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(cat.nombre)+'</div>'+
          '<div style="font-size:10.5px;color:var(--tl);">'+cat.nVendedores+' vendedor'+(cat.nVendedores!==1?'es':'')+' · '+esc(vendNombres)+'</div>'+
        '</div>'+
        '<div style="text-align:right;flex-shrink:0;">'+
          '<div style="font-size:9px;color:var(--tl);">del total</div>'+
          '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:'+color+';">'+pct+'%</div>'+
        '</div>'+
      '</div>'+
      '<div style="background:var(--bd);border-radius:4px;height:4px;overflow:hidden;margin-bottom:.85rem;">'+
        '<div style="background:'+color+';height:4px;width:'+pct+'%;border-radius:4px;"></div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">'+
        '<div style="background:var(--bg);border-radius:8px;padding:.5rem .65rem;">'+
          '<div style="font-size:9px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:1px;">Ingreso neto</div>'+
          '<div style="font-family:Bebas Neue,sans-serif;font-size:17px;color:'+color+';">'+money(cat.ingreso)+'</div>'+
        '</div>'+
        '<div style="background:var(--bg);border-radius:8px;padding:.5rem .65rem;">'+
          '<div style="font-size:9px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:1px;">Ticket prom.</div>'+
          '<div style="font-family:Bebas Neue,sans-serif;font-size:17px;color:#1e6e77;">'+money(cat.ticket)+'</div>'+
        '</div>'+
        '<div style="background:var(--bg);border-radius:8px;padding:.5rem .65rem;">'+
          '<div style="font-size:9px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:1px;">Conversión</div>'+
          '<div style="font-family:Bebas Neue,sans-serif;font-size:17px;color:'+convColor+';">'+cat.conv+'%</div>'+
          '<div style="font-size:9px;color:var(--tl);">'+cat.visitas+' vis → '+cat.nVentas+' vtas</div>'+
        '</div>'+
        '<div style="background:var(--bg);border-radius:8px;padding:.5rem .65rem;">'+
          '<div style="font-size:9px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.4px;margin-bottom:1px;">Créd. pend.</div>'+
          '<div style="font-family:Bebas Neue,sans-serif;font-size:17px;color:#d97706;">'+money(cat.credPend)+'</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');

  // ── TABLA ──
  var tableRows = catData.map(function(cat,i){
    var color=palette[i%palette.length];
    var pct=totalIngreso>0?Math.round(cat.ingreso/totalIngreso*100):0;
    var convColor=cat.conv>=60?'var(--ok)':cat.conv>=35?'#d97706':'var(--er)';
    return '<tr>'+
      '<td style="font-weight:700;"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+color+';margin-right:6px;vertical-align:middle;"></span>'+esc(cat.nombre)+'</td>'+
      '<td style="text-align:center;">'+cat.nVendedores+'</td>'+
      '<td style="text-align:right;font-weight:700;color:'+color+';">'+money(cat.ingreso)+'</td>'+
      '<td style="text-align:center;">'+cat.nVentas+'</td>'+
      '<td style="text-align:center;">'+cat.visitas+'</td>'+
      '<td style="text-align:center;font-weight:700;color:'+convColor+';">'+cat.conv+'%</td>'+
      '<td style="text-align:right;">'+money(cat.ticket)+'</td>'+
      '<td style="text-align:right;color:#2d7a3a;">'+money(cat.contado)+'</td>'+
      '<td style="text-align:right;color:#7c3aed;">'+money(cat.delivery)+'</td>'+
      '<td style="text-align:right;color:#0891b2;">'+money(cat.cobros)+'</td>'+
      '<td style="text-align:right;color:#d97706;">'+money(cat.credOtoMonto)+'</td>'+
      '<td style="text-align:right;color:#dc2626;font-weight:700;">'+money(cat.credPend)+'</td>'+
      '<td style="text-align:right;color:var(--er);">'+(cat.devol>0?money(cat.devol):'—')+'</td>'+
      '<td>'+
        '<div style="background:var(--bd);border-radius:4px;height:5px;overflow:hidden;width:70px;">'+
          '<div style="background:'+color+';height:5px;width:'+pct+'%;border-radius:4px;"></div>'+
        '</div>'+
        '<div style="font-size:10px;color:var(--tl);margin-top:2px;">'+pct+'%</div>'+
      '</td>'+
    '</tr>';
  }).join('');

  // Totals row
  var tI=catData.reduce(function(s,c){return s+c.ingreso;},0);
  var tV=catData.reduce(function(s,c){return s+c.nVentas;},0);
  var tVis=catData.reduce(function(s,c){return s+c.visitas;},0);
  var tCP=catData.reduce(function(s,c){return s+c.credPend;},0);
  var tCO=catData.reduce(function(s,c){return s+c.credOtoMonto;},0);
  var tDev=catData.reduce(function(s,c){return s+c.devol;},0);
  var tCon=catData.reduce(function(s,c){return s+c.contado;},0);
  var tDel=catData.reduce(function(s,c){return s+c.delivery;},0);
  var tCob=catData.reduce(function(s,c){return s+c.cobros;},0);
  var tConv=tVis>0?Math.round(tV/tVis*100):0;
  var tTick=tV>0?tI/tV:0;

  var totalRow='<tr style="background:var(--sky4);font-weight:800;border-top:2px solid var(--brand);">'+
    '<td style="font-weight:900;">TOTAL</td>'+
    '<td style="text-align:center;">'+_vendedores.length+'</td>'+
    '<td style="text-align:right;font-weight:900;color:var(--brand);">'+money(tI)+'</td>'+
    '<td style="text-align:center;">'+tV+'</td>'+
    '<td style="text-align:center;">'+tVis+'</td>'+
    '<td style="text-align:center;">'+tConv+'%</td>'+
    '<td style="text-align:right;">'+money(tTick)+'</td>'+
    '<td style="text-align:right;color:#2d7a3a;">'+money(tCon)+'</td>'+
    '<td style="text-align:right;color:#7c3aed;">'+money(tDel)+'</td>'+
    '<td style="text-align:right;color:#0891b2;">'+money(tCob)+'</td>'+
    '<td style="text-align:right;color:#d97706;">'+money(tCO)+'</td>'+
    '<td style="text-align:right;color:#dc2626;">'+money(tCP)+'</td>'+
    '<td style="text-align:right;">'+(tDev>0?money(tDev):'—')+'</td>'+
    '<td>100%</td>'+
  '</tr>';

  body.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));gap:1rem;margin-bottom:1.2rem;">'+cardsHtml+'</div>'+
    '<div class="card">'+
      '<div class="ch"><span class="ct">📋 Comparativa Detallada por Categoría</span><span style="font-size:11px;color:var(--tl);">'+anLabelMes(mes)+'</span></div>'+
      '<div class="cb" style="padding:0;"><div class="tw">'+
        '<table style="font-size:12.5px;">'+
          '<thead><tr style="background:var(--sky4);">'+
            '<th>Categoría</th>'+
            '<th style="text-align:center;">Vend.</th>'+
            '<th style="text-align:right;">Ingreso</th>'+
            '<th style="text-align:center;">Ventas</th>'+
            '<th style="text-align:center;">Visitas</th>'+
            '<th style="text-align:center;">Conv.</th>'+
            '<th style="text-align:right;">Ticket</th>'+
            '<th style="text-align:right;">Contado</th>'+
            '<th style="text-align:right;">Delivery</th>'+
            '<th style="text-align:right;">Cobros</th>'+
            '<th style="text-align:right;">Créd.otorg.</th>'+
            '<th style="text-align:right;">Créd.pend.</th>'+
            '<th style="text-align:right;">Devol.</th>'+
            '<th>% ingreso</th>'+
          '</tr></thead>'+
          '<tbody>'+tableRows+totalRow+'</tbody>'+
        '</table>'+
      '</div></div>'+
    '</div>';

  if(window.gsap && !(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
    gsap.from('#an-cat-body > div > div',{y:12,opacity:0,duration:.3,stagger:.07,ease:'power2.out',overwrite:true,clearProps:'transform,opacity'});
  }
}

function anNivelVendedor(totalVentas){
  if(!_niveles||!_niveles.length) return null;
  var sorted=_niveles.slice().sort(function(a,b){return (b.ventas_min||0)-(a.ventas_min||0);});
  for(var i=0;i<sorted.length;i++){
    var n=sorted[i];
    if(totalVentas>=(n.ventas_min||0)){
      if(!n.ventas_max||totalVentas<=n.ventas_max) return n;
      if(n.ventas_max&&totalVentas>n.ventas_max) continue;
      return n;
    }
  }
  return null;
}

// ── MODAL DETALLE ZONA ──
function abrirModalZona(zona, mes){
  if(!gel('modal-zona')) return;
  // Título y subtítulo
  var _n=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var mesLabel = mes?(function(){var p=mes.split('-');return _n[parseInt(p[1])-1]+' '+p[0];}()):'(mes actual)';
  gel('mz-titulo').textContent = '📍 ' + zona;
  gel('mz-subtitulo').textContent = 'Historial de la zona · ' + mesLabel;

  // Filtrar ventas de esa zona en ese mes
  var movs = (_ventas||[]).filter(function(v){
    var zv = (v.zona||'').trim();
    var zonaN = zona.trim();
    if(zv !== zonaN) return false;
    if(mes && (!v.fecha || v.fecha.indexOf(mes) !== 0)) return false;
    if(v.estado === 'Anulado') return false;
    return true;
  }).sort(function(a,b){
    var da=(a.fecha||'')+(a.hora||'');
    var db=(b.fecha||'')+(b.hora||'');
    return db > da ? 1 : db < da ? -1 : 0;
  });

  // KPIs de la zona
  var totalIng=0, nVisitas=0, nVentas=0, nCred=0;
  movs.forEach(function(v){
    var m=movNorm(v.movimiento||'');
    if(m==='visita') nVisitas++;
    else if(m==='venta al contado'||m==='venta delivery'||m==='cobro de credito') { nVentas++; if(anEsIngreso(v)) totalIng+=(v.total||0); }
    else if(anEsDevolucion(v)) totalIng-=Math.abs(v.total||0);
    else if(m==='credito a 15 dias') nCred++;
  });
  gel('mz-kpis').innerHTML = [
    {l:'INGRESOS',v:money(totalIng),c:'var(--ok)'},
    {l:'VISITAS',v:String(nVisitas),c:'var(--brand)'},
    {l:'VENTAS',v:String(nVentas),c:'#0891b2'},
    {l:'CRÉDITOS',v:String(nCred),c:'var(--orange)'},
    {l:'TOTAL MOV.',v:String(movs.length),c:'var(--tl)'}
  ].map(function(k){
    return '<div style="background:var(--sky4);border-radius:var(--r);padding:.45rem .8rem;min-width:90px;">'+
      '<div style="font-size:9px;color:var(--tl);font-weight:700;text-transform:uppercase;letter-spacing:.5px;">'+k.l+'</div>'+
      '<div style="font-size:16px;font-weight:800;font-family:Bebas Neue,sans-serif;color:'+k.c+';">'+k.v+'</div></div>';
  }).join('');

  // Agrupar por veterinaria
  var vets = {};
  movs.forEach(function(v){
    var key = (v.veterinaria||'(sin nombre)').trim();
    if(!vets[key]) vets[key] = {nombre:key, movs:[], ingreso:0};
    vets[key].movs.push(v);
    var m=movNorm(v.movimiento||'');
    if((m==='venta al contado'||m==='venta delivery'||m==='cobro de credito')&&v.estado==='✅ Pagado')
      vets[key].ingreso += (v.total||0);
  });
  var vetList = Object.values(vets).sort(function(a,b){return b.ingreso-a.ingreso;});

  if(!vetList.length){
    gel('mz-tabla').innerHTML='<div style="padding:2rem;text-align:center;color:var(--tl);font-size:13px;">Sin movimientos en esta zona para '+mesLabel+'</div>';
    abrirModal('modal-zona'); return;
  }

  var html='';
  vetList.forEach(function(vet){
    html += '<div style="border-bottom:2px solid var(--sky);padding:.6rem 1rem;background:var(--sky4);">'+
      '<div style="font-weight:700;font-size:13px;">🏥 '+esc(vet.nombre)+'</div>'+
      '<div style="font-size:11px;color:var(--tl);">'+vet.movs.length+' movimientos · Ingreso: <strong style="color:var(--ok);">'+money(vet.ingreso)+'</strong></div></div>'+
      '<table style="width:100%;font-size:12px;margin-bottom:0;"><thead><tr>'+
      '<th style="padding:4px 8px;">Fecha</th><th style="padding:4px 8px;">Vendedor</th>'+
      '<th style="padding:4px 8px;">Tipo</th><th style="padding:4px 8px;">Producto</th>'+
      '<th style="padding:4px 8px;text-align:center;">Cant.</th><th style="padding:4px 8px;text-align:right;">Total</th>'+
      '<th style="padding:4px 8px;">Estado</th></tr></thead><tbody>';
    vet.movs.forEach(function(v){
      html += '<tr style="cursor:pointer;" onclick="verDetalle(\''+v.id+'\')">'+
        '<td style="padding:4px 8px;">'+fmt(v.fecha)+'</td>'+
        '<td style="padding:4px 8px;font-size:11px;">'+getNombreVendedor(v.vendedor_id)+'</td>'+
        '<td style="padding:4px 8px;">'+bMov(v.movimiento)+'</td>'+
        '<td style="padding:4px 8px;">'+(v.producto||'—')+'</td>'+
        '<td style="padding:4px 8px;text-align:center;">'+(v.cantidad||1)+'</td>'+
        '<td style="padding:4px 8px;text-align:right;font-weight:700;">'+money(v.total)+'</td>'+
        '<td style="padding:4px 8px;">'+bEst(v.estado)+'</td>'+
      '</tr>';
    });
    html += '</tbody></table>';
  });
  gel('mz-tabla').innerHTML = html;
  abrirModal('modal-zona');
}

function cerrarModalZona(){
  cerrarModal('modal-zona');
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredPrompt=e;
  const b=document.getElementById('install-banner');if(b)b.style.display='flex';
});
function installPWA(){
  const b=document.getElementById('install-banner');if(b)b.style.display='none';
  if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(function(r){if(r.outcome==='accepted'){deferredPrompt=null;const b2=document.getElementById('install-banner');if(b2)b2.style.display='none';}else{const b2=document.getElementById('install-banner');if(b2)b2.style.display='flex';}});}
}
window.addEventListener('appinstalled',()=>{
  const b=document.getElementById('install-banner');if(b)b.style.display='none';
});
