// Cargas que fallaron en el último arranque. Antes cada catch se tragaba el
// error en silencio: un vendedor con la red caída veía S/ 0.00 en todo y
// concluía que no había vendido nada.
var _loadErrors = [];

var _navFromHash = false;
var _VALID_PAGES = ['dashboard','registrar','plan','ruta','creditos','mercaderia','historial','pdf','ventas','clientes'];

function goTo(p){
  // Validate page — fall back to dashboard if unknown
  if(_VALID_PAGES.indexOf(p)<0) p='dashboard';

  // Update browser URL so back/forward buttons work
  if(!_navFromHash && location.hash!=='#'+p){
    _navFromHash = true; // prevent hashchange listener from re-running goTo
    try { location.hash = p; } catch(e){}
    _navFromHash = false;
  }

  var pages=document.querySelectorAll('.page');
  for(var i=0;i<pages.length;i++)pages[i].classList.remove('active');
  var pg=gel('page-'+p);if(pg)pg.classList.add('active');

  // El item activo se marcaba comparando el texto visible del menú. Fallaba
  // en tres sitios: 'Mercan' no aparece en "Mi Mercadería", y ni Ventas ni
  // Clientes estaban en la lista, así que esas tres páginas dejaban el menú
  // sin ningún item resaltado. Ahora se compara contra data-page, que es el
  // mismo valor que recibe goTo().
  // aria-current le dice al lector de pantalla cuál es la página actual;
  // sin él, el resaltado solo existe para quien ve la pantalla.
  var navs=document.querySelectorAll('.nav-item, .bn-item, .bn-more-item');
  for(var i=0;i<navs.length;i++){
    var on = navs[i].getAttribute('data-page')===p;
    navs[i].classList.toggle('active', on);
    if(on) navs[i].setAttribute('aria-current','page');
    else   navs[i].removeAttribute('aria-current');
  }
  // Cancel any pending post-save redirect if user navigates manually
  if(p!=='registrar'&&typeof _mvPostSaveTimer!=='undefined'&&_mvPostSaveTimer){clearTimeout(_mvPostSaveTimer);_mvPostSaveTimer=null;}
  if(p==='dashboard')rDash();
  if(p==='creditos')rCreditos();
  if(p==='ventas'){poblarMesesVt();rVentas();}
  if(p==='registrar')mvInicializar();
  if(p==='historial'){poblarMeses();rHist();}
  if(p==='pdf'){if(gel('pdf-mes')&&!gel('pdf-mes').value)gel('pdf-mes').value=hoy().substring(0,7);}
  if(p==='plan')rPlan();
  if(p==='ruta')inicializarRuta();
  if(p==='mercaderia'){rMercaderia();if(typeof rMercaderiaNueva==='function')rMercaderiaNueva();}
  if(p==='clientes'){rClientes();}
  // Muestra/oculta la barra de resumen fija de Registrar Visita. Va aquí,
  // no dentro del bloque de arriba: tiene que ocultarse al salir de la
  // página, no solo mostrarse al entrar.
  if(typeof mvSyncMobileBar==='function') mvSyncMobileBar(p);
}

// Back / forward button support
window.addEventListener('hashchange', function(){
  var p = (location.hash||'').replace(/^#/,'') || 'dashboard';
  _navFromHash = true;
  goTo(p);
  _navFromHash = false;
});

// ── Navegación con tab pre-seleccionado ──
function goToVentasTab(tab){
  goTo('ventas');
  setTimeout(function(){
    var labels={'todos':'Todos','Venta al contado':'Contado','Venta delivery':'Delivery','Cobro de credito':'Cobros'};
    var btns=document.querySelectorAll('#page-ventas .tabs .tab');
    for(var i=0;i<btns.length;i++){
      if(btns[i].textContent.trim()===labels[tab]){fVentas(tab,btns[i]);break;}
    }
  },50);
}
function goToHistTab(tab){
  goTo('historial');
  setTimeout(function(){
    var labels={'todos':'Todos','Venta al contado':'Contado','Venta delivery':'Delivery','Credito a 15 dias':'Credito','Devolucion':'Devolucion','Visita':'Visitas','Cobro de credito':'Cobros'};
    var btns=document.querySelectorAll('#page-historial .tabs .tab');
    for(var i=0;i<btns.length;i++){
      if(btns[i].textContent.trim()===labels[tab]){fHist(tab,btns[i]);break;}
    }
  },50);
}

// Marcaba a mano el item activo de la barra inferior. Ya no hace falta:
// goTo() sincroniza .nav-item, .bn-item y .bn-more-item por data-page.
// Se deja definida por si algún onclick antiguo todavía la invoca.
function setBnA(){}
function toggleBnMore(){gel('bn-mm').classList.toggle('open');gel('bn-ov').classList.toggle('open');}
function closeBnMore(){gel('bn-mm').classList.remove('open');gel('bn-ov').classList.remove('open');}

function initApp(){
  if(!CUR)return;
  if(typeof registerPush==='function')registerPush();
  var el;
  el=gel('sb-name');if(el)el.textContent=CUR.nombre;
  el=gel('sb-role');if(el)el.textContent=CUR.zona?('Zona: '+CUR.zona):'Vendedor';
  el=gel('dash-title');if(el)el.textContent='Hola, '+CUR.nombre.split(' ')[0]+' \ud83d\udc4b';
  el=gel('dash-fecha');if(el)el.textContent=new Date().toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  el=gel('v-fecha');if(el)el.value=hoy();
  el=gel('pdf-mes');if(el)el.value=hoy().substring(0,7);
  el=gel('v-hora');if(el)el.value='';
  setSt('Cargando...','ld');
  _loadErrors=[];
  Promise.all([loadVentas(),loadProductos(),loadZonas()])
  .then(function(){ return Promise.all([loadVeterinarias(), typeof cargarEtiquetasVendedor==='function'?cargarEtiquetasVendedor():null]); })
  .then(function(){loadNiveles().then(function(){
    if(_loadErrors.length){
      setSt('No pudimos cargar: '+_loadErrors.join(', ')+'. Las cifras que ves están incompletas. Revisa tu conexión y recarga.','er');
    }else if(_ventasTotalReal!==null&&_ventasTotalReal>(_ventas||[]).length){
      setSt('Se cargaron '+(_ventas||[]).length+' de tus '+_ventasTotalReal+' movimientos. Tus totales están incompletos: avisa al administrador.','er');
    }else{
      setSt('');
    }
    // Respect hash in URL on first load (bookmark, back button from external page)
    var startPage=(location.hash||'').replace(/^#/,'')||'dashboard';
    if(_VALID_PAGES.indexOf(startPage)<0) startPage='dashboard';
    goTo(startPage);
    inicializarPlan();
    setTimeout(function(){checkVendorStock();setupVeteDropdown();},300);
  });});
}

// Tope de ventas que se traen al navegador. Estaba en 500 y el vendedor con
// más historial ya iba por 411: al cruzarlo, sus totales habrían empezado a
// calcularse sobre un histórico recortado sin que nada lo avisara.
var VENTAS_LIMITE=5000;
var _ventasTotalReal=null;

function loadVentas(){
  _ventasTotalReal=null;
  var filtro='vendedor_id=eq.'+CUR.id;
  return Promise.all([
    sbG('ventas',filtro+'&order=fecha.desc&limit='+VENTAS_LIMITE),
    sbCount('ventas',filtro)
  ])
  .then(function(res){
    _ventas=res[0]||[];
    _ventasTotalReal=res[1];
    // Rebuild doctor/vet maps from fresh ventas data
    _rebuildDoctorMaps();
    // Update credit notification badge in sidebar
    _updateCreditBadge();
  }).catch(function(e){console.error('loadVentas:',e);_loadErrors.push('tus ventas');_ventas=[];});
}

function _updateCreditBadge(){
  var venc=0;
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if((v.movimiento==='Credito a 15 dias'||v.movimiento==='Cr\u00e9dito a 15 d\u00edas')&&
       v.estado!=='\u2705 Pagado'&&v.estado!=='Anulado'&&v.estado!=='\ud83d\udce6 Devuelto'){
      if(v.fecha_cobro){
        var dias=Math.ceil((new Date()-new Date(v.fecha_cobro))/86400000);
        if(dias>0)venc++;
      }
    }
  }
  var badge=gel('nav-cred-badge');
  if(badge){
    if(venc>0){badge.textContent=venc;badge.style.display='inline-block';}
    else{badge.style.display='none';}
  }
}

function _renderCreditAlerts(){
  var box=gel('dash-alert-cred');
  if(!box)return;
  var pendientes=[];
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if((v.movimiento==='Credito a 15 dias'||v.movimiento==='Cr\u00e9dito a 15 d\u00edas')&&
       v.estado!=='\u2705 Pagado'&&v.estado!=='Anulado'&&v.estado!=='\ud83d\udce6 Devuelto'){
      var dias=v.fecha_cobro?Math.ceil((new Date()-new Date(v.fecha_cobro))/86400000):null;
      pendientes.push({v:v,dias:dias});
    }
  }
  // Vencidos: dias > 0 (fecha de cobro ya pasó)
  var vencidos=pendientes.filter(function(x){return x.dias!==null&&x.dias>0;});
  // Por vencer: dias entre -5 y 0 (vence en los próximos 5 días, incluyendo hoy)
  var porVencer=pendientes.filter(function(x){return x.dias!==null&&x.dias<=0&&x.dias>=-5;});

  if(!vencidos.length&&!porVencer.length){box.innerHTML='';return;}

  // Sort vencidos por días desc
  vencidos.sort(function(a,b){return b.dias-a.dias;});

  var html='';
  if(vencidos.length){
    var totalVenc=vencidos.reduce(function(s,x){return s+(x.v.total||0);},0);
    var topClient=vencidos[0].v.veterinaria||vencidos[0].v.doctora||'cliente';
    var topDias=vencidos[0].dias;
    html+='<div class="alert-cred-banner" onclick="goTo(\'creditos\')">'+
      '<div class="alert-cred-icon">\u26a0\ufe0f</div>'+
      '<div class="alert-cred-content">'+
        '<div class="alert-cred-title">Tienes '+vencidos.length+' cr\u00e9dito'+(vencidos.length!==1?'s':'')+' VENCIDO'+(vencidos.length!==1?'S':'')+' por cobrar</div>'+
        '<div class="alert-cred-sub">Total: <strong>'+money(totalVenc)+'</strong> &middot; M\u00e1s urgente: <strong>'+topClient+'</strong> ('+topDias+' d\u00edas vencido)</div>'+
      '</div>'+
      '<div class="alert-cred-arrow">\u203a</div>'+
    '</div>';
  }
  if(porVencer.length){
    var totalPV=porVencer.reduce(function(s,x){return s+(x.v.total||0);},0);
    html+='<div class="alert-cred-banner warning" onclick="goTo(\'creditos\')">'+
      '<div class="alert-cred-icon">\u23f3</div>'+
      '<div class="alert-cred-content">'+
        '<div class="alert-cred-title">'+porVencer.length+' cr\u00e9dito'+(porVencer.length!==1?'s':'')+' por vencer en los próximos 5 días</div>'+
        '<div class="alert-cred-sub">Total: <strong>'+money(totalPV)+'</strong> &middot; Coordina la cobranza con tiempo</div>'+
      '</div>'+
      '<div class="alert-cred-arrow">\u203a</div>'+
    '</div>';
  }
  box.innerHTML=html;
}
function _rebuildDoctorMaps(){
  var allDocSet={};
  for(var i=0;i<_ventas.length;i++){
    var vn=_ventas[i].veterinaria;
    var dn=_ventas[i].doctora;
    var cn=_ventas[i].num_medico||_ventas[i].celular;
    if(vn&&dn){
      if(!_vetDocMap[vn])_vetDocMap[vn]=[];
      if(_vetDocMap[vn].indexOf(dn)<0)_vetDocMap[vn].push(dn);
    }
    if(dn){
      allDocSet[dn]=true;
      if(vn&&!_docMap[vn])_docMap[vn]=dn;
    }
    if(dn&&cn&&!_celMap[dn])_celMap[dn]=cn;
  }
  window._allDoctors=Object.keys(allDocSet).sort(function(a,b){return a.localeCompare(b,'es');});
}

function loadProductos(){
  return sbG('productos','order=nombre.asc')
  .then(function(r){
    _prods=r||[];
    // Filtrar por productos asignados al vendedor si los tiene
    var asig = CUR && CUR.productos_asignados && CUR.productos_asignados.length ? CUR.productos_asignados : null;
    var lista = asig ? _prods.filter(function(p){ return asig.indexOf(p.nombre)>=0; }) : _prods;
    var selIds=['v-prod','mv-prod'];
    for(var s=0;s<selIds.length;s++){
      var sel=gel(selIds[s]);
      if(!sel)continue;
      sel.innerHTML='<option value="">\u2014 Seleccionar \u2014</option>';
      for(var i=0;i<lista.length;i++){
        var p=lista[i];
        var opt=document.createElement('option');
        opt.value=p.nombre;
        opt.textContent=p.nombre+(p.precio_sugerido?' (S/'+Number(p.precio_sugerido).toFixed(2)+')':'');
        opt.dataset.precio=p.precio_sugerido||0;
        sel.appendChild(opt);
      }
    }
  }).catch(function(e){console.error('loadProductos:',e);_loadErrors.push('productos');_prods=[];});
}

// Refresca las zonas asignadas del vendedor en memoria.
//
// Antes esta funci\u00f3n escrib\u00eda en un <select id="v-zona"> que ya no existe:
// el formulario de registro se reh\u00edzo con prefijo "mv-" y qued\u00f3 apuntando a
// un elemento nulo. Llevaba fallando siempre, pero un catch vac\u00edo se tragaba
// el error. Al a\u00f1adir el log sali\u00f3 a la luz.
//
// El desplegable de zonas lo llena _mvPoblarZonas() en registro-visita.js, as\u00ed
// que aqu\u00ed solo se refrescan los datos y se rellena el select si existe.
function loadZonas(){
  return sbG('vendedores','id=eq.'+CUR.id+'&select=zonas_asignadas')
  .then(function(r){
    var asig=(r&&r[0]&&r[0].zonas_asignadas&&r[0].zonas_asignadas.length)?r[0].zonas_asignadas:null;
    if(asig&&CUR)CUR.zonas_asignadas=asig;

    var sel=gel('mv-zona')||gel('v-zona');
    if(!sel)return; // el formulario no est\u00e1 en el DOM: nada que rellenar

    function pintar(lista){
      sel.innerHTML='<option value="">\u2014 Seleccionar zona \u2014</option>';
      lista.forEach(function(nombre){
        var opt=document.createElement('option');
        opt.value=nombre;opt.textContent=nombre;
        sel.appendChild(opt);
      });
    }

    if(asig){pintar(asig);return;}
    return sbG('zonas','order=nombre.asc').then(function(zr){
      pintar((zr||[]).map(function(z){return z.nombre;}));
    });
  }).catch(function(e){console.error('loadZonas:',e);_loadErrors.push('zonas');});
}

function loadVeterinarias(){
  return sbG('clientes_vet','order=nombre_vet.asc&select=nombre_vet,doctora,distrito,'+CV_CAMPOS_PERTENENCIA)
  .then(function(r){
    var base=r||[];
    _docMap={};
    _celMap={};
    _vetDocMap={}; // vet -> [array of doctors]
    var _allDocSet={}; // collect ALL unique doctor names
    // Veterinarias que me pertenecen y aún no tienen ventas registradas
    // — se añaden a "Mis Clientes" como "Nueva en cartera" (vía "+ Añadir cliente").
    _vetsExtra=[];
    var ventasNombres={};
    (_ventas||[]).forEach(function(v){if(v.veterinaria)ventasNombres[v.veterinaria.trim().toLowerCase()]=true;});
    base.forEach(function(cv){
      var k=(cv.nombre_vet||'').trim().toLowerCase();
      if(!k||ventasNombres[k])return; // ya hay ventas, no es "extra"
      if(!esMiCliente(cv))return;     // ni de mis zonas ni transferida a mí
      _vetsExtra.push({nombre:cv.nombre_vet,doctora:cv.doctora||null,zona:cv.zona||null,distrito:cv.distrito||null});
    });
    // Merge con veterinarias de _ventas que no estén en clientes_vet
    var names={};
    for(var i=0;i<base.length;i++){
      names[base[i].nombre_vet]=true;
      if(base[i].doctora){
        _docMap[base[i].nombre_vet]=base[i].doctora;
        if(!_vetDocMap[base[i].nombre_vet])_vetDocMap[base[i].nombre_vet]=[];
        if(_vetDocMap[base[i].nombre_vet].indexOf(base[i].doctora)<0)_vetDocMap[base[i].nombre_vet].push(base[i].doctora);
        _allDocSet[base[i].doctora]=true;
      }
    }
    for(var i=0;i<_ventas.length;i++){
      var vn=_ventas[i].veterinaria;
      var dn=_ventas[i].doctora;
      var cn=_ventas[i].num_medico||_ventas[i].celular;
      if(vn&&!names[vn]){
        names[vn]=true;
        base.push({nombre_vet:vn, doctora:dn||null, zona:_ventas[i].zona||null});
        if(dn)_docMap[vn]=dn;
      }
      // Build multi-doctor map per vet
      if(vn&&dn){
        if(!_vetDocMap[vn])_vetDocMap[vn]=[];
        if(_vetDocMap[vn].indexOf(dn)<0)_vetDocMap[vn].push(dn);
      }
      // Collect ALL doctors (even those without vet)
      if(dn) _allDocSet[dn]=true;
      // Map doctora -> celular
      if(dn&&cn&&!_celMap[dn])_celMap[dn]=cn;
    }
    // Store as sorted array for use in dropdown
    window._allDoctors=Object.keys(_allDocSet).sort(function(a,b){return a.localeCompare(b,'es');});
    base.sort(function(a,b){return (a.nombre_vet||'').localeCompare(b.nombre_vet||'','es');});
    _vetes=base;
    var dl=gel('vete-list');
    if(dl){dl.innerHTML='';
      for(var i=0;i<_vetes.length;i++){
        var opt=document.createElement('option');opt.value=_vetes[i].nombre_vet;dl.appendChild(opt);
      }
    }
  }).catch(function(e){console.error('loadVeterinarias:',e);_loadErrors.push('veterinarias');_vetes=[];});
}