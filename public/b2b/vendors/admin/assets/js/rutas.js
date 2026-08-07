// ============================================================
// PANEL ADMINISTRABLE — Asignar Rutas a Vendedores
// ------------------------------------------------------------
// Permite al admin armar la ruta del día para cualquier vendedor:
//   - escoge el vendedor (CUR equivalente)
//   - escoge la fecha
//   - ve sólo las veterinarias que están EN LAS ZONAS ASIGNADAS de ese vendedor
//   - tiene buscador + filtro de zona como en el panel del vendedor
//   - guarda en config_rutas + visitas_dia (las mismas tablas que el vendedor)
// ============================================================

var VELOCIDAD_CAMINATA_KMH = 4.5;
var _ruVendedor = null;      // objeto vendedor seleccionado
var _ruFechaSel = null;      // YYYY-MM-DD
var _ruVetes = [];           // clientes_vet filtradas para este vendedor (con coords)
var _ruVetesSinUbicacion = []; // nombres del historial del vendedor sin coords
var _ruSeleccion = {};       // { cliente_id : { marcado:bool, hora_especifica:string } }
var _ruFiltroBusq = '';
var _ruFiltroZona = '';

// Upsert genérico vía PostgREST
function _ruUpsert(tabla,filas,onConflict){
  if(!filas||!filas.length)return Promise.resolve([]);
  var headers=Object.assign({},getHeaders(),{'Prefer':'resolution=merge-duplicates,return=representation'});
  return fetch(SB+'/rest/v1/'+tabla+'?on_conflict='+onConflict,{method:'POST',headers:headers,body:JSON.stringify(filas)})
    .then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(r.status+' '+t);});return r.json();});
}

// ── Geometría / horas ─────────────────────────────────────────
function _ruTiempoMin(lat1,lon1,lat2,lon2){
  var R=6371;
  var dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  var distKm=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return (distKm/VELOCIDAD_CAMINATA_KMH)*60;
}
function _ruHoraAMin(s){if(!s)return null;var p=s.split(':');return (+p[0])*60+(+p[1]);}
function _ruMinAHora(min){min=Math.round(min);var h=Math.floor(min/60)%24,m=min%60;return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;}

// ── Optimizador VRPTW (mismo algoritmo que el vendedor) ───────
function _ruOptimizar(origen,visitas,horaInicioStr){
  var tiempoActual=_ruHoraAMin(horaInicioStr);
  var pos={lat:origen.latitud,lon:origen.longitud};
  var pendientes=visitas.slice();
  var ruta=[];
  var iter=0,MAX=1000;
  while(pendientes.length>0 && iter<MAX){
    iter++;
    var mejor=null, mejorScore=Infinity;
    for(var i=0;i<pendientes.length;i++){
      var v=pendientes[i];
      var min=_ruTiempoMin(pos.lat,pos.lon,v.latitud,v.longitud);
      var llegada=tiempoActual+min;
      var ini=_ruHoraAMin(v.hora_inicio_ventana)||0;
      var fin=_ruHoraAMin(v.hora_fin_ventana);if(fin===null)fin=23*60+59;
      var hesp=_ruHoraAMin(v.hora_especifica);
      if(hesp!==null){
        var diff=Math.abs(llegada-hesp);
        var pen=diff>30?diff*3:diff;
        if(pen<mejorScore){mejorScore=pen;mejor={visita:v,llegada:Math.max(llegada,hesp),espera:Math.max(0,hesp-llegada)};}
        continue;
      }
      if(llegada>fin)continue;
      var llegR=Math.max(llegada,ini);
      var score=llegR+min*0.5;
      if(score<mejorScore){mejorScore=score;mejor={visita:v,llegada:llegR,espera:Math.max(0,ini-llegada)};}
    }
    if(!mejor){tiempoActual+=15;continue;}
    var v=mejor.visita, llegF=mejor.llegada, esp=mejor.espera;
    var dur=v.tiempo_visita_minutos||20;
    ruta.push({
      id:v.id,nombre_cliente:v.nombre_cliente,direccion:v.direccion,distrito:v.distrito,
      latitud:v.latitud,longitud:v.longitud,hora_especifica:v.hora_especifica,
      orden_visita:ruta.length+1,
      hora_estimada_llegada:_ruMinAHora(llegF),
      minutos_espera:Math.round(esp),
      hora_salida:_ruMinAHora(llegF+dur),
      doctora:v.doctora||'',
      num_medico:v.num_medico||''
    });
    tiempoActual=llegF+dur;
    pos={lat:v.latitud,lon:v.longitud};
    pendientes=pendientes.filter(function(p){return p.id!==v.id;});
  }
  return ruta;
}

function _ruUrlMaps(ruta,origen){
  if(!ruta.length)return null;
  var base='https://www.google.com/maps/dir/?api=1&travelmode=walking';
  var oStr=origen.direccion?origen.direccion:(origen.latitud+','+origen.longitud);
  var dStr=ruta[ruta.length-1].latitud+','+ruta[ruta.length-1].longitud;
  var inter=ruta.slice(0,-1).map(function(v){return v.latitud+','+v.longitud;}).join('|');
  var url=base+'&origin='+encodeURIComponent(oStr)+'&destination='+dStr;
  if(inter)url+='&waypoints='+encodeURIComponent(inter);
  return url;
}

// ============================================================
// Render entry — desde core.js _runPageFn
// ============================================================
function rRutasAdmin(){
  // Poblar select de vendedores
  var sel=gel('ru-vendedor');
  if(sel){
    var prev=sel.value;
    sel.innerHTML='<option value="">— Seleccionar vendedor —</option>';
    (_vendedores||[]).filter(function(v){return v.activo!==false;}).forEach(function(v){
      var o=document.createElement('option');o.value=v.id;o.textContent=v.nombre;
      sel.appendChild(o);
    });
    if(prev)sel.value=prev;
  }
  // Default fecha = hoy
  var f=gel('ru-fecha');if(f&&!f.value)f.value=hoy();
  if(!_ruFechaSel)_ruFechaSel=f?f.value:hoy();

  if(_ruVendedor)_ruRefrescarBuilder();
}

function ruCambiarVendedor(){
  var id=val('ru-vendedor');
  _ruSeleccion={};_ruVetes=[];_ruVetesSinUbicacion=[];
  _ruFiltroBusq='';_ruFiltroZona='';
  if(!id){
    _ruVendedor=null;
    var info=gel('ru-info-vendedor');if(info)info.textContent='Selecciona un vendedor para empezar.';
    var b=gel('ru-builder');if(b)b.style.display='none';
    var c=gel('ru-resultado-card');if(c)c.style.display='none';
    return;
  }
  _ruVendedor=(_vendedores||[]).filter(function(v){return String(v.id)===String(id);})[0]||null;
  _ruRefrescarBuilder();
}

function ruCambiarFecha(f){
  _ruFechaSel=f||hoy();
  if(_ruVendedor)_ruRefrescarBuilder();
}

function _ruRefrescarBuilder(){
  if(!_ruVendedor)return;
  // Info del vendedor
  var info=gel('ru-info-vendedor');
  if(info){
    var origen=(_ruVendedor.origen_direccion||'sin punto de partida registrado');
    var zonas=(_ruVendedor.zonas_asignadas||[]).join(', ')||'sin zonas asignadas';
    info.innerHTML='Inicio: <strong>'+origen+'</strong><br>Zonas asignadas: <strong>'+zonas+'</strong>';
  }
  // Mostrar builder
  var b=gel('ru-builder');if(b)b.style.display='block';
  // Cargar lo ya guardado para esa fecha + render
  _ruSeleccion={};
  _ruCargarYOptimizar(_ruFechaSel,true);
  _ruCargarChecklist();
}

// ── Dropdown vets ────────────────────────────────────────────
function ruToggleDropdown(open){
  var panel=gel('ru-dd-panel');if(!panel)return;
  var mostrar = (typeof open==='boolean') ? open : (panel.style.display==='none');
  panel.style.display = mostrar?'block':'none';
}
document.addEventListener('click',function(e){
  var panel=gel('ru-dd-panel'),btn=gel('ru-dd-btn');
  if(!panel||panel.style.display==='none')return;
  if(panel.contains(e.target)||(btn&&btn.contains(e.target)))return;
  panel.style.display='none';
});

function _ruActualizarLabel(){
  var lbl=gel('ru-dd-label');if(!lbl)return;
  var n=_ruSelValidas().length;
  lbl.textContent = n>0 ? (n+' veterinaria'+(n!==1?'s':'')+' seleccionada'+(n!==1?'s':'')) : 'Seleccionar veterinarias…';
}
function _ruSelValidas(){
  var ok={};_ruVetes.forEach(function(v){ok[v.id]=true;});
  return Object.keys(_ruSeleccion).filter(function(id){return _ruSeleccion[id].marcado && ok[id];});
}
function _ruLimpiarFantasma(){
  var ok={};_ruVetes.forEach(function(v){ok[v.id]=true;});
  Object.keys(_ruSeleccion).forEach(function(id){if(!ok[id])delete _ruSeleccion[id];});
}

// Carga el listado de veterinarias elegibles para este vendedor. Criterio de
// inclusión (igual que "Mi Ruta" en el panel de vendedores, ruta.js):
//   a) ya tiene ventas históricas con este vendedor, o
//   b) está en clientes_vet dentro de alguna de sus zonas asignadas
// (cualquiera de las dos basta). Antes se exigían AMBAS -- en la práctica eso
// ocultaba del selector cualquier veterinaria que no tuviera ya una venta
// registrada con ese vendedor específico, así que el admin no podía asignar
// clientes nuevos o trasladados a una ruta hasta que existiera una venta previa.
// Si el vendedor no tiene zonas_asignadas, no se filtra por zona (ve todas).
function _ruCargarChecklist(){
  var box=gel('ru-dd-panel');if(!box)return;
  if(!_ruVendedor){box.innerHTML='<p style="color:var(--tl);padding:.8rem;">Selecciona un vendedor.</p>';return;}

  var zonasAsig=(_ruVendedor.zonas_asignadas||[]).slice();
  var aplicaZona=zonasAsig.length>0;
  var zLC={};zonasAsig.forEach(function(z){zLC[(z||'').toLowerCase()]=true;});

  // Ventas de este vendedor (las cacheamos en _ventas global del admin)
  var ventasVend=(_ventas||[]).filter(function(v){return String(v.vendedor_id)===String(_ruVendedor.id);});
  var nombresPropios={};
  ventasVend.forEach(function(v){
    if(!v.veterinaria)return;
    if(aplicaZona && v.zona && !zLC[(v.zona||'').toLowerCase()])return;
    var k=v.veterinaria.trim().toLowerCase();
    if(!nombresPropios[k])nombresPropios[k]=v.veterinaria.trim();
  });

  function enSuZona(z){
    if(!aplicaZona)return true;
    return !!(z && zLC[(z||'').toLowerCase()]);
  }

  sbG('clientes_vet','select=id,nombre_vet,direccion,distrito,latitud,longitud,zona&order=nombre_vet.asc')
  .then(function(r){
    r=r||[];
    var conUbic={};
    r.forEach(function(cv){if(cv.latitud&&cv.longitud)conUbic[(cv.nombre_vet||'').trim().toLowerCase()]=true;});
    _ruVetes=r.filter(function(v){
      if(!v.latitud||!v.longitud)return false;
      var k=(v.nombre_vet||'').trim().toLowerCase();
      var enHistorial=!!nombresPropios[k];
      var enZonaPropia=enSuZona(v.zona);
      if(!enHistorial && !enZonaPropia)return false;
      // Si está en el historial pero clientes_vet.zona es de OTRA zona poblada,
      // igual la descartamos para no mezclar restos de otro vendedor.
      if(enHistorial && aplicaZona && v.zona && !zLC[(v.zona||'').toLowerCase()])return false;
      return true;
    });
    _ruVetesSinUbicacion=Object.keys(nombresPropios)
      .filter(function(k){return !conUbic[k];})
      .map(function(k){return nombresPropios[k];})
      .sort();
    _ruLimpiarFantasma();
    _ruPintarChecklist();
  })
  .catch(function(e){box.innerHTML='<p style="color:var(--er);padding:.8rem;">'+SVUI.error(e,'cargar las veterinarias')+'</p>';});
}

function _ruPintarChecklist(){
  var box=gel('ru-dd-panel');if(!box)return;
  _ruActualizarLabel();
  if(!_ruVetes.length && !_ruVetesSinUbicacion.length){
    box.innerHTML='<p style="color:var(--tl);padding:.8rem;font-size:13px;">Este vendedor todavía no tiene veterinarias en sus zonas asignadas. Registra una visita o agrega su ubicación primero.</p>';
    return;
  }

  var zonasAsig=(_ruVendedor&&_ruVendedor.zonas_asignadas)||[];
  var optsZ='<option value="">Todas las zonas</option>';
  zonasAsig.forEach(function(z){
    optsZ+='<option value="'+z.replace(/"/g,'&quot;')+'"'+(z===_ruFiltroZona?' selected':'')+'>'+z+'</option>';
  });
  var busqEsc=(_ruFiltroBusq||'').replace(/"/g,'&quot;');
  var header=
    '<div style="position:sticky;top:0;background:#fff;padding:.55rem .55rem .45rem;border-bottom:1px solid var(--bd);display:flex;gap:.4rem;flex-wrap:wrap;z-index:1;">'+
      '<input id="ru-dd-busq" type="text" placeholder="🔍 Buscar veterinaria…" value="'+busqEsc+'" oninput="ruFiltroBusq(this.value)" '+
        'style="flex:1 1 160px;min-width:0;font-size:13px;padding:.45rem .6rem;border:1px solid var(--bd);border-radius:6px;">'+
      (zonasAsig.length>0
        ? '<select id="ru-dd-zona" onchange="ruFiltroZona(this.value)" style="font-size:13px;padding:.45rem .5rem;border:1px solid var(--bd);border-radius:6px;background:#fff;">'+optsZ+'</select>'
        : '')+
    '</div>';

  var q=(_ruFiltroBusq||'').trim().toLowerCase();
  var fz=(_ruFiltroZona||'').trim().toLowerCase();
  function mTxt(s){return !q||(s||'').toLowerCase().indexOf(q)>=0;}
  function mZ(z){return !fz||(z||'').toLowerCase()===fz;}

  // Para "Sin ubicación", deducimos zona desde ventas del vendedor
  var zonaPorVet={};
  (_ventas||[]).forEach(function(v){
    if(String(v.vendedor_id)!==String(_ruVendedor.id))return;
    if(!v.veterinaria||!v.zona)return;
    var k=v.veterinaria.trim().toLowerCase();
    if(!zonaPorVet[k])zonaPorVet[k]=v.zona;
  });

  var vetsF=_ruVetes.filter(function(v){return mTxt(v.nombre_vet)&&mZ(v.zona);});
  var sinF=_ruVetesSinUbicacion.filter(function(n){return mTxt(n)&&mZ(zonaPorVet[(n||'').trim().toLowerCase()]||'');});

  var html=header+'<div>';
  if(!vetsF.length && !sinF.length){
    html+='<p style="color:var(--tl);padding:.9rem .6rem;font-size:13px;">Sin resultados con esos filtros.</p>';
  } else if(!vetsF.length){
    html+='<p style="color:var(--tl);padding:.6rem .4rem;font-size:13px;">No hay veterinarias con ubicación que coincidan. Agrega su dirección desde Clientes › Editar.</p>';
  }
  for(var i=0;i<vetsF.length;i++){
    var v=vetsF[i];
    var sel=_ruSeleccion[v.id]||{marcado:false,hora_especifica:''};
    html+='<div class="rv-item" style="display:grid;grid-template-columns:32px 1fr 110px;align-items:center;gap:.8rem;padding:.7rem .4rem;border-bottom:1px solid var(--bd);">'+
      '<input type="checkbox" id="ru-chk-'+v.id+'" '+(sel.marcado?'checked':'')+' onchange="ruToggleSel(\''+v.id+'\',this.checked)" style="width:20px;height:20px;cursor:pointer;justify-self:start;">'+
      '<div onclick="var c=gel(\'ru-chk-'+v.id+'\');c.checked=!c.checked;ruToggleSel(\''+v.id+'\',c.checked);" style="cursor:pointer;min-width:0;">'+
        '<div style="font-weight:600;font-size:14px;line-height:1.3;">'+v.nombre_vet+'</div>'+
        '<div style="font-size:12px;color:var(--tl);line-height:1.3;">'+(v.direccion||'')+(v.distrito?' · '+v.distrito:'')+(v.zona?' · '+v.zona:'')+'</div>'+
      '</div>'+
      '<input type="time" value="'+(sel.hora_especifica||'')+'" title="Hora exacta de cita (opcional)" onchange="ruSetHora(\''+v.id+'\',this.value)" style="font-size:13px;padding:.4rem;border:1px solid var(--bd);border-radius:6px;width:100%;box-sizing:border-box;">'+
    '</div>';
  }
  if(sinF.length){
    html+='<div style="padding:.7rem .4rem .3rem;border-top:1px solid var(--bd);margin-top:.4rem;">'+
      '<div style="font-size:12px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.04em;">Sin ubicación ('+sinF.length+')</div>'+
      '<div style="font-size:11px;color:var(--tl);margin-top:2px;">Agrega su dirección desde <strong>Clientes › Editar</strong> para poder incluirlas en la ruta.</div>'+
    '</div>';
    sinF.forEach(function(n){
      html+='<div class="rv-item" style="padding:.6rem .4rem;border-bottom:1px solid var(--bd);font-size:13px;color:var(--tl);">📍 '+n+'</div>';
    });
  }
  html+='</div>';
  box.innerHTML=html;
  var inp=gel('ru-dd-busq');
  if(inp&&document.activeElement!==inp&&q){inp.focus();var l=inp.value.length;inp.setSelectionRange(l,l);}
}

function ruFiltroBusq(v){_ruFiltroBusq=v||'';_ruPintarChecklist();}
function ruFiltroZona(v){_ruFiltroZona=v||'';_ruPintarChecklist();}
function ruToggleSel(id,m){if(!_ruSeleccion[id])_ruSeleccion[id]={marcado:false,hora_especifica:''};_ruSeleccion[id].marcado=m;_ruActualizarLabel();}
function ruSetHora(id,h){if(!_ruSeleccion[id])_ruSeleccion[id]={marcado:false,hora_especifica:''};_ruSeleccion[id].hora_especifica=h||'';}

// ── Guardar / generar ─────────────────────────────────────────
function ruGenerarRuta(){
  if(!_ruVendedor){showToast('Selecciona un vendedor','er');return;}
  if(!_ruVendedor.origen_latitud||!_ruVendedor.origen_longitud){
    showToast('Este vendedor no tiene punto de partida registrado. Pídele que lo configure en su panel "Mi Ruta".','er');
    return;
  }
  var fecha=_ruFechaSel||hoy();
  _ruLimpiarFantasma();
  var elegidas=_ruSelValidas();
  var msg=gel('ru-gen-msg');
  if(!elegidas.length){if(msg){msg.style.color='var(--er)';msg.textContent='Marca al menos una veterinaria.';}return;}
  if(msg){msg.style.color='var(--tl)';msg.textContent='Generando ruta...';}

  var configPayload={
    vendedor_id:_ruVendedor.id,fecha:fecha,
    origen_latitud:_ruVendedor.origen_latitud,origen_longitud:_ruVendedor.origen_longitud,
    origen_nombre:_ruVendedor.origen_direccion||'Punto de partida',hora_inicio_jornada:'09:00'
  };
  var visitasPayload=elegidas.map(function(cid){
    var s=_ruSeleccion[cid];
    return{vendedor_id:_ruVendedor.id,cliente_id:cid,fecha:fecha,hora_especifica:s.hora_especifica||null,estado:'pendiente'};
  });

  _ruUpsert('config_rutas',[configPayload],'vendedor_id,fecha')
  .then(function(){
    // Reconstruir desde cero: borramos las visitas guardadas para esa fecha y volvemos a insertar
    return sbDel('visitas_dia','vendedor_id=eq.'+_ruVendedor.id+'&fecha=eq.'+fecha);
  })
  .then(function(){return _ruUpsert('visitas_dia',visitasPayload,'vendedor_id,cliente_id,fecha');})
  .then(function(){return sbG('visitas_dia','vendedor_id=eq.'+_ruVendedor.id+'&fecha=eq.'+fecha+'&select=id');})
  .then(function(actuales){
    actuales=actuales||[];
    if(actuales.length>elegidas.length){
      throw new Error('Quedaron '+actuales.length+' paradas guardadas pero seleccionaste '+elegidas.length+
        '. Revisa el policy de DELETE de visitas_dia en Supabase.');
    }
    return _ruCargarYOptimizar(fecha,true);
  })
  .then(function(ruta){
    if(msg){msg.style.color='var(--ok)';msg.textContent='✓ Ruta asignada — '+(ruta?ruta.length:0)+' paradas para '+_ruVendedor.nombre+'.';}
  })
  .catch(function(e){if(msg){msg.style.color='var(--er)';msg.textContent=SVUI.error(e);}});
}

// ── Carga + optimiza la ruta de la fecha ──────────────────────
function _ruCargarYOptimizar(fecha,mostrar){
  fecha=fecha||_ruFechaSel||hoy();
  if(!_ruVendedor)return Promise.resolve([]);
  var card=gel('ru-resultado-card'),cont=gel('ru-lista-paradas');
  if(mostrar){if(card)card.style.display='';if(cont)cont.innerHTML='<p style="padding:1rem;color:var(--tl);">Cargando ruta...</p>';}

  return sbG('config_rutas','vendedor_id=eq.'+_ruVendedor.id+'&fecha=eq.'+fecha)
  .then(function(cfg){
    var c=cfg&&cfg[0];
    if(!c){
      if(mostrar&&cont)cont.innerHTML='<p style="padding:1rem;color:var(--tl);">Selecciona veterinarias y genera la ruta.</p>';
      return [];
    }
    return sbG('visitas_dia','vendedor_id=eq.'+_ruVendedor.id+'&fecha=eq.'+fecha+'&select=*,clientes_vet(*)')
    .then(function(visitas){
      var zAsig=(_ruVendedor.zonas_asignadas||[]);
      var fZ=zAsig.length>0;
      var zLC={};zAsig.forEach(function(z){zLC[(z||'').toLowerCase()]=true;});
      var flat=(visitas||[]).filter(function(v){
        if(!(v.clientes_vet&&v.clientes_vet.latitud&&v.clientes_vet.longitud))return false;
        if(fZ && v.clientes_vet.zona && !zLC[(v.clientes_vet.zona||'').toLowerCase()])return false;
        return true;
      }).map(function(v){
        return{
          id:v.id,cliente_id:v.cliente_id,nombre_cliente:v.clientes_vet.nombre_vet,
          direccion:v.clientes_vet.direccion,distrito:v.clientes_vet.distrito,
          latitud:parseFloat(v.clientes_vet.latitud),longitud:parseFloat(v.clientes_vet.longitud),
          hora_inicio_ventana:v.hora_inicio_ventana,hora_fin_ventana:v.hora_fin_ventana,
          hora_especifica:v.hora_especifica,tiempo_visita_minutos:v.clientes_vet.tiempo_visita_minutos||20,
          doctora:v.clientes_vet.doctora||'',
          num_medico:v.clientes_vet.num_medico||''
        };
      });
      if(!flat.length){
        if(mostrar&&cont)cont.innerHTML='<p style="padding:1rem;color:var(--tl);">No tienes visitas seleccionadas para esta fecha.</p>';
        window.RUTA_ADMIN_ACTUAL=[];window.RUTA_ADMIN_ORIGEN=null;
        return [];
      }
      var origen={latitud:parseFloat(c.origen_latitud),longitud:parseFloat(c.origen_longitud),direccion:c.origen_nombre||''};
      var rutaOpt=_ruOptimizar(origen,flat,c.hora_inicio_jornada);
      var ups=rutaOpt.map(function(v){return sbU('visitas_dia',v.id,{orden_visita:v.orden_visita,hora_estimada_llegada:v.hora_estimada_llegada});});
      return Promise.all(ups).then(function(){
        window.RUTA_ADMIN_ACTUAL=rutaOpt;
        window.RUTA_ADMIN_ORIGEN=origen;
        if(mostrar)_ruRenderParadas(rutaOpt);
        return rutaOpt;
      });
    });
  })
  .catch(function(e){if(mostrar&&cont)cont.innerHTML='<p style="padding:1rem;color:var(--er);">'+SVUI.error(e)+'</p>';return [];});
}

function _ruRenderParadas(ruta){
  var cont=gel('ru-lista-paradas');if(!cont)return;
  if(!ruta||!ruta.length){cont.innerHTML='<p style="padding:1rem;color:var(--tl);">Selecciona veterinarias y genera la ruta para ver el recorrido.</p>';return;}
  var html='<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.6rem 1rem 0;flex-wrap:wrap;">'+
    '<button class="btn btn-d btn-sm" onclick="ruEliminarRuta()">🗑️ Eliminar ruta del día</button>'+
    '<div style="display:flex;gap:.4rem;flex-wrap:wrap;">'+
      '<button class="btn btn-sk btn-sm" onclick="generarPDFRutaAdmin()">📄 Exportar PDF</button>'+
      '<button class="btn btn-p btn-sm" onclick="ruAbrirMaps()">🗺️ Abrir ruta completa en Maps</button>'+
    '</div></div>';
  for(var i=0;i<ruta.length;i++){
    var v=ruta[i];
    html+='<div class="parada-card" style="display:flex;gap:.7rem;align-items:flex-start;padding:.8rem 1rem;border-bottom:1px solid var(--bd);">'+
      '<div style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:var(--brand);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">'+v.orden_visita+'</div>'+
      '<div style="flex:1;min-width:0;">'+
        '<strong style="display:block;">'+v.nombre_cliente+'</strong>'+
        '<span style="font-size:11px;color:var(--tl);">'+(v.direccion||'')+(v.distrito?' · '+v.distrito:'')+'</span>'+
        '<div style="font-size:11px;margin-top:.3rem;color:var(--tl);">'+
          '🕐 Llegada estimada: <b>'+v.hora_estimada_llegada+'</b>'+
          (v.minutos_espera>0?' · ⏳ Esperar '+v.minutos_espera+' min':'')+
          (v.hora_especifica?' · 📌 Cita: '+v.hora_especifica:'')+
        '</div>'+
      '</div>'+
    '</div>';
  }
  cont.innerHTML=html;
}

function ruAbrirMaps(){
  if(!window.RUTA_ADMIN_ACTUAL||!window.RUTA_ADMIN_ORIGEN)return;
  var url=_ruUrlMaps(window.RUTA_ADMIN_ACTUAL,window.RUTA_ADMIN_ORIGEN);
  if(!url){showToast('No hay ruta para abrir.','er');return;}
  window.open(url,'_blank');
}

function ruEliminarRuta(){
  if(!_ruVendedor)return;
  var fecha=_ruFechaSel||hoy();
  var nombre=_ruVendedor.nombre;

  SVUI.confirmar({
    titulo:'¿Eliminar la ruta de '+nombre+'?',
    mensaje:'Se borrarán todas sus paradas del '+_ruFechaLarga(fecha)+'.\n\n'+
            nombre+' dejará de ver ese recorrido en su panel. '+
            'Esto no se puede deshacer.',
    confirmar:'Eliminar ruta',
    cancelar:'Conservarla',
    peligro:true
  }).then(function(ok){
    if(ok)_ruEliminarConfirmado(fecha);
  });
}

// 2026-08-03 -> "lunes 3 de agosto". Una fecha ISO dentro de una pregunta
// obliga a descifrarla justo cuando hay que decidir.
function _ruFechaLarga(iso){
  try{
    return new Date(iso+'T00:00:00')
      .toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'});
  }catch(e){ return iso; }
}

function _ruEliminarConfirmado(fecha){
  var msg=gel('ru-gen-msg');if(msg){msg.style.color='var(--tl)';msg.textContent='Eliminando ruta...';}
  Promise.all([
    sbDel('visitas_dia','vendedor_id=eq.'+_ruVendedor.id+'&fecha=eq.'+fecha),
    sbDel('config_rutas','vendedor_id=eq.'+_ruVendedor.id+'&fecha=eq.'+fecha)
  ])
  .then(function(){
    _ruSeleccion={};
    if(msg){msg.style.color='var(--ok)';msg.textContent='✓ Ruta eliminada.';}
    var card=gel('ru-resultado-card');if(card)card.style.display='none';
    var cont=gel('ru-lista-paradas');if(cont)cont.innerHTML='';
    _ruCargarChecklist();
    setTimeout(function(){if(msg)msg.textContent='';},2500);
  })
  .catch(function(e){if(msg){msg.style.color='var(--er)';msg.textContent=SVUI.error(e);}});
}

// ─────────────────────────────────────────────────────
// PDF: RUTA DEL DÍA (admin — con vendedor, doctor/a y N° ref.)
// ─────────────────────────────────────────────────────
function generarPDFRutaAdmin(){
  var ruta=window.RUTA_ADMIN_ACTUAL||[];
  if(!ruta.length){showToast('Genera primero una ruta para exportarla.','er');return;}
  var origen=window.RUTA_ADMIN_ORIGEN||null;
  var fecha=_ruFechaSel||hoy();
  var fechaLegible=new Date(fecha+'T00:00:00').toLocaleDateString('es-PE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
  fechaLegible=fechaLegible.charAt(0).toUpperCase()+fechaLegible.slice(1);
  var nombreVendedor=_ruVendedor?_ruVendedor.nombre:'Vendedor';

  var fechaGen=new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'});
  var horaGen=new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});

  var origenHtml=origen
    ? '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;margin-bottom:14px;">'+
        '<div style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.5px;">📍 Punto de partida</div>'+
        '<div style="font-size:13px;color:#166534;margin-top:2px;font-weight:600;">'+(origen.direccion||(origen.latitud+', '+origen.longitud))+'</div>'+
      '</div>'
    : '';

  // Tabla de paradas
  var headCells=[
    {t:'#',       w:'28px',  al:'center'},
    {t:'Veterinaria', w:'170px', al:'left'},
    {t:'Dirección',   w:'',     al:'left'},
    {t:'N° Ref.',     w:'80px', al:'center'},
    {t:'Doctor/a',    w:'130px',al:'left'},
    {t:'Llegada',     w:'120px',al:'left'}
  ].map(function(c){
    return '<th style="padding:7px 8px;font-size:10px;text-align:'+c.al+';color:#374151;font-weight:700;text-transform:uppercase;letter-spacing:.3px;border-bottom:2px solid #253C61;'+(c.w?'width:'+c.w+';':'')+'">'+(c.t)+'</th>';
  }).join('');

  var bodyRows=ruta.map(function(v,idx){
    var bg=idx%2===0?'#ffffff':'#f9fafb';
    var dir=(v.direccion||'')+(v.distrito?', '+v.distrito:'');
    var hora=v.hora_estimada_llegada||'—';
    if(v.hora_especifica)hora+=' <span style="color:#6b7280;font-size:10px;">(cita: '+v.hora_especifica+')</span>';
    if(v.minutos_espera>0)hora+=' <span style="color:#6b7280;font-size:10px;">· espera '+v.minutos_espera+' min</span>';
    return '<tr style="background:'+bg+';border-bottom:1px solid #f3f4f6;">'+
      '<td style="padding:6px 8px;font-size:12px;text-align:center;font-weight:700;color:#253C61;">'+v.orden_visita+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;font-weight:600;">'+( v.nombre_cliente||'—')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;color:#374151;">'+(dir||'—')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;text-align:center;color:#374151;">'+(v.num_medico||'—')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;color:#374151;">'+(v.doctora||'—')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;font-weight:600;color:#253C61;">'+hora+'</td>'+
    '</tr>';
  }).join('');

  var tabla='<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:14px;">'+
    '<thead><tr style="background:#f3f4f6;">'+headCells+'</tr></thead>'+
    '<tbody>'+bodyRows+'</tbody></table>';

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ruta '+nombreVendedor+' '+fecha+'</title>'+
    '<style>body{font-family:Arial,sans-serif;color:#222;padding:20px;max-width:1000px;margin:0 auto;background:#fff;}'+
    '@media print{body{padding:10px;max-width:none;}.no-print{display:none !important;}}'+
    'table{page-break-inside:auto;}tr{page-break-inside:avoid;}thead{display:table-header-group;}</style>'+
    '</head><body>'+
    // Encabezado
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:3px solid #253C61;padding-bottom:12px;">'+
      '<div>'+
        '<div style="font-size:22px;font-weight:700;color:#253C61;letter-spacing:1.5px;">SUPLEVET</div>'+
        '<div style="font-size:13px;color:#374151;font-weight:600;margin-top:2px;">Ruta del día</div>'+
        '<div style="font-size:11px;color:#6b7280;margin-top:2px;">'+fechaLegible+' · '+ruta.length+' parada'+(ruta.length!==1?'s':'')+'</div>'+
      '</div>'+
      '<div style="text-align:right;">'+
        '<div style="font-size:14px;font-weight:700;color:#1f2937;">'+nombreVendedor+'</div>'+
        '<div style="font-size:10px;color:#6b7280;margin-top:2px;">Generado: '+fechaGen+' '+horaGen+'</div>'+
      '</div>'+
    '</div>'+
    origenHtml+
    '<h2 style="font-size:13px;color:#253C61;margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;">Paradas en orden óptimo</h2>'+
    tabla+
    '<div style="border-top:2px solid #253C61;padding-top:10px;margin-top:20px;display:flex;justify-content:space-between;align-items:center;">'+
      '<div style="font-size:10px;color:#888;">Suplevet © '+new Date().getFullYear()+' - Panel Administrable</div>'+
      '<button class="no-print" onclick="window.print()" style="background:#253C61;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:600;">🖨️ Imprimir / Guardar PDF</button>'+
    '</div>'+
    '</body></html>';

  var w=window.open('','_blank');
  if(!w){showToast('Activa los popups para generar el PDF','er');return;}
  w.document.write(html);
  w.document.close();
}
