function rMercaderia(){
  sbG('movimientos','vendedor_id=eq.'+CUR.id+'&tipo=eq.salida&categoria=eq.producto').then(function(movs){
    var stock={};
    for(var i=0;i<(movs||[]).length;i++){var m=movs[i];stock[m.item_nombre]=(stock[m.item_nombre]||0)+m.cantidad;}
    for(var i=0;i<_ventas.length;i++){
      var v=_ventas[i];
      if(v.movimiento!=='Devoluci\u00f3n'&&v.producto)stock[v.producto]=(stock[v.producto]||0)-v.cantidad;
    }
    var html='';
    for(var k in stock){
      if(stock[k]>0){
        html+='<div class="merch-card"><div><div style="font-weight:700;font-size:14px;color:var(--brand)">'+k+'</div><div class="tm2">Asignado por Suplevet</div></div>'+
          '<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:var(--brand)">'+stock[k]+' uds</div></div>';
      }
    }
    if(!html)html='<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-caja"/></svg></div><strong>No tienes stock asignado.</strong><br>Suplevet te asignará mercadería antes de tu próxima ruta.</div>';
    else html='<div class="alert ai" style="margin-bottom:1rem">\ud83d\udce6 Stock asignado basado en entregas del inventario.</div>'+html;
    gel('lista-merch').innerHTML=html;
  }).catch(function(){gel('lista-merch').innerHTML='<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-alerta"/></svg></div><strong>No pudimos cargar tu historial.</strong><br>Revisa tu conexión y vuelve a intentarlo.</div>';});
}

function filMesCambio(){
  // Al cambiar mes, limpiar filtro de días
  gel('fil-desde').value='';gel('fil-hasta').value='';
  rHist();
}
function limpiarFiltroFechas(){
  gel('fil-desde').value='';gel('fil-hasta').value='';
  rHist();
}

function fHist(f,btn){
  _hFil=f;_histPag=1;
  var tabs=document.querySelectorAll('.tabs .tab');
  for(var i=0;i<tabs.length;i++)tabs[i].classList.remove('active');
  btn.classList.add('active');rHist();
}

function poblarMeses(){
  var seen={},meses=[];
  for(var i=0;i<_ventas.length;i++){
    var m=_ventas[i].fecha?_ventas[i].fecha.substring(0,7):null;
    if(m&&!seen[m]){seen[m]=1;meses.push(m);}
  }
  meses.sort().reverse();
  var n=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var sel=gel('fil-mes'),cur=sel.value;
  sel.innerHTML='<option value="">Todos los meses</option>';
  for(var i=0;i<meses.length;i++){
    var p=meses[i].split('-');
    var opt=document.createElement('option');opt.value=meses[i];opt.textContent=n[parseInt(p[1])-1]+' '+p[0];sel.appendChild(opt);
  }
  if(cur)sel.value=cur;
}

// ══════════════════════════════════════════════════════════════
// SISTEMA DE AGRUPACIÓN DE TRANSACCIONES
// Agrupa ventas múltiples de la misma visita en una sola entrada
// ══════════════════════════════════════════════════════════════

// FUNCIÓN DE AGRUPACIÓN
// Agrupa transacciones por: vendedor + cliente + fecha + hora cercana + movimiento
function agruparTransacciones(ventas){
  var grupos = {};
  
  for(var i = 0; i < ventas.length; i++){
    var v = ventas[i];
    
    // Crear clave única para agrupar
    // Formato: vendedor_veterinaria_doctora_fecha_horaGrupo_movimiento
    var horaGrupo = '';
    if(v.hora){
      // Agrupar por bloques de 15 minutos
      var partes = v.hora.split(':');
      var h = partes[0];
      var m = parseInt(partes[1]) || 0;
      var bloqueMinutos = Math.floor(m / 15) * 15;
      horaGrupo = h + ':' + (bloqueMinutos < 10 ? '0' : '') + bloqueMinutos;
    }
    
    var clave = [
      v.vendedor_id || '',
      (v.veterinaria || '').toLowerCase().trim(),
      (v.doctora || '').toLowerCase().trim(),
      v.fecha || '',
      horaGrupo,
      v.movimiento || ''
    ].join('|');
    
    if(!grupos[clave]){
      grupos[clave] = {
        items: [],
        representante: v  // Usar el primer item como representante
      };
    }
    
    grupos[clave].items.push(v);
  }
  
  // Convertir a array de grupos
  var resultado = [];
  for(var clave in grupos){
    var grupo = grupos[clave];
    resultado.push({
      esGrupo: grupo.items.length > 1,
      cantidad_productos: grupo.items.length,
      items: grupo.items,
      // Datos del representante (para mostrar en la fila)
      id: grupo.representante.id,
      fecha: grupo.representante.fecha,
      hora: grupo.representante.hora,
      veterinaria: grupo.representante.veterinaria,
      doctora: grupo.representante.doctora,
      zona: grupo.representante.zona,
      movimiento: grupo.representante.movimiento,
      estado: grupo.representante.estado,
      // Total sumado de todos los items
      total: grupo.items.reduce(function(sum, item){
        return sum + (parseFloat(item.total) || 0);
      }, 0),
      // Para "Ver detalle" necesitamos todos los IDs
      ids_grupo: grupo.items.map(function(item){ return item.id; })
    });
  }
  
  return resultado;
}

// ══════════════════════════════════════════════════════════════
// FUNCIÓN rHist — Muestra TODOS los movimientos individualmente (sin agrupar)
// ══════════════════════════════════════════════════════════════
function rHist(){
  var busq=(val('srch-h')||'').toLowerCase(),mes=val('fil-mes');
  var desde=val('fil-desde')||'',hasta=val('fil-hasta')||'';
  var fprod=(val('fil-h-prod')||'').trim(), fzona=(val('fil-h-zona')||'').trim();
  var l=[];

  // Poblar filtros producto/zona manteniendo selección
  (function(){
    var sprod=gel('fil-h-prod'), szona=gel('fil-h-zona');
    if(sprod&&szona){
      var curP=sprod.value, curZ=szona.value;
      var prods={}, zonas={};
      _ventas.forEach(function(v){if(v.producto)prods[v.producto]=1;if(v.zona)zonas[v.zona]=1;});
      sprod.innerHTML='<option value="">Todos los productos</option>'+Object.keys(prods).sort().map(function(p){return '<option value="'+p+'"'+(p===curP?' selected':'')+'>'+p+'</option>';}).join('');
      szona.innerHTML='<option value="">Todas las zonas</option>'+Object.keys(zonas).sort().map(function(z){return '<option value="'+z+'"'+(z===curZ?' selected':'')+'>'+z+'</option>';}).join('');
    }
  })();

  // Filtrar movimientos
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if(_hFil!=='todos'&&v.movimiento!==_hFil)continue;
    if(mes&&(!v.fecha||v.fecha.indexOf(mes)!==0))continue;
    if(desde&&(v.fecha||'')<desde)continue;
    if(hasta&&(v.fecha||'')>hasta)continue;
    if(fprod&&(v.producto||'').trim()!==fprod)continue;
    if(fzona&&(v.zona||'').trim()!==fzona)continue;
    if(busq&&(v.veterinaria||'').toLowerCase().indexOf(busq)<0&&(v.doctora||'').toLowerCase().indexOf(busq)<0&&(v.zona||'').toLowerCase().indexOf(busq)<0&&(v.producto||'').toLowerCase().indexOf(busq)<0)continue;
    l.push(v);
  }

  // KPIs
  var kpiEl=gel('hist-kpis');
  if(kpiEl){
    var contadoV=l.filter(function(v){return v.movimiento==='Venta al contado'&&v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
    var cobrosV=l.filter(function(v){return v.movimiento==='Cobro de credito'&&v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
    var credPendV=l.filter(function(v){return (v.movimiento==='Credito a 15 dias')&&(v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido');}).reduce(function(s,v){return s+(v.total||0);},0);
    var deliveryV=l.filter(function(v){return v.movimiento==='Venta delivery'&&v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
    var visitasN=l.filter(function(v){return v.movimiento==='Visita';}).length;
    kpiEl.innerHTML=[
      {lbl:'TOTAL VENTAS',val:money(contadoV+cobrosV+deliveryV),c:'var(--brand)'},
      {lbl:'VENTAS AL CONTADO',val:money(contadoV),c:'var(--ok)'},
      {lbl:'COBROS CRÉDITO',val:money(cobrosV),c:'#0891b2'},
      {lbl:'CRÉDITOS PEND.',val:money(credPendV),c:'var(--orange)'},
      {lbl:'DELIVERY',val:money(deliveryV),c:'#7c3aed'},
      {lbl:'VISITAS',val:String(visitasN),c:'var(--brand)'}
    ].map(function(k){return '<div class="sc"><div class="sl">'+k.lbl+'</div><div class="sv sv-b" style="color:'+k.c+'">'+k.val+'</div></div>';}).join('');
  }

  // Ordenar por fecha/hora descendente (más reciente primero)
  l.sort(function(a,b){
    var da=(a.fecha||'')+(a.hora||'00:00');
    var db=(b.fecha||'')+(b.hora||'00:00');
    if(db>da)return 1;if(db<da)return -1;
    return (b.id||'')>(a.id||'')?1:(b.id||'')<(a.id||'')?-1:0;
  });

  // Paginación
  var PER_PAGE=15;
  var totalPags=Math.max(1,Math.ceil(l.length/PER_PAGE));
  if(_histPag>totalPags)_histPag=totalPags;
  var start=(_histPag-1)*PER_PAGE;
  var page=l.slice(start,start+PER_PAGE);

  // Renderizar filas — cada movimiento es una fila independiente
  var rows='';
  for(var i=0;i<page.length;i++){
    var v=page[i];
    var canAnul=(v.estado!=='Anulado');
    rows+='<tr><td>'+fmt(v.fecha)+(v.hora?' <span class="tm2">'+v.hora+'</span>':'')+'</td>'+
      '<td>'+(v.veterinaria||'---')+'</td>'+
      '<td>'+(v.doctora||'---')+'</td>'+
      '<td>'+(v.zona||'---')+'</td>'+
      '<td>'+bMov(v.movimiento)+'</td>'+
      '<td>'+(v.producto||'---')+(v.es_regalo?' <span class="b b-visita" title="Unidades de regalo, sin costo">🎁 Regalo</span>':'')+'</td>'+
      '<td>'+(v.cantidad||0)+'</td>'+
      '<td><strong>S/ '+Number(v.total||0).toFixed(2)+'</strong></td>'+
      '<td>'+bEst(v.estado)+'</td>'+
      '<td style="display:flex;gap:4px;flex-wrap:wrap;">'+
      '<button class="btn btn-sm" style="background:var(--sky4);color:var(--brand);border:1px solid var(--sky);" onclick="verDetalle(\''+v.id+'\')">Ver detalle</button>'+
      (canAnul?'<button class="btn btn-d btn-sm" onclick="event.stopPropagation();anularVenta(\''+v.id+'\')">Anular</button>':'---')+
      '</td>'+
      '</tr>';
  }

  // Controles de paginación
  var pag='';
  if(totalPags>1){
    pag='<div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;border-top:1px solid var(--bd);font-size:12px;">'+
      '<span style="color:var(--tl);">'+l.length+' movimientos &middot; p\u00e1gina '+_histPag+' de '+totalPags+'</span>'+
      '<div style="display:flex;gap:6px;">';
    if(_histPag>1) pag+='<button class="btn btn-s btn-sm" onclick="_histPag=1;rHist()">\u00ab</button>';
    if(_histPag>1) pag+='<button class="btn btn-s btn-sm" onclick="_histPag--;rHist()">&lsaquo;</button>';
    var startP=Math.max(1,_histPag-2);
    var endP=Math.min(totalPags,startP+4);
    for(var p=startP;p<=endP;p++){
      pag+='<button class="btn '+(p===_histPag?'btn-p':'btn-s')+' btn-sm" onclick="_histPag='+p+';rHist()">'+p+'</button>';
    }
    if(_histPag<totalPags) pag+='<button class="btn btn-s btn-sm" onclick="_histPag++;rHist()">&rsaquo;</button>';
    if(_histPag<totalPags) pag+='<button class="btn btn-s btn-sm" onclick="_histPag=totalPags;rHist()">\u00bb</button>';
    pag+='</div></div>';
  }else if(l.length>0){
    pag='<div style="padding:.5rem 1rem;font-size:11px;color:var(--tl);border-top:1px solid var(--bd);">'+l.length+' movimientos</div>';
  }

  gel('tbl-hist').innerHTML=rows?
    '<table><thead><tr><th>Fecha</th><th>Veterinaria</th><th>Doctor/a</th><th>Zona</th><th>Movimiento</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Accion</th></tr></thead><tbody>'+rows+'</tbody></table>'+pag:
    '<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-lista"/></svg></div><strong>Tu historial está vacío.</strong><br>Registra tu primera visita y aparecerá aquí.</div>';
}

// ══════════════════════════════════════════════════════════════
// FUNCIÓN PARA VER DETALLE DE GRUPO (múltiples productos)
// ══════════════════════════════════════════════════════════════
function verDetalleGrupo(idsJson){
  var ids;
  try{
    ids = JSON.parse(idsJson.replace(/&quot;/g,'"'));
  }catch(e){
    console.error('Error parsing IDs:', e);
    return;
  }
  
  // Buscar todos los items del grupo
  var items = [];
  for(var i=0; i<ids.length; i++){
    for(var j=0; j<_ventas.length; j++){
      if(_ventas[j].id === ids[i]){
        items.push(_ventas[j]);
        break;
      }
    }
  }
  
  if(items.length === 0) return;
  
  _detalleVentaId = null; // No hay un ID único, es un grupo
  _detalleEditando = false;
  _productosDisponibles = [];
  
  // BUG FIX: No necesitamos cargar productos porque renderDetalleGrupo no los usa
  // Solo renderizamos directamente
  renderDetalleGrupo(items);
}

function renderDetalleGrupo(items){
  var primerItem = items[0];
  
  function campo(lbl, val){
    return '<div class="sc">'+
      '<div style="font-size:11px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:4px;">'+lbl+'</div>'+
      '<div style="font-size:13px;color:var(--tl);">'+val+'</div>'+
      '</div>';
  }
  
  var contenido='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1rem;">';
  contenido+=campo('Fecha', fmt(primerItem.fecha));
  contenido+=campo('Movimiento', bMov(primerItem.movimiento));
  contenido+=campo('Veterinaria', primerItem.veterinaria||'---');
  contenido+=campo('Doctora / Medico', primerItem.doctora||'---');
  contenido+=campo('Zona', primerItem.zona||'---');
  contenido+=campo('Celular', primerItem.num_medico||primerItem.celular||'---');
  if(primerItem.ruc)contenido+=campo('RUC', primerItem.ruc);
  contenido+='</div>';
  
  // PRODUCTOS VENDIDOS (tabla)
  contenido+='<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.85rem 1rem;margin-bottom:1rem;">'+
    '<div style="font-size:11px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">&#128230; PRODUCTOS VENDIDOS</div>'+
    '<table style="width:100%;font-size:13px;">'+
    '<thead><tr style="border-bottom:1px solid var(--sky);">'+
    '<th style="text-align:left;padding:6px 0;font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;">Producto</th>'+
    '<th style="text-align:center;padding:6px 0;font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;">Cant.</th>'+
    '<th style="text-align:right;padding:6px 0;font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;">P. Unit.</th>'+
    '<th style="text-align:right;padding:6px 0;font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;">Subtotal</th>'+
    '</tr></thead><tbody>';
  
  var totalGeneral = 0;
  for(var i=0; i<items.length; i++){
    var item = items[i];
    var subtotal = parseFloat(item.total) || 0;
    totalGeneral += subtotal;
    
    contenido+='<tr style="border-bottom:1px solid rgba(0,0,0,0.05);">'+
      '<td style="padding:8px 0;color:var(--td);">'+(item.producto||'---')+'</td>'+
      '<td style="padding:8px 0;text-align:center;color:var(--td);">'+(item.cantidad||0)+'</td>'+
      '<td style="padding:8px 0;text-align:right;color:var(--td);">S/ '+Number(item.precio_unitario||0).toFixed(2)+'</td>'+
      '<td style="padding:8px 0;text-align:right;font-weight:700;color:var(--brand);">S/ '+subtotal.toFixed(2)+'</td>'+
      '</tr>';
  }
  
  contenido+='</tbody><tfoot><tr style="border-top:2px solid var(--brand);">'+
    '<td colspan="3" style="padding:10px 0;font-weight:700;color:var(--brand);text-transform:uppercase;font-size:12px;">TOTAL</td>'+
    '<td style="padding:10px 0;text-align:right;font-weight:700;color:var(--brand);font-size:16px;">S/ '+totalGeneral.toFixed(2)+'</td>'+
    '</tr></tfoot></table></div>';
  
  if(primerItem.fecha_cobro){
    contenido+='<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:var(--r);padding:.7rem 1rem;margin-bottom:1rem;font-size:12px;color:#92400e;">'+
      '&#128197; Cobro estimado: <strong>'+fmt(primerItem.fecha_cobro)+'</strong></div>';
  }
  
  contenido+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;">'+
    '<span style="font-size:11px;font-weight:700;color:var(--brand);text-transform:uppercase;">Estado:</span>'+
    bEst(primerItem.estado)+'</div>';
  
  // Notas (si algún item tiene notas)
  var notasAgrupadas = [];
  for(var i=0; i<items.length; i++){
    if(items[i].notas && items[i].notas.trim() && items[i].notas !== 'EMPTY'){
      notasAgrupadas.push(items[i].notas);
    }
  }
  var notasTexto = notasAgrupadas.join(' | ');
  
  contenido+='<div style="border:1px solid var(--bd);border-radius:var(--r);padding:.85rem 1rem;margin-bottom:1rem;">'+
    '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;">&#128203; Notas del vendedor</div>'+
    '<div style="font-size:13px;line-height:1.6;color:var(--td);">'+(notasTexto||'<span style="color:var(--tl);font-style:italic;">Sin notas adicionales</span>')+'</div>'+
    '</div>';
  
  var canAnul=(primerItem.estado!=='Anulado');
  var idsArray = items.map(function(item){ return item.id; });
  var idsJson = JSON.stringify(idsArray).replace(/"/g,'&quot;');
  
  contenido+='<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:1rem;">'+
    (canAnul?'<button class="btn btn-d" onclick="anularGrupo(\''+idsJson+'\');cerrarDetalle()">Anular todo</button>':'')+
    '<button class="btn btn-p" onclick="cerrarDetalle()">Cerrar</button>'+
    '</div>';
  
  gel('detalle-body').innerHTML=contenido;
  gel('detalle-titulo').textContent=(primerItem.veterinaria||'Transaccion')+' \u00b7 '+fmt(primerItem.fecha)+' \u00b7 '+items.length+' productos';
  gel('modal-detalle').classList.add('open');
}

// ══════════════════════════════════════════════════════════════
// FUNCIÓN PARA ANULAR GRUPO COMPLETO
// Usa el mismo modal que anulación individual (UX consistente)
// ══════════════════════════════════════════════════════════════
function anularGrupo(idsJson){
  var ids;
  try{
    ids = JSON.parse(idsJson.replace(/&quot;/g,'"'));
  }catch(e){
    console.error('Error parsing IDs:', e);
    return;
  }
  
  if(!ids || !ids.length) return;
  
  // Usar el modal personalizado en lugar de confirm() nativo
  abrirConfirmAnularGrupo(ids);
}

function exportHist(){
  var hdr='Fecha,Veterinaria,Doctora,Zona,Movimiento,Producto,Cantidad,Precio,Total,Estado,FechaCobro\n';
  var rows='';
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    rows+='"'+(v.fecha||'')+'","'+(v.veterinaria||'')+'","'+(v.doctora||'')+'","'+(v.zona||'')+'","'+(v.movimiento||'')+'","'+(v.producto||'')+'","'+(v.cantidad||0)+'","'+(v.precio_unitario||0)+'","'+(v.total||0)+'","'+(v.estado||'')+'","'+(v.fecha_cobro||'')+'"\n';
  }
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\ufeff'+hdr+rows],{type:'text/csv'}));
  a.download='ventas_'+hoy()+'.csv';a.click();
}

function exportCred(){
  var cr=[];
  for(var i=0;i<_ventas.length;i++){var v=_ventas[i];if(v.movimiento==='Credito a 15 dias'&&v.estado!=='\u2705 Pagado')cr.push(v);}
  var hdr='Fecha,Veterinaria,Zona,Producto,Cantidad,Total,FechaCobro,Estado\n';
  var rows='';
  for(var i=0;i<cr.length;i++){
    var v=cr[i];
    rows+='"'+(v.fecha||'')+'","'+(v.veterinaria||'')+'","'+(v.zona||'')+'","'+(v.producto||'')+'","'+(v.cantidad||0)+'","'+(v.total||0)+'","'+(v.fecha_cobro||'')+'","'+(v.estado||'')+'"\n';
  }
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\ufeff'+hdr+rows],{type:'text/csv'}));
  a.download='creditos_'+hoy()+'.csv';a.click();
}

// ── PÁGINA DE VENTAS ─────────────────────────────────────────────
var _vtFil='todos';
var _vtPag=1;

function fVentas(f,btn){
  _vtFil=f;_vtPag=1;
  var tabs=document.querySelectorAll('#page-ventas .tabs .tab');
  for(var i=0;i<tabs.length;i++)tabs[i].classList.remove('active');
  btn.classList.add('active');rVentas();
}

function poblarMesesVt(){
  var seen={},meses=[];
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if(v.movimiento!=='Venta al contado'&&v.movimiento!=='Venta delivery'&&v.movimiento!=='Cobro de credito')continue;
    var m=v.fecha?v.fecha.substring(0,7):null;
    if(m&&!seen[m]){seen[m]=1;meses.push(m);}
  }
  // Asegurar que el mes actual esté siempre en la lista (aunque no haya ventas todavía)
  var mesActual=hoy().substring(0,7);
  if(!seen[mesActual]){seen[mesActual]=1;meses.push(mesActual);}
  meses.sort().reverse();
  var n=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var sel=gel('fil-mes-vt');if(!sel)return;
  var cur=sel.value;
  sel.innerHTML='<option value="">Todos los meses</option>';
  for(var i=0;i<meses.length;i++){
    var p=meses[i].split('-');
    var opt=document.createElement('option');opt.value=meses[i];opt.textContent=n[parseInt(p[1])-1]+' '+p[0];sel.appendChild(opt);
  }
  // Si el usuario ya tenía un mes seleccionado, mantenerlo;
  // de lo contrario, default = mes actual (no "todos los meses")
  if(cur){sel.value=cur;}
  else{sel.value=mesActual;}
}

function limpiarFiltroFechasVt(){
  gel('fil-vt-desde').value='';gel('fil-vt-hasta').value='';rVentas();
}

function rVentas(){
  var busq=(val('srch-vt')||'').toLowerCase();
  var mes=val('fil-mes-vt');
  var desde=val('fil-vt-desde')||'',hasta=val('fil-vt-hasta')||'';
  var l=[];
  // Solo consideramos ventas (contado, delivery, cobros) y NO anuladas
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    var esVenta=(v.movimiento==='Venta al contado'||v.movimiento==='Venta delivery'||v.movimiento==='Cobro de credito');
    if(!esVenta)continue;
    if(v.estado==='Anulado')continue;
    if(_vtFil!=='todos'&&v.movimiento!==_vtFil)continue;
    if(mes&&(!v.fecha||v.fecha.indexOf(mes)!==0))continue;
    if(desde&&(v.fecha||'')<desde)continue;
    if(hasta&&(v.fecha||'')>hasta)continue;
    if(busq&&(v.veterinaria||'').toLowerCase().indexOf(busq)<0&&
            (v.doctora||'').toLowerCase().indexOf(busq)<0&&
            (v.zona||'').toLowerCase().indexOf(busq)<0&&
            (v.producto||'').toLowerCase().indexOf(busq)<0)continue;
    l.push(v);
  }
  // Sort: fecha desc → hora desc → id desc
  l.sort(function(a,b){
    var da=(a.fecha||'')+(a.hora||'00:00');
    var db=(b.fecha||'')+(b.hora||'00:00');
    if(db>da)return 1;if(db<da)return -1;
    return (b.id||'')>(a.id||'')?1:(b.id||'')<(a.id||'')?-1:0;
  });
  // Calcular KPIs adaptativos según el tab activo
  var totalAll=0,totalContado=0,totalDelivery=0,totalCobros=0,nContado=0,nDelivery=0,nCobros=0;
  for(var i=0;i<l.length;i++){
    var v=l[i];var t=Number(v.total||0);
    totalAll+=t;
    if(v.movimiento==='Venta al contado'){totalContado+=t;nContado++;}
    else if(v.movimiento==='Venta delivery'){totalDelivery+=t;nDelivery++;}
    else if(v.movimiento==='Cobro de credito'){totalCobros+=t;nCobros++;}
  }
  // Adaptar las 3 tarjetas según el filtro
  var l1,v1,l2,v2,l3,v3;
  if(_vtFil==='todos'){
    l1='TOTAL VENTAS';v1=money(totalAll);
    l2='CONTADO + DELIVERY';v2=money(totalContado+totalDelivery);
    l3='COBROS DE CRÉDITO';v3=money(totalCobros);
  } else if(_vtFil==='Venta al contado'){
    l1='TOTAL CONTADO';v1=money(totalContado);
    l2='TRANSACCIONES';v2=String(nContado);
    l3='TICKET PROMEDIO';v3=money(nContado?totalContado/nContado:0);
  } else if(_vtFil==='Venta delivery'){
    l1='TOTAL DELIVERY';v1=money(totalDelivery);
    l2='TRANSACCIONES';v2=String(nDelivery);
    l3='TICKET PROMEDIO';v3=money(nDelivery?totalDelivery/nDelivery:0);
  } else if(_vtFil==='Cobro de credito'){
    l1='TOTAL COBROS';v1=money(totalCobros);
    l2='COBROS REALIZADOS';v2=String(nCobros);
    l3='COBRO PROMEDIO';v3=money(nCobros?totalCobros/nCobros:0);
  }
  gel('vt-l1').textContent=l1;gel('vt-v1').textContent=v1;
  gel('vt-l2').textContent=l2;gel('vt-v2').textContent=v2;
  gel('vt-l3').textContent=l3;gel('vt-v3').textContent=v3;

  // Paginación
  var PER_PAGE=15;
  var totalPags=Math.max(1,Math.ceil(l.length/PER_PAGE));
  if(_vtPag>totalPags)_vtPag=totalPags;
  var start=(_vtPag-1)*PER_PAGE;
  var page=l.slice(start,start+PER_PAGE);
  var rows='';
  for(var i=0;i<page.length;i++){
    var v=page[i];
    var canAnul=(v.estado!=='Anulado');
    rows+='<tr><td>'+fmt(v.fecha)+(v.hora?' <span class="tm2">'+v.hora+'</span>':'')+'</td>'+
      '<td>'+(v.veterinaria||'---')+'</td>'+
      '<td>'+(v.doctora||'---')+'</td>'+
      '<td>'+(v.zona||'---')+'</td>'+
      '<td>'+bMov(v.movimiento)+'</td>'+
      '<td>'+(v.producto||'---')+(v.es_regalo?' <span class="b b-visita" title="Unidades de regalo, sin costo">🎁 Regalo</span>':'')+'</td>'+
      '<td>'+(v.cantidad||0)+'</td>'+
      '<td><strong>S/ '+Number(v.total||0).toFixed(2)+'</strong></td>'+
      '<td>'+bEst(v.estado)+'</td>'+
      '<td style="display:flex;gap:4px;flex-wrap:wrap;">'+
      '<button class="btn btn-sm" style="background:var(--sky4);color:var(--brand);border:1px solid var(--sky);" onclick="verDetalle(\''+v.id+'\')">Ver detalle</button>'+
      (canAnul?'<button class="btn btn-d btn-sm" onclick="event.stopPropagation();anularVenta(\''+v.id+'\')">Anular</button>':'---')+
      '</td>'+
      '</tr>';
  }
  // Controles de paginación
  var pag='';
  if(totalPags>1){
    pag='<div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;border-top:1px solid var(--bd);font-size:12px;">'+
      '<span style="color:var(--tl);">'+l.length+' transacciones &middot; p\u00e1gina '+_vtPag+' de '+totalPags+'</span>'+
      '<div style="display:flex;gap:6px;">';
    if(_vtPag>1) pag+='<button class="btn btn-s btn-sm" onclick="_vtPag=1;rVentas()">\u00ab</button>';
    if(_vtPag>1) pag+='<button class="btn btn-s btn-sm" onclick="_vtPag--;rVentas()">&lsaquo;</button>';
    var startP=Math.max(1,_vtPag-2);
    var endP=Math.min(totalPags,startP+4);
    for(var p=startP;p<=endP;p++){
      pag+='<button class="btn '+(p===_vtPag?'btn-p':'btn-s')+' btn-sm" onclick="_vtPag='+p+';rVentas()">'+p+'</button>';
    }
    if(_vtPag<totalPags) pag+='<button class="btn btn-s btn-sm" onclick="_vtPag++;rVentas()">&rsaquo;</button>';
    if(_vtPag<totalPags) pag+='<button class="btn btn-s btn-sm" onclick="_vtPag=totalPags;rVentas()">\u00bb</button>';
    pag+='</div></div>';
  }else if(l.length>0){
    pag='<div style="padding:.5rem 1rem;font-size:11px;color:var(--tl);border-top:1px solid var(--bd);">'+l.length+' transacciones</div>';
  }
  gel('tbl-ventas').innerHTML=rows?
    '<table><thead><tr><th>Fecha</th><th>Veterinaria</th><th>Doctor/a</th><th>Zona</th><th>Movimiento</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Accion</th></tr></thead><tbody>'+rows+'</tbody></table>'+pag:
    '<div class="es" style="padding:2rem"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-billete"/></svg></div><strong>Sin ventas en este periodo.</strong><br>Prueba con otro mes o quita los filtros.</div>';
}

function exportVentas(){
  var l=[];
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    var esVenta=(v.movimiento==='Venta al contado'||v.movimiento==='Venta delivery'||v.movimiento==='Cobro de credito');
    if(!esVenta||v.estado==='Anulado')continue;
    l.push(v);
  }
  var hdr='Fecha,Hora,Veterinaria,Doctora,Zona,Movimiento,Producto,Cantidad,Total,Estado\n';
  var rows='';
  for(var i=0;i<l.length;i++){
    var v=l[i];
    rows+='"'+(v.fecha||'')+'","'+(v.hora||'')+'","'+(v.veterinaria||'')+'","'+(v.doctora||'')+'","'+(v.zona||'')+'","'+(v.movimiento||'')+'","'+(v.producto||'')+'","'+(v.cantidad||0)+'","'+(v.total||0)+'","'+(v.estado||'')+'"\n';
  }
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\ufeff'+hdr+rows],{type:'text/csv'}));
  a.download='ventas_'+hoy()+'.csv';a.click();
}

function rMercaderiaNueva(){
  var ICONS={'Bolsa de 150 g':'🧴','Bolsa de 250 g':'📦','Muestras senior':'🎁','default':'📦'};
  var BAGS={'Bolsa de 150 g':'blue','Bolsa de 250 g':'pink','default':'yellow'};
  sbG('movimientos','vendedor_id=eq.'+CUR.id+'&tipo=eq.salida&categoria=eq.producto').then(function(movs){
    var stock={},ini={};
    for(var i=0;i<(movs||[]).length;i++){var m=movs[i];stock[m.item_nombre]=(stock[m.item_nombre]||0)+m.cantidad;ini[m.item_nombre]=(ini[m.item_nombre]||0)+m.cantidad;}
    for(var i=0;i<_ventas.length;i++){var v=_ventas[i];if(v.movimiento!=='Devolución'&&v.producto)stock[v.producto]=(stock[v.producto]||0)-v.cantidad;}
    var alertHtml='';
    Object.keys(stock).forEach(function(k){
      if((stock[k]||0)<=0)alertHtml+='<div class="merch-alert-new"><div><div class="ma-txt">⚠️ Sin stock: '+k+'</div><div class="ma-sub">Solicita reposición para no perder ventas</div></div><button class="btn btn-s btn-sm" onclick="rMercaderiaNueva()">Pedir</button></div>';
    });
    var ae=gel('merch-alerts-new');if(ae)ae.innerHTML=alertHtml;
    var keys=Object.keys(stock),html='';
    if(!keys.length){html='<div style="grid-column:1/-1;" class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>No tienes stock asignado.</strong><br>Suplevet te asignará mercadería antes de tu próxima ruta.</div>';}
    else{
      keys.forEach(function(pk){
        var qty=Math.max(0,stock[pk]||0),icT=ini[pk]||Math.max(1,qty);
        var pct=Math.min(100,Math.round((qty/icT)*100));
        var icon=ICONS[pk]||ICONS.default,bagCl=BAGS[pk]||BAGS.default,isZero=qty<=0;
        var barCl=isZero?'mc-bar-red':pct>=60?'mc-bar-green':'mc-bar-sky';
        html+='<div class="merch-card-new">';
        if(isZero)html+='<div class="mc-badge-low">Sin stock</div>';
        html+='<div class="mc-bag '+bagCl+'">'+icon+'</div>';
        html+='<div class="mc-name">'+pk+'</div>';
        html+='<div class="mc-type">Asignado por Suplevet</div>';
        html+='<div><span class="'+(isZero?'mc-qty-zero':'mc-qty-big')+'">'+qty+'</span> <span class="mc-unit">uds</span></div>';
        html+='<div class="mc-bar-wrap"><div class="mc-bar-fill '+barCl+'" style="width:'+pct+'%"></div></div>';
        html+='<div class="mc-bar-lbl">'+(isZero?'<span style="color:#e74c3c;font-weight:700;">Solicitar reposición</span>':pct+'% del stock inicial')+'</div>';
        html+='</div>';
      });
    }
    var gr=gel('merch-cards-new');if(gr)gr.innerHTML=html;
    var upd=gel('merch-updated');if(upd)upd.textContent='Actualizado ahora';
    var tbl=gel('merch-mov-table'),bd=gel('merch-mov-body');
    if(tbl&&bd&&movs&&movs.length){
      tbl.style.display='block';
      var sorted=movs.slice().sort(function(a,b){return(b.created_at||'')>(a.created_at||'')?1:-1;}).slice(0,20);
      var th='<div class="tw"><table class="table"><thead><tr><th>FECHA</th><th>PRODUCTO</th><th>MOVIMIENTO</th><th>CANT.</th><th>SALDO</th></tr></thead><tbody>';
      var sd={};
      sorted.forEach(function(mm){
        var ds=mm.created_at?new Date(mm.created_at.split('T')[0]).toLocaleDateString('es-PE',{day:'2-digit',month:'short'}):'';
        sd[mm.item_nombre]=(sd[mm.item_nombre]||0)+mm.cantidad;
        th+='<tr><td>'+ds+'</td><td>'+mm.item_nombre+'</td><td><span class="b b-pagado">+Entrega</span></td><td>+'+mm.cantidad+'</td><td>'+sd[mm.item_nombre]+'</td></tr>';
      });
      th+='</tbody></table></div>';bd.innerHTML=th;
    }
  }).catch(function(){var g=gel('merch-cards-new');if(g)g.innerHTML='<div style="grid-column:1/-1;" class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>No pudimos cargar tu mercadería.</strong><br>Revisa tu conexión y vuelve a intentarlo.</div>';});
}
