/* ═══════════════════════════════════════════════════════════
   COBROS DE CRÉDITO — lógica compartida
   ───────────────────────────────────────────────────────────
   Un cobro de crédito se registra desde CUATRO sitios:

     vendedor/assets/js/creditos.js        pestaña Créditos
     admin/assets/js/dashboard.js          pestaña Créditos
     vendedor/assets/js/registro-visita.js Registrar Visita
     admin/assets/js/visitas.js            Registrar Visita

   Los cuatro tenían su propia copia del reparto y las cuatro
   diferían: dos soportaban cobro en dinero y dos no, dos
   conservaban el importe original y dos lo recalculaban, dos
   tenían respaldo cuando faltaba precio_unitario y dos no.
   Ninguna tenía las tres cosas.

   Esto es la única versión. Los cuatro sitios la llaman.

   ── LAS DOS REGLAS QUE NO SE NEGOCIAN ──

   1. EL DINERO SE CONSERVA. Las dos filas que salen de un cobro
      parcial (la cobrada y el saldo) SIEMPRE suman el total
      original. El saldo se calcula restando, nunca multiplicando
      cantidad × precio: hay filas donde ese producto no da el
      total (descuentos, precios editados a mano) y recalcular
      inventaba o borraba dinero. Registrar Visita lo hacía y
      producía descuadres sin que nadie hiciera nada raro.

   2. UN COBRO TOTAL NO TOCA IMPORTES. Si se cobra el crédito
      entero, cantidad y total se quedan como estaban. Recalcularlos
      convertía un crédito de S/ 950 en un cobro de S/ 1,000.

   ── EL PRECIO EFECTIVO ──

   Para repartir se usa total ÷ cantidad, no precio_unitario:

     · En una fila coherente son el mismo número.
     · En una fila con descuento, reparte a prorrata y el saldo
       nunca sale negativo (con precio_unitario, cobrar 9 de 10
       unidades de un crédito con descuento daba saldo < 0).
     · En una fila sin precio_unitario — las hay antiguas — sigue
       funcionando. Antes daba un cobro de S/ 0.00 que marcaba la
       deuda como pagada y hacía desaparecer el dinero.

   precio_unitario NO se sobrescribe con este número: se guarda el
   original cuando existe, para no corromper el precio de catálogo.
   ═══════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  function r2(n) { return Math.round(n * 100) / 100; }

  function money(n) {
    return global.money ? global.money(n) : ('S/ ' + Number(n || 0).toFixed(2));
  }

  /* Precio con el que se reparte. Ver nota de cabecera. */
  function precioEfectivo(v) {
    if (!v) return 0;
    var cant = Number(v.cantidad) || 0;
    var total = Number(v.total) || 0;
    if (cant > 0 && total > 0) return total / cant;
    var pu = Number(v.precio_unitario) || 0;
    return pu > 0 ? pu : 0;
  }

  /* Precio que se persiste en la fila. Se respeta el de catálogo. */
  function precioAGuardar(v) {
    var pu = Number(v && v.precio_unitario) || 0;
    if (pu > 0) return pu;
    var ef = precioEfectivo(v);
    return ef > 0 ? r2(ef) : 0;
  }

  /* ── EL REPARTO ──
     modo: 'uds' | 'monto'
     Devuelve, según el caso:
       { invalido:true, motivo:'vacio'|'excede' }
       { completo:true }
       { completo:false, udsPagadas, montoPagado, udsSaldo, montoSaldo,
         aproximado, precio }                                            */
  function reparto(v, modo, valor) {
    if (!v) return { invalido: true, motivo: 'vacio' };

    var cantTotal = Number(v.cantidad) || 0;
    var totalOrig = Number(v.total) || 0;
    var precioEf = precioEfectivo(v);
    var precio = precioAGuardar(v);
    var n = Number(valor);

    if (!isFinite(n) || n <= 0) return { invalido: true, motivo: 'vacio' };

    if (modo === 'monto') {
      var pagado = r2(n);
      if (pagado > totalOrig) return { invalido: true, motivo: 'excede' };
      if (pagado >= totalOrig) return { completo: true };

      // Las unidades se aproximan: la columna cantidad es de enteros y no
      // admite media bolsa. El dinero manda y es exacto.
      var uds = precioEf > 0 ? Math.round(pagado / precioEf) : 0;
      if (uds < 0) uds = 0;
      // Queda dinero pendiente ⟹ tiene que quedar producto pendiente.
      if (uds >= cantTotal) uds = Math.max(0, cantTotal - 1);

      return {
        completo: false,
        udsPagadas: uds,
        montoPagado: pagado,
        udsSaldo: cantTotal - uds,
        montoSaldo: r2(totalOrig - pagado),
        aproximado: precioEf > 0 && Math.abs(pagado / precioEf - uds) > 0.001,
        precio: precio
      };
    }

    var u = Math.floor(n);
    if (u > cantTotal) return { invalido: true, motivo: 'excede' };
    if (u >= cantTotal) return { completo: true };

    var pag = r2(u * precioEf);
    if (pag > totalOrig) pag = totalOrig;   // por si acaso: nunca más que la deuda

    return {
      completo: false,
      udsPagadas: u,
      montoPagado: pag,
      udsSaldo: cantTotal - u,
      montoSaldo: r2(totalOrig - pag),
      aproximado: false,
      precio: precio
    };
  }

  /* ── CAMPOS PARA LA BASE DE DATOS ── */

  /* Cobro total: cantidad y total NO se tocan. */
  function camposCobroTotal(base) {
    var o = {};
    for (var k in base) if (base.hasOwnProperty(k)) o[k] = base[k];
    return o;
  }

  /* Cobro parcial, fila original → pasa a ser la parte cobrada. */
  function camposCobroParcial(rep, base) {
    var o = camposCobroTotal(base);
    o.cantidad = rep.udsPagadas;
    o.total = rep.montoPagado;
    if (rep.precio > 0) o.precio_unitario = rep.precio;
    return o;
  }

  /* Cobro parcial, fila nueva → el saldo que sigue pendiente.
     La fecha de vencimiento es la ORIGINAL: un cobro parcial no
     reinicia el plazo de los 15 días. */
  function filaSaldo(v, rep, extra) {
    var fila = {
      vendedor_id: v.vendedor_id,
      fecha: v.fecha,
      veterinaria: v.veterinaria,
      doctora: v.doctora || null,
      num_medico: v.num_medico || null,
      zona: v.zona || null,
      movimiento: 'Credito a 15 dias',
      producto: v.producto || '',
      cantidad: rep.udsSaldo,
      precio_unitario: rep.precio || 0,
      total: rep.montoSaldo,
      fecha_cobro: v.fecha_cobro || null,
      estado: '⏳ Pendiente',
      segmento_cliente: v.segmento_cliente || null
    };
    if (extra) for (var k in extra) if (extra.hasOwnProperty(k)) fila[k] = extra[k];
    return fila;
  }

  /* Nota del saldo. Una sola redacción — antes había tres. */
  function notaSaldo(v, rep, modo, fechaTxt) {
    var det = (modo === 'monto')
      ? 'cobro parcial de ' + money(rep.montoPagado) + ' de ' + money(v.total)
      : 'cobro parcial de ' + rep.udsPagadas + ' de ' + (v.cantidad || 0) + ' unidades';
    return 'Saldo tras ' + det + (fechaTxt ? ' el ' + fechaTxt : '') + '.';
  }

  function notaCobro(v, rep, modo, fechaTxt) {
    if (!rep || rep.completo) return 'Cobrado' + (fechaTxt ? ' el ' + fechaTxt : '') + '.';
    var det = (modo === 'monto')
      ? money(rep.montoPagado) + ' de ' + money(v.total)
      : rep.udsPagadas + ' de ' + (v.cantidad || 0) + ' unidades';
    return 'Cobro parcial: ' + det + (fechaTxt ? ' el ' + fechaTxt : '') + '.';
  }

  /* ── INTERFAZ ── */

  /* El par de botones productos/dinero. `onSet` es el nombre de una función
     global que recibe (modo) — o (id, modo) si se pasa `id`. */
  function modoHTML(onSet, id, modoActual) {
    var esMonto = (modoActual === 'monto');
    var arg = id ? ("'" + String(id).replace(/'/g, "\\'") + "',") : '';
    var sfx = id ? ('-' + id) : '';
    return '<div class="cp-modo" role="group" aria-label="Forma de pago">' +
      '<button type="button" class="cp-modo-btn' + (esMonto ? '' : ' is-on') + '"' +
        ' id="cp-modo-uds' + sfx + '" aria-pressed="' + (!esMonto) + '"' +
        ' onclick="' + onSet + '(' + arg + "'uds')\">En productos</button>" +
      '<button type="button" class="cp-modo-btn' + (esMonto ? ' is-on' : '') + '"' +
        ' id="cp-modo-monto' + sfx + '" aria-pressed="' + esMonto + '"' +
        ' onclick="' + onSet + '(' + arg + "'monto')\">En dinero</button>" +
    '</div>';
  }

  /* Marca el par de botones sin repintarlo. */
  function marcarModo(bUds, bMonto, modo) {
    var esMonto = (modo === 'monto');
    if (bUds) { bUds.classList.toggle('is-on', !esMonto); bUds.setAttribute('aria-pressed', String(!esMonto)); }
    if (bMonto) { bMonto.classList.toggle('is-on', esMonto); bMonto.setAttribute('aria-pressed', String(esMonto)); }
  }

  /* Texto del desglose. El vendedor tiene que poder confirmar sin hacer
     cuentas de cabeza: cuánto entra, cuánto queda y en cuántas unidades. */
  function resumenHTML(v, rep) {
    if (!rep || rep.invalido) return '';
    if (rep.completo) return 'Se salda el crédito completo. No queda nada pendiente.';
    var txt = 'Se registra <strong>' + money(rep.montoPagado) + '</strong> como cobrado' +
              ' y quedan <strong>' + money(rep.montoSaldo) + '</strong> pendientes' +
              ' (' + rep.udsSaldo + ' de ' + (v.cantidad || 0) + ' unidades).';
    if (rep.aproximado) {
      txt += '<span class="cp-nota">El monto no equivale a un número exacto de unidades. ' +
             'El dinero se guarda al céntimo; las unidades se reparten aproximando.</span>';
    }
    return txt;
  }

  /* Pinta el desglose en vivo dentro de `box` (un .cp-resumen con role=status). */
  function pintarResumen(box, v, modo, valor) {
    if (!box) return null;
    var rep = reparto(v, modo, valor);
    if (!v || rep.invalido) { box.hidden = true; box.innerHTML = ''; return rep; }
    box.hidden = false;
    box.className = rep.completo ? 'cp-resumen is-full' : 'cp-resumen';
    box.innerHTML = resumenHTML(v, rep);
    return rep;
  }

  /* Mensaje de error de un reparto inválido, para mostrarlo junto al campo. */
  function mensajeError(v, modo, rep) {
    if (!rep || !rep.invalido) return '';
    if (rep.motivo === 'excede') {
      return (modo === 'monto')
        ? 'El máximo es ' + money(v.total) + ', que es lo que queda pendiente.'
        : 'El máximo son ' + (v.cantidad || 0) + ' unidades, que es lo que queda pendiente.';
    }
    return (modo === 'monto')
      ? 'Escribe cuánto dinero pagaron.'
      : 'Escribe cuántas unidades pagaron.';
  }

  global.SVCobros = {
    r2: r2,
    precioEfectivo: precioEfectivo,
    precioAGuardar: precioAGuardar,
    reparto: reparto,
    camposCobroTotal: camposCobroTotal,
    camposCobroParcial: camposCobroParcial,
    filaSaldo: filaSaldo,
    notaSaldo: notaSaldo,
    notaCobro: notaCobro,
    modoHTML: modoHTML,
    marcarModo: marcarModo,
    resumenHTML: resumenHTML,
    pintarResumen: pintarResumen,
    mensajeError: mensajeError
  };

})(window);
