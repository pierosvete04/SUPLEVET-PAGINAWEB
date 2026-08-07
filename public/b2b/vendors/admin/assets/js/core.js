// ══════════════════════════════════════════════════════════════
// CORE: helpers, auth, navegación, modales, carga de datos
// ══════════════════════════════════════════════════════════════

var SB='https://bcahhdszzwearqaafhpa.supabase.co';
var AK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhoZHN6endlYXJxYWFmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODU0OTAsImV4cCI6MjA4OTg2MTQ5MH0.PpmQ5NygRvbItCqdfsO2D2Yb1oVoa7WikmMb8ByMfK0';
var AUTH_TOKEN=null;
var AUTH_REFRESH=null;
// El token se pide a la sesión compartida en cada llamada: así, cuando el
// refresco automático lo renueva, las peticiones en curso ya usan el nuevo
// y no aparecen 401 silenciosos tras una hora con el panel abierto.
function getHeaders(){var token=(window.SVSession&&SVSession.token())||AUTH_TOKEN||AK;return{'apikey':AK,'Authorization':'Bearer '+token,'Content-Type':'application/json','Prefer':'return=representation'};}

// Detecta error espec\u00edfico de RLS del trigger google_contacts_sync_log
// (problema en Supabase: el trigger inserta en una tabla con RLS y falla).
// El usuario debe aplicar SUPABASE-FIX.sql para resolverlo permanentemente.
function _esGContactsRLS(tx){return !!tx && tx.indexOf('google_contacts_sync_log')>=0 && tx.indexOf('row-level security')>=0;}
function _errMsg(status,tx){
  if(_esGContactsRLS(tx)){
    return 'Conflicto de sincronizaci\u00f3n con Google Contacts (RLS). '+
           'Aplica el fix SQL de SUPABASE-FIX.sql en tu proyecto Supabase. '+
           'Mientras tanto los datos no se guardar\u00e1n.';
  }
  return status+': '+tx;
}

// \u2500\u2500 DOCUMENTOS (multi-par tipo+nro) \u2500\u2500
// Permite registrar varios pares (Factura+nro, Gu\u00eda+nro, etc.) en un mismo movimiento.
// Se serializan en las columnas existentes tipo_documento/numero_documento separados por ' | '.
var _DOCS_TIPOS = ['Gu\u00eda de Remisi\u00f3n','Factura','Nota de Cr\u00e9dito','Boleta de venta','Proforma'];
var _docsData = {}; // pfx -> [{tipo:'', nro:''}, ...]

function docsReset(pfx){ _docsData[pfx]=[{tipo:'',nro:''}]; docsRender(pfx); }
function docsCargar(pfx, tipoStr, nroStr){
  var tipos=(tipoStr||'').split(' | ');
  var nros=(nroStr||'').split(' | ');
  var n=Math.max(tipos.length, nros.length, 1);
  var arr=[];
  for(var i=0;i<n;i++) arr.push({tipo:tipos[i]||'', nro:nros[i]||''});
  _docsData[pfx]=arr.length?arr:[{tipo:'',nro:''}];
  docsRender(pfx);
}
function docsAgregar(pfx){
  if(!_docsData[pfx]) _docsData[pfx]=[];
  if(_docsData[pfx].length>=6){ setSt('M\u00e1ximo 6 documentos','er'); setTimeout(function(){setSt('');},2000); return; }
  _docsData[pfx].push({tipo:'',nro:''});
  docsRender(pfx);
}
function docsQuitar(pfx, idx){
  var arr=_docsData[pfx]||[];
  if(idx<0||idx>=arr.length) return;
  arr.splice(idx,1);
  if(!arr.length) arr.push({tipo:'',nro:''});
  docsRender(pfx);
}
function docsActualizar(pfx, idx, campo, valor){
  var arr=_docsData[pfx]||[];
  if(!arr[idx]) return;
  arr[idx][campo]=valor;
}
function docsRender(pfx){
  var box=gel(pfx+'-docs-list'); if(!box) return;
  var arr=_docsData[pfx]||[{tipo:'',nro:''}];
  var html='';
  arr.forEach(function(d, idx){
    var opts='<option value="">Sin documento</option>';
    _DOCS_TIPOS.forEach(function(t){
      opts+='<option'+(d.tipo===t?' selected':'')+'>'+t+'</option>';
    });
    var canRemove=arr.length>1;
    html+='<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;">'+
      '<div class="fgr" style="margin:0;"><label style="font-size:10px;">Tipo</label>'+
        '<select onchange="docsActualizar(\''+pfx+'\','+idx+',\'tipo\',this.value)" '+
        'style="font-size:13px;padding:.46rem .7rem;border:1.5px solid var(--bd);border-radius:var(--r);width:100%;">'+opts+'</select>'+
      '</div>'+
      '<div class="fgr" style="margin:0;"><label style="font-size:10px;">N\u00b0 documento</label>'+
        '<input type="text" value="'+esc(d.nro)+'" placeholder="Ej: F001-000123" '+
        'oninput="docsActualizar(\''+pfx+'\','+idx+',\'nro\',this.value)"/>'+
      '</div>'+
      '<button type="button" onclick="docsQuitar(\''+pfx+'\','+idx+')" '+
        'style="background:'+(canRemove?'#dc2626':'#e5e7eb')+';color:'+(canRemove?'#fff':'#9ca3af')+';border:none;border-radius:8px;width:32px;height:36px;cursor:'+(canRemove?'pointer':'not-allowed')+';font-size:16px;line-height:1;font-weight:bold;" '+
        (canRemove?'':'disabled')+'>\u00d7</button>'+
    '</div>';
  });
  box.innerHTML=html;
}
// Serializa los pares no vac\u00edos a {tipo_documento, numero_documento}
function docsSerializar(pfx){
  var arr=_docsData[pfx]||[];
  var tipos=[], nros=[];
  arr.forEach(function(d){
    if(!d.tipo && !(d.nro||'').trim()) return;
    tipos.push(d.tipo||'');
    nros.push((d.nro||'').trim());
  });
  return {tipo:tipos.join(' | ')||null, nro:nros.join(' | ')||null};
}

// \u2500\u2500 SANEADO DE LO QUE LLEGA DE LA BASE \u2500\u2500
// Este panel s\u00ed escapa con esc() al pintar, pero el saneado en la entrada es
// la segunda barrera: cubre cualquier sitio que se escape del patr\u00f3n y evita
// que un dato con etiquetas llegue siquiera a la memoria del panel.
// Se quitan solo secuencias con forma de etiqueta (<algo ...>), no los "<"
// sueltos, para no alterar un texto leg\u00edtimo como "precio < 100".
var _RX_TAG=/<\s*\/?\s*[a-zA-Z][^>]*>/g;
function _limpiarValor(v){
  if(typeof v==='string') return v.indexOf('<')<0?v:v.replace(_RX_TAG,'');
  if(Array.isArray(v)) return v.map(_limpiarValor);
  if(v&&typeof v==='object'){
    for(var k in v){ if(Object.prototype.hasOwnProperty.call(v,k)) v[k]=_limpiarValor(v[k]); }
  }
  return v;
}

// Cuenta exacta de filas sin tra\u00e9rselas. Sirve para saber si lo que cargamos
// es todo: no basta con comparar contra nuestro propio l\u00edmite, porque Supabase
// aplica adem\u00e1s su tope de filas (max-rows) y recorta sin avisar.
// PostgREST devuelve el total en la cabecera Content-Range ("0-0/924").
function sbCount(t,q){
  var h=getHeaders();
  h['Prefer']='count=exact';
  h['Range']='0-0';
  return fetch(SB+'/rest/v1/'+t+(q?'?'+q:''),{headers:h})
    .then(function(r){
      var cr=r.headers.get('content-range')||'';
      var total=cr.split('/')[1];
      return (!total||total==='*')?null:parseInt(total,10);
    })
    .catch(function(){return null;});
}

// \u2500\u2500 SUPABASE HELPERS \u2500\u2500
function sbG(t,q){return fetch(SB+'/rest/v1/'+t+(q?'?'+q:''),{headers:getHeaders()}).then(function(r){if(!r.ok)return r.text().then(function(tx){throw new Error(_errMsg(r.status,tx));});return r.json();}).then(_limpiarValor);}
function sbP(t,b){return fetch(SB+'/rest/v1/'+t,{method:'POST',headers:getHeaders(),body:JSON.stringify(b)}).then(function(r){if(!r.ok)return r.text().then(function(tx){throw new Error(_errMsg(r.status,tx));});return r.json().catch(function(){return null;});});}
function sbU(t,id,b){return fetch(SB+'/rest/v1/'+t+'?id=eq.'+id,{method:'PATCH',headers:getHeaders(),body:JSON.stringify(b)}).then(function(r){if(!r.ok)return r.text().then(function(tx){throw new Error(_errMsg(r.status,tx));});return r.json().catch(function(){return null;});});}
function sbDel(t,q){return fetch(SB+'/rest/v1/'+t+'?'+q,{method:'DELETE',headers:getHeaders()}).then(function(r){if(!r.ok)throw new Error(r.status);return null;});}
// Fusiona dos filas de clientes_vet que resultaron ser el mismo cliente
// (p.ej. "Sash Vet - Ate" y "Sash - Salamanca" eran la misma clínica).
// `newRow` (la fila con el nombre destino) sobrevive; `oldRow` se borra
// después de:
//  1. copiar a newRow los campos que newRow no tenga (rellenar huecos)
//  2. reasignar visitas_dia.cliente_id de oldRow.id -> newRow.id
//     (la FK es ON DELETE CASCADE: si no reasignamos antes, borrar oldRow
//     borraría también esas visitas programadas)
function mergeClientesVet(oldRow,newRow,extraPatch){
  var FILL=['doctora','direccion','distrito','latitud','longitud','num_medico','tiempo_visita_minutos'];
  var patch={};
  FILL.forEach(function(f){
    if((newRow[f]===null||newRow[f]===undefined||newRow[f]==='')&&oldRow[f]!=null&&oldRow[f]!=='')patch[f]=oldRow[f];
  });
  if(extraPatch)Object.keys(extraPatch).forEach(function(k){if(extraPatch[k])patch[k]=extraPatch[k];});
  var p=Object.keys(patch).length?sbU('clientes_vet',newRow.id,patch):Promise.resolve();
  return p
    .then(function(){
      return fetch(SB+'/rest/v1/visitas_dia?cliente_id=eq.'+oldRow.id,{
        method:'PATCH',headers:getHeaders(),body:JSON.stringify({cliente_id:newRow.id})
      }).then(function(r){if(!r.ok)return r.text().then(function(tx){throw new Error('visitas_dia: '+tx);});});
    })
    .then(function(){return sbDel('clientes_vet','id=eq.'+oldRow.id);});
}
function gel(id){return document.getElementById(id);}
function val(id){var e=gel(id);return e?e.value.trim():'';}
function hoy(){return new Date().toISOString().split('T')[0];}
function fmt(d){if(!d)return '---';var p=d.substring(0,10).split('-');return p[2]+'/'+p[1]+'/'+p[0];}
function money(n){return 'S/ '+Number(n||0).toFixed(2);}
function setSt(msg,type){var el=gel('st-global');if(!el)return;el.innerHTML=msg?'<div class="alert a'+(type||'i')+'">'+msg+'</div>':'';};
// innerHTML y no textContent: así el texto puede incluir el icono SVG del
// botón sin perderlo cada vez que se restaura. Todos los llamantes pasan
// texto plano sin '<' ni '&', así que el cambio no altera nada existente.
function setBL(id,disabled,txt){var b=gel(id);if(!b)return;b.disabled=disabled;if(txt)b.innerHTML=txt;}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function escAttr(s){return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/</g,'&lt;');}
function movNorm(m){return String(m||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();}
function esVentaPagada(mov,est){var m=movNorm(mov);return est==='✅ Pagado'&&(m.indexOf('contado')>-1||m.indexOf('delivery')>-1||m.indexOf('cobro')>-1);}
function esDevolucion(mov){return movNorm(mov).indexOf('devolucion')>-1;}
function esCredito15(mov){var m=movNorm(mov);return m.indexOf('credito a 15')>-1||m.indexOf('crédito a 15')>-1;}
function diasDesde(fechaIso){if(!fechaIso)return 0;var p=String(fechaIso).substring(0,10).split('-');if(p.length<3)return 0;var d1=Date.UTC(+p[0],+p[1]-1,+p[2]);var h=new Date();var d2=Date.UTC(h.getFullYear(),h.getMonth(),h.getDate());return Math.round((d2-d1)/86400000);}
function diasHasta(fechaIso){return -diasDesde(fechaIso);}
var DIAS_POR_VENCER_ALERTA=5;
var DIAS_POR_VENCER_REPORTE=5;

// ── AUTH ──
// La autenticación vive en el shell compartido (/assets/js/session.js).
// Este panel ya no tiene login propio: solo comprueba que quien llega
// traiga rol admin, y toma de ahí el token para hablar con Supabase.
function bootSession(){
  return SVSession.require('admin').then(function(s){
    AUTH_TOKEN=SVSession.token();
    _adminId=s.user.id;
    _adminNombre=s.user.nombre||'Admin';
    _adminRol=s.user.rol||'admin';
    var el=gel('sb-admin-nombre');if(el)el.textContent=_adminNombre;
    var el2=gel('sb-admin-rol');if(el2)el2.textContent=(_adminRol==='superadmin')?'Super Admin':'Administrador';
    return s;
  });
}

function doLogout(){
  showConfirm(
    'Vas a salir del panel. Para volver tendrás que ingresar otra vez.',
    'Cerrar sesión',
    'Cerrar sesión',
    function(){ SVSession.logout(); }
  );
}

// \u2500\u2500 GLOBAL DATA \u2500\u2500
var _adminNombre='Admin';
var _adminRol='admin';
var _adminId=null;
var _vendedores=[];
var _ventas=[];
var _productos=[];
var _zonas=[];
var _movimientos=[];
var _materiales=[];
var _invMov=[];
var _segmentos=[];
var _clientesVet=[];
var _invLastPage='inv-historial';
var _filtVendedor='';
var _histPag=1;
var _hFil='todos';

// \u2500\u2500 HELPERS \u2500\u2500
function bEst(e){
  var m={'\u2705 Pagado':'b-pagado','\u23f3 Pendiente':'b-pendiente','\u274c Vencido':'b-vencido','\ud83d\udce6 Devuelto':'b-devuelto','Anulado':'b-devuelto','Visita':'b-visita'};
  return '<span class="b '+(m[e]||'b-pendiente')+'">'+esc(e||'---')+'</span>';
}
function bMov(m){
  var mp={'Venta al contado':'b-contado','Venta delivery':'b-delivery','Credito a 15 dias':'b-credito','Cr\u00e9dito a 15 d\u00edas':'b-credito','Cobro de credito':'b-contado','Devolucion':'b-devolucion','Devoluci\u00f3n':'b-devolucion','Visita':'b-visita'};
  return '<span class="b '+(mp[m]||'b-contado')+'">'+esc(m||'---')+'</span>';
}
// Versiones para PDF (sin CSS variables)
function bEstPdf(e){
  var col={'✅ Pagado':'#2d7a3a','⏳ Pendiente':'#92400e','❌ Vencido':'#c0392b','Anulado':'#718096','Visita':'#1e6e77'};
  var bg={'✅ Pagado':'#e8f5ea','⏳ Pendiente':'#fffbeb','❌ Vencido':'#fdf0ef','Anulado':'#f7fafc','Visita':'#eaf7f9'};
  var c=col[e]||'#718096',b=bg[e]||'#f7fafc';
  return '<span style="background:'+b+';color:'+c+';border-radius:4px;padding:2px 7px;font-size:11px;font-weight:700;">'+(e||'---')+'</span>';
}
function bMovPdf(m){
  var col={'Venta al contado':'#2d7a3a','Venta delivery':'#3b82f6','Credito a 15 dias':'#d97706','Crédito a 15 días':'#d97706','Devolucion':'#c0392b','Devolución':'#c0392b','Visita':'#718096','Cobro de credito':'#0891b2'};
  var bg={'Venta al contado':'#e8f5ea','Venta delivery':'#eff6ff','Credito a 15 dias':'#fffbeb','Crédito a 15 días':'#fffbeb','Devolucion':'#fdf0ef','Devolución':'#fdf0ef','Visita':'#f7fafc','Cobro de credito':'#ecfeff'};
  var c=col[m]||'#253C61',b=bg[m]||'#eaf7f9';
  return '<span style="background:'+b+';color:'+c+';border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600;">'+(m||'---')+'</span>';
}
function getNombreVendedor(id){
  for(var i=0;i<_vendedores.length;i++){if(_vendedores[i].id===id)return _vendedores[i].nombre;}
  return '---';
}
function stockVendedor(vendId){
  var stk={};
  for(var i=0;i<_movimientos.length;i++){
    var m=_movimientos[i];
    if(m.vendedor_id===vendId&&m.tipo==='salida'&&m.categoria==='producto')
      stk[m.item_nombre]=(stk[m.item_nombre]||0)+m.cantidad;
  }
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if(v.vendedor_id!==vendId||v.movimiento==='Visita'||v.estado==='Anulado'||!v.producto) continue;
    if(esDevolucion(v.movimiento)) stk[v.producto]=(stk[v.producto]||0)+Math.abs(v.cantidad||0);
    else stk[v.producto]=(stk[v.producto]||0)-(v.cantidad||0);
  }
  var items=[];for(var k in stk){if(stk[k]>0)items.push({n:k,c:stk[k]});}
  return items;
}

// \u2500\u2500 UTILIDAD: COMPRIMIR IMAGEN ANTES DE SUBIR \u2500\u2500
function comprimirImagen(file, maxMB){
  return new Promise(function(resolve){
    var maxBytes=(maxMB||4)*1024*1024;
    if(!file.type.startsWith('image/')||file.size<=maxBytes){resolve(file);return;}
    var reader=new FileReader();
    reader.onload=function(e){
      var img=new Image();
      img.onload=function(){
        var W=1920,H=1920,w=img.width,h=img.height;
        if(w>W){h=Math.round(h*W/w);w=W;}
        if(h>H){w=Math.round(w*H/h);h=H;}
        var cvs=document.createElement('canvas');cvs.width=w;cvs.height=h;
        cvs.getContext('2d').drawImage(img,0,0,w,h);
        var q=0.85;
        (function tryBlob(){
          cvs.toBlob(function(blob){
            if(!blob){resolve(file);return;}
            if(blob.size<=maxBytes||q<0.3){
              resolve(new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'}));
            }else{q-=0.1;tryBlob();}
          },'image/jpeg',q);
        })();
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// \u2500\u2500 LOAD DATA \u2500\u2500
// Tablas que fallaron en la última carga. Antes cada fallo escribía en la
// barra de estado, pero initApp la limpiaba justo después: el admin acababa
// mirando un dashboard en ceros sin saber que los datos no habían llegado.
var _loadErrors=[];
function _loadOne(tabla,q,assign){
  return sbG(tabla,q).then(function(r){assign(r||[]);}).catch(function(e){
    console.error('loadAll['+tabla+']:',e);
    _loadErrors.push(tabla);
    assign([]);
  });
}
// Tope explícito. Antes no había ninguno, así que el corte lo ponía Supabase
// (1000 filas por defecto) sin decirlo: los totales del dashboard se habrían
// calculado sobre un histórico recortado y presentado como si fuera completo.
var VENTAS_LIMITE=20000;
var _ventasTotalReal=null;

function loadAll(){
  _loadErrors=[];
  _ventasTotalReal=null;
  return Promise.all([
    _loadOne('vendedores','order=nombre.asc',function(r){_vendedores=r;}),
    _loadOne('ventas','order=created_at.desc&limit='+VENTAS_LIMITE,function(r){_ventas=r;}),
    // En paralelo, el total real, para detectar cualquier recorte.
    sbCount('ventas').then(function(total){_ventasTotalReal=total;}),
    _loadOne('productos','order=nombre.asc',function(r){_productos=r;}),
    _loadOne('zonas','order=nombre.asc',function(r){_zonas=r;}),
    _loadOne('movimientos','tipo=eq.salida&categoria=eq.producto&order=created_at.desc',function(r){_movimientos=r;}),
    _loadOne('materiales','order=nombre.asc',function(r){_materiales=r;}),
    _loadOne('movimientos','order=created_at.desc&limit=500',function(r){_invMov=r;}),
    _loadOne('segmentos_vendedor','order=nombre.asc',function(r){_segmentos=r;}),
    // Los niveles se cargaban solo al abrir su página, así que anNivelVendedor()
    // devolvía null en analíticas, dashboard y PDFs mientras no la visitaras.
    // Ahora entran con el resto de datos y están siempre disponibles.
    _loadOne('niveles_config','order=orden.asc',function(r){_niveles=r;}),
    _loadOne('clientes_vet','select=nombre_vet,doctora,zona,direccion,distrito,num_medico,ruc&order=nombre_vet.asc',function(r){_clientesVet=r;})
  ]);
}

// \u2500\u2500 NAVIGATION \u2500\u2500
function _runPageFn(p){
  if(p==='dashboard')rDash();
  if(p==='vendedores'){rVendedores();rSegmentos();}
  if(p==='creditos')rCreditos();
  if(p==='ventas'){poblarVentasFiltros();rVentas();}
  if(p==='historial'){poblarFiltros();rHist();}
  if(p==='planes')rPlanes();
  if(p==='zonas')rZonas();
  if(p==='zona-det')rZonaDetalle();
  if(p==='mercaderia'){
    var sm=gel('merch-filtro-vend');
    if(sm&&sm.options.length<=1){
      sm.innerHTML='<option value="">Todos los vendedores</option>';
      _vendedores.forEach(function(v){var o=document.createElement('option');o.value=v.id;o.textContent=v.nombre;sm.appendChild(o);});
    }
    rMercaderia();
  }
  if(p==='analiticas')rAnaliticas();
  if(p==='reg-visita')rRegVisita();
  if(p==='clientes')rClientesAdmin();
  if(p==='rutas')rRutasAdmin();
  if(p==='reportes')rReportes();
  if(p==='liquidacion')rLiquidacion();
  if(p==='inv-historial'){_invLastPage='inv-historial';rInvHist();}
  if(p==='inv-personas'){_invLastPage='inv-personas';rInvPersonas();}
  if(p==='inv-productos'){_invLastPage='inv-productos';rInvProd();}
  if(p==='inv-materiales'){_invLastPage='inv-materiales';rInvMat();}
  if(p==='stock-alerta')rStockProyeccion();
}

// ── PDF FAVICON ──
var _PDF_FAVICON_TAG='';
document.addEventListener('DOMContentLoaded',function(){
  var fav=document.querySelector('link[rel="icon"]');
  if(fav&&fav.href)_PDF_FAVICON_TAG='<link rel="icon" type="image/png" href="'+fav.href+'">';
});
function _pdfFavicon(){return _PDF_FAVICON_TAG;}

// ── BOTTOM NAV ──
var _bnMoreOpen=false;
function toggleBnMore(){
  _bnMoreOpen=!_bnMoreOpen;
  var menu=gel('bn-more-menu'),overlay=gel('bn-overlay'),btn=gel('bn-more-btn');
  if(menu)menu.classList.toggle('open',_bnMoreOpen);
  if(overlay)overlay.classList.toggle('open',_bnMoreOpen);
  if(btn)btn.classList.toggle('active',_bnMoreOpen);
}
function closeBnMore(){
  _bnMoreOpen=false;
  var menu=gel('bn-more-menu'),overlay=gel('bn-overlay'),btn=gel('bn-more-btn');
  if(menu)menu.classList.remove('open');
  if(overlay)overlay.classList.remove('open');
  if(btn)btn.classList.remove('active');
}
function _syncBottomNav(p){
  var primary=['dashboard','ventas','creditos','analiticas'];
  document.querySelectorAll('.bn-item[data-page]').forEach(function(b){
    b.classList.remove('active');
    b.removeAttribute('aria-current');
  });
  var isPrimary=primary.indexOf(p)>-1;
  if(isPrimary){
    var match=document.querySelector('.bn-item[data-page="'+p+'"]');
    if(match){match.classList.add('active');match.setAttribute('aria-current','page');}
  }
}

// ── GRUPOS PLEGABLES DEL MENÚ ──
// Inteligencia e Inventario agrupan varias secciones cada uno. Tenerlas todas
// sueltas dejaba una barra lateral larguísima donde costaba encontrar nada.
var NAV_GRUPOS=['inteligencia','inventario'];

function toggleNavGrupo(id){
  var btn=gel('grp-'+id), sub=gel('sub-'+id);
  if(!btn||!sub)return;
  var abierto=!sub.classList.contains('open');
  sub.classList.toggle('open',abierto);
  btn.classList.toggle('open',abierto);
  btn.setAttribute('aria-expanded',String(abierto));
  // Se recuerda para que no haya que reabrirlo en cada carga.
  try{localStorage.setItem('sv_nav_'+id,abierto?'1':'0');}catch(e){}
}

function _abrirGrupo(id,recordar){
  var btn=gel('grp-'+id), sub=gel('sub-'+id);
  if(!btn||!sub||sub.classList.contains('open'))return;
  sub.classList.add('open');
  btn.classList.add('open');
  btn.setAttribute('aria-expanded','true');
  if(recordar){try{localStorage.setItem('sv_nav_'+id,'1');}catch(e){}}
}

// Al navegar a una sección que vive dentro de un grupo, el grupo se abre solo:
// si no, el item marcado como activo quedaría escondido.
function _abrirGrupoDe(p){
  var item=document.querySelector('.nav-sub .nav-item[data-page="'+p+'"]');
  if(!item)return;
  var sub=item.parentNode;
  if(sub&&sub.id&&sub.id.indexOf('sub-')===0)_abrirGrupo(sub.id.slice(4),false);
}

function _restaurarNavGrupos(){
  NAV_GRUPOS.forEach(function(id){
    var guardado=null;
    try{guardado=localStorage.getItem('sv_nav_'+id);}catch(e){}
    if(guardado==='1')_abrirGrupo(id,false);
  });
}

function goTo(p){
  var next=gel('page-'+p);
  if(!next)return;
  // Muestra/oculta la barra de resumen fija de Registrar Visita. Va aquí
  // arriba, antes de las ramas de animación, para que corra exactamente
  // una vez por navegación sin importar cuál de los dos caminos tome
  // goTo() (con o sin GSAP) — incluida la ocultación al salir de la página.
  if(typeof rvSyncMobileBar==='function') rvSyncMobileBar(p);
  // Actualizar URL sin recargar la página; replaceState cuando venimos de popstate para no duplicar historial
  try{ if(_goToFromPopstate){history.replaceState({page:p},'','#'+p);}else{history.pushState({page:p},'','#'+p);} }catch(e){ try{ location.hash=p; }catch(_){} }
  var current=document.querySelector('.page.active');
  // aria-current le dice al lector de pantalla cuál es la sección actual.
  // Sin él, el resaltado del menú solo existe para quien ve la pantalla.
  document.querySelectorAll('.nav-item').forEach(function(n){
    n.classList.remove('active');
    n.removeAttribute('aria-current');
  });
  document.querySelectorAll('.nav-item[data-page="'+p+'"]').forEach(function(n){
    n.classList.add('active');
    n.setAttribute('aria-current','page');
  });
  _abrirGrupoDe(p);
  _syncBottomNav(p);
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced||!window.gsap||current===next){
    if(current&&current!==next)current.classList.remove('active');
    next.classList.add('active');
    _runPageFn(p);
    return;
  }
  if(current&&current!==next){
    gsap.to(current,{opacity:0,y:-8,duration:.16,ease:'power1.in',onComplete:function(){
      current.classList.remove('active');
      gsap.set(current,{opacity:1,y:0});
      next.classList.add('active');
      gsap.fromTo(next,{opacity:0,y:12},{opacity:1,y:0,duration:.22,ease:'power2.out'});
      _runPageFn(p);
    }});
  }else{
    next.classList.add('active');
    gsap.fromTo(next,{opacity:0,y:12},{opacity:1,y:0,duration:.22,ease:'power2.out'});
    _runPageFn(p);
  }
}

// \u2500\u2500 CONFIRM MODAL \u2500\u2500
function showConfirm(msg, titulo, btnLabel, callback){
  gel('confirm-msg').innerHTML=msg;
  gel('confirm-titulo').textContent=titulo||'Confirmar acci\u00f3n';
  gel('btn-confirm-ok').textContent=btnLabel||'Confirmar';
  gel('btn-confirm-ok').onclick=function(){cerrarModal('modal-confirm');if(callback)callback();};
  abrirModal('modal-confirm');
}

// \u2500\u2500 TOAST NOTIFICATIONS \u2500\u2500
function showToast(msg,type){
  if(!window.gsap){return;}
  var colors={ok:getComputedStyle(document.documentElement).getPropertyValue('--ok').trim()||'#2d7a3a',er:getComputedStyle(document.documentElement).getPropertyValue('--er').trim()||'#c0392b',warn:'#92400e',info:getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()||'#253C61'};
  var icons={ok:'\u2713',er:'\u2715',warn:'\u26a0',info:'\u2139'};
  var t=document.createElement('div');
  t.className='app-toast';
  t.style.borderLeftColor=colors[type]||colors.info;
  t.innerHTML='<span class="toast-icon" style="color:'+(colors[type]||colors.info)+'">'+(icons[type]||icons.info)+'</span><span>'+msg+'</span>';
  document.body.appendChild(t);
  gsap.fromTo(t,{x:50,autoAlpha:0},{x:0,autoAlpha:1,duration:.28,ease:'power2.out'});
  gsap.to(t,{autoAlpha:0,x:20,duration:.24,ease:'power1.in',delay:3.2,onComplete:function(){if(t.parentNode)t.parentNode.removeChild(t);}});
}

// \u2500\u2500 DASHBOARD \u2500\u2500

// ── MODALES E INICIALIZACIÓN ──
// El cierre dependía por completo del onComplete de GSAP, que a su vez
// depende de requestAnimationFrame. Con la pestaña en segundo plano, el
// dispositivo en ahorro de energía, o cualquier frame perdido, ese callback
// puede no llegar a dispararse nunca — el modal se queda "atascado" abierto
// y el clic de cerrar (o el clic fuera) parece no hacer nada, aunque
// cerrarModal() sí se ejecutó. Un timeout de respaldo fuerza el cierre si
// la animación no terminó a tiempo, sin depender solo de su callback.
function cerrarModal(id){
  var m=gel(id);
  if(!m)return;
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(window.gsap&&!reduced){
    var inner=m.querySelector('.md');
    if(inner){
      var yaCerrado=false;
      var terminar=function(){
        if(yaCerrado)return;
        yaCerrado=true;
        m.classList.remove('open');
        gsap.set(inner,{y:0,opacity:1,scale:1});
      };
      gsap.to(inner,{y:10,opacity:0,scale:.97,duration:.18,ease:'power1.in',onComplete:terminar});
      setTimeout(terminar,400);
      return;
    }
  }
  m.classList.remove('open');
}
function abrirModal(id){
  var m=gel(id);
  if(!m)return;
  m.classList.add('open');
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(window.gsap&&!reduced){
    var inner=m.querySelector('.md');
    if(inner){
      gsap.fromTo(inner,{y:18,opacity:0,scale:.96},{y:0,opacity:1,scale:1,duration:.25,ease:'back.out(1.4)'});
      // Mismo respaldo: si la animación de entrada no completa, el modal
      // quedaría visualmente a medio abrir (opacity/escala intermedios)
      // aunque la clase .open ya esté puesta.
      setTimeout(function(){ gsap.set(inner,{y:0,opacity:1,scale:1}); },400);
    }
  }
}

// \u2500\u2500 PUSH NOTIFICATIONS \u2500\u2500
var _VAPID_PUB='BOPhRuWpTV6jRgkM3WTUAiEYDVeOspkWPE_P1XeXKm0ufOgbXom3pfk1yZ8vp2ojUkX_k_pa9du_PcGm29tu0Y0';
function _b64ToUint8(b){
  var pad='='.repeat((4-b.length%4)%4);
  var base64=(b+pad).replace(/-/g,'+').replace(/_/g,'/');
  var raw=window.atob(base64);
  var out=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}
function registerPush(){
  if(!('serviceWorker' in navigator)||!('PushManager' in window))return;
  if(!_adminId)return;
  navigator.serviceWorker.ready.then(function(reg){
    return reg.pushManager.getSubscription().then(function(ex){
      if(ex)return ex;
      return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:_b64ToUint8(_VAPID_PUB)});
    });
  }).then(function(sub){
    if(!sub)return;
    var h=getHeaders();
    h['Prefer']='resolution=merge-duplicates,return=minimal';
    return fetch(SB+'/rest/v1/push_subscriptions?on_conflict=vendedor_id',{
      method:'POST',
      headers:h,
      body:JSON.stringify({vendedor_id:_adminId,subscription:sub.toJSON(),updated_at:new Date().toISOString()})
    });
  }).catch(function(){});
}

// \u2500\u2500 INIT \u2500\u2500
function initApp(){
  registerPush();
  _restaurarNavGrupos();
  setSt('Cargando datos...','ld');
  loadAll().then(function(){
    if(_loadErrors.length){
      // Decir qué falta y qué significa: un dashboard en ceros por un fallo de
      // red es indistinguible de un mes sin ventas si nadie lo avisa.
      setSt('No se pudieron cargar: '+_loadErrors.join(', ')+'. Las cifras que ves están incompletas. Recarga la página para reintentar.','er');
    }else if(_ventasTotalReal!==null&&_ventasTotalReal>(_ventas||[]).length){
      setSt('Se cargaron '+(_ventas||[]).length+' ventas de '+_ventasTotalReal+' que hay en total. Los importes de este panel están incompletos: hay que paginar la carga o subir el tope de filas en Supabase.','er');
    }else{
      setSt('');
    }
    var el=gel('dash-fecha');if(el)el.textContent=new Date().toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    // Navegar a la pestaña del hash si existe, si no al dashboard
    var hash=location.hash.replace(/^#/,'');
    if(hash && gel('page-'+hash)){ goTo(hash); } else { rDash(); }
  }).catch(function(e){setSt(SVUI.error(e,'cargar los datos'),'er');});
}

// Botón atrás/adelante del navegador
window.addEventListener('popstate',function(e){
  var p=(e.state&&e.state.page)||location.hash.replace(/^#/,'');
  if(p && gel('page-'+p)){_goToFromPopstate=true;goTo(p);_goToFromPopstate=false;}
});
var _goToFromPopstate=false;

// \u2500\u2500 DOM READY \u2500\u2500
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.mo').forEach(function(o){
    o.addEventListener('click',function(e){if(e.target===o)cerrarModal(o.id);});
  });
  // Cerrar el modal abierto con Escape (antes solo se pod\u00eda con el clic de fuera).
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape')return;
    var abierto=document.querySelector('.mo.open');
    if(abierto)cerrarModal(abierto.id);
  });
  // El guard resuelve solo si hay sesi\u00f3n con rol admin; si no, redirige \u00e9l mismo.
  bootSession().then(function(){
    gel('app-boot').hidden=true;
    initApp();
  });
});


