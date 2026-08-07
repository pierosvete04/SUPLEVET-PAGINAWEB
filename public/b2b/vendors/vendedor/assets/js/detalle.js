var _pendingAnularId=null;
var _pendingAnularGrupoIds=null;

function abrirConfirmAnular(id){
  _pendingAnularId=id;
  _pendingAnularGrupoIds=null;
  // Restaurar texto para anulación individual
  var t=gel('confirm-anular-title');if(t)t.textContent='Anular transacción';
  var m=gel('confirm-anular-msg');if(m)m.textContent='¿Seguro que quieres anular esta transacción? Esta acción no se puede deshacer.';
  gel('modal-confirm-anular').classList.add('open');
}
function abrirConfirmAnularGrupo(ids){
  _pendingAnularId=null;
  _pendingAnularGrupoIds=ids;
  // Cambiar texto para anulación de grupo
  var t=gel('confirm-anular-title');if(t)t.textContent='Anular movimiento completo';
  var m=gel('confirm-anular-msg');if(m)m.textContent='¿Seguro que quieres anular las '+ids.length+' transacciones de este movimiento? Esta acción no se puede deshacer.';
  gel('modal-confirm-anular').classList.add('open');
}
function cerrarConfirmAnular(){
  _pendingAnularId=null;
  _pendingAnularGrupoIds=null;
  gel('modal-confirm-anular').classList.remove('open');
}
function _confirmarAnular(){
  var id=_pendingAnularId;
  var ids=_pendingAnularGrupoIds;
  cerrarConfirmAnular();
  
  // Anulación de grupo
  if(ids && ids.length){
    var promesas=ids.map(function(idx){return sbU('ventas',idx,{estado:'Anulado'});});
    Promise.all(promesas).then(function(){
      return loadVentas();
    }).then(function(){
      rDash();rCreditos();checkVendorStock();
      if(gel('page-historial') && gel('page-historial').classList.contains('active')){
        poblarMeses();rHist();
      }
      var modal=gel('modal-cliente');
      if(modal&&modal.classList.contains('open'))verEntidad(modal.dataset.tipo,modal.dataset.nombre);
      // Cerrar el modal de detalle si está abierto
      var modalDet=gel('modal-detalle');
      if(modalDet&&modalDet.classList.contains('open'))cerrarDetalle();
      setSt('Movimiento completo anulado','ok');setTimeout(function(){setSt('');},2500);
    }).catch(function(e){setSt(SVUI.error(e,'anular el movimiento'),'er');});
    return;
  }
  
  // Anulación individual (comportamiento original)
  if(!id)return;
  sbU('ventas',id,{estado:'Anulado'}).then(function(){
    return loadVentas();
  }).then(function(){
    rDash();rCreditos();checkVendorStock();
    if(gel('page-historial').classList.contains('active')){poblarMeses();rHist();}
    var modal=gel('modal-cliente');
    if(modal&&modal.classList.contains('open'))verEntidad(modal.dataset.tipo,modal.dataset.nombre);
    setSt('Transaccion anulada','ok');setTimeout(function(){setSt('');},2500);
  }).catch(function(e){setSt(SVUI.error(e),'er');});
}

function anularVenta(id){
  abrirConfirmAnular(id);
}


// ══════════════════════════════════════════════════════════════
// FUNCIÓN verDetalle SIN PRECIO DE PRODUCTOS
// Carga solo nombres, el precio se escribe manualmente
// Reemplazar desde línea 2606 hasta 2673
// ══════════════════════════════════════════════════════════════

var _detalleEditando = false;
var _detalleVentaId = null;
var _productosDisponibles = [];
var _productosCache = null; // Cache global para evitar recargas

function verDetalle(id){
  var v=null;
  for(var i=0;i<_ventas.length;i++){if(_ventas[i].id===id){v=_ventas[i];break;}}
  if(!v)return;
  
  _detalleVentaId = id;
  _detalleEditando = false;

  // Si ya tenemos productos cacheados, usarlos directamente
  if(_productosCache !== null){
    _productosDisponibles = _productosCache;
    renderDetalle(v);
    return;
  }
  
  // Cargar productos por primera vez
  sbG('productos','select=nombre').then(function(response){
    _productosCache = response || [];
    _productosDisponibles = _productosCache;
    renderDetalle(v);
  }).catch(function(e){
    console.error('Error cargando productos:', e);
    _productosCache = [];
    _productosDisponibles = [];
    renderDetalle(v);
  });
}

function renderDetalle(v){
  function campo(lbl, val){
    return '<div class="sc">'+
      '<div style="font-size:11px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:4px;">'+lbl+'</div>'+
      '<div style="font-size:13px;color:var(--tl);">'+val+'</div>'+
      '</div>';
  }
  
  // valMostrar: lo que se ve en modo lectura cuando difiere de lo que va en el
  // input (p.ej. el RUC vacío se lee como "---" pero el input arranca vacío,
  // no con la palabra "---" dentro).
  function campoEditable(lbl, val, fieldId, tipo, valMostrar, extraAttrs){
    if(!tipo) tipo = 'text';
    var cleanVal = (typeof val === 'number' ? val : String(val).replace(/<[^>]*>/g,''));
    var muestra = (valMostrar === undefined || valMostrar === null) ? val : valMostrar;
    return '<div class="sc">'+
      '<div style="font-size:11px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:4px;">'+lbl+'</div>'+
      '<div id="campo-'+fieldId+'" style="font-size:13px;color:var(--tl);">'+muestra+'</div>'+
      '<input type="'+tipo+'" id="edit-'+fieldId+'" value="'+cleanVal+'" '+(extraAttrs||'')+' '+
      'style="display:none;width:100%;padding:6px 10px;border:1px solid var(--brand);border-radius:4px;font-size:13px;" />'+
      '</div>';
  }

  var contenido='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1rem;">';
  contenido+=campoEditable('Fecha', fmt(v.fecha), 'fecha', 'date');
  contenido+=campo('Movimiento', bMov(v.movimiento));
  contenido+=campo('Veterinaria', v.veterinaria||'---');
  contenido+=campo('Doctora / Medico', v.doctora||'---');
  contenido+=campo('Zona', v.zona||'---');
  contenido+=campo('Celular', v.num_medico||v.celular||'---');
  // RUC: dato fiscal del cliente, no del movimiento. Antes solo se pintaba si
  // ya existía, así que no había forma de cargarlo desde aquí cuando faltaba.
  // Ahora se muestra siempre ("---" si está vacío) y es editable; al guardar
  // se sincroniza también a clientes_vet, el registro canónico del cliente.
  contenido+=campoEditable('RUC', esc(v.ruc||''), 'ruc', 'text', esc(v.ruc||'---'), 'maxlength="11" placeholder="20XXXXXXXXX"');
  contenido+='</div>';

  if(v.movimiento!=='Visita'){
    contenido+='<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.85rem 1rem;margin-bottom:1rem;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;">';
    
    // PRODUCTO (editable con select) - SIN PRECIO
    var opcionesProducto = '';
    if(_productosDisponibles.length > 0){
      _productosDisponibles.forEach(function(p){
        var selected = (p.nombre === v.producto) ? 'selected' : '';
        opcionesProducto += '<option value="'+p.nombre+'" '+selected+'>'+p.nombre+'</option>';
      });
    }else{
      opcionesProducto = '<option value="'+(v.producto||'')+'" selected>'+(v.producto||'Sin producto')+'</option>';
    }
    
    contenido+='<div>'+
      '<div style="font-size:10px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:3px;">PRODUCTO</div>'+
      '<div id="campo-producto" style="font-size:13px;color:var(--tl);">'+(v.producto||'---')+'</div>'+
      '<select id="edit-producto" style="display:none;width:100%;padding:6px 8px;border:1px solid var(--brand);border-radius:4px;font-size:13px;">'+
        opcionesProducto+
      '</select>'+
      '</div>';
    
    // CANTIDAD
    contenido+='<div>'+
      '<div style="font-size:10px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:3px;">CANTIDAD</div>'+
      '<div id="campo-cantidad" style="font-size:13px;color:var(--tl);">'+(v.cantidad||0)+'</div>'+
      '<input type="number" id="edit-cantidad" value="'+(v.cantidad||0)+'" '+
      'style="display:none;width:100%;padding:6px 8px;border:1px solid var(--brand);border-radius:4px;font-size:13px;" '+
      'oninput="recalcularTotal()" />'+
      '</div>';
    
    // PRECIO UNITARIO (manual, sin auto-complete)
    contenido+='<div>'+
      '<div style="font-size:10px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:3px;">PRECIO UNIT.</div>'+
      '<div id="campo-precio" style="font-size:13px;color:var(--tl);">'+Number(v.precio_unitario||0).toFixed(2)+'</div>'+
      '<input type="number" step="0.01" id="edit-precio" value="'+Number(v.precio_unitario||0).toFixed(2)+'" '+
      'style="display:none;width:100%;padding:6px 8px;border:1px solid var(--brand);border-radius:4px;font-size:13px;" '+
      'oninput="recalcularTotal()" />'+
      '</div>';
    
    // TOTAL
    // Si el total no es cantidad × precio, viene de un cobro parcial hecho en
    // dinero: el importe manda y las unidades son aproximadas. Se marca para
    // que recalcularTotal() no lo machaque al editar.
    _detalleTotalManual=_esTotalManual(v);
    contenido+='<div>'+
      '<div style="font-size:10px;font-weight:700;color:var(--brand);letter-spacing:.6px;text-transform:uppercase;margin-bottom:3px;">TOTAL</div>'+
      '<div id="campo-total" style="font-size:15px;font-weight:700;color:var(--brand);">S/ '+Number(v.total||0).toFixed(2)+'</div>'+
      '<input type="number" step="0.01" id="edit-total" value="'+Number(v.total||0).toFixed(2)+'" disabled '+
      'style="display:none;width:100%;padding:6px 8px;border:1px solid var(--bd);border-radius:4px;font-size:13px;background:#f3f4f6;color:var(--tl);" />'+
      (_detalleTotalManual
        ? '<div id="edit-total-aviso" class="cp-nota" style="display:none;">Este importe se registró en dinero, no por unidades. Se respeta tal cual: cambiar cantidad o precio no lo modifica.</div>'
        : '')+
      '</div>';
    
    contenido+='</div>';
    
    if(v.fecha_cobro){
      contenido+='<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:var(--r);padding:.7rem 1rem;margin-bottom:1rem;font-size:12px;color:#92400e;">'+
        '&#128197; Cobro estimado: <strong>'+fmt(v.fecha_cobro)+'</strong></div>';
    }
    // Sección documento
    contenido+='<div style="border:1px solid var(--bd);border-radius:var(--r);padding:.85rem 1rem;margin-bottom:1rem;">'+
      '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">&#128196; Documento</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">'+
        '<div>'+
          '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;margin-bottom:3px;">Tipo</div>'+
          '<div style="font-size:13px;color:var(--tl);">'+(v.tipo_documento||'Sin documento')+'</div>'+
        '</div>'+
        '<div>'+
          '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;margin-bottom:3px;">N° Documento</div>'+
          '<div style="font-size:13px;color:var(--tl);">'+(v.numero_documento||'---')+'</div>'+
        '</div>'+
      '</div>'+
      '<div>'+
        '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;margin-bottom:6px;">Imagen</div>'+
        (function(){
          // imagen_documento puede contener varias URLs separadas por salto de línea
          // (registro de visita con 2+ comprobantes adjuntos) — mostrar una galería.
          var raw=(v.imagen_documento||'').trim();
          if(!raw) return '<span style="font-size:12px;color:var(--tl);font-style:italic;">Sin imagen adjunta</span>';
          var urls=raw.split(/[\r\n\s]+/).map(function(u){return u.trim();}).filter(function(u){return /^https?:\/\//i.test(u);});
          if(!urls.length) return '<span style="font-size:12px;color:var(--tl);font-style:italic;">Sin imagen adjunta</span>';
          return '<div style="display:flex;flex-wrap:wrap;gap:8px;">'+
            urls.map(function(u){
              return '<a href="'+u+'" target="_blank"><img src="'+u+'" style="max-width:140px;max-height:150px;border-radius:6px;border:1px solid var(--bd);cursor:pointer;"/></a>';
            }).join('')+
          '</div>';
        })()+
      '</div>'+
    '</div>';
  }

  if(v.metodo_pago){
    contenido+='<div style="border:1px solid var(--bd);border-radius:var(--r);padding:.7rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'+
      '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.6px;min-width:80px;">Método de pago</div>'+
      '<div style="font-size:13px;font-weight:600;color:var(--td);">'+v.metodo_pago+'</div>'+
      (v.receptor_efectivo
        ? '<div style="margin-left:auto;background:#f0fdf4;border:1px solid #16a34a;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:700;color:#16a34a;">&#128200; Entregado a: '+v.receptor_efectivo+'</div>'
        : '')+
    '</div>';
  }
  contenido+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;">'+
    '<span style="font-size:11px;font-weight:700;color:var(--brand);text-transform:uppercase;">Estado:</span>'+
    bEst(v.estado)+'</div>';

  // NOTAS (editable)
  var notasTexto = (v.notas&&v.notas.trim()&&v.notas!=='EMPTY') ? v.notas : '';
  contenido+='<div style="border:1px solid var(--bd);border-radius:var(--r);padding:.85rem 1rem;margin-bottom:1rem;">'+
    '<div style="font-size:10px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;">&#128203; Notas del vendedor</div>'+
    '<div id="campo-notas" style="font-size:13px;line-height:1.6;color:var(--td);">'+(notasTexto||'<span style="color:var(--tl);font-style:italic;">Sin notas adicionales</span>')+'</div>'+
    '<textarea id="edit-notas" style="display:none;width:100%;min-height:80px;padding:10px;border:1px solid var(--brand);border-radius:4px;font-size:13px;font-family:inherit;resize:vertical;">'+notasTexto+'</textarea>'+
    '</div>';

  var canAnul=(v.estado!=='Anulado');
  
  contenido+='<div style="display:flex;justify-content:space-between;gap:8px;margin-top:1rem;">'+
    '<button id="btn-editar" class="btn" style="background:var(--brand);color:#fff;" onclick="toggleEditar()">✏️ Editar</button>'+
    '<div style="display:flex;gap:8px;">'+
      '<button id="btn-guardar" class="btn" style="display:none;background:#10b981;color:#fff;" onclick="guardarCambios()">💾 Guardar</button>'+
      '<button id="btn-cancelar" class="btn" style="display:none;background:var(--bd);color:var(--td);" onclick="cancelarEdicion()">Cancelar</button>'+
      (canAnul?'<button class="btn btn-d" onclick="anularVenta(\''+v.id+'\');cerrarDetalle()">Anular</button>':'')+
      '<button class="btn btn-p" onclick="cerrarDetalle()">Cerrar</button>'+
    '</div>'+
    '</div>';

  gel('detalle-body').innerHTML=contenido;
  gel('detalle-titulo').textContent=(v.veterinaria||'Transaccion')+' \u00b7 '+fmt(v.fecha);
  gel('modal-detalle').classList.add('open');
  
  // Guardar valor original de fecha
  var editFecha = gel('edit-fecha');
  if(editFecha && v.fecha) editFecha.value = v.fecha;
}

function toggleEditar(){
  _detalleEditando = !_detalleEditando;
  
  var camposEditables = ['fecha', 'ruc', 'producto', 'cantidad', 'precio', 'total', 'notas'];
  
  camposEditables.forEach(function(field){
    var campo = gel('campo-'+field);
    var input = gel('edit-'+field);
    if(campo && input){
      if(_detalleEditando){
        campo.style.display = 'none';
        input.style.display = 'block';
        if(field === 'total') input.disabled = true;
      }else{
        campo.style.display = 'block';
        input.style.display = 'none';
      }
    }
  });
  
  var btnEditar = gel('btn-editar');
  var btnGuardar = gel('btn-guardar');
  var btnCancelar = gel('btn-cancelar');
  
  if(btnEditar) btnEditar.style.display = _detalleEditando ? 'none' : 'inline-block';
  if(btnGuardar) btnGuardar.style.display = _detalleEditando ? 'inline-block' : 'none';
  if(btnCancelar) btnCancelar.style.display = _detalleEditando ? 'inline-block' : 'none';
}

// ¿El total de esta fila fue fijado a mano (cobro parcial en dinero)?
// En esos casos total ≠ cantidad × precio a propósito, y recalcular destruiría
// el importe real que se cobró.
var _detalleTotalManual = false;

function _esTotalManual(v){
  var c = Number(v.cantidad) || 0;
  var p = Number(v.precio_unitario) || 0;
  var t = Number(v.total) || 0;
  if(!c || !p) return false;
  return Math.abs(t - (c * p)) > 0.01;
}

function recalcularTotal(){
  var cantidadInput = gel('edit-cantidad');
  var precioInput = gel('edit-precio');
  var totalInput = gel('edit-total');
  if(!cantidadInput || !precioInput || !totalInput) return;

  if(_detalleTotalManual){
    var aviso = gel('edit-total-aviso');
    if(aviso) aviso.style.display = '';
    return; // no tocar: el importe viene de un cobro en dinero
  }

  var cantidad = parseFloat(cantidadInput.value) || 0;
  var precio = parseFloat(precioInput.value) || 0;
  totalInput.value = (cantidad * precio).toFixed(2);
}

function cancelarEdicion(){
  // BUG FIX: guardar ID antes de limpiar, y re-renderizar sin cerrar modal
  var id = _detalleVentaId;
  if(!id) return;
  
  // Buscar la venta
  var v = null;
  for(var i=0; i<_ventas.length; i++){
    if(_ventas[i].id === id){ v = _ventas[i]; break; }
  }
  if(!v) return;
  
  // Re-renderizar manteniendo el modal abierto y los productos cargados
  _detalleEditando = false;
  renderDetalle(v);
}

// Replica el RUC editado en el detalle del movimiento a clientes_vet, que es
// donde vive el dato del cliente (no de la transacción). Sin esto el RUC
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

function guardarCambios(){
  var fecha = gel('edit-fecha') ? gel('edit-fecha').value : null;
  var producto = gel('edit-producto') ? gel('edit-producto').value : null;
  var cantidad = gel('edit-cantidad') ? parseFloat(gel('edit-cantidad').value) : null;
  var precio = gel('edit-precio') ? parseFloat(gel('edit-precio').value) : null;
  var total = gel('edit-total') ? parseFloat(gel('edit-total').value) : null;
  var notas = gel('edit-notas') ? gel('edit-notas').value.trim() : null;
  var ruc = gel('edit-ruc') ? gel('edit-ruc').value.trim() : null;

  if(!_detalleVentaId){
    setSt('No encontramos esa transacción. Recarga la página e inténtalo otra vez.','er');
    return;
  }
  
  var updates = {};
  if(fecha) updates.fecha = fecha;
  if(producto) updates.producto = producto;
  // ventas.cantidad es una columna de enteros: mandar un decimal la rechaza.
  if(cantidad !== null && !isNaN(cantidad)) updates.cantidad = Math.round(cantidad);
  if(precio !== null && !isNaN(precio)) updates.precio_unitario = precio;
  if(total !== null && !isNaN(total)) updates.total = total;
  // Vaciar las notas guarda NULL. Antes se escribía la palabra "EMPTY", que
  // solo se filtraba en dos de los sitios donde se pintan las notas — en el
  // resto (PDF, historial admin) se veía literalmente "EMPTY".
  if(notas !== null) updates.notas = notas.trim() || null;
  if(ruc !== null) updates.ruc = ruc || null;

  sbU('ventas', _detalleVentaId, updates).then(function(){
    // El RUC pertenece al cliente, no al movimiento: se replica a clientes_vet
    // para que también salga en su ficha y se autocomplete en la próxima
    // visita. Best-effort: si falla, el movimiento ya quedó guardado.
    return _dvSincronizarRuc(ruc);
  }).then(function(){
    return loadVentas();
  }).then(function(){
    rDash();rCreditos();checkVendorStock();
    if(gel('page-historial') && gel('page-historial').classList.contains('active')){
      poblarMeses();rHist();
    }
    setSt('Cambios guardados correctamente','ok');
    setTimeout(function(){setSt('');},2500);
    cerrarDetalle();
  }).catch(function(e){
    console.error('Error al guardar:', e);
    setSt(SVUI.error(e,'guardar'),'er');
  });
}

function cerrarDetalle(){
  _detalleEditando = false;
  _detalleVentaId = null;
  // No limpiar _productosDisponibles ni _productosCache para mantener performance
  gel('modal-detalle').classList.remove('open');
}

// INICIO
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.mo').forEach(function(o){
    o.addEventListener('click',function(e){if(e.target===o)o.classList.remove('open');});
  });
  // Cerrar el modal abierto con Escape (antes solo se podía con el clic de fuera).
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    var abierto=document.querySelector('.mo.open');
    if(abierto)abierto.classList.remove('open');
  });
  // El guard resuelve solo si hay sesión con rol vendedor; si no, redirige él mismo.
  bootSession().then(function(){
    gel('app-boot').hidden=true;
    initApp();
  });
});
