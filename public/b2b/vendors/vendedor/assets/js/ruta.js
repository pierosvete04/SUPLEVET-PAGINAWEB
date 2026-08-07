// ============================================================
// VRPTW — Mi Ruta (Suplevet Route Optimizer)
// ============================================================
// Upsert genérico vía PostgREST: evita 409 por choque de unique constraint
function sbUpsert(tabla,filas,onConflict){
  if(!filas||!filas.length)return Promise.resolve([]);
  var headers=getHeaders();
  headers['Prefer']='resolution=merge-duplicates,return=representation';
  return fetch(SB+'/rest/v1/'+tabla+'?on_conflict='+onConflict,{method:'POST',headers:headers,body:JSON.stringify(filas)})
    .then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(r.status+' '+t);});return r.json();});
}

var VELOCIDAD_CAMINATA_KMH = 4.5;
var _rutaFechaSel = null;     // 'YYYY-MM-DD' currently shown in builder
var _rutaVetes = [];          // clientes_vet cache for checklist (solo las del vendedor, con coordenadas)
var _rutaVetesSinUbicacion = []; // nombres de vets propias (según ventas) que aún no tienen coordenadas en clientes_vet
var _rutaSeleccion = {};      // { clienteId: {marcado:bool, hora_especifica:string|null} }
var _rutaFiltroBusq = '';     // texto del buscador del dropdown
var _rutaFiltroZona = '';     // zona seleccionada en el filtro del dropdown ('' = todas)

function tiempoCaminataMin(lat1, lon1, lat2, lon2){
  var R=6371;
  var dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+
        Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
        Math.sin(dLon/2)*Math.sin(dLon/2);
  var distKm=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return (distKm/VELOCIDAD_CAMINATA_KMH)*60;
}
function horaAMinutos(s){if(!s)return null;var p=s.split(':');return (+p[0])*60+(+p[1]);}
function minutosAHora(min){
  min=Math.round(min);
  var h=Math.floor(min/60)%24,m=min%60;
  return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;
}

// ── VRPTW heuristic: nearest-neighbor + time-window penalty ──
function optimizarRuta(origen, visitas, horaInicioStr){
  var tiempoActual=horaAMinutos(horaInicioStr);
  var posActual={lat:origen.latitud,lon:origen.longitud};
  var pendientes=visitas.slice();
  var rutaOrdenada=[];
  var iteraciones=0, MAX_ITER=1000;

  while(pendientes.length>0 && iteraciones<MAX_ITER){
    iteraciones++;
    var mejorCandidato=null, mejorScore=Infinity;

    for(var i=0;i<pendientes.length;i++){
      var visita=pendientes[i];
      var minCaminata=tiempoCaminataMin(posActual.lat,posActual.lon,visita.latitud,visita.longitud);
      var llegada=tiempoActual+minCaminata;
      var inicioVentana=horaAMinutos(visita.hora_inicio_ventana)||0;
      var finVentana=horaAMinutos(visita.hora_fin_ventana);if(finVentana===null)finVentana=23*60+59;
      var horaEspecifica=horaAMinutos(visita.hora_especifica);

      if(horaEspecifica!==null){
        var diff=Math.abs(llegada-horaEspecifica);
        var penalizacion=diff>30?diff*3:diff;
        if(penalizacion<mejorScore){
          mejorScore=penalizacion;
          mejorCandidato={visita:visita,llegada:Math.max(llegada,horaEspecifica),espera:Math.max(0,horaEspecifica-llegada)};
        }
        continue;
      }
      if(llegada>finVentana)continue;
      var llegadaReal=Math.max(llegada,inicioVentana);
      var score=llegadaReal+minCaminata*0.5;
      if(score<mejorScore){
        mejorScore=score;
        mejorCandidato={visita:visita,llegada:llegadaReal,espera:Math.max(0,inicioVentana-llegada)};
      }
    }

    if(!mejorCandidato){tiempoActual+=15;continue;}

    var v=mejorCandidato.visita, llegadaF=mejorCandidato.llegada, espera=mejorCandidato.espera;
    var dur=v.tiempo_visita_minutos||20;
    rutaOrdenada.push({
      id:v.id, nombre_cliente:v.nombre_cliente, direccion:v.direccion, distrito:v.distrito,
      latitud:v.latitud, longitud:v.longitud, hora_especifica:v.hora_especifica,
      orden_visita:rutaOrdenada.length+1,
      hora_estimada_llegada:minutosAHora(llegadaF),
      minutos_espera:Math.round(espera),
      hora_salida:minutosAHora(llegadaF+dur),
      doctora:v.doctora||'',
      num_medico:v.num_medico||''
    });
    tiempoActual=llegadaF+dur;
    posActual={lat:v.latitud,lon:v.longitud};
    pendientes=pendientes.filter(function(p){return p.id!==v.id;});
  }
  return rutaOrdenada;
}

function generarURLGoogleMaps(ruta, origen){
  if(!ruta.length)return null;
  var base='https://www.google.com/maps/dir/?api=1&travelmode=walking';
  // Preferimos la dirección en texto (la del punto de partida del vendedor) para que Maps
  // muestre claramente desde dónde sale, en vez de un par de coordenadas sin nombre.
  var origenStr=origen.direccion ? origen.direccion : (origen.latitud+','+origen.longitud);
  var destinoStr=ruta[ruta.length-1].latitud+','+ruta[ruta.length-1].longitud;
  var intermedios=ruta.slice(0,-1).map(function(v){return v.latitud+','+v.longitud;}).join('|');
  var url=base+'&origin='+encodeURIComponent(origenStr)+'&destination='+destinoStr;
  if(intermedios)url+='&waypoints='+encodeURIComponent(intermedios);
  return url;
}
function generarURLSiguientePunto(v){
  return 'https://www.google.com/maps/dir/?api=1&destination='+v.latitud+','+v.longitud+'&travelmode=walking';
}

// ── Parser de URL de Google Maps ──
// Acepta varios formatos para extraer lat/lng sin depender de geocoding aproximado:
//   https://www.google.com/maps/place/Nombre/@-12.046,-77.042,17z/data=!3d-12.046!4d-77.042
//   https://www.google.com/maps?q=-12.046,-77.042
//   https://maps.google.com/?ll=-12.046,-77.042
//   "-12.046, -77.042" (coordenadas pegadas)
// Los enlaces cortos (goo.gl/maps, maps.app.goo.gl) no se pueden expandir desde el navegador
// por CORS — al detectarlos avisamos al usuario para que pegue el enlace largo.
function parseGoogleMapsUrl(url){
  if(!url)return null;
  var s=String(url).trim();
  if(!s)return null;
  if(/^https?:\/\/(goo\.gl\/maps|maps\.app\.goo\.gl)\//i.test(s)){
    var err=new Error('Enlace corto detectado. Abre el enlace en Google Maps, copia la URL larga (la que tiene "@lat,lng") y pégala aquí.');
    err.shortUrl=true;throw err;
  }
  var m;
  // Prioridad 1: coordenadas exactas del PIN (formato "!3d<lat>!4d<lng>" dentro de
  // data=... en URLs de tipo /place/). El "@lat,lng" que sigue al nombre del lugar
  // es sólo el centro del viewport -- Google lo desplaza para dejar espacio a la
  // tarjeta de info del lugar, y puede quedar a 200-300+ metros del punto real,
  // cruzando incluso a otra calle o distrito. Por eso !3d/!4d debe ganarle a @lat,lng.
  m=s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if(m)return {latitud:parseFloat(m[1]),longitud:parseFloat(m[2])};
  m=s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if(m)return {latitud:parseFloat(m[1]),longitud:parseFloat(m[2])};
  m=s.match(/[?&](?:q|ll|center|destination)=(-?\d+\.\d+)[,%2C\s]+(-?\d+\.\d+)/i);
  if(m)return {latitud:parseFloat(m[1]),longitud:parseFloat(m[2])};
  m=s.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if(m)return {latitud:parseFloat(m[1]),longitud:parseFloat(m[2])};
  return null;
}

// ── Geocoding (OpenStreetMap Nominatim — sin API key) ──
function geocodificarDireccion(texto){
  var q=encodeURIComponent(texto+', Lima, Perú');
  return fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+q,{headers:{'Accept-Language':'es'}})
    .then(function(r){return r.json();})
    .then(function(arr){
      if(!arr||!arr.length)return null;
      return {latitud:parseFloat(arr[0].lat),longitud:parseFloat(arr[0].lon),direccion:arr[0].display_name};
    });
}

// Reverse geocoding: convierte coordenadas en dirección legible (Nominatim)
function reverseGeocodificar(lat,lon){
  return fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat='+lat+'&lon='+lon,{headers:{'Accept-Language':'es'}})
    .then(function(r){return r.json();})
    .then(function(data){
      if(!data||data.error)return null;
      // Preferir dirección corta (road + house_number + suburb) sobre display_name completo
      var a=data.address||{};
      var partes=[
        (a.road||a.pedestrian||a.footway||''),
        (a.house_number||''),
        (a.suburb||a.neighbourhood||a.quarter||'')
      ].map(function(p){return p.trim();}).filter(Boolean);
      return partes.length?partes.join(' '):(data.display_name||null);
    });
}

// Resuelve coords desde URL de Maps si viene, o cae a Nominatim con "calle, distrito".
// Si la URL no es parseable, no abortamos: usamos la dirección textual como fallback.
function resolverCoordsUbicacion(calle,distrito,mapsUrl){
  var dir=[calle,distrito].filter(Boolean).join(', ');
  if(mapsUrl){
    var coords;
    try{coords=parseGoogleMapsUrl(mapsUrl);}catch(e){return Promise.reject(e);}
    if(coords){
      if(dir){coords.direccion=dir;return Promise.resolve(coords);}
      // No se escribió calle/distrito: pedir la dirección real a partir de las
      // coordenadas (reverse geocoding) en vez de guardar "lat, lon" como texto.
      return reverseGeocodificar(coords.latitud,coords.longitud).then(function(dirEncontrada){
        coords.direccion=dirEncontrada||(coords.latitud+', '+coords.longitud);
        return coords;
      });
    }
  }
  if(!dir)return Promise.reject(new Error('Pega una URL de Google Maps válida o completa calle/distrito.'));
  return geocodificarDireccion(dir).then(function(r){
    if(!r)throw new Error('No encontramos esa dirección. Pega la URL de Google Maps de la veterinaria para una ubicación exacta.');
    return r;
  });
}

// Geocodifica "calle, distrito" (o usa URL de Google Maps) y guarda/actualiza la fila
// de clientes_vet por nombre (case-insensitive) — usado tanto desde "Mi Ruta" como
// desde "Mis Clientes" para que el vendedor pueda agregarle ubicación a SUS veterinarias.
function guardarUbicacionVet(nombreVet,calle,distrito,zonaFallback,mapsUrl){
  if(!mapsUrl && (!calle||!distrito))return Promise.reject(new Error('Pega una URL de Google Maps o completa calle/número y distrito.'));
  return resolverCoordsUbicacion(calle,distrito,mapsUrl).then(function(res){
    var direccionFinal=[calle,distrito].filter(Boolean).join(', ')||res.direccion||(res.latitud+', '+res.longitud);
    var datos={direccion:direccionFinal,distrito:distrito||null,latitud:res.latitud,longitud:res.longitud};
    // Lookup case-insensitive (ilike): evita crear duplicados cuando ventas guarda
    // el nombre en mayúsculas (HEALTHY PETS) y clientes_vet ya tiene la fila en
    // su casing original (Healthy Pets). Sin esto, el modal "no encuentra" la
    // ubicación que sí existe y se generan filas duplicadas.
    return sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombreVet)+'&select=id')
      .then(function(filas){
        if(filas&&filas.length)return sbU('clientes_vet',filas[0].id,datos);
        datos.nombre_vet=nombreVet;
        if(zonaFallback)datos.zona=zonaFallback;
        return sbP('clientes_vet',datos);
      });
  });
}

// Limpia las coords/dirección de una veterinaria (la regresa a "Sin ubicación")
function quitarUbicacionVet(nombreVet){
  return sbG('clientes_vet','nombre_vet=ilike.'+encodeURIComponent(nombreVet)+'&select=id')
    .then(function(filas){
      if(!filas||!filas.length)return null;
      return sbU('clientes_vet',filas[0].id,{direccion:null,distrito:null,latitud:null,longitud:null});
    });
}

// ============================================================
// Paso 1: capturar el punto de partida (domicilio) del vendedor
// ============================================================
function inicializarRuta(){
  var cont=gel('ruta-root');
  if(!cont)return;
  if(CUR.origen_latitud&&CUR.origen_longitud){
    renderConstructorRuta();
    return;
  }
  // No tiene domicilio guardado todavía: pedirlo con un formulario estructurado
  var fc='width:100%;padding:.6rem .8rem;border:1px solid var(--bd);border-radius:8px;box-sizing:border-box;';
  var lc='font-size:11px;color:var(--tl);display:block;margin-bottom:.25rem;';
  cont.innerHTML=
    '<div class="card" style="padding:1.2rem;max-width:560px;">'+
      '<h3 style="margin:0 0 .4rem;">📍 ¿Desde dónde inicias tu día?</h3>'+
      '<p style="font-size:13px;color:var(--tl);margin:0 0 .9rem;">Ingresa tu dirección (casa o punto habitual de partida). La usaremos para calcular tu ruta óptima cada día. Solo se pide una vez — luego puedes cambiarla.</p>'+
      '<div style="display:grid;grid-template-columns:1fr 140px;gap:.7rem;margin-bottom:.7rem;">'+
        '<div><label style="'+lc+'">CALLE Y NÚMERO</label><input id="ruta-or-calle" type="text" placeholder="Av. Javier Prado Este 123" style="'+fc+'"></div>'+
        '<div><label style="'+lc+'">DISTRITO</label><input id="ruta-or-distrito" type="text" placeholder="San Isidro" style="'+fc+'"></div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 140px;gap:.7rem;margin-bottom:.7rem;">'+
        '<div><label style="'+lc+'">REFERENCIA / DEPARTAMENTO <span style="opacity:.6;">(opcional)</span></label><input id="ruta-or-ref" type="text" placeholder="Depa 502, frente al parque" style="'+fc+'"></div>'+
        '<div><label style="'+lc+'">CÓDIGO POSTAL <span style="opacity:.6;">(opcional)</span></label><input id="ruta-or-cp" type="text" placeholder="15036" style="'+fc+'"></div>'+
      '</div>'+
      '<div style="margin-bottom:.9rem;">'+
        '<label style="'+lc+'">🗺️ URL DE GOOGLE MAPS <span style="opacity:.6;">(recomendado para mayor precisión)</span></label>'+
        '<input id="ruta-or-maps" type="text" placeholder="https://www.google.com/maps/place/.../@-12.046,-77.042,17z" style="'+fc+'">'+
        '<div style="font-size:11px;color:var(--tl);margin-top:4px;line-height:1.35;">Abre tu domicilio en Google Maps, pulsa <strong>Compartir → Copiar enlace</strong> y pega aquí. Si tu dirección no se encuentra automáticamente, esta URL fija las coordenadas exactas.</div>'+
      '</div>'+
      '<button class="btn btn-cta" onclick="guardarOrigenVendedor()">Guardar mi punto de partida</button>'+
      '<div id="ruta-origen-msg" style="font-size:12px;margin-top:.6rem;color:var(--tl);"></div>'+
    '</div>';
}

function guardarOrigenVendedor(){
  var msg=gel('ruta-origen-msg');
  var calle=(gel('ruta-or-calle').value||'').trim();
  var distrito=(gel('ruta-or-distrito').value||'').trim();
  var ref=(gel('ruta-or-ref').value||'').trim();
  var cp=(gel('ruta-or-cp').value||'').trim();
  var mapsUrl=(gel('ruta-or-maps')?gel('ruta-or-maps').value:'').trim();
  if(!mapsUrl && (!calle||!distrito)){if(msg)msg.textContent='Pega una URL de Google Maps o completa al menos calle/número y distrito.';return;}
  if(msg)msg.textContent=mapsUrl?'Leyendo coordenadas...':'Buscando dirección...';

  var coordsPromise;
  if(mapsUrl){
    try{
      var fromUrl=parseGoogleMapsUrl(mapsUrl);
      if(fromUrl){
        // Si no escribieron calle/distrito, pedir la dirección real a partir de
        // las coordenadas (reverse geocoding) en vez de guardar "lat, lon" como texto.
        coordsPromise=(calle&&distrito)
          ? Promise.resolve(fromUrl)
          : reverseGeocodificar(fromUrl.latitud,fromUrl.longitud).then(function(dirEncontrada){
              fromUrl.direccion=dirEncontrada||(fromUrl.latitud+', '+fromUrl.longitud);
              return fromUrl;
            });
      }
      else if(calle&&distrito){coordsPromise=geocodificarDireccion([calle,distrito,cp].filter(Boolean).join(', '));}
      else {if(msg)msg.textContent='La URL no contiene coordenadas. Pega el enlace largo de Google Maps o completa calle y distrito.';return;}
    } catch(e){if(msg)msg.textContent=e.message;return;}
  } else {
    coordsPromise=geocodificarDireccion([calle,distrito,cp].filter(Boolean).join(', '));
  }

  coordsPromise.then(function(res){
    if(!res)throw new Error('No encontramos esa dirección. Pega la URL de Google Maps para coordenadas exactas.');
    var direccionFinal=[calle,ref,distrito,cp].filter(Boolean).join(', ')||res.direccion||(res.latitud+', '+res.longitud);
    return sbU('vendedores',CUR.id,{origen_latitud:res.latitud,origen_longitud:res.longitud,origen_direccion:direccionFinal})
      .then(function(){
        CUR.origen_latitud=res.latitud;CUR.origen_longitud=res.longitud;CUR.origen_direccion=direccionFinal;
        if(msg)msg.textContent='✓ Guardado: '+direccionFinal;
        setTimeout(renderConstructorRuta,600);
      });
  }).catch(function(e){if(msg)msg.textContent=SVUI.error(e);});
}

// ============================================================
// Paso 2: constructor — elegir fecha + veterinarias a visitar
// ============================================================
function renderConstructorRuta(){
  var cont=gel('ruta-root');
  if(!cont)return;
  _rutaFechaSel=_rutaFechaSel||hoy();
  cont.innerHTML=
    '<div class="card" style="padding:1rem;margin-bottom:.8rem;">'+
      '<div style="display:flex;flex-wrap:wrap;gap:.8rem;align-items:flex-end;justify-content:space-between;">'+
        '<div>'+
          '<label style="font-size:11px;color:var(--tl);display:block;margin-bottom:.2rem;">FECHA DE LA RUTA</label>'+
          '<input id="ruta-fecha-input" type="date" value="'+_rutaFechaSel+'" onchange="cambiarFechaRuta(this.value)" style="padding:.5rem .7rem;border:1px solid var(--bd);border-radius:8px;">'+
        '</div>'+
        '<div style="font-size:11px;color:var(--tl);">Inicio: '+(CUR.origen_direccion||'—')+' &nbsp;<a href="javascript:void(0)" onclick="cambiarOrigenVendedor()">cambiar</a></div>'+
      '</div>'+
      '<div style="margin-top:.5rem;text-align:right;">'+
        '<a href="javascript:void(0)" onclick="corregirDireccionesCoordenadas()" style="font-size:11px;color:var(--tl);">🔧 Corregir direcciones que aparecen como coordenadas</a>'+
      '</div>'+
      '<div id="ruta-fix-dir-msg" style="font-size:11px;margin-top:.3rem;color:var(--tl);"></div>'+
    '</div>'+
    '<div class="card" style="padding:1rem;margin-bottom:.8rem;">'+
      '<h3 style="margin:0 0 .3rem;">¿A qué veterinarias vas a ir?</h3>'+
      '<p style="font-size:12px;color:var(--tl);margin:0 0 .6rem;">Elige las que visitarás ese día. Si tienes una cita a una hora exacta, indícala — el sistema ajustará el orden y los horarios del resto alrededor de esa cita.</p>'+
      '<div style="position:relative;">'+
        '<button id="ruta-dd-btn" type="button" onclick="toggleVetDropdown()" style="width:100%;text-align:left;padding:.65rem .9rem;border:1px solid var(--bd);border-radius:8px;background:#fff;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">'+
          '<span id="ruta-dd-label">Cargando veterinarias...</span><span>▾</span>'+
        '</button>'+
        '<div id="ruta-dd-panel" style="display:none;position:absolute;z-index:20;top:calc(100% + 4px);left:0;right:0;max-height:380px;overflow-y:auto;background:#fff;border:1px solid var(--bd);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);"></div>'+
      '</div>'+
      '<button class="btn btn-cta" style="margin-top:.9rem;" onclick="generarRutaDesdeSeleccion()">🧭 Generar mi ruta óptima</button>'+
      '<div id="ruta-gen-msg" style="font-size:12px;margin-top:.5rem;color:var(--tl);"></div>'+
    '</div>'+
    '<div class="card" id="ruta-resultado-card" style="display:none;"><div id="lista-paradas"></div></div>';

  // Importante: primero resetea la selección (cargarRutaExistente limpia _rutaSeleccion)
  // y recién después pinta el checklist — si se pinta antes, muestra marcas y
  // conteos de la fecha anterior que ya no corresponden al estado real.
  cargarRutaExistente(_rutaFechaSel);
  cargarChecklistVeterinarias();
}

// Repara veterinarias cuya "dirección" quedó guardada como texto de coordenadas
// (ej. "-12.046, -77.042") porque se guardaron pegando sólo la URL de Google Maps,
// sin calle/distrito. Busca la dirección real por reverse geocoding y la actualiza.
function corregirDireccionesCoordenadas(){
  var msg=gel('ruta-fix-dir-msg');
  if(msg){msg.style.color='var(--tl)';msg.textContent='Buscando direcciones para corregir…';}
  var reCoord=/^-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+$/;
  sbG('clientes_vet','select=id,nombre_vet,direccion,latitud,longitud&latitud=not.is.null&longitud=not.is.null')
  .then(function(filas){
    filas=filas||[];
    var pendientes=filas.filter(function(f){return !f.direccion||reCoord.test((f.direccion||'').trim());});
    if(!pendientes.length){
      if(msg){msg.style.color='var(--ok)';msg.textContent='No hay direcciones pendientes de corregir ✅';}
      return;
    }
    if(msg)msg.textContent='Corrigiendo '+pendientes.length+' dirección(es)…';
    var i=0,corregidas=0;
    function siguiente(){
      if(i>=pendientes.length){
        if(msg){msg.style.color='var(--ok)';msg.textContent='Listo: '+corregidas+' dirección(es) corregida(s) ✅';}
        cargarChecklistVeterinarias();
        return;
      }
      var f=pendientes[i];i++;
      reverseGeocodificar(f.latitud,f.longitud)
        .then(function(dir){
          if(!dir)return Promise.resolve();
          corregidas++;
          return sbU('clientes_vet',f.id,{direccion:dir});
        })
        .catch(function(){})
        .then(siguiente);
    }
    siguiente();
  })
  .catch(function(e){if(msg){msg.style.color='var(--er)';msg.textContent=SVUI.error(e);}});
}

function toggleVetDropdown(open){
  var panel=gel('ruta-dd-panel');
  if(!panel)return;
  var mostrar = (typeof open==='boolean') ? open : (panel.style.display==='none');
  panel.style.display = mostrar?'block':'none';
}
// Cierra el dropdown si se hace click fuera
document.addEventListener('click',function(e){
  var panel=gel('ruta-dd-panel'),btn=gel('ruta-dd-btn');
  if(!panel||panel.style.display==='none')return;
  if(panel.contains(e.target)||((btn&&btn.contains(e.target))))return;
  panel.style.display='none';
});

function actualizarEtiquetaDropdown(){
  var lbl=gel('ruta-dd-label');
  if(!lbl)return;
  var n=vetesSeleccionadasValidas().length;
  lbl.textContent = n>0 ? (n+' veterinaria'+(n!==1?'s':'')+' seleccionada'+(n!==1?'s':'')) : 'Seleccionar veterinarias…';
}

// Sólo cuentan las marcadas que existen realmente en el listado actual de veterinarias
// (descarta selecciones "fantasma" provenientes de visitas antiguas a clientes ya eliminados)
function vetesSeleccionadasValidas(){
  var idsValidos={};
  _rutaVetes.forEach(function(v){idsValidos[v.id]=true;});
  return Object.keys(_rutaSeleccion).filter(function(id){
    return _rutaSeleccion[id].marcado && idsValidos[id];
  });
}

// Elimina del estado las selecciones que ya no corresponden a una veterinaria existente
function limpiarSeleccionFantasma(){
  var idsValidos={};
  _rutaVetes.forEach(function(v){idsValidos[v.id]=true;});
  Object.keys(_rutaSeleccion).forEach(function(id){
    if(!idsValidos[id])delete _rutaSeleccion[id];
  });
}

function cambiarOrigenVendedor(){
  CUR.origen_latitud=null;CUR.origen_longitud=null;CUR.origen_direccion=null;
  inicializarRuta();
}

function cambiarFechaRuta(f){
  _rutaFechaSel=f;
  cargarRutaExistente(f);
}

function cargarChecklistVeterinarias(){
  var box=gel('ruta-dd-panel');
  if(!box)return;
  if(_rutaVetes.length){limpiarSeleccionFantasma();pintarChecklist();return;}
  // "Mi Ruta" debe mostrar SOLO las veterinarias del propio vendedor — no el listado
  // global de clientes_vet (eso mezclaba vets de otras zonas/vendedores). clientes_vet.zona
  // todavía no está poblado en los registros existentes, así que no sirve como filtro directo.
  // En cambio, "ventas" SÍ tiene el historial real de cada vendedor con el nombre de cada
  // veterinaria que visitó/vendió — cruzamos esos nombres con clientes_vet para traer
  // las que ya tienen coordenadas geocodificadas.
  // El checklist debe respetar las zonas asignadas al vendedor: si Henry sólo cubre
  // "Salamanca" y "Surquillo", no tiene sentido que aparezcan veterinarias de
  // San Miguel o Magdalena del Mar — aunque alguna venta histórica las haya tocado.
  // Por eso filtramos por zona desde ya, usando como referencia la zona registrada
  // en cada venta (es la fuente más fiable; clientes_vet.zona suele estar vacío).
  var zonasAsig=(CUR&&Array.isArray(CUR.zonas_asignadas))?CUR.zonas_asignadas.slice():[];
  var aplicaFiltroZona=zonasAsig.length>0;
  var zonasAsigLC={};
  zonasAsig.forEach(function(z){zonasAsigLC[(z||'').toLowerCase()]=true;});
  var nombresPropios={}; // lowercase -> nombre original (primera aparición)
  var zonaPorVet={};     // lowercase nombre -> zona observada (para fallback)
  (_ventas||[]).forEach(function(v){
    if(!v.veterinaria)return;
    if(aplicaFiltroZona && v.zona && !zonasAsigLC[(v.zona||'').toLowerCase()])return;
    var key=v.veterinaria.trim().toLowerCase();
    if(!nombresPropios[key])nombresPropios[key]=v.veterinaria.trim();
    if(v.zona && !zonaPorVet[key])zonaPorVet[key]=v.zona;
  });
  sbG('clientes_vet','select=id,nombre_vet,direccion,distrito,latitud,longitud,'+CV_CAMPOS_PERTENENCIA+'&order=nombre_vet.asc')
  .then(function(r){
    r=r||[];
    var conUbicacion={};
    r.forEach(function(cv){
      if(cv.latitud&&cv.longitud)conUbicacion[(cv.nombre_vet||'').trim().toLowerCase()]=true;
    });
    // Criterio de inclusión (cualquiera basta):
    //   a) ya hay ventas con esa veterinaria (nombresPropios), o
    //   b) la veterinaria está en clientes_vet con zona dentro de mis zonas asignadas
    //      — esto permite que el vendedor vea en su ruta clientes añadidos vía
    //      "+ Añadir cliente" o trasladados por admin, aunque todavía no tengan venta.
    _rutaVetes=r.filter(function(v){
      if(!v.latitud||!v.longitud)return false;
      // Transferida a otro vendedor: fuera siempre, aunque tenga histórico mío.
      if(v.vendedor_asignado_id && String(v.vendedor_asignado_id)!==String(CUR&&CUR.id))return false;
      // Transferida a mí: dentro siempre, sin mirar la zona. Es justo el caso de
      // una sede fuera de mi zona que la empresa me asignó en exclusiva.
      if(v.vendedor_asignado_id)return true;

      var key=(v.nombre_vet||'').trim().toLowerCase();
      var enHistorial=!!nombresPropios[key];
      if(esMiCliente(v))return true;
      if(!enHistorial)return false;
      // Está en mi historial pero clientes_vet.zona es de OTRA zona: se descarta
      // para no arrastrar restos de la cartera de otro vendedor.
      if(aplicaFiltroZona && v.zona && !zonasAsigLC[(v.zona||'').toLowerCase()])return false;
      return true;
    });
    // "Sin ubicación":
    //  - todas las del historial sin coords (como antes)
    //  - + las de clientes_vet en mis zonas sin coords (clientes nuevos sin geocode aún)
    var sinUbicSet={};
    Object.keys(nombresPropios).forEach(function(k){
      if(!conUbicacion[k])sinUbicSet[k]=nombresPropios[k];
    });
    r.forEach(function(cv){
      if(cv.latitud&&cv.longitud)return;
      var key=(cv.nombre_vet||'').trim().toLowerCase();
      if(!enMiZona(cv.zona))return;
      if(!sinUbicSet[key])sinUbicSet[key]=cv.nombre_vet;
    });
    _rutaVetesSinUbicacion=Object.keys(sinUbicSet).map(function(k){return sinUbicSet[k];}).sort();
    limpiarSeleccionFantasma();
    pintarChecklist();
  })
  .catch(function(e){box.innerHTML='<p style="color:var(--er);">'+SVUI.error(e,'cargar las veterinarias')+'</p>';});
}

function pintarChecklist(){
  var box=gel('ruta-dd-panel');
  if(!box)return;
  actualizarEtiquetaDropdown();
  if(!_rutaVetes.length&&!_rutaVetesSinUbicacion.length){box.innerHTML='<p style="color:var(--tl);padding:.8rem;">No hay veterinarias registradas todavía.</p>';return;}

  // ── Filtros: zona (sólo las asignadas al vendedor) + búsqueda libre ──
  var zonasAsig=(CUR&&Array.isArray(CUR.zonas_asignadas))?CUR.zonas_asignadas.slice():[];
  var optsZona='<option value="">Todas las zonas</option>';
  zonasAsig.forEach(function(z){
    var sel=(z===_rutaFiltroZona)?' selected':'';
    optsZona+='<option value="'+z.replace(/"/g,'&quot;')+'"'+sel+'>'+z+'</option>';
  });
  var busqVal=(_rutaFiltroBusq||'').replace(/"/g,'&quot;');
  var headerHtml=
    '<div style="position:sticky;top:0;background:#fff;padding:.55rem .55rem .45rem;border-bottom:1px solid var(--bd);display:flex;gap:.4rem;flex-wrap:wrap;z-index:1;">'+
      '<input id="ruta-dd-busq" type="text" placeholder="🔍 Buscar veterinaria…" value="'+busqVal+'" '+
        'oninput="filtrarChecklistVetes(this.value)" '+
        'style="flex:1 1 160px;min-width:0;font-size:13px;padding:.45rem .6rem;border:1px solid var(--bd);border-radius:6px;">'+
      (zonasAsig.length>0
        ? '<select id="ruta-dd-zona" onchange="filtrarChecklistZona(this.value)" style="font-size:13px;padding:.45rem .5rem;border:1px solid var(--bd);border-radius:6px;background:#fff;">'+optsZona+'</select>'
        : '')+
    '</div>';

  // Aplicar filtros sobre los datos ya cargados (no vuelve a consultar Supabase)
  var q=(_rutaFiltroBusq||'').trim().toLowerCase();
  var fz=(_rutaFiltroZona||'').trim().toLowerCase();
  function matchTexto(s){return !q||(s||'').toLowerCase().indexOf(q)>=0;}
  function matchZona(zv){
    if(!fz)return true;
    return (zv||'').toLowerCase()===fz;
  }
  var vetsFiltradas=_rutaVetes.filter(function(v){
    return matchTexto(v.nombre_vet)&&matchZona(v.zona);
  });
  // Para las "Sin ubicación", como no tenemos zona en clientes_vet, usamos la zona observada
  // en las ventas del vendedor para esa vet (zonaPorVet se reconstruye aquí mismo).
  var zonaPorVetSU={};
  (_ventas||[]).forEach(function(v){
    if(!v.veterinaria||!v.zona)return;
    var k=v.veterinaria.trim().toLowerCase();
    if(!zonaPorVetSU[k])zonaPorVetSU[k]=v.zona;
  });
  var sinUbicFiltradas=_rutaVetesSinUbicacion.filter(function(nombre){
    var z=zonaPorVetSU[(nombre||'').trim().toLowerCase()]||'';
    return matchTexto(nombre)&&matchZona(z);
  });

  var html=headerHtml+'<div>';

  if(!vetsFiltradas.length&&!sinUbicFiltradas.length){
    html+='<p style="color:var(--tl);padding:.9rem .6rem;font-size:13px;">Sin resultados con esos filtros.</p>';
  } else if(!vetsFiltradas.length){
    html+='<p style="color:var(--tl);padding:.6rem .4rem;font-size:13px;">No hay veterinarias con ubicación que coincidan. Agrega la dirección de las que aparecen abajo para incluirlas en tu ruta.</p>';
  }
  for(var i=0;i<vetsFiltradas.length;i++){
    var v=vetsFiltradas[i];
    var sel=_rutaSeleccion[v.id]||{marcado:false,hora_especifica:''};
    html+='<div class="rv-item" style="display:grid;grid-template-columns:32px 1fr 110px;align-items:center;gap:.8rem;padding:.7rem .4rem;border-bottom:1px solid var(--bd);">'+
      '<input type="checkbox" id="rv-chk-'+v.id+'" '+(sel.marcado?'checked':'')+' onchange="toggleVetSeleccion(\''+v.id+'\',this.checked)" '+
        'style="width:20px;height:20px;cursor:pointer;justify-self:start;">'+
      '<div onclick="var c=gel(\'rv-chk-'+v.id+'\');c.checked=!c.checked;toggleVetSeleccion(\''+v.id+'\',c.checked);" style="cursor:pointer;min-width:0;">'+
        '<div style="font-weight:600;font-size:14px;line-height:1.3;">'+v.nombre_vet+'</div>'+
        '<div style="font-size:12px;color:var(--tl);line-height:1.3;">'+(v.direccion||'')+(v.distrito?' · '+v.distrito:'')+(v.zona?' · '+v.zona:'')+'</div>'+
      '</div>'+
      '<input type="time" value="'+(sel.hora_especifica||'')+'" title="Hora exacta de cita (opcional)" '+
        'onchange="setHoraVetSeleccion(\''+v.id+'\',this.value)" style="font-size:13px;padding:.4rem;border:1px solid var(--bd);border-radius:6px;width:100%;box-sizing:border-box;">'+
    '</div>';
  }
  if(sinUbicFiltradas.length){
    html+='<div style="padding:.7rem .4rem .3rem;border-top:1px solid var(--bd);margin-top:.4rem;">'+
      '<div style="font-size:12px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.04em;">Sin ubicación ('+sinUbicFiltradas.length+')</div>'+
      '<div style="font-size:11px;color:var(--tl);margin-top:2px;">Agrega su dirección para poder incluirlas en tu ruta.</div>'+
    '</div>';
    for(var j=0;j<sinUbicFiltradas.length;j++){
      var nombreSU=sinUbicFiltradas[j];
      // Mantenemos el idx original de _rutaVetesSinUbicacion para que guardarUbicacionDesdeRuta(idx) funcione
      var idxOrig=_rutaVetesSinUbicacion.indexOf(nombreSU);
      var fid='su-'+idxOrig;
      var fc='font-size:13px;padding:.5rem;border:1px solid var(--bd);border-radius:6px;width:100%;box-sizing:border-box;';
      html+='<div class="rv-item" style="padding:.6rem .4rem;border-bottom:1px solid var(--bd);">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:.6rem;">'+
          '<div style="font-weight:600;font-size:14px;line-height:1.3;min-width:0;">📍 '+nombreSU+'</div>'+
          '<button type="button" onclick="toggleAgregarUbicacionVet(\''+fid+'\')" style="font-size:12px;font-weight:700;padding:.35rem .6rem;border:1px solid var(--brand);border-radius:6px;background:transparent;color:var(--brand);cursor:pointer;white-space:nowrap;">+ Agregar ubicación</button>'+
        '</div>'+
        '<div id="form-'+fid+'" style="display:none;margin-top:.6rem;gap:.4rem;grid-template-columns:1fr;">'+
          '<input type="text" id="calle-'+fid+'" placeholder="Calle / número" style="'+fc+'">'+
          '<input type="text" id="distrito-'+fid+'" placeholder="Distrito" style="'+fc+'">'+
          '<input type="text" id="maps-'+fid+'" placeholder="🗺️ URL de Google Maps (opcional, pero más exacta)" style="'+fc+'">'+
          '<div style="font-size:11px;color:var(--tl);line-height:1.35;">Si la dirección no se encuentra, abre Google Maps, marca el local, copia el enlace (botón “Compartir”) y pégalo arriba.</div>'+
          '<button type="button" onclick="guardarUbicacionDesdeRuta('+idxOrig+')" style="font-size:13px;font-weight:700;padding:.5rem;border:none;border-radius:6px;background:var(--brand);color:#fff;cursor:pointer;">Guardar ubicación</button>'+
          '<div id="msg-'+fid+'" style="font-size:12px;"></div>'+
        '</div>'+
      '</div>';
    }
  }
  html+='</div>';
  box.innerHTML=html;
  // Devuelve el foco al buscador después de re-pintar para que el vendedor pueda seguir tipeando
  var inp=gel('ruta-dd-busq');
  if(inp&&document.activeElement!==inp&&q){inp.focus();var l=inp.value.length;inp.setSelectionRange(l,l);}
}

// Handlers de los filtros del dropdown (re-pintan en memoria, sin volver a Supabase)
function filtrarChecklistVetes(v){
  _rutaFiltroBusq=v||'';
  pintarChecklist();
}
function filtrarChecklistZona(v){
  _rutaFiltroZona=v||'';
  pintarChecklist();
}

function toggleAgregarUbicacionVet(fid){
  var f=gel('form-'+fid);
  if(!f)return;
  f.style.display=(f.style.display==='grid')?'none':'grid';
}

function guardarUbicacionDesdeRuta(idx){
  var nombreVet=_rutaVetesSinUbicacion[idx];
  if(!nombreVet)return;
  var fid='su-'+idx;
  var calle=((gel('calle-'+fid)||{}).value||'').trim();
  var distrito=((gel('distrito-'+fid)||{}).value||'').trim();
  var mapsUrl=((gel('maps-'+fid)||{}).value||'').trim();
  var msg=gel('msg-'+fid);
  if(msg){msg.style.color='var(--tl)';msg.textContent=mapsUrl?'Leyendo coordenadas…':'Buscando dirección…';}
  var zonaFallback='';
  for(var i=0;i<(_ventas||[]).length;i++){
    if((_ventas[i].veterinaria||'').trim().toLowerCase()===nombreVet.trim().toLowerCase()){zonaFallback=_ventas[i].zona||'';break;}
  }
  guardarUbicacionVet(nombreVet,calle,distrito,zonaFallback,mapsUrl)
  .then(function(){
    if(msg){msg.style.color='var(--ok)';msg.textContent='Ubicación guardada ✅';}
    _rutaVetes=[];
    setTimeout(function(){cargarChecklistVeterinarias();},700);
  })
  .catch(function(e){
    if(msg){msg.style.color='var(--er)';msg.textContent=SVUI.error(e);}
  });
}

function toggleVetSeleccion(id,marcado){
  if(!_rutaSeleccion[id])_rutaSeleccion[id]={marcado:false,hora_especifica:''};
  _rutaSeleccion[id].marcado=marcado;
  actualizarEtiquetaDropdown();
}
function setHoraVetSeleccion(id,hora){
  if(!_rutaSeleccion[id])_rutaSeleccion[id]={marcado:false,hora_especifica:''};
  _rutaSeleccion[id].hora_especifica=hora||'';
}

// ============================================================
// Paso 3: generar — guarda config_rutas + visitas_dia, optimiza,
// y refleja un resumen en el Plan Semanal (el "puente")
// ============================================================
function generarRutaDesdeSeleccion(){
  var msg=gel('ruta-gen-msg');
  var fecha=_rutaFechaSel||hoy();
  limpiarSeleccionFantasma();
  var elegidas=vetesSeleccionadasValidas();
  if(!elegidas.length){if(msg)msg.textContent='Marca al menos una veterinaria.';return;}
  if(msg){msg.textContent='Generando ruta...';msg.style.color='var(--tl)';}

  var configPayload={
    vendedor_id:CUR.id, fecha:fecha,
    origen_latitud:CUR.origen_latitud, origen_longitud:CUR.origen_longitud,
    origen_nombre:CUR.origen_direccion||'Punto de partida', hora_inicio_jornada:'09:00'
  };
  var visitasPayload=elegidas.map(function(clienteId){
    var sel=_rutaSeleccion[clienteId];
    return{
      vendedor_id:CUR.id, cliente_id:clienteId, fecha:fecha,
      hora_especifica:sel.hora_especifica||null, estado:'pendiente'
    };
  });

  sbUpsert('config_rutas',[configPayload],'vendedor_id,fecha')
  .then(function(){
    // El día debe reflejar EXACTAMENTE lo marcado ahora: en vez de calcular qué "sobra"
    // y borrar solo eso (frágil — basta con que el borrado no tenga permiso para que
    // queden filas viejas acumulándose en cada regeneración), borramos TODO lo guardado
    // para esta fecha y reconstruimos desde cero con la selección actual.
    return sbDel('visitas_dia','vendedor_id=eq.'+CUR.id+'&fecha=eq.'+fecha);
  })
  .then(function(){return sbUpsert('visitas_dia',visitasPayload,'vendedor_id,cliente_id,fecha');})
  .then(function(){
    // Verificación: si quedaron más filas que las seleccionadas, el borrado de arriba
    // no tuvo efecto (probable falta del policy RLS de DELETE) — avisamos en vez de
    // mostrar silenciosamente una ruta inflada con paradas que no marcaste.
    return sbG('visitas_dia','vendedor_id=eq.'+CUR.id+'&fecha=eq.'+fecha+'&select=id');
  })
  .then(function(actuales){
    actuales=actuales||[];
    if(actuales.length>elegidas.length){
      throw new Error('Quedaron '+actuales.length+' paradas guardadas pero solo seleccionaste '+elegidas.length+
        '. No se pudieron borrar las anteriores — revisa en Supabase que exista el policy '+
        '"vendedor_borra_sus_visitas" (DELETE) sobre la tabla visitas_dia.');
    }
    return cargarYOptimizarRuta(fecha,true);
  })
  .then(function(ruta){
    if(msg){msg.textContent='✓ Ruta generada — '+(ruta?ruta.length:0)+' paradas.';msg.style.color='var(--ok)';}
    if(ruta&&ruta.length)return reflejarEnPlanSemanal(fecha,ruta);
  })
  .catch(function(e){if(msg){msg.textContent=SVUI.error(e);msg.style.color='var(--er)';}});
}

// Escribe la ruta del día en el Plan Semanal — UNA FILA POR PARADA. Cada veterinaria
// queda en su propia fila de hora (p.ej. 09:45 ALFS PET, 10:12 ZOOMANIA, 11:05 ALAMEDA PET).
// Antes se apilaba todo en una sola celda separado por "·", lo cual era ilegible en mobile.
function reflejarEnPlanSemanal(fechaStr,ruta){
  var fecha=new Date(fechaStr+'T00:00:00');
  var dow=fecha.getDay();
  var diaKey=_DIAS_KEYS[(dow+6)%7];
  var lunes=getLunes(0);
  var diffDias=Math.round((fecha-lunes)/86400000);
  var lunesObjetivo=new Date(lunes); lunesObjetivo.setDate(lunesObjetivo.getDate()+(diffDias-((dow+6)%7)));
  var semanaKey=semKey(lunesObjetivo);
  var TAG='🧭 ';
  var RE_RUTA=/^🧭\s/;

  function hhmm(h){return (h||'').slice(0,5);}

  return sbG('plan_semanal','vendedor_id=eq.'+CUR.id+'&semana_inicio=eq.'+semanaKey)
  .then(function(rows){
    rows=rows||[];
    // 1) Limpiar la celda del día en filas que ya tengan tag 🧭 (ruta anterior).
    //    Si la fila quedaría sin contenido en otros días tampoco, la borramos para no acumular.
    var promesas=[],ids=[];
    rows.forEach(function(r){
      if(!RE_RUTA.test(r[diaKey]||''))return;
      var contenidoOtrosDias=_DIAS_KEYS.some(function(k){return k!==diaKey && (r[k]||'').trim();});
      if(contenidoOtrosDias){
        var u={};u[diaKey]='';promesas.push(sbU('plan_semanal',r.id,u));
      } else {
        ids.push(r.id);promesas.push(sbDel('plan_semanal','id=eq.'+r.id));
      }
    });
    return Promise.all(promesas).then(function(){return rows.filter(function(r){return ids.indexOf(r.id)<0;});});
  })
  .then(function(rowsRest){
    // 2) Para cada parada: si hay fila con esa hora exacta y celda del día vacía, reusarla;
    //    si no, crear una fila nueva.
    var promesas=[];
    ruta.forEach(function(p){
      var hora=hhmm(p.hora_estimada_llegada);
      var contenido=TAG+p.nombre_cliente;
      var fila=rowsRest.filter(function(r){return r.hora===hora && !(r[diaKey]||'').trim();})[0];
      if(fila){
        var u={};u[diaKey]=contenido;promesas.push(sbU('plan_semanal',fila.id,u));
      } else {
        var nueva={vendedor_id:CUR.id,semana_inicio:semanaKey,hora:hora,orden:0,
          lunes:'',martes:'',miercoles:'',jueves:'',viernes:'',sabado:'',domingo:''};
        nueva[diaKey]=contenido;
        promesas.push(sbP('plan_semanal',nueva));
      }
    });
    return Promise.all(promesas);
  })
  .then(function(){
    // 3) Re-ordenar todas las filas por hora ASC para que el render (order=orden.asc) las muestre
    //    en orden cronológico. Filas sin hora quedan al final preservando su orden relativo.
    return sbG('plan_semanal','vendedor_id=eq.'+CUR.id+'&semana_inicio=eq.'+semanaKey);
  })
  .then(function(todas){
    todas=todas||[];
    todas.sort(function(a,b){
      var ha=a.hora||'99:99',hb=b.hora||'99:99';
      if(ha===hb)return (a.orden||0)-(b.orden||0);
      return ha.localeCompare(hb);
    });
    var promesas=[];
    todas.forEach(function(r,i){
      var nuevoOrden=i+1;
      if(r.orden!==nuevoOrden)promesas.push(sbU('plan_semanal',r.id,{orden:nuevoOrden}));
    });
    return Promise.all(promesas);
  })
  .then(function(){if(typeof rPlan==='function'&&gel('page-plan')&&gel('page-plan').classList.contains('active'))rPlan();});
}

// Borra completamente la ruta de un día: visitas_dia + celdas 🧭 del plan_semanal.
// config_rutas se intenta borrar pero puede estar protegido por RLS — al estar visitas_dia
// vacío, la próxima carga muestra "sin paradas" igualmente.
function eliminarRutaDelDia(){
  var fecha=_rutaFechaSel||hoy();
  var paradas=(window.RUTA_ACTUAL&&window.RUTA_ACTUAL.length)||0;

  // El confirm() nativo ofrecía "Aceptar / Cancelar" delante de una acción
  // que borra el trabajo del día. Ahora el botón dice qué hace y va en rojo.
  SVUI.confirmar({
    titulo:'¿Eliminar la ruta del '+fmtFechaLarga(fecha)+'?',
    mensaje:(paradas? 'Se borrarán las '+paradas+' paradas de ese día'
                    : 'Se borrarán las paradas de ese día')+
            ' y sus entradas en el Plan Semanal.\n\n'+
            'Esto no se puede deshacer. Tus visitas y ventas ya registradas no se tocan.',
    confirmar:'Eliminar ruta',
    cancelar:'Conservarla',
    peligro:true
  }).then(function(ok){
    if(!ok)return;
    _eliminarRutaConfirmado(fecha);
  });
}

// Formatea 2026-08-03 como "lunes 3 de agosto". Una fecha ISO dentro de una
// pregunta obliga a descifrarla justo cuando hay que decidir.
function fmtFechaLarga(iso){
  try{
    return new Date(iso+'T00:00:00')
      .toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'});
  }catch(e){ return iso; }
}

function _eliminarRutaConfirmado(fecha){
  var msg=gel('ruta-gen-msg');if(msg){msg.style.color='var(--tl)';msg.textContent='Eliminando ruta...';}
  Promise.all([
    sbDel('visitas_dia','vendedor_id=eq.'+CUR.id+'&fecha=eq.'+fecha),
    sbDel('config_rutas','vendedor_id=eq.'+CUR.id+'&fecha=eq.'+fecha)
  ])
  .then(function(){
    // Limpiar celdas 🧭 de la semana correspondiente al día
    var f=new Date(fecha+'T00:00:00'),dow=f.getDay(),diaKey=_DIAS_KEYS[(dow+6)%7];
    var lunes=getLunes(0),diff=Math.round((f-lunes)/86400000);
    var lunesObj=new Date(lunes);lunesObj.setDate(lunesObj.getDate()+(diff-((dow+6)%7)));
    var semKeyV=semKey(lunesObj);
    return sbG('plan_semanal','vendedor_id=eq.'+CUR.id+'&semana_inicio=eq.'+semKeyV)
      .then(function(rows){
        rows=rows||[];var promesas=[];
        rows.forEach(function(r){
          if(!/^🧭\s/.test(r[diaKey]||''))return;
          var otrosDias=_DIAS_KEYS.some(function(k){return k!==diaKey && (r[k]||'').trim();});
          if(otrosDias){var u={};u[diaKey]='';promesas.push(sbU('plan_semanal',r.id,u));}
          else promesas.push(sbDel('plan_semanal','id=eq.'+r.id));
        });
        return Promise.all(promesas);
      });
  })
  .then(function(){
    _rutaSeleccion={};_rutaVetes=[];
    if(msg){msg.style.color='var(--ok)';msg.textContent='✓ Ruta eliminada.';}
    var card=gel('ruta-resultado-card');if(card)card.style.display='none';
    var cont=gel('lista-paradas');if(cont)cont.innerHTML='';
    cargarChecklistVeterinarias();
    if(typeof rPlan==='function')rPlan();
    setTimeout(function(){if(msg)msg.textContent='';},2500);
  })
  .catch(function(){if(msg){msg.style.color='var(--er)';msg.textContent='No se pudo eliminar la ruta. Revisa tu conexión e inténtalo otra vez.';}});
}

// ============================================================
// Render de paradas + navegación
// ============================================================
function renderizarParadas(ruta){
  var cont=gel('lista-paradas');if(!cont)return;
  if(!ruta||!ruta.length){cont.innerHTML='<p style="padding:1rem;color:var(--tl);">Selecciona veterinarias arriba y genera tu ruta para ver el recorrido.</p>';return;}
  var html='<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.6rem 1rem 0;flex-wrap:wrap;">'+
    '<button class="btn btn-sm" onclick="eliminarRutaDelDia()" style="background:transparent;border:1px solid var(--er);color:var(--er);">🗑️ Eliminar ruta del día</button>'+
    '<div style="display:flex;gap:.4rem;flex-wrap:wrap;">'+
      '<button class="btn-sk btn-sm" onclick="generarPDFRuta()">📄 Exportar PDF</button>'+
      '<button class="btn btn-cta btn-sm" onclick="abrirRutaCompletaEnMaps()">🗺️ Abrir ruta completa en Maps</button>'+
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
      '<div style="flex-shrink:0;display:flex;flex-direction:column;gap:.3rem;">'+
        '<button class="btn btn-cta btn-sm" onclick="navegarA(\''+v.id+'\')">📍 Ir aquí</button>'+
        '<button class="btn-sk btn-sm" onclick="cambiarHoraVisita(\''+v.id+'\')">🕐 Hora</button>'+
      '</div>'+
    '</div>';
  }
  cont.innerHTML=html;
}

function cambiarHoraVisita(visitaId){
  // Antes: prompt() de texto libre. Si escribías "4pm" te lo rechazaba con
  // otro alert() y había que empezar de cero. Ahora es un campo de hora del
  // navegador (con su selector nativo en el móvil) y el error, si lo hay,
  // se ve dentro del mismo diálogo sin perder lo escrito.
  var actual='';
  if(window.RUTA_ACTUAL){
    var v=window.RUTA_ACTUAL.filter(function(x){return x.id===visitaId;})[0];
    if(v&&v.hora_especifica)actual=String(v.hora_especifica).slice(0,5);
  }

  SVUI.pedir({
    titulo:'Cambiar la hora de esta parada',
    mensaje:'La ruta se recalcula sola para que llegues a esa hora.',
    etiqueta:'Hora de regreso',
    tipoCampo:'time',
    valor:actual,
    ayuda:'Formato de 24 horas. Por ejemplo, 16:00 son las 4 de la tarde.',
    confirmar:'Guardar hora',
    validar:function(v){
      if(!v)return 'Elige una hora para poder recalcular la ruta.';
      if(!/^\d{2}:\d{2}$/.test(v))return 'Usa el formato HH:MM. Por ejemplo, 16:00.';
      return null;
    }
  }).then(function(nuevaHora){
    if(nuevaHora===null)return;   // cancelado
    return sbU('visitas_dia',visitaId,{hora_especifica:nuevaHora})
      .then(function(){setSt('Hora actualizada. Recalculando ruta...','ok');return cargarYOptimizarRuta(_rutaFechaSel,true);})
      .then(function(ruta){setTimeout(function(){setSt('');},1500); if(ruta&&ruta.length)return reflejarEnPlanSemanal(_rutaFechaSel,ruta);})
      .catch(function(e){setSt('No pudimos guardar la hora. Revisa tu conexión e inténtalo otra vez.','er');});
  });
}

function navegarA(visitaId){
  if(!window.RUTA_ACTUAL)return;
  var v=window.RUTA_ACTUAL.filter(function(x){return x.id===visitaId;})[0];
  if(!v)return;
  window.open(generarURLSiguientePunto(v),'_blank');
}

function abrirRutaCompletaEnMaps(){
  if(!window.RUTA_ACTUAL||!window.ORIGEN_ACTUAL)return;
  var url=generarURLGoogleMaps(window.RUTA_ACTUAL,window.ORIGEN_ACTUAL);
  if(!url){
    SVUI.avisar({
      titulo:'Todavía no hay ruta',
      mensaje:'Elige las veterinarias que vas a visitar y pulsa "Generar ruta". '+
              'Después podrás abrirla en Google Maps.',
      confirmar:'Entendido'
    });
    return;
  }
  window.open(url,'_blank');
}

// ── Carga + optimiza la ruta de una fecha dada y la pinta ──
function cargarYOptimizarRuta(fecha,mostrar){
  fecha=fecha||_rutaFechaSel||hoy();
  var card=gel('ruta-resultado-card');
  var cont=gel('lista-paradas');
  if(mostrar){
    if(card)card.style.display='';
    if(cont)cont.innerHTML='<p style="padding:1rem;color:var(--tl);">Cargando ruta...</p>';
  }

  return sbG('config_rutas','vendedor_id=eq.'+CUR.id+'&fecha=eq.'+fecha)
  .then(function(configRows){
    var config=configRows&&configRows[0];
    if(!config){
      if(mostrar&&cont)cont.innerHTML='<p style="padding:1rem;color:var(--tl);">Selecciona veterinarias arriba y genera tu ruta para ver el recorrido.</p>';
      return [];
    }
    return sbG('visitas_dia','vendedor_id=eq.'+CUR.id+'&fecha=eq.'+fecha+'&select=*,clientes_vet(*)')
    .then(function(visitas){
      // Si el vendedor tiene zonas asignadas, descartamos cualquier visita guardada
      // que apunte a una veterinaria de otra zona (datos viejos de antes de tener
      // este filtro). Así la ruta sólo muestra lo que pertenece al vendedor.
      var zAsig=(CUR&&Array.isArray(CUR.zonas_asignadas))?CUR.zonas_asignadas:[];
      var fZona=zAsig.length>0;
      var zAsigLC={};
      zAsig.forEach(function(z){zAsigLC[(z||'').toLowerCase()]=true;});
      var visitasFlat=(visitas||[]).filter(function(v){
        if(!(v.clientes_vet&&v.clientes_vet.latitud&&v.clientes_vet.longitud))return false;
        if(fZona && v.clientes_vet.zona && !zAsigLC[(v.clientes_vet.zona||'').toLowerCase()])return false;
        return true;
      }).map(function(v){
        return{
          id:v.id,
          cliente_id:v.cliente_id,
          nombre_cliente:v.clientes_vet.nombre_vet,
          direccion:v.clientes_vet.direccion,
          distrito:v.clientes_vet.distrito,
          latitud:parseFloat(v.clientes_vet.latitud),
          longitud:parseFloat(v.clientes_vet.longitud),
          hora_inicio_ventana:v.hora_inicio_ventana,
          hora_fin_ventana:v.hora_fin_ventana,
          hora_especifica:v.hora_especifica,
          tiempo_visita_minutos:v.clientes_vet.tiempo_visita_minutos||20,
          doctora:v.clientes_vet.doctora||'',
          num_medico:v.clientes_vet.num_medico||''
        };
      });
      // Nota: NO precargamos el checklist con lo ya guardado — cada vez que entras a "Mi Ruta"
      // (o cambias de fecha) arranca sin marcar nada, para que elijas y guardes ese día de forma explícita.

      if(!visitasFlat.length){
        if(mostrar&&cont)cont.innerHTML='<p style="padding:1rem;color:var(--tl);">No tienes visitas seleccionadas para esta fecha.</p>';
        window.RUTA_ACTUAL=[];window.ORIGEN_ACTUAL=null;
        return [];
      }
      var origen={latitud:parseFloat(config.origen_latitud),longitud:parseFloat(config.origen_longitud),direccion:config.origen_nombre||''};
      var rutaOptima=optimizarRuta(origen,visitasFlat,config.hora_inicio_jornada);

      var actualizaciones=rutaOptima.map(function(v){
        return sbU('visitas_dia',v.id,{orden_visita:v.orden_visita,hora_estimada_llegada:v.hora_estimada_llegada});
      });
      return Promise.all(actualizaciones).then(function(){
        window.RUTA_ACTUAL=rutaOptima;
        window.ORIGEN_ACTUAL=origen;
        if(mostrar)renderizarParadas(rutaOptima);
        return rutaOptima;
      });
    });
  })
  .catch(function(e){if(mostrar&&cont)cont.innerHTML='<p style="padding:1rem;color:var(--er);">'+SVUI.error(e,'cargar la ruta')+'</p>';return [];});
}

function cargarRutaExistente(fecha){
  _rutaSeleccion={};
  // mostrar=true: si ya generaste una ruta para esta fecha, debe verse al volver a
  // "Mi Ruta" (antes quedaba oculta con mostrar=false y la pantalla parecía vacía/reseteada).
  cargarYOptimizarRuta(fecha,true);
}
