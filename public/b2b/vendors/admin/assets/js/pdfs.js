// ══════════════════════════════════════════════════════════════
// PDFs: reportes y liquidación de comisiones
// ══════════════════════════════════════════════════════════════


// ══ REPORTES ══
function rReportes(){
  var now=new Date(); var mesStr=now.getFullYear()+'-'+(String(now.getMonth()+1).padStart(2,'0'));
  ['rpt-mes-global','rpt-mes-rank','rpt-mes-zona','rpt-mes-ventas','rpt-mes-hist','rpt-mes-inv'].forEach(function(id){var el=gel(id);if(el&&!el.value)el.value=mesStr;});
  ['rpt-vend-global','rpt-vend-mor','rpt-vend-ventas','rpt-vend-hist'].forEach(function(id){
    var sel=gel(id);if(!sel)return;sel.innerHTML='<option value="">Todos los vendedores</option>';
    _vendedores.forEach(function(v){var o=document.createElement('option');o.value=v.id;o.textContent=v.nombre;sel.appendChild(o);});
  });
}

function generarPDFCreditos(){
  var filtVend=gel('cr-filtro-vend')?gel('cr-filtro-vend').value:'';
  var busq=gel('srch-cred')?(val('srch-cred')||'').toLowerCase():'';
  var cr=_ventas.filter(function(v){
    var esCred=(v.movimiento==='Credito a 15 dias'||v.movimiento==='Crédito a 15 días');
    var pendiente=v.estado!=='✅ Pagado'&&v.estado!=='📦 Devuelto'&&v.estado!=='Anulado';
    if(!esCred||!pendiente)return false;
    if(filtVend&&String(v.vendedor_id)!==String(filtVend))return false;
    if(busq){
      var match=(v.veterinaria||'').toLowerCase().indexOf(busq)>=0||
                (v.doctora||'').toLowerCase().indexOf(busq)>=0||
                (v.zona||'').toLowerCase().indexOf(busq)>=0||
                (v.producto||'').toLowerCase().indexOf(busq)>=0;
      if(!match)return false;
    }
    return true;
  });
  if(!cr.length){setSt('No hay créditos pendientes para reportar','er');return;}
  cr.sort(function(a,b){
    var diasA=a.fecha_cobro?diasDesde(a.fecha_cobro):-9999;
    var diasB=b.fecha_cobro?diasDesde(b.fecha_cobro):-9999;
    if(diasA!==diasB)return diasB-diasA;
    return (b.total||0)-(a.total||0);
  });
  var total=0,venc=0,porVenc=0,totalVenc=0,totalPV=0;
  var rows=cr.map(function(v){
    var t=Number(v.total||0);total+=t;
    var diasV=v.fecha_cobro?diasDesde(v.fecha_cobro):null;
    var estado='Pendiente',estadoDetalle='';
    if(diasV!==null&&diasV>0){estado='Vencido';estadoDetalle='hace '+diasV+'d';venc++;totalVenc+=t;}
    else if(diasV!==null&&diasV<=0&&diasV>=-DIAS_POR_VENCER_REPORTE){estado='Por vencer';estadoDetalle='en '+Math.abs(diasV)+'d';porVenc++;totalPV+=t;}
    else if(diasV!==null){estadoDetalle='en '+Math.abs(diasV)+'d';}
    return {v:v,_estado:estado,_estadoDetalle:estadoDetalle,_diasV:diasV};
  });
  var bodyRows=rows.map(function(r,idx){
    var v=r.v;
    var bg=idx%2===0?'#ffffff':'#f9fafb';
    var estadoBg='#fef3c7',estadoCol='#92400e';
    if(r._estado==='Vencido'){estadoBg='#fee2e2';estadoCol='#991b1b';}
    else if(r._estado==='Por vencer'){estadoBg='#ffedd5';estadoCol='#9a3412';}
    var diasStr=r._estado==='Vencido'?'<strong style="color:#dc2626;">Vencido '+r._estadoDetalle+'</strong>':
                r._estado==='Por vencer'?'<strong style="color:#ea580c;">Vence '+r._estadoDetalle+'</strong>':
                (r._estadoDetalle?'Vence '+r._estadoDetalle:'');
    return '<tr style="background:'+bg+';border-bottom:1px solid #f3f4f6;">'+
      '<td style="padding:6px 8px;font-size:11px;"><strong>'+getNombreVendedor(v.vendedor_id)+'</strong></td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+fmt(v.fecha)+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(v.veterinaria||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(v.doctora||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(v.zona||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(v.producto||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;text-align:center;">'+(v.cantidad||'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+(v.fecha_cobro?fmt(v.fecha_cobro):'---')+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;">'+diasStr+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:700;color:#dc2626;">'+money(v.total)+'</td>'+
      '<td style="padding:6px 8px;font-size:11px;"><span style="background:'+estadoBg+';color:'+estadoCol+';padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">'+r._estado+'</span></td>'+
    '</tr>';
  }).join('');
  var tabla='<table style="width:100%;border-collapse:collapse;margin-bottom:14px;">'+
    '<thead><tr style="background:#253C61;">'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Vendedor</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">F.Venta</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Veterinaria</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Doctor/a</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Zona</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Producto</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:center;color:#fff;font-weight:700;text-transform:uppercase;">Cant.</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">F.Cobro</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Urgencia</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:right;color:#fff;font-weight:700;text-transform:uppercase;">Monto</th>'+
      '<th style="padding:7px 8px;font-size:10px;text-align:left;color:#fff;font-weight:700;text-transform:uppercase;">Estado</th>'+
    '</tr></thead><tbody>'+bodyRows+'</tbody></table>';
  var kpis='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px 32px;">'+
    '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#718096;font-weight:600;text-transform:uppercase;">Total Pendiente</div><div style="font-family:Bebas Neue,sans-serif;font-size:24px;color:#253C61;">'+money(total)+'</div><div style="font-size:11px;color:#718096;">'+cr.length+' crédito'+(cr.length!==1?'s':'')+'</div></div>'+
    '<div style="background:#fee2e2;border:1.5px solid #fca5a5;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#991b1b;font-weight:600;text-transform:uppercase;">Vencidos</div><div style="font-family:Bebas Neue,sans-serif;font-size:24px;color:#dc2626;">'+venc+'</div><div style="font-size:11px;color:#991b1b;">'+money(totalVenc)+'</div></div>'+
    '<div style="background:#ffedd5;border:1.5px solid #fdba74;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#9a3412;font-weight:600;text-transform:uppercase;">Por Vencer</div><div style="font-family:Bebas Neue,sans-serif;font-size:24px;color:#ea580c;">'+porVenc+'</div><div style="font-size:11px;color:#9a3412;">'+money(totalPV)+' ('+DIAS_POR_VENCER_REPORTE+'d)</div></div>'+
    '<div style="background:#fef3c7;border:1.5px solid #fcd34d;border-radius:8px;padding:12px 16px;"><div style="font-size:10px;color:#92400e;font-weight:600;text-transform:uppercase;">Total urgente</div><div style="font-family:Bebas Neue,sans-serif;font-size:24px;color:#d97706;">'+money(totalVenc+totalPV)+'</div><div style="font-size:11px;color:#92400e;">a cobrar ya</div></div>'+
  '</div>';
  var filtroLabel=filtVend?' — '+getNombreVendedor(filtVend):'';
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+_pdfFavicon()+'<title>Créditos Pendientes'+filtroLabel+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}.wrap{padding:16px 32px;}</style></head><body>'+
    _pdfHeader('Créditos Pendientes'+filtroLabel,'Listado de cobranzas pendientes · Ordenado por urgencia'+(busq?' · Búsqueda: "'+busq+'"':''))+
    kpis+
    '<div class="wrap">'+tabla+
    '<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px 14px;margin-top:14px;font-size:11px;color:#92400e;">'+
      '<strong>💡 Recomendación:</strong> Prioriza los créditos vencidos (en rojo). Los más urgentes aparecen al inicio del listado.'+
    '</div></div>'+
    '<script>window.onload=function(){window.print();}<\/script></body></html>';
  var w=window.open('','_blank');w.document.write(html);w.document.close();
}

function _pdfHeader(titulo,subtitulo){
  return '<div style="background:#253C61;color:#fff;padding:24px 32px;display:flex;align-items:center;gap:16px;">'+
    '<div style="flex:1"><div style="font-family:Bebas Neue,sans-serif;font-size:32px;letter-spacing:1px;">SUPLEVET</div>'+
    '<div style="font-size:18px;font-weight:700;margin-top:2px;">'+titulo+'</div>'+
    '<div style="font-size:13px;opacity:.8;margin-top:2px;">'+subtitulo+'</div></div>'+
    '<div style="text-align:right;font-size:12px;opacity:.7;">'+new Date().toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+'</div>'+
  '</div>';
}

function pdfMensualGlobal(){
  var mes=gel('rpt-mes-global').value; var filtVend=gel('rpt-vend-global').value;
  if(!mes){setSt('Selecciona el período','er');return;}
  var p=mes.split('-'); var my=parseInt(p[0]),mm=parseInt(p[1])-1;
  var ventas=_ventas.filter(function(v){var d=new Date(v.fecha);return d.getFullYear()===my&&d.getMonth()===mm&&v.movimiento!=='Visita'&&v.estado!=='Anulado';});
  if(filtVend) ventas=ventas.filter(function(v){return String(v.vendedor_id)===String(filtVend);});
  var total=ventas.reduce(function(s,v){return s+(v.total||0);},0);
  var cobrado=ventas.filter(function(v){return v.estado==='✅ Pagado';}).reduce(function(s,v){return s+(v.total||0);},0);
  var ns=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var titulo='Reporte Mensual — '+ns[mm]+' '+my+(filtVend?' — '+getNombreVendedor(filtVend):'');
  var rows=ventas.map(function(v){
    return '<tr><td>'+fmt(v.fecha)+'</td><td><strong>'+getNombreVendedor(v.vendedor_id)+'</strong></td><td>'+(v.veterinaria||'—')+'</td><td>'+bMovPdf(v.movimiento)+'</td><td>'+(v.producto||'—')+'</td><td><strong>'+money(v.total)+'</strong></td><td>'+bEstPdf(v.estado)+'</td></tr>';
  }).join('');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+_pdfFavicon()+'<title>'+titulo+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;}'+
    'table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#253C61;color:#fff;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;}'+
    'td{padding:7px 10px;border-bottom:1px solid #e2e8f0;}tr:nth-child(even){background:#f8fafc;}'+
    '.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:20px 32px;}.kpi{background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 16px;}'+
    '.kv{font-family:"Bebas Neue",sans-serif;font-size:26px;color:#253C61;}.kl{font-size:10px;color:#718096;font-weight:600;text-transform:uppercase;}'+
    '.wrap{padding:20px 32px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>'+
    _pdfHeader(titulo,'Suplevet — Control Total')+
    '<div class="kpis">'+
      '<div class="kpi"><div class="kl">Total ventas</div><div class="kv">'+money(total)+'</div></div>'+
      '<div class="kpi"><div class="kl">Total cobrado</div><div class="kv">'+money(cobrado)+'</div></div>'+
      '<div class="kpi"><div class="kl">Transacciones</div><div class="kv">'+ventas.length+'</div></div>'+
    '</div>'+
    '<div class="wrap"><table><thead><tr><th>Fecha</th><th>Vendedor</th><th>Veterinaria</th><th>Movimiento</th><th>Producto</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<script>window.onload=function(){window.print();}<\/script></body></html>';
  var w=window.open('','_blank');w.document.write(html);w.document.close();
}

function pdfRanking(){
  var mes=gel('rpt-mes-rank').value; if(!mes){setSt('Selecciona el período','er');return;}
  var p=mes.split('-'); var my=parseInt(p[0]),mm=parseInt(p[1])-1;
  var ns=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var ranking=_vendedores.map(function(v){
    var vts=_ventas.filter(function(x){var d=new Date(x.fecha);var mt=x.movimiento||'';return d.getFullYear()===my&&d.getMonth()===mm&&String(x.vendedor_id)===String(v.id)&&(mt==='Venta al contado'||mt==='Venta delivery'||mt==='Cobro de credito')&&x.estado==='✅ Pagado';});
    var total=vts.reduce(function(s,x){return s+(x.total||0);},0);
    var nivel=anNivelVendedor(total);
    return {nombre:v.nombre,total:total,transacc:vts.length,nivel:nivel};
  }).sort(function(a,b){return b.total-a.total;});
  var rows=ranking.map(function(r,i){
    return '<tr><td style="font-family:Bebas Neue,sans-serif;font-size:22px;color:#253C61;">'+(i+1)+'</td>'+
      '<td><strong>'+r.nombre+'</strong></td>'+
      '<td><strong style="font-size:15px;color:#253C61;">'+money(r.total)+'</strong></td>'+
      '<td>'+r.transacc+' transacc.</td>'+
      '<td>'+(r.nivel?r.nivel.emoji+' '+r.nivel.nombre:'—')+'</td></tr>';
  }).join('');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+_pdfFavicon()+'<title>Ranking '+ns[mm]+' '+my+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:13px;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#253C61;color:#fff;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;}td{padding:9px 10px;border-bottom:1px solid #e2e8f0;}tr:nth-child(even){background:#f8fafc;}.wrap{padding:20px 32px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>'+
    _pdfHeader('Ranking de Vendedores — '+ns[mm]+' '+my,'Suplevet — Control Total')+
    '<div class="wrap"><table><thead><tr><th>#</th><th>Vendedor</th><th>Total Ventas</th><th>Transacciones</th><th>Nivel</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<script>window.onload=function(){window.print();}<\/script></body></html>';
  var w=window.open('','_blank');w.document.write(html);w.document.close();
}

function pdfMorosidad(){
  var filtVend=gel('rpt-vend-mor').value;
  var cr=_ventas.filter(function(v){
    var esCred=(v.movimiento==='Credito a 15 dias'||v.movimiento==='Crédito a 15 días');
    var pendiente=v.estado!=='✅ Pagado'&&v.estado!=='Anulado'&&v.estado!=='📦 Devuelto';
    if(!esCred||!pendiente)return false;
    if(filtVend) return String(v.vendedor_id)===String(filtVend);
    return true;
  }).sort(function(a,b){return (a.fecha_cobro||'').localeCompare(b.fecha_cobro||'');});
  var total=cr.reduce(function(s,v){return s+(v.total||0);},0);
  var venc=cr.filter(function(v){return v.estado==='❌ Vencido';});
  var rows=cr.map(function(v){
    var dias=v.fecha_cobro?diasHasta(v.fecha_cobro):null;
    var vencido=dias!==null&&dias<0;
    return '<tr style="'+(vencido?'background:#fef2f2;':'')+'">'+
      '<td><strong>'+getNombreVendedor(v.vendedor_id)+'</strong></td>'+
      '<td>'+(v.veterinaria||'—')+'</td><td>'+(v.doctora||'—')+'</td>'+
      '<td>'+(v.producto||'—')+' × '+(v.cantidad||0)+'</td>'+
      '<td><strong>'+money(v.total)+'</strong></td>'+
      '<td>'+fmt(v.fecha_cobro||'')+'</td>'+
      '<td style="font-weight:700;color:'+(vencido?'#dc2626':'#d97706')+';">'+(vencido?'Vencido hace '+Math.abs(dias)+' días':'Vence en '+dias+' días')+'</td>'+
    '</tr>';
  }).join('');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+_pdfFavicon()+'<title>Morosidad</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#253C61;color:#fff;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;}td{padding:7px 10px;border-bottom:1px solid #e2e8f0;}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:20px 32px;}.kpi{background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;padding:12px 16px;}.kv{font-family:"Bebas Neue",sans-serif;font-size:26px;color:#253C61;}.kl{font-size:10px;color:#718096;font-weight:600;text-transform:uppercase;}.wrap{padding:20px 32px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>'+
    _pdfHeader('Reporte de Morosidad','Suplevet — Créditos pendientes y vencidos')+
    '<div class="kpis">'+
      '<div class="kpi"><div class="kl">Total pendiente</div><div class="kv">'+money(total)+'</div></div>'+
      '<div class="kpi"><div class="kl">Créditos vencidos</div><div class="kv" style="color:#dc2626;">'+venc.length+'</div></div>'+
      '<div class="kpi"><div class="kl">Total créditos</div><div class="kv">'+cr.length+'</div></div>'+
    '</div>'+
    '<div class="wrap"><table><thead><tr><th>Vendedor</th><th>Veterinaria</th><th>Doctor</th><th>Producto</th><th>Monto</th><th>Vencimiento</th><th>Estado</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<script>window.onload=function(){window.print();}<\/script></body></html>';
  var w=window.open('','_blank');w.document.write(html);w.document.close();
}

function pdfZonas(){
  var mes=gel('rpt-mes-zona').value; if(!mes){setSt('Selecciona el período','er');return;}
  var p=mes.split('-'); var my=parseInt(p[0]),mm=parseInt(p[1])-1;
  var ns=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var ventasMes=_ventas.filter(function(v){var d=new Date(v.fecha);return d.getFullYear()===my&&d.getMonth()===mm&&v.movimiento!=='Visita'&&v.estado!=='Anulado';});
  var zonaMap={};
  ventasMes.forEach(function(v){
    var zn=v.zona||'Sin zona';
    if(!zonaMap[zn])zonaMap[zn]={zona:zn,total:0,transacc:0,vendedores:{}};
    zonaMap[zn].total+=(v.total||0); zonaMap[zn].transacc++; zonaMap[zn].vendedores[v.vendedor_id]=1;
  });
  var zonaList=Object.values(zonaMap).sort(function(a,b){return b.total-a.total;});
  var totalGeneral=zonaList.reduce(function(s,z){return s+z.total;},0);
  var rows=zonaList.map(function(z){
    var pct=totalGeneral>0?Math.round(z.total/totalGeneral*100):0;
    var vends=Object.keys(z.vendedores).map(function(id){return getNombreVendedor(id);}).join(', ');
    return '<tr><td><strong>'+z.zona+'</strong></td><td><strong style="font-size:14px;color:#253C61;">'+money(z.total)+'</strong></td><td>'+z.transacc+'</td><td>'+pct+'%</td><td style="font-size:11px;">'+vends+'</td></tr>';
  }).join('');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+_pdfFavicon()+'<title>Zonas '+ns[mm]+' '+my+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:13px;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#253C61;color:#fff;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;}td{padding:8px 10px;border-bottom:1px solid #e2e8f0;}tr:nth-child(even){background:#f8fafc;}.wrap{padding:20px 32px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>'+
    _pdfHeader('Reporte por Zona — '+ns[mm]+' '+my,'Suplevet — Control Total')+
    '<div class="wrap"><table><thead><tr><th>Zona</th><th>Total Ventas</th><th>Transacciones</th><th>Participación</th><th>Vendedores</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<script>window.onload=function(){window.print();}<\/script></body></html>';
  var w=window.open('','_blank');w.document.write(html);w.document.close();
}

// ══ LIQUIDACIÓN DE COMISIONES ══
// Override de sueldo básico por vendedor (solo para la sesión actual)
var _liqBasicoOverride = {};
function _liqSetBasico(vid, valor){
  _liqBasicoOverride[String(vid)] = parseFloat(valor)||0;
  rLiquidacion();
}

function rLiquidacion(){
  var now=new Date(); var mesStr=now.getFullYear()+'-'+(String(now.getMonth()+1).padStart(2,'0'));
  if(gel('liq-mes')&&!gel('liq-mes').value) gel('liq-mes').value=mesStr;
  var mes=gel('liq-mes').value||mesStr;
  var p=mes.split('-'); var my=parseInt(p[0]),mm=parseInt(p[1])-1;
  var ns=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  var liqData=_vendedores.map(function(v){
    var vts=_ventas.filter(function(x){var d=new Date(x.fecha);return d.getFullYear()===my&&d.getMonth()===mm&&String(x.vendedor_id)===String(v.id)&&(x.movimiento==='Venta al contado'||x.movimiento==='Venta delivery'||x.movimiento==='Cobro de credito')&&x.estado==='✅ Pagado';});
    var totalVentas=vts.reduce(function(s,x){return s+(x.total||0);},0);
    var nivel=anNivelVendedor(totalVentas);
    var basicoNivel=(nivel&&nivel.basico)||1200;
    var basico=_liqBasicoOverride[String(v.id)]!==undefined?_liqBasicoOverride[String(v.id)]:basicoNivel;
    var movilidad=(nivel&&nivel.movilidad)||400;
    var comisionPct=(nivel&&nivel.comision_pct)||0;
    var bono=(nivel&&nivel.bono)||0;
    var comisionMonto=totalVentas*comisionPct/100;
    var totalIngreso=basico+movilidad+comisionMonto+bono;
    var tieneOverride=_liqBasicoOverride[String(v.id)]!==undefined;
    return {v:v, totalVentas:totalVentas, nivel:nivel, basico:basico, basicoNivel:basicoNivel, tieneOverride:tieneOverride, movilidad:movilidad, comisionPct:comisionPct, comisionMonto:comisionMonto, bono:bono, totalIngreso:totalIngreso};
  }).sort(function(a,b){return b.totalVentas-a.totalVentas;});

  var vendConVentas=liqData.filter(function(r){return r.totalVentas>0;}).length;
  var totalPago=liqData.reduce(function(s,r){return s+r.totalIngreso;},0);
  var totalComisiones=liqData.reduce(function(s,r){return s+r.comisionMonto;},0);

  gel('liq-kpis').innerHTML=[
    {lbl:'TOTAL A PAGAR',val:money(totalPago),color:'var(--brand)'},
    {lbl:'TOTAL COMISIONES',val:money(totalComisiones),color:'var(--ok)'},
    {lbl:'VENDEDORES CON VENTAS',val:vendConVentas+'',color:'#1e6e77'},
    {lbl:'PERÍODO',val:ns[mm]+' '+my,color:'var(--orange)'}
  ].map(function(k){
    return '<div class="an-kpi"><div class="an-kpi-lbl">'+k.lbl+'</div><div class="an-kpi-val" style="color:'+k.color+'">'+k.val+'</div></div>';
  }).join('');

  var rows=liqData.map(function(r){
    var basicoInput='<input type="number" min="0" step="100" value="'+r.basico+'" '+
      'onchange="_liqSetBasico(\''+r.v.id+'\',this.value)" '+
      'style="width:78px;padding:3px 6px;border:1.5px solid '+(r.tieneOverride?'var(--orange)':'var(--bd)')+';border-radius:4px;text-align:right;font-size:13px;font-weight:700;" '+
      'title="'+(r.tieneOverride?'Modificado (nivel: S/ '+r.basicoNivel+')':'S/ '+r.basicoNivel+' (según nivel)')+'"/>'+
      (r.tieneOverride?'<span style="font-size:9px;color:var(--orange);margin-left:3px;" title="Básico modificado manualmente">✎</span>':'');
    return '<tr>'+
      '<td><strong>'+r.v.nombre+'</strong>'+(r.totalVentas===0?'<span style="font-size:10px;color:var(--tl);margin-left:4px;">(sin ventas)</span>':'')+'</td>'+
      '<td>'+money(r.totalVentas)+'</td>'+
      '<td>'+(r.nivel?r.nivel.emoji+' '+r.nivel.nombre:'⭕ Inicial')+'</td>'+
      '<td style="white-space:nowrap;">'+basicoInput+'</td>'+
      '<td>S/ '+r.movilidad+'</td>'+
      '<td><span style="color:var(--ok);font-weight:700;">'+r.comisionPct+'% = '+money(r.comisionMonto)+'</span></td>'+
      '<td><span style="color:var(--orange);font-weight:700;">'+money(r.bono)+'</span></td>'+
      '<td><strong style="font-size:15px;color:var(--brand);">'+money(r.totalIngreso)+'</strong></td>'+
    '</tr>';
  }).join('');

  gel('liq-tabla').innerHTML=rows
    ?'<table><thead><tr><th>Vendedor</th><th>Ventas</th><th>Nivel</th><th>Básico <span style="font-size:10px;font-weight:400;opacity:.7;">(editable)</span></th><th>Movilidad</th><th>Comisión</th><th>Bono</th><th>TOTAL</th></tr></thead><tbody>'+rows+'</tbody></table>'
    :'<div style="padding:3rem;text-align:center;color:var(--tl);">Sin vendedores registrados</div>';
}

function pdfLiquidacion(){
  var mes=gel('liq-mes').value; if(!mes){setSt('Selecciona el período','er');return;}
  var p=mes.split('-'); var my=parseInt(p[0]),mm=parseInt(p[1])-1;
  var ns=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var liqData=_vendedores.map(function(v){
    var vts=_ventas.filter(function(x){var d=new Date(x.fecha);return d.getFullYear()===my&&d.getMonth()===mm&&String(x.vendedor_id)===String(v.id)&&(x.movimiento==='Venta al contado'||x.movimiento==='Venta delivery'||x.movimiento==='Cobro de credito')&&x.estado==='✅ Pagado';});
    var totalVentas=vts.reduce(function(s,x){return s+(x.total||0);},0);
    var nivel=anNivelVendedor(totalVentas);
    var basicoNivel=(nivel&&nivel.basico)||1200;
    var basico=_liqBasicoOverride[String(v.id)]!==undefined?_liqBasicoOverride[String(v.id)]:basicoNivel;
    var movilidad=(nivel&&nivel.movilidad)||400;
    var comisionPct=(nivel&&nivel.comision_pct)||0,bono=(nivel&&nivel.bono)||0;
    var comisionMonto=totalVentas*comisionPct/100;
    return {nombre:v.nombre,totalVentas:totalVentas,nivel:nivel,basico:basico,movilidad:movilidad,comisionPct:comisionPct,comisionMonto:comisionMonto,bono:bono,totalIngreso:basico+movilidad+comisionMonto+bono};
  }).sort(function(a,b){return b.totalVentas-a.totalVentas;});
  var totalPago=liqData.reduce(function(s,r){return s+r.totalIngreso;},0);
  var rows=liqData.map(function(r,i){
    return '<tr>'+
      '<td>'+(i+1)+'</td><td><strong>'+r.nombre+'</strong></td>'+
      '<td>'+money(r.totalVentas)+'</td>'+
      '<td>'+(r.nivel?r.nivel.emoji+' '+r.nivel.nombre:'—')+'</td>'+
      '<td>S/ '+r.basico+'</td><td>S/ '+r.movilidad+'</td>'+
      '<td>'+r.comisionPct+'% = '+money(r.comisionMonto)+'</td>'+
      '<td>'+money(r.bono)+'</td>'+
      '<td><strong style="font-size:14px;color:#253C61;">'+money(r.totalIngreso)+'</strong></td>'+
    '</tr>';
  }).join('');
  var html='<!DOCTYPE html><html><head><meta charset="UTF-8">'+_pdfFavicon()+'<title>Liquidación '+ns[mm]+' '+my+'</title>'+
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">'+
    '<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"DM Sans",sans-serif;font-size:12px;}table{width:100%;border-collapse:collapse;margin-top:16px;}th{background:#253C61;color:#fff;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;}td{padding:7px 10px;border-bottom:1px solid #e2e8f0;}tr:nth-child(even){background:#f8fafc;}.wrap{padding:20px 32px;}.total-row{display:flex;justify-content:space-between;padding:12px 32px;background:#f0f7ff;font-weight:700;font-size:16px;border-top:2px solid #253C61;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>'+
    _pdfHeader('Liquidación de Comisiones — '+ns[mm]+' '+my,'Suplevet — Planilla mensual de pagos')+
    '<div class="wrap"><table><thead><tr><th>#</th><th>Vendedor</th><th>Ventas</th><th>Nivel</th><th>Básico</th><th>Movilidad</th><th>Comisión</th><th>Bono</th><th>TOTAL A PAGAR</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div class="total-row"><span>TOTAL PLANILLA '+ns[mm].toUpperCase()+' '+my+'</span><span style="color:#253C61;font-family:Bebas Neue,sans-serif;font-size:22px;">'+money(totalPago)+'</span></div>'+
    '<script>window.onload=function(){window.print();}<\/script></body></html>';
  var w=window.open('','_blank');w.document.write(html);w.document.close();
}

