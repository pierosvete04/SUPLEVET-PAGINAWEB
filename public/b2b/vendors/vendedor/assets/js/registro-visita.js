var _mvMovimientos = [];
var _mvTipoActual = '';
var _mvCredSelId = null;

// Los seis .tipo-btn ya están en el DOM cuando este script se ejecuta (va
// al final del <body>), así que se inicializa aquí mismo, una sola vez.
// Volver a llamar a SVUI.radiogroup() en cada visita a la página
// duplicaría los listeners de teclado/clic — por eso NO va dentro de
// mvInicializar(), que sí se repite en cada goTo('registrar').
var _mvTipoGroup = (typeof SVUI!=='undefined' && SVUI.radiogroup)
  ? SVUI.radiogroup(document.getElementById('mv-tipo-grid'), {
      onSelect: function(el){ mvSelTipo(el.getAttribute('data-tipo'), el); }
    })
  : null;

// ── MÉTODOS DE PAGO ──
var _MV_MP_CONFIG = {
  'EFECTIVO': {
    color:'#16a34a',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#16a34a;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="color:#fff;font-size:15px;font-weight:900;">$</span></div>'
  },
  'YAPE PIERO': {
    color:'#5C1194',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#5C1194;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;flex-shrink:0;"><div style="background:#2DD4BF;color:#5C1194;font-size:5px;font-weight:900;padding:1px 3px;border-radius:2px;line-height:1.3;">s/</div><div style="color:#fff;font-size:7.5px;font-style:italic;font-family:Georgia,serif;line-height:1;">yape</div></div>'
  },
  'PLIN PIERO': {
    color:'#00B7C2',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:linear-gradient(135deg,#0EA5E9,#00C9B1);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="color:#fff;font-size:10px;font-weight:700;">plin</span></div>'
  },
  'CUENTA BCP PIERO': {
    color:'#003087',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#003087;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:8px;font-weight:900;letter-spacing:-.5px;"><span style="color:#E8441A;">&#8250;</span><span style="color:#fff;">BCP</span><span style="color:#E8441A;">&#8249;</span></span></div>'
  },
  'CUENTA SCOTIABANK PIERO': {
    color:'#CC0000',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#CC0000;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="width:20px;height:20px;border-radius:50%;border:1.5px solid rgba(255,255,255,.75);display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-size:12px;font-weight:900;">S</span></div></div>'
  },
  'CUENTA INTERBANK NUTROVA FOR PETS': {
    color:'#3AB54A',
    html:'<div style="width:32px;height:32px;border-radius:6px;background:#3AB54A;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="width:18px;height:18px;border-radius:3px;background:#5B2D8E;display:flex;align-items:center;justify-content:center;"><div style="width:11px;height:11px;border-radius:2px;background:#3AB54A;"></div></div></div>'
  }
};

function mvActualizarMP(){
  var logoEl=gel('mv-mp-sel-logo'), nameEl=gel('mv-mp-sel-name');
  if(logoEl) logoEl.innerHTML='<div style="width:32px;height:32px;border-radius:6px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#718096;font-size:12px;">—</div>';
  if(nameEl){ nameEl.textContent='— Seleccionar método —'; nameEl.style.color='var(--tl)'; nameEl.style.fontWeight='normal'; }
  var inp=gel('mv-metodo-pago'); if(inp) inp.value='';
  var rw=gel('mv-receptor-efectivo-wrap'); if(rw) rw.style.display='none';
  var rs=gel('mv-receptor-efectivo'); if(rs) rs.value='';
  var reqStar=gel('mv-img-req'); if(reqStar) reqStar.style.display='inline';
}
function mvToggleMPDrop(e){
  if(e) e.stopPropagation();
  var drop=gel('mv-mp-drop'), chev=gel('mv-mp-chevron'); if(!drop)return;
  if(drop.style.display!=='none'){ drop.style.display='none'; if(chev)chev.style.transform=''; return; }
  drop.innerHTML=Object.keys(_MV_MP_CONFIG).map(function(k){
    return '<div onclick="mvSelecMP(\''+k.replace(/'/g,"\\'")+'\')"\
 style="display:flex;align-items:center;gap:10px;padding:.55rem .85rem;cursor:pointer;border-bottom:1px solid var(--bd);background:#fff;"\
 onmouseover="this.style.background=\'var(--sky4)\'" onmouseout="this.style.background=\'#fff\'">'+
      _MV_MP_CONFIG[k].html+'<span style="font-size:12px;font-weight:600;color:var(--td);">'+k+'</span></div>';
  }).join('');
  drop.style.display='block';
  if(chev) chev.style.transform='rotate(180deg)';
  setTimeout(function(){document.addEventListener('click',_mvMPClose,{once:true});},0);
}
function _mvMPClose(){
  var drop=gel('mv-mp-drop'); if(drop) drop.style.display='none';
  var chev=gel('mv-mp-chevron'); if(chev) chev.style.transform='';
}
function mvSelecMP(val){
  var cfg=_MV_MP_CONFIG[val]; if(!cfg)return;
  var inp=gel('mv-metodo-pago'); if(inp) inp.value=val;
  var logoEl=gel('mv-mp-sel-logo'); if(logoEl) logoEl.innerHTML=cfg.html;
  var nameEl=gel('mv-mp-sel-name');
  if(nameEl){ nameEl.textContent=val; nameEl.style.color=cfg.color; nameEl.style.fontWeight='600'; }
  var drop=gel('mv-mp-drop'); if(drop) drop.style.display='none';
  var chev=gel('mv-mp-chevron'); if(chev) chev.style.transform='';
  var rw=gel('mv-receptor-efectivo-wrap'); if(rw) rw.style.display=(val==='EFECTIVO')?'block':'none';
  var rs=gel('mv-receptor-efectivo'); if(rs&&val!=='EFECTIVO') rs.value='';
  // Con EFECTIVO la imagen es opcional: ocultar el asterisco de obligatorio.
  var reqStar=gel('mv-img-req'); if(reqStar) reqStar.style.display=(val==='EFECTIVO')?'none':'inline';
}

// ── IMÁGENES PAGO (hasta 4) ──
var _mvImagenes = [];
var _MV_IMG_MAX = 4;

function _mvImgAgregar(){
  var inp = gel('mv-img-doc');
  if(!inp||!inp.files) return;
  var espacioLibre = _MV_IMG_MAX - _mvImagenes.length;
  if(espacioLibre <= 0){
    setSt('Máximo '+_MV_IMG_MAX+' imágenes','er');
    setTimeout(function(){setSt('');},2000);
    inp.value=''; return;
  }
  for(var i=0;i<inp.files.length && i<espacioLibre;i++){
    _mvImagenes.push(inp.files[i]);
  }
  if(inp.files.length > espacioLibre){
    setSt('Solo se agregaron '+espacioLibre+' imágenes (máx '+_MV_IMG_MAX+')','er');
    setTimeout(function(){setSt('');},2500);
  }
  inp.value='';
  _mvImgRender();
}

function _mvImgRemover(idx){
  if(idx<0||idx>=_mvImagenes.length) return;
  _mvImagenes.splice(idx,1);
  _mvImgRender();
}

function _mvImgRender(){
  var grid = gel('mv-img-grid');
  var counter = gel('mv-img-counter');
  if(!grid) return;
  if(counter) counter.textContent = '('+_mvImagenes.length+'/'+_MV_IMG_MAX+')';
  var html = '';
  _mvImagenes.forEach(function(f, idx){
    var isImage = f.type && f.type.indexOf('image/')===0;
    html += '<div style="position:relative;border:2px solid #16a34a;border-radius:12px;background:#f0fdf4;padding:8px 6px;min-height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;">' +
      '<button type="button" onclick="_mvImgRemover('+idx+');event.stopPropagation();" title="Eliminar" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:#dc2626;color:#fff;border:none;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:bold;line-height:1;padding:0;box-shadow:0 1px 3px rgba(0,0,0,.2);">×</button>' +
      (isImage
        ? '<img data-mv-thumb="'+idx+'" src="" style="max-width:100%;max-height:70px;object-fit:contain;border-radius:6px;"/>'
        : '<div style="font-size:34px;line-height:1;">📄</div>') +
      '<div style="font-size:10px;color:var(--brand);font-weight:600;text-align:center;word-break:break-all;padding:0 4px;line-height:1.2;">'+f.name+'</div>' +
    '</div>';
  });
  if(_mvImagenes.length < _MV_IMG_MAX){
    html += '<div onclick="document.getElementById(\'mv-img-doc\').click()" ' +
      'style="border:2px dashed var(--brand);border-radius:12px;background:var(--sky4);' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'gap:6px;padding:16px 8px;cursor:pointer;min-height:130px;text-align:center;user-select:none;">' +
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>' +
      '<span style="font-size:12px;font-weight:600;color:var(--brand);">'+(_mvImagenes.length?'Agregar otra':'Haz clic para subir')+'</span>' +
      '<span style="font-size:10px;color:var(--tl);">JPG, PNG o PDF · máx 4 MB</span>' +
    '</div>';
  }
  grid.innerHTML = html;
  // Cargar miniaturas de imágenes asíncronamente
  _mvImagenes.forEach(function(f, idx){
    if(!f.type || f.type.indexOf('image/')!==0) return;
    var img = grid.querySelector('img[data-mv-thumb="'+idx+'"]');
    if(!img) return;
    var r = new FileReader();
    r.onload = function(e){ img.src = e.target.result; };
    r.readAsDataURL(f);
  });
}

// ── COMPRIMIR IMAGEN ──
function comprimirImagen(file, maxMB){
  return new Promise(function(resolve){
    var maxBytes=(maxMB||4)*1024*1024;
    if(!file.type.startsWith('image/')||file.size<=maxBytes){resolve(file);return;}
    var reader=new FileReader();
    reader.onload=function(e){
      var img=new Image();
      img.onload=function(){
        var W=1920,H=1920,w=img.width,h=img.height;
        if(w>W){h=Math.round(h*W/w);w=W;} if(h>H){w=Math.round(w*H/h);h=H;}
        var cvs=document.createElement('canvas');cvs.width=w;cvs.height=h;
        cvs.getContext('2d').drawImage(img,0,0,w,h);
        var q=0.85;
        (function tryBlob(){
          cvs.toBlob(function(blob){
            if(!blob){resolve(file);return;}
            if(blob.size<=maxBytes||q<0.3){resolve(new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'}));}
            else{q-=0.1;tryBlob();}
          },'image/jpeg',q);
        })();
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── AUTO-PRECIO AL SELECCIONAR PRODUCTO ──
function mvAutoPrecio(){
  var sel=gel('mv-prod'); if(!sel)return;
  var opt=sel.options[sel.selectedIndex];
  var precio=opt&&opt.dataset&&opt.dataset.precio?parseFloat(opt.dataset.precio):0;
  if(precio>0){gel('mv-precio').value=precio.toFixed(2);mvCalcTotal();}
}

function mvInicializar(){
  gel('mv-fecha').value = hoy();
  gel('mv-hora').value = '';
  gel('mv-doctora').value = '';
  gel('mv-celular').value = '';
  if(gel('mv-ruc'))gel('mv-ruc').value = '';
  gel('mv-notas').value = '';
  gel('mv-vete').value = '';
  docsReset('mv');
  // Sin argumento, limpiarErrores() barre TODA la página — incluidos
  // errores de otras pestañas del SPA que no vienen al caso. Se acota al
  // contenedor de esta página.
  SVUI.limpiarErrores(gel('page-registrar'));
  if(typeof _mvOcultarErrorSinMovimiento==='function') _mvOcultarErrorSinMovimiento();
  // Funciones de poblado reutilizables
  function _mvPoblarZonas(asig){
    var selZ = gel('mv-zona'); if(!selZ) return;
    selZ.innerHTML = '<option value="">&#8212; Seleccionar zona &#8212;</option>';
    var srcZ = (asig&&asig.length) ? asig : (_zonasList||[]);
    for(var i=0;i<srcZ.length;i++){
      var opt=document.createElement('option');
      opt.value=srcZ[i].nombre||srcZ[i]; opt.textContent=srcZ[i].nombre||srcZ[i];
      selZ.appendChild(opt);
    }
  }
  function _mvPoblarProductos(asig, allProds){
    var selP = gel('mv-prod'); if(!selP) return;
    selP.innerHTML='<option value="">— Seleccionar —</option>';
    var src = allProds||_prods||[];
    var listaP = (asig&&asig.length) ? src.filter(function(p){return asig.indexOf(p.nombre)>=0;}) : src;
    listaP.forEach(function(p){
      var o=document.createElement('option');
      o.value=p.nombre;
      o.textContent=p.nombre+(p.precio_sugerido?' (S/'+Number(p.precio_sugerido).toFixed(2)+')':'');
      o.dataset.precio=p.precio_sugerido||0;
      selP.appendChild(o);
    });
  }
  function _mvPoblarCategorias(cats){
    var selCat=gel('mv-cat'), wrapCat=gel('mv-cat-wrap');
    if(!selCat||!wrapCat) return;
    cats = cats||[];
    selCat.innerHTML='<option value="">— Sin categoría —</option>';
    cats.forEach(function(c){var o=document.createElement('option');o.value=c;o.textContent=c;selCat.appendChild(o);});
    if(cats.length===1){selCat.value=cats[0];wrapCat.style.display='none';}
    else if(cats.length>1){wrapCat.style.display='';}
    else{wrapCat.style.display='none';}
  }

  // Pintar inmediatamente desde CUR (cache) para evitar dropdowns vacíos
  _mvPoblarZonas(CUR&&CUR.zonas_asignadas);
  _mvPoblarProductos(CUR&&CUR.productos_asignados, _prods);
  _mvPoblarCategorias(CUR&&CUR.segmentos);

  // Refrescar vendedor desde Supabase
  sbG('vendedores','id=eq.'+CUR.id+'&select=zonas_asignadas,productos_asignados,segmentos').then(function(r){
    if(r&&r[0]){
      var row=r[0];
      if(row.zonas_asignadas!==undefined) CUR.zonas_asignadas=row.zonas_asignadas;
      if(row.productos_asignados!==undefined) CUR.productos_asignados=row.productos_asignados;
      if(row.segmentos!==undefined) CUR.segmentos=row.segmentos;
      _mvPoblarZonas(CUR.zonas_asignadas);
      _mvPoblarProductos(CUR.productos_asignados, _prods);
      _mvPoblarCategorias(CUR.segmentos);
    }
  }).catch(function(e){if(window.console)console.error('Error refrescando vendedor:',e);});

  // Refrescar productos desde Supabase
  sbG('productos','order=nombre.asc').then(function(r){
    _prods = r||[];
    _mvPoblarProductos(CUR&&CUR.productos_asignados, _prods);
  }).catch(function(){});
  _mvMovimientos = [];
  _mvTipoActual = '';
  mvRenderLista();
  gel('mv-campos').style.display = 'none';
  document.querySelectorAll('.mv-tipo-btn').forEach(function(b){b.classList.remove('active','btn-p');b.classList.add('btn-s');});
  // Ocultar imagen y metodo pago hasta que se elija un tipo con pago
  var imgW=gel('mv-img-doc-wrap');if(imgW)imgW.style.display='none';
  var mpW=gel('mv-metodo-pago-wrap');if(mpW)mpW.style.display='none';
  // Reset imágenes y render grid
  _mvImagenes = [];
  _mvImgRender();
  // Conectar evento imagen (solo una vez)
  var imgInp=gel('mv-img-doc'),grid=gel('mv-img-grid');
  if(imgInp&&!imgInp.dataset.wired){
    imgInp.dataset.wired='1';
    imgInp.addEventListener('change',_mvImgAgregar);
    if(grid){
      grid.addEventListener('dragover',function(e){e.preventDefault();});
      grid.addEventListener('drop',function(e){
        e.preventDefault();
        if(!e.dataTransfer||!e.dataTransfer.files||!e.dataTransfer.files.length) return;
        var dt=new DataTransfer();
        for(var i=0;i<e.dataTransfer.files.length;i++) dt.items.add(e.dataTransfer.files[i]);
        imgInp.files=dt.files;
        _mvImgAgregar();
      });
    }
  }
}

function mvShowVetes(q){
  var list = gel('mv-vete-list');
  if(!list)return;
  var ql = q ? q.toLowerCase() : '';
  // Una vet es "elegible" para este vendedor si:
  //   - le pertenece según esMiCliente() (transferencia manda sobre zona), O
  //   - ya aparece en alguna venta suya de una zona asignada (histórico)
  // Si no tiene zonas asignadas ni transferencias, ve todo (compatibilidad).
  var zAsig = (CUR&&Array.isArray(CUR.zonas_asignadas)) ? CUR.zonas_asignadas : [];
  var aplicaZona = zAsig.length>0;
  var zLC = {};
  zAsig.forEach(function(z){zLC[(z||'').toLowerCase()]=true;});
  var nombresEnZonaPorVentas = {};
  if(aplicaZona){
    (_ventas||[]).forEach(function(v){
      if(!v.veterinaria||!v.zona)return;
      if(zLC[(v.zona||'').toLowerCase()]) nombresEnZonaPorVentas[v.veterinaria.trim().toLowerCase()]=true;
    });
  }
  var fuente = _vetes.filter(function(v){
    // Transferida a otro vendedor: fuera, aunque la zona cuadre o tenga histórico.
    if(v.vendedor_asignado_id && String(v.vendedor_asignado_id)!==String(CUR&&CUR.id)) return false;
    if(esMiCliente(v)) return true;
    return !!nombresEnZonaPorVentas[(v.nombre_vet||'').trim().toLowerCase()];
  });
  var matches = ql.length>0
    ? fuente.filter(function(v){
        return (v.nombre_vet||'').toLowerCase().includes(ql) ||
               (v.doctora||'').toLowerCase().includes(ql);
      }).slice(0,12)
    : fuente.slice(0,12);
  if(!matches.length){list.style.display='none';return;}
  list.innerHTML = matches.map(function(v){
    var nombre = v.nombre_vet;
    // Highlight la parte que coincide
    var displayNombre = ql ? nombre.replace(
      new RegExp('('+ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),
      '<strong style="color:var(--brand);">$1</strong>'
    ) : nombre;
    var displayDoc = v.doctora ? (ql ? v.doctora.replace(
      new RegExp('('+ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),
      '<strong style="color:var(--brand);">$1</strong>'
    ) : v.doctora) : '';
    return '<div style="padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:0.5px solid var(--bd);transition:background .1s;" '+
      'onmousedown="mvSelectVete(\''+nombre.replace(/'/g,"\\'")+'\')" '+
      'onmouseover="this.style.background=\'var(--sky4)\'" onmouseout="this.style.background=\'\'">' +
      '<span style="font-weight:600;">'+displayNombre+'</span>'+
      (displayDoc?'<span style="font-size:11px;color:var(--tl);margin-left:6px;">'+displayDoc+'</span>':'')+
      '</div>';
  }).join('');
  list.style.display = 'block';
}

function mvSelectVete(nombre){
  gel('mv-vete').value = nombre;
  gel('mv-vete-list').style.display = 'none';
  // Autocompletar doctora si hay una conocida para esta vet
  var doc = _docMap[nombre]||'';
  if(doc) gel('mv-doctora').value = doc;
  // Actualizar zona si hay historial de esta vet
  var zonaKnown='';
  for(var i=0;i<_ventas.length;i++){
    if(_ventas[i].veterinaria===nombre&&_ventas[i].zona){zonaKnown=_ventas[i].zona;break;}
  }
  if(zonaKnown){var zs=gel('mv-zona');if(zs)zs.value=zonaKnown;}
  // Si hay cobros pendientes de esta vete, actualizar lista
  if(_mvTipoActual === 'Cobro de credito') mvCargarCreditosVete(nombre, val('mv-doctora'));
}

function mvShowDoctoras(q){
  var list=gel('mv-doctora-list');if(!list)return;
  var vet=val('mv-vete')||'';
  // Doctors for selected vet first, then all others
  var vetDocs=(_vetDocMap&&vet&&_vetDocMap[vet])?_vetDocMap[vet].slice():[];
  // Use _allDoctors (includes doctors without vet)
  var allDocs=(window._allDoctors||[]).slice();
  // Combine: vet-specific first, then others
  var pool=vetDocs.slice();
  allDocs.forEach(function(d){if(pool.indexOf(d)<0)pool.push(d);});
  var ql = q ? q.toLowerCase() : '';
  var matches=ql.length>0?pool.filter(function(d){return d.toLowerCase().includes(ql);}):pool;
  matches=matches.slice(0,12);
  if(!matches.length){list.style.display='none';return;}
  list.innerHTML=matches.map(function(d){
    var cel=(_celMap&&_celMap[d])?'<span style="font-size:11px;color:var(--tl);margin-left:6px;">'+_celMap[d]+'</span>':'';
    var displayD = ql ? d.replace(new RegExp('('+ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<strong style="color:var(--brand);">$1</strong>') : d;
    return '<div style="padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:0.5px solid var(--bd);" '+
      'onmouseover="this.style.background=\'var(--sky4)\'" onmouseout="this.style.background=\'\'" '+
      'onmousedown="mvSelectDoctora(\''+d.replace(/'/g,"\\'")+'\');if(typeof mvUpdateSummary===\'function\')mvUpdateSummary();">'+displayD+cel+'</div>';
  }).join('');
  list.style.display='block';
}

function mvSelectDoctora(nombre){
  gel('mv-doctora').value=nombre;
  var list=gel('mv-doctora-list');if(list)list.style.display='none';
  if(_celMap[nombre]&&!val('mv-celular'))gel('mv-celular').value=_celMap[nombre];
  // Refrescar lista de créditos si estamos en modo cobro
  if(_mvTipoActual === 'Cobro de credito') mvCargarCreditosVete(val('mv-vete'), nombre);
}

function mvSelTipo(tipo, btn){
  _mvTipoActual = tipo;
  document.querySelectorAll('.tipo-btn').forEach(function(b){b.classList.remove('sel');});
  if(btn) btn.classList.add('sel');
  // Sincroniza aria-checked y el roving tabindex con la clase .sel que
  // se acaba de mover. Sin esto un lector de pantalla seguiría anunciando
  // la opción anterior como la marcada.
  if(_mvTipoGroup) _mvTipoGroup.sync();
  // "Selecciona un tipo de movimiento" no tiene un <input> al que
  // anclarse (ver mvAgregarMovimiento): se limpia a mano, como el
  // aviso de "sin movimientos".
  var errTipo=gel('mv-tipo-error'); if(errTipo){errTipo.hidden=true;errTipo.textContent='';}

  var campos = gel('mv-campos');
  var prodFields = gel('mv-prod-fields');
  var cobroWrap = gel('mv-cobro-wrap');
  var credWrap = gel('mv-cred-wrap');
  var btnAgregar = gel('btn-mv-agregar');

  if(campos) campos.style.display = 'block';

  // Reset: hide everything first
  if(prodFields) prodFields.style.display = 'none';
  if(cobroWrap) cobroWrap.style.display = 'none';
  if(credWrap) credWrap.style.display = 'none';
  if(btnAgregar) btnAgregar.style.display = 'block';

  if(tipo === 'Visita'){
    // Solo visita - no fields needed
  } else if(tipo === 'Credito a 15 dias'){
    if(prodFields) prodFields.style.display = 'block';
    if(cobroWrap) cobroWrap.style.display = 'block';
    var fc = new Date(); fc.setDate(fc.getDate()+15);
    var fcStr = fc.toISOString().split('T')[0];
    var info = gel('mv-cobro-info');
    if(info){ var p=fcStr.split('-'); info.textContent=p[2]+'/'+p[1]+'/'+p[0]; }
  } else if(tipo === 'Cobro de credito'){
    if(credWrap) credWrap.style.display = 'block';
    if(btnAgregar) btnAgregar.style.display = 'none';
    mvCargarCreditosVete(val('mv-vete'), val('mv-doctora'));
  } else {
    // Contado, delivery, devolucion
    if(prodFields) prodFields.style.display = 'block';
  }

  // Imagen de pago y método de pago: obligatorios para contado, delivery, cobro
  var tiposConPago = ['Venta al contado','Venta delivery','Cobro de credito'];
  var conPago = tiposConPago.indexOf(tipo) >= 0;
  var imgWrap = gel('mv-img-doc-wrap');
  if(imgWrap) imgWrap.style.display = conPago ? 'block' : 'none';
  var mpWrap = gel('mv-metodo-pago-wrap');
  if(mpWrap) mpWrap.style.display = conPago ? 'block' : 'none';
  if(!conPago){ var rw=gel('mv-receptor-efectivo-wrap'); if(rw) rw.style.display='none'; }

  gel('mv-cant').value = '';
  gel('mv-precio').value = '';
  gel('mv-total-disp').textContent = 'S/ 0.00';
  if(typeof mvOcultarRegalo==='function')mvOcultarRegalo();
}

// ── REGALO ──
// A propósito detrás de un botón chico en vez de un checkbox a la vista:
// es la excepción (una promo puntual), no algo que el vendedor deba
// decidir en cada venta que registra.
function mvToggleRegalo(){
  var wrap=gel('mv-regalo-wrap');
  if(!wrap)return;
  if(wrap.style.display==='none')mvMostrarRegalo();else mvOcultarRegalo();
}
function mvMostrarRegalo(){
  var wrap=gel('mv-regalo-wrap');if(wrap)wrap.style.display='block';
  var btn=gel('btn-mv-regalo-toggle');if(btn)btn.classList.add('btn-sk');
}
function mvOcultarRegalo(){
  var wrap=gel('mv-regalo-wrap');if(wrap)wrap.style.display='none';
  var cant=gel('mv-regalo-cant');if(cant)cant.value='';
  var btn=gel('btn-mv-regalo-toggle');if(btn)btn.classList.remove('btn-sk');
}

function mvCargarCreditosVete(vete, doctora){
  var body = gel('mv-cred-body');
  _mvCredSelId = null;
  if(!vete && !doctora){
    body.innerHTML='<div style="font-size:12px;color:var(--tl);padding:.6rem 0;">Ingresa la veterinaria o doctor/a arriba para ver sus créditos pendientes.</div>';
    return;
  }
  // Buscar créditos pendientes del cliente (por vet O por doctora)
  var creditos = _ventas.filter(function(v){
    var matchVet  = vete   && (v.veterinaria||'').toLowerCase()===vete.toLowerCase();
    var matchDoc  = doctora && (v.doctora||'').toLowerCase()===doctora.toLowerCase();
    var esCred = (v.movimiento==='Credito a 15 dias'||v.movimiento==='Cr\u00e9dito a 15 d\u00edas');
    var pendiente = v.estado!=='\u2705 Pagado' && v.estado!=='Anulado' && v.estado!=='\ud83d\udce6 Devuelto';
    return (matchVet||matchDoc) && esCred && pendiente;
  });
  // Excluir créditos ya agregados como cobro en esta misma visita
  var yaAgregados = _mvMovimientos.filter(function(m){return m.tipo==='Cobro de credito';}).map(function(m){return m.credId;});
  creditos = creditos.filter(function(c){return yaAgregados.indexOf(c.id)<0;});

  if(!creditos.length){
    body.innerHTML=
      '<div style="background:var(--sky4);border:1px solid var(--sky);border-radius:var(--r);padding:.85rem 1rem;display:flex;align-items:center;gap:10px;">'+
        '<span style="font-size:20px;">\u2705</span>'+
        '<div>'+
          '<div style="font-size:13px;font-weight:600;color:var(--brand);">Sin créditos pendientes</div>'+
          '<div style="font-size:11px;color:var(--tl);">Este cliente no tiene deudas pendientes de cobro.</div>'+
        '</div>'+
      '</div>';
    return;
  }

  var clienteNombre = vete || doctora;
  var html =
    '<div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">'+
      '\ud83d\udcb3 Créditos pendientes de '+clienteNombre+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;">';

  creditos.forEach(function(c){
    var dias = c.fecha_cobro ? Math.ceil((new Date(c.fecha_cobro)-new Date())/86400000) : null;
    var venc = dias!==null&&dias<0;
    var diasTxt = dias===null ? '' : (venc
      ? '<span style="color:var(--er);font-weight:600;">Vencido hace '+Math.abs(dias)+'d</span>'
      : '<span style="color:#d97706;font-weight:600;">Vence en '+dias+'d</span>');
    html +=
      '<div id="cred-row-'+c.id+'" style="border:1.5px solid '+(venc?'var(--er)':'var(--sky)')+';border-radius:var(--r);background:var(--wh);overflow:hidden;">'+
        // Fila principal
        '<div style="display:flex;align-items:center;gap:10px;padding:.65rem .85rem;flex-wrap:wrap;">'+
          '<div style="flex:1;min-width:120px;">'+
            '<div style="font-size:13px;font-weight:700;">'+(c.producto||'---')+'</div>'+
            '<div style="font-size:11px;color:var(--tl);">'+(c.cantidad||0)+' uds &middot; '+money(c.total)+' &middot; cobro '+fmt(c.fecha_cobro)+'</div>'+
            '<div style="font-size:11px;margin-top:2px;">'+diasTxt+'</div>'+
          '</div>'+
          '<div style="display:flex;gap:6px;flex-shrink:0;">'+
            '<button class="btn btn-ok btn-sm" onclick="mvCobrarTodo(\''+c.id+'\')" style="white-space:nowrap;">\ud83d\udcb0 Cobrar todo</button>'+
            '<button class="btn btn-s btn-sm" onclick="mvMostrarParcial(\''+c.id+'\')" style="white-space:nowrap;">\u2702\ufe0f Parcial</button>'+
          '</div>'+
        '</div>'+
        // Panel parcial (oculto por defecto). Se puede cobrar en unidades o en
        // dinero, porque en la calle pasan las dos cosas: "me pagaron 5 de las
        // 10 bolsas" y "me dieron S/ 500 de los S/ 1000". El reparto es el
        // mismo que en la pestaña Créditos — lo comparten vía SVCobros.
        '<div id="cred-parcial-'+c.id+'" style="display:none;background:var(--sky4);border-top:1px solid var(--sky);padding:.65rem .85rem;">'+
          SVCobros.modoHTML('mvSetModoCred', c.id, 'uds')+
          '<div style="display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin-top:8px;">'+
            '<div style="flex:1;min-width:140px;" id="cred-wrap-uds-'+c.id+'">'+
              '<label for="cred-cant-'+c.id+'" style="font-size:11px;font-weight:700;color:var(--brand);display:block;margin-bottom:4px;">¿Cuántas unidades te pagaron? (máx '+c.cantidad+')</label>'+
              // Sin valor por defecto: venía pre-rellenado con el total, así que
              // abrir "Parcial" y confirmar sin tocar nada registraba un cobro
              // completo desde el botón que dice "parcial".
              '<input type="number" id="cred-cant-'+c.id+'" min="1" max="'+c.cantidad+'" placeholder="Ej: 3" inputmode="numeric" style="width:110px;" oninput="mvPreviewCred(\''+c.id+'\')"/>'+
            '</div>'+
            '<div style="flex:1;min-width:140px;" id="cred-wrap-monto-'+c.id+'" hidden>'+
              '<label for="cred-monto-'+c.id+'" style="font-size:11px;font-weight:700;color:var(--brand);display:block;margin-bottom:4px;">¿Cuánto dinero te pagaron? (máx '+money(c.total)+')</label>'+
              '<input type="number" id="cred-monto-'+c.id+'" min="0.01" step="0.01" placeholder="Ej: 500.00" inputmode="decimal" style="width:110px;" oninput="mvPreviewCred(\''+c.id+'\')"/>'+
            '</div>'+
            '<div style="flex:1;min-width:140px;">'+
              '<label for="cred-fecha-'+c.id+'" style="font-size:11px;font-weight:700;color:var(--brand);display:block;margin-bottom:4px;">Fecha del cobro</label>'+
              '<input type="date" id="cred-fecha-'+c.id+'" max="'+hoy()+'" value="'+_mvFechaVisita()+'" />'+
            '</div>'+
            '<button class="btn btn-cta btn-sm" onclick="mvConfirmarParcial(\''+c.id+'\')" style="white-space:nowrap;">\u2713 Confirmar</button>'+
          '</div>'+
          // Desglose en vivo: cu\u00e1nto entra, cu\u00e1nto queda y en cu\u00e1ntas unidades.
          // Antes hab\u00eda que confirmar sin ver ning\u00fan importe.
          '<div class="cp-resumen" id="cred-resumen-'+c.id+'" role="status" hidden style="margin-top:8px;margin-bottom:0;"></div>'+
        '</div>'+
      '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}

// Modo de cobro elegido por crédito ('uds' | 'monto'). Es por crédito y no
// global porque el panel de la visita puede tener varios abiertos a la vez.
var _mvCredModo = {};

// La fecha por defecto del cobro es la de la visita, no hoy: si registras el
// lunes una visita del sábado, cobraste el sábado.
function _mvFechaVisita(){
  var f = gel('mv-fecha');
  return (f && f.value) ? f.value : hoy();
}

function mvSetModoCred(id, modo){
  modo = (modo==='monto') ? 'monto' : 'uds';
  _mvCredModo[id] = modo;
  var esMonto = (modo==='monto');
  var wU = gel('cred-wrap-uds-'+id), wM = gel('cred-wrap-monto-'+id);
  if(wU) wU.hidden = esMonto;
  if(wM) wM.hidden = !esMonto;
  SVCobros.marcarModo(gel('cp-modo-uds-'+id), gel('cp-modo-monto-'+id), modo);
  // Cambiar de modo limpia el otro campo: 3 unidades y 3 soles no son lo mismo.
  var campo = gel((esMonto?'cred-monto-':'cred-cant-')+id);
  var otro  = gel((esMonto?'cred-cant-':'cred-monto-')+id);
  if(otro){ otro.value=''; SVUI.limpiarError(otro); }
  if(campo){ campo.value=''; campo.focus(); }
  mvPreviewCred(id);
}

function _mvCredValor(id){
  var modo = _mvCredModo[id]||'uds';
  var campo = gel((modo==='monto'?'cred-monto-':'cred-cant-')+id);
  return { modo:modo, campo:campo, bruto:parseFloat((campo&&campo.value)||'') };
}

function mvPreviewCred(id){
  var c = _ventas.filter(function(v){return v.id===id;})[0];
  var d = _mvCredValor(id);
  SVCobros.pintarResumen(gel('cred-resumen-'+id), c, d.modo, d.bruto);
}

function mvMostrarParcial(id){
  var panel = gel('cred-parcial-'+id);
  if(!panel) return;
  // Ocultar otros paneles abiertos
  document.querySelectorAll('[id^="cred-parcial-"]').forEach(function(p){
    if(p.id !== 'cred-parcial-'+id) p.style.display='none';
  });
  panel.style.display = panel.style.display==='none' ? 'block' : 'none';
  if(panel.style.display==='block') mvSetModoCred(id, _mvCredModo[id]||'uds');
}

function mvCobrarTodo(id){
  var c = _ventas.filter(function(v){return v.id===id;})[0];
  if(!c) return;
  var fi = gel('cred-fecha-'+id);
  // rep completo: cantidad y total NO se tocan al guardar.
  _mvAgregarCobro(c, {completo:true}, 'uds', (fi&&fi.value)||_mvFechaVisita());
}

function mvConfirmarParcial(id){
  var c = _ventas.filter(function(v){return v.id===id;})[0];
  if(!c) return;
  var d = _mvCredValor(id);
  var fechaInp = gel('cred-fecha-'+id);

  // Las dos condiciones (vacío/0 y demasiado alto) son mutuamente
  // excluyentes pero comparten el mismo campo — no se puede usar
  // SVUI.validar() con dos reglas sobre el mismo input: la segunda regla,
  // al pasar, borraría el error que acaba de poner la primera. Se resuelve
  // con el motivo que devuelve SVCobros.
  var rep = SVCobros.reparto(c, d.modo, d.bruto);
  if(rep.invalido){
    SVUI.marcarError(d.campo, SVCobros.mensajeError(c, d.modo, rep));
    if(d.campo){ d.campo.focus(); d.campo.select(); d.campo.scrollIntoView({behavior:'smooth',block:'center'}); }
    return;
  }
  if(d.campo) SVUI.limpiarError(d.campo);

  var fecha = (fechaInp&&fechaInp.value)||_mvFechaVisita();
  _mvAgregarCobro(c, rep, d.modo, fecha);
}

function _mvAgregarCobro(c, rep, modo, fecha){
  // Método de pago obligatorio para cobros de crédito. mv-metodo-pago es
  // type="hidden" (lo maneja un dropdown propio, no un <select>): un campo
  // oculto no es enfocable ni tiene nada que hacer scrollIntoView, así que
  // el error se marca en el campo (el mensaje sí aparece — su contenedor,
  // mv-metodo-pago-wrap, es visible) pero el scroll apunta al contenedor.
  if(!val('mv-metodo-pago')){
    SVUI.marcarError('mv-metodo-pago', 'Elige cómo se cobró para poder registrarlo.');
    var mpWrap=gel('mv-metodo-pago-wrap');
    if(mpWrap) mpWrap.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  SVUI.limpiarError('mv-metodo-pago');
  // El importe sale de SVCobros, no de cantidad \u00d7 precio: en un cobro total es
  // el total original intacto, y en uno parcial la parte cobrada, cuyo saldo
  // complementario suma exactamente el original.
  var esParcial = !rep.completo;
  var montoCobrado = esParcial ? rep.montoPagado : (Number(c.total)||0);
  var detalle = !esParcial
    ? (c.cantidad||0)+' uds (total)'
    : (modo==='monto'
        ? money(rep.montoPagado)+' de '+money(c.total)+' (parcial)'
        : rep.udsPagadas+' de '+(c.cantidad||0)+' uds (parcial)');
  _mvMovimientos.push({
    tipo:'Cobro de credito',
    label:'Cobro: '+(c.producto||'')+' \u00b7 '+detalle,
    color:'#16a34a',
    credId: c.id,
    rep: rep,
    modo: modo,
    total: montoCobrado,
    fecha: fecha,
    credObj: c
  });
  mvRenderLista();
  if(typeof mvUpdateSummary==='function') mvUpdateSummary();
  setSt('\u2705 Cobro agregado: '+(c.producto||'')+' \u00b7 '+money(montoCobrado),'ok');
  setTimeout(function(){setSt('');},2000);
  // Refrescar la lista (para ocultar el crédito recién agregado)
  mvCargarCreditosVete(val('mv-vete'), val('mv-doctora'));
}

function mvSelCred(id, el){
  // Kept for backward compatibility (not used in new UI)
  _mvCredSelId = id;
}

function mvCalcTotal(){
  var cant = parseFloat(gel('mv-cant').value)||0;
  var precio = parseFloat(gel('mv-precio').value)||0;
  var total = cant*precio;
  gel('mv-total-disp').textContent = money(total);
}

function mvAgregarMovimiento(){
  var tipo = _mvTipoActual;
  // Sin un <input> al que anclarse (es un radiogroup de divs, no un campo
  // de formulario): mismo patrón que "sin movimientos". El foco va a la
  // primera opción del grupo, ya alcanzable por Tab gracias al roving
  // tabindex de SVUI.radiogroup().
  if(!tipo){
    var errTipo=gel('mv-tipo-error');
    if(errTipo){ errTipo.textContent='Elige qué pasó en la visita para poder registrarla.'; errTipo.hidden=false; }
    var primeraOpcion=document.querySelector('#mv-tipo-grid [role="radio"]');
    if(primeraOpcion){ primeraOpcion.focus(); primeraOpcion.scrollIntoView({behavior:'smooth',block:'center'}); }
    return;
  }

  var prod = val('mv-prod');
  var cant = parseInt(gel('mv-cant').value)||0;
  var precio = parseFloat(gel('mv-precio').value)||0;

  if(tipo === 'Visita'){
    _mvMovimientos.push({tipo:'Visita', label:'Solo visita', color:'#6b7280', estado:'Visita'});
    mvRenderLista(); if(typeof mvUpdateSummary==='function')mvUpdateSummary(); mvResetCampos(); setSt('Visita agregada','ok'); setTimeout(function(){setSt('');},1500);
    return;
  }

  if(tipo === 'Cobro de credito'){
    // Los cobros de crédito se agregan directamente desde la tabla (mvCobrarTodo / mvConfirmarParcial)
    setSt('Usa los botones "Cobrar todo" o "Parcial" de cada crédito para agregarlo','er');
    return;
  }

  // Ventas y creditos. producto/cantidad/precio son campos visibles
  // normales: SVUI.validar ya se encarga de marcar, enfocar y hacer scroll
  // al primero que falte.
  var esDevolucion = (tipo==='Devolucion'||tipo==='Devoluci\u00f3n');
  var okCampos = SVUI.validar([
    {campo:'mv-prod',   si:function(v){return !v;},
     error:'Elige el producto que vendiste.'},
    {campo:'mv-cant',   si:function(v){return (parseInt(v,10)||0)<=0;},
     error:'La cantidad tiene que ser 1 o m\u00e1s.'},
    {campo:'mv-precio', si:function(v){return (parseFloat(v)||0)<=0;}, saltar:esDevolucion,
     error:'Escribe el precio unitario. Debe ser mayor que 0.'}
  ]);
  if(!okCampos) return;

  // M\u00e9todo de pago e imagen viven en inputs ocultos (hidden / file
  // disparado por un bot\u00f3n propio): no son enfocables ni tienen nada que
  // hacer scrollIntoView, as\u00ed que el error se marca en el campo pero el
  // scroll apunta al contenedor visible que lo envuelve.
  var tiposConPagoMov=['Venta al contado','Venta delivery'];
  if(tiposConPagoMov.indexOf(tipo)>=0 && !val('mv-metodo-pago')){
    SVUI.marcarError('mv-metodo-pago', 'Elige c\u00f3mo se pag\u00f3 para poder registrar la venta.');
    var mpWrap=gel('mv-metodo-pago-wrap');
    if(mpWrap) mpWrap.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  SVUI.limpiarError('mv-metodo-pago');

  // Imagen de pago obligatoria para Venta al contado y Venta delivery,
  // EXCEPTO cuando el m\u00e9todo de pago es EFECTIVO (no hay comprobante).
  if(tiposConPagoMov.indexOf(tipo)>=0 && val('mv-metodo-pago')!=='EFECTIVO' && (!_mvImagenes || !_mvImagenes.length)){
    SVUI.marcarError('mv-img-doc', 'Falta el comprobante. Adjunta la foto del pago.');
    var imgWrapMov=gel('mv-img-doc-wrap');
    if(imgWrapMov) imgWrapMov.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  SVUI.limpiarError('mv-img-doc');

  var estados = {
    'Venta al contado': '\u2705 Pagado',
    'Venta delivery': '\u2705 Pagado',
    'Credito a 15 dias': '\u23f3 Pendiente',
    'Devolucion': '\ud83d\udce6 Devuelto'
  };

  var colores = {
    'Venta al contado':'#16a34a','Venta delivery':'#2563eb',
    'Credito a 15 dias':'#d97706','Devolucion':'#dc2626'
  };

  // Regalo: unidades extra del mismo producto, entregadas sin costo junto
  // con esta venta (p.ej. "compra 12, llevas 13"). Solo aplica si el
  // vendedor abri\u00f3 el panel de regalo; si no, regaloCant queda en 0.
  var regaloWrapVisible = gel('mv-regalo-wrap') && gel('mv-regalo-wrap').style.display!=='none';
  var regaloCant = regaloWrapVisible ? (parseInt(gel('mv-regalo-cant').value,10)||0) : 0;

  _mvMovimientos.push({
    tipo: tipo,
    label: tipo+': '+prod+' \u00b7 '+cant+' uds \u00b7 '+money(cant*precio)+(regaloCant>0?' \u00b7 \ud83c\udf81 +'+regaloCant+' regalo':''),
    color: colores[tipo]||'#374151',
    prod: prod, cant: cant, precio: precio,
    total: cant*precio,
    estado: estados[tipo]||'\u2705 Pagado',
    regaloCant: regaloCant,
    fechaCobro: tipo==='Credito a 15 dias'?(function(){var d=new Date();d.setDate(d.getDate()+15);return d.toISOString().split('T')[0];})():null
  });
  mvRenderLista(); if(typeof mvUpdateSummary==='function')mvUpdateSummary();
  // Mantener el formulario abierto para agregar otro movimiento (estado "imagen 2"):
  // se conservan el tipo seleccionado, el método de pago y la imagen de pago.
  // Solo se limpian producto, cantidad y precio para el siguiente ítem.
  gel('mv-prod').value='';
  gel('mv-cant').value=''; gel('mv-precio').value='';
  gel('mv-total-disp').textContent='S/ 0.00';
  mvOcultarRegalo();
  setSt('Movimiento agregado','ok'); setTimeout(function(){setSt('');},1500);
}

function mvRenderLista(){
  var lista = gel('mv-lista');
  var resumen = gel('mv-resumen');
  if(!_mvMovimientos.length){
    if(lista)lista.style.display='none';
    if(resumen)resumen.style.display='none';
    if(typeof mvUpdateSummary==='function')mvUpdateSummary();
    return;
  }
  if(lista)lista.style.display='block';
  if(resumen)resumen.style.display='flex';
  var totalVisita=0;
  var h='<div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:.5rem;">';
  for(var i=0;i<_mvMovimientos.length;i++){
    var m=_mvMovimientos[i];
    totalVisita+=(m.total||0);
    h+='<div style="background:var(--sky4);border:2px solid var(--sky);border-left:4px solid var(--brand);border-radius:var(--r);padding:.7rem 1rem;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 6px rgba(37,60,97,.08);">'+
      '<div>'+
        '<div style="font-size:12px;font-weight:800;color:var(--brand);text-transform:uppercase;letter-spacing:.5px;">'+m.tipo+'</div>'+
        '<div style="font-size:12px;color:var(--td);margin-top:2px;font-weight:500;">'+m.label+'</div>'+
      '</div>'+
      '<button class="btn btn-d btn-sm" onclick="mvQuitarMovimiento('+i+')">\u2715</button>'+
    '</div>';
  }
  h+='</div>';
  lista.innerHTML=h;
  var _tv=gel('mv-total-visita');if(_tv)_tv.textContent=money(totalVisita);
  var _cm=gel('mv-count-movs');if(_cm)_cm.textContent=_mvMovimientos.length+' movimiento'+(_mvMovimientos.length!==1?'s':'');
  if(typeof mvUpdateSummary==='function')mvUpdateSummary();
}

function mvQuitarMovimiento(idx){
  _mvMovimientos.splice(idx,1);
  mvRenderLista();
}

function mvResetCampos(){
  _mvTipoActual=''; _mvCredSelId=null;
  gel('mv-campos').style.display='none';
  gel('mv-cant').value=''; gel('mv-precio').value='';
  gel('mv-total-disp').textContent='S/ 0.00';
  // mv-cred-cant no existe en el DOM (el campo de cantidad de un cobro
  // parcial se genera con id dinámico cred-cant-<id>, no con este id fijo).
  // Sin guarda, esta línea lanzaba TypeError y cortaba el reseteo a la
  // mitad cada vez que se agregaba "Sólo visita": el botón de tipo se
  // quedaba marcado como seleccionado aunque el formulario ya se había
  // limpiado.
  var cc=gel('mv-cred-cant'); if(cc) cc.value='';
  document.querySelectorAll('.tipo-btn').forEach(function(b){b.classList.remove('sel');});
}

function mvLimpiar(){
  _mvMovimientos=[];
  mvInicializar();
  // Limpiar pares de documento
  docsReset('mv');
  // Resetear imágenes
  _mvImagenes = [];
  var imgInp=gel('mv-img-doc');if(imgInp)imgInp.value='';
  _mvImgRender();
  var imgWrap=gel('mv-img-doc-wrap');if(imgWrap)imgWrap.style.display='none';
  // Resetear método de pago y receptor
  var mpWrap=gel('mv-metodo-pago-wrap');if(mpWrap)mpWrap.style.display='none';
  var rw=gel('mv-receptor-efectivo-wrap');if(rw)rw.style.display='none';
  var rs=gel('mv-receptor-efectivo');if(rs)rs.value='';
  mvActualizarMP();
  var n=gel('vsm-nombre');if(n)n.textContent='—';
  var m=gel('vsm-meta');if(m)m.textContent='';
  setSt('Formulario limpiado','ok');setTimeout(function(){setSt('');},1500);
}

// Mantiene clientes_vet al día con lo que el vendedor reporta al registrar una visita
// (nombre, doctora, zona) — sin tocar ventas ni pedirle al vendedor la dirección aquí.
// La dirección/coords/distrito se completan después desde Mi Ruta / Mis Clientes (geocodificación).
// Best-effort: si falla, no debe interrumpir el guardado de la visita.
function mvSincronizarClienteVet(nombreVet,doctora,zona,ruc){
  if(!nombreVet)return Promise.resolve();
  // ilike (no eq): el campo de veterinaria es texto libre con autocompletado,
  // así que dos visitas del mismo cliente pueden llegar con distinta
  // mayúscula/minúscula. Con eq. antes no encontraba la fila existente y
  // creaba un clientes_vet duplicado en vez de actualizar el que ya había
  // (así nació el duplicado "ANIMAL 24 HORAS - san miguel" / "- SAN MIGUEL").
  return sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombreVet)+'&select=id,doctora,zona,ruc')
    .then(function(filas){
      filas=filas||[];
      if(filas.length){
        var actual=filas[0],cambios={};
        if(doctora&&doctora!==actual.doctora)cambios.doctora=doctora;
        if(zona&&zona!==actual.zona)cambios.zona=zona;
        // El RUC no cambia de un cliente a otro: solo lo escribimos si la fila
        // todavía no tiene uno (o el vendedor lo corrigió a algo distinto).
        if(ruc&&ruc!==actual.ruc)cambios.ruc=ruc;
        if(!Object.keys(cambios).length)return;
        return sbU('clientes_vet',actual.id,cambios);
      }
      return sbP('clientes_vet',{nombre_vet:nombreVet,doctora:doctora||null,zona:zona||null,ruc:ruc||null});
    })
    .catch(function(e){ if(window.console)console.warn('No se pudo sincronizar clientes_vet:',e.message); });
}

// "Agrega al menos un movimiento" no es un campo inválido, es un estado
// (la lista está vacía). Se muestra con el mismo estilo .campo-error que
// usa SVUI para mantener la coherencia visual, pero a mano: no hay un
// <input> al que pedirle a SVUI.marcarError que se enganche.
function _mvMostrarErrorSinMovimiento(){
  var p=gel('mv-sin-mov-error'); if(!p) return;
  p.textContent='Esta visita no tiene movimientos. Si solo pasaste a saludar, elige "Sólo visita".';
  p.hidden=false;
  // En móvil este aviso viaja al acordeón junto a los botones: si está
  // cerrado hay que abrirlo o el mensaje no se ve (y scrollIntoView sobre un
  // nodo en display:none no hace nada).
  if(_mvEsMovil()) mvSheetAbrir();
  else p.scrollIntoView({behavior:'smooth',block:'center'});
}
function _mvOcultarErrorSinMovimiento(){
  var p=gel('mv-sin-mov-error'); if(!p) return;
  p.hidden=true; p.textContent='';
}

function mvGuardarVisita(){
  // El botón vive dentro del acordeón en móvil. Se cierra antes de validar:
  // si falta un campo del formulario, SVUI hace scrollIntoView hasta él y la
  // hoja abierta lo taparía. El aviso de "sin movimientos", que sí viaja
  // dentro del acordeón, vuelve a abrirlo por su cuenta.
  mvSheetCerrar();
  // Normalizado a MAYÚSCULAS al guardar (no mientras se escribe, para no
  // pelear con el cursor del autocompletado): así ventas y clientes_vet
  // quedan siempre en el mismo formato y no se generan duplicados por
  // mayúscula/minúscula.
  var vete=(val('mv-vete')||'').toUpperCase(), zona=val('mv-zona'), fecha=val('mv-fecha')||hoy();
  var hora=gel('mv-hora').value||null;
  var doctora=val('mv-doctora')||null;
  var celular=val('mv-celular')||null;
  var ruc=val('mv-ruc')||null;
  var notas=val('mv-notas')||null;
  var catCliente=val('mv-cat')||null;

  var okBase = SVUI.validar([
    {campo:'mv-vete', si:function(v){return !v.trim() && !val('mv-doctora');},
     error:'Escribe la veterinaria o el/la doctor/a. Con uno de los dos basta.'},
    {campo:'mv-zona', si:function(v){return !v;},
     error:'Elige la zona donde fue la visita.'}
  ]);
  if(!okBase) return;

  // "Agrega al menos un movimiento" no tiene un campo al que anclarse (no
  // es un input que falló, es que la lista de movimientos está vacía). Se
  // muestra como un aviso propio junto a los botones de guardar, que es
  // donde el vendedor acaba de hacer clic — no en la barra global de
  // arriba, que en una página de más de 2000px de alto puede quedar fuera
  // de la vista.
  if(!_mvMovimientos.length){
    _mvMostrarErrorSinMovimiento();
    return;
  }
  _mvOcultarErrorSinMovimiento();

  var _docsMv=docsSerializar('mv');
  var tipoDoc=_docsMv.tipo||'';
  var numDoc=_docsMv.nro||'';
  var mpValue=val('mv-metodo-pago')||null;
  var receptorEfectivo=val('mv-receptor-efectivo')||null;
  var imgFiles=(_mvImagenes||[]).slice();
  var tiposConPago=['Venta al contado','Venta delivery','Cobro de credito'];
  var requierePago=_mvMovimientos.some(function(m){return tiposConPago.indexOf(m.tipo)>=0;});
  if(requierePago&&mpValue==='EFECTIVO'&&!receptorEfectivo){
    if(!SVUI.validar([{campo:'mv-receptor-efectivo', si:function(){return true;},
      error:'¿A quién le entregaste el efectivo? Hace falta para cuadrar la caja.'}])) return;
  } else {
    SVUI.limpiarError('mv-receptor-efectivo');
  }
  if(requierePago&&!mpValue){
    SVUI.marcarError('mv-metodo-pago', 'Elige c\u00f3mo se pag\u00f3 para poder guardar la visita.');
    var mpWrap=gel('mv-metodo-pago-wrap');
    if(mpWrap) mpWrap.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  SVUI.limpiarError('mv-metodo-pago');
  if(requierePago&&mpValue!=='EFECTIVO'&&!imgFiles.length){
    SVUI.marcarError('mv-img-doc', 'Falta el comprobante. Adjunta la foto del pago para poder guardar la visita.');
    var imgWrapG=gel('mv-img-doc-wrap');
    if(imgWrapG) imgWrapG.scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  SVUI.limpiarError('mv-img-doc');

  setBL('btn-mv-guardar',true,'Guardando...');

  // Subir im\u00e1genes secuencialmente y juntar URLs
  var imgPromise = imgFiles.length
    ? imgFiles.reduce(function(prev, f, idx){
        return prev.then(function(urls){
          if(setSt && imgFiles.length>1) setSt('Subiendo imagen '+(idx+1)+'/'+imgFiles.length+'...','ld');
          return comprimirImagen(f,4).then(function(c){
            var ext=(c.name.split('.').pop()||'jpg').toLowerCase();
            var path='visita-'+Date.now()+'-'+idx+'.'+ext;
            return fetch(SB+'/storage/v1/object/documentos-venta/'+path,{
              method:'POST',
              headers:{'apikey':AK,'Authorization':'Bearer '+(AUTH_TOKEN||AK),'Content-Type':c.type},
              body:c
            }).then(function(r){
              if(!r.ok)return r.text().then(function(tx){var p={};try{p=JSON.parse(tx);}catch(ex){}throw new Error(p.message||p.error||'Error al subir imagen');});
              urls.push(SB+'/storage/v1/object/public/documentos-venta/'+path);
              return urls;
            });
          });
        });
      }, Promise.resolve([])).then(function(urls){ return urls.join('\n'); })
    : Promise.resolve(null);

  imgPromise.then(function(imgUrl){

  // Build all rows to insert
  var rows=[];
  var credActualizar=[]; // cobros de credito que modifican filas existentes

  for(var i=0;i<_mvMovimientos.length;i++){
    var m=_mvMovimientos[i];
    if(m.tipo==='Cobro de credito'){
      credActualizar.push(m);
    } else if(m.tipo!=='Visita') {
      rows.push({
        vendedor_id:CUR.id, fecha:fecha, hora:hora,
        veterinaria:vete, doctora:doctora, num_medico:celular,
        ruc:ruc,
        zona:zona, movimiento:m.tipo,
        producto:m.prod||'', cantidad:m.cant||0,
        precio_unitario:m.precio||0, total:m.total||0,
        fecha_cobro:m.fechaCobro||null,
        estado:m.estado||'\u2705 Pagado',
        segmento_cliente:catCliente,
        tipo_documento:tipoDoc||null,
        numero_documento:numDoc||null,
        imagen_documento:imgUrl||null,
        metodo_pago:tiposConPago.indexOf(m.tipo)>=0?mpValue:null,
        receptor_efectivo:(tiposConPago.indexOf(m.tipo)>=0&&mpValue==='EFECTIVO')?receptorEfectivo:null,
        notas:notas
      });
      // Regalo: fila aparte con el mismo producto a precio 0, marcada
      // es_regalo=true — así el conteo de "unidades entregadas" del cliente
      // incluye el regalo, pero el total en soles de la venta no se infla.
      if(m.regaloCant>0){
        rows.push({
          vendedor_id:CUR.id, fecha:fecha, hora:hora,
          veterinaria:vete, doctora:doctora, num_medico:celular,
          ruc:ruc,
          zona:zona, movimiento:m.tipo,
          producto:m.prod||'', cantidad:m.regaloCant,
          precio_unitario:0, total:0,
          fecha_cobro:null,
          estado:'✅ Pagado',
          es_regalo:true,
          segmento_cliente:catCliente,
          tipo_documento:null,
          numero_documento:null,
          imagen_documento:imgUrl||null,
          metodo_pago:null,
          receptor_efectivo:null,
          notas:(notas?notas+' · ':'')+'Regalo por compra de '+(m.cant||0)+' uds de '+(m.prod||'')
        });
      }
    }
  }

  // Execute all inserts sequentially
  var promise = Promise.resolve();

  // Insert normal rows
  for(var j=0;j<rows.length;j++){
    (function(row){
      promise = promise.then(function(){ return sbP('ventas', row); });
    })(rows[j]);
  }

  // Handle cobros de credito
  for(var k=0;k<credActualizar.length;k++){
    (function(m){
      promise = promise.then(function(){
        var v=m.credObj, rep=m.rep, fc=m.fecha, fTxt=fmt(fc);
        // Los importes salen de SVCobros. Antes se recalculaban aquí como
        // cantidad × precio: en filas donde ese producto no da el total
        // (descuentos, precios editados a mano) las dos filas resultantes no
        // sumaban el original, y un "Cobrar todo" convertía un crédito de
        // S/ 950 en un cobro de S/ 1,000.
        var notaCobro=(v.notas?v.notas+' | ':'')+SVCobros.notaCobro(v,rep,m.modo,fTxt);
        var _comun={
          estado:'\u2705 Pagado', movimiento:'Cobro de credito',
          fecha:fc, fecha_cobro:fc, notas:notaCobro,
          tipo_documento:tipoDoc||null,
          numero_documento:numDoc||null,
          imagen_documento:imgUrl||null,
          metodo_pago:mpValue,
          receptor_efectivo:mpValue==='EFECTIVO'?receptorEfectivo:null
        };
        // Cobro total: cantidad y total se quedan como estaban.
        var filaCobro=rep.completo
          ? SVCobros.camposCobroTotal(_comun)
          : SVCobros.camposCobroParcial(rep,_comun);

        return sbU('ventas',m.credId,filaCobro).then(function(){
          // Parcial: la fila del saldo. Junto con la anterior suma exactamente
          // el total original, y conserva la fecha de vencimiento ORIGINAL:
          // un cobro parcial no reinicia el plazo.
          if(!rep.completo){
            return sbP('ventas',SVCobros.filaSaldo(v,rep,{
              vendedor_id:CUR.id,
              notas:SVCobros.notaSaldo(v,rep,m.modo,fTxt)
            }));
          }
        });
      });
    })(credActualizar[k]);
  }

  // Also add the visita row (always, as record of visit)
  promise = promise.then(function(){
    var tieneVisita = _mvMovimientos.some(function(m){return m.tipo==='Visita';});
    // Add a visita record if not already explicitly added
    if(!tieneVisita && rows.length > 0){
      // Visita is implicit - already recorded via the other movements
      return Promise.resolve();
    }
    if(tieneVisita){
      return sbP('ventas',{
        vendedor_id:CUR.id, fecha:fecha, hora:hora,
        veterinaria:vete, doctora:doctora, num_medico:celular,
        ruc:ruc,
        zona:zona, movimiento:'Visita',
        producto:'', cantidad:0, precio_unitario:0, total:0,
        estado:'Visita', notas:notas
      });
    }
  });

  promise
  .then(function(){ return loadVentas(); })
  .then(function(){ return mvSincronizarClienteVet(vete,doctora,zona,ruc); })
  .then(function(){
    // Disparar una notificacion por cada movimiento registrado
    for(var ni=0; ni<_mvMovimientos.length; ni++){
      var mov=_mvMovimientos[ni];
      notifyMovement({
        vendedor_id: CUR.id,
        vendedor_nombre: CUR.nombre,
        tipo: mov.tipo,
        total: mov.total||0,
        veterinaria: vete,
        zona: zona,
        doctora: doctora,
        producto: mov.prod||null
      });
    }
    var n=_mvMovimientos.length;
    mvLimpiar();
    setBL('btn-mv-guardar',false,'<svg class="ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-guardar"/></svg> Guardar visita');
    setSt('\u2705 Visita guardada con '+n+' movimiento'+(n!==1?'s':''),'ok');
    if(_mvPostSaveTimer)clearTimeout(_mvPostSaveTimer);
    _mvPostSaveTimer=setTimeout(function(){_mvPostSaveTimer=null;setSt('');goTo('registrar');},3000);
  })
  .catch(function(e){
    setSt(SVUI.error(e,'guardar'),'er');
    setBL('btn-mv-guardar',false,'<svg class="ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-guardar"/></svg> Guardar visita');
  });

  }).catch(function(e){
    setSt(SVUI.error(e,'subir la imagen'),'er');
    setBL('btn-mv-guardar',false,'<svg class="ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-guardar"/></svg> Guardar visita');
  });
}


// ── STEPPER DE 3 PASOS ──
// Antes era decorativo: paso 1 nacía marcado "hecho" y el 2 "activo" pase
// lo que pase, incluso en un formulario recién abierto y vacío. Un progreso
// falso entrena a ignorar el componente — aquí sí refleja el estado real:
//   1. Datos de la visita: hecho cuando hay veterinaria o doctor/a + zona.
//   2. Movimientos: hecho cuando se agregó al menos uno.
//   3. Revisar y guardar: se activa solo cuando 1 y 2 están completos.
function mvActualizarStepper(){
  var datosListos = !!((val('mv-vete') || val('mv-doctora')) && val('mv-zona'));
  var hayMovs = !!(_mvMovimientos && _mvMovimientos.length);

  function paso(id, numero, estado){
    var el = gel(id); if(!el) return;
    el.classList.remove('done','active');
    if(estado) el.classList.add(estado);
    if(estado==='active') el.setAttribute('aria-current','step');
    else el.removeAttribute('aria-current');
    var fsn = el.querySelector('.fsn');
    if(fsn) fsn.innerHTML = (estado==='done')
      ? '<svg class="ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24" style="width:12px;height:12px;"><use href="#i-check"/></svg>'
      : String(numero);
  }

  paso('fwz1', 1, datosListos ? 'done' : 'active');
  paso('fwz2', 2, !datosListos ? '' : (hayMovs ? 'done' : 'active'));
  paso('fwz3', 3, (datosListos && hayMovs) ? 'active' : '');
}

// ── BARRA DE RESUMEN FIJA (solo móvil) ──
// El panel .visit-summary cae al final de una página larga en pantallas
// angostas: se agregaban movimientos sin ver el total hasta hacer scroll
// hasta abajo. Esta barra vive fuera de <main> y se mantiene visible sobre
// la barra de navegación mientras se está en esta pantalla.
function mvActualizarBarraMovil(){
  var bar=gel('mv-mobile-bar'); if(!bar) return;
  var lista=_mvMovimientos||[];
  var total=lista.reduce(function(s,m){return s+(m.total||0);},0);
  var cEl=gel('mv-mobile-bar-count'), tEl=gel('mv-mobile-bar-total');
  if(cEl) cEl.textContent = lista.length ? (lista.length+' movimiento'+(lista.length!==1?'s':'')) : 'Sin movimientos';
  if(tEl) tEl.textContent = money(total);
}

// Alto real de .bottom-nav, no un valor fijo adivinado: varía por
// dispositivo según safe-area-inset-bottom (el "flequillo" del iPhone, la
// barra de gestos de Android). Se mide, no se supone.
function _mvAjustarBarraMovilOffset(){
  var bar=gel('mv-mobile-bar'); if(!bar) return;
  var nav=document.querySelector('.bottom-nav');
  var navH = nav ? nav.offsetHeight : 0;
  bar.style.bottom = navH + 'px';
  // La hoja se apoya sobre la barra, y la barra sobre la navegación: las dos
  // alturas se miden igual que la del nav, no se suponen.
  var sheet=gel('mv-sheet');
  if(sheet) sheet.style.bottom = (navH + bar.offsetHeight) + 'px';
}

// ── ACORDEÓN DE RESUMEN (solo móvil) ──
// La barra dejó de ser un atajo que hacía scroll hasta el final de la página:
// ahora despliega el resumen ahí mismo, con "Guardar visita" incluido. El
// panel y los botones no se duplican — se MUEVEN dentro de la hoja en móvil y
// vuelven a su sitio en escritorio, así que sigue habiendo un solo botón de
// guardar y un solo nodo que mvUpdateSummary() actualiza.
var _mvSheetAbierta = false;

function _mvEsMovil(){ return window.innerWidth <= 768; }

function _mvSheetMontar(dentro){
  var body=gel('mv-sheet-body'); if(!body) return;
  var panel=gel('visit-summary-panel'), acc=gel('mv-acciones');
  var aP=gel('mv-anchor-resumen'), aA=gel('mv-anchor-acciones');
  if(dentro){
    if(panel && panel.parentNode!==body) body.appendChild(panel);
    if(acc && acc.parentNode!==body) body.appendChild(acc);
  } else {
    if(panel && aP && panel.parentNode!==aP.parentNode) aP.parentNode.insertBefore(panel, aP.nextSibling);
    if(acc && aA && acc.parentNode!==aA.parentNode) aA.parentNode.insertBefore(acc, aA.nextSibling);
  }
}

function mvSheetAbrir(){
  if(!_mvEsMovil()) return;
  var sheet=gel('mv-sheet'), bar=gel('mv-mobile-bar'), bd=gel('mv-sheet-backdrop');
  if(!sheet || !bar) return;
  _mvSheetMontar(true);
  sheet.classList.add('show');
  if(bd) bd.classList.add('show');
  bar.classList.add('open');
  bar.setAttribute('aria-expanded','true');
  _mvSheetAbierta = true;
  _mvAjustarBarraMovilOffset();
}

function mvSheetCerrar(){
  var sheet=gel('mv-sheet'), bar=gel('mv-mobile-bar'), bd=gel('mv-sheet-backdrop');
  if(sheet) sheet.classList.remove('show');
  if(bd) bd.classList.remove('show');
  if(bar){ bar.classList.remove('open'); bar.setAttribute('aria-expanded','false'); }
  _mvSheetAbierta = false;
}

function mvSheetToggle(){ _mvSheetAbierta ? mvSheetCerrar() : mvSheetAbrir(); }

// En escritorio el resumen vuelve siempre a su columna sticky: si el acordeón
// quedó abierto y la ventana se ensancha (o se gira la tablet), se cierra y el
// nodo se devuelve a su sitio en el mismo paso.
function _mvSheetSyncLayout(){
  if(_mvEsMovil()) return;
  mvSheetCerrar();
  _mvSheetMontar(false);
}

function mvSyncMobileBar(p){
  var bar=gel('mv-mobile-bar'); if(!bar) return;
  var enPagina = (p==='registrar');
  bar.classList.toggle('show', enPagina);
  if(!enPagina){ mvSheetCerrar(); _mvSheetMontar(false); }
  _mvAjustarBarraMovilOffset();
}

window.addEventListener('resize', function(){
  var bar=gel('mv-mobile-bar');
  if(bar && bar.classList.contains('show')){ _mvSheetSyncLayout(); _mvAjustarBarraMovilOffset(); }
});

document.addEventListener('keydown', function(e){
  if(e.key==='Escape' && _mvSheetAbierta) mvSheetCerrar();
});

function mvUpdateSummary(){
  mvActualizarStepper();
  mvActualizarBarraMovil();
  var vete=val('mv-vete')||'—';
  var n=gel('vsm-nombre');if(n)n.textContent=vete.toUpperCase();
  var m=gel('vsm-meta');
  if(m){var parts=[];
    var fv=gel('mv-fecha');var hv=gel('mv-hora');var dv=val('mv-doctora');
    // SIEMPRE usar la fecha del campo (seleccionada por el usuario); si está vacía, usar hoy()
    var fechaUsada = (fv && fv.value) ? fv.value : hoy();
    parts.push(fmt(fechaUsada));
    if(hv&&hv.value)parts.push(hv.value);
    if(dv)parts.push('Dr/a. '+dv);
    m.textContent=parts.join(' · ');}
  var items=gel('vsm-items'),tr=gel('vsm-total-row'),ta=gel('vsm-total-val'),ts=gel('vsm-total-sub');
  if(!items)return;
  if(!_mvMovimientos||!_mvMovimientos.length){
    items.innerHTML='<div class="vsm-empty"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-bandeja"/></svg></div>Agrega movimientos para ver el resumen aquí.</div>';
    if(tr)tr.style.display='none';return;}
  var html='',total=0;
  for(var i=0;i<_mvMovimientos.length;i++){
    var mv=_mvMovimientos[i],monto=Number(mv.total||mv.monto||0);total+=monto;
    var det='';if(mv.producto)det=mv.producto+(mv.cantidad?' · '+mv.cantidad+' ud':'');
    html+='<div class="vsm-item"><div><div class="vsm-tipo">'+mv.tipo+'</div>'+(det?'<div class="vsm-det">'+det+'</div>':'')+'</div>'+
      (monto>0?'<div class="vsm-amt">S/ '+monto.toFixed(0)+'</div>':'<div class="vsm-amt" style="color:rgba(255,255,255,.35)">—</div>')+'</div>';
  }
  items.innerHTML=html;
  if(tr){tr.style.display='flex';if(ta)ta.textContent='S/ '+total.toFixed(0);if(ts)ts.textContent=_mvMovimientos.length+' movimiento'+(_mvMovimientos.length!==1?'s':'');}
}

// ── AVISO ANTES DE PERDER LA VISITA ──
// Registrar una visita implica subir fotos de comprobantes y a veces varios
// movimientos: son minutos de trabajo. Si el vendedor cierra la pestaña o
// recarga por accidente con movimientos ya agregados pero sin guardar, hoy
// se pierde todo sin aviso. beforeunload dispara el diálogo nativo del
// navegador ("¿Salir sin guardar?") solo cuando hay algo que perder.
// _mvMovimientos vuelve a [] al guardar con éxito (mvLimpiar) y al limpiar
// el formulario a mano, así que el aviso deja de dispararse en cuanto ya
// no hay nada pendiente.
window.addEventListener('beforeunload', function(e){
  if(!_mvMovimientos || !_mvMovimientos.length) return;
  e.preventDefault();
  e.returnValue = ''; // los navegadores modernos ignoran el texto y muestran el suyo propio
});

// ===== MERCADERIA NUEVA =====