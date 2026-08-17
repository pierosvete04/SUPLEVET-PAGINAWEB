// ── COBRO: imágenes y método de pago ──
var _cobImagenes = { cp: [], mp: [] };
var _COB_IMG_MAX = 4;

function _cobImgAgregar(pfx){
  var inp=gel(pfx+'-img-doc');
  if(!inp||!inp.files) return;
  var arr=_cobImagenes[pfx]||[];
  var libre=_COB_IMG_MAX-arr.length;
  if(libre<=0){ setSt('Máximo '+_COB_IMG_MAX+' imágenes','er'); setTimeout(function(){setSt('');},2000); inp.value=''; return; }
  for(var i=0;i<inp.files.length&&i<libre;i++) arr.push(inp.files[i]);
  if(inp.files.length>libre){ setSt('Solo se agregaron '+libre+' imágenes (máx '+_COB_IMG_MAX+')','er'); setTimeout(function(){setSt('');},2500); }
  inp.value='';
  _cobImgRender(pfx);
}

function _cobImgRemover(pfx, idx){
  var arr=_cobImagenes[pfx]||[];
  if(idx<0||idx>=arr.length) return;
  arr.splice(idx,1);
  _cobImgRender(pfx);
}

function _cobImgRender(pfx){
  var arr=_cobImagenes[pfx]||[];
  var grid=gel(pfx+'-img-grid');
  var counter=gel(pfx+'-img-counter');
  if(!grid) return;
  if(counter) counter.textContent='('+arr.length+'/'+_COB_IMG_MAX+')';
  var html='';
  arr.forEach(function(f,idx){
    var isImg=f.type&&f.type.indexOf('image/')===0;
    html+='<div style="position:relative;border:2px solid #16a34a;border-radius:10px;background:#f0fdf4;padding:6px 4px;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;">'+
      '<button type="button" onclick="_cobImgRemover(\''+pfx+'\','+idx+');event.stopPropagation();" style="position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:#dc2626;color:#fff;border:none;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:bold;line-height:1;padding:0;">×</button>'+
      (isImg?'<img data-cob-thumb="'+pfx+'-'+idx+'" src="" style="max-width:100%;max-height:55px;object-fit:contain;border-radius:5px;"/>':'<div style="font-size:28px;line-height:1;">📄</div>')+
      '<div style="font-size:9px;color:var(--brand);font-weight:600;text-align:center;word-break:break-all;padding:0 2px;line-height:1.2;">'+f.name+'</div>'+
    '</div>';
  });
  if(arr.length<_COB_IMG_MAX){
    html+='<div onclick="document.getElementById(\''+pfx+'-img-doc\').click()" style="border:2px dashed var(--brand);border-radius:10px;background:var(--sky4);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 6px;cursor:pointer;min-height:100px;text-align:center;user-select:none;">'+
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>'+
      '<span style="font-size:11px;font-weight:600;color:var(--brand);">'+(arr.length?'Agregar':'Subir')+'</span>'+
    '</div>';
  }
  grid.innerHTML=html;
  arr.forEach(function(f,idx){
    if(!f.type||f.type.indexOf('image/')!==0) return;
    var img=grid.querySelector('img[data-cob-thumb="'+pfx+'-'+idx+'"]');
    if(!img) return;
    var r=new FileReader(); r.onload=function(e){img.src=e.target.result;}; r.readAsDataURL(f);
  });
}

function _cobToggleMPDrop(pfx, e){
  if(e) e.stopPropagation();
  var drop=gel(pfx+'-mp-drop'), chev=gel(pfx+'-mp-chev');
  if(!drop) return;
  if(drop.style.display!=='none'){ drop.style.display='none'; if(chev) chev.style.transform=''; return; }
  drop.innerHTML=Object.keys(_MV_MP_CONFIG).map(function(k){
    return '<div onclick="_cobSelecMP(\''+pfx+'\',\''+k.replace(/'/g,"\\'")+'\');event.stopPropagation();" style="display:flex;align-items:center;gap:10px;padding:.55rem .85rem;cursor:pointer;border-bottom:1px solid var(--bd);background:#fff;" onmouseover="this.style.background=\'var(--sky4)\'" onmouseout="this.style.background=\'#fff\'">'+
      _MV_MP_CONFIG[k].html+'<span style="font-size:12px;font-weight:600;color:var(--td);">'+k+'</span></div>';
  }).join('');
  drop.style.display='block';
  if(chev) chev.style.transform='rotate(180deg)';
  setTimeout(function(){
    document.addEventListener('click', function _close(){ drop.style.display='none'; if(chev) chev.style.transform=''; document.removeEventListener('click',_close); }, {once:true});
  },0);
}

function _cobSelecMP(pfx, val){
  var cfg=_MV_MP_CONFIG[val]; if(!cfg) return;
  var inp=gel(pfx+'-metodo-pago'); if(inp) inp.value=val;
  var logo=gel(pfx+'-mp-logo'); if(logo) logo.innerHTML=cfg.html;
  var name=gel(pfx+'-mp-name'); if(name){ name.textContent=val; name.style.color=cfg.color; name.style.fontWeight='600'; }
  var drop=gel(pfx+'-mp-drop'); if(drop) drop.style.display='none';
  var chev=gel(pfx+'-mp-chev'); if(chev) chev.style.transform='';
  var rw=gel(pfx+'-receptor-wrap'); if(rw) rw.style.display=(val==='EFECTIVO')?'block':'none';
  var rs=gel(pfx+'-receptor'); if(rs&&val!=='EFECTIVO') rs.value='';
  // Con EFECTIVO el comprobante de pago es opcional (igual que en Registrar Visita).
  var reqEl=gel(pfx+'-img-req'); if(reqEl) reqEl.style.display=(val==='EFECTIVO')?'none':'inline';
}

function _cobResetForm(pfx){
  _cobImagenes[pfx]=[];
  _cobImgRender(pfx);
  var mp=gel(pfx+'-metodo-pago'); if(mp) mp.value='';
  var logo=gel(pfx+'-mp-logo'); if(logo) logo.innerHTML='<div style="width:32px;height:32px;border-radius:6px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#718096;font-size:12px;">—</div>';
  var name=gel(pfx+'-mp-name'); if(name){ name.textContent='— Seleccionar método —'; name.style.color='var(--tl)'; name.style.fontWeight='normal'; }
  var rw=gel(pfx+'-receptor-wrap'); if(rw) rw.style.display='none';
  var rs=gel(pfx+'-receptor'); if(rs) rs.value='';
  var reqEl=gel(pfx+'-img-req'); if(reqEl) reqEl.style.display='inline';
  var inp=gel(pfx+'-img-doc');
  if(inp&&!inp.dataset.cobWired){
    inp.dataset.cobWired='1';
    inp.addEventListener('change', function(){ _cobImgAgregar(pfx); });
  }
}

function _cobUploadImages(pfx){
  var arr=_cobImagenes[pfx]||[];
  if(!arr.length) return Promise.resolve(null);
  var _ts=Date.now();
  return arr.reduce(function(chain,file,i){
    return chain.then(function(urls){
      return comprimirImagen(file,4).then(function(c){
        var ext=(c.name.split('.').pop()||'jpg').toLowerCase();
        var path='cobro-'+_ts+'-'+i+'.'+ext;
        return fetch(SB+'/storage/v1/object/documentos-venta/'+path,{
          method:'POST',
          headers:{'apikey':AK,'Authorization':'Bearer '+(AUTH_TOKEN||AK),'Content-Type':c.type},
          body:c
        }).then(function(r){
          if(!r.ok) return r.text().then(function(tx){var p={};try{p=JSON.parse(tx);}catch(ex){}throw new Error(p.message||p.error||'Error al subir imagen '+(i+1));});
          urls.push(SB+'/storage/v1/object/public/documentos-venta/'+path);
          return urls;
        });
      });
    });
  }, Promise.resolve([])).then(function(urls){ return urls.join('\n'); });
}

function rCreditos(){
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
  cr.sort(function(a,b){
    // Calcular días vencido para cada uno (positivo = vencido hace X días)
    var diasA=a.fecha_cobro?Math.ceil((new Date()-new Date(a.fecha_cobro))/86400000):-9999;
    var diasB=b.fecha_cobro?Math.ceil((new Date()-new Date(b.fecha_cobro))/86400000):-9999;
    // Más vencido primero (mayor número de días vencidos)
    if(diasA!==diasB)return diasB-diasA;
    // Empate: por monto (más alto primero - más urgente)
    return (b.total||0)-(a.total||0);
  });
  var total=0,venc=0,pv=0;
  for(var i=0;i<cr.length;i++){
    total+=(cr[i].total||0);
    // Contar vencidos por fecha (no por estado), igual que el color de la tarjeta
    if(cr[i].fecha_cobro){
      var _d=Math.ceil((new Date(cr[i].fecha_cobro)-new Date())/86400000);
      if(_d<0)venc++;                    // fecha_cobro ya pasó → vencido
      else if(_d>=0&&_d<=15)pv++;       // vence en los próximos 15 días
    }
  }
  gel('c-total').textContent=money(total);
  gel('c-venc').textContent=venc;
  gel('c-pv').textContent=pv;
  var h='';
  for(var i=0;i<cr.length;i++){
    var v=cr[i];
    var dias=v.fecha_cobro?Math.ceil((new Date(v.fecha_cobro)-new Date())/86400000):null;
    var vencido=dias!==null&&dias<0;
    var diasAbs=dias!==null?Math.abs(dias):0;

    // Color scheme based on urgency
    var cardBg, cardBorder, textColor, subColor, moneyColor, btnStyle;
    if(vencido && diasAbs > 15){
      // MUY vencido: rojo fuerte
      cardBg='#dc2626'; cardBorder='#b91c1c'; textColor='#fff'; subColor='rgba(255,255,255,.75)'; moneyColor='#fff';
      btnStyle='background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);';
    } else if(vencido && diasAbs > 7){
      // Vencido medio: rojo medio
      cardBg='#ef4444'; cardBorder='#dc2626'; textColor='#fff'; subColor='rgba(255,255,255,.75)'; moneyColor='#fff';
      btnStyle='background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);';
    } else if(vencido){
      // Vencido reciente (1-7 días): naranja oscuro
      cardBg='#f97316'; cardBorder='#ea580c'; textColor='#fff'; subColor='rgba(255,255,255,.8)'; moneyColor='#fff';
      btnStyle='background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4);';
    } else if(dias!==null && dias <= 5){
      // Por vencer pronto: amarillo
      cardBg='#fef3c7'; cardBorder='#f59e0b'; textColor='#92400e'; subColor='#a16207'; moneyColor='#d97706';
      btnStyle='';
    } else {
      // Normal / recién emitido
      cardBg='var(--wh)'; cardBorder='rgba(230,225,215,.8)'; textColor='inherit'; subColor='var(--tl)'; moneyColor='#d97706';
      btnStyle='';
    }

    var diasStr=dias!==null?(vencido?'<strong>Vencido hace '+diasAbs+' d\u00edas</strong>':'Vence en '+dias+' d\u00edas'):'';

    h+='<div class="cred-item" style="background:'+cardBg+';border-color:'+cardBorder+';">'+
      '<div class="cred-dot '+(vencido?'venc':'pend')+'"></div>'+
      '<div style="flex:1">'+
        '<div style="font-weight:700;font-size:13.5px;color:'+textColor+'">'+(v.veterinaria||v.doctora||'\u2014')+'</div>'+
        '<div style="font-size:11px;color:'+subColor+'">'+
          (v.veterinaria&&v.doctora ? v.doctora : '')+
          (v.zona?' \u00b7 '+v.zona:'')+
        '</div>'+
        '<div style="font-size:11px;color:'+subColor+'">Cobro: '+fmt(v.fecha_cobro)+' \u00b7 '+diasStr+'</div>'+
        '<div style="margin-top:2px;font-weight:600;font-size:11px;color:'+subColor+'">'+(v.producto||'')+(v.cantidad?' \u00b7 '+v.cantidad+' uds':'')+'</div>'+
      '</div>'+
      '<div style="text-align:right;display:flex;flex-direction:column;gap:4px;">'+
        '<div style="font-size:15px;font-weight:700;color:'+moneyColor+'">'+money(v.total)+'</div>'+
        '<button class="btn btn-sm" onclick="marcarPagado(\''+v.id+'\')" style="white-space:nowrap;'+btnStyle+'">\u2705 Cobrado</button>'+
        '<button class="btn btn-sm" onclick="abrirCobroParcial(\''+v.id+'\')" style="white-space:nowrap;'+btnStyle+'">\ud83d\udcb0 Parcial</button>'+
      '</div>'+
    '</div>';
  }
  gel('lista-cred').innerHTML=h||'<div class="es"><div class="ei"><svg class="ic ic-vacio" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="#i-ok"/></svg></div><strong>Sin créditos pendientes.</strong><br>Todo lo que vendiste a crédito ya está cobrado.</div>';
}

function marcarPagado(id){
  gel('mp-id').value=id;
  gel('mp-fecha').value=hoy();
  _cobResetForm('mp');
  docsReset('mp');
  gel('modal-marcar-pagado').classList.add('open');
  setTimeout(function(){gel('mp-fecha').focus();},200);
}

function confirmarMarcarPagado(){
  var id=gel('mp-id').value;
  var fecha=gel('mp-fecha').value||hoy();
  var mpVal=(gel('mp-metodo-pago')||{}).value||'';
  var receptorVal=(gel('mp-receptor')||{}).value||'';
  if(!mpVal){ setSt('Selecciona el método de pago','er'); return; }
  if(mpVal==='EFECTIVO'&&!receptorVal){ setSt('Indica a quién se entregó el efectivo','er'); return; }
  if(mpVal!=='EFECTIVO'&&!(_cobImagenes.mp||[]).length){ setSt('Adjunta al menos una imagen del pago','er'); return; }
  var orig=null;
  for(var i=0;i<_ventas.length;i++){if(_ventas[i].id===id){orig=_ventas[i];break;}}
  setBL('btn-mp-ok',true,'Guardando...');
  var _docsMp=docsSerializar('mp');
  _cobUploadImages('mp').then(function(imgUrl){
    return sbU('ventas',id,{
      // Se reasigna a quien cobra, no a quien dejó el crédito — ver nota en
      // registro-visita.js sobre el caso "vendedor dado de baja".
      vendedor_id:CUR.id,
      estado:'✅ Pagado',
      movimiento:'Cobro de credito',
      fecha:fecha,
      fecha_cobro:fecha,
      notas:'Cobrado el '+fmt(fecha),
      metodo_pago:mpVal||null,
      receptor_efectivo:mpVal==='EFECTIVO'?receptorVal:null,
      imagen_documento:imgUrl||null,
      tipo_documento:_docsMp.tipo,
      numero_documento:_docsMp.nro
    });
  }).then(function(){return loadVentas();})
  .then(function(){
    if(orig){
      notifyMovement({
        vendedor_id: CUR.id,
        vendedor_nombre: CUR.nombre,
        tipo: 'Cobro de credito',
        total: orig.total||0,
        veterinaria: orig.veterinaria,
        zona: orig.zona,
        doctora: orig.doctora,
        producto: orig.producto||null
      });
    }
    gel('modal-marcar-pagado').classList.remove('open');
    _cobImagenes.mp=[];
    rCreditos();rDash();
    setSt('Cobro registrado el '+fmt(fecha)+' ✅','ok');
    setTimeout(function(){setSt('');},3000);
  }).catch(function(e){setSt(SVUI.error(e),'er');})
  .finally(function(){setBL('btn-mp-ok',false,'Confirmar');});
}

// ── COBRO PARCIAL ──
// Se puede registrar de dos formas, porque en la calle pasan las dos:
//   'uds'   → "me pagaron 5 de las 10 bolsas"
//   'monto' → "me pagaron S/ 500 de los S/ 1000"
//
// En modo dinero el importe manda y es exacto; las unidades se aproximan
// dividiendo entre el precio unitario. Se hace así porque ventas.cantidad es
// una columna de enteros y no admite media bolsa. Lo que sí se garantiza es
// que las dos filas resultantes SUMAN el original, tanto en dinero como en
// unidades: el stock y la contabilidad siguen cuadrando.
var _cpModo='uds';

function cpSetModo(modo){
  _cpModo=(modo==='monto')?'monto':'uds';
  var esMonto=(_cpModo==='monto');
  gel('cp-wrap-uds').hidden=esMonto;
  gel('cp-wrap-monto').hidden=!esMonto;
  var bU=gel('cp-modo-uds'), bM=gel('cp-modo-monto');
  bU.classList.toggle('is-on',!esMonto);
  bM.classList.toggle('is-on',esMonto);
  bU.setAttribute('aria-pressed',String(!esMonto));
  bM.setAttribute('aria-pressed',String(esMonto));
  var campo=gel(esMonto?'cp-monto':'cp-cant');
  if(campo){campo.value='';campo.focus();}
  cpPreview();
}

function _cpVentaActual(){
  var id=gel('cp-id').value;
  for(var i=0;i<_ventas.length;i++){if(_ventas[i].id===id)return _ventas[i];}
  return null;
}

// El reparto vive en assets/js/cobros.js (SVCobros), compartido con el panel
// admin y con las dos pantallas de Registrar Visita. Antes había cuatro copias
// de esto y las cuatro diferían.
function cpCalcularReparto(v,modo,valor){
  return SVCobros.reparto(v,modo,valor);
}

// Muestra en vivo cómo va a quedar el crédito antes de confirmar.
function cpPreview(){
  var box=gel('cp-resumen');
  if(!box)return;
  var v=_cpVentaActual();
  var esMonto=(_cpModo==='monto');
  var bruto=parseFloat(gel(esMonto?'cp-monto':'cp-cant').value);
  SVCobros.pintarResumen(box,v,_cpModo,bruto);
}

function abrirCobroParcial(id){
  var v=null;
  for(var i=0;i<_ventas.length;i++){if(_ventas[i].id===id){v=_ventas[i];break;}}
  if(!v)return;
  gel('cp-id').value=id;
  gel('cp-vete').textContent=v.veterinaria||'—';
  gel('cp-desc').textContent=(v.producto||'—')+' · '+money(v.total)+' · '+(v.cantidad||0)+' unidades';
  gel('cp-max').textContent=v.cantidad||0;
  gel('cp-max-monto').textContent=money(v.total);
  gel('cp-cant').value='';
  gel('cp-monto').value='';
  gel('cp-cant').removeAttribute('max');
  gel('cp-fecha').value=hoy();
  _cobResetForm('cp');
  docsReset('cp');
  gel('modal-cobro-parcial').classList.add('open');
  cpSetModo('uds');
  setTimeout(function(){gel('cp-cant').focus();},200);
}

function confirmarCobroParcial(){
  var v=_cpVentaActual();
  if(!v)return;
  var id=v.id;
  var esMonto=(_cpModo==='monto');
  var campo=gel(esMonto?'cp-monto':'cp-cant');
  var bruto=parseFloat(campo.value);
  var fechaCobro=gel('cp-fecha').value||hoy();
  var mpVal=(gel('cp-metodo-pago')||{}).value||'';
  var receptorVal=(gel('cp-receptor')||{}).value||'';

  var rep=cpCalcularReparto(v,_cpModo,bruto);
  if(rep.invalido){
    // El valor NO se borra: si el vendedor tecleó 1200 por error, quiere
    // corregir el número, no volver a escribirlo entero.
    setSt(SVCobros.mensajeError(v,_cpModo,rep),'er');
    campo.focus();campo.select();return;
  }
  if(!mpVal){setSt('Selecciona el método de pago','er');return;}
  if(mpVal==='EFECTIVO'&&!receptorVal){setSt('Indica a quién se entregó el efectivo','er');return;}
  if(mpVal!=='EFECTIVO'&&!(_cobImagenes.cp||[]).length){setSt('Adjunta al menos una imagen del pago','er');return;}

  setBL('btn-cp-ok',true,'Guardando...');
  var _docsCp=docsSerializar('cp');

  _cobUploadImages('cp').then(function(imgUrl){
    var comun={
      // Se reasigna a quien cobra, no a quien dejó el crédito — ver nota en
      // registro-visita.js sobre el caso "vendedor dado de baja".
      vendedor_id:CUR.id,
      estado:'✅ Pagado',
      movimiento:'Cobro de credito',
      fecha:fechaCobro,
      fecha_cobro:fechaCobro,
      metodo_pago:mpVal||null,
      receptor_efectivo:mpVal==='EFECTIVO'?receptorVal:null,
      imagen_documento:imgUrl||null,
      tipo_documento:_docsCp.tipo,
      numero_documento:_docsCp.nro
    };

    if(rep.completo){
      // Cobro total: cantidad y total se quedan como estaban.
      comun.notas=(v.notas?v.notas+' | ':'')+SVCobros.notaCobro(v,rep,_cpModo,fmt(fechaCobro));
      return sbU('ventas',id,SVCobros.camposCobroTotal(comun)).then(function(){return loadVentas();})
      .then(function(){
        cerrarModalCP();rCreditos();rDash();
        setSt('Crédito saldado por completo el '+fmt(fechaCobro),'ok');
        setTimeout(function(){setSt('');},3000);
      });
    }

    // Fila original = la parte cobrada; fila nueva = el saldo. Las dos suman
    // el total original (SVCobros lo garantiza).
    var filaCobro=SVCobros.camposCobroParcial(rep,comun);
    filaCobro.notas=(v.notas?v.notas+' | ':'')+SVCobros.notaCobro(v,rep,_cpModo,fmt(fechaCobro));

    return sbU('ventas',id,filaCobro).then(function(){
      return sbP('ventas',SVCobros.filaSaldo(v,rep,{
        notas:SVCobros.notaSaldo(v,rep,_cpModo,fmt(fechaCobro))
      }));
    }).then(function(){return loadVentas();})
    .then(function(){
      cerrarModalCP();rCreditos();rDash();
      setSt('Cobrado '+money(rep.montoPagado)+' el '+fmt(fechaCobro)+'. Quedan '+money(rep.montoSaldo)+' pendientes.','ok');
      setTimeout(function(){setSt('');},4000);
    });
  }).catch(function(e){setSt(SVUI.error(e,'guardar el cobro'),'er');})
  .finally(function(){setBL('btn-cp-ok',false,'Confirmar cobro');});
}

function cerrarModalCP(){
  gel('modal-cobro-parcial').classList.remove('open');
  _cobImagenes.cp=[];
  _cobImgRender('cp');
}
