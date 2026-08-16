function onMovChange(){
  var mov=val('v-mov');
  var vf=gel('venta-fields');
  var wrap=gel('cobro-wrap');
  if(mov===''||mov==='Visita'){
    if(vf)vf.style.display='none';
    if(wrap)wrap.style.display='none';
  }else{
    if(vf)vf.style.display='block';
    if(mov==='Cr\u00e9dito a 15 d\u00edas'||mov==='Credito a 15 dias'){
      if(wrap)wrap.style.display='block';
      var d=new Date();d.setDate(d.getDate()+15);
      gel('v-cobro').value=d.toISOString().split('T')[0];
    }else{
      if(wrap)wrap.style.display='none';
    }
  }
}

function onVeteChange(){
  var vete=val('v-vete');
  var dl=gel('doc-list');dl.innerHTML='';
  var dd=gel('vete-dropdown');
  for(var i=0;i<_vetes.length;i++){
    var v=_vetes[i];
    if(v.nombre_vet.toLowerCase().startsWith(vete.toLowerCase())&&v.doctora){
      var opt=document.createElement('option');opt.value=v.doctora;dl.appendChild(opt);
    }
  }
  if(_docMap[vete]&&!val('v-doctora'))gel('v-doctora').value=_docMap[vete];
  // Filter dropdown as user types
  if(vete.length===0){
    showVeteDropdown(_vetes);
    return;
  }
  var filtered=_vetes.filter(function(v){
    return v.nombre_vet.toLowerCase().startsWith(vete.toLowerCase());
  });
  if(filtered.length>0){
    showVeteDropdown(filtered);
  }else if(dd&&vete.length>=2){
    // New vet - offer to register
    var safeVete=vete.replace(/'/g,'&apos;');
    dd.innerHTML='<div class="vdd-item" style="color:var(--ok);font-weight:600;border-left:3px solid var(--ok);" onclick="selectVeteSafe(this)"  data-nombre="'+safeVete+'" data-doctora="">' +
      '+ Registrar nueva: <strong>'+vete+'</strong></div>';
    dd.style.display='block';
  }else if(dd){dd.style.display='none';}
}

function calcTotal(){
  var c=parseFloat(gel('v-cant').value)||0;
  var p=parseFloat(gel('v-precio').value)||0;
  gel('v-total').value='S/ '+(c*p).toFixed(2);
}

// Resto del formulario antiguo (prefijo "v-"), sustituido por el de prefijo
// "mv-" en registro-visita.js. Varios de estos campos ya no existen en el DOM,
// así que cada gel() devolvía null y la función reventaba a la primera.
// Se dejan las guardas para que no tumbe nada si se llama desde algún sitio.
function limpiarForm(){
  var vacios=['v-vete','v-doctora','v-celular','v-notas','v-mov','v-zona','v-prod','v-precio','v-total','v-hora'];
  vacios.forEach(function(id){var el=gel(id);if(el)el.value='';});
  var cant=gel('v-cant');if(cant)cant.value=1;
  var fecha=gel('v-fecha');if(fecha)fecha.value=hoy();
  var pdfMes=gel('pdf-mes');if(pdfMes)pdfMes.value=hoy().substring(0,7);
  var cobro=gel('cobro-wrap');if(cobro)cobro.style.display='none';
}

function guardarVenta(){
  var vete=val('v-vete'),mov=val('v-mov'),zona=val('v-zona'),prod=val('v-prod');
  var cant=parseInt(gel('v-cant').value)||0;
  var precio=parseFloat(gel('v-precio').value)||0;
  var isVisita=(mov==='Visita');
  var esDevolucion=(mov==='Devoluci\u00f3n'||mov==='Devolucion');

  // Antes eran seis alert() encadenados: el vendedor correg\u00eda un campo,
  // volv\u00eda a pulsar Guardar y aparec\u00eda el siguiente error. Ahora se marcan
  // todos de una vez, cada mensaje debajo de su campo, y el foco va al
  // primero que falta.
  var ok=SVUI.validar([
    {campo:'v-vete',   si:function(v){return !v.trim();},
     error:'Escribe el nombre de la veterinaria.'},
    {campo:'v-mov',    si:function(v){return !v;},
     error:'Elige qu\u00e9 tipo de movimiento est\u00e1s registrando.'},
    {campo:'v-zona',   si:function(v){return !v;},
     error:'Elige la zona de la visita.'},
    {campo:'v-prod',   si:function(v){return !v;}, saltar:isVisita,
     error:'Elige el producto que vendiste.'},
    {campo:'v-cant',   si:function(v){return (parseInt(v,10)||0)<=0;}, saltar:isVisita,
     error:'La cantidad tiene que ser 1 o m\u00e1s.'},
    {campo:'v-precio', si:function(v){return (parseFloat(v)||0)<=0;},
     saltar:isVisita||esDevolucion,
     error:'Escribe el precio unitario. Debe ser mayor que 0.'}
  ]);
  if(!ok)return;
  var estado='\u2705 Pagado';
  if(mov==='Cr\u00e9dito a 15 d\u00edas'||mov==='Credito a 15 dias')estado='\u23f3 Pendiente';
  if(mov==='Devoluci\u00f3n'||mov==='Devolucion')estado='\ud83d\udce6 Devuelto';
  if(isVisita)estado='Visita';
  setBL('btn-gv',true);
  var row={
    vendedor_id:CUR.id,
    fecha:val('v-fecha')||hoy(),
    hora:gel('v-hora')&&gel('v-hora').value?gel('v-hora').value:null,

    veterinaria:vete,doctora:val('v-doctora')||null,num_medico:val('v-celular')||null,
    zona:zona,movimiento:mov,
    producto:isVisita?'':(prod||''),
    cantidad:isVisita?0:cant,
    precio_unitario:isVisita?0:precio,
    total:isVisita?0:(cant*precio),
    fecha_cobro:((mov==='Cr\u00e9dito a 15 d\u00edas'||mov==='Credito a 15 dias')?val('v-cobro'):null),
    estado:estado,notas:val('v-notas')
  };
  sbP('ventas',row).then(function(){
    // ilike (no eq): v-vete es texto libre con autocompletado — con eq. una
    // diferencia de mayúscula/minúscula no encontraba el cliente existente y
    // creaba una fila duplicada en clientes_vet en vez de reutilizar la que ya había.
    return sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(vete)+'&select=id');
  }).then(function(ex){
    if(!ex||!ex.length)return sbP('clientes_vet',{nombre_vet:vete,doctora:val('v-doctora')||null,zona:zona});
  }).then(function(){
    return Promise.all([loadVentas(),loadProductos()]);
  }).then(function(){
    limpiarForm();
    setSt('\u2705 Transaccion guardada correctamente','ok');
    setTimeout(function(){setSt('');},3000);
  }).catch(function(e){setSt(SVUI.error(e),'er');})
  .finally(function(){setBL('btn-gv',false,'\ud83d\udcbe Guardar Visita');});
}

function bEst(e){
  var m={'\u2705 Pagado':'b-pagado','\u23f3 Pendiente':'b-pendiente','\u274c Vencido':'b-vencido','\ud83d\udce6 Devuelto':'b-devuelto','Anulado':'b-devuelto','Visita':'b-visita','\u2139\ufe0f Visita':'b-visita'};
  return '<span class="b '+(m[e]||'b-pendiente')+'">'+(e||'\u2014')+'</span>';
}
function bMov(m){
  var mp={'Venta al contado':'b-contado','Venta delivery':'b-delivery','Credito a 15 dias':'b-credito','Cr\u00e9dito a 15 d\u00edas':'b-credito','Devolucion':'b-devolucion','Devoluci\u00f3n':'b-devolucion','Visita':'b-visita','Cobro de credito':'b-cobro','Cobro crédito':'b-cobro'};
  return '<span class="b '+(mp[m]||'b-contado')+'">'+(m||'\u2014')+'</span>';
}

function checkVendorStock(){
  if(!CUR)return;
  sbG('movimientos','vendedor_id=eq.'+CUR.id+'&tipo=eq.salida&categoria=eq.producto').then(function(movs){
    var stk={};
    for(var i=0;i<(movs||[]).length;i++){var m=movs[i];stk[m.item_nombre]=(stk[m.item_nombre]||0)+m.cantidad;}
    for(var i=0;i<_ventas.length;i++){
      var v=_ventas[i];
      if(v.movimiento!=='Devolucion'&&v.movimiento!=='Visita'&&v.estado!=='Anulado'&&v.producto)
        stk[v.producto]=(stk[v.producto]||0)-v.cantidad;
    }
    var alerts=[];
    for(var k in stk){
      if(stk[k]<=0)alerts.push('SIN STOCK: '+k);
      else if(stk[k]<=5)alerts.push('BAJO STOCK: '+k+' ('+stk[k]+' uds)');
    }
    var old=document.getElementById('stock-alert-bar');if(old)old.remove();
    if(alerts.length){
      var bar=document.createElement('div');bar.id='stock-alert-bar';
      bar.style.cssText='background:#fffbeb;color:#92400e;border:1px solid #fcd34d;border-radius:8px;padding:.65rem .9rem;font-size:12px;font-weight:600;margin-bottom:1rem;';
      bar.innerHTML='[!] '+alerts.join(' | ');
      var stg=document.getElementById('st-global');
      if(stg&&stg.parentNode)stg.parentNode.insertBefore(bar,stg.nextSibling);
    }
  }).catch(function(){});
}

// \u2550\u2550 VETE DROPDOWN \u2550\u2550
function setupVeteDropdown(){
  var inp=gel('v-vete');
  var dd=gel('vete-dropdown');
  if(!inp||!dd)return;
  inp.addEventListener('focus',function(){showVeteDropdown(_vetes);});
  document.addEventListener('click',function(e){
    if(inp&&dd&&!inp.contains(e.target)&&!dd.contains(e.target))dd.style.display='none';
  });
}

function showVeteDropdown(list){
  var dd=gel('vete-dropdown');if(!dd)return;
  if(!list||!list.length){dd.style.display='none';return;}
  dd.innerHTML=list.slice(0,15).map(function(v){
    return '<div class="vdd-item" onclick="selectVete(\''+v.nombre_vet.replace(/\'/g,"\\'")+'\',\''+(v.doctora||'').replace(/\'/g,"\\'")+'\')">'+
      '<div style="font-weight:600;font-size:13px;">'+v.nombre_vet+'</div>'+
      (v.doctora?'<div style="font-size:11px;color:var(--tl);">'+v.doctora+(v.zona?' &middot; '+v.zona:'')+'</div>':'')+
      '</div>';
  }).join('');
  dd.style.display='block';
}

function selectVeteSafe(el){
  var nombre=el.dataset.nombre.replace(/&apos;/g,"'");
  var doctora=el.dataset.doctora||'';
  selectVete(nombre,doctora);
}

function selectVete(nombre,doctora){
  gel('v-vete').value=nombre;
  if(doctora)gel('v-doctora').value=doctora;
  gel('vete-dropdown').style.display='none';
}

// \u2550\u2550 MIS CLIENTES \u2550\u2550