
var SB='https://bcahhdszzwearqaafhpa.supabase.co';
var AK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhoZHN6endlYXJxYWFmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODU0OTAsImV4cCI6MjA4OTg2MTQ5MH0.PpmQ5NygRvbItCqdfsO2D2Yb1oVoa7WikmMb8ByMfK0';
var AUTH_TOKEN=null;
var AUTH_REFRESH=null;

// El token se pide a la sesión compartida en cada llamada: así, cuando el
// refresco automático lo renueva, las peticiones ya usan el nuevo y no
// aparecen 401 silenciosos tras una hora con el panel abierto.
function getHeaders(){
  var token=(window.SVSession&&SVSession.token())||AUTH_TOKEN||AK;
  return{'Content-Type':'application/json','apikey':AK,'Authorization':'Bearer '+token,'Prefer':'return=representation'};
}

// ── ESCAPE PARA HTML ──
// Convierte los caracteres que el navegador interpretaría como marcado en
// texto inofensivo. Úsalo siempre que metas un dato de la base dentro de
// una plantilla HTML.
function esc(s){
  return String(s==null?'':s).replace(/[&<>"']/g,function(c){
    return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
  });
}

// ── SANEADO DE LO QUE LLEGA DE LA BASE ──
// Este panel construye su HTML pegando texto (82 sitios con innerHTML), así
// que un nombre de veterinaria como "<img src=x onerror=...>" se ejecutaría
// al pintarlo. Aquí se quitan las etiquetas HTML de TODO lo que entra, que
// es el único punto por el que pasan las lecturas.
//
// Se eliminan solo secuencias con forma de etiqueta (<algo ...>), no los "<"
// sueltos: así un texto legítimo como "precio < 100" se conserva intacto.
var _RX_TAG=/<\s*\/?\s*[a-zA-Z][^>]*>/g;
function _limpiarTexto(s){
  return s.indexOf('<')<0 ? s : s.replace(_RX_TAG,'');
}
function _limpiarValor(v){
  if(typeof v==='string') return _limpiarTexto(v);
  if(Array.isArray(v)) return v.map(_limpiarValor);
  if(v&&typeof v==='object'){
    for(var k in v){ if(Object.prototype.hasOwnProperty.call(v,k)) v[k]=_limpiarValor(v[k]); }
  }
  return v;
}

// Devuelve el cuerpo del error en vez de solo el código: "400" no le dice
// nada a nadie cuando algo falla en producción.
function _sbError(r){
  return r.text().then(function(tx){throw new Error(r.status+': '+tx);});
}

function sbG(t,q){
  return fetch(SB+'/rest/v1/'+t+'?'+(q||''),{headers:getHeaders()})
    .then(function(r){if(!r.ok)return _sbError(r);return r.json();})
    .then(_limpiarValor);
}
// Cuenta exacta de filas sin traérselas. Sirve para saber si lo cargado es
// todo: no basta con comparar contra nuestro propio límite, porque Supabase
// aplica además su tope de filas (max-rows) y recorta sin avisar.
// PostgREST devuelve el total en la cabecera Content-Range ("0-0/924").
function sbCount(t,q){
  var h=getHeaders();
  h['Prefer']='count=exact';
  h['Range']='0-0';
  return fetch(SB+'/rest/v1/'+t+'?'+(q||''),{headers:h})
    .then(function(r){
      var cr=r.headers.get('content-range')||'';
      var total=cr.split('/')[1];
      return (!total||total==='*')?null:parseInt(total,10);
    })
    .catch(function(){return null;});
}

function sbP(t,b){
  return fetch(SB+'/rest/v1/'+t,{method:'POST',headers:getHeaders(),body:JSON.stringify(b)})
    .then(function(r){if(!r.ok)return _sbError(r);return r.json();});
}
function sbU(t,id,b){
  return fetch(SB+'/rest/v1/'+t+'?id=eq.'+id,{method:'PATCH',headers:getHeaders(),body:JSON.stringify(b)})
    .then(function(r){if(!r.ok)return _sbError(r);return r.json();});
}
function sbDel(t,q){
  return fetch(SB+'/rest/v1/'+t+'?'+q,{method:'DELETE',headers:getHeaders()})
    .then(function(r){if(!r.ok)return _sbError(r);});
}
// Fusiona dos filas de clientes_vet que resultaron ser el mismo cliente
// (p.ej. "Sash Vet - Ate" y "Sash - Salamanca" eran la misma clínica).
// `newRow` (la fila con el nombre destino) sobrevive; `oldRow` se borra
// después de:
//  1. copiar a newRow los campos que newRow no tenga (rellenar huecos)
//  2. reasignar visitas_dia.cliente_id de oldRow.id -> newRow.id
//     (la FK es ON DELETE CASCADE: si no reasignamos antes, borrar oldRow
//     borraría también esas visitas programadas)
function mergeClientesVet(oldRow,newRow,extraPatch){
  var FILL=['doctora','direccion','distrito','latitud','longitud','num_medico','tiempo_visita_minutos','ruc'];
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

// Disparar notificacion push (fire-and-forget, no bloquea el flujo)
function notifyMovement(payload){
  try {
    return fetch(SB+'/functions/v1/send-sale-notification',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':AK,'Authorization':'Bearer '+(AUTH_TOKEN||AK)},
      body:JSON.stringify(payload)
    }).catch(function(){});
  } catch(e){}
}

// ── ¿DE QUIÉN ES ESTE CLIENTE? ──
// Regla única de pertenencia. Todo el panel debe preguntar por aquí en vez de
// comparar zonas por su cuenta, porque hay dos criterios y uno pisa al otro:
//
//   1. Si la veterinaria está TRANSFERIDA a alguien (vendedor_asignado_id),
//      manda la transferencia — aunque la zona no sea del vendedor. Y si está
//      transferida a otro, no es suya aunque la zona sí lo sea.
//   2. Si no está transferida, manda la zona asignada, como siempre.
//
// Nace del caso real de Animal 24 Horas: una sede en San Miguel que pertenece
// a un vendedor de Surco. Antes se resolvía duplicando la fila con otra zona.
function esMiCliente(cv){
  if(!cv)return false;
  var miId=CUR&&CUR.id;
  var asignado=cv.vendedor_asignado_id||null;
  if(asignado)return String(asignado)===String(miId);

  var zonas=(CUR&&Array.isArray(CUR.zonas_asignadas))?CUR.zonas_asignadas:[];
  if(!zonas.length)return true; // sin zonas asignadas se ve todo, como hasta ahora
  var z=(cv.zona||'').trim().toLowerCase();
  for(var i=0;i<zonas.length;i++){
    if((zonas[i]||'').trim().toLowerCase()===z)return true;
  }
  return false;
}

// Campos mínimos que hay que traer de clientes_vet para poder decidir la
// pertenencia. Si olvidas vendedor_asignado_id, esMiCliente() cae de nuevo al
// criterio de zona sin avisar.
var CV_CAMPOS_PERTENENCIA='zona,vendedor_asignado_id';

function gel(id){return document.getElementById(id);}
function val(id){var e=gel(id);return e?e.value.trim():'';}
function hoy(){return new Date().toISOString().split('T')[0];}
function fmt(s){
  if(!s)return'\u2014';
  var d=s.indexOf('T')>0?s.split('T')[0]:s;
  var p=d.split('-');return p[2]+'/'+p[1]+'/'+p[0];
}
function money(n){return'S/ '+Number(n||0).toFixed(2);}
function setSt(msg,tp){
  tp=tp||'ld';
  var icons={ld:'<span class="spin"></span>',ok:'\u2705',er:'\u274c'};
  gel('st-global').innerHTML=msg?('<div class="st-bar st-'+tp+'">'+(icons[tp]||'')+' '+msg+'</div>'):'';
}
function setBL(id,loading,label){
  var b=gel(id);if(!b)return;
  b.disabled=loading;
  b.innerHTML=loading?'<span class="spin"></span> Guardando...':(label||'Guardar');
}

var CUR=null;
var _ventas=[];
var _zonasList=[];
var _planOfs=0;
var _hFil='todos';
var _histPag=1;
var _prods=[];
var _vetes=[];
var _docMap={};
var _celMap={}; // doctora -> num_medico
var _mvPostSaveTimer=null; // cancellable redirect after save
var _vetDocMap={}; // vet -> [list of doctors]


var _vtFil='todos';
var _vtPag=1;

// ── DOCUMENTOS (multi-par tipo+nro) ──
// Permite registrar varios pares (Factura+nro, Guía+nro, etc.) en un mismo movimiento.
// Se serializan en las columnas existentes tipo_documento/numero_documento separados por ' | '.
var _DOCS_TIPOS = ['Guía de Remisión','Factura','Nota de Crédito','Boleta de venta'];
var _docsData = {}; // pfx -> [{tipo:'', nro:''}, ...]

function _docEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function docsReset(pfx){ _docsData[pfx]=[{tipo:'',nro:''}]; docsRender(pfx); }
function docsAgregar(pfx){
  if(!_docsData[pfx]) _docsData[pfx]=[];
  if(_docsData[pfx].length>=6){ setSt('Máximo 6 documentos','er'); setTimeout(function(){setSt('');},2000); return; }
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
      '<div class="fgr" style="margin:0;"><label style="font-size:10px;">N° documento</label>'+
        '<input type="text" value="'+_docEsc(d.nro)+'" placeholder="Ej: F001-000123" '+
        'oninput="docsActualizar(\''+pfx+'\','+idx+',\'nro\',this.value)"/>'+
      '</div>'+
      '<button type="button" onclick="docsQuitar(\''+pfx+'\','+idx+')" '+
        'style="background:'+(canRemove?'#dc2626':'#e5e7eb')+';color:'+(canRemove?'#fff':'#9ca3af')+';border:none;border-radius:8px;width:32px;height:36px;cursor:'+(canRemove?'pointer':'not-allowed')+';font-size:16px;line-height:1;font-weight:bold;" '+
        (canRemove?'':'disabled')+'>×</button>'+
    '</div>';
  });
  box.innerHTML=html;
}
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