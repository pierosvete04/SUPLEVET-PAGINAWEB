var _cliTab='vet';
var _vetsExtra=[]; // veterinarias a\u00f1adidas v\u00eda "+ A\u00f1adir cliente" que a\u00fan no tienen ventas

function rClientes(){
  var busq=(val('srch-cli')||'').toLowerCase();
  var el=gel('lista-clientes');if(!el)return;
  var map={};
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    var key=_cliTab==='vet'?v.veterinaria:v.doctora;
    if(!key)continue;
    if(!map[key])map[key]={nombre:key,otros:[],total:0,pendiente:0,transacc:0,visitas:0};
    var otroKey=_cliTab==='vet'?v.doctora:v.veterinaria;
    if(otroKey&&map[key].otros.indexOf(otroKey)<0)map[key].otros.push(otroKey);
    if(v.movimiento==='Visita'||v.movimiento==='Solo visita'){map[key].visitas++;continue;}
    if(v.movimiento!=='Devolucion'&&v.estado!=='Anulado'){map[key].total+=(v.total||0);map[key].transacc++;}
    if(v.estado==='\u23f3 Pendiente'||v.estado==='\u274c Vencido')map[key].pendiente+=(v.total||0);
  }
  // Veterinarias a\u00f1adidas a la cartera sin ventas (s\u00f3lo aplica a la tab vet).
  // Soportamos m\u00faltiples vets con el mismo nombre si tienen distinto distrito:
  // la key del map es "nombre \u00b7 distrito" cuando hay distrito, y "nombre" solo
  // cuando no \u2014 as\u00ed no se pisan entre s\u00ed en la lista.
  if(_cliTab==='vet'){
    (_vetsExtra||[]).forEach(function(extra){
      if(map[extra.nombre])return; // si ya hubo ventas con ese nombre, no duplicamos
      var key=extra.distrito?(extra.nombre+' \u00b7 '+extra.distrito):extra.nombre;
      if(map[key])return;
      map[key]={nombre:extra.nombre,distrito:extra.distrito||null,otros:extra.doctora?[extra.doctora]:[],total:0,pendiente:0,transacc:0,visitas:0,esNueva:true};
    });
  }
  var list=Object.values(map);
  // Marcar duplicados por nombre para mostrar el distrito como diferenciador
  var dupCount={};
  list.forEach(function(c){var k=(c.nombre||'').toLowerCase();dupCount[k]=(dupCount[k]||0)+1;});
  list.forEach(function(c){c.esDuplicado=dupCount[(c.nombre||'').toLowerCase()]>1;});
  if(busq)list=list.filter(function(c){return c.nombre.toLowerCase().indexOf(busq)>=0;});
  el.innerHTML=list.length?list.map(function(c){
    var color=_cliTab==='vet'?'var(--sky4)':'var(--orange3)';
    var border=_cliTab==='vet'?'var(--sky)':'var(--orange2)';
    var badgeNuevo=c.esNueva?'<span style="display:inline-block;background:#dbeafe;color:#1e40af;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;text-transform:uppercase;letter-spacing:.5px;margin-left:6px;vertical-align:middle;">Nueva en cartera</span>':'';
    // Si hay más de una vet con el mismo nombre (en distintos distritos), mostrar
    // el distrito como chip — es la única manera de distinguirlas visualmente.
    var badgeDistrito=(c.esDuplicado&&c.distrito)?'<span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;text-transform:uppercase;letter-spacing:.5px;margin-left:6px;vertical-align:middle;">📍 '+c.distrito+'</span>':'';
    var derecha=c.esNueva
      ? '<div style="text-align:right"><div class="tm2" style="font-style:italic;">Sin movimientos aún</div></div>'
      : '<div style="text-align:right"><div style="font-weight:700;font-size:14px;color:var(--brand);">S/ '+c.total.toFixed(2)+'</div>'+
        '<div class="tm2">'+c.transacc+' transacciones'+(c.visitas?' · '+c.visitas+' visitas':'')+'</div>'+
        (c.pendiente>0?'<div style="font-size:11px;color:#d97706;font-weight:600;">S/ '+c.pendiente.toFixed(2)+' pendiente</div>':'')+
        '</div>';
    return '<div class="card" style="margin-bottom:.7rem;cursor:pointer;" onclick="verEntidad(\''+_cliTab+'\',\''+c.nombre.replace(/\'/g,"\\'")+'\')">'+
      '<div class="cb" style="display:flex;align-items:center;gap:14px;">'+
      '<div style="width:42px;height:42px;border-radius:50%;background:'+color+';border:2px solid '+border+';display:flex;align-items:center;justify-content:center;font-family:Bebas Neue,sans-serif;font-size:18px;color:var(--brand);flex-shrink:0;">'+c.nombre.charAt(0).toUpperCase()+'</div>'+
      '<div style="flex:1"><div style="font-weight:700;font-size:14px;">'+c.nombre+badgeNuevo+badgeDistrito+'</div>'+
      '<div class="tm2">'+(c.otros.length?c.otros.slice(0,3).join(', '):'')+'</div></div>'+
      derecha+
      '<div style="color:var(--tl);font-size:20px;">&rsaquo;</div></div></div>';
  }).join(''):'<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>Aún no tienes clientes en tu cartera.</strong><br>Registra una visita y la veterinaria aparecerá aquí.</div>';
}

function setCliTab(tab,btn){
  _cliTab=tab;
  document.querySelectorAll('.cli-tab').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');rClientes();
}

function verEntidad(tipo,nombre){
  _cliHistVerTodo=false;
  var ventas=_ventas.filter(function(v){
    return tipo==='vet'?v.veterinaria===nombre:v.doctora===nombre;
  });
  var meses=[];var seen={};
  for(var i=0;i<ventas.length;i++){var m=ventas[i].fecha?ventas[i].fecha.substring(0,7):null;if(m&&!seen[m]){seen[m]=1;meses.push(m);}}
  meses.sort().reverse();
  var n=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var sel=gel('modal-mes');
  if(sel){
    sel.innerHTML='<option value="">Todos los meses</option>'+meses.map(function(m){
      var p=m.split('-');return '<option value="'+m+'">'+n[parseInt(p[1])-1]+' '+p[0]+'</option>';
    }).join('');
  }
  var modal=gel('modal-cliente');
  modal.dataset.tipo=tipo;modal.dataset.nombre=nombre;
  var meta='';
  if(tipo==='vet'){
    var docs=Array.from(new Set(ventas.map(function(v){return v.doctora;}).filter(Boolean)));
    var zona=ventas.length&&ventas[0].zona?ventas[0].zona:'';
    meta=(docs.length?docs.join(', '):'')+(zona?' &middot; '+zona:'');
  }else{
    meta=Array.from(new Set(ventas.map(function(v){return v.veterinaria;}).filter(Boolean))).join(', ');
  }
  gel('cli-nombre').textContent=nombre;
  gel('cli-meta').innerHTML=meta;
  // Celular, RUC y dirección: se muestran con lo que haya en la última venta
  // (inmediato) y luego se refinan con clientes_vet, que es la fuente
  // canónica (persiste aunque la última venta no haya traído ese dato,
  // p.ej. una simple visita).
  var ventasOrd=ventas.slice().sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');});
  var lastConDatos=ventasOrd[0]||{};
  var dt=gel('cli-datos');
  if(dt){
    var pintarDatos=function(cel,ruc,dir){
      var chips=[];
      chips.push('<span class="cli-chip'+(cel?'':' muted')+'"><svg class="ic" viewBox="0 0 24 24"><use href="#i-telefono"/></svg>'+(cel?esc(cel):'Celular no registrado')+'</span>');
      chips.push('<span class="cli-chip'+(ruc?'':' muted')+'"><svg class="ic" viewBox="0 0 24 24"><use href="#i-tarjeta"/></svg>RUC: '+(ruc?esc(ruc):'no registrado')+'</span>');
      if(tipo==='vet')chips.push('<span class="cli-chip'+(dir?'':' muted')+'"><svg class="ic" viewBox="0 0 24 24"><use href="#i-pin"/></svg>'+(dir?esc(dir):'Sin ubicación registrada')+'</span>');
      dt.innerHTML=chips.join('');
    };
    pintarDatos(lastConDatos.num_medico||lastConDatos.celular||'',lastConDatos.ruc||'','');
    if(tipo==='vet'){
      sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombre)+'&select=ruc,num_medico,direccion,distrito')
      .then(function(r){
        var fila=r&&r[0];
        if(!fila)return;
        var dir=[fila.direccion,fila.distrito].filter(Boolean).join(', ');
        pintarDatos(fila.num_medico||lastConDatos.num_medico||lastConDatos.celular||'',fila.ruc||lastConDatos.ruc||'',dir);
      }).catch(function(){});
    }
  }
  // Estado de cuenta: deuda vigente en TODO el histórico del cliente.
  var elEstado=gel('cli-estado');
  if(elEstado){
    var pendTotalHist=ventas.reduce(function(s,v){return s+((v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido')?(v.total||0):0);},0);
    elEstado.innerHTML=pendTotalHist>0?'<span class="b b-vencido">Con deuda · S/ '+pendTotalHist.toFixed(2)+'</span>':'<span class="b b-pagado">Al día</span>';
  }
  cliRenderTrend(ventas);
  renderModalVentas(ventas,'');
  modal.classList.add('open');
}

// Tendencia de compra: total vendido por mes en los últimos 6 meses, sobre
// el histórico completo del cliente (no cambia con el filtro de mes de abajo).
function cliRenderTrend(ventas){
  var el=gel('cli-trend');if(!el)return;
  var nombresMes=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var hoy=new Date();
  var meses=[];
  for(var i=5;i>=0;i--){
    var d=new Date(hoy.getFullYear(),hoy.getMonth()-i,1);
    meses.push({key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),lbl:nombresMes[d.getMonth()],total:0,esActual:i===0});
  }
  var byKey={};meses.forEach(function(m){byKey[m.key]=m;});
  ventas.forEach(function(v){
    var mov=v.movimiento||'';
    var esDevol=mov==='Devolucion'||mov==='Devolución';
    if(esDevol||v.estado==='Anulado'||mov==='Visita')return;
    var k=v.fecha?v.fecha.substring(0,7):null;
    if(k&&byKey[k])byKey[k].total+=(v.total||0);
  });
  var max=Math.max.apply(null,meses.map(function(m){return m.total;}).concat([1]));
  var hayDatos=meses.some(function(m){return m.total>0;});
  if(!hayDatos){el.innerHTML='<div class="es" style="padding:.5rem;width:100%;"><strong>Sin compras en los últimos 6 meses.</strong></div>';return;}
  el.innerHTML=meses.map(function(m){
    var h=Math.max(6,Math.round((m.total/max)*100));
    return '<div class="ctb'+(m.esActual?' now':'')+'"><b>'+(m.total>0?'S/ '+m.total.toFixed(0):'')+'</b><i style="height:'+h+'%;" title="'+m.lbl+': S/ '+m.total.toFixed(2)+'"></i><span>'+m.lbl+'</span></div>';
  }).join('');
}

function cliRenderProdCards(ventas){
  var el=gel('cli-prod-cards');
  if(!el)return;
  var compMap={};
  ventas.forEach(function(v){
    var mov=v.movimiento||'';
    var esDevol=mov==='Devolucion'||mov==='Devolución';
    if(v.estado==='✅ Pagado'&&v.producto&&v.producto.trim()&&!esDevol){
      var p=v.producto.trim();
      if(!compMap[p])compMap[p]={cant:0,total:0};
      compMap[p].cant+=(v.cantidad||1);
      compMap[p].total+=(v.total||0);
    }
  });
  var pendMap={};
  ventas.forEach(function(v){
    if((v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido')&&v.producto&&v.producto.trim()){
      var p=v.producto.trim();
      if(!pendMap[p])pendMap[p]={cant:0,total:0};
      pendMap[p].cant+=(v.cantidad||1);
      pendMap[p].total+=(v.total||0);
    }
  });
  var compProds=Object.keys(compMap).sort(function(a,b){return compMap[b].total-compMap[a].total;});
  var pendProds=Object.keys(pendMap).filter(function(p){return !compMap[p];});
  if(!compProds.length&&!pendProds.length){el.innerHTML='';return;}
  var html='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:.5rem;padding:.4rem 0 .6rem;">';
  compProds.forEach(function(p){
    var c=compMap[p];var pend=pendMap[p];
    html+='<div style="background:linear-gradient(135deg,#f0f9ff,#dbeafe);border:1.5px solid var(--sky);border-radius:10px;padding:.6rem .9rem;">'+
      '<div style="font-size:9px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">📦 Comprado</div>'+
      '<div style="font-size:24px;font-weight:800;font-family:Bebas Neue,sans-serif;color:var(--brand);line-height:1;">'+c.cant+' <span style="font-size:11px;font-weight:400;color:var(--tl);">uds</span></div>'+
      '<div style="font-size:11px;font-weight:700;color:#1e293b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+p+'">'+p+'</div>'+
      '<div style="font-size:10px;color:var(--tl);margin-top:1px;"><strong>S/ '+c.total.toFixed(2)+'</strong></div>'+
      (pend?'<div style="font-size:10px;color:#d97706;margin-top:3px;font-weight:600;">⚠ '+pend.cant+' uds · S/ '+pend.total.toFixed(2)+'</div>':'')+
    '</div>';
  });
  pendProds.forEach(function(p){
    var pend=pendMap[p];
    html+='<div style="background:linear-gradient(135deg,#fff5e6,#ffe8c8);border:1.5px solid #f59e0b;border-radius:10px;padding:.6rem .9rem;">'+
      '<div style="font-size:9px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">⚠ Pendiente cobro</div>'+
      '<div style="font-size:24px;font-weight:800;font-family:Bebas Neue,sans-serif;color:#d97706;line-height:1;">'+pend.cant+' <span style="font-size:11px;font-weight:400;color:var(--tl);">uds</span></div>'+
      '<div style="font-size:11px;font-weight:700;color:#1e293b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+p+'">'+p+'</div>'+
      '<div style="font-size:10px;color:var(--tl);margin-top:1px;">Deuda: <strong>S/ '+pend.total.toFixed(2)+'</strong></div>'+
    '</div>';
  });
  html+='</div>';
  el.innerHTML=html;
}

function renderModalVentas(ventas,mes){
  var filtered=mes?ventas.filter(function(v){return v.fecha&&v.fecha.indexOf(mes)===0;}):ventas;
  cliRenderProdCards(filtered);
  // Ordenar: mas reciente primero (fecha desc -> hora desc -> id desc)
  filtered=filtered.slice().sort(function(a,b){
    var da=(a.fecha||'')+(a.hora||'00:00');
    var db=(b.fecha||'')+(b.hora||'00:00');
    if(db>da)return 1;if(db<da)return -1;
    return (b.id||'')>(a.id||'')?1:(b.id||'')<(a.id||'')?-1:0;
  });
  var total=0,cobrado=0,pendiente=0,transacc=0,ultimaFecha=null;
  for(var i=0;i<filtered.length;i++){
    var v=filtered[i];
    if(v.movimiento!=='Devolucion'&&v.estado!=='Anulado'){total+=(v.total||0);transacc++;}
    if(v.estado==='\u2705 Pagado')cobrado+=(v.total||0);
    if(v.estado==='\u23f3 Pendiente'||v.estado==='\u274c Vencido')pendiente+=(v.total||0);
    // "\u00daltima compra" = venta real m\u00e1s reciente, no una simple visita sin producto.
    if(v.movimiento!=='Visita'&&v.movimiento!=='Devolucion'&&v.estado!=='Anulado'&&v.fecha&&(!ultimaFecha||v.fecha>ultimaFecha))ultimaFecha=v.fecha;
  }
  var ticketProm=transacc>0?total/transacc:0;
  var ultimaTxt='Sin compras';
  if(ultimaFecha){
    var p=ultimaFecha.substring(0,10).split('-');
    var d1=Date.UTC(+p[0],+p[1]-1,+p[2]);
    var hoyD=new Date();
    var d2=Date.UTC(hoyD.getFullYear(),hoyD.getMonth(),hoyD.getDate());
    var dias=Math.round((d2-d1)/86400000);
    ultimaTxt=dias<=0?'Hoy':dias===1?'Ayer':'Hace '+dias+' d\u00edas';
  }
  var elStats=gel('cli-stats');
  if(elStats){
    elStats.innerHTML=
      '<div class="sc"><div class="sl">Total comprado</div><div class="sv sv-b">S/ '+total.toFixed(2)+'</div></div>'+
      '<div class="sc"><div class="sl">Transacciones</div><div class="sv sv-b">'+transacc+'</div></div>'+
      '<div class="sc"><div class="sl">Ticket promedio</div><div class="sv sv-s">S/ '+ticketProm.toFixed(2)+'</div></div>'+
      '<div class="sc"><div class="sl">\u00daltima compra</div><div class="sv" style="font-size:16px;color:var(--brand);">'+esc(ultimaTxt)+'</div></div>'+
      '<div class="sc"><div class="sl">Pendiente cobro</div><div class="sv" style="color:'+(pendiente>0?'var(--er)':'var(--ok)')+'">S/ '+pendiente.toFixed(2)+'</div></div>';
  }
  // Clientes con anos de antiguedad pueden acumular miles de transacciones.
  // Pintar la tabla completa de una sola vez (y que el observador de
  // accesibilidad la vuelva a recorrer entera) se sentia como una demora al
  // abrir la ficha. Se pinta un tope inicial con un boton para traer el resto.
  var haySobrante=!_cliHistVerTodo && filtered.length>CLI_HIST_LIMITE;
  var visibles=haySobrante?filtered.slice(0,CLI_HIST_LIMITE):filtered;
  // Franja de color a la izquierda de cada fila seg\u00fan su estado \u2014 permite
  // escanear pendientes/vencidos de un vistazo sin leer cada badge.
  var _colorEst={'\u2705 Pagado':'var(--ok)','\u23f3 Pendiente':'var(--warn)','\u274c Vencido':'var(--er)','Anulado':'var(--neutral)'};
  var rows='';
  for(var i=0;i<visibles.length;i++){
    var v=visibles[i];
    var canAnul=(v.estado!=='Anulado'&&v.estado!=='\ud83d\udce6 Devuelto');
    var barra=_colorEst[v.estado]||'transparent';
    rows+='<tr style="box-shadow:inset 3px 0 0 '+barra+';"><td>'+fmt(v.fecha)+(v.hora?' <span class="tm2">'+v.hora+'</span>':'')+'</td><td>'+bMov(v.movimiento)+'</td>'+
      '<td>'+(v.producto||'---')+(v.es_regalo?' <span class="b b-visita" title="Unidades de regalo, sin costo">🎁 Regalo</span>':'')+'</td><td>'+(v.cantidad||0)+'</td>'+
      '<td><strong>S/ '+Number(v.total||0).toFixed(2)+'</strong></td>'+
      '<td>'+bEst(v.estado)+'</td>'+
      '<td style="display:flex;gap:4px;flex-wrap:wrap;">'+
      '<button class="btn btn-sm" style="background:var(--sky4);color:var(--brand);border:1px solid var(--sky);" onclick="verDetalle(\''+v.id+'\')">Ver detalle</button>'+
      (canAnul?'<button class="btn btn-d btn-sm" onclick="event.stopPropagation();anularVenta(\''+v.id+'\')">Anular</button>':'---')+
      '</td>'+
      '</tr>';
  }
  var pie=haySobrante?
    '<div style="text-align:center;padding:.7rem;"><button type="button" class="btn btn-s btn-sm" onclick="_cliHistVerTodo=true;renderModalVentas(_cliHistUltimasVentas,_cliHistUltimoMes);">Ver las '+filtered.length+' transacciones</button></div>':'';
  gel('cli-historial').innerHTML=rows?
    '<table><thead><tr><th>Fecha</th><th>Movimiento</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Accion</th></tr></thead><tbody>'+rows+'</tbody></table>'+pie:
    '<div class="es" style="padding:1rem"><strong>Sin movimientos con este cliente.</strong><br>Sus visitas y ventas apareceran aqui.</div>';
  _cliHistUltimasVentas=ventas;
  _cliHistUltimoMes=mes;
}
var CLI_HIST_LIMITE=60;
var _cliHistVerTodo=false;
var _cliHistUltimasVentas=[];
var _cliHistUltimoMes='';
function filtrarModalMes(){
  var modal=gel('modal-cliente');
  var tipo=modal.dataset.tipo,nombre=modal.dataset.nombre;
  var mes=val('modal-mes');
  var ventas=_ventas.filter(function(v){return tipo==='vet'?v.veterinaria===nombre:v.doctora===nombre;});
  renderModalVentas(ventas,mes);
}

function cerrarCliente(){gel('modal-cliente').classList.remove('open');}

// ── EDITAR DATOS DE CLIENTE (con relaciones múltiples) ───────────
var _editCliRels=[]; // array de strings (doctores o vets vinculadas)
var _editCliRelsRemoved=[]; // los que el usuario quitó (para PATCH a null)

function abrirEditCliente(){
  var modal=gel('modal-cliente');
  var tipo=modal.dataset.tipo,nombre=modal.dataset.nombre;
  if(!tipo||!nombre)return;

  // Buscar todas las transacciones de este cliente
  var ventas=_ventas.filter(function(v){
    return tipo==='vet'?v.veterinaria===nombre:v.doctora===nombre;
  });
  ventas.sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');});
  var last=ventas[0]||{};

  // Precargar campos básicos
  gel('edit-cli-nombre').value=nombre;
  gel('edit-cli-celular').value=last.num_medico||'';
  gel('edit-cli-rel-new').value='';
  // RUC: la fuente canónica es clientes_vet.ruc (persiste aunque cambien las
  // ventas), no la última transacción. Para doctores no existe fila propia
  // en clientes_vet, así que ahí sí usamos la última venta como mejor esfuerzo.
  var rucEl=gel('edit-cli-ruc');
  if(rucEl){
    rucEl.value=last.ruc||'';
    if(tipo==='vet'){
      sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombre)+'&select=ruc')
      .then(function(r){
        var fila=r&&r[0];
        if(fila&&fila.ruc)rucEl.value=fila.ruc;
      }).catch(function(){});
    }
  }

  // Construir lista de relaciones: si es vet, lista de doctores; si es doctor, lista de vets
  var relSet={};
  ventas.forEach(function(v){
    var rel=tipo==='vet'?v.doctora:v.veterinaria;
    if(rel)relSet[rel]=true;
  });
  _editCliRels=Object.keys(relSet);
  _editCliRelsRemoved=[];

  // Configurar labels según tipo
  var lblText, helpText, placeholder;
  if(tipo==='vet'){
    lblText='Doctores / médicos que trabajan aquí';
    helpText='Los nombres aquí listados están vinculados a esta veterinaria. Puedes agregar o quitar.';
    placeholder='Nombre del doctor/a';
  } else {
    lblText='Veterinarias donde trabaja';
    helpText='Las veterinarias aquí listadas están vinculadas a este doctor/a. Puedes agregar o quitar.';
    placeholder='Nombre de la veterinaria';
  }
  gel('edit-cli-rels-lbl').textContent=lblText;
  gel('edit-cli-rels-help').textContent=helpText;
  gel('edit-cli-rel-new').placeholder=placeholder;

  _renderEditCliRels(tipo);

  // Ubicación: solo aplica a veterinarias — son las que necesitan coordenadas
  // para aparecer en "Mi Ruta" del vendedor.
  var ubicWrap=gel('edit-cli-ubicacion-wrap');
  if(ubicWrap){
    if(tipo==='vet'){ubicWrap.style.display='block';_cargarUbicacionVetEnEditor(nombre);}
    else ubicWrap.style.display='none';
  }

  // Cargar zonas
  var zsel=gel('edit-cli-zona');
  zsel.innerHTML='<option value="">— Sin cambio —</option>';
  sbG('vendedores','id=eq.'+CUR.id+'&select=zonas_asignadas').then(function(r){
    var asig=r&&r[0]&&r[0].zonas_asignadas&&r[0].zonas_asignadas.length?r[0].zonas_asignadas:null;
    var src=asig||_zonasList||[];
    for(var i=0;i<src.length;i++){
      var z=src[i].nombre||src[i];
      var opt=document.createElement('option');
      opt.value=z;opt.textContent=z;
      if(z===last.zona)opt.selected=true;
      zsel.appendChild(opt);
    }
  }).catch(function(){});

  modal.dataset.editTipo=tipo;
  modal.dataset.editNombre=nombre;
  gel('modal-edit-cliente').classList.add('open');
  setTimeout(function(){gel('edit-cli-nombre').focus();},200);
}

function _renderEditCliRels(tipo){
  var box=gel('edit-cli-rels-list');
  if(_editCliRels.length===0){
    box.innerHTML='<div style="font-size:11.5px;color:var(--tl);font-style:italic;padding:.4rem 0;">'+
      (tipo==='vet'?'Sin doctores vinculados aún. Agrega uno abajo.':'Sin veterinarias vinculadas aún. Agrega una abajo.')+
      '</div>';
    return;
  }
  // El "tipo del relacionado" es el opuesto: si edito vet, los rels son doctores
  var tipoRel=tipo==='vet'?'doc':'vet';
  var iconRel=tipo==='vet'?'\ud83d\udc69\u200d\u2695\ufe0f':'\ud83c\udfe5';
  box.innerHTML=_editCliRels.map(function(r,idx){
    return '<div style="display:flex;align-items:center;gap:6px;background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.45rem .55rem;font-size:13px;">'+
      '<span style="flex-shrink:0;font-size:14px;">'+iconRel+'</span>'+
      '<input type="text" value="'+r.replace(/"/g,'&quot;')+'" data-orig="'+r.replace(/"/g,'&quot;')+'" oninput="_editCliRelChange('+idx+',this.value)" style="flex:1;min-width:0;border:none;background:transparent;font-size:13px;font-weight:600;color:var(--brand);padding:0;"/>'+
      '<button onclick="editRelEntity(\''+tipoRel+'\',\''+r.replace(/'/g,"\\'")+'\')" title="Editar perfil de '+r.replace(/"/g,'&quot;')+'" style="background:none;border:none;color:var(--brand);cursor:pointer;font-size:13px;line-height:1;padding:2px 5px;border-radius:4px;flex-shrink:0;" onmouseover="this.style.background=\'rgba(20,79,89,.1)\'" onmouseout="this.style.background=\'none\'">\u270f\ufe0f</button>'+
      '<button onclick="_editCliRelRemove('+idx+')" style="background:none;border:none;color:var(--er);cursor:pointer;font-size:16px;line-height:1;padding:0 4px;flex-shrink:0;" title="Quitar de esta lista">×</button>'+
    '</div>';
  }).join('');
}

// Saltar a editar la entidad relacionada (doctor↔vet)
function editRelEntity(tipoRel, nombreRel){
  // Detectar cambios sin guardar
  var hayCambios=false;
  var modal=gel('modal-cliente');
  var oldNombre=modal.dataset.editNombre||modal.dataset.nombre;
  if((val('edit-cli-nombre')||'').trim()!==oldNombre)hayCambios=true;
  if(_editCliRelsRemoved.length>0)hayCambios=true;
  // Detectar inputs renombrados
  var inputs=document.querySelectorAll('#edit-cli-rels-list input[data-orig]');
  inputs.forEach(function(inp){
    if((inp.value||'').trim()!==inp.getAttribute('data-orig'))hayCambios=true;
  });
  if(!hayCambios){ _saltarAEntidad(tipoRel,nombreRel); return; }

  // El confirm() nativo respondía "Aceptar / Cancelar" a una pregunta con dos
  // acciones distintas. Los botones ahora dicen cuál es cuál, y el de
  // descartar va en rojo porque se pierde trabajo.
  SVUI.confirmar({
    titulo:'Tienes cambios sin guardar',
    mensaje:'Si abres "'+nombreRel+'" ahora, se perderá lo que has escrito en esta ficha.',
    confirmar:'Descartar y abrir',
    cancelar:'Seguir editando',
    peligro:true
  }).then(function(ok){
    if(ok) _saltarAEntidad(tipoRel,nombreRel);
  });
}

function _saltarAEntidad(tipoRel,nombreRel){
  // Cerrar editor actual
  cerrarEditCliente();
  cerrarCliente();
  // Pequeño delay para que las animaciones de cierre terminen, luego abrir el nuevo
  setTimeout(function(){
    verEntidad(tipoRel, nombreRel);
    setTimeout(function(){abrirEditCliente();},250);
  },200);
}

function _editCliRelChange(idx,value){
  _editCliRels[idx]=value;
}

function _editCliRelRemove(idx){
  var removed=_editCliRels[idx];
  if(removed && _editCliRelsRemoved.indexOf(removed)<0) _editCliRelsRemoved.push(removed);
  _editCliRels.splice(idx,1);
  var modal=gel('modal-cliente');
  _renderEditCliRels(modal.dataset.editTipo||'vet');
}

function addEditCliRel(){
  var inp=gel('edit-cli-rel-new');
  var v=(inp.value||'').trim();
  if(!v)return;
  if(_editCliRels.indexOf(v)>=0){setSt('Ya está en la lista','er');setTimeout(function(){setSt('');},1500);return;}
  _editCliRels.push(v);
  inp.value='';
  var modal=gel('modal-cliente');
  _renderEditCliRels(modal.dataset.editTipo||'vet');
  inp.focus();
}

function cerrarEditCliente(){
  gel('modal-edit-cliente').classList.remove('open');
  _editCliRels=[];_editCliRelsRemoved=[];
}

// ── UBICACIÓN DE LA VETERINARIA (geocodifica y guarda en clientes_vet) ──
function _cargarUbicacionVetEnEditor(nombreVet){
  var status=gel('edit-cli-ubic-status'),calle=gel('edit-cli-ubic-calle'),distrito=gel('edit-cli-ubic-distrito'),maps=gel('edit-cli-ubic-maps'),msg=gel('edit-cli-ubic-msg'),btnQuitar=gel('btn-edit-cli-ubic-quitar');
  if(status)status.textContent='Cargando ubicación…';
  if(calle)calle.value='';
  if(distrito)distrito.value='';
  if(maps)maps.value='';
  if(msg)msg.textContent='';
  if(btnQuitar)btnQuitar.style.display='none';
  // ilike (case-insensitive): la fila en clientes_vet puede haberse creado con
  // un casing distinto al que llega del modal (ventas guarda en mayúsculas,
  // SmartVet sync guarda capitalizado). Con eq la búsqueda fallaba y el modal
  // mostraba "sin ubicación" aunque la coordenada SÍ existía → causó el bug
  // reportado con HEALTHY PETS.
  sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombreVet)+'&select=direccion,distrito,latitud,longitud')
  .then(function(r){
    var fila=r&&r[0];
    if(fila&&fila.latitud&&fila.longitud){
      var dirDisplay=(fila.direccion||'')+(fila.distrito?', '+fila.distrito:'');
      var btnReverseGeo=!fila.direccion
        ? ' <button class="btn" onclick="obtenerDireccionDesdeCoords('+fila.latitud+','+fila.longitud+',\''+nombreVet.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')" style="font-size:11px;padding:2px 8px;margin-left:6px;vertical-align:middle;">📍 Obtener dirección</button>'
        : '';
      if(status)status.innerHTML='✅ '+(dirDisplay?'Ubicación: <strong>'+dirDisplay+'</strong>':'Tiene coordenadas pero sin dirección guardada.')+btnReverseGeo+' Puedes actualizarla abajo o quitarla.';
      if(btnQuitar)btnQuitar.style.display='inline-block';
      if(distrito)distrito.value=fila.distrito||'';
      // Pre-rellenar la calle quitando el distrito del final (el formato guardado
      // es "calle, distrito"). Si no podemos detectarlo, dejamos la dirección completa
      // para que el vendedor sólo tenga que ajustar lo que cambia.
      if(calle){
        var dirTxt=(fila.direccion||'').trim();
        var distTxt=(fila.distrito||'').trim();
        if(distTxt){
          var sufijo=', '+distTxt;
          if(dirTxt.toLowerCase().slice(-sufijo.length)===sufijo.toLowerCase()){
            calle.value=dirTxt.slice(0,dirTxt.length-sufijo.length).trim();
          } else {
            calle.value=dirTxt;
          }
        } else {
          calle.value=dirTxt;
        }
      }
    } else if(status){
      status.textContent='Aún no tiene ubicación registrada. Agrega su dirección o pega la URL de Google Maps para que aparezca en "Mi Ruta".';
    }
  })
  .catch(function(){if(status)status.textContent='Aún no tiene ubicación registrada. Agrega su dirección o pega la URL de Google Maps para que aparezca en "Mi Ruta".';});
}

// Llama a reverseGeocodificar (Nominatim) y guarda la dirección en clientes_vet
function obtenerDireccionDesdeCoords(lat,lon,nombreVet){
  var msg=gel('edit-cli-ubic-msg');
  if(msg){msg.style.color='var(--tl)';msg.textContent='Buscando dirección exacta…';}
  reverseGeocodificar(lat,lon).then(function(dir){
    if(!dir){
      if(msg){msg.style.color='var(--er)';msg.textContent='No se pudo obtener la dirección. Ingrésala manualmente.';}
      return;
    }
    sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombreVet)+'&select=id')
    .then(function(filas){
      if(!filas||!filas.length)return Promise.resolve();
      return sbU('clientes_vet',filas[0].id,{direccion:dir});
    })
    .then(function(){
      if(msg){msg.style.color='var(--ok)';msg.textContent='Dirección guardada: '+dir+' ✅';}
      _cargarUbicacionVetEnEditor(nombreVet);
    })
    .catch(function(){if(msg){msg.style.color='var(--er)';msg.textContent='Error guardando la dirección.';}});
  }).catch(function(){if(msg){msg.style.color='var(--er)';msg.textContent='Error consultando la dirección.';}});
}

function guardarUbicacionDesdeEditCliente(){
  var modal=gel('modal-cliente');
  var tipo=modal.dataset.editTipo||modal.dataset.tipo;
  var nombre=modal.dataset.editNombre||modal.dataset.nombre;
  if(tipo!=='vet'||!nombre)return;
  var calle=(val('edit-cli-ubic-calle')||'').trim();
  var distrito=(val('edit-cli-ubic-distrito')||'').trim();
  var mapsUrl=(val('edit-cli-ubic-maps')||'').trim();
  var msg=gel('edit-cli-ubic-msg');
  if(msg){msg.style.color='var(--tl)';msg.textContent=mapsUrl?'Leyendo coordenadas…':'Buscando dirección…';}
  var zonaFallback=val('edit-cli-zona')||'';
  guardarUbicacionVet(nombre,calle,distrito,zonaFallback,mapsUrl)
  .then(function(){
    if(msg){msg.style.color='var(--ok)';msg.textContent='Ubicación guardada ✅';}
    _cargarUbicacionVetEnEditor(nombre);
  })
  .catch(function(e){
    if(msg){msg.style.color='var(--er)';msg.textContent=SVUI.error(e);}
  });
}

function quitarUbicacionDesdeEditCliente(){
  var modal=gel('modal-cliente');
  var tipo=modal.dataset.editTipo||modal.dataset.tipo;
  var nombre=modal.dataset.editNombre||modal.dataset.nombre;
  if(tipo!=='vet'||!nombre)return;

  SVUI.confirmar({
    titulo:'¿Quitar la ubicación de esta veterinaria?',
    mensaje:'"'+nombre+'" pasará a "Sin ubicación" y dejará de aparecer en tu ruta '+
            'hasta que registres una nueva.\n\n'+
            'Tus visitas y ventas ya registradas no se tocan.',
    confirmar:'Quitar ubicación',
    cancelar:'Conservarla',
    peligro:true
  }).then(function(ok){
    if(!ok)return;
    var msg=gel('edit-cli-ubic-msg');
    if(msg){msg.style.color='var(--tl)';msg.textContent='Quitando ubicación…';}
    quitarUbicacionVet(nombre)
    .then(function(){
      if(msg){msg.style.color='var(--ok)';msg.textContent='Ubicación quitada.';}
      _cargarUbicacionVetEnEditor(nombre);
    })
    .catch(function(){
      if(msg){msg.style.color='var(--er)';msg.textContent='No se pudo quitar la ubicación. Revisa tu conexión e inténtalo otra vez.';}
    });
  });
}

function guardarEditCliente(){
  var modal=gel('modal-cliente');
  var tipo=modal.dataset.editTipo||modal.dataset.tipo;
  var oldNombre=modal.dataset.editNombre||modal.dataset.nombre;
  var newNombre=(val('edit-cli-nombre')||'').trim();
  // Las veterinarias se guardan siempre en MAYÚSCULAS (convención del panel);
  // los doctores se dejan como los escribió el vendedor (Nombre Apellido).
  if(tipo==='vet')newNombre=newNombre.toUpperCase();
  var newZona=val('edit-cli-zona');
  var newCel=val('edit-cli-celular');
  var newRuc=val('edit-cli-ruc');

  if(!newNombre){setSt('El nombre es obligatorio','er');return;}

  var campoNombre=tipo==='vet'?'veterinaria':'doctora';
  var campoRel=tipo==='vet'?'doctora':'veterinaria';

  // Patch base (datos generales): se aplica a TODAS las filas del cliente
  var patchBase={};
  if(newNombre!==oldNombre)patchBase[campoNombre]=newNombre;
  if(newZona)patchBase.zona=newZona;
  if(newCel)patchBase.num_medico=newCel;
  if(newRuc)patchBase.ruc=newRuc;

  // Detectar si hay relaciones renombradas (input editado): mapa orig→nuevo
  var renombres={};
  var inputs=document.querySelectorAll('#edit-cli-rels-list input[data-orig]');
  inputs.forEach(function(inp){
    var orig=inp.getAttribute('data-orig');
    var actual=(inp.value||'').trim();
    if(orig && actual && orig!==actual)renombres[orig]=actual;
  });

  var hayPatchBase=Object.keys(patchBase).length>0;
  var hayRenombres=Object.keys(renombres).length>0;
  var hayRemovidos=_editCliRelsRemoved.length>0;

  if(!hayPatchBase && !hayRenombres && !hayRemovidos){
    setSt('No hay cambios para guardar','er');
    return;
  }

  setBL('btn-edit-cli-save',true,'Guardando...');

  var filtroBase='vendedor_id=eq.'+CUR.id+'&'+campoNombre+'=eq.'+encodeURIComponent(oldNombre);
  var promesas=[];

  // 1. Patch base
  if(hayPatchBase){
    promesas.push(fetch(SB+'/rest/v1/ventas?'+filtroBase,{
      method:'PATCH', headers:getHeaders(),
      body:JSON.stringify(patchBase)
    }).then(function(r){if(!r.ok)throw new Error('base '+r.status);return r.json();}));
  }

  // 2. Renombrar relaciones individuales
  Object.keys(renombres).forEach(function(orig){
    var nuevo=renombres[orig];
    var nombreFiltro=newNombre!==oldNombre?newNombre:oldNombre; // si cambió, ya hicimos el patch base
    // Si todavía no se aplicó el patch base, filtramos por oldNombre
    var fNombre = hayPatchBase ? oldNombre : oldNombre;
    var f='vendedor_id=eq.'+CUR.id+'&'+campoNombre+'=eq.'+encodeURIComponent(fNombre)+'&'+campoRel+'=eq.'+encodeURIComponent(orig);
    promesas.push(fetch(SB+'/rest/v1/ventas?'+f,{
      method:'PATCH', headers:getHeaders(),
      body:JSON.stringify((function(){var p={};p[campoRel]=nuevo;return p;})())
    }).then(function(r){if(!r.ok)throw new Error('rename '+r.status);return r.json();}));
  });

  // 3. Quitar relaciones (set rel a null)
  _editCliRelsRemoved.forEach(function(rem){
    var f='vendedor_id=eq.'+CUR.id+'&'+campoNombre+'=eq.'+encodeURIComponent(oldNombre)+'&'+campoRel+'=eq.'+encodeURIComponent(rem);
    promesas.push(fetch(SB+'/rest/v1/ventas?'+f,{
      method:'PATCH', headers:getHeaders(),
      body:JSON.stringify((function(){var p={};p[campoRel]=null;return p;})())
    }).then(function(r){if(!r.ok)throw new Error('remove '+r.status);return r.json();}));
  });

  // 4. Mantener clientes_vet sincronizada para no perder el vínculo con Mi Ruta.
  //    Sin esto: al renombrar la vet, ventas.veterinaria queda con el nombre nuevo
  //    pero clientes_vet.nombre_vet con el viejo → Mi Ruta no encuentra el match
  //    y la vet desaparece del checklist con todo y su ubicación geocodificada.
  //    Aplica sólo cuando editamos una veterinaria (clientes_vet no tiene fila por doctor).
  if(tipo==='vet'){
    var cliPatch={};
    if(newNombre!==oldNombre)cliPatch.nombre_vet=newNombre;
    if(newZona)cliPatch.zona=newZona;
    if(newCel)cliPatch.num_medico=newCel;
    if(newRuc)cliPatch.ruc=newRuc;
    if(Object.keys(cliPatch).length>0){
      promesas.push(
        // ilike para sobrevivir mismatch de casing entre ventas (mayúsculas) y
        // clientes_vet (capitalizado) — sin esto un rename podía no encontrar la
        // fila y el cambio se "perdía" en pantalla aunque ventas SÍ se actualizara.
        sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(oldNombre)+'&select=id,doctora,zona,direccion,distrito,latitud,longitud,num_medico,tiempo_visita_minutos,ruc')
        .then(function(rows){
          if(!rows||!rows.length)return; // todavía no existe fila — la creará el sync de Registrar Visita
          // Antes de renombrar, verificar que no choque con otra fila ya existente
          if(cliPatch.nombre_vet){
            return sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(newNombre)+'&select=id,doctora,zona,direccion,distrito,latitud,longitud,num_medico,tiempo_visita_minutos,ruc')
            .then(function(colision){
              if(colision&&colision.length&&colision[0].id!==rows[0].id){
                // Ya existe una fila con el nombre nuevo — son el mismo cliente
                // registrado dos veces (p.ej. "Sash Vet - Ate" y "Sash - Salamanca").
                // Fusionamos: la fila con el nombre nuevo sobrevive, la vieja se elimina.
                var extra={};
                if(cliPatch.zona)extra.zona=cliPatch.zona;
                if(cliPatch.num_medico)extra.num_medico=cliPatch.num_medico;
                return mergeClientesVet(rows[0],colision[0],extra);
              }
              return sbU('clientes_vet',rows[0].id,cliPatch);
            });
          }
          return sbU('clientes_vet',rows[0].id,cliPatch);
        })
        .catch(function(e){ if(window.console)console.warn('No se pudo sincronizar clientes_vet:',e.message); })
      );
    }
    // Renombres de doctores vinculados a esta vet → reflejarlos en clientes_vet.doctora
    // si la fila tiene esa doctora como la registrada (clientes_vet sólo guarda una
    // doctora por vet — best effort).
    Object.keys(renombres).forEach(function(origDoc){
      var nuevoDoc=renombres[origDoc];
      promesas.push(
        sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(oldNombre)+'&doctora=eq.'+encodeURIComponent(origDoc)+'&select=id')
        .then(function(rows){
          if(!rows||!rows.length)return;
          return sbU('clientes_vet',rows[0].id,{doctora:nuevoDoc});
        })
        .catch(function(){})
      );
    });
  }

  Promise.all(promesas)
  .then(function(){
    // Refrescar tanto ventas como clientes_vet: vets "Nueva en cartera" viven en
    // _vetsExtra (de clientes_vet) y sin recargar quedaban con el nombre viejo
    // aunque el rename S\u00cd se aplic\u00f3 en BD \u2014 bug reportado.
    var jobs=[loadVentas()];
    if(typeof loadVeterinarias==='function')jobs.push(loadVeterinarias());
    return Promise.all(jobs).then(function(){
      cerrarEditCliente();
      var nombreFinal=newNombre!==oldNombre?newNombre:oldNombre;
      modal.dataset.nombre=nombreFinal;
      verEntidad(tipo,nombreFinal);
      rClientes();
      if(typeof rDash==='function')rDash();
      setSt('\u2705 Cambios guardados correctamente','ok');
      setTimeout(function(){setSt('');},2500);
    });
  })
  .catch(function(e){
    setSt(SVUI.error(e,'guardar'),'er');
  })
  .finally(function(){
    setBL('btn-edit-cli-save',false,'\ud83d\udcbe Guardar cambios');
  });
}

// Mejor-esfuerzo: extraer el distrito desde una URL de Google Maps. Muchos
// enlaces compartidos contienen "/place/<Nombre>/.../<Distrito>+15036+Perú" o
// "?q=<dirección+Distrito>". Probamos varios patrones; si no encontramos nada
// devolvemos "" y el vendedor lo escribe a mano. Conservador: solo aceptamos
// segmentos que parecen nombres de distrito limeño (sin números, sin "Perú").
var _DISTRITOS_LIMA=['Miraflores','San Borja','San Isidro','Surco','Santiago de Surco','La Molina','San Miguel','Magdalena','Pueblo Libre','Jesús María','Lince','Barranco','Chorrillos','Surquillo','Breña','Cercado','La Victoria','Rímac','San Juan de Lurigancho','San Juan de Miraflores','Villa María del Triunfo','Villa El Salvador','Ate','Santa Anita','El Agustino','Comas','Independencia','Los Olivos','San Martín de Porres','Carabayllo','Puente Piedra','Callao','Bellavista','La Perla','Ventanilla','Lurín','Pachacámac','Cieneguilla','Chaclacayo','Lurigancho','Punta Hermosa','Punta Negra','San Bartolo','Santa María del Mar','Pucusana'];
function extraerDistritoDeMapsUrl(url){
  if(!url)return '';
  try{
    var decoded=decodeURIComponent(url.replace(/\+/g,' '));
    var distLC={};
    _DISTRITOS_LIMA.forEach(function(d){distLC[d.toLowerCase()]=d;});
    // Ordenar de mayor a menor longitud para que "Santiago de Surco" gane sobre
    // "Surco" cuando la URL incluya el nombre largo.
    var ordenados=_DISTRITOS_LIMA.slice().sort(function(a,b){return b.length-a.length;});
    for(var i=0;i<ordenados.length;i++){
      var d=ordenados[i];
      // límites de palabra para no matchear "san juan" dentro de "san juan de lurigancho"
      var re=new RegExp('(^|[^a-záéíóúñ])'+d.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-záéíóúñ]|$)','i');
      if(re.test(decoded))return d;
    }
    return '';
  }catch(e){return '';}
}

// ── + AÑADIR CLIENTE (sin registrar visita) ─────────────────────────────
// Guarda en clientes_vet (tabla dedicada). Si el vendedor pone ubicación, queda
// listo para Mi Ruta — aunque no haya ventas registradas todavía, Mi Ruta
// incluye los clientes_vet de las zonas asignadas al vendedor.
function abrirNuevoCliente(){
  ['nc-nombre','nc-doctor','nc-celular','nc-ruc','nc-calle','nc-distrito','nc-maps'].forEach(function(id){
    var el=gel(id);if(el)el.value='';
  });
  var msg=gel('nc-msg');if(msg){msg.textContent='';msg.style.color='var(--tl)';}

  // Llenar zonas con las asignadas al vendedor (si tiene); si no, todas las zonas
  var sel=gel('nc-zona');
  if(sel){
    sel.innerHTML='<option value="">— Seleccionar zona —</option>';
    var src=(CUR&&Array.isArray(CUR.zonas_asignadas)&&CUR.zonas_asignadas.length)?CUR.zonas_asignadas:(_zonasList||[]).map(function(z){return z.nombre||z;});
    src.forEach(function(z){
      var o=document.createElement('option');o.value=z;o.textContent=z;sel.appendChild(o);
    });
  }
  gel('modal-nuevo-cliente').classList.add('open');
  setTimeout(function(){var i=gel('nc-nombre');if(i)i.focus();},200);
}

function cerrarNuevoCliente(){gel('modal-nuevo-cliente').classList.remove('open');}

function guardarNuevoCliente(){
  // Veterinarias siempre en MAYÚSCULAS — mismo criterio que el resto del panel.
  var nombre=(val('nc-nombre')||'').trim().toUpperCase();
  var zona=(val('nc-zona')||'').trim();
  var doctor=(val('nc-doctor')||'').trim();
  var celular=(val('nc-celular')||'').trim();
  var ruc=(val('nc-ruc')||'').trim();
  var calle=(val('nc-calle')||'').trim();
  var distrito=(val('nc-distrito')||'').trim();
  var mapsUrl=(val('nc-maps')||'').trim();
  var msg=gel('nc-msg');

  if(!nombre){if(msg){msg.style.color='var(--er)';msg.textContent='El nombre es obligatorio.';}return;}
  if(!zona){if(msg){msg.style.color='var(--er)';msg.textContent='Selecciona una zona.';}return;}

  // Si pegaron URL de Maps y no escribieron distrito, intentar extraerlo del slug.
  // Mejor esfuerzo: muchos URLs de Maps incluyen el distrito en el path o en el
  // parámetro "place". Si lo encontramos, lo usamos sin pisar lo que ya escribió.
  if(!distrito && mapsUrl){
    var distExtra=extraerDistritoDeMapsUrl(mapsUrl);
    if(distExtra){
      distrito=distExtra;
      var dEl=gel('nc-distrito');if(dEl)dEl.value=distrito;
    }
  }

  setBL('btn-nc-save',true,'Guardando…');

  // Pasos:
  // 1. Verificar que no exista ya una fila con mismo nombre+distrito (case-insensitive).
  //    Permitimos mismo nombre si los distritos difieren — varias vets con el mismo
  //    nombre en distritos distintos son negocios distintos. Si hay otra con el
  //    nombre y aún no nos dieron distrito, lo exigimos para diferenciar.
  // 2. Si hay ubicación → resolver coords (URL Maps prioridad, fallback geocoding)
  // 3. Insertar fila en clientes_vet con todo lo capturado
  sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombre)+'&select=id,nombre_vet,distrito')
  .then(function(existentes){
    if(existentes&&existentes.length){
      var distLC=(distrito||'').toLowerCase();
      var choque=existentes.find(function(x){return (x.distrito||'').toLowerCase()===distLC;});
      if(choque){
        throw new Error('Ya existe "'+choque.nombre_vet+'"'+(choque.distrito?' en '+choque.distrito:' sin distrito')+'. Usa la cartera para editarla.');
      }
      if(!distrito){
        var sample=existentes[0];
        throw new Error('Ya existe una veterinaria con ese nombre'+(sample.distrito?' en '+sample.distrito:'')+'. Indica el distrito de esta para diferenciarlas.');
      }
    }
    var hayUbicacion=mapsUrl || (calle && distrito);
    if(!hayUbicacion)return null; // guardar sin coords
    return resolverCoordsUbicacion(calle,distrito,mapsUrl);
  })
  .then(function(coords){
    var datos={nombre_vet:nombre, zona:zona};
    if(doctor)datos.doctora=doctor;
    if(celular)datos.num_medico=celular;
    if(ruc)datos.ruc=ruc;
    if(coords){
      datos.direccion=[calle,distrito].filter(Boolean).join(', ')||coords.direccion||(coords.latitud+', '+coords.longitud);
      if(distrito)datos.distrito=distrito;
      datos.latitud=coords.latitud;
      datos.longitud=coords.longitud;
    }
    return sbP('clientes_vet',datos);
  })
  .then(function(){
    if(msg){msg.style.color='var(--ok)';msg.textContent='✅ Cliente añadido a tu cartera.';}
    // Invalidar caches que consumen clientes_vet:
    //  - _rutaVetes: dropdown de Mi Ruta (lo recarga al volver a entrar)
    //  - _vetes / _docMap / _vetDocMap: cache global que alimenta el autocomplete
    //    de "Registrar Visita" (mv-vete) y el de doctores. Sin recargarla, la
    //    nueva veterinaria solo aparece tras un F5 completo — bug reportado.
    _rutaVetes=[];
    var reload = (typeof loadVeterinarias==='function') ? loadVeterinarias() : Promise.resolve();
    reload.then(function(){
      cerrarNuevoCliente();
      if(typeof rClientes==='function')rClientes();
    });
  })
  .catch(function(e){
    if(msg){msg.style.color='var(--er)';msg.textContent=SVUI.error(e);}
  })
  .finally(function(){
    setBL('btn-nc-save',false,'💾 Guardar cliente');
  });
}

/* ── Confirmación de anulación ───────────────────────────────────── */