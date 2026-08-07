// ══════════════════════════════════════════════════════════════
// BAJAS Y TRANSFERENCIAS DE CARTERA
// - Soft-delete de vendedores (activo=false + fecha_baja)
// - Reasignación masiva por zona (flujo "Dar de baja")
// - Transferencia ongoing entre cualquier par de vendedores
// - Auditoría en tabla transferencias_cartera
// ══════════════════════════════════════════════════════════════

var _vendFiltro = 'activos'; // 'activos' | 'inactivos' | 'todos'

// ── ESTADOS PENDIENTES ──
function _esPendiente(estado){
  return estado==='⏳ Pendiente' || estado==='❌ Vencido';
}

// Lista de créditos pendientes de un vendedor (con filtros opcionales)
// filtros = { zonas:[...], excluirClientes:[{vet,doc}, ...] }
function _pendientesDe(vendedorId, filtros){
  filtros = filtros || {};
  var zonasFil = (filtros.zonas||[]).map(function(z){return (z||'').toLowerCase();});
  var excl = filtros.excluirClientes||[];
  return (_ventas||[]).filter(function(v){
    if(String(v.vendedor_id)!==String(vendedorId)) return false;
    if(v.movimiento!=='Credito a 15 dias' && v.movimiento!=='Crédito a 15 días') return false;
    if(!_esPendiente(v.estado)) return false;
    if(zonasFil.length && zonasFil.indexOf((v.zona||'').toLowerCase())<0) return false;
    for(var i=0;i<excl.length;i++){
      var e=excl[i];
      if((v.veterinaria||'')===(e.vet||'') && (v.doctora||'')===(e.doc||'')) return true===false; // será cubierta por override
    }
    return true;
  });
}

// Lista única de pares vet/doctor con datos agregados para un vendedor
function _carteraDe(vendedorId){
  var map={};
  (_ventas||[]).forEach(function(v){
    if(String(v.vendedor_id)!==String(vendedorId)) return;
    var key=(v.veterinaria||'—')+'|'+(v.doctora||'—')+'|'+(v.zona||'—');
    if(!map[key]){
      map[key]={
        veterinaria:v.veterinaria||'', doctora:v.doctora||'', zona:v.zona||'',
        pendientes:0, montoPend:0, totalVentas:0
      };
    }
    map[key].totalVentas++;
    if((v.movimiento==='Credito a 15 dias'||v.movimiento==='Crédito a 15 días') && _esPendiente(v.estado)){
      map[key].pendientes++;
      map[key].montoPend += Number(v.total||0);
    }
  });
  var arr=Object.keys(map).map(function(k){return map[k];});
  arr.sort(function(a,b){
    if(a.zona!==b.zona) return a.zona.localeCompare(b.zona);
    return a.veterinaria.localeCompare(b.veterinaria);
  });
  return arr;
}

// ── CORE: TRANSFERIR CARTERA ──
// origenId, destinoId, filtros = {zonas:[], clientes:[{vet,doc}]}, tipo, motivo
// Mueve TODAS las transacciones del origen (contado, delivery, crédito pendiente
// o ya pagado, cobros de crédito, devoluciones, visitas) que matcheen el filtro
// de zonas/clientes — no solo los créditos pendientes. El cliente/zona pasa por
// completo, con todo su historial, al vendedor destino.
// Si filtros.clientes está vacío → mueve todo el origen filtrado por zonas.
// Si filtros.clientes está lleno → mueve solo esos pares vet/doc.
// Retorna Promise con resumen { numVentas, montoPend }
function transferirCartera(origenId, destinoId, filtros, tipo, motivo){
  filtros = filtros||{};
  var ventasMover = (_ventas||[]).filter(function(v){
    if(String(v.vendedor_id)!==String(origenId)) return false;
    if(filtros.zonas && filtros.zonas.length && filtros.zonas.indexOf(v.zona)<0) return false;
    if(filtros.clientes && filtros.clientes.length){
      return filtros.clientes.some(function(c){
        return (c.vet||'')===(v.veterinaria||'') && (c.doc||'')===(v.doctora||'') && (c.zona||'')===(v.zona||'');
      });
    }
    return true;
  });

  if(!ventasMover.length){
    return Promise.resolve({numVentas:0, montoPend:0});
  }

  var ids = ventasMover.map(function(v){return v.id;});
  var monto = ventasMover.reduce(function(s,v){return s+Number(v.total||0);},0);

  // PATCH masivo por id IN (...)
  var inClause = 'id=in.('+ids.map(encodeURIComponent).join(',')+')';
  var nombreAdm = _adminNombre||'admin';
  return fetch(SB+'/rest/v1/ventas?'+inClause, {
    method:'PATCH',
    headers:Object.assign(getHeaders(),{'Prefer':'return=minimal'}),
    body:JSON.stringify({vendedor_id:destinoId})
  }).then(function(r){
    if(!r.ok) return r.text().then(function(tx){throw new Error(_errMsg(r.status,tx));});

    // Auditoría: una fila por (zona, vet, doc) agregada.
    // monto_pendiente_movido acumula el total de TODAS las transacciones movidas
    // (no solo créditos pendientes), para reflejar el monto real transferido.
    var aggMap={};
    ventasMover.forEach(function(v){
      var key=(v.zona||'')+'|'+(v.veterinaria||'')+'|'+(v.doctora||'');
      if(!aggMap[key]) aggMap[key]={
        tipo:tipo||'transferencia',
        vendedor_origen_id:origenId,
        vendedor_destino_id:destinoId,
        zona:v.zona||null, veterinaria:v.veterinaria||null, doctora:v.doctora||null,
        num_ventas_movidas:0, monto_pendiente_movido:0,
        motivo:motivo||null, usuario_admin:nombreAdm
      };
      aggMap[key].num_ventas_movidas++;
      aggMap[key].monto_pendiente_movido += Number(v.total||0);
    });
    var rows=Object.keys(aggMap).map(function(k){return aggMap[k];});
    // Best-effort audit (no bloquea si falla la tabla aún no existe)
    return sbP('transferencias_cartera', rows).catch(function(e){
      if(window.console) console.warn('No se pudo registrar auditoría de transferencia:', e.message);
    }).then(function(){return {numVentas:ids.length, montoPend:monto};});
  });
}

// ══════════════════════════════════════════════════════════════
// UI: TABS Activos/Inactivos/Todos
// ══════════════════════════════════════════════════════════════
function vendSetFiltro(f, btn){
  _vendFiltro = f;
  document.querySelectorAll('.vend-tab').forEach(function(b){
    b.classList.remove('btn-p'); b.classList.add('btn-s');
  });
  if(btn){ btn.classList.remove('btn-s'); btn.classList.add('btn-p'); }
  if(typeof rVendedores==='function') rVendedores();
}

function _vendVisible(v){
  if(_vendFiltro==='activos')   return v.activo!==false;
  if(_vendFiltro==='inactivos') return v.activo===false;
  return true;
}

// ══════════════════════════════════════════════════════════════
// FLUJO A: DAR DE BAJA
// ══════════════════════════════════════════════════════════════
var _vbExcepciones = []; // [{vet,doc,destino_id}]

function darDeBajaVendedor(id){
  var v=null;
  for(var i=0;i<_vendedores.length;i++){if(_vendedores[i].id===id){v=_vendedores[i];break;}}
  if(!v) return;
  gel('vb-id').value=id;
  gel('vb-nombre').textContent=v.nombre+(v.usuario?' · @'+v.usuario:'');
  gel('vb-fecha').value=hoy();
  gel('vb-motivo').value='';
  _vbExcepciones=[];
  vbRenderZonas(v);
  vbRenderExcepciones(v);
  vbActualizarPreview();
  abrirModal('modal-vend-baja');
}

function vbRenderZonas(v){
  var zonas = v.zonas_asignadas||[];
  if(!zonas.length){
    gel('vb-zonas-list').innerHTML='<div style="font-size:12px;color:var(--tl);font-style:italic;">Este vendedor no tiene zonas asignadas.</div>';
    return;
  }
  var optsBase='<option value="">— Sin asignar —</option>';
  _vendedores.forEach(function(vv){
    if(vv.id===v.id) return;
    if(vv.activo===false) return;
    optsBase+='<option value="'+esc(vv.id)+'">'+esc(vv.nombre)+'</option>';
  });
  var html='';
  zonas.forEach(function(z){
    var pend = _ventas.filter(function(vt){
      return String(vt.vendedor_id)===String(v.id) && vt.zona===z &&
        (vt.movimiento==='Credito a 15 dias'||vt.movimiento==='Crédito a 15 días') &&
        _esPendiente(vt.estado);
    });
    var monto=pend.reduce(function(s,vt){return s+Number(vt.total||0);},0);
    html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:center;padding:6px;background:var(--sky4);border:1px solid var(--sky);border-radius:8px;">'+
      '<div><div style="font-weight:700;font-size:13px;color:var(--brand);">'+esc(z)+'</div>'+
      '<div style="font-size:11px;color:var(--tl);">'+pend.length+' pendiente'+(pend.length!==1?'s':'')+' · '+money(monto)+'</div></div>'+
      '<select data-vb-zona="'+esc(z)+'" onchange="vbActualizarPreview()" style="width:100%;padding:.4rem .6rem;border:1.5px solid var(--bd);border-radius:8px;font-size:13px;">'+optsBase+'</select>'+
      '</div>';
  });
  gel('vb-zonas-list').innerHTML=html;
}

function vbRenderExcepciones(v){
  var clientes = _carteraDe(v.id).filter(function(c){return c.totalVentas>0;});
  if(!clientes.length){
    gel('vb-excep-list').innerHTML='<div style="font-size:12px;color:var(--tl);font-style:italic;">No hay clientes para overridear.</div>';
    return;
  }
  var optsBase='<option value="">Default (sucesor de zona)</option>';
  _vendedores.forEach(function(vv){
    if(vv.id===v.id) return;
    if(vv.activo===false) return;
    optsBase+='<option value="'+esc(vv.id)+'">'+esc(vv.nombre)+'</option>';
  });
  var html='';
  clientes.forEach(function(c, idx){
    html+='<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:8px;align-items:center;">'+
      '<div style="font-size:12px;">'+
        '<strong>'+esc(c.veterinaria||c.doctora||'—')+'</strong>'+
        (c.doctora&&c.veterinaria?' · '+esc(c.doctora):'')+
        '<div style="font-size:10px;color:var(--tl);">'+esc(c.zona)+' · '+c.totalVentas+' transacción'+(c.totalVentas!==1?'es':'')+(c.pendientes?' · '+c.pendientes+' pend. ('+money(c.montoPend)+')':'')+'</div>'+
      '</div>'+
      '<select data-vb-ex-vet="'+esc(c.veterinaria)+'" data-vb-ex-doc="'+esc(c.doctora)+'" onchange="vbActualizarPreview()" style="width:100%;padding:.35rem .55rem;border:1px solid var(--bd);border-radius:6px;font-size:12px;">'+optsBase+'</select>'+
    '</div>';
  });
  gel('vb-excep-list').innerHTML=html;
}

// Lee la decisión actual: para cada transacción del saliente (de cualquier tipo:
// contado, delivery, crédito pendiente o pagado, cobros, devoluciones, visitas),
// ¿a quién va? Retorna mapa { ventaId: destinoId } y stats agregadas.
function vbCalcularPlan(){
  var id = gel('vb-id').value;
  var v = null; for(var i=0;i<_vendedores.length;i++){if(_vendedores[i].id===id){v=_vendedores[i];break;}}
  if(!v) return null;

  var zonaMap={};
  document.querySelectorAll('#vb-zonas-list select[data-vb-zona]').forEach(function(s){
    zonaMap[s.getAttribute('data-vb-zona')]=s.value||'';
  });
  var excepMap={};
  document.querySelectorAll('#vb-excep-list select[data-vb-ex-vet]').forEach(function(s){
    var vet=s.getAttribute('data-vb-ex-vet')||'';
    var doc=s.getAttribute('data-vb-ex-doc')||'';
    if(s.value) excepMap[vet+'|'+doc]=s.value;
  });

  var asignaciones={}; // destinoId -> {ventas:[], monto, zonas:Set, clientes:Set}
  var sinAsignar={ventas:[], monto:0};

  (_ventas||[]).forEach(function(vt){
    if(String(vt.vendedor_id)!==String(id)) return;
    var destino = excepMap[(vt.veterinaria||'')+'|'+(vt.doctora||'')] || zonaMap[vt.zona||''] || '';
    if(!destino){
      sinAsignar.ventas.push(vt); sinAsignar.monto+=Number(vt.total||0);
      return;
    }
    if(!asignaciones[destino]) asignaciones[destino]={ventas:[], monto:0, zonas:{}, clientes:{}};
    asignaciones[destino].ventas.push(vt);
    asignaciones[destino].monto += Number(vt.total||0);
    if(vt.zona) asignaciones[destino].zonas[vt.zona]=1;
    asignaciones[destino].clientes[(vt.veterinaria||'')+'|'+(vt.doctora||'')]=1;
  });

  return {v:v, zonaMap:zonaMap, excepMap:excepMap, asignaciones:asignaciones, sinAsignar:sinAsignar};
}

function vbActualizarPreview(){
  var plan = vbCalcularPlan(); if(!plan) return;
  var nombres = function(id){var x=_vendedores.filter(function(vv){return vv.id===id;})[0];return x?x.nombre:'?';};
  var total=0, lines=[];
  Object.keys(plan.asignaciones).forEach(function(destinoId){
    var a=plan.asignaciones[destinoId];
    var zonas=Object.keys(a.zonas).length, clientes=Object.keys(a.clientes).length;
    total+=a.ventas.length;
    lines.push('→ <strong>'+esc(nombres(destinoId))+'</strong>: '+zonas+' zona'+(zonas!==1?'s':'')+' · '+clientes+' cliente'+(clientes!==1?'s':'')+' · '+a.ventas.length+' transacción'+(a.ventas.length!==1?'es':'')+' ('+money(a.monto)+')');
  });
  if(plan.sinAsignar.ventas.length){
    lines.push('<span style="color:#dc2626;">⚠ '+plan.sinAsignar.ventas.length+' transacciones sin sucesor ('+money(plan.sinAsignar.monto)+') — quedarán sin asignar</span>');
  }
  if(!lines.length){
    gel('vb-preview').innerHTML='<em>Sin transacciones que reasignar.</em>';
  } else {
    gel('vb-preview').innerHTML='<div style="font-weight:700;margin-bottom:4px;">Plan de transferencia</div>'+lines.join('<br>');
  }
}

function confirmarBaja(){
  var plan = vbCalcularPlan(); if(!plan) return;
  var v = plan.v;
  var fechaBaja = gel('vb-fecha').value || hoy();
  var motivo = gel('vb-motivo').value.trim();

  setBL('btn-vb-ok',true,'Procesando...');
  // 1) Transferir pendientes en bulk a cada destino
  var destinos = Object.keys(plan.asignaciones);
  var transferChain = destinos.reduce(function(chain, destinoId){
    return chain.then(function(){
      var a = plan.asignaciones[destinoId];
      var ids = a.ventas.map(function(vt){return vt.id;});
      // Reusar transferirCartera filtrando por ids ya seleccionados:
      // construimos un PATCH directo, más simple y coherente con auditoría.
      var clientes = Object.keys(a.clientes).map(function(k){var p=k.split('|');return {vet:p[0],doc:p[1]};});
      return transferirCartera(v.id, destinoId, {clientes:clientes}, 'baja', motivo||('Baja '+v.nombre));
    });
  }, Promise.resolve());

  transferChain.then(function(){
    // 2) Reasignar zonas: cada zona va al sucesor configurado (si hay)
    var zonaPorDestino={};
    Object.keys(plan.zonaMap).forEach(function(z){
      var d=plan.zonaMap[z]; if(!d) return;
      if(!zonaPorDestino[d]) zonaPorDestino[d]=[];
      zonaPorDestino[d].push(z);
    });
    var zonasChain = Object.keys(zonaPorDestino).reduce(function(chain, destinoId){
      return chain.then(function(){
        var destino = _vendedores.filter(function(vv){return vv.id===destinoId;})[0];
        if(!destino) return;
        var nuevas = (destino.zonas_asignadas||[]).slice();
        zonaPorDestino[destinoId].forEach(function(z){ if(nuevas.indexOf(z)<0) nuevas.push(z); });
        return sbU('vendedores', destinoId, {zonas_asignadas:nuevas});
      });
    }, Promise.resolve());
    return zonasChain;
  }).then(function(){
    // 3) Quitar zonas transferidas del saliente + marcar inactivo
    var zonasTransferidas = Object.keys(plan.zonaMap).filter(function(z){return !!plan.zonaMap[z];});
    var restantes = (v.zonas_asignadas||[]).filter(function(z){return zonasTransferidas.indexOf(z)<0;});
    return sbU('vendedores', v.id, {
      activo:false,
      fecha_baja:fechaBaja,
      motivo_baja:motivo||null,
      zonas_asignadas:restantes
    });
  }).then(function(){ return loadAll(); })
  .then(function(){
    cerrarModal('modal-vend-baja');
    rVendedores();
    setSt(''+v.nombre+' dado de baja correctamente','ok');
    setTimeout(function(){setSt('');},3500);
  }).catch(function(e){ setSt(SVUI.error(e),'er'); })
  .finally(function(){ setBL('btn-vb-ok',false,'Confirmar baja'); });
}

// ══════════════════════════════════════════════════════════════
// REACTIVAR
// ══════════════════════════════════════════════════════════════
function reactivarVendedor(id){
  var v=_vendedores.filter(function(vv){return vv.id===id;})[0];
  if(!v) return;
  showConfirm(
    '¿Reactivar a <strong>'+esc(v.nombre)+'</strong>? Volverá a aparecer en los listados, pero las zonas y créditos que ya transferiste a otros vendedores no se devuelven automáticamente.',
    'Reactivar vendedor','Reactivar', function(){
      sbU('vendedores', id, {activo:true, fecha_baja:null, motivo_baja:null})
        .then(function(){return loadAll();})
        .then(function(){ rVendedores(); setSt(''+v.nombre+' reactivado','ok'); setTimeout(function(){setSt('');},2500); })
        .catch(function(e){setSt(SVUI.error(e),'er');});
    });
}

// ══════════════════════════════════════════════════════════════
// FLUJO B: TRANSFERIR CARTERA (puntual, entre activos)
// ══════════════════════════════════════════════════════════════
function abrirTransferenciaCartera(){
  var selO=gel('vt-origen'), selD=gel('vt-destino');
  selO.innerHTML='<option value="">— Seleccionar —</option>';
  selD.innerHTML='<option value="">— Seleccionar —</option>';
  _vendedores.forEach(function(v){
    var o=document.createElement('option');o.value=v.id;
    o.textContent=v.nombre+(v.activo===false?' (inactivo)':'');
    selO.appendChild(o);
    if(v.activo!==false){
      var o2=document.createElement('option');o2.value=v.id;o2.textContent=v.nombre;
      selD.appendChild(o2);
    }
  });
  gel('vt-motivo').value='';
  gel('vt-cartera').innerHTML='<div style="font-size:12px;color:var(--tl);padding:1rem;text-align:center;">Selecciona un vendedor origen para ver su cartera.</div>';
  gel('vt-preview').innerHTML='';
  abrirModal('modal-vend-transf');
}

function vtRenderCartera(){
  var origenId = gel('vt-origen').value;
  if(!origenId){
    gel('vt-cartera').innerHTML='<div style="font-size:12px;color:var(--tl);padding:1rem;text-align:center;">Selecciona un vendedor origen para ver su cartera.</div>';
    vtActualizarPreview(); return;
  }
  var cartera = _carteraDe(origenId);
  if(!cartera.length){
    gel('vt-cartera').innerHTML='<div style="font-size:12px;color:var(--tl);padding:1rem;text-align:center;">Este vendedor no tiene cartera registrada.</div>';
    vtActualizarPreview(); return;
  }
  var porZona={};
  cartera.forEach(function(c){
    var z=c.zona||'—';
    if(!porZona[z]) porZona[z]=[];
    porZona[z].push(c);
  });
  var html='';
  Object.keys(porZona).forEach(function(z){
    html+='<div style="margin-bottom:.7rem;">'+
      '<div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--brand);letter-spacing:.4px;margin-bottom:4px;padding:4px 6px;background:var(--sky4);border-radius:6px;">'+
        '<input type="checkbox" onclick="vtToggleZona(\''+esc(z).replace(/\'/g,"\\'")+'\',this.checked)" style="width:14px;height:14px;"/> '+esc(z)+'</div>';
    porZona[z].forEach(function(c){
      html+='<label style="display:flex;align-items:center;gap:8px;padding:5px 8px;font-size:12px;cursor:pointer;border-bottom:1px solid var(--bd);">'+
        '<input type="checkbox" class="vt-cart-cb" data-vet="'+esc(c.veterinaria)+'" data-doc="'+esc(c.doctora)+'" data-zona="'+esc(c.zona)+'" data-monto="'+c.montoPend+'" data-pend="'+c.pendientes+'" data-total="'+c.totalVentas+'" onchange="vtActualizarPreview()" style="width:16px;height:16px;flex-shrink:0;padding:0;"/>'+
        '<div style="flex:1;"><strong>'+esc(c.veterinaria||c.doctora||'—')+'</strong>'+
        (c.veterinaria&&c.doctora?' · '+esc(c.doctora):'')+
        '<div style="font-size:10px;color:var(--tl);">'+c.totalVentas+' transacción'+(c.totalVentas!==1?'es':'')+(c.pendientes?' · '+c.pendientes+' pend. ('+money(c.montoPend)+')':'')+'</div></div>'+
      '</label>';
    });
    html+='</div>';
  });
  gel('vt-cartera').innerHTML=html;
  vtActualizarPreview();
}

function vtToggleZona(zona, checked){
  document.querySelectorAll('.vt-cart-cb[data-zona="'+(zona||'').replace(/"/g,'\\"')+'"]').forEach(function(cb){
    cb.checked=checked;
  });
  vtActualizarPreview();
}
function vtSeleccionarTodo(){ document.querySelectorAll('.vt-cart-cb').forEach(function(cb){cb.checked=true;}); vtActualizarPreview(); }
function vtSeleccionarNada(){ document.querySelectorAll('.vt-cart-cb').forEach(function(cb){cb.checked=false;}); vtActualizarPreview(); }

function vtActualizarPreview(){
  var sel=document.querySelectorAll('.vt-cart-cb:checked');
  var pend=0, total=0;
  sel.forEach(function(cb){ pend+=Number(cb.dataset.pend||0); total+=Number(cb.dataset.total||0); });
  if(!sel.length){
    gel('vt-preview').innerHTML='<em>Selecciona vets/doctores para transferir.</em>';
  } else {
    gel('vt-preview').innerHTML='<strong>'+sel.length+' cliente'+(sel.length!==1?'s':'')+'</strong> · '+total+' transacción'+(total!==1?'es':'')+' en total'+(pend?' (incluye '+pend+' créditos pendientes)':'')+' por transferir';
  }
}

function confirmarTransferencia(){
  var origen=gel('vt-origen').value, destino=gel('vt-destino').value;
  if(!origen||!destino){setSt('Selecciona origen y destino','er');return;}
  if(origen===destino){setSt('Origen y destino no pueden ser el mismo','er');return;}
  var sel=document.querySelectorAll('.vt-cart-cb:checked');
  if(!sel.length){setSt('Selecciona al menos un cliente','er');return;}
  var clientes=[];
  sel.forEach(function(cb){ clientes.push({vet:cb.dataset.vet||'', doc:cb.dataset.doc||'', zona:cb.dataset.zona||''}); });
  var motivo=gel('vt-motivo').value.trim();

  setBL('btn-vt-ok',true,'Procesando...');
  transferirCartera(origen, destino, {clientes:clientes}, 'transferencia', motivo||null)
    .then(function(res){return loadAll().then(function(){return res;});})
    .then(function(res){
      cerrarModal('modal-vend-transf');
      rVendedores();
      setSt(''+res.numVentas+' transacciones transferidas · '+money(res.montoPend),'ok');
      setTimeout(function(){setSt('');},3500);
    })
    .catch(function(e){setSt(SVUI.error(e),'er');})
    .finally(function(){setBL('btn-vt-ok',false,'Confirmar transferencia');});
}
