// ══════════════════════════════════════════════════════════════
// VISITAS: registrar visita + clientes admin
// ══════════════════════════════════════════════════════════════

// ══ REGISTRAR VISITA ADMIN ══
var _rvTipo = 'Visita', _rvMovimientos = [];
var _rvImagenes = [];
var _RV_IMG_MAX = 4;

// Los seis .tipo-btn ya están en el DOM cuando este script se ejecuta (va
// al final del <body>), así que se inicializa aquí mismo, una sola vez.
// No va dentro de rRegVisita(), que se repite en cada visita a la página:
// volver a llamar a SVUI.radiogroup() ahí duplicaría los listeners.
var _rvTipoGroup = (typeof SVUI!=='undefined' && SVUI.radiogroup)
  ? SVUI.radiogroup(document.getElementById('rv-tipo-grid'), {
      onSelect: function(el){ rvSetTipo(el.getAttribute('data-tipo')); }
    })
  : null;

var _MP_CONFIG = {
  'EFECTIVO': {
    color:'#16a34a',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#16a34a;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="color:#fff;font-size:15px;font-weight:900;font-family:Arial,sans-serif;">$</span></div>'
  },
  'YAPE PIERO': {
    color:'#5C1194',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#5C1194;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;flex-shrink:0;"><div style="background:#2DD4BF;color:#5C1194;font-size:5px;font-weight:900;padding:1px 3px;border-radius:2px;line-height:1.3;font-family:Arial,sans-serif;">s/</div><div style="color:#fff;font-size:7.5px;font-style:italic;font-family:Georgia,serif;line-height:1;">yape</div></div>'
  },
  'PLIN PIERO': {
    color:'#00B7C2',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:linear-gradient(135deg,#0EA5E9,#00C9B1);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="color:#fff;font-size:10px;font-weight:700;font-family:Arial,sans-serif;">plin</span></div>'
  },
  'CUENTA BCP PIERO': {
    color:'#003087',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#003087;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:8px;font-weight:900;font-family:Arial,sans-serif;letter-spacing:-.5px;"><span style="color:#E8441A;">&#8250;</span><span style="color:#fff;">BCP</span><span style="color:#E8441A;">&#8249;</span></span></div>'
  },
  'CUENTA SCOTIABANK PIERO': {
    color:'#CC0000',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#CC0000;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="width:20px;height:20px;border-radius:50%;border:1.5px solid rgba(255,255,255,.75);display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-size:12px;font-weight:900;font-family:Arial,sans-serif;">S</span></div></div>'
  },
  'CUENTA INTERBANK NUTROVA FOR PETS': {
    color:'#3AB54A',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#3AB54A;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="width:18px;height:18px;border-radius:3px;background:#5B2D8E;display:flex;align-items:center;justify-content:center;"><div style="width:11px;height:11px;border-radius:2px;background:#3AB54A;"></div></div></div>'
  }
};
function rvActualizarMP(){
  var logoEl=gel('rv-mp-sel-logo'), nameEl=gel('rv-mp-sel-name');
  if(logoEl) logoEl.innerHTML='<div style="width:32px;height:32px;border-radius:6px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#718096;font-size:12px;">—</div>';
  if(nameEl){ nameEl.textContent='— Seleccionar método —'; nameEl.style.color='var(--tl)'; nameEl.style.fontWeight='normal'; }
  var inp=gel('rv-metodo-pago'); if(inp) inp.value='';
  var rw=gel('rv-receptor-efectivo-wrap'); if(rw) rw.style.display='none';
  var rs=gel('rv-receptor-efectivo'); if(rs) rs.value='';
  var reqStar=gel('rv-img-req'); if(reqStar) reqStar.style.display='inline';
}
function rvToggleMPDrop(e){
  if(e) e.stopPropagation();
  var drop=gel('rv-mp-drop'), chev=gel('rv-mp-chevron'); if(!drop)return;
  if(drop.style.display!=='none'){ drop.style.display='none'; if(chev)chev.style.transform=''; return; }
  drop.innerHTML=Object.keys(_MP_CONFIG).map(function(k){
    return '<div onclick="rvSelecMP(\''+k.replace(/'/g,"\\'")+'\')"\
 style="display:flex;align-items:center;gap:10px;padding:.55rem .85rem;cursor:pointer;border-bottom:1px solid var(--bd);background:#fff;"\
 onmouseover="this.style.background=\'var(--sky4)\'" onmouseout="this.style.background=\'#fff\'">'+
      _MP_CONFIG[k].html+
      '<span style="font-size:12px;font-weight:600;color:var(--td);">'+esc(k)+'</span></div>';
  }).join('');
  drop.style.display='block';
  if(chev) chev.style.transform='rotate(180deg)';
  setTimeout(function(){document.addEventListener('click',_rvMPClose,{once:true});},0);
}
function _rvMPClose(){
  var drop=gel('rv-mp-drop'); if(drop) drop.style.display='none';
  var chev=gel('rv-mp-chevron'); if(chev) chev.style.transform='';
}
function rvSelecMP(val){
  var cfg=_MP_CONFIG[val]; if(!cfg)return;
  var inp=gel('rv-metodo-pago'); if(inp) inp.value=val;
  var logoEl=gel('rv-mp-sel-logo'); if(logoEl) logoEl.innerHTML=cfg.html;
  var nameEl=gel('rv-mp-sel-name');
  if(nameEl){ nameEl.textContent=val; nameEl.style.color=cfg.color; nameEl.style.fontWeight='600'; }
  var drop=gel('rv-mp-drop'); if(drop) drop.style.display='none';
  var chev=gel('rv-mp-chevron'); if(chev) chev.style.transform='';
  var rw=gel('rv-receptor-efectivo-wrap'); if(rw) rw.style.display=(val==='EFECTIVO')?'block':'none';
  var rs=gel('rv-receptor-efectivo'); if(rs&&val!=='EFECTIVO') rs.value='';
  // Con EFECTIVO la imagen es opcional: ocultar el asterisco de obligatorio.
  var reqStar=gel('rv-img-req'); if(reqStar) reqStar.style.display=(val==='EFECTIVO')?'none':'inline';
}

// Poblar el select de productos filtrando por los asignados al vendedor.
// vendId=null → sin filtro (todos); vendId con productos_asignados vacío → todos.
function _rvPoblarProductos(selEl, vendId){
  if(!selEl)return;
  var vend=null;
  if(vendId){for(var i=0;i<_vendedores.length;i++){if(String(_vendedores[i].id)===String(vendId)){vend=_vendedores[i];break;}}}
  var asig=vend&&vend.productos_asignados&&vend.productos_asignados.length?vend.productos_asignados:null;
  var lista=asig?_productos.filter(function(p){return asig.indexOf(p.nombre)>=0;}):_productos;
  var prev=selEl.value;
  selEl.innerHTML='<option value="">— Producto —</option>';
  lista.forEach(function(p){
    var o=document.createElement('option');
    o.value=p.nombre;
    o.textContent=p.nombre+' (S/'+Number(p.precio_sugerido||0).toFixed(2)+')';
    selEl.dataset['precio_'+p.nombre.replace(/\s/g,'_')]=p.precio_sugerido||0;
    selEl.appendChild(o);
  });
  if(prev)selEl.value=prev; // restore selection if still valid
  // Mismo catálogo para el producto de regalo — puede ser distinto al que
  // se está vendiendo (ej. venden bolsas de 150g y regalan una muestra).
  var selR=gel('rv-regalo-prod');
  if(selR){
    selR.innerHTML='<option value="">— Mismo producto que la venta —</option>';
    lista.forEach(function(p){var o=document.createElement('option');o.value=p.nombre;o.textContent=p.nombre;selR.appendChild(o);});
  }
}

function _rvImgAgregar(){
  var inp=gel('rv-img-doc');
  if(!inp||!inp.files) return;
  var espacioLibre=_RV_IMG_MAX-_rvImagenes.length;
  if(espacioLibre<=0){
    setSt('Máximo '+_RV_IMG_MAX+' imágenes','er');
    setTimeout(function(){setSt('');},2000);
    inp.value=''; return;
  }
  for(var i=0;i<inp.files.length&&i<espacioLibre;i++){
    _rvImagenes.push(inp.files[i]);
  }
  if(inp.files.length>espacioLibre){
    setSt('Solo se agregaron '+espacioLibre+' imágenes (máx '+_RV_IMG_MAX+')','er');
    setTimeout(function(){setSt('');},2500);
  }
  inp.value='';
  _rvImgRender();
}

function _rvImgRemover(idx){
  if(idx<0||idx>=_rvImagenes.length) return;
  _rvImagenes.splice(idx,1);
  _rvImgRender();
}

function _rvImgRender(){
  var grid=gel('rv-img-grid');
  var counter=gel('rv-img-counter');
  if(!grid) return;
  if(counter) counter.textContent='('+_rvImagenes.length+'/'+_RV_IMG_MAX+')';
  var html='';
  _rvImagenes.forEach(function(f,idx){
    var isImage=f.type&&f.type.indexOf('image/')===0;
    html+='<div style="position:relative;border:2px solid #16a34a;border-radius:12px;background:#f0fdf4;padding:8px 6px;min-height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;">'+
      '<button type="button" onclick="_rvImgRemover('+idx+');event.stopPropagation();" title="Eliminar" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:#dc2626;color:#fff;border:none;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:bold;line-height:1;padding:0;box-shadow:0 1px 3px rgba(0,0,0,.2);">×</button>'+
      (isImage
        ?'<img data-rv-thumb="'+idx+'" src="" style="max-width:100%;max-height:70px;object-fit:contain;border-radius:6px;"/>'
        :'<div style="font-size:34px;line-height:1;">📄</div>')+
      '<div style="font-size:10px;color:var(--brand);font-weight:600;text-align:center;word-break:break-all;padding:0 4px;line-height:1.2;">'+f.name+'</div>'+
    '</div>';
  });
  if(_rvImagenes.length<_RV_IMG_MAX){
    html+='<div onclick="document.getElementById(\'rv-img-doc\').click()" '+
      'style="border:2px dashed var(--brand);border-radius:12px;background:var(--sky4);'+
      'display:flex;flex-direction:column;align-items:center;justify-content:center;'+
      'gap:6px;padding:16px 8px;cursor:pointer;min-height:130px;text-align:center;user-select:none;">'+
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>'+
      '<span style="font-size:12px;font-weight:600;color:var(--brand);">'+(_rvImagenes.length?'Agregar otra':'Haz clic para subir')+'</span>'+
      '<span style="font-size:10px;color:var(--tl);">JPG, PNG o PDF · máx 4 MB</span>'+
    '</div>';
  }
  grid.innerHTML=html;
  _rvImagenes.forEach(function(f,idx){
    if(!f.type||f.type.indexOf('image/')!==0) return;
    var img=grid.querySelector('img[data-rv-thumb="'+idx+'"]');
    if(!img) return;
    var r=new FileReader();
    r.onload=function(e){img.src=e.target.result;};
    r.readAsDataURL(f);
  });
}

function rRegVisita(){
  docsReset('rv');
  // Sin argumento, limpiarErrores() barre TODA la página — se acota al
  // contenedor de esta página para no tocar errores de otras pestañas.
  SVUI.limpiarErrores(gel('page-reg-visita'));
  if(typeof _rvOcultarErrorSinMovimiento==='function') _rvOcultarErrorSinMovimiento();
  var sel = gel('rv-vendedor');
  sel.innerHTML = '<option value="">— Seleccionar vendedor —</option>';
  // Solo vendedores activos pueden recibir nuevas visitas
  _vendedores.filter(function(v){return v.activo!==false;}).forEach(function(v){
    var o = document.createElement('option'); o.value=v.id; o.textContent=v.nombre; sel.appendChild(o);
  });
  var selZ = gel('rv-zona');
  selZ.innerHTML = '<option value="">— Zona —</option>';
  _zonas.forEach(function(z){ var o=document.createElement('option');o.value=z.nombre;o.textContent=z.nombre;selZ.appendChild(o); });
  // Poblar categorías del cliente
  var selCat = gel('rv-cat');
  if(selCat){
    var prevCat = selCat.value;
    selCat.innerHTML = '<option value="">— Sin categoría —</option>';
    (_segmentos||[]).forEach(function(s){ var o=document.createElement('option');o.value=s.nombre;o.textContent=s.nombre;selCat.appendChild(o); });
    selCat.value = prevCat;
  }
  var selP = gel('rv-producto');
  _rvPoblarProductos(selP, null);
  var d = new Date(); gel('rv-fecha').value = hoy();
  _rvMovimientos = [];
  rvRenderLista();
  rvRenderResumen();
  rvSetTipo('Visita');
  // Wire multi-image input (only once)
  _rvImagenes=[];
  _rvImgRender();
  var rvInp=gel('rv-img-doc');
  if(rvInp&&!rvInp.dataset.wired){
    rvInp.dataset.wired='1';
    rvInp.addEventListener('change',_rvImgAgregar);
  }
}

// Índices del vendedor seleccionado para búsqueda
var _rvVetes = [], _rvDocs = [], _rvCelMap = {}, _rvDocVeteMap = {}, _rvVeteDocMap = {}, _rvVeteZonaMap = {};
var _rvRucMapDoc = {}, _rvRucMapVete = {};

function rvCambiarVendedor(){
  var vid = gel('rv-vendedor').value;
  if(!vid){
    _rvVetes=[]; _rvDocs=[];
    // Resetear categorías al estado inicial (todas las del sistema)
    var selCat=gel('rv-cat');
    if(selCat){
      selCat.innerHTML='<option value="">— Sin categoría —</option>';
      (_segmentos||[]).forEach(function(s){var o=document.createElement('option');o.value=s.nombre;o.textContent=s.nombre;selCat.appendChild(o);});
      selCat.value='';
    }
    return;
  }
  // Construir índice de veterinarias y doctores: incluir
  //   (a) las ventas del propio vendedor (su historial)
  //   (b) las ventas en sus zonas asignadas (vets de la zona, aunque las haya
  //       cargado un vendedor anterior — útil tras transferencias / bajas)
  var vendObj = _vendedores.filter(function(vv){return String(vv.id)===String(vid);})[0];
  var zonasAsig = (vendObj&&vendObj.zonas_asignadas)||[];
  // Vendedores sin zonas asignadas (p.ej. Administrador Suplevet) ven todas las
  // veterinarias/doctoras del sistema, sin restricción por vendedor ni zona.
  var sinRestriccion = zonasAsig.length===0;
  var vetSet = {}, docSet = {}, celMap = {}, docVeteMap = {}, veteDocMap = {}, veteZonaMap = {};
  var rucMapDoc = {}, rucMapVete = {};
  _ventas.filter(function(v){
    if(sinRestriccion) return true;
    if(String(v.vendedor_id)===String(vid)) return true;
    if(v.zona && zonasAsig.indexOf(v.zona)>=0) return true;
    return false;
  }).forEach(function(v){
    if(v.veterinaria){ vetSet[v.veterinaria]=1; }
    if(v.veterinaria && v.zona){
      if(!veteZonaMap[v.veterinaria]) veteZonaMap[v.veterinaria]=[];
      if(veteZonaMap[v.veterinaria].indexOf(v.zona)<0) veteZonaMap[v.veterinaria].push(v.zona);
    }
    if(v.veterinaria && v.ruc) rucMapVete[v.veterinaria]=v.ruc;
    if(v.doctora){
      docSet[v.doctora]=1;
      if(v.num_medico||v.celular) celMap[v.doctora]=v.num_medico||v.celular;
      if(v.ruc) rucMapDoc[v.doctora]=v.ruc;
      if(v.veterinaria){
        if(!docVeteMap[v.doctora]) docVeteMap[v.doctora]=[];
        if(docVeteMap[v.doctora].indexOf(v.veterinaria)<0) docVeteMap[v.doctora].push(v.veterinaria);
        if(!veteDocMap[v.veterinaria]) veteDocMap[v.veterinaria]=[];
        if(veteDocMap[v.veterinaria].indexOf(v.doctora)<0) veteDocMap[v.veterinaria].push(v.doctora);
      }
    }
  });
  _rvVetes = Object.keys(vetSet).sort();
  _rvDocs = Object.keys(docSet).sort();
  _rvCelMap = celMap;
  _rvDocVeteMap = docVeteMap;
  _rvVeteDocMap = veteDocMap;
  _rvVeteZonaMap = veteZonaMap;
  _rvRucMapDoc = rucMapDoc;
  _rvRucMapVete = rucMapVete;
  // Limpiar campos
  gel('rv-vete').value=''; gel('rv-doctora').value=''; gel('rv-celular').value=''; gel('rv-ruc').value='';
  gel('rv-vete-drop').style.display='none'; gel('rv-doc-drop').style.display='none';
  // Filtrar productos según los asignados al vendedor
  _rvPoblarProductos(gel('rv-producto'), vid);
  // Zonas del vendedor
  var vend = _vendedores.filter(function(v){return String(v.id)===String(vid);})[0];
  var zonas = (vend&&vend.zonas_asignadas&&vend.zonas_asignadas.length) ? vend.zonas_asignadas : _zonas.map(function(z){return z.nombre;});
  var selZ = gel('rv-zona');
  selZ.innerHTML = '<option value="">— Zona —</option>';
  zonas.forEach(function(z){ var o=document.createElement('option');o.value=z;o.textContent=z;selZ.appendChild(o); });
  // Categorías del cliente: mostrar solo las que pertenecen al vendedor
  var selCat = gel('rv-cat');
  if(selCat){
    var vendCats = (vend&&vend.segmentos&&vend.segmentos.length)
      ? vend.segmentos
      : (_segmentos||[]).map(function(s){return s.nombre;}); // fallback: todas
    selCat.innerHTML = '<option value="">— Sin categoría —</option>';
    vendCats.forEach(function(c){ var o=document.createElement('option');o.value=c;o.textContent=c;selCat.appendChild(o); });
    // Si solo tiene una categoría, seleccionarla automáticamente
    selCat.value = vendCats.length===1 ? vendCats[0] : '';
  }
  rvRenderResumen();
}

function _rvDropItemVete(n){
  return '<div data-vete-n="'+esc(n)+'" onmousedown="event.preventDefault();rvSelecVeteEl(this)" '+
    'style="padding:.55rem .85rem;cursor:pointer;font-size:13px;border-bottom:1px solid var(--bd);transition:background .1s;" '+
    'onmouseover="this.style.background=\'var(--sky4)\'" onmouseout="this.style.background=\'#fff\'"><strong>'+esc(n)+'</strong></div>';
}

function rvSelecVeteEl(el){
  var nombre = el.getAttribute('data-vete-n')||'';
  rvSelecVete(nombre);
}

function rvBuscarVete(q){
  var drop = gel('rv-vete-drop');
  if(!_rvVetes.length && !q){ drop.style.display='none'; return; }
  // Búsqueda global si no hay vendedor seleccionado
  var lista = _rvVetes.length ? _rvVetes : Object.keys((function(){var s={};_ventas.forEach(function(v){if(v.veterinaria)s[v.veterinaria]=1;});return s;})()).sort();
  var filtrada = q ? lista.filter(function(n){return n.toLowerCase().indexOf(q.toLowerCase())>=0;}) : lista;
  if(!filtrada.length){ drop.style.display='none'; return; }
  drop.innerHTML = filtrada.slice(0,12).map(_rvDropItemVete).join('');
  drop.style.display='block';
}

function rvSelecVete(nombre){
  gel('rv-vete').value = nombre;
  gel('rv-vete-drop').style.display='none';
  gel('rv-doctora').value = '';
  gel('rv-celular').value = '';
  // Autofill RUC: prefer el de la vet; si no hay, buscar en TODAS las ventas
  var ruc = _rvRucMapVete[nombre];
  if(!ruc && nombre){
    for(var i=0;i<_ventas.length;i++){
      if(_ventas[i].veterinaria===nombre && _ventas[i].ruc){ ruc=_ventas[i].ruc; break; }
    }
  }
  gel('rv-ruc').value = ruc||'';
  // Auto-fill zona solo si la vet tiene exactamente una sede
  var zonas = _rvVeteZonaMap[nombre];
  var selZ = gel('rv-zona');
  if(selZ){
    if(zonas && zonas.length === 1){
      selZ.value = zonas[0];
    } else {
      selZ.value = '';
    }
  }
  rvRenderResumen();
  if(_rvTipo==='Cobro de credito') rvCargarCreditos();
}

function rvBuscarDoc(q){
  var drop = gel('rv-doc-drop');
  var vete = (gel('rv-vete').value||'').trim();
  // Base list: todos los docs del vendedor seleccionado
  var lista = _rvDocs.length ? _rvDocs : Object.keys((function(){var s={};_ventas.forEach(function(v){if(v.doctora)s[v.doctora]=1;});return s;})()).sort();
  // Si hay vet seleccionada, filtrar SOLO los docs de esa vet usando el mapa directo
  if(vete && _rvVeteDocMap[vete] && _rvVeteDocMap[vete].length){
    lista = _rvVeteDocMap[vete].slice().sort();
  }
  var filtrada = q ? lista.filter(function(n){return n.toLowerCase().indexOf(q.toLowerCase())>=0;}) : lista;
  if(!filtrada.length){ drop.style.display='none'; return; }
  var items = filtrada.slice(0,15);
  var html = '';
  for(var i=0;i<items.length;i++){
    var n=items[i], cel=_rvCelMap[n]||'';
    var celHtml = cel ? '<span style="font-size:11px;color:#718096;margin-left:6px;">&#128241; '+esc(cel)+'</span>' : '';
    var vets = _rvDocVeteMap[n];
    var vetaHtml = (!vete && vets && vets.length) ? '<div style="font-size:10px;color:#94a3b8;margin-top:1px;">'+esc(vets.join(', '))+'</div>' : '';
    html += '<div style="padding:.45rem .85rem;cursor:pointer;font-size:13px;border-bottom:1px solid #e2e8f0;" '+
      'onmouseover="this.style.background=\'#eaf7f9\'" onmouseout="this.style.background=\'#fff\'" '+
      'data-doc-n="'+esc(n)+'" data-doc-c="'+esc(cel)+'" '+
      'onmousedown="event.preventDefault();rvSelecDocEl(this)">'+
      '<strong>'+esc(n)+'</strong>'+celHtml+vetaHtml+'</div>';
  }
  drop.innerHTML = html;
  drop.style.display = items.length ? 'block' : 'none';
}

function rvSelecDocEl(el){
  var nombre = el.getAttribute('data-doc-n')||el.dataset.docN||'';
  var cel    = el.getAttribute('data-doc-c')||el.dataset.docC||'';
  rvSelecDoc(nombre, cel);
}

function rvSelecDoc(nombre, cel){
  gel('rv-doctora').value = nombre;
  gel('rv-doc-drop').style.display='none';
  // Autofill celular: prefer cel del dropdown; si no, buscar en TODAS las ventas (no solo del vendedor)
  if(!cel && nombre){
    for(var i=0;i<_ventas.length;i++){
      var vv=_ventas[i];
      if(vv.doctora===nombre && (vv.num_medico||vv.celular)){
        cel=vv.num_medico||vv.celular; break;
      }
    }
  }
  if(cel) gel('rv-celular').value = cel;
  // Autofill RUC: prefer el del doctor; si no, el de la vet asociada; si no, buscar en TODAS las ventas
  var ruc = _rvRucMapDoc[nombre];
  if(!ruc && nombre){
    for(var i=0;i<_ventas.length;i++){
      if(_ventas[i].doctora===nombre && _ventas[i].ruc){ ruc=_ventas[i].ruc; break; }
    }
  }
  if(ruc) gel('rv-ruc').value = ruc;
  // Autocompletar vet si el doc tiene exactamente UNA asociada y el campo está vacío
  var vets = _rvDocVeteMap[nombre];
  if(vets && vets.length === 1 && !gel('rv-vete').value){
    gel('rv-vete').value = vets[0];
    // Re-aplicar lógica de zona auto-fill
    var zonas = _rvVeteZonaMap[vets[0]];
    var selZ = gel('rv-zona');
    if(selZ && zonas && zonas.length === 1) selZ.value = zonas[0];
    if(!ruc){
      var rucV=_rvRucMapVete[vets[0]];
      if(rucV) gel('rv-ruc').value = rucV;
    }
  }
  rvRenderResumen();
  if(_rvTipo==='Cobro de credito') rvCargarCreditos();
}

// Etiquetas en Registrar Visita: oculto tras un botón chico (mismo criterio
// que "Incluye regalo"). Solo asigna etiquetas ya existentes; el catálogo
// vive en _etiquetas (cargado por reloadEtiquetas en core.js).
function rvToggleEtiquetasPicker(){
  var wrap=gel('rv-etiquetas-wrap');
  if(!wrap)return;
  if(wrap.style.display==='none'){wrap.style.display='block';rvRenderEtiquetasPicker();}
  else wrap.style.display='none';
}
function rvRenderEtiquetasPicker(){
  var el=gel('rv-etiquetas-chips');if(!el)return;
  var nombre=(gel('rv-vete')&&gel('rv-vete').value||'').trim();
  if(!nombre){el.innerHTML='<span style="font-size:12px;color:var(--tl);">Escribe primero la veterinaria.</span>';return;}
  var info=_cliVetInfo(nombre);
  var asignadas={};
  if(info)_etiquetasDeCliente(info.id).forEach(function(et){asignadas[et.id]=1;});
  el.innerHTML=(_etiquetas||[]).map(function(et){
    return _chipEtiqueta(et,!!asignadas[et.id],"rvToggleEtiquetaVisita('"+et.id+"')");
  }).join('')||'<span style="font-size:12px;color:var(--tl);">Todavía no hay etiquetas creadas (se crean desde Editar cliente).</span>';
}
function rvToggleEtiquetaVisita(etiquetaId){
  var nombre=(gel('rv-vete')&&gel('rv-vete').value||'').trim();
  if(!nombre)return;
  _clienteEtiquetaToggle(nombre,etiquetaId).then(function(){
    rvRenderEtiquetasPicker();
  }).catch(function(e){showToast(e.message||'No se pudo actualizar la etiqueta','er');});
}

function rvSetTipo(tipo){
  _rvTipo = tipo;
  // .tipo-btn/.sel en vez de tres colores reescritos a mano por tarjeta
  // (antes: borderColor/background/color en cada una de las 6 en cada
  // clic). El estado "activo" es una clase, como en el resto del portal.
  document.querySelectorAll('#rv-tipo-grid .tipo-btn').forEach(function(c){
    c.classList.toggle('sel', c.getAttribute('data-tipo')===tipo);
  });
  // Sincroniza aria-checked y el roving tabindex con la clase que se
  // acaba de mover.
  if(_rvTipoGroup) _rvTipoGroup.sync();
  // "Selecciona un tipo de movimiento" no tiene un <input> al que
  // anclarse: se limpia a mano, como el aviso de "sin movimientos".
  var errTipo=gel('rv-tipo-error'); if(errTipo){errTipo.hidden=true;errTipo.textContent='';}

  var camposMov = gel('rv-campos-mov');
  var cobroPanel = gel('rv-cobro-panel');
  if(tipo==='Visita'){ camposMov.style.display='none'; cobroPanel.style.display='none'; }
  else if(tipo==='Cobro de credito'){ camposMov.style.display='none'; cobroPanel.style.display='block'; rvCargarCreditos(); }
  else { camposMov.style.display='block'; cobroPanel.style.display='none'; }
  // Imagen y método de pago obligatorios para pagos directos
  var tiposConPago=['Venta al contado','Venta delivery','Cobro de credito'];
  var conPagoRv=tiposConPago.indexOf(tipo)>=0;
  var imgWrap=gel('rv-img-doc-wrap');
  if(imgWrap) imgWrap.style.display=conPagoRv?'block':'none';
  var mpWrap=gel('rv-metodo-pago-wrap');
  if(mpWrap) mpWrap.style.display=conPagoRv?'block':'none';
  if(!conPagoRv){ var rw=gel('rv-receptor-efectivo-wrap'); if(rw) rw.style.display='none'; }
}

function rvCargarCreditos(){
  var body = gel('rv-cred-body');
  if(!body) return;
  var vid = gel('rv-vendedor').value;
  var vete = (gel('rv-vete').value||'').trim();
  var doctora = (gel('rv-doctora').value||'').trim();
  if(!vete && !doctora){
    body.innerHTML='<div style="font-size:12px;color:var(--tl);padding:.6rem 0;">Ingresa la veterinaria o doctor/a para ver sus créditos pendientes.</div>';
    return;
  }
  // Vendedores sin zonas asignadas (p.ej. Administrador Suplevet) ven y cobran
  // los créditos de TODOS los vendedores, igual que en rvCambiarVendedor().
  var vendSel = vid ? _vendedores.filter(function(vv){return String(vv.id)===String(vid);})[0] : null;
  var sinRestriccionVend = !vid || !vendSel || !(vendSel.zonas_asignadas&&vendSel.zonas_asignadas.length);
  var creditos = _ventas.filter(function(v){
    var matchVet = vete && (v.veterinaria||'').toLowerCase()===(vete.toLowerCase());
    var matchDoc = doctora && (v.doctora||'').toLowerCase()===(doctora.toLowerCase());
    var esCred = (v.movimiento==='Credito a 15 dias'||v.movimiento==='Crédito a 15 días');
    var pendiente = v.estado!=='✅ Pagado'&&v.estado!=='Anulado'&&v.estado!=='📦 Devuelto';
    var matchVend = sinRestriccionVend || String(v.vendedor_id)===String(vid);
    return (matchVet||matchDoc) && esCred && pendiente && matchVend;
  });
  var yaAgregados = _rvMovimientos.filter(function(m){return m.tipo==='Cobro de credito';}).map(function(m){return m.credId;});
  creditos = creditos.filter(function(c){return yaAgregados.indexOf(c.id)<0;});
  if(!creditos.length){
    body.innerHTML='<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.85rem 1rem;display:flex;align-items:center;gap:10px;">'+
      '<span style="font-size:20px;">✅</span>'+
      '<div><div style="font-size:13px;font-weight:600;color:var(--brand);">Sin créditos pendientes</div>'+
      '<div style="font-size:11px;color:var(--tl);">Este cliente no tiene deudas pendientes.</div></div></div>';
    return;
  }
  var clienteNombre = vete||doctora;
  var html='<div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">💳 Créditos de '+clienteNombre+'</div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;">';
  creditos.forEach(function(c){
    var dias=c.fecha_cobro?diasHasta(c.fecha_cobro):null;
    var venc=dias!==null&&dias<0;
    var diasTxt=dias===null?'':(venc?'<span style="color:var(--er);font-weight:600;">Vencido hace '+Math.abs(dias)+'d</span>':'<span style="color:#d97706;font-weight:600;">Vence en '+dias+'d</span>');
    html+='<div id="rv-cr-'+c.id+'" style="border:1.5px solid '+(venc?'var(--er)':'var(--sky)')+';border-radius:var(--r);background:var(--wh);overflow:hidden;">'+
      '<div style="display:flex;align-items:center;gap:10px;padding:.65rem .85rem;flex-wrap:wrap;">'+
        '<div style="flex:1;min-width:120px;">'+
          '<div style="font-size:13px;font-weight:700;">'+(c.producto||'---')+'</div>'+
          '<div style="font-size:11px;color:var(--tl);">'+(c.cantidad||0)+' uds · '+money(c.total)+' · cobro '+fmt(c.fecha_cobro)+'</div>'+
          '<div style="font-size:11px;margin-top:2px;">'+diasTxt+'</div>'+
        '</div>'+
        '<div style="display:flex;gap:6px;flex-shrink:0;">'+
          '<button class="btn btn-ok btn-sm" onclick="rvCobrarTodo(\''+c.id+'\')" style="white-space:nowrap;">💰 Cobrar todo</button>'+
          '<button class="btn btn-s btn-sm" onclick="rvMostrarParcial(\''+c.id+'\')" style="white-space:nowrap;">✂️ Parcial</button>'+
        '</div>'+
      '</div>'+
      // Se puede cobrar en unidades o en dinero, porque en la calle pasan las
      // dos cosas: "pagaron 5 de las 10 bolsas" y "dieron S/ 500 de los
      // S/ 1000". El reparto es el mismo que en la pestaña Créditos — lo
      // comparten vía SVCobros.
      '<div id="rv-parcial-'+c.id+'" style="display:none;background:var(--sky4);border-top:1px solid var(--sky);padding:.65rem .85rem;">'+
        SVCobros.modoHTML('rvSetModoCred', c.id, 'uds')+
        '<div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-top:8px;">'+
          '<div style="flex:1;min-width:140px;" id="rv-wrap-uds-'+c.id+'">'+
          '<label for="rv-cant-'+c.id+'" style="font-size:11px;font-weight:700;color:var(--brand);display:block;margin-bottom:4px;">¿Cuántas unidades pagaron? (máx '+c.cantidad+')</label>'+
          // Sin valor por defecto: venía pre-rellenado con el total, así que
          // abrir "Parcial" y confirmar sin tocar nada registraba un cobro
          // completo desde el botón que dice "parcial".
          '<input type="number" id="rv-cant-'+c.id+'" min="1" max="'+c.cantidad+'" placeholder="Ej: 3" inputmode="numeric" style="width:110px;" oninput="rvPreviewCred(\''+c.id+'\')"/></div>'+
          '<div style="flex:1;min-width:140px;" id="rv-wrap-monto-'+c.id+'" hidden>'+
          '<label for="rv-monto-'+c.id+'" style="font-size:11px;font-weight:700;color:var(--brand);display:block;margin-bottom:4px;">¿Cuánto dinero pagaron? (máx '+money(c.total)+')</label>'+
          '<input type="number" id="rv-monto-'+c.id+'" min="0.01" step="0.01" placeholder="Ej: 500.00" inputmode="decimal" style="width:110px;" oninput="rvPreviewCred(\''+c.id+'\')"/></div>'+
          '<div style="flex:1;min-width:140px;"><label for="rv-fecha-'+c.id+'" style="font-size:11px;font-weight:700;color:var(--brand);display:block;margin-bottom:4px;">Fecha del cobro</label>'+
          '<input type="date" id="rv-fecha-'+c.id+'" max="'+hoy()+'" value="'+(gel('rv-fecha')?gel('rv-fecha').value:'')+'" /></div>'+
          '<button class="btn btn-p btn-sm" onclick="rvConfirmarParcial(\''+c.id+'\')" style="white-space:nowrap;">✓ Confirmar</button>'+
        '</div>'+
        // Desglose en vivo: cuánto entra, cuánto queda y en cuántas unidades.
        '<div class="cp-resumen" id="rv-resumen-'+c.id+'" role="status" hidden style="margin-top:8px;margin-bottom:0;"></div>'+
      '</div>'+
    '</div>';
  });
  html+='</div>';
  body.innerHTML=html;
}
// Modo de cobro elegido por crédito ('uds' | 'monto'). Es por crédito y no
// global porque el panel puede tener varios abiertos a la vez.
var _rvCredModo={};

function rvSetModoCred(id,modo){
  modo=(modo==='monto')?'monto':'uds';
  _rvCredModo[id]=modo;
  var esMonto=(modo==='monto');
  var wU=gel('rv-wrap-uds-'+id), wM=gel('rv-wrap-monto-'+id);
  if(wU) wU.hidden=esMonto;
  if(wM) wM.hidden=!esMonto;
  SVCobros.marcarModo(gel('cp-modo-uds-'+id), gel('cp-modo-monto-'+id), modo);
  // Cambiar de modo limpia el otro campo: 3 unidades y 3 soles no son lo mismo.
  var campo=gel((esMonto?'rv-monto-':'rv-cant-')+id);
  var otro =gel((esMonto?'rv-cant-':'rv-monto-')+id);
  if(otro){ otro.value=''; SVUI.limpiarError(otro); }
  if(campo){ campo.value=''; campo.focus(); }
  rvPreviewCred(id);
}

function _rvCredValor(id){
  var modo=_rvCredModo[id]||'uds';
  var campo=gel((modo==='monto'?'rv-monto-':'rv-cant-')+id);
  return { modo:modo, campo:campo, bruto:parseFloat((campo&&campo.value)||'') };
}

function rvPreviewCred(id){
  var c=_ventas.filter(function(v){return v.id===id;})[0];
  var d=_rvCredValor(id);
  SVCobros.pintarResumen(gel('rv-resumen-'+id), c, d.modo, d.bruto);
}

function rvMostrarParcial(id){
  var panel=gel('rv-parcial-'+id);if(!panel)return;
  document.querySelectorAll('[id^="rv-parcial-"]').forEach(function(p){if(p.id!=='rv-parcial-'+id)p.style.display='none';});
  panel.style.display=panel.style.display==='none'?'block':'none';
  if(panel.style.display==='block') rvSetModoCred(id,_rvCredModo[id]||'uds');
}
function rvCobrarTodo(id){
  var c=_ventas.filter(function(v){return v.id===id;})[0];if(!c)return;
  var fecha=gel('rv-fecha-'+id)?gel('rv-fecha-'+id).value:(gel('rv-fecha')?gel('rv-fecha').value:hoy());
  // rep completo: cantidad y total NO se tocan al guardar.
  _rvAgregarCobro(c,{completo:true},'uds',fecha);
}
function rvConfirmarParcial(id){
  var c=_ventas.filter(function(v){return v.id===id;})[0];if(!c)return;
  var d=_rvCredValor(id), fechaInp=gel('rv-fecha-'+id);

  // Las dos condiciones (vacío/0 y demasiado alto) comparten el mismo
  // campo: no se puede usar SVUI.validar() con dos reglas sobre el mismo
  // input porque la segunda, al pasar, borraría el error que acaba de
  // poner la primera. Se resuelve con el motivo que devuelve SVCobros.
  var rep=SVCobros.reparto(c,d.modo,d.bruto);
  if(rep.invalido){
    SVUI.marcarError(d.campo, SVCobros.mensajeError(c,d.modo,rep));
    if(d.campo){ d.campo.focus(); d.campo.select(); d.campo.scrollIntoView({behavior:'smooth',block:'center'}); }
    return;
  }
  if(d.campo) SVUI.limpiarError(d.campo);

  var fecha=(fechaInp&&fechaInp.value)||(gel('rv-fecha')?gel('rv-fecha').value:hoy());
  _rvAgregarCobro(c,rep,d.modo,fecha);
}
function _rvAgregarCobro(c,rep,modo,fecha){
  var _mpCobro = gel('rv-metodo-pago') ? gel('rv-metodo-pago').value : '';
  // El método de pago es obligatorio y estaba marcado como tal en la interfaz,
  // pero aquí se guardaba en null sin avisar. El panel de vendedores sí lo
  // bloquea; ahora los dos se comportan igual.
  if(!_mpCobro){
    showToast('Elige el método de pago antes de agregar el cobro','er');
    var mpw=gel('rv-metodo-pago-wrap')||gel('rv-mp-btn');
    if(mpw&&mpw.scrollIntoView) mpw.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  // El importe sale de SVCobros, no de cantidad × precio: en un cobro total es
  // el total original intacto, y en uno parcial la parte cobrada, cuyo saldo
  // complementario suma exactamente el original.
  var esParcial=!rep.completo;
  var montoCobrado=esParcial?rep.montoPagado:(Number(c.total)||0);
  var detalle=!esParcial
    ? ' (total)'
    : (modo==='monto'
        ? ' ('+money(rep.montoPagado)+' de '+money(c.total)+')'
        : ' ('+rep.udsPagadas+'/'+(c.cantidad||0)+')');
  _rvMovimientos.push({
    tipo:'Cobro de credito',
    credId:c.id, rep:rep, modo:modo,
    total:montoCobrado,
    fecha:fecha,credObj:c,
    metodo_pago:_mpCobro||null,
    desc:'Cobro: '+(c.producto||'')+detalle+(_mpCobro?' · '+_mpCobro:'')
  });
  rvRenderLista();rvRenderResumen();
  showToast('Cobro agregado: '+(c.producto||'')+' · '+money(montoCobrado),'ok');
  rvCargarCreditos();
}

function rvCalcTotal(){
  var c=parseFloat(gel('rv-cantidad').value)||0, p=parseFloat(gel('rv-precio').value)||0;
  gel('rv-total').value = money(c*p);
}

// Regalo: oculto detrás de un botón chico a propósito (ver comentario en
// mvToggleRegalo del panel vendedor — mismo criterio en los dos paneles).
function rvToggleRegalo(){
  var wrap=gel('rv-regalo-wrap');
  if(!wrap)return;
  if(wrap.style.display==='none')rvMostrarRegalo();else rvOcultarRegalo();
}
function rvMostrarRegalo(){
  var wrap=gel('rv-regalo-wrap');if(wrap)wrap.style.display='block';
  var btn=gel('btn-rv-regalo-toggle');if(btn)btn.classList.add('btn-sk');
}
function rvOcultarRegalo(){
  var wrap=gel('rv-regalo-wrap');if(wrap)wrap.style.display='none';
  var cant=gel('rv-regalo-cant');if(cant)cant.value='';
  var prodR=gel('rv-regalo-prod');if(prodR)prodR.value='';
  var btn=gel('btn-rv-regalo-toggle');if(btn)btn.classList.remove('btn-sk');
}

function rvAgregarMovimiento(){
  var tipo = _rvTipo;
  var mov = { tipo: tipo };
  if(tipo==='Visita'){
    mov.desc = 'Solo visita';
  } else if(tipo==='Cobro de credito'){
    showToast('Usa los botones "Cobrar todo" o "Parcial" de cada crédito','er');
    return;
  } else {
    var cant=parseFloat(gel('rv-cantidad').value)||0, precio=parseFloat(gel('rv-precio').value)||0;
    // producto/cantidad/precio son campos visibles normales: SVUI.validar
    // ya se encarga de marcar, enfocar y hacer scroll al primero que falte.
    var okCampos = SVUI.validar([
      {campo:'rv-producto', si:function(v){return !v;},
       error:'Elige el producto que se vendió.'},
      {campo:'rv-cantidad', si:function(){return cant<=0;},
       error:'La cantidad tiene que ser mayor que 0.'},
      {campo:'rv-precio',   si:function(){return precio<=0;},
       error:'El precio unitario tiene que ser mayor que 0.'}
    ]);
    if(!okCampos) return;
    var prod = gel('rv-producto').value;
    var _mpv = gel('rv-metodo-pago') ? gel('rv-metodo-pago').value : '';
    // Método de pago e imagen viven en inputs ocultos (hidden / file
    // disparado por un botón propio): no son enfocables ni tienen nada que
    // hacer scrollIntoView, así que el error se marca en el campo pero el
    // scroll apunta al contenedor visible que lo envuelve.
    var tiposConPagoMov=['Venta al contado','Venta delivery'];
    if(tiposConPagoMov.indexOf(tipo)>=0){
      if(!_mpv){
        SVUI.marcarError('rv-metodo-pago', 'Elige cómo se pagó para poder registrar la venta.');
        var mpW=gel('rv-metodo-pago-wrap'); if(mpW) mpW.scrollIntoView({behavior:'smooth',block:'center'});
        return;
      }
      SVUI.limpiarError('rv-metodo-pago');
      if(_mpv!=='EFECTIVO' && (!_rvImagenes || !_rvImagenes.length)){
        SVUI.marcarError('rv-img-doc', 'Falta el comprobante. Adjunta la foto del pago.');
        var iW=gel('rv-img-doc-wrap'); if(iW) iW.scrollIntoView({behavior:'smooth',block:'center'});
        return;
      }
      SVUI.limpiarError('rv-img-doc');
    }
    mov.producto=prod; mov.cantidad=cant; mov.precio=precio; mov.total=cant*precio;
    mov.desc=prod+' × '+cant+' = '+money(mov.total);
    if(_mpv){ mov.metodo_pago=_mpv; mov.desc += ' · '+_mpv; }
    // Regalo: unidades extra del mismo producto, entregadas sin costo junto
    // con esta venta (p.ej. "compra 12, llevas 13"). Solo aplica si se abrió
    // el panel de regalo; si no, regaloCant queda en 0.
    var _regaloWrapVisible = gel('rv-regalo-wrap') && gel('rv-regalo-wrap').style.display!=='none';
    mov.regaloCant = _regaloWrapVisible ? (parseInt(gel('rv-regalo-cant').value,10)||0) : 0;
    // Si no elige producto de regalo, se asume el mismo que se está vendiendo.
    mov.regaloProd = _regaloWrapVisible ? ((gel('rv-regalo-prod')&&gel('rv-regalo-prod').value||'').trim()||prod) : '';
    if(mov.regaloCant>0){
      mov.desc += ' · +'+mov.regaloCant+' '+mov.regaloProd+' de regalo';
    }
  }
  _rvMovimientos.push(mov);
  // reset campos
  gel('rv-producto').value=''; gel('rv-cantidad').value=''; gel('rv-precio').value=''; gel('rv-total').value='';
  rvOcultarRegalo();
  rvRenderLista(); rvRenderResumen();
}

function rvRenderLista(){
  if(!_rvMovimientos.length){ gel('rv-lista-mov').innerHTML='<div style="color:var(--tl);font-size:13px;text-align:center;padding:1rem;">Ningún movimiento aún</div>'; return; }
  gel('rv-lista-mov').innerHTML = _rvMovimientos.map(function(m,i){
    return '<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.6rem .85rem;margin-bottom:.5rem;display:flex;align-items:center;gap:10px;">'+
      bMov(m.tipo)+
      '<div style="flex:1;">'+
        '<div style="font-size:12px;color:var(--tm);">'+esc(m.desc)+'</div>'+
      '</div>'+
      (m.total?'<strong style="color:var(--brand);font-size:14px;">'+money(m.total)+'</strong>':'')+
      '<button class="btn btn-d btn-sm" onclick="_rvElim('+i+')" style="padding:.2rem .55rem;font-size:11px;">✕</button>'+
    '</div>';
  }).join('');
}

function _rvElim(i){ _rvMovimientos.splice(i,1); rvRenderLista(); rvRenderResumen(); }

// ── STEPPER DE 3 PASOS ──
// Mismo criterio y misma marcación (fwz1/fwz2/fwz3 con prefijo "rv") que en
// el panel de vendedores: antes eran tres divs estáticos que siempre
// mostraban "paso 1 hecho, paso 2 en curso" sin importar si el formulario
// tenía algo escrito. Ahora reflejan el estado real.
function rvActualizarStepper(){
  var vete=gel('rv-vete')?gel('rv-vete').value.trim():'';
  var doc=gel('rv-doctora')?gel('rv-doctora').value.trim():'';
  var zona=gel('rv-zona')?gel('rv-zona').value:'';
  var datosListos = !!((vete||doc) && zona);
  var hayMovs = !!(_rvMovimientos && _rvMovimientos.length);

  function paso(id, numero, estado){
    var el=gel(id); if(!el) return;
    el.classList.remove('done','active');
    if(estado) el.classList.add(estado);
    if(estado==='active') el.setAttribute('aria-current','step');
    else el.removeAttribute('aria-current');
    var fsn=el.querySelector('.fsn');
    if(fsn) fsn.innerHTML = (estado==='done')
      ? '<svg class="ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24" style="width:12px;height:12px;"><use href="#i-check"/></svg>'
      : String(numero);
  }

  paso('rvfwz1', 1, datosListos ? 'done' : 'active');
  paso('rvfwz2', 2, !datosListos ? '' : (hayMovs ? 'done' : 'active'));
  paso('rvfwz3', 3, (datosListos && hayMovs) ? 'active' : '');
}

// ── BARRA DE RESUMEN FIJA (solo móvil) ──
// Mismo problema y misma solución que en el panel de vendedores: en
// pantallas angostas el panel de resumen (#rv-resumen-card) cae al final
// de la página y el total deja de estar a la vista mientras se agregan
// movimientos. rvSyncMobileBar(p) la muestra solo en 'reg-visita' — se
// llama desde goTo() en core.js, así que corre en cada navegación.
function rvActualizarBarraMovil(){
  var bar=gel('rv-mobile-bar'); if(!bar) return;
  var lista=_rvMovimientos||[];
  var total=lista.reduce(function(s,m){return s+(m.total||0);},0);
  var cEl=gel('rv-mobile-bar-count'), tEl=gel('rv-mobile-bar-total');
  if(cEl) cEl.textContent = lista.length ? (lista.length+' movimiento'+(lista.length!==1?'s':'')) : 'Sin movimientos';
  if(tEl) tEl.textContent = money(total);
}

function _rvAjustarBarraMovilOffset(){
  var bar=gel('rv-mobile-bar'); if(!bar) return;
  var nav=document.getElementById('bottom-nav');
  var navH = nav ? nav.offsetHeight : 0;
  bar.style.bottom = navH + 'px';
  // La hoja se apoya sobre la barra, y la barra sobre la navegación: las dos
  // alturas se miden, no se suponen (el safe-area-inset cambia por dispositivo).
  var sheet=gel('rv-sheet');
  if(sheet) sheet.style.bottom = (navH + bar.offsetHeight) + 'px';
}

// ── ACORDEÓN DE RESUMEN (solo móvil) ──
// La barra dejó de ser un atajo que hacía scroll al final de la página: ahora
// despliega el resumen ahí mismo, con su botón "Guardar visita" incluido. El
// #rv-resumen-card no se duplica — se MUEVE dentro de la hoja en móvil y
// vuelve a su columna sticky en escritorio, así que sigue habiendo un solo
// botón de guardar y un solo nodo que rvRenderResumen() actualiza.
var _rvSheetAbierta = false;

function _rvEsMovil(){ return window.innerWidth <= 768; }

function _rvSheetMontar(dentro){
  var body=gel('rv-sheet-body'), card=gel('rv-resumen-card'), anchor=gel('rv-anchor-resumen');
  if(!body || !card) return;
  if(dentro){
    if(card.parentNode !== body) body.appendChild(card);
  } else if(anchor && card.parentNode !== anchor.parentNode){
    anchor.parentNode.insertBefore(card, anchor.nextSibling);
  }
}

function rvSheetAbrir(){
  if(!_rvEsMovil()) return;
  var sheet=gel('rv-sheet'), bar=gel('rv-mobile-bar'), bd=gel('rv-sheet-backdrop');
  if(!sheet || !bar) return;
  _rvSheetMontar(true);
  sheet.classList.add('show');
  if(bd) bd.classList.add('show');
  bar.classList.add('open');
  bar.setAttribute('aria-expanded','true');
  _rvSheetAbierta = true;
  _rvAjustarBarraMovilOffset();
}

function rvSheetCerrar(){
  var sheet=gel('rv-sheet'), bar=gel('rv-mobile-bar'), bd=gel('rv-sheet-backdrop');
  if(sheet) sheet.classList.remove('show');
  if(bd) bd.classList.remove('show');
  if(bar){ bar.classList.remove('open'); bar.setAttribute('aria-expanded','false'); }
  _rvSheetAbierta = false;
}

function rvSheetToggle(){ _rvSheetAbierta ? rvSheetCerrar() : rvSheetAbrir(); }

// En escritorio el resumen vuelve siempre a su columna: si el acordeón se
// quedó abierto y la ventana se ensancha (o se gira la tablet), la hoja se
// cierra y el nodo se devuelve a su sitio en el mismo paso.
function _rvSheetSyncLayout(){
  if(_rvEsMovil()) return;
  rvSheetCerrar();
  _rvSheetMontar(false);
}

function rvSyncMobileBar(p){
  var bar=gel('rv-mobile-bar'); if(!bar) return;
  var enPagina = (p==='reg-visita');
  bar.classList.toggle('show', enPagina);
  if(!enPagina){ rvSheetCerrar(); _rvSheetMontar(false); }
  _rvAjustarBarraMovilOffset();
}

window.addEventListener('resize', function(){
  var bar=gel('rv-mobile-bar');
  if(bar && bar.classList.contains('show')){ _rvSheetSyncLayout(); _rvAjustarBarraMovilOffset(); }
});

document.addEventListener('keydown', function(e){
  if(e.key==='Escape' && _rvSheetAbierta) rvSheetCerrar();
});

function rvRenderResumen(){
  rvActualizarStepper();
  rvActualizarBarraMovil();
  var vete=(gel('rv-vete')?gel('rv-vete').value:''), doc=(gel('rv-doctora')?gel('rv-doctora').value:'');
  var total=_rvMovimientos.reduce(function(s,m){return s+(m.total||0);},0);
  gel('rv-resumen').innerHTML=
    '<div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;">'+(vete||'— Veterinaria —')+'</div>'+
    '<div style="font-size:11px;color:rgba(255,255,255,.6);margin-bottom:.8rem;">'+(doc||'Sin doctor')+' · '+gel('rv-fecha').value+'</div>'+
    (_rvMovimientos.length
      ? _rvMovimientos.map(function(m){
          var dsp = m.tipo==='Visita' ? 'Solo visita'
            : m.tipo==='Cobro de credito' ? ('Cobro: '+(m.credObj&&m.credObj.producto?m.credObj.producto:'crédito'))
            : m.tipo==='Credito a 15 dias' ? ('⏳ '+(m.producto||'—')+' × '+m.cantidad)
            : ((m.producto||'—')+' × '+m.cantidad);
          var mp = m.metodo_pago||'';
          return '<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,.1);">'+
            '<div style="display:flex;align-items:center;gap:6px;">'+
              '<span style="flex:1;min-width:0;font-size:12px;color:rgba(255,255,255,.8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+esc(dsp)+'</span>'+
              '<span style="flex-shrink:0;white-space:nowrap;font-size:12px;padding-left:8px;font-weight:600;">'+money(m.total||0)+'</span>'+
            '</div>'+
            (mp?'<div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px;">&#128179; '+esc(mp)+'</div>':'')+
          '</div>';
        }).join('')+
        '<div style="display:flex;justify-content:space-between;font-family:Bebas Neue,sans-serif;font-size:22px;margin-top:.7rem;padding-top:.5rem;border-top:1px solid rgba(255,255,255,.2);"><span>TOTAL</span><span>'+money(total)+'</span></div>'
      : '<div style="color:rgba(255,255,255,.4);font-size:12px;text-align:center;padding:1rem;">Sin movimientos</div>');
}

// "Agrega al menos un movimiento" no es un campo inválido, es un estado
// (la lista está vacía). Mismo criterio que en el panel de vendedores.
function _rvMostrarErrorSinMovimiento(){
  var p=gel('rv-sin-mov-error'); if(!p) return;
  p.textContent='Esta visita no tiene movimientos. Si solo fue una visita de cortesía, elige "Solo Visita".';
  p.hidden=false;
  // Este aviso vive dentro de la tarjeta de resumen, que en móvil está en el
  // acordeón: si está cerrado hay que abrirlo o el mensaje no se ve (y
  // scrollIntoView sobre un nodo en display:none no hace nada).
  if(_rvEsMovil()) rvSheetAbrir();
  else p.scrollIntoView({behavior:'smooth',block:'center'});
}
function _rvOcultarErrorSinMovimiento(){
  var p=gel('rv-sin-mov-error'); if(!p) return;
  p.hidden=true; p.textContent='';
}

function rvGuardar(){
  // El botón vive dentro del acordeón en móvil. Se cierra antes de validar:
  // si falta un campo del formulario, SVUI hace scrollIntoView hasta él y la
  // hoja abierta lo taparía. El único aviso que vive DENTRO de la tarjeta
  // ("sin movimientos") vuelve a abrirla por su cuenta.
  rvSheetCerrar();
  var vid = gel('rv-vendedor').value;
  var vete = gel('rv-vete').value, doc=gel('rv-doctora').value, cel=gel('rv-celular').value;
  var ruc = gel('rv-ruc')?gel('rv-ruc').value.trim():'';
  var zona=gel('rv-zona').value, fecha=gel('rv-fecha').value, hora=gel('rv-hora').value, notas=gel('rv-notas').value;
  var catCliente=gel('rv-cat')?gel('rv-cat').value:'';
  var _docsRv=docsSerializar('rv');
  var tipoDoc=_docsRv.tipo||'';
  var numDoc=_docsRv.nro||'';
  var rvReceptorEfectivo=gel('rv-receptor-efectivo')?gel('rv-receptor-efectivo').value:'';
  var tiposConPago=['Venta al contado','Venta delivery','Cobro de credito'];
  // Solo se exige imagen si hay algún movimiento de pago con método distinto de EFECTIVO.
  var requiereImagen=_rvMovimientos.some(function(m){return tiposConPago.indexOf(m.tipo)>=0 && (m.metodo_pago||'')!=='EFECTIVO';});
  var okBase = SVUI.validar([
    {campo:'rv-vendedor', si:function(v){return !v;}, error:'Elige a nombre de qué vendedor registras esta visita.'},
    {campo:'rv-fecha',    si:function(v){return !v;}, error:'Elige la fecha de la visita.'},
    {campo:'rv-zona',     si:function(v){return !v;}, error:'Elige la zona donde fue la visita.'}
  ]);
  if(!okBase) return;

  // "Agrega al menos un movimiento" no tiene un campo al que anclarse — es
  // el estado de la lista, no un input que falló. Mismo criterio que en el
  // panel de vendedores: un aviso junto a los botones de guardar, no solo
  // en la barra global de arriba.
  if(!_rvMovimientos.length){
    _rvMostrarErrorSinMovimiento();
    return;
  }
  _rvOcultarErrorSinMovimiento();

  if(requiereImagen&&!_rvImagenes.length){
    SVUI.marcarError('rv-img-doc', 'Falta el comprobante. Adjunta la foto del pago para poder guardar la visita.');
    var iWg=gel('rv-img-doc-wrap'); if(iWg) iWg.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  SVUI.limpiarError('rv-img-doc');
  setBL('btn-rv-guardar',true,'Guardando...');
  // Upload all images sequentially
  var _ts=Date.now();
  var imgPromise=_rvImagenes.length
    ?_rvImagenes.reduce(function(chain,file,i){
        return chain.then(function(urls){
          return comprimirImagen(file,4).then(function(compressed){
            var ext=(compressed.name.split('.').pop()||'jpg').toLowerCase();
            var path='visita-'+_ts+'-'+i+'.'+ext;
            return fetch(SB+'/storage/v1/object/documentos-venta/'+path,{
              method:'POST',
              headers:{'apikey':AK,'Authorization':'Bearer '+(AUTH_TOKEN||AK),'Content-Type':compressed.type},
              body:compressed
            }).then(function(r){
              if(!r.ok)return r.text().then(function(tx){
                var p={};try{p=JSON.parse(tx);}catch(ex){}
                throw new Error(p.message||p.error||'Error al subir imagen '+(i+1));
              });
              urls.push(SB+'/storage/v1/object/public/documentos-venta/'+path);
              return urls;
            });
          });
        });
      },Promise.resolve([]))
      .then(function(urls){return urls.join('\n');})
    :Promise.resolve(null);
  imgPromise.then(function(imgUrl){
    var grupoId = 'g_'+Date.now();
    var noCobroMov = _rvMovimientos.filter(function(m){return m.tipo!=='Cobro de credito';});
    var cobros = _rvMovimientos.filter(function(m){return m.tipo==='Cobro de credito'&&m.credId;});
    var payload = noCobroMov.map(function(m){
      var fc=null;
      if(m.tipo==='Credito a 15 dias'){var _fp=fecha.split('-');var _fd=new Date(+_fp[0],+_fp[1]-1,+_fp[2]+15);fc=_fd.getFullYear()+'-'+String(_fd.getMonth()+1).padStart(2,'0')+'-'+String(_fd.getDate()).padStart(2,'0');}
      // All rows must share IDENTICAL keys — PostgREST PGRST102 requires this for batch inserts.
      // Use null for fields that don't apply to a particular movement type.
      return {
        vendedor_id:    vid,
        fecha:          fecha,
        hora:           hora||null,
        veterinaria:    vete||null,
        doctora:        doc||null,
        num_medico:     cel||null,
        zona:           zona,
        ruc:            ruc||null,
        notas:          notas||null,
        movimiento:     m.tipo,
        estado:         m.tipo==='Credito a 15 dias'?'⏳ Pendiente':m.tipo==='Visita'?'Visita':'✅ Pagado',
        grupo_visita_id:grupoId,
        producto:       m.tipo!=='Visita'?(m.producto||null):null,
        cantidad:       m.tipo!=='Visita'?(m.cantidad||null):null,
        precio_unitario:m.tipo!=='Visita'?(m.precio||null):null,
        total:          m.tipo!=='Visita'?(m.total||null):null,
        fecha_cobro:    fc,
        tipo_documento: tipoDoc||null,
        numero_documento:numDoc||null,
        imagen_documento:imgUrl||null,
        segmento_cliente:catCliente||null,
        metodo_pago:     m.metodo_pago||null,
        receptor_efectivo:(m.metodo_pago||null)==='EFECTIVO'?(rvReceptorEfectivo||null):null,
        es_regalo:       false
      };
    });
    // Regalo: fila aparte con el mismo producto a precio 0, marcada
    // es_regalo=true — mismas keys que las filas de arriba (PGRST102 exige
    // que todo el lote comparta exactamente el mismo set de columnas).
    noCobroMov.forEach(function(m){
      if(!(m.regaloCant>0))return;
      payload.push({
        vendedor_id:vid, fecha:fecha, hora:hora||null,
        veterinaria:vete||null, doctora:doc||null, num_medico:cel||null,
        zona:zona, ruc:ruc||null, notas:(notas?notas+' · ':'')+'Regalo por compra de '+(m.cantidad||0)+' uds de '+(m.producto||''),
        movimiento:m.tipo, estado:'✅ Pagado', grupo_visita_id:grupoId,
        producto:m.regaloProd||m.producto||null, cantidad:m.regaloCant,
        precio_unitario:0, total:0,
        fecha_cobro:null, tipo_documento:null, numero_documento:null,
        imagen_documento:imgUrl||null, segmento_cliente:catCliente||null,
        metodo_pago:null, receptor_efectivo:null,
        es_regalo:true
      });
    });
    var prom = payload.length ? sbP('ventas',payload) : Promise.resolve();
    return prom.then(function(){
      if(!vete)return;
      // Auto-crear clientes_vet si la veterinaria todavía no está registrada
      // (mismo patrón que PANEL DE VENDEDORES/assets/js/ventas.js) — sin esto
      // las visitas registradas por el admin a vets nuevas nunca aparecen en "Mi Ruta".
      return sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(vete)+'&select=id')
        .then(function(ex){
          if(!ex||!ex.length)return sbP('clientes_vet',{nombre_vet:vete,doctora:doc||null,zona:zona,num_medico:cel||null,ruc:ruc||null,creado_por_vendedor_id:vid||null});
          // Ya existe: sincronizar el RUC si el usuario lo cambió/ingresó en esta visita
          // (mismo criterio que num_medico — el valor capturado en la visita es la fuente de verdad más reciente).
          if(ruc) return sbU('clientes_vet',ex[0].id,{ruc:ruc});
        })
        .catch(function(){});
    }).then(function(){
      return Promise.all(cobros.map(function(m){
        var fc = m.fecha||fecha;
        var v = m.credObj, rep = m.rep, fTxt = fmt(fc);
        if(!v || !rep) return Promise.reject(new Error('Cobro de crédito incompleto ('+m.credId+')'));
        if(!(SVCobros.precioEfectivo(v)>0)) return Promise.reject(new Error('Precio inválido para el cobro del crédito '+m.credId));

        // Los importes salen de SVCobros. Antes se recalculaban aquí como
        // cantidad × precio: en filas donde ese producto no da el total
        // (descuentos, precios editados a mano) las dos filas resultantes no
        // sumaban el original, y un "Cobrar todo" convertía un crédito de
        // S/ 950 en un cobro de S/ 1,000.
        var comun={
          // vendedor_id se reasigna a quien está cobrando (vid), no al que
          // dejó el crédito originalmente — sin esto, un crédito que un
          // vendedor dado de baja dejó abierto seguía apareciendo a su
          // nombre para siempre, aunque lo cobrara otra persona (reportado:
          // Gabriel Hidalgo inactivo, cobro hecho por Administrador Suplevet
          // seguía mostrando "Gabriel Hidalgo").
          vendedor_id: vid,
          estado:'✅ Pagado', movimiento:'Cobro de credito',
          fecha:fc, fecha_cobro:fc,
          notas:SVCobros.notaCobro(v,rep,m.modo,fTxt),
          metodo_pago: m.metodo_pago||null,
          receptor_efectivo: (m.metodo_pago||null)==='EFECTIVO'?(rvReceptorEfectivo||null):null
        };
        if(tipoDoc) comun.tipo_documento=tipoDoc;
        if(numDoc)  comun.numero_documento=numDoc;
        if(imgUrl)  comun.imagen_documento=imgUrl;
        // Cobro total: cantidad y total se quedan como estaban.
        var cobroUpd = rep.completo
          ? SVCobros.camposCobroTotal(comun)
          : SVCobros.camposCobroParcial(rep,comun);

        return sbU('ventas',m.credId,cobroUpd).then(function(){
          // Parcial: la fila del saldo. Junto con la anterior suma exactamente
          // el total original, y conserva la fecha de vencimiento ORIGINAL.
          if(!rep.completo){
            return sbP('ventas',[SVCobros.filaSaldo(v,rep,{
              vendedor_id:     vid,
              fecha:           v.fecha||fc,
              hora:            null,
              veterinaria:     v.veterinaria||vete||null,
              doctora:         v.doctora||doc||null,
              num_medico:      null,
              zona:            v.zona||zona||null,
              notas:           SVCobros.notaSaldo(v,rep,m.modo,fTxt),
              grupo_visita_id: grupoId,
              fecha_cobro:     (v.fecha_cobro||fc),
              tipo_documento:  null,
              numero_documento:null,
              imagen_documento:null
            })]);
          }
        });
      }));
    });
  })
  .then(function(){ return Promise.all([reloadVentas(), reloadClientesVet()]); })
  .then(function(){
    setSt('Visita guardada correctamente','ok'); setTimeout(function(){setSt('');},3000);
    _rvMovimientos=[]; rvRenderLista(); rvRenderResumen();
    ['rv-vete','rv-doctora','rv-notas','rv-celular','rv-ruc','rv-zona','rv-hora','rv-cat','rv-metodo-pago'].forEach(function(id){var e=gel(id);if(e)e.value='';});
    var etWrap=gel('rv-etiquetas-wrap');if(etWrap)etWrap.style.display='none';
    docsReset('rv');
    rvActualizarMP();
    var fechaEl=gel('rv-fecha');if(fechaEl)fechaEl.value=hoy();
    var imgEl=gel('rv-img-doc');if(imgEl)imgEl.value='';
    var imgWrap=gel('rv-img-doc-wrap');if(imgWrap)imgWrap.style.display='none';
    _rvImagenes=[];
    _rvImgRender();
    var dropV=gel('rv-vete-drop');if(dropV)dropV.style.display='none';
    var dropD=gel('rv-doc-drop');if(dropD)dropD.style.display='none';
    rvSetTipo('Visita');
    // rvRenderResumen() de la línea de arriba evaluó el stepper ANTES de
    // limpiar vete/doctora/zona: sin esto, justo después de guardar se veía
    // el formulario vacío pero el stepper seguía marcando los 3 pasos
    // completos hasta el siguiente cambio de campo.
    rvActualizarStepper();
  }).catch(function(e){ setSt(SVUI.error(e),'er'); setTimeout(function(){setSt('');},5000); })
  .finally(function(){ setBL('btn-rv-guardar',false,'<svg class="ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-guardar"/></svg> Guardar visita'); });
}

// ══ CLIENTES ADMIN ══
var _cliTab = 'vets';
var _cliView = 'cards';
function cliSetTab(tab,btn){
  _cliTab=tab;
  document.querySelectorAll('.cli-tab-btn').forEach(function(b){
    b.classList.remove('btn-p'); b.classList.add('btn-s');
  });
  if(btn){ btn.classList.remove('btn-s'); btn.classList.add('btn-p'); }
  rClientesAdmin();
}

function cliSetView(view){
  _cliView=view;
  var bC=gel('cli-view-cards'),bT=gel('cli-view-tabla');
  if(bC&&bT){
    bC.classList.remove(view==='cards'?'btn-s':'btn-p'); bC.classList.add(view==='cards'?'btn-p':'btn-s');
    bT.classList.remove(view==='tabla'?'btn-s':'btn-p'); bT.classList.add(view==='tabla'?'btn-p':'btn-s');
  }
  var btnPdf=gel('cli-btn-pdf');
  if(btnPdf)btnPdf.style.display=(view==='tabla')?'':'none';
  rClientesAdmin();
}

// Busca la fila de clientes_vet correspondiente a un nombre de veterinaria (case-insensitive)
function _cliVetInfo(nombreVet){
  if(!nombreVet)return null;
  var n=nombreVet.toLowerCase().trim();
  for(var i=0;i<_clientesVet.length;i++){
    if((_clientesVet[i].nombre_vet||'').toLowerCase().trim()===n)return _clientesVet[i];
  }
  return null;
}

function rClientesAdmin(){
  var sel=gel('cli-vend-fil');
  if(sel&&(!sel.options.length||sel.options.length===1)){
    sel.innerHTML='<option value="">Todos los vendedores</option>';
    _vendedores.forEach(function(v){var o=document.createElement('option');o.value=v.id;o.textContent=v.nombre;sel.appendChild(o);});
  }
  var selM=gel('cli-mes-fil');
  if(selM){
    var curMesVal=selM.value;
    var mesSet={};
    _ventas.forEach(function(v){if(v.fecha){var ym=v.fecha.substring(0,7);mesSet[ym]=1;}});
    var nm=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    selM.innerHTML='<option value="">Todos los meses</option>'+Object.keys(mesSet).sort().reverse().map(function(m){var p=m.split('-');return '<option value="'+m+'"'+(m===curMesVal?' selected':'')+'>'+nm[parseInt(p[1])-1]+' '+p[0]+'</option>';}).join('');
  }
  var selZ=gel('cli-zona-fil');
  if(selZ&&(!selZ.options.length||selZ.options.length===1)){
    selZ.innerHTML='<option value="">Todas las zonas</option>';
    _zonas.forEach(function(z){var o=document.createElement('option');o.value=z.nombre;o.textContent=z.nombre;selZ.appendChild(o);});
  }
  var busq=(gel('cli-busq')?gel('cli-busq').value:'').toLowerCase().trim();
  var filtVend=gel('cli-vend-fil')?gel('cli-vend-fil').value:'';
  var filtMes=gel('cli-mes-fil')?gel('cli-mes-fil').value:'';
  var filtZona=gel('cli-zona-fil')?gel('cli-zona-fil').value:'';
  var ventasFil=_ventas.filter(function(v){
    return (!filtVend||String(v.vendedor_id)===String(filtVend))
      &&(!filtMes||!v.fecha||v.fecha.indexOf(filtMes)===0)
      &&(!filtZona||(v.zona||'')===filtZona);
  });
  var map={};
  ventasFil.forEach(function(v){
    var key=_cliTab==='vets'?v.veterinaria:v.doctora;
    if(!key)return;
    if(!map[key])map[key]={nombre:key,otros:[],total:0,pendiente:0,transacc:0,visitas:0,zona:v.zona||'',celular:''};
    var otroKey=_cliTab==='vets'?v.doctora:v.veterinaria;
    if(otroKey&&map[key].otros.indexOf(otroKey)<0)map[key].otros.push(otroKey);
    if(v.movimiento==='Visita'||v.movimiento==='Solo visita'){map[key].visitas++;return;}
    if(!esDevolucion(v.movimiento)&&v.estado!=='Anulado'){map[key].total+=(v.total||0);map[key].transacc++;}
    if(v.estado==='\u23f3 Pendiente'||v.estado==='\u274c Vencido')map[key].pendiente+=(v.total||0);
    if(!map[key].zona&&v.zona)map[key].zona=v.zona;
    if(!map[key].celular&&v.num_medico)map[key].celular=v.num_medico;
  });
  var list=Object.values(map).sort(function(a,b){return b.total-a.total;});
  if(busq)list=list.filter(function(c){return c.nombre.toLowerCase().indexOf(busq)>=0||(c.zona||'').toLowerCase().indexOf(busq)>=0;});

  // Enriquecer con datos de clientes_vet (direcci\u00f3n, distrito)
  list.forEach(function(c){
    var vetNombre=_cliTab==='vets'?c.nombre:(c.otros[0]||'');
    var info=_cliVetInfo(vetNombre);
    c.direccion=(info&&info.direccion)||'';
    c.distrito=(info&&info.distrito)||'';
    if(!c.celular&&info&&info.num_medico)c.celular=info.num_medico;
    if(!c.zona&&info&&info.zona)c.zona=info.zona;
    // Solo aplica a veterinarias: los doctores no tienen fila propia en
    // clientes_vet, así que no hay dónde colgar etiquetas ni created_at.
    c.tags=info?_etiquetasDeCliente(info.id):[];
    c.esNuevo=info?_esClienteNuevo(info.created_at):false;
  });

  if(_cliView==='tabla'){
    cliRenderTabla(list);
  }else{
    cliRenderCards(list);
  }
}

function cliRenderCards(list){
  var html='';
  list.forEach(function(c){
    var color=_cliTab==='vets'?'var(--sky4)':'var(--orange3)';
    var border=_cliTab==='vets'?'var(--sky)':'var(--orange2)';
    // Chips chicos para no romper el alto de la tarjeta en una lista larga
    // \u2014 el detalle completo (con "sin registrar" etc.) vive en la ficha.
    var tagsHtml=(c.esNuevo?'<span class="b b-contado" style="padding:1px 6px;font-size:9.5px;">Nuevo</span>':'')+
      (c.tags||[]).map(function(et){return '<span style="display:inline-block;padding:1px 7px;border-radius:20px;font-size:9.5px;font-weight:700;background:'+et.color+';color:'+_colorTextoLegible(et.color)+';">'+esc(et.nombre)+'</span>';}).join('');
    html+='<div class="card" style="margin-bottom:.7rem;cursor:pointer;" data-cli-tipo="'+esc(_cliTab)+'" data-cli-nombre="'+esc(c.nombre)+'" onclick="cliVerEntidadEl(this)">'+
      '<div class="cb" style="display:flex;align-items:center;gap:14px;">'+
      '<div style="width:42px;height:42px;border-radius:50%;background:'+color+';border:2px solid '+border+';display:flex;align-items:center;justify-content:center;font-family:Bebas Neue,sans-serif;font-size:18px;color:var(--brand);flex-shrink:0;">'+esc(c.nombre.charAt(0).toUpperCase())+'</div>'+
      '<div style="flex:1"><div style="font-weight:700;font-size:14px;">'+esc(c.nombre)+'</div>'+
      '<div class="tm2">'+esc(c.otros.length?c.otros.slice(0,3).join(', '):'')+esc(c.zona?' \u00b7 '+c.zona:'')+'</div>'+
      (tagsHtml?'<div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap;">'+tagsHtml+'</div>':'')+
      '</div>'+
      '<div style="text-align:right"><div style="font-weight:700;font-size:14px;color:var(--brand);">S/ '+c.total.toFixed(2)+'</div>'+
      '<div class="tm2">'+c.transacc+' transacciones'+(c.visitas?' \u00b7 '+c.visitas+' visitas':'')+'</div>'+
      (c.pendiente>0?'<div style="font-size:11px;color:#d97706;font-weight:600;">S/ '+c.pendiente.toFixed(2)+' pendiente</div>':'')+
      '</div><div style="color:var(--tl);font-size:20px;">&rsaquo;</div></div></div>';
  });
  var elL=gel('cli-lista'),elT=gel('cli-tabla-wrap');
  if(elT)elT.style.display='none';
  if(elL){
    elL.style.display='';
    elL.innerHTML=html||'<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>Sin clientes registrados.</strong><br>Aparecerán aquí cuando el equipo registre visitas.</div>';
  }
}

function cliRenderTabla(list){
  var elL=gel('cli-lista'),elT=gel('cli-tabla-wrap'),elI=gel('cli-tabla-inner');
  if(elL)elL.style.display='none';
  if(!elT||!elI)return;
  elT.style.display='';
  if(!list.length){
    elI.innerHTML='<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div><strong>Sin clientes registrados.</strong><br>Aparecerán aquí cuando el equipo registre visitas.</div>';
    return;
  }
  var colOtros=_cliTab==='vets'?'Doctor(a)':'Veterinaria';
  var html='<table><thead><tr>'+
    '<th>'+(_cliTab==='vets'?'Veterinaria':'Doctor(a)')+'</th><th>'+colOtros+'</th><th>Zona</th><th>Direcci\u00f3n</th><th>Distrito</th><th>Celular</th><th>Etiquetas</th><th>Total comprado</th><th>Pendiente</th><th>Transacc.</th>'+
  '</tr></thead><tbody>';
  list.forEach(function(c){
    var tagsCelda=(c.esNuevo?'<span class="b b-contado" style="padding:1px 6px;font-size:9.5px;">Nuevo</span> ':'')+
      (c.tags||[]).map(function(et){return '<span style="display:inline-block;padding:1px 7px;border-radius:20px;font-size:9.5px;font-weight:700;background:'+et.color+';color:'+_colorTextoLegible(et.color)+';margin-right:2px;">'+esc(et.nombre)+'</span>';}).join('');
    html+='<tr style="cursor:pointer;" data-cli-tipo="'+esc(_cliTab)+'" data-cli-nombre="'+esc(c.nombre)+'" onclick="cliVerEntidadEl(this)">'+
      '<td><strong>'+esc(c.nombre)+'</strong></td>'+
      '<td>'+esc(c.otros.length?c.otros.slice(0,3).join(', '):'---')+'</td>'+
      '<td>'+(c.zona?'<span style="font-size:11px;background:var(--sky4);color:var(--brand);border-radius:4px;padding:1px 6px;font-weight:700;">'+esc(c.zona)+'</span>':'---')+'</td>'+
      '<td>'+esc(c.direccion||'---')+'</td>'+
      '<td>'+esc(c.distrito||'---')+'</td>'+
      '<td>'+esc(c.celular||'---')+'</td>'+
      '<td>'+(tagsCelda||'---')+'</td>'+
      '<td><strong>S/ '+c.total.toFixed(2)+'</strong></td>'+
      '<td>'+(c.pendiente>0?'<span class="b b-pendiente">S/ '+c.pendiente.toFixed(2)+'</span>':'---')+'</td>'+
      '<td style="text-align:center;">'+c.transacc+'</td>'+
    '</tr>';
  });
  html+='</tbody></table>';
  elI.innerHTML=html;
}

function cliExportarPDF(){
  var sel=gel('cli-vend-fil'),selM=gel('cli-mes-fil'),selZ=gel('cli-zona-fil');
  var vendLabel=(sel&&sel.value)?(' \u00b7 '+getNombreVendedor(sel.value)):'';
  var zonaLabel=(selZ&&selZ.value)?(' \u00b7 Zona '+selZ.value):'';
  var nm=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var mesLabel='';
  if(selM&&selM.value){var p=selM.value.split('-');mesLabel=' \u2014 '+nm[parseInt(p[1])-1]+' de '+p[0];}

  var busq=(gel('cli-busq')?gel('cli-busq').value:'').toLowerCase().trim();
  var filtVend=sel?sel.value:'';
  var filtMes=selM?selM.value:'';
  var filtZona=selZ?selZ.value:'';
  var ventasFil=_ventas.filter(function(v){
    return (!filtVend||String(v.vendedor_id)===String(filtVend))
      &&(!filtMes||!v.fecha||v.fecha.indexOf(filtMes)===0)
      &&(!filtZona||(v.zona||'')===filtZona);
  });
  var map={};
  ventasFil.forEach(function(v){
    var key=_cliTab==='vets'?v.veterinaria:v.doctora;
    if(!key)return;
    if(!map[key])map[key]={nombre:key,otros:[],zona:v.zona||'',celular:''};
    var otroKey=_cliTab==='vets'?v.doctora:v.veterinaria;
    if(otroKey&&map[key].otros.indexOf(otroKey)<0)map[key].otros.push(otroKey);
    if(!map[key].zona&&v.zona)map[key].zona=v.zona;
    if(!map[key].celular&&v.num_medico)map[key].celular=v.num_medico;
  });
  var list=Object.values(map).sort(function(a,b){return a.nombre.localeCompare(b.nombre);});
  if(busq)list=list.filter(function(c){return c.nombre.toLowerCase().indexOf(busq)>=0||(c.zona||'').toLowerCase().indexOf(busq)>=0;});
  list.forEach(function(c){
    var vetNombre=_cliTab==='vets'?c.nombre:(c.otros[0]||'');
    var info=_cliVetInfo(vetNombre);
    c.direccion=(info&&info.direccion)||'';
    c.distrito=(info&&info.distrito)||'';
    if(!c.celular&&info&&info.num_medico)c.celular=info.num_medico;
    if(!c.zona&&info&&info.zona)c.zona=info.zona;
  });

  var colOtros=_cliTab==='vets'?'Doctor(a)':'Veterinaria';
  var tabla='<table style="width:100%;border-collapse:collapse;font-size:11px;">'+
    '<thead><tr style="background:#253C61;color:#fff;">'+
    '<th style="padding:6px 8px;text-align:left;">'+(_cliTab==='vets'?'Veterinaria':'Doctor(a)')+'</th>'+
    '<th style="padding:6px 8px;text-align:left;">'+colOtros+'</th>'+
    '<th style="padding:6px 8px;text-align:left;">Celular</th>'+
    '<th style="padding:6px 8px;text-align:left;">Direcci\u00f3n</th>'+
    '<th style="padding:6px 8px;text-align:left;">Distrito</th>'+
    '</tr></thead><tbody>';
  list.forEach(function(c,i){
    var bg=i%2===0?'#fff':'#f8fafc';
    tabla+='<tr style="background:'+bg+';">'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+esc(c.nombre)+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+esc(c.otros.length?c.otros.join(', '):'---')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+esc(c.celular||'---')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+esc(c.direccion||'---')+'</td>'+
      '<td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">'+esc(c.distrito||'---')+'</td>'+
    '</tr>';
  });
  tabla+='</tbody></table>';

  var titulo=_cliTab==='vets'?'Veterinarias':'Doctores / Doctoras';
  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8">'+_pdfFavicon()+'<title>'+titulo+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}.wrap{padding:16px 32px;}</style></head><body>'+
    _pdfHeader(titulo+mesLabel,'Datos de contacto y ubicaci\u00f3n'+vendLabel+zonaLabel)+
    '<div class="wrap">'+tabla+
    '<div style="margin-top:12px;font-size:10px;color:#64748b;text-align:right;">'+list.length+' registros \u00b7 Generado: '+new Date().toLocaleString('es-PE')+'</div>'+
    '</div><script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>');
  w.document.close();
}

function cliVerEntidadEl(el){
  cliVerEntidad(el.getAttribute('data-cli-tipo')||'',el.getAttribute('data-cli-nombre')||'');
}
function cliVerEntidad(tipo,nombre){
  _cliEntHistVerTodo=false;
  var ventas=_ventas.filter(function(v){return tipo==='vets'?v.veterinaria===nombre:v.doctora===nombre;});
  var meses=[],seen={};
  ventas.forEach(function(v){var m=v.fecha?v.fecha.substring(0,7):null;if(m&&!seen[m]){seen[m]=1;meses.push(m);}});
  meses.sort().reverse();
  var n=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var modal=gel('modal-cli-ent');if(!modal)return;
  modal.dataset.tipo=tipo;modal.dataset.nombre=nombre;
  var selM=gel('cli-ent-mes');
  if(selM)selM.innerHTML='<option value="">Todos los meses</option>'+meses.map(function(m){var p=m.split('-');return '<option value="'+m+'">'+n[parseInt(p[1])-1]+' '+p[0]+'</option>';}).join('');
  var docs=[],dset={};
  ventas.forEach(function(v){if(tipo==='vets'&&v.doctora&&!dset[v.doctora]){dset[v.doctora]=1;docs.push(v.doctora);}});
  var vets=[],vset={};
  ventas.forEach(function(v){if(tipo!=='vets'&&v.veterinaria&&!vset[v.veterinaria]){vset[v.veterinaria]=1;vets.push(v.veterinaria);}});
  var ventasSorted=ventas.slice().sort(function(a,b){return (b.fecha||'')>(a.fecha||'')?1:-1;});
  var zona=ventasSorted.reduce(function(z,v){return z||v.zona||'';},'')||'';
  var meta=tipo==='vets'?(docs.join(', ')+(zona?' \u00b7 '+zona:'')):vets.join(', ');
  var ttl=gel('cli-ent-nombre');if(ttl)ttl.textContent=nombre;
  var mt=gel('cli-ent-meta');if(mt)mt.innerHTML=meta;
  // Celular, RUC y dirección: misma fuente canónica que usa el formulario de
  // editar (clientes_vet, no la última venta) para que se vea aquí lo que ya
  // está registrado en vez de aparecer vacío cuando la última venta fue una
  // visita sin esos datos.
  var dt=gel('cli-ent-datos');
  var infoVetDatos=tipo==='vets'?_cliVetInfo(nombre):null;
  if(dt){
    var celDatos=(infoVetDatos&&infoVetDatos.num_medico)||ventasSorted.reduce(function(c,v){return c||v.num_medico||v.celular||'';},'')||'';
    var rucDatos=(infoVetDatos&&infoVetDatos.ruc)||ventasSorted.reduce(function(r,v){return r||v.ruc||'';},'')||'';
    var dirDatos=infoVetDatos?[infoVetDatos.direccion,infoVetDatos.distrito].filter(Boolean).join(', '):'';
    var chips=[];
    chips.push('<span class="cli-chip'+(celDatos?'':' muted')+'"><svg class="ic" viewBox="0 0 24 24"><use href="#i-telefono"/></svg>'+(celDatos?esc(celDatos):'Celular no registrado')+'</span>');
    chips.push('<span class="cli-chip'+(rucDatos?'':' muted')+'"><svg class="ic" viewBox="0 0 24 24"><use href="#i-tarjeta"/></svg>RUC: '+(rucDatos?esc(rucDatos):'no registrado')+'</span>');
    if(tipo==='vets')chips.push('<span class="cli-chip'+(dirDatos?'':' muted')+'"><svg class="ic" viewBox="0 0 24 24"><use href="#i-pin"/></svg>'+(dirDatos?esc(dirDatos):'Sin ubicación registrada')+'</span>');
    dt.innerHTML=chips.join('');
  }
  // Estado de cuenta: deuda vigente en TODO el histórico del cliente, no solo
  // el mes filtrado — es lo que responde "¿le debe algo a Suplevet ahora?".
  var elEstado=gel('cli-ent-estado');
  if(elEstado){
    var pendTotalHist=ventas.reduce(function(s,v){return s+((v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido')?(v.total||0):0);},0);
    elEstado.innerHTML=pendTotalHist>0?'<span class="b b-vencido">Con deuda · S/ '+pendTotalHist.toFixed(2)+'</span>':'<span class="b b-pagado">Al día</span>';
  }
  cliRenderTagsPerfil();
  cliRenderTrend(ventas);
  // Tarjetas de productos pendientes
  cliRenderProdCards(ventas);
  cliEntRender(ventas,'');
  abrirModal('modal-cli-ent');
}

// Tendencia de compra: total vendido por mes en los últimos 6 meses,
// siempre sobre el histórico completo del cliente (no cambia con el filtro
// de mes del selector, que es para el detalle de abajo) — así se ve la
// evolución real de la relación comercial de un vistazo.
function cliRenderTrend(ventas){
  var el=gel('cli-ent-trend');if(!el)return;
  var nombresMes=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var hoy=new Date();
  var meses=[];
  for(var i=5;i>=0;i--){
    var d=new Date(hoy.getFullYear(),hoy.getMonth()-i,1);
    meses.push({key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),lbl:nombresMes[d.getMonth()],total:0,esActual:i===0});
  }
  var byKey={};meses.forEach(function(m){byKey[m.key]=m;});
  ventas.forEach(function(v){
    if(esDevolucion(v.movimiento)||v.estado==='Anulado'||v.movimiento==='Visita')return;
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
  var el = gel('cli-prod-cards');
  if(!el) return;
  // Productos comprados (pagados)
  var compMap = {};
  ventas.forEach(function(v){
    if(v.estado==='✅ Pagado' && v.producto && v.producto.trim() && !esDevolucion(v.movimiento)){
      var p = v.producto.trim();
      if(!compMap[p]) compMap[p] = {cant:0, total:0};
      compMap[p].cant += (v.cantidad||1);
      compMap[p].total += (v.total||0);
    }
  });
  // Productos pendientes de cobro
  var pendMap = {};
  ventas.forEach(function(v){
    if((v.estado==='⏳ Pendiente'||v.estado==='❌ Vencido') && v.producto && v.producto.trim()){
      var p = v.producto.trim();
      if(!pendMap[p]) pendMap[p] = {cant:0, total:0};
      pendMap[p].cant += (v.cantidad||1);
      pendMap[p].total += (v.total||0);
    }
  });
  var compProds = Object.keys(compMap).sort(function(a,b){return compMap[b].total-compMap[a].total;});
  var pendProds = Object.keys(pendMap).filter(function(p){return !compMap[p];});
  if(!compProds.length && !pendProds.length){
    el.innerHTML='';
    return;
  }
  var html='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:.5rem;padding:.5rem 0;">';
  compProds.forEach(function(p){
    var c = compMap[p];
    var pend = pendMap[p];
    html+='<div style="background:linear-gradient(135deg,#f0f9ff,#dbeafe);border:1.5px solid var(--sky);border-radius:10px;padding:.6rem .9rem;">'+
      '<div style="font-size:9px;font-weight:700;color:var(--brand);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">📦 Comprado</div>'+
      '<div style="font-size:24px;font-weight:800;font-family:Bebas Neue,sans-serif;color:var(--brand);line-height:1;">'+c.cant+' <span style="font-size:11px;font-weight:400;color:var(--tl);">uds</span></div>'+
      '<div style="font-size:11px;font-weight:700;color:#1e293b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+esc(p)+'">'+esc(p)+'</div>'+
      '<div style="font-size:10px;color:var(--tl);margin-top:1px;"><strong>S/ '+c.total.toFixed(2)+'</strong></div>'+
      (pend?'<div style="font-size:10px;color:#d97706;margin-top:3px;font-weight:600;">⚠ '+pend.cant+' uds · S/ '+pend.total.toFixed(2)+'</div>':'')+
    '</div>';
  });
  pendProds.forEach(function(p){
    var pend = pendMap[p];
    html+='<div style="background:linear-gradient(135deg,#fff5e6,#ffe8c8);border:1.5px solid #f59e0b;border-radius:10px;padding:.6rem .9rem;">'+
      '<div style="font-size:9px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;">⚠ Pendiente cobro</div>'+
      '<div style="font-size:24px;font-weight:800;font-family:Bebas Neue,sans-serif;color:#d97706;line-height:1;">'+pend.cant+' <span style="font-size:11px;font-weight:400;color:var(--tl);">uds</span></div>'+
      '<div style="font-size:11px;font-weight:700;color:#1e293b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+esc(p)+'">'+esc(p)+'</div>'+
      '<div style="font-size:10px;color:var(--tl);margin-top:1px;">Deuda: <strong>S/ '+pend.total.toFixed(2)+'</strong></div>'+
    '</div>';
  });
  html+='</div>';
  el.innerHTML=html;
}

function cliEntFiltrarMes(){
  var modal=gel('modal-cli-ent');if(!modal)return;
  var tipo=modal.dataset.tipo,nombre=modal.dataset.nombre,mes=gel('cli-ent-mes')?gel('cli-ent-mes').value:'';
  var ventas=_ventas.filter(function(v){return tipo==='vets'?v.veterinaria===nombre:v.doctora===nombre;});
  var filtradas=mes?ventas.filter(function(v){return v.fecha&&v.fecha.indexOf(mes)===0;}):ventas;
  cliRenderProdCards(filtradas);
  cliEntRender(ventas,mes);
}

function cliEntRender(ventas,mes){
  var filtered=mes?ventas.filter(function(v){return v.fecha&&v.fecha.indexOf(mes)===0;}):ventas;
  filtered=filtered.slice().sort(function(a,b){var da=(a.fecha||'')+(a.hora||'');var db=(b.fecha||'')+(b.hora||'');return db>da?1:db<da?-1:0;});
  var total=0,cobrado=0,pendiente=0,transacc=0,ultimaFecha=null;
  filtered.forEach(function(v){
    if(!esDevolucion(v.movimiento)&&v.estado!=='Anulado'){total+=(v.total||0);transacc++;}
    if(v.estado==='\u2705 Pagado')cobrado+=(v.total||0);
    if(v.estado==='\u23f3 Pendiente'||v.estado==='\u274c Vencido')pendiente+=(v.total||0);
    // "\u00daltima compra" es la venta real m\u00e1s reciente (no una simple visita
    // sin producto), que es lo que responde "\u00bfcu\u00e1ndo nos compr\u00f3 por \u00faltima vez?".
    if(v.movimiento!=='Visita'&&!esDevolucion(v.movimiento)&&v.estado!=='Anulado'&&v.fecha&&(!ultimaFecha||v.fecha>ultimaFecha))ultimaFecha=v.fecha;
  });
  var ticketProm=transacc>0?total/transacc:0;
  var ultimaTxt=ultimaFecha?(function(){var d=diasDesde(ultimaFecha);return d<=0?'Hoy':d===1?'Ayer':'Hace '+d+' d\u00edas';})():'Sin compras';
  var elStats=gel('cli-ent-stats');
  if(elStats){
    elStats.innerHTML=
      '<div class="sc"><div class="sl">Total comprado</div><div class="sv sv-b">S/ '+total.toFixed(2)+'</div></div>'+
      '<div class="sc"><div class="sl">Transacciones</div><div class="sv sv-b">'+transacc+'</div></div>'+
      '<div class="sc"><div class="sl">Ticket promedio</div><div class="sv sv-s">S/ '+ticketProm.toFixed(2)+'</div></div>'+
      '<div class="sc"><div class="sl">\u00daltima compra</div><div class="sv" style="font-size:16px;color:var(--brand);">'+esc(ultimaTxt)+'</div></div>'+
      '<div class="sc"><div class="sl">Pendiente cobro</div><div class="sv" style="color:'+(pendiente>0?'var(--er)':'var(--ok)')+'">S/ '+pendiente.toFixed(2)+'</div></div>';
  }
  // Clientes con a\u00f1os de antig\u00fcedad pueden acumular miles de transacciones
  // (m\u00e1s a\u00fan en admin, que ve TODOS los vendedores). Pintar la tabla entera
  // de una sola vez \u2014y que el observador de accesibilidad la vuelva a
  // recorrer completa\u2014 se sent\u00eda como una demora al abrir la ficha. Se pinta
  // un tope inicial con un bot\u00f3n para traer el resto solo si hace falta.
  var haySobrante=!_cliEntHistVerTodo && filtered.length>CLI_ENT_HIST_LIMITE;
  var visibles=haySobrante?filtered.slice(0,CLI_ENT_HIST_LIMITE):filtered;
  // Franja de color a la izquierda de cada fila según su estado — permite
  // escanear pendientes/vencidos de un vistazo sin leer cada badge.
  var _colorEst={'✅ Pagado':'var(--ok)','⏳ Pendiente':'var(--warn)','❌ Vencido':'var(--er)','Anulado':'var(--neutral)'};
  var rows='';
  visibles.forEach(function(v){
    var canAnul=v.estado!=='Anulado';
    var barra=_colorEst[v.estado]||'transparent';
    rows+='<tr style="box-shadow:inset 3px 0 0 '+barra+';"><td style="white-space:nowrap;">'+fmt(v.fecha)+(v.hora?' <span class="tm2">'+esc(v.hora)+'</span>':'')+'</td>'+
      '<td>'+bMov(v.movimiento)+'</td><td>'+esc(v.producto||'---')+(v.es_regalo?' <span class="b b-visita" title="Unidades de regalo, sin costo"><svg class="ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24" style="width:11px;height:11px;vertical-align:-1px;"><use href="#i-regalo"/></svg> Regalo</span>':'')+'</td><td>'+(v.cantidad||0)+'</td>'+
      '<td><strong>S/ '+Number(v.total||0).toFixed(2)+'</strong></td><td>'+bEst(v.estado)+'</td>'+
      '<td style="white-space:nowrap;"><button class="btn btn-sm" style="background:var(--sky4);color:var(--brand);border:1px solid var(--sky);" onclick="verDetalle(\''+esc(v.id)+'\')">Ver detalle</button>'+
      (canAnul?' <button class="btn btn-d btn-sm" onclick="event.stopPropagation();anularVenta(\''+esc(v.id)+'\')">Anular</button>':'')+
      '</td></tr>';
  });
  var pie=haySobrante?
    '<div style="text-align:center;padding:.7rem;"><button type="button" class="btn btn-s btn-sm" onclick="_cliEntHistVerTodo=true;cliEntRender(_cliEntHistUltimasVentas,_cliEntHistUltimoMes);">Ver las '+filtered.length+' transacciones</button></div>':'';
  var elH=gel('cli-ent-hist');
  if(elH)elH.innerHTML=rows?'<div class="tw"><table><thead><tr><th>Fecha</th><th>Movimiento</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Acci\u00f3n</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+pie:'<div class="es" style="padding:1rem"><strong>Sin movimientos con este cliente.</strong></div>';
  _cliEntHistUltimasVentas=ventas;
  _cliEntHistUltimoMes=mes;
}
var CLI_ENT_HIST_LIMITE=60;
var _cliEntHistVerTodo=false;
var _cliEntHistUltimasVentas=[];
var _cliEntHistUltimoMes='';

// ── ETIQUETAS ──
// "Nuevo" no es una fila en cliente_etiquetas: se calcula al vuelo desde
// clientes_vet.created_at, así que no hace falta ningún cron para que
// "se quite sola" al mes — simplemente deja de cumplir la condición.
var DIAS_CLIENTE_NUEVO=15;
function _esClienteNuevo(createdAt){
  if(!createdAt)return false;
  var d=new Date(createdAt);
  if(isNaN(d.getTime()))return false;
  var dias=(Date.now()-d.getTime())/86400000;
  return dias>=0 && dias<DIAS_CLIENTE_NUEVO;
}
// Texto legible (blanco o casi-negro) sobre un color hex arbitrario elegido
// a mano con el color picker — sin esto un amarillo con texto blanco sería
// ilegible.
function _colorTextoLegible(hex){
  hex=(hex||'').replace('#','');
  if(hex.length===3)hex=hex.split('').map(function(c){return c+c;}).join('');
  if(hex.length!==6)return '#fff';
  var r=parseInt(hex.substr(0,2),16),g=parseInt(hex.substr(2,2),16),b=parseInt(hex.substr(4,2),16);
  var luz=(0.299*r+0.587*g+0.114*b)/255;
  return luz>0.6?'#1a2535':'#fff';
}
function _etiquetasDeCliente(clienteId){
  if(!clienteId)return [];
  var ids={};
  _clienteEtiquetas.forEach(function(ce){if(ce.cliente_id===clienteId)ids[ce.etiqueta_id]=1;});
  return (_etiquetas||[]).filter(function(e){return ids[e.id];});
}
function _chipEtiqueta(et,activa,onclickAttr){
  var estilo=activa
    ?'background:'+et.color+';color:'+_colorTextoLegible(et.color)+';border:1.5px solid '+et.color+';'
    :'background:transparent;color:var(--tl);border:1.5px dashed var(--bd2);';
  return '<span class="cli-chip" style="'+estilo+'font-weight:700;'+(onclickAttr?'cursor:pointer;':'')+'"'+(onclickAttr?' onclick="'+onclickAttr+'"':'')+'>'+esc(et.nombre)+'</span>';
}
// Perfil (solo lectura): badge "Nuevo" + etiquetas asignadas.
function cliRenderTagsPerfil(){
  var el=gel('cli-ent-tags');if(!el)return;
  var modal=gel('modal-cli-ent');
  var tipo=modal&&modal.dataset.tipo, nombre=modal&&modal.dataset.nombre;
  var html='';
  if(tipo==='vets'){
    var info=_cliVetInfo(nombre);
    if(info&&_esClienteNuevo(info.created_at))html+='<span class="b b-contado">Nuevo</span>';
    if(info)_etiquetasDeCliente(info.id).forEach(function(et){html+=_chipEtiqueta(et,true,null);});
  }
  el.innerHTML=html;
}
// Edición: catálogo completo como chips togglables (rellena = asignada).
function cliRenderTagsEdit(){
  var wrap=gel('cli-edit-etiquetas-wrap');
  var tipo=val('cli-edit-tipo');
  if(wrap)wrap.style.display=tipo==='vets'?'block':'none';
  if(tipo!=='vets')return;
  var el=gel('cli-edit-etiquetas-chips');if(!el)return;
  var nombre=val('cli-edit-nombre-orig');
  var info=_cliVetInfo(nombre);
  var asignadas={};
  if(info)_etiquetasDeCliente(info.id).forEach(function(et){asignadas[et.id]=1;});
  el.innerHTML=(_etiquetas||[]).map(function(et){
    return _chipEtiqueta(et,!!asignadas[et.id],"cliToggleEtiqueta('"+et.id+"')");
  }).join('')||'<span style="font-size:12px;color:var(--tl);">Todavía no hay etiquetas creadas.</span>';
}
// La veterinaria puede no tener fila propia en clientes_vet todavía (solo
// tiene ventas históricas) — se crea igual que en el resto de flujos de
// sincronización (RUC, ubicación) antes de poder asignarle una etiqueta.
function _cliEntObtenerOCrearClienteId(nombre){
  var info=_cliVetInfo(nombre);
  if(info&&info.id)return Promise.resolve(info.id);
  return sbP('clientes_vet',{nombre_vet:nombre}).then(function(r){
    var fila=r&&r[0];
    if(fila)_clientesVet.push(fila);
    return fila&&fila.id;
  });
}
// Genérico: usado tanto por "Editar cliente" como por "Registrar Visita" —
// resuelve/crea la fila de clientes_vet por nombre y prende/apaga la
// etiqueta. Devuelve una promesa para que cada llamador re-pinte lo suyo.
function _clienteEtiquetaToggle(nombre,etiquetaId){
  return _cliEntObtenerOCrearClienteId(nombre).then(function(clienteId){
    if(!clienteId)return;
    var existente=null;
    for(var i=0;i<_clienteEtiquetas.length;i++){
      var ce=_clienteEtiquetas[i];
      if(ce.cliente_id===clienteId&&ce.etiqueta_id===etiquetaId){existente=ce;break;}
    }
    if(existente){
      return sbDel('cliente_etiquetas','id=eq.'+existente.id).then(function(){
        _clienteEtiquetas=_clienteEtiquetas.filter(function(ce){return ce.id!==existente.id;});
      });
    }
    return sbP('cliente_etiquetas',{cliente_id:clienteId,etiqueta_id:etiquetaId}).then(function(r){
      if(r&&r[0])_clienteEtiquetas.push(r[0]);
    });
  });
}
function cliToggleEtiqueta(etiquetaId){
  _clienteEtiquetaToggle(val('cli-edit-nombre-orig'),etiquetaId).then(function(){
    cliRenderTagsEdit();
    cliRenderTagsPerfil();
  }).catch(function(e){showToast(e.message||'No se pudo actualizar la etiqueta','er');});
}
function cliCrearEtiqueta(){
  var nombre=(gel('cli-edit-etiqueta-nombre').value||'').trim();
  var color=gel('cli-edit-etiqueta-color')?gel('cli-edit-etiqueta-color').value:'#253C61';
  if(!nombre){showToast('Escribe un nombre para la etiqueta','er');return;}
  sbP('etiquetas_cliente',{nombre:nombre,color:color||'#253C61'}).then(function(r){
    var fila=r&&r[0];
    if(fila)_etiquetas.push(fila);
    gel('cli-edit-etiqueta-nombre').value='';
    cliRenderTagsEdit();
    showToast('Etiqueta creada','ok');
  }).catch(function(e){showToast(e.message||'No se pudo crear la etiqueta (¿ya existe ese nombre?)','er');});
}

function cliEntAbrirEditar(){
  var modal=gel('modal-cli-ent');if(!modal)return;
  var tipo=modal.dataset.tipo,nombre=modal.dataset.nombre;
  var ventas=_ventas.filter(function(v){return tipo==='vets'?v.veterinaria===nombre:v.doctora===nombre;});
  ventas.sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');});
  var last=ventas[0]||{};
  var inp=gel('cli-edit-nombre');if(inp)inp.value=nombre;
  var selZ=gel('cli-edit-zona');
  if(selZ){
    selZ.innerHTML='<option value="">— Sin cambio —</option>';
    _zonas.forEach(function(z){var o=document.createElement('option');o.value=z.nombre;o.textContent=z.nombre;selZ.appendChild(o);});
    selZ.value=last.zona||'';
  }
  var inpC=gel('cli-edit-cel');if(inpC)inpC.value=last.num_medico||last.celular||'';
  // RUC: la fuente canónica es clientes_vet.ruc (registro persistente del
  // cliente), no la última venta — una transacción sin RUC no debe hacer
  // parecer que el cliente no tiene uno ya guardado. Para doctores no hay
  // fila propia en clientes_vet, así que ahí sí usamos la última venta.
  var inpR=gel('cli-edit-ruc');
  if(inpR){
    var infoVet=tipo==='vets'?_cliVetInfo(nombre):null;
    inpR.value=(infoVet&&infoVet.ruc)||last.ruc||'';
  }
  // Vendedor asignado: solo aplica a veterinarias (una fila de clientes_vet).
  cliAsignadoCargar(tipo==='vets'?nombre:null);
  gel('cli-edit-tipo').value=tipo;gel('cli-edit-nombre-orig').value=nombre;
  gel('cli-edit-titulo').textContent='Editar '+(tipo==='vets'?'veterinaria':'doctor')+': '+nombre;
  // Relaciones vinculadas: nombre + celular. El celular de cada doctor/a vinculado se
  // toma de su transacción más reciente (num_medico), igual criterio que "last" arriba.
  var relMap={};
  var ventasOrdAsc=ventas.slice().sort(function(a,b){return (a.fecha||'').localeCompare(b.fecha||'');});
  ventasOrdAsc.forEach(function(v){
    var r=tipo==='vets'?v.doctora:v.veterinaria;
    if(!r)return;
    if(!relMap[r])relMap[r]={nombre:r,celular:''};
    if(tipo==='vets' && (v.num_medico||v.celular)) relMap[r].celular=v.num_medico||v.celular;
  });
  _cliEditRels=Object.keys(relMap).map(function(k){return relMap[k];});
  _cliEditRelsRemoved=[];
  _contactoCargoMap={};
  cliRenderRels(tipo);
  if(tipo==='vets'){
    // Solo-lectura: no crea la fila de clientes_vet por abrir el editor.
    var infoParaCargo=_cliVetInfo(nombre);
    if(infoParaCargo&&infoParaCargo.id){
      sbG('contacto_cargo','cliente_id=eq.'+infoParaCargo.id+'&select=nombre,cargo').then(function(rows){
        (rows||[]).forEach(function(r){_contactoCargoMap[(r.nombre||'').trim().toLowerCase()]=r.cargo;});
        cliRenderRels(tipo);
      }).catch(function(){});
    }
  }
  cliRenderTagsEdit();

  // Ubicaci\u00f3n: s\u00f3lo aplica a veterinarias (clientes_vet guarda una fila por vet, no por doctor).
  // Mismo flujo que el panel del vendedor: sincroniza la fila can\u00f3nica de clientes_vet
  // para que se vea inmediatamente en "Mi Ruta" del vendedor.
  var ubicWrap=gel('cli-edit-ubicacion-wrap');
  if(ubicWrap){
    if(tipo==='vets'){ubicWrap.style.display='block';_cliEditCargarUbicacion(nombre);}
    else ubicWrap.style.display='none';
  }

  // Trasladar a otro vendedor: s\u00f3lo aplica a veterinarias y solo si _vendedores
  // tiene m\u00e1s de uno (no tiene sentido el control si hay un solo vendedor).
  var trWrap=gel('cli-edit-transferir-wrap');
  if(trWrap){
    if(tipo==='vets' && (_vendedores||[]).length>1){
      trWrap.style.display='block';
      _cliEditPoblarSelectsTransfer();
    } else trWrap.style.display='none';
  }

  abrirModal('modal-cli-edit');
}

function _cliEditPoblarSelectsTransfer(){
  var selVend=gel('cli-edit-transferir-vend');
  var selZona=gel('cli-edit-transferir-zona');
  var msg=gel('cli-edit-transferir-msg');
  if(msg){msg.textContent='';msg.style.color='var(--tl)';}
  if(!selVend||!selZona)return;
  selVend.innerHTML='<option value="">\u2014 Seleccionar vendedor destino \u2014</option>';
  (_vendedores||[]).filter(function(v){return v.activo!==false;}).forEach(function(v){
    var o=document.createElement('option');o.value=v.id;o.textContent=v.nombre;
    o.dataset.zonas=JSON.stringify(v.zonas_asignadas||[]);
    selVend.appendChild(o);
  });
  selZona.innerHTML='<option value="">\u2014 Zona destino (se llena al elegir vendedor) \u2014</option>';
  selVend.onchange=function(){
    var opt=selVend.options[selVend.selectedIndex];
    var zonas=[];
    try{zonas=JSON.parse(opt&&opt.dataset.zonas||'[]');}catch(e){zonas=[];}
    selZona.innerHTML='<option value="">\u2014 Zona destino \u2014</option>';
    if(!zonas.length){
      selZona.innerHTML='<option value="">Este vendedor no tiene zonas asignadas</option>';
      return;
    }
    zonas.forEach(function(z){var o=document.createElement('option');o.value=z;o.textContent=z;selZona.appendChild(o);});
  };
}

function cliEditTransferir(){
  var nombre=val('cli-edit-nombre-orig');
  var vendId=val('cli-edit-transferir-vend');
  var zonaDestino=val('cli-edit-transferir-zona');
  var msg=gel('cli-edit-transferir-msg');
  if(!nombre)return;
  if(!vendId){if(msg){msg.style.color='var(--er)';msg.textContent='Selecciona el vendedor destino.';}return;}
  if(!zonaDestino){if(msg){msg.style.color='var(--er)';msg.textContent='Selecciona una zona del vendedor destino.';}return;}
  var vendNombre='';
  for(var i=0;i<(_vendedores||[]).length;i++){if(_vendedores[i].id===vendId){vendNombre=_vendedores[i].nombre;break;}}
  // Una lista de vi\u00f1etas dentro de un confirm() nativo se ve como un bloque
  // de texto plano y sin formato. Aqu\u00ed s\u00ed se puede maquetar.
  SVUI.confirmar({
    titulo:'\u00bfTrasladar esta veterinaria?',
    mensajeHTML:
      '<strong>'+nombre+'</strong> pasar\u00e1 a <strong>'+vendNombre+'</strong>, zona '+zonaDestino+'.'+
      '<br><br>El cambio solo afecta de aqu\u00ed en adelante:'+
      '<ul style="margin:.5rem 0 0 1.1rem;padding:0;">'+
        '<li>'+vendNombre+' ver\u00e1 la veterinaria en su Mi Ruta.</li>'+
        '<li>El historial de ventas no se toca.</li>'+
        '<li>Los cr\u00e9ditos pendientes siguen con el vendedor que los cobra.</li>'+
      '</ul>',
    confirmar:'Trasladar',
    cancelar:'Cancelar'
  }).then(function(ok){
    if(ok)_cliEditTransferirConfirmado(nombre,vendId,zonaDestino,vendNombre,msg);
  });
}

function _cliEditTransferirConfirmado(nombre,vendId,zonaDestino,vendNombre,msg){
  if(msg){msg.style.color='var(--tl)';msg.textContent='Trasladando\u2026';}
  // Cambia clientes_vet.zona \u2014 esa es la "asignaci\u00f3n" que el panel del vendedor
  // lee para mostrarlo en Mi Ruta. Sin tocar la tabla ventas.
  sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombre)+'&select=id')
    .then(function(filas){
      if(filas&&filas.length)return sbU('clientes_vet',filas[0].id,{zona:zonaDestino});
      // Si no existe la fila, la creamos en la zona destino para que aparezca a\u00fan sin ubicaci\u00f3n
      return sbP('clientes_vet',{nombre_vet:nombre,zona:zonaDestino});
    })
    .then(function(){return reloadClientesVet();})
    .then(function(){
      if(msg){msg.style.color='var(--ok)';msg.textContent='\u2705 '+nombre+' trasladada a '+vendNombre+' ('+zonaDestino+').';}
    })
    .catch(function(e){if(msg){msg.style.color='var(--er)';msg.textContent=SVUI.error(e);}});
}

var _cliEditRels=[]; // [{nombre, celular}, ...]
var _cliEditRelsRemoved=[]; // los nombres que el usuario quit\u00f3 (para PATCH a null en ventas)
var _contactoCargoMap={}; // nombre en min\u00fasculas -> cargo (solo tipo vets)
var CARGOS_CONTACTO=['Veterinario','Administrador','Due\u00f1o','Recepci\u00f3n','Otro'];
// Cada contacto es su propia tarjeta en vez de un chip con dos inputs
// apretados adentro \u2014 as\u00ed hay espacio para el cargo sin amontonar todo
// en una sola fila de 28px.
function cliRenderRels(tipo){
  var box=gel('cli-edit-rels-list');if(!box)return;
  if(!_cliEditRels.length){box.innerHTML='<div style="font-size:11.5px;color:var(--tl);font-style:italic;padding:.4rem 0;">'+(tipo==='vets'?'Sin doctores vinculados.':'Sin veterinarias vinculadas.')+'</div>';return;}
  box.innerHTML=_cliEditRels.map(function(r,idx){
    var nEsc=(r.nombre||'').replace(/"/g,'&quot;');
    var cEsc=(r.celular||'').replace(/"/g,'&quot;');
    var cargoActual=_contactoCargoMap[(r.nombre||'').trim().toLowerCase()]||'';
    var opciones='<option value="">Sin cargo especificado</option>'+CARGOS_CONTACTO.map(function(c){
      return '<option value="'+c+'"'+(c===cargoActual?' selected':'')+'>'+c+'</option>';
    }).join('');
    return '<div style="background:var(--wh);border:1.5px solid var(--bd);border-radius:var(--r);padding:.55rem .65rem;margin-bottom:6px;">'+
      '<div style="display:flex;align-items:center;gap:8px;">'+
        '<div style="width:26px;height:26px;border-radius:50%;background:var(--sky4);border:1.5px solid var(--sky);display:flex;align-items:center;justify-content:center;font-family:\'Bebas Neue\',sans-serif;font-size:12px;color:var(--brand);flex-shrink:0;">'+esc((r.nombre||'?').charAt(0).toUpperCase())+'</div>'+
        '<input type="text" value="'+nEsc+'" data-orig="'+nEsc+'" oninput="_cliRelChange('+idx+',\'nombre\',this.value)" style="flex:1;min-width:0;border:none;background:transparent;font-size:13.5px;font-weight:700;color:var(--td);padding:2px 0;"/>'+
        '<button onclick="_cliRelRemove('+idx+',\''+tipo+'\')" style="background:none;border:none;color:var(--er);cursor:pointer;font-size:17px;line-height:1;padding:0 4px;flex-shrink:0;" title="Quitar de esta lista">&times;</button>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding-left:34px;flex-wrap:wrap;">'+
        '<input type="tel" value="'+cEsc+'" placeholder="Celular" oninput="_cliRelChange('+idx+',\'celular\',this.value)" style="width:130px;font-size:12.5px;padding:.3rem .5rem;"/>'+
        (tipo==='vets'?'<select onchange="_cliRelCargoChange('+idx+',this.value)" style="font-size:12px;padding:.3rem .5rem;width:auto;min-width:150px;">'+opciones+'</select>':'')+
      '</div>'+
    '</div>';
  }).join('');
}
function _cliRelChange(idx,campo,value){if(_cliEditRels[idx])_cliEditRels[idx][campo]=value;}
function _cliRelRemove(idx,tipo){
  var removed=_cliEditRels[idx];
  if(removed && removed.nombre && _cliEditRelsRemoved.indexOf(removed.nombre)<0) _cliEditRelsRemoved.push(removed.nombre);
  _cliEditRels.splice(idx,1);
  cliRenderRels(tipo);
}
// El cargo se guarda al instante \u2014 vive en su propia tabla ligada al
// cliente_id, no en los campos que junta "Guardar cambios".
function _cliRelCargoChange(idx,cargo){
  var tipo=val('cli-edit-tipo');
  if(tipo!=='vets')return;
  var nombreVet=val('cli-edit-nombre-orig');
  var nombreContacto=_cliEditRels[idx]&&_cliEditRels[idx].nombre;
  if(!nombreVet||!nombreContacto)return;
  _cliEntObtenerOCrearClienteId(nombreVet).then(function(clienteId){
    if(!clienteId)return;
    return sbG('contacto_cargo','cliente_id=eq.'+clienteId+'&nombre=ilike.'+encodeURIComponent(nombreContacto)+'&select=id')
    .then(function(ex){
      var existente=ex&&ex[0];
      if(existente)return sbU('contacto_cargo',existente.id,{cargo:cargo||null,updated_at:new Date().toISOString()});
      return sbP('contacto_cargo',{cliente_id:clienteId,nombre:nombreContacto,cargo:cargo||null});
    });
  }).then(function(){
    _contactoCargoMap[nombreContacto.trim().toLowerCase()]=cargo||'';
  }).catch(function(e){showToast(e.message||'No se pudo guardar el cargo','er');});
}
function cliAddRel(){
  var inp=gel('cli-edit-rel-new');if(!inp)return;
  var inpCel=gel('cli-edit-rel-new-cel');
  var v=(inp.value||'').trim();if(!v)return;
  if(_cliEditRels.some(function(r){return r.nombre===v;})){setSt('Ya est\u00e1 en la lista','er');setTimeout(function(){setSt('');},1500);return;}
  _cliEditRels.push({nombre:v,celular:inpCel?(inpCel.value||'').trim():''});
  inp.value='';if(inpCel)inpCel.value='';
  cliRenderRels(gel('cli-edit-tipo').value);
}

// \u2500\u2500 UBICACI\u00d3N de la veterinaria (geocodifica y guarda en clientes_vet) \u2500\u2500
// Parser de URL de Google Maps \u2014 acepta varios formatos para extraer lat/lng exacto.
// Los enlaces cortos (goo.gl/maps, maps.app.goo.gl) no se pueden expandir desde el browser por CORS.
function _cliEditParseMapsUrl(url){
  if(!url)return null;
  var s=String(url).trim();
  if(!s)return null;
  if(/^https?:\/\/(goo\.gl\/maps|maps\.app\.goo\.gl)\//i.test(s)){
    var err=new Error('Enlace corto detectado. Abre el enlace en Google Maps, copia la URL larga (la que tiene "@lat,lng") y p\u00e9gala aqu\u00ed.');
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
function _cliEditGeocodificar(texto){
  var q=encodeURIComponent(texto+', Lima, Per\u00fa');
  return fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+q,{headers:{'Accept-Language':'es'}})
    .then(function(r){return r.json();})
    .then(function(arr){
      if(!arr||!arr.length)return null;
      return {latitud:parseFloat(arr[0].lat),longitud:parseFloat(arr[0].lon),direccion:arr[0].display_name};
    });
}
function _cliEditCargarUbicacion(nombreVet){
  var status=gel('cli-edit-ubic-status'),calle=gel('cli-edit-ubic-calle'),distrito=gel('cli-edit-ubic-distrito'),maps=gel('cli-edit-ubic-maps'),msg=gel('cli-edit-ubic-msg'),btnQuitar=gel('btn-cli-edit-ubic-quitar');
  if(status)status.textContent='Cargando ubicaci\u00f3n\u2026';
  if(calle)calle.value='';
  if(distrito)distrito.value='';
  if(maps)maps.value='';
  if(msg)msg.textContent='';
  if(btnQuitar)btnQuitar.style.display='none';
  // ilike (case-insensitive): la fila en clientes_vet puede haberse creado con
  // un casing distinto al de ventas (ej. "HEALTHY PETS" vs "Healthy Pets") →
  // antes el modal no encontraba la ubicación que sí existía.
  sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombreVet)+'&select=direccion,distrito,latitud,longitud')
  .then(function(r){
    var fila=r&&r[0];
    if(fila&&fila.latitud&&fila.longitud){
      if(status)status.innerHTML='\u2705 Ya tiene ubicaci\u00f3n: <strong>'+(fila.direccion||'')+(fila.distrito?', '+fila.distrito:'')+'</strong>. Puedes actualizarla abajo o quitarla.';
      if(btnQuitar)btnQuitar.style.display='inline-block';
      if(distrito)distrito.value=fila.distrito||'';
      if(calle){
        var dirTxt=(fila.direccion||'').trim(),distTxt=(fila.distrito||'').trim();
        if(distTxt){
          var suf=', '+distTxt;
          calle.value=(dirTxt.toLowerCase().slice(-suf.length)===suf.toLowerCase())
            ? dirTxt.slice(0,dirTxt.length-suf.length).trim()
            : dirTxt;
        } else calle.value=dirTxt;
      }
    } else if(status){
      status.textContent='A\u00fan no tiene ubicaci\u00f3n registrada. Agrega su direcci\u00f3n o pega la URL de Google Maps para que aparezca en las rutas.';
    }
  })
  .catch(function(){if(status)status.textContent='A\u00fan no tiene ubicaci\u00f3n registrada. Agrega su direcci\u00f3n o pega la URL de Google Maps para que aparezca en las rutas.';});
}
function cliEditGuardarUbicacion(){
  var nombre=val('cli-edit-nombre-orig');
  if(!nombre)return;
  var calle=(val('cli-edit-ubic-calle')||'').trim();
  var distrito=(val('cli-edit-ubic-distrito')||'').trim();
  var mapsUrl=(val('cli-edit-ubic-maps')||'').trim();
  var zonaFallback=val('cli-edit-zona')||'';
  var msg=gel('cli-edit-ubic-msg');
  if(!mapsUrl && (!calle||!distrito)){if(msg){msg.style.color='var(--er)';msg.textContent='Pega una URL de Google Maps o completa calle/n\u00famero y distrito.';}return;}

  // Resolver coords: URL de Maps tiene prioridad (exactas); si no, geocoding por texto.
  var coordsPromise;
  if(mapsUrl){
    try{
      var fromUrl=_cliEditParseMapsUrl(mapsUrl);
      if(fromUrl){coordsPromise=Promise.resolve(fromUrl);}
      else if(!calle||!distrito){
        if(msg){msg.style.color='var(--er)';msg.textContent='La URL no contiene coordenadas reconocibles. Pega el enlace largo de Google Maps o completa calle y distrito.';}
        return;
      } else {
        if(msg){msg.style.color='var(--tl)';msg.textContent='Buscando direcci\u00f3n\u2026';}
        coordsPromise=_cliEditGeocodificar([calle,distrito].join(', '));
      }
    } catch(e){
      if(msg){msg.style.color='var(--er)';msg.textContent=e.message;}
      return;
    }
  } else {
    if(msg){msg.style.color='var(--tl)';msg.textContent='Buscando direcci\u00f3n\u2026';}
    coordsPromise=_cliEditGeocodificar([calle,distrito].join(', '));
  }

  coordsPromise.then(function(res){
    if(!res)throw new Error('No encontramos esa direcci\u00f3n. Pega la URL de Google Maps de la veterinaria para una ubicaci\u00f3n exacta.');
    var dirFinal=[calle,distrito].filter(Boolean).join(', ')||res.direccion||(res.latitud+', '+res.longitud);
    var datos={direccion:dirFinal,distrito:distrito||null,latitud:res.latitud,longitud:res.longitud};
    return sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombre)+'&select=id')
      .then(function(filas){
        if(filas&&filas.length)return sbU('clientes_vet',filas[0].id,datos);
        datos.nombre_vet=nombre;
        if(zonaFallback)datos.zona=zonaFallback;
        return sbP('clientes_vet',datos);
      });
  })
  .then(function(){
    if(msg){msg.style.color='var(--ok)';msg.textContent='Ubicaci\u00f3n guardada \u2705';}
    _cliEditCargarUbicacion(nombre);
  })
  .catch(function(e){if(msg){msg.style.color='var(--er)';msg.textContent=SVUI.error(e);}});
}
function cliEditQuitarUbicacion(){
  var nombre=val('cli-edit-nombre-orig');
  if(!nombre)return;

  // Mismo texto que en el panel de vendedores: es la misma acci\u00f3n.
  SVUI.confirmar({
    titulo:'\u00bfQuitar la ubicaci\u00f3n de esta veterinaria?',
    mensaje:'"'+nombre+'" pasar\u00e1 a "Sin ubicaci\u00f3n" y dejar\u00e1 de aparecer en las rutas '+
            'hasta que se registre una nueva.\n\n'+
            'Las visitas y ventas ya registradas no se tocan.',
    confirmar:'Quitar ubicaci\u00f3n',
    cancelar:'Conservarla',
    peligro:true
  }).then(function(ok){
    if(!ok)return;
    var msg=gel('cli-edit-ubic-msg');
    if(msg){msg.style.color='var(--tl)';msg.textContent='Quitando ubicaci\u00f3n\u2026';}
    sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombre)+'&select=id')
      .then(function(filas){
        if(!filas||!filas.length)return null;
        return sbU('clientes_vet',filas[0].id,{direccion:null,distrito:null,latitud:null,longitud:null});
      })
      .then(function(){
        if(msg){msg.style.color='var(--ok)';msg.textContent='Ubicaci\u00f3n quitada.';}
        _cliEditCargarUbicacion(nombre);
      })
      .catch(function(){
        if(msg){msg.style.color='var(--er)';msg.textContent='No se pudo quitar la ubicaci\u00f3n. Revisa la conexi\u00f3n e int\u00e9ntalo otra vez.';}
      });
  });
}

// ── VENDEDOR ASIGNADO (transferencia de veterinarias) ──
// Una veterinaria normalmente le toca al vendedor cuya zona coincide. Cuando la
// empresa se la da a alguien en exclusiva, esto la transfiere sin importar la
// zona — y deja de verse para los demás. Nace del caso de Animal 24 Horas:
// una sede en San Miguel asignada a un vendedor de Surco, que antes se resolvía
// duplicando la fila con otra zona.
var _cliAsignadoVetActual=null;

function cliAsignadoCargar(nombreVet){
  var sel=gel('cli-edit-asignado');
  var wrap=sel?sel.closest('.fgr'):null;
  if(!sel)return;
  _cliAsignadoVetActual=nombreVet;
  // Solo tiene sentido para veterinarias: un doctor no es una fila de clientes_vet.
  if(wrap)wrap.style.display=nombreVet?'':'none';
  if(!nombreVet)return;

  sel.innerHTML='<option value="">Se reparte por zona (normal)</option>';
  _vendedores.filter(function(v){return v.activo!==false;}).forEach(function(v){
    var o=document.createElement('option');o.value=v.id;o.textContent=v.nombre;sel.appendChild(o);
  });
  sel.value='';
  sbG('clientes_vet','nombre_vet=eq.'+encodeURIComponent(nombreVet)+'&select=id,vendedor_asignado_id')
    .then(function(r){
      var row=(r&&r[0])||null;
      sel.dataset.clienteId=row?row.id:'';
      sel.value=(row&&row.vendedor_asignado_id)||'';
      cliAsignadoPreview();
    })
    .catch(function(){
      sel.dataset.clienteId='';
      gel('cli-edit-asignado-ayuda').textContent='No se pudo leer la asignación actual de esta veterinaria.';
    });
}

function cliAsignadoPreview(){
  var sel=gel('cli-edit-asignado'), ayuda=gel('cli-edit-asignado-ayuda');
  if(!sel||!ayuda)return;
  if(!sel.value){
    ayuda.textContent='Se reparte por zona: la verá quien tenga esa zona asignada.';
    return;
  }
  var nombre=sel.options[sel.selectedIndex].textContent;
  ayuda.textContent='Solo la verá '+nombre+', aunque la zona no sea suya. Los demás dejarán de verla.';
}

function cliAsignadoGuardar(){
  var sel=gel('cli-edit-asignado');
  if(!sel||!_cliAsignadoVetActual)return Promise.resolve();
  var id=sel.dataset.clienteId;
  if(!id)return Promise.resolve(); // la vet aún no existe en clientes_vet
  return sbU('clientes_vet',id,{vendedor_asignado_id:sel.value||null});
}

function cliGuardar(){
  var tipo=val('cli-edit-tipo'), orig=val('cli-edit-nombre-orig');
  var nuevoNombre=(gel('cli-edit-nombre').value||'').trim();
  // Las veterinarias se guardan siempre en MAYÚSCULAS (convención del panel);
  // los doctores se dejan como los escribió el vendedor (Nombre Apellido).
  if(tipo==='vets')nuevoNombre=nuevoNombre.toUpperCase();
  var zona=val('cli-edit-zona'), cel=val('cli-edit-cel'), ruc=val('cli-edit-ruc');
  if(!nuevoNombre){showToast('El nombre es obligatorio','er');return;}
  // Se guarda aparte porque vive en clientes_vet, no en ventas.
  cliAsignadoGuardar().catch(function(e){
    showToast(SVUI.error(e,'guardar el vendedor asignado'),'er');
  });
  var campo=tipo==='vets'?'veterinaria':'doctora';
  var campoRel=tipo==='vets'?'doctora':'veterinaria';

  // 1) Patch base sobre ventas (todas las transacciones del cliente)
  var updates={};
  if(nuevoNombre!==orig)updates[campo]=nuevoNombre;
  if(zona)updates.zona=zona;
  if(cel)updates.num_medico=cel;
  if(ruc)updates.ruc=ruc;

  // 2) Detectar renombres y cambios de celular de la lista de relaciones
  //    (solo aplica el celular por-doctor cuando tipo==='vets', ya que campoRel
  //    en ese caso es 'doctora' y num_medico se guarda en la fila de ventas del doctor).
  var renombres={};
  var celularesRel={};
  var inputs=document.querySelectorAll('#cli-edit-rels-list input[data-orig]');
  inputs.forEach(function(inp){
    var o=inp.getAttribute('data-orig');
    var a=(inp.value||'').trim();
    if(o&&a&&o!==a)renombres[o]=a;
  });
  if(tipo==='vets'){
    _cliEditRels.forEach(function(r){
      if(r.nombre && (r.celular||'').trim()) celularesRel[r.nombre]=r.celular.trim();
    });
  }
  var hayUpdates=Object.keys(updates).length>0;
  var hayRenombres=Object.keys(renombres).length>0;
  var hayRemovidos=_cliEditRelsRemoved.length>0;
  var hayCelularesRel=Object.keys(celularesRel).length>0;

  if(!hayUpdates&&!hayRenombres&&!hayRemovidos&&!hayCelularesRel){
    showToast('No hay cambios para guardar','er');
    return;
  }

  var btn=gel('btn-cli-guardar');if(btn)btn.disabled=true;
  var promesas=[];
  var hdrMin=Object.assign({},getHeaders(),{'Prefer':'return=minimal'});

  // (a) Patch base sobre ventas
  if(hayUpdates){
    var filtroBase=encodeURIComponent(campo)+'=eq.'+encodeURIComponent(orig);
    promesas.push(fetch(SB+'/rest/v1/ventas?'+filtroBase,{
      method:'PATCH',headers:hdrMin,body:JSON.stringify(updates)
    }).then(function(r){if(!r.ok)return r.text().then(function(tx){throw new Error('ventas: '+tx);});}));
  }

  // (b) Renombrar relaciones individuales
  Object.keys(renombres).forEach(function(o){
    var n=renombres[o];
    var f=encodeURIComponent(campo)+'=eq.'+encodeURIComponent(orig)+'&'+encodeURIComponent(campoRel)+'=eq.'+encodeURIComponent(o);
    var body={};body[campoRel]=n;
    promesas.push(fetch(SB+'/rest/v1/ventas?'+f,{
      method:'PATCH',headers:hdrMin,body:JSON.stringify(body)
    }).then(function(r){if(!r.ok)return r.text().then(function(tx){throw new Error('rename: '+tx);});}));
  });

  // (c) Quitar relaciones (set rel a null en ventas)
  _cliEditRelsRemoved.forEach(function(rem){
    var f=encodeURIComponent(campo)+'=eq.'+encodeURIComponent(orig)+'&'+encodeURIComponent(campoRel)+'=eq.'+encodeURIComponent(rem);
    var body={};body[campoRel]=null;
    promesas.push(fetch(SB+'/rest/v1/ventas?'+f,{
      method:'PATCH',headers:hdrMin,body:JSON.stringify(body)
    }).then(function(r){if(!r.ok)return r.text().then(function(tx){throw new Error('remove: '+tx);});}));
  });

  // (c2) Actualizar celular (num_medico) de cada doctor/a vinculado individualmente
  //      (solo aplica a la pesta\u00f1a Veterinarias: campoRel='doctora' en ese caso).
  if(tipo==='vets'){
    Object.keys(celularesRel).forEach(function(docNombre){
      var nuevoCel=celularesRel[docNombre];
      var f=encodeURIComponent(campo)+'=eq.'+encodeURIComponent(orig)+'&'+encodeURIComponent(campoRel)+'=eq.'+encodeURIComponent(renombres[docNombre]||docNombre);
      promesas.push(fetch(SB+'/rest/v1/ventas?'+f,{
        method:'PATCH',headers:hdrMin,body:JSON.stringify({num_medico:nuevoCel})
      }).then(function(r){if(!r.ok)return r.text().then(function(tx){throw new Error('celular doctor: '+tx);});}));
    });
  }

  // (d) Sincronizar clientes_vet (la tabla can\u00f3nica que usa Mi Ruta).
  //     Sin esto, el rename queda s\u00f3lo en ventas y la ruta del vendedor pierde el match por nombre.
  if(tipo==='vets'){
    var cliPatch={};
    if(nuevoNombre!==orig)cliPatch.nombre_vet=nuevoNombre;
    if(zona)cliPatch.zona=zona;
    if(ruc)cliPatch.ruc=ruc;
    if(Object.keys(cliPatch).length>0){
      promesas.push(
        sbG('clientes_vet','nombre_vet=eq.'+encodeURIComponent(orig)+'&select=id,doctora,zona,direccion,distrito,latitud,longitud,num_medico,tiempo_visita_minutos')
        .then(function(rows){
          if(!rows||!rows.length)return; // no existe fila a\u00fan
          if(cliPatch.nombre_vet){
            return sbG('clientes_vet','nombre_vet=eq.'+encodeURIComponent(nuevoNombre)+'&select=id,doctora,zona,direccion,distrito,latitud,longitud,num_medico,tiempo_visita_minutos')
            .then(function(colision){
              if(colision&&colision.length&&colision[0].id!==rows[0].id){
                // ya existe otra fila con el nombre nuevo \u2014 son el mismo cliente
                // registrado dos veces. Fusionamos: la fila con el nombre nuevo
                // sobrevive, la vieja se elimina.
                var extra={};if(cliPatch.zona)extra.zona=cliPatch.zona;
                return mergeClientesVet(rows[0],colision[0],extra);
              }
              return sbU('clientes_vet',rows[0].id,cliPatch);
            });
          }
          return sbU('clientes_vet',rows[0].id,cliPatch);
        })
        .catch(function(e){if(window.console)console.warn('No se pudo sincronizar clientes_vet:',e.message);})
      );
    }
    // Renombre de doctora vinculada \u2192 reflejarlo en clientes_vet.doctora si aplica
    Object.keys(renombres).forEach(function(o){
      var n=renombres[o];
      promesas.push(
        sbG('clientes_vet','nombre_vet=eq.'+encodeURIComponent(orig)+'&doctora=eq.'+encodeURIComponent(o)+'&select=id')
        .then(function(rows){
          if(!rows||!rows.length)return;
          return sbU('clientes_vet',rows[0].id,{doctora:n});
        }).catch(function(){})
      );
    });
  }

  Promise.all(promesas)
  .then(function(){return Promise.all([reloadVentas(), reloadClientesVet()]);})
  .then(function(){
    cerrarModal('modal-cli-edit');
    rClientesAdmin();
    showToast('\u2705 Cliente actualizado correctamente','ok');
  }).catch(function(e){showToast(SVUI.error(e),'er');})
  .finally(function(){if(btn)btn.disabled=false;});
}

// \u2500\u2500 AVISO ANTES DE PERDER LA VISITA \u2500\u2500
// Mismo caso que en el panel de vendedores: registrar una visita a nombre de
// alguien implica subir comprobantes y varios movimientos. Si se cierra la
// pesta\u00f1a o se recarga por accidente con movimientos ya agregados, se avisa
// antes de perderlos. _rvMovimientos vuelve a [] al guardar con \u00e9xito, as\u00ed
// que el aviso deja de dispararse en cuanto ya no hay nada pendiente.
window.addEventListener('beforeunload', function(e){
  if(!_rvMovimientos || !_rvMovimientos.length) return;
  e.preventDefault();
  e.returnValue = '';
});
