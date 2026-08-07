var _DIAS_LABELS=['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];
var _DIAS_KEYS=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
// Nombres completos para etiquetas accesibles: "LUN" leido por un lector
// de pantalla no dice nada.
var _DIAS_NOMBRES=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];

function getISOWeek(d){
  var dt=new Date(d);dt.setHours(0,0,0,0);dt.setDate(dt.getDate()+3-(dt.getDay()+6)%7);
  var w1=new Date(dt.getFullYear(),0,4);
  return 1+Math.round(((dt.getTime()-w1.getTime())/86400000-3+(w1.getDay()+6)%7)/7);
}

// Lunes de la semana actual (+ offset en semanas)
function getLunes(ofs){
  var d=new Date();
  var dow=d.getDay(); // 0=domingo, 1=lunes, ..., 6=sabado
  var diffLun=(dow===0?-6:1-dow); // dias hasta el lunes de esta semana
  d.setDate(d.getDate()+diffLun+(ofs||0)*7);
  d.setHours(0,0,0,0);
  return d;
}

// Label legible: "18 - 24 NOV 2026"
function semLabel(l){
  var fin=new Date(l);fin.setDate(fin.getDate()+6);
  var mLun=l.toLocaleDateString('es-PE',{month:'short'}).replace('.','').toUpperCase();
  var mDom=fin.toLocaleDateString('es-PE',{month:'short'}).replace('.','').toUpperCase();
  if(mLun===mDom){
    return l.getDate()+' - '+fin.getDate()+' '+mDom+' '+fin.getFullYear();
  }
  return l.getDate()+' '+mLun+' - '+fin.getDate()+' '+mDom+' '+fin.getFullYear();
}

// Clave ISO YYYY-MM-DD del lunes (sin TZ shift)
function semKey(l){
  var y=l.getFullYear(),m=l.getMonth()+1,d=l.getDate();
  return y+'-'+(m<10?'0':'')+m+'-'+(d<10?'0':'')+d;
}

// Dia visible en la vista movil de un solo dia (0=lunes ... 6=domingo).
// En escritorio no se usa: alli se ven los siete a la vez.
var _planDia=0;

// Indice del dia de hoy dentro de la semana mostrada, o -1 si la semana
// que se esta viendo no es la actual.
function diaDeHoyEnSemana(lunes){
  var hoy=new Date();hoy.setHours(0,0,0,0);
  var d=Math.round((hoy.getTime()-lunes.getTime())/86400000);
  return (d>=0&&d<=6)?d:-1;
}

function inicializarPlan(){_planOfs=0;rPlan();}

function rPlan(){
  var lunes=getLunes(_planOfs);
  // Al abrir o cambiar de semana se muestra el dia de hoy si esta dentro;
  // si no, el lunes. Evita que el vendedor caiga siempre en "lunes".
  var hoy=diaDeHoyEnSemana(lunes);_planDia=hoy>=0?hoy:0;
  var lbl=gel('plan-label');if(lbl)lbl.textContent='SEMANA '+getISOWeek(lunes)+' · '+semLabel(lunes);
  var key=semKey(lunes);
  sbG('plan_semanal','vendedor_id=eq.'+CUR.id+'&semana_inicio=eq.'+key+'&order=orden.asc')
  .then(function(rows){renderPlan(lunes,rows&&rows.length?rows:[{hora:'',lunes:'',martes:'',miercoles:'',jueves:'',viernes:'',sabado:'',domingo:''}]);})
  .catch(function(){renderPlan(lunes,[{hora:'',lunes:'',martes:'',miercoles:'',jueves:'',viernes:'',sabado:'',domingo:''}]);});
}

function getPlanEventClass(txt){
  if(!txt)return '';var t=txt.toLowerCase();
  if(t.indexOf('cobro')>-1||t.indexOf('delivery')>-1)return 'plan-event-cobro';
  if(t.indexOf('nuevo')>-1||t.indexOf('nueva')>-1)return 'plan-event-nuevo';
  if(t.indexOf('crédito')>-1||t.indexOf('credito')>-1)return 'plan-event-delivery';
  return 'plan-event-visita';
}

function renderPlan(lunes,rows){
  var hdr=gel('plan-cal-header');
  if(hdr){
    var hh='<div class="plan-cal-header-cell" style="font-size:10px;">HORA</div>';
    for(var di=0;di<7;di++){
      var dd=new Date(lunes);dd.setDate(dd.getDate()+di);
      var isWe=di>=5,mon=dd.toLocaleDateString('es-PE',{month:'short'}).replace('.','');
      hh+='<div class="plan-cal-header-cell'+(isWe?' weekend':'')+'" data-di="'+di+'">'+_DIAS_LABELS[di]+' '+dd.getDate()+'<br><span style="font-size:9px;opacity:.65;">'+mon+'</span></div>';
    }
    hdr.innerHTML=hh;
  }
  var html='';
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    html+='<div class="plan-cal-row"><div class="plan-time-cell"><input type="text" class="plan-hora-input" value="'+(r.hora||'')+'" placeholder="09:00" aria-label="Hora de la fila '+(i+1)+'"/></div>';
    for(var di2=0;di2<7;di2++){
      var k=_DIAS_KEYS[di2],v=r[k]||'',isWe2=di2>=5;
      html+='<div class="plan-day-cell'+(isWe2?' weekend':'')+'" data-di="'+di2+'" ondblclick="planFocusCell(this)">';
      if(v){
        if(/^🧭/.test(v)){
          // Cada fila auto-generada por "Mi Ruta" contiene UNA sola parada en su propia hora
          // (formato "🧭 NombreVet"). No editable — se regenera al volver a generar la ruta.
          var nombreParada=v.replace(/^🧭\s*/,'').trim();
          html+='<div class="plan-event plan-event-ruta"><div class="ev-ruta-stop">🧭 '+nombreParada+'</div></div>';
        } else {
          html+=planEventHTML(v);
        }
      } else {html+=planInputHTML(k,di2);}
      html+='</div>';
    }
    html+='</div>';
  }
  gel('plan-body').innerHTML=html;
  renderPlanDaybar(lunes);
}

// Los eventos son divs con onclick: sin rol ni tabindex el teclado no
// llega a ellos y quien navega sin raton no puede editar su plan.
function planEventHTML(v){
  var ec=getPlanEventClass(v),pts=v.split('·').map(function(s){return s.trim();});
  return '<div class="plan-event '+ec+'" role="button" tabindex="0" onclick="planToggleEdit(this)" onkeydown="planEventKey(event,this)">'+
    '<div class="ev-name">'+pts[0]+'</div>'+(pts[1]?'<div class="ev-tipo">'+pts[1]+'</div>':'')+'</div>';
}

function planEventKey(e,el){
  if(e.key==='Enter'||e.key===' '){e.preventDefault();planToggleEdit(el);}
}

function planInputHTML(k,di){
  return '<input type="text" class="plan-input-event p'+k+'" value="" placeholder="+" aria-label="Agregar visita el '+_DIAS_NOMBRES[di]+'" onblur="planCommitInput(this)" />';
}

// Al salir de una celda vacia recien escrita se pinta ya con su color, en
// vez de esperar a guardar. La leyenda promete que el color se asigna
// solo: sin esto, la promesa no se cumple hasta recargar la pagina.
function planCommitInput(inp){
  var txt=inp.value.trim();if(!txt)return;
  var parent=inp.parentElement;
  parent.innerHTML=planEventHTML(txt);
  planRefrescarPuntosDia();
}

// Selector de dia de la vista movil. En escritorio la barra esta oculta
// por CSS, pero se pinta igual para que el estado sobreviva al rotar.
function renderPlanDaybar(lunes){
  var bar=gel('plan-daybar');if(!bar)return;
  var hoy=diaDeHoyEnSemana(lunes),h='';
  for(var di=0;di<7;di++){
    var dd=new Date(lunes);dd.setDate(dd.getDate()+di);
    var on=di===_planDia,tieneEv=planDiaTieneEventos(di);
    h+='<button type="button" role="tab" class="plan-day-chip'+(on?' is-on':'')+(tieneEv?' has-ev':'')+'"'+
       ' aria-selected="'+(on?'true':'false')+'" onclick="planVerDia('+di+')"'+
       ' aria-label="'+_DIAS_NOMBRES[di]+' '+dd.getDate()+(di===hoy?', hoy':'')+(tieneEv?', con visitas':'')+'">'+
       '<span class="pdc-d">'+_DIAS_LABELS[di]+'</span>'+
       '<span class="pdc-n">'+dd.getDate()+'</span>'+
       '<span class="pdc-dot"></span></button>';
  }
  bar.innerHTML=h;
  var cal=gel('plan-cal');if(cal)cal.setAttribute('data-day',_planDia);
}

function planDiaTieneEventos(di){
  var body=gel('plan-body');if(!body)return false;
  var celdas=body.querySelectorAll('.plan-day-cell[data-di="'+di+'"]');
  for(var i=0;i<celdas.length;i++){
    if(celdas[i].querySelector('.plan-event'))return true;
    var inp=celdas[i].querySelector('.plan-input-event');
    if(inp&&inp.value.trim())return true;
  }
  return false;
}

function planVerDia(di){
  _planDia=di;
  var cal=gel('plan-cal');if(cal)cal.setAttribute('data-day',di);
  var chips=gel('plan-daybar').querySelectorAll('.plan-day-chip');
  for(var i=0;i<chips.length;i++){
    var on=i===di;
    chips[i].classList.toggle('is-on',on);
    chips[i].setAttribute('aria-selected',on?'true':'false');
  }
}

function planFocusCell(c){var ev=c.querySelector('.plan-event');if(ev)planToggleEdit(ev);else{var i=c.querySelector('.plan-input-event');if(i)i.focus();}}

function planToggleEdit(evEl){
  var parent=evEl.parentElement;
  var di=parseInt(parent.getAttribute('data-di'),10)||0;
  var evN=evEl.querySelector('.ev-name'),evT=evEl.querySelector('.ev-tipo');
  var txt=evN?evN.textContent+(evT?' · '+evT.textContent:''):'';
  var inp=document.createElement('input');inp.type='text';inp.className='plan-input-event';inp.value=txt;
  inp.setAttribute('aria-label','Editar la visita del '+_DIAS_NOMBRES[di]);
  inp.onblur=function(){
    parent.innerHTML=inp.value.trim()?planEventHTML(inp.value):planInputHTML(_DIAS_KEYS[di],di);
    planRefrescarPuntosDia();
  };
  inp.onkeydown=function(e){if(e.key==='Enter'||e.key==='Escape')inp.blur();};
  evEl.replaceWith(inp);inp.focus();inp.select();
}

// Repinta los puntitos "este dia tiene visitas" del selector movil sin
// volver a consultar la base de datos.
function planRefrescarPuntosDia(){
  var bar=gel('plan-daybar');if(!bar)return;
  var chips=bar.querySelectorAll('.plan-day-chip');
  for(var i=0;i<chips.length;i++)chips[i].classList.toggle('has-ev',planDiaTieneEventos(i));
}

function addPlanRow(){
  var body=gel('plan-body'),rd=document.createElement('div');rd.className='plan-cal-row';
  var inner='<div class="plan-time-cell"><input type="text" class="plan-hora-input" placeholder="10:00" aria-label="Hora de la nueva fila"/></div>';
  for(var di=0;di<7;di++)inner+='<div class="plan-day-cell'+(di>=5?' weekend':'')+'" data-di="'+di+'" ondblclick="planFocusCell(this)">'+planInputHTML(_DIAS_KEYS[di],di)+'</div>';
  rd.innerHTML=inner;body.appendChild(rd);
  rd.scrollIntoView({block:'nearest',behavior:'smooth'});
  rd.querySelector('input').focus();
}

function guardarPlan(){
  var lunes=getLunes(_planOfs),key=semKey(lunes),filas=[];
  var rows=gel('plan-body').querySelectorAll('.plan-cal-row');
  rows.forEach(function(row,i){
    var hIn=row.querySelector('.plan-hora-input');
    var hora=hIn?hIn.value.trim():'';
    var obj={vendedor_id:CUR.id,semana_inicio:key,hora:hora,orden:i+1};var hc=!!hora;
    for(var di=0;di<7;di++){
      var k=_DIAS_KEYS[di],cell=row.querySelectorAll('.plan-day-cell')[di],v='';
      if(cell){
        // Las paradas de "Mi Ruta" se pintan con .ev-ruta-stop, no con
        // .ev-name. Al leer solo .ev-name se guardaban como vacias, asi
        // que guardar el plan borraba la ruta generada.
        var evR=cell.querySelector('.ev-ruta-stop');
        var evN=cell.querySelector('.ev-name'),evT=cell.querySelector('.ev-tipo');
        if(evR){v=evR.textContent.trim();}
        else if(evN){v=evN.textContent+(evT?' · '+evT.textContent:'');}
        else{var inp2=cell.querySelector('.plan-input-event');if(inp2)v=inp2.value.trim();}
      }
      obj[k]=v||'';if(v)hc=true;
    }
    if(hc)filas.push(obj);
  });
  sbDel('plan_semanal','vendedor_id=eq.'+CUR.id+'&semana_inicio=eq.'+key)
  .then(function(){return filas.length?sbP('plan_semanal',filas):Promise.resolve();})
  .then(function(){setSt('Plan guardado','ok');setTimeout(function(){setSt('');},2500);})
  .catch(function(e){setSt(SVUI.error(e,'guardar el plan'),'er');});
}

function cambiarSemana(d){_planOfs+=d;rPlan();}

// ===== NIVEL WIDGET =====
var _NIVELES=[];
