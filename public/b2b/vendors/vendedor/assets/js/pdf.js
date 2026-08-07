function generarPDF(){
  var mes=gel('pdf-mes')?gel('pdf-mes').value:'';
  var ventas=_ventas.filter(function(v){
    if(!mes)return true;
    return v.fecha&&v.fecha.indexOf(mes)===0;
  });
  if(!ventas.length){setSt('Sin datos para este mes','er');return;}

  var mLabel=mes?mes.split('-').reverse().join('/'):new Date().toLocaleDateString('es-PE',{month:'long',year:'numeric'});
  var nombre=CUR?CUR.nombre:'Vendedor';

  // Agrupar
  var visitas=[],venContado=[],venDelivery=[],creditos=[],cobros=[],devoluciones=[];
  var totalVentas=0,totalCobrado=0,totalPendiente=0;

  ventas.forEach(function(v){
    var m=v.movimiento||'';
    if(m==='Visita')visitas.push(v);
    else if(m==='Venta al contado')venContado.push(v);
    else if(m==='Venta delivery')venDelivery.push(v);
    else if(m==='Credito a 15 dias'||m==='Cr\u00e9dito a 15 d\u00edas')creditos.push(v);
    else if(m==='Cobro de credito')cobros.push(v);
    else if(m==='Devolucion'||m==='Devoluci\u00f3n')devoluciones.push(v);
  });

  venContado.concat(venDelivery).forEach(function(v){totalVentas+=(v.total||0);totalCobrado+=(v.total||0);});
  cobros.forEach(function(v){totalCobrado+=(v.total||0);});
  creditos.forEach(function(v){
    if(v.estado==='\u2705 Pagado')totalCobrado+=(v.total||0);
    else totalPendiente+=(v.total||0);
  });

  function fila(v){
    return '<tr style="border-bottom:1px solid #eee;">'+
      '<td style="padding:5px 8px;font-size:11px;">'+fmt(v.fecha)+'</td>'+
      '<td style="padding:5px 8px;font-size:11px;">'+(v.veterinaria||'---')+'</td>'+
      '<td style="padding:5px 8px;font-size:11px;">'+(v.zona||'---')+'</td>'+
      '<td style="padding:5px 8px;font-size:11px;">'+(v.producto||'---')+'</td>'+
      '<td style="padding:5px 8px;font-size:11px;text-align:center;">'+(v.cantidad||'---')+'</td>'+
      '<td style="padding:5px 8px;font-size:11px;text-align:right;font-weight:600;">'+(v.total?money(v.total):'---')+'</td>'+
      '<td style="padding:5px 8px;font-size:11px;">'+(v.estado||'---')+'</td>'+
      '</tr>';
  }

  function seccion(titulo, filas, color){
    if(!filas.length)return '';
    var rows=filas.map(fila).join('');
    return '<div style="margin-bottom:20px;">'+
      '<div style="background:'+color+';color:#fff;padding:6px 10px;border-radius:6px 6px 0 0;font-weight:700;font-size:12px;">'+titulo+' ('+filas.length+')</div>'+
      '<table style="width:100%;border-collapse:collapse;border:1px solid #ddd;border-top:none;">'+
      '<thead><tr style="background:#f5f5f5;">'+
        '<th style="padding:5px 8px;font-size:10px;text-align:left;">Fecha</th>'+
        '<th style="padding:5px 8px;font-size:10px;text-align:left;">Veterinaria</th>'+
        '<th style="padding:5px 8px;font-size:10px;text-align:left;">Zona</th>'+
        '<th style="padding:5px 8px;font-size:10px;text-align:left;">Producto</th>'+
        '<th style="padding:5px 8px;font-size:10px;text-align:center;">Cant.</th>'+
        '<th style="padding:5px 8px;font-size:10px;text-align:right;">Total</th>'+
        '<th style="padding:5px 8px;font-size:10px;text-align:left;">Estado</th>'+
      '</tr></thead>'+
      '<tbody>'+rows+'</tbody></table></div>';
  }

  var visitasRows=visitas.length?'<ul style="margin:0;padding-left:16px;">'+visitas.map(function(v){return '<li style="font-size:11px;margin-bottom:3px;">'+fmt(v.fecha)+' - '+(v.veterinaria||'---')+(v.zona?' ['+v.zona+']':'')+(v.notas?' - '+v.notas:'')+'</li>';}).join('')+'</ul>':'<p style="font-size:11px;color:#888;">Sin visitas</p>';

  var pdfContent='<!DOCTYPE html><html><head><meta charset="UTF-8">'+
    '<style>body{font-family:Arial,sans-serif;color:#222;padding:20px;max-width:800px;margin:0 auto;}'+
    '@media print{body{padding:10px;}.no-print{display:none;}}</style></head><body>'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:3px solid #253C61;padding-bottom:12px;">'+
      '<div><div style="font-family:serif;font-size:22px;font-weight:700;color:#253C61;letter-spacing:1px;">SUPLEVET</div>'+
      '<div style="font-size:12px;color:#666;">Reporte mensual de ventas</div></div>'+
      '<div style="text-align:right;"><div style="font-size:15px;font-weight:700;">'+nombre+'</div>'+
      '<div style="font-size:12px;color:#666;">'+mLabel+'</div></div>'+
    '</div>'+

    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">'+
      '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px;text-align:center;">'+
        '<div style="font-size:10px;color:#166534;font-weight:700;text-transform:uppercase;">Total cobrado</div>'+
        '<div style="font-size:20px;font-weight:700;color:#166534;">'+money(totalCobrado)+'</div></div>'+
      '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:10px;text-align:center;">'+
        '<div style="font-size:10px;color:#92400e;font-weight:700;text-transform:uppercase;">Pendiente</div>'+
        '<div style="font-size:20px;font-weight:700;color:#92400e;">'+money(totalPendiente)+'</div></div>'+
      '<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px;text-align:center;">'+
        '<div style="font-size:10px;color:#1e40af;font-weight:700;text-transform:uppercase;">Visitas</div>'+
        '<div style="font-size:20px;font-weight:700;color:#1e40af;">'+visitas.length+'</div></div>'+
    '</div>'+

    seccion('Ventas al contado',venContado,'#16a34a')+
    seccion('Ventas delivery',venDelivery,'#2563eb')+
    seccion('Cr\u00e9ditos a 15 d\u00edas',creditos,'#d97706')+
    seccion('Cobros de cr\u00e9dito',cobros,'#059669')+
    seccion('Devoluciones',devoluciones,'#dc2626')+

    '<div style="margin-bottom:20px;"><div style="background:#374151;color:#fff;padding:6px 10px;border-radius:6px 6px 0 0;font-weight:700;font-size:12px;">Visitas realizadas ('+visitas.length+')</div>'+
    '<div style="border:1px solid #ddd;border-top:none;padding:10px;">'+visitasRows+'</div></div>'+

    '<div style="border-top:2px solid #253C61;padding-top:10px;margin-top:10px;display:flex;justify-content:space-between;align-items:center;">'+
      '<div style="font-size:10px;color:#888;">Generado el '+new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'})+'</div>'+
      '<button class="no-print" onclick="window.print()" style="background:#253C61;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:600;">Imprimir / Guardar PDF</button>'+
    '</div></body></html>';

  var w=window.open('','_blank');
  if(!w){setSt('Activa los popups para generar el PDF','er');return;}
  w.document.write(pdfContent);
  w.document.close();
}

// ══════════════════════════════════════════════════════════════
// SISTEMA GENÉRICO DE PDFs PARA REPORTES
// Genera PDFs con estilo consistente para todas las secciones
// ══════════════════════════════════════════════════════════════

// Helper: limpiar emojis y caracteres especiales para el PDF (mejora legibilidad)
function _pdfCleanText(txt){
  if(!txt)return '';
  return String(txt)
    .replace(/[\u2705\u23f3\u274c\ud83d\udce6\u2696\ufe0f]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

// Helper: nombre de mes en español a partir de "YYYY-MM"
function _pdfMesLabel(mesStr){
  if(!mesStr)return '';
  var nMeses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var p=mesStr.split('-');
  if(p.length<2)return mesStr;
  return nMeses[parseInt(p[1])-1]+' '+p[0];
}

// Helper: construye un título dinámico basado en los filtros activos
// Ejemplo: buildPdfTitle('Historial', {mes:'2026-05', tipo:'Contado', desde:'2026-05-01'})
// → "Historial - Mayo 2026 - Contado"
function _pdfBuildTitle(seccion, filtros){
  var partes=[seccion];
  if(filtros.mes){partes.push(_pdfMesLabel(filtros.mes));}
  else if(filtros.desde||filtros.hasta){
    var rango='Del '+(filtros.desde?fmt(filtros.desde):'inicio')+' al '+(filtros.hasta?fmt(filtros.hasta):'hoy');
    partes.push(rango);
  }
  if(filtros.tipo&&filtros.tipo!=='todos'){partes.push(filtros.tipo);}
  if(filtros.busqueda){partes.push('"'+filtros.busqueda+'"');}
  if(partes.length===1){
    // Si no hay filtros, agregar "Completo"
    partes.push('Completo');
  }
  return partes.join(' - ');
}

// Helper: badge HTML para el estado en PDF
function _pdfBadgeEstado(estado){
  var clean=_pdfCleanText(estado);
  var bg='#e5e7eb',col='#374151';
  if(estado==='\u2705 Pagado'||clean==='Pagado'){bg='#dcfce7';col='#166534';}
  else if(estado==='\u23f3 Pendiente'||clean==='Pendiente'){bg='#fef3c7';col='#92400e';}
  else if(estado==='\u274c Vencido'||clean==='Vencido'){bg='#fee2e2';col='#991b1b';}
  else if(estado==='Anulado'){bg='#f3f4f6';col='#6b7280';}
  else if(estado==='\ud83d\udce6 Devuelto'||clean==='Devuelto'){bg='#dbeafe';col='#1e40af';}
  return '<span style="background:'+bg+';color:'+col+';padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">'+clean+'</span>';
}

// Helper: encabezado consistente para todos los PDFs
function _pdfHeader(titulo, subtitulo){
  var nombre=CUR?CUR.nombre:'Vendedor';
  var fechaGen=new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'});
  var horaGen=new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:3px solid #253C61;padding-bottom:12px;">'+
    '<div>'+
      '<div style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#253C61;letter-spacing:1.5px;">SUPLEVET</div>'+
      '<div style="font-size:13px;color:#374151;font-weight:600;margin-top:2px;">'+titulo+'</div>'+
      (subtitulo?'<div style="font-size:11px;color:#6b7280;margin-top:2px;">'+subtitulo+'</div>':'')+
    '</div>'+
    '<div style="text-align:right;">'+
      '<div style="font-size:14px;font-weight:700;color:#1f2937;">'+nombre+'</div>'+
      '<div style="font-size:10px;color:#6b7280;margin-top:2px;">Generado: '+fechaGen+' '+horaGen+'</div>'+
    '</div>'+
  '</div>';
}

// Helper: footer con botón de impresión
function _pdfFooter(){
  return '<div style="border-top:2px solid #253C61;padding-top:10px;margin-top:20px;display:flex;justify-content:space-between;align-items:center;">'+
    '<div style="font-size:10px;color:#888;">Suplevet \u00a9 '+new Date().getFullYear()+' - Portal de Vendedores</div>'+
    '<button class="no-print" onclick="window.print()" style="background:#253C61;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:600;">\ud83d\udda8\ufe0f Imprimir / Guardar PDF</button>'+
  '</div>';
}

// Helper: tarjetas de resumen para el PDF
function _pdfSummaryCards(cards){
  if(!cards||!cards.length)return '';
  // Definir colores por tipo
  var colorMap={
    'green':{bg:'#f0fdf4',bd:'#86efac',col:'#166534'},
    'orange':{bg:'#fffbeb',bd:'#fcd34d',col:'#92400e'},
    'red':{bg:'#fef2f2',bd:'#fca5a5',col:'#991b1b'},
    'blue':{bg:'#eff6ff',bd:'#93c5fd',col:'#1e40af'},
    'gray':{bg:'#f9fafb',bd:'#d1d5db',col:'#374151'}
  };
  var cols=Math.min(cards.length,4);
  var html='<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:10px;margin-bottom:20px;">';
  cards.forEach(function(c){
    var col=colorMap[c.color||'gray'];
    html+='<div style="background:'+col.bg+';border:1px solid '+col.bd+';border-radius:8px;padding:10px 12px;text-align:center;">'+
      '<div style="font-size:9px;color:'+col.col+';font-weight:700;text-transform:uppercase;letter-spacing:.5px;">'+c.label+'</div>'+
      '<div style="font-size:20px;font-weight:700;color:'+col.col+';margin-top:3px;">'+c.value+'</div>'+
      (c.sub?'<div style="font-size:10px;color:'+col.col+';opacity:.75;margin-top:2px;">'+c.sub+'</div>':'')+
    '</div>';
  });
  html+='</div>';
  return html;
}

// Helper: construye una tabla completa con todas las columnas que se pidan
// columns: [{title:'Fecha', key:'fecha', format:'date|money|text|badge', align:'left|center|right', width:'80px'}]
function _pdfTable(rows, columns, opciones){
  opciones=opciones||{};
  if(!rows||!rows.length){
    return '<div style="text-align:center;padding:30px;color:#9ca3af;font-size:13px;border:1px dashed #d1d5db;border-radius:8px;">Sin registros para mostrar</div>';
  }
  var headCells=columns.map(function(c){
    var w=c.width?'width:'+c.width+';':'';
    return '<th style="padding:7px 8px;font-size:10px;text-align:'+(c.align||'left')+';color:#374151;font-weight:700;text-transform:uppercase;letter-spacing:.3px;border-bottom:2px solid #253C61;'+w+'">'+c.title+'</th>';
  }).join('');
  var bodyRows=rows.map(function(row,idx){
    var cells=columns.map(function(c){
      var raw=row[c.key];
      var val='---';
      if(raw!==undefined&&raw!==null&&raw!==''){
        if(c.format==='date')val=fmt(raw);
        else if(c.format==='money')val='<strong>'+money(raw)+'</strong>';
        else if(c.format==='badge')val=_pdfBadgeEstado(raw);
        else if(c.format==='number')val=String(raw);
        else val=String(raw);
      }
      return '<td style="padding:6px 8px;font-size:11px;text-align:'+(c.align||'left')+';color:#1f2937;">'+val+'</td>';
    }).join('');
    var bg=idx%2===0?'#ffffff':'#f9fafb';
    return '<tr style="background:'+bg+';border-bottom:1px solid #f3f4f6;">'+cells+'</tr>';
  }).join('');
  return '<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:14px;">'+
    '<thead><tr style="background:#f3f4f6;">'+headCells+'</tr></thead>'+
    '<tbody>'+bodyRows+'</tbody>'+
  '</table>';
}

// Helper: abre la ventana con el contenido del PDF
// El "titulo" pasado se usa como nombre del documento (filename sugerido al imprimir)
function _pdfOpen(titulo, contenido){
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+titulo+'</title>'+
    '<style>body{font-family:Arial,sans-serif;color:#222;padding:20px;max-width:1000px;margin:0 auto;background:#fff;}'+
    '@media print{body{padding:10px;max-width:none;}.no-print{display:none !important;}}'+
    'h2{font-size:14px;color:#253C61;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb;}'+
    'table{page-break-inside:auto;}tr{page-break-inside:avoid;page-break-after:auto;}'+
    'thead{display:table-header-group;}</style>'+
    '</head><body>'+contenido+
    '<script>document.title='+JSON.stringify(titulo)+';<\/script>'+
    '</body></html>';
  var w=window.open('','_blank');
  if(!w){setSt('Activa los popups para generar el PDF','er');return;}
  w.document.write(html);
  w.document.close();
}

// ─────────────────────────────────────────────────────
// PDF: MIS VENTAS (respeta filtros activos)
// ─────────────────────────────────────────────────────
function generarPDFVentas(){
  var busq=(val('srch-vt')||'').toLowerCase();
  var mes=val('fil-mes-vt');
  var desde=val('fil-vt-desde')||'',hasta=val('fil-vt-hasta')||'';
  var l=[];
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    var esVenta=(v.movimiento==='Venta al contado'||v.movimiento==='Venta delivery'||v.movimiento==='Cobro de credito');
    if(!esVenta)continue;
    if(v.estado==='Anulado')continue;
    if(_vtFil!=='todos'&&v.movimiento!==_vtFil)continue;
    if(mes&&(!v.fecha||v.fecha.indexOf(mes)!==0))continue;
    if(desde&&(v.fecha||'')<desde)continue;
    if(hasta&&(v.fecha||'')>hasta)continue;
    if(busq&&(v.veterinaria||'').toLowerCase().indexOf(busq)<0&&
            (v.doctora||'').toLowerCase().indexOf(busq)<0&&
            (v.zona||'').toLowerCase().indexOf(busq)<0&&
            (v.producto||'').toLowerCase().indexOf(busq)<0)continue;
    l.push(v);
  }
  if(!l.length){setSt('No hay ventas con los filtros actuales','er');return;}
  l.sort(function(a,b){
    var da=(a.fecha||'')+(a.hora||'00:00');
    var db=(b.fecha||'')+(b.hora||'00:00');
    if(db>da)return 1;if(db<da)return -1;
    return 0;
  });

  // Subtítulo según filtros
  var subtParts=[];
  var nMeses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  if(mes){var p=mes.split('-');subtParts.push(nMeses[parseInt(p[1])-1]+' '+p[0]);}
  else if(desde||hasta){subtParts.push('Del '+(desde?fmt(desde):'inicio')+' al '+(hasta?fmt(hasta):'hoy'));}
  else subtParts.push('Todo el historial');
  if(_vtFil!=='todos'){
    var fLabels={'Venta al contado':'Solo contado','Venta delivery':'Solo delivery','Cobro de credito':'Solo cobros'};
    subtParts.push(fLabels[_vtFil]||_vtFil);
  }
  if(busq)subtParts.push('Búsqueda: "'+busq+'"');

  // Totales
  var totalAll=0,totalContado=0,totalDelivery=0,totalCobros=0,nContado=0,nDelivery=0,nCobros=0;
  for(var i=0;i<l.length;i++){
    var v=l[i],t=Number(v.total||0);totalAll+=t;
    if(v.movimiento==='Venta al contado'){totalContado+=t;nContado++;}
    else if(v.movimiento==='Venta delivery'){totalDelivery+=t;nDelivery++;}
    else if(v.movimiento==='Cobro de credito'){totalCobros+=t;nCobros++;}
  }
  var cards=[
    {label:'Total Ventas',value:money(totalAll),sub:l.length+' transacciones',color:'green'},
    {label:'Contado',value:money(totalContado),sub:nContado+' venta'+(nContado!==1?'s':''),color:'blue'},
    {label:'Delivery',value:money(totalDelivery),sub:nDelivery+' venta'+(nDelivery!==1?'s':''),color:'orange'},
    {label:'Cobros',value:money(totalCobros),sub:nCobros+' cobro'+(nCobros!==1?'s':''),color:'gray'}
  ];

  var columns=[
    {title:'Fecha',key:'fecha',format:'date',width:'80px'},
    {title:'Hora',key:'hora',width:'55px'},
    {title:'Veterinaria',key:'veterinaria'},
    {title:'Doctor/a',key:'doctora'},
    {title:'Zona',key:'zona',width:'90px'},
    {title:'Movimiento',key:'_mov',width:'95px'},
    {title:'Producto',key:'producto'},
    {title:'Cant.',key:'cantidad',format:'number',align:'center',width:'45px'},
    {title:'Total',key:'total',format:'money',align:'right',width:'80px'},
    {title:'Estado',key:'estado',format:'badge',width:'85px'}
  ];
  // Preprocesar: simplificar nombre del movimiento
  var rows=l.map(function(v){
    var mov=v.movimiento||'';
    var movShort=mov;
    if(mov==='Venta al contado')movShort='Contado';
    else if(mov==='Venta delivery')movShort='Delivery';
    else if(mov==='Cobro de credito')movShort='Cobro';
    return Object.assign({},v,{_mov:movShort});
  });

  var contenido=_pdfHeader('Reporte de Ventas',subtParts.join(' \u00b7 '))+
    _pdfSummaryCards(cards)+
    '<h2>Detalle de transacciones ('+l.length+')</h2>'+
    _pdfTable(rows,columns)+
    _pdfFooter();

  // Título dinámico para el archivo PDF
  var tipoLbl={'Venta al contado':'Contado','Venta delivery':'Delivery','Cobro de credito':'Cobros'}[_vtFil]||'';
  var titulo=_pdfBuildTitle('Mis Ventas',{mes:mes,desde:desde,hasta:hasta,tipo:tipoLbl,busqueda:busq});
  _pdfOpen(titulo,contenido);
}

// ─────────────────────────────────────────────────────
// PDF: CRÉDITOS PENDIENTES (ordenado por urgencia)
// ─────────────────────────────────────────────────────
function generarPDFCreditos(){
  var busq=(val('srch-cred')||'').toLowerCase();
  var cr=[];
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if((v.movimiento==='Credito a 15 dias'||v.movimiento==='Cr\u00e9dito a 15 d\u00edas')&&v.estado!=='\u2705 Pagado'&&v.estado!=='\ud83d\udce6 Devuelto'&&v.estado!=='Anulado'){
      if(busq){
        var match=(v.veterinaria||'').toLowerCase().indexOf(busq)>=0||
                  (v.doctora||'').toLowerCase().indexOf(busq)>=0||
                  (v.zona||'').toLowerCase().indexOf(busq)>=0||
                  (v.producto||'').toLowerCase().indexOf(busq)>=0;
        if(!match)continue;
      }
      cr.push(v);
    }
  }
  if(!cr.length){setSt('No hay créditos pendientes para reportar','er');return;}
  // Ordenar: más vencido primero
  cr.sort(function(a,b){
    var diasA=a.fecha_cobro?Math.ceil((new Date()-new Date(a.fecha_cobro))/86400000):-9999;
    var diasB=b.fecha_cobro?Math.ceil((new Date()-new Date(b.fecha_cobro))/86400000):-9999;
    if(diasA!==diasB)return diasB-diasA;
    return (b.total||0)-(a.total||0);
  });

  // Categorizar y totalizar
  var total=0,venc=0,porVenc=0,totalVenc=0,totalPV=0;
  var rows=cr.map(function(v){
    var t=Number(v.total||0);total+=t;
    var diasV=v.fecha_cobro?Math.ceil((new Date()-new Date(v.fecha_cobro))/86400000):null;
    var estado='Pendiente',estadoDetalle='';
    if(diasV!==null&&diasV>0){estado='Vencido';estadoDetalle='hace '+diasV+'d';venc++;totalVenc+=t;}
    else if(diasV!==null&&diasV<=0&&diasV>=-15){estado='Por vencer';estadoDetalle='en '+Math.abs(diasV)+'d';porVenc++;totalPV+=t;}
    else if(diasV!==null){estadoDetalle='en '+Math.abs(diasV)+'d';}
    return Object.assign({},v,{_estado:estado,_estadoDetalle:estadoDetalle,_diasV:diasV});
  });

  var cards=[
    {label:'Total Pendiente',value:money(total),sub:cr.length+' cr\u00e9dito'+(cr.length!==1?'s':''),color:'orange'},
    {label:'Vencidos',value:String(venc),sub:money(totalVenc),color:'red'},
    {label:'Por Vencer',value:String(porVenc),sub:money(totalPV)+' (15d)',color:'orange'},
    {label:'Total a Cobrar',value:money(totalVenc+totalPV),sub:'urgente',color:'red'}
  ];

  // Construir filas customizadas (más detalle visual)
  var bodyRows=rows.map(function(r,idx){
    var bg=idx%2===0?'#ffffff':'#f9fafb';
    var estadoBg='#fef3c7',estadoCol='#92400e';
    if(r._estado==='Vencido'){estadoBg='#fee2e2';estadoCol='#991b1b';}
    else if(r._estado==='Por vencer'){estadoBg='#ffedd5';estadoCol='#9a3412';}
    var diasStr=r._estado==='Vencido'?'<strong style="color:#dc2626;">Vencido '+r._estadoDetalle+'</strong>':
                r._estado==='Por vencer'?'<strong style="color:#ea580c;">Vence '+r._estadoDetalle+'</strong>':
                (r._estadoDetalle?'Vence '+r._estadoDetalle:'');
    return '<tr style="background:'+bg+';border-bottom:1px solid #f3f4f6;">'+
      '<td style="padding:6px 8px;font-size:11px;">'+fmt(r.fecha)+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(r.veterinaria||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(r.doctora||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(r.zona||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(r.producto||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;text-align:center;">'+(r.cantidad||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(r.fecha_cobro?fmt(r.fecha_cobro):'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+diasStr+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:700;color:#dc2626;">'+money(r.total)+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;"><span style="background:'+estadoBg+';color:'+estadoCol+';padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">'+r._estado+'</span></td>'+
    '</tr>';
  }).join('');

  var tabla='<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:14px;">'+
    '<thead><tr style="background:#f3f4f6;">'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">F.Venta</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">Veterinaria</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">Doctor/a</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">Zona</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">Producto</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:center;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">Cant.</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">F.Cobro</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">Urgencia</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:right;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">Monto</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#374151;font-weight:700;text-transform:uppercase;border-bottom:2px solid #253C61;">Estado</th>'+
    '</tr></thead><tbody>'+bodyRows+'</tbody></table>';

  var contenido=_pdfHeader('Reporte de Cr\u00e9ditos Pendientes',
    'Listado completo de cobranzas pendientes \u00b7 Ordenado por urgencia'+(busq?' \u00b7 B\u00fasqueda: "'+busq+'"':''))+
    _pdfSummaryCards(cards)+
    '<h2>Detalle de cobranzas ('+cr.length+')</h2>'+
    tabla+
    '<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11px;color:#92400e;">'+
      '<strong>\ud83d\udca1 Recomendaci\u00f3n:</strong> Prioriza los cr\u00e9ditos vencidos (en rojo) para mejorar tu flujo de cobranzas.'+
      ' Los cr\u00e9ditos m\u00e1s urgentes aparecen al inicio del listado.'+
    '</div>'+
    _pdfFooter();

  // Título dinámico para el archivo PDF
  var titulo=_pdfBuildTitle('Creditos Pendientes',{busqueda:busq});
  _pdfOpen(titulo,contenido);
}

// ─────────────────────────────────────────────────────
// PDF: HISTORIAL (todos los movimientos con filtros activos)
// ─────────────────────────────────────────────────────
function generarPDFHistorial(){
  var busq=(val('srch-h')||'').toLowerCase(),mes=val('fil-mes');
  var desde=val('fil-desde')||'',hasta=val('fil-hasta')||'';
  var l=[];
  for(var i=0;i<_ventas.length;i++){
    var v=_ventas[i];
    if(_hFil!=='todos'&&v.movimiento!==_hFil)continue;
    if(mes&&(!v.fecha||v.fecha.indexOf(mes)!==0))continue;
    if(desde&&(v.fecha||'')<desde)continue;
    if(hasta&&(v.fecha||'')>hasta)continue;
    if(busq&&(v.veterinaria||'').toLowerCase().indexOf(busq)<0&&(v.doctora||'').toLowerCase().indexOf(busq)<0&&(v.zona||'').toLowerCase().indexOf(busq)<0&&(v.producto||'').toLowerCase().indexOf(busq)<0)continue;
    l.push(v);
  }
  if(!l.length){setSt('No hay movimientos con los filtros actuales','er');return;}
  l.sort(function(a,b){
    var da=(a.fecha||'')+(a.hora||'00:00');
    var db=(b.fecha||'')+(b.hora||'00:00');
    if(db>da)return 1;if(db<da)return -1;
    return 0;
  });

  // Subtítulo según filtros
  var subtParts=[];
  var nMeses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  if(mes){var p=mes.split('-');subtParts.push(nMeses[parseInt(p[1])-1]+' '+p[0]);}
  else if(desde||hasta){subtParts.push('Del '+(desde?fmt(desde):'inicio')+' al '+(hasta?fmt(hasta):'hoy'));}
  else subtParts.push('Todo el historial');
  if(_hFil!=='todos'){subtParts.push('Tipo: '+_hFil);}
  if(busq)subtParts.push('Búsqueda: "'+busq+'"');

  // Conteo por tipo de movimiento
  var counts={contado:0,delivery:0,credito:0,cobro:0,devolucion:0,visita:0,anulado:0};
  var sumas={contado:0,delivery:0,credito:0,cobro:0,devolucion:0};
  l.forEach(function(v){
    var t=Number(v.total||0);
    if(v.estado==='Anulado'){counts.anulado++;return;}
    if(v.movimiento==='Venta al contado'){counts.contado++;sumas.contado+=t;}
    else if(v.movimiento==='Venta delivery'){counts.delivery++;sumas.delivery+=t;}
    else if(v.movimiento==='Credito a 15 dias'||v.movimiento==='Cr\u00e9dito a 15 d\u00edas'){counts.credito++;sumas.credito+=t;}
    else if(v.movimiento==='Cobro de credito'){counts.cobro++;sumas.cobro+=t;}
    else if(v.movimiento==='Devolucion'||v.movimiento==='Devoluci\u00f3n'){counts.devolucion++;sumas.devolucion+=t;}
    else if(v.movimiento==='Visita'){counts.visita++;}
  });

  var cards=[
    {label:'Total Movimientos',value:String(l.length),sub:'en el periodo',color:'blue'},
    {label:'Ventas (C+D+Cob)',value:money(sumas.contado+sumas.delivery+sumas.cobro),sub:(counts.contado+counts.delivery+counts.cobro)+' transacciones',color:'green'},
    {label:'Cr\u00e9ditos Emitidos',value:money(sumas.credito),sub:counts.credito+' cr\u00e9dito'+(counts.credito!==1?'s':''),color:'orange'},
    {label:'Visitas',value:String(counts.visita),sub:counts.anulado+' anulados',color:'gray'}
  ];

  // Tabla detallada
  var columns=[
    {title:'Fecha',key:'fecha',format:'date',width:'78px'},
    {title:'Hora',key:'hora',width:'52px'},
    {title:'Veterinaria',key:'veterinaria'},
    {title:'Doctor/a',key:'doctora'},
    {title:'Zona',key:'zona',width:'85px'},
    {title:'Movimiento',key:'_mov',width:'95px'},
    {title:'Producto',key:'producto'},
    {title:'Cant.',key:'cantidad',format:'number',align:'center',width:'45px'},
    {title:'Total',key:'total',format:'money',align:'right',width:'78px'},
    {title:'Estado',key:'estado',format:'badge',width:'85px'}
  ];
  var rows=l.map(function(v){
    var mov=v.movimiento||'';
    var movShort=mov;
    if(mov==='Venta al contado')movShort='Contado';
    else if(mov==='Venta delivery')movShort='Delivery';
    else if(mov==='Cobro de credito')movShort='Cobro';
    else if(mov==='Credito a 15 dias'||mov==='Cr\u00e9dito a 15 d\u00edas')movShort='Cr\u00e9dito 15d';
    else if(mov==='Devolucion'||mov==='Devoluci\u00f3n')movShort='Devoluci\u00f3n';
    return Object.assign({},v,{_mov:movShort});
  });

  var contenido=_pdfHeader('Reporte de Historial',subtParts.join(' \u00b7 '))+
    _pdfSummaryCards(cards)+
    '<h2>Detalle completo de movimientos ('+l.length+')</h2>'+
    _pdfTable(rows,columns)+
    _pdfFooter();

  // Título dinámico para el archivo PDF
  // Mapear el filtro técnico a un nombre legible
  var tipoLbl='';
  if(_hFil!=='todos'){
    var mapTipo={'Venta al contado':'Contado','Venta delivery':'Delivery','Credito a 15 dias':'Credito','Cobro de credito':'Cobros','Devolucion':'Devolucion','Visita':'Visitas'};
    tipoLbl=mapTipo[_hFil]||_hFil;
  }
  var titulo=_pdfBuildTitle('Historial',{mes:mes,desde:desde,hasta:hasta,tipo:tipoLbl,busqueda:busq});
  _pdfOpen(titulo,contenido);
}

// ─────────────────────────────────────────────────────
// PDF: RUTA DEL DÍA (paradas con dirección y horario)
// ─────────────────────────────────────────────────────
function generarPDFRuta(){
  var ruta=window.RUTA_ACTUAL||[];
  if(!ruta.length){setSt('Genera primero tu ruta para exportarla.','er');return;}
  var origen=window.ORIGEN_ACTUAL||null;
  var fecha=_rutaFechaSel||hoy();
  var fechaLegible=new Date(fecha+'T00:00:00').toLocaleDateString('es-PE',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});

  var origenHtml=origen
    ? '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;margin-bottom:14px;">'+
        '<div style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.5px;">📍 Punto de partida</div>'+
        '<div style="font-size:13px;color:#166534;margin-top:2px;font-weight:600;">'+(origen.direccion||(origen.latitud+', '+origen.longitud))+'</div>'+
      '</div>'
    : '';

  var rows=ruta.map(function(v){
    var direccion=(v.direccion||'')+(v.distrito?', '+v.distrito:'');
    var horaTxt=v.hora_estimada_llegada||'—';
    if(v.hora_especifica)horaTxt+=' (cita: '+v.hora_especifica+')';
    if(v.minutos_espera>0)horaTxt+=' · espera '+v.minutos_espera+' min';
    var numRaw=(v.num_medico||'').trim();
    var telefonos=numRaw
      ? numRaw.split(/[\/,|]+/).map(function(n){return n.trim();}).filter(Boolean).join('<br>')
      : '—';
    return{
      orden:v.orden_visita,
      nombre:v.nombre_cliente||'—',
      direccion:direccion||'—',
      telefonos:telefonos,
      doctora:v.doctora||'—',
      hora:horaTxt
    };
  });
  var columns=[
    {title:'#',           key:'orden',     align:'center',width:'28px'},
    {title:'Veterinaria', key:'nombre',    align:'left',  width:'170px'},
    {title:'Dirección',   key:'direccion', align:'left'},
    {title:'Teléfono(s)', key:'telefonos', align:'center',width:'100px'},
    {title:'Doctor/a',    key:'doctora',   align:'left',  width:'130px'},
    {title:'Llegada',     key:'hora',      align:'left',  width:'140px'}
  ];

  var contenido=_pdfHeader('Ruta del día', fechaLegible.charAt(0).toUpperCase()+fechaLegible.slice(1)+' · '+ruta.length+' parada'+(ruta.length!==1?'s':''))+
    origenHtml+
    '<h2>Paradas en orden óptimo</h2>'+
    _pdfTable(rows,columns)+
    _pdfFooter();

  var titulo='Ruta '+(CUR?CUR.nombre.replace(/\s+/g,'-'):'vendedor')+' '+fecha;
  _pdfOpen(titulo,contenido);
}

// ── MULTI-VISITA STATE ──